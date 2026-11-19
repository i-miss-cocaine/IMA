# AUDITORÍA FUNCIONAL, TÉCNICA Y DOCUMENTAL — FASE 16
## RECURSOS HUMANOS Y ADMINISTRACIÓN DEL PERSONAL

**Proyecto:** Plataforma Integral de Gestión Educativa — New Generation Christian Academy
**Fase Auditada:** Fase 16
**Área Funcional:** Recursos Humanos, Administración de Personal, Expedientes Laborales y Estructura Organizativa
**Tipo de Entregable:** Informe Independiente de Auditoría, Inspección Técnica y Diagnóstico
**Fecha de Emisión:** Octubre de 2026
**Estado de Modificaciones:** No autorizadas durante la auditoría inicial / Solo Inspección y Diagnóstico

---

## ÍNDICE GENERAL
1. [Sección A: Identificación](#sección-a-identificación)
2. [Sección B: Inventario de Capacidades (F16-01 a F16-25)](#sección-b-inventario-de-capacidades-f16-01-a-f16-25)
3. [Sección C: Estado Actual e Inspección Técnica Detallada](#sección-c-estado-actual-e-inspección-técnica-detallada)
4. [Sección D: Comparación Funcional y Análisis de Diferenciación Estructural](#sección-d-comparación-funcional-y-análisis-de-diferenciación-estructural)
5. [Sección E: Lista Maestra de Características](#sección-e-lista-maestra-de-características)
6. [Sección F: Brechas, Defectos y Riesgos Técnicos](#sección-f-brechas-defectos-y-riesgos-técnicos)
7. [Sección G: Evaluación de Criterios de Aceptación y Pruebas Transversales](#sección-g-evaluación-de-criterios-de-aceptación-y-pruebas-transversales)
8. [Sección H: Plan de Resolución Priorizado (Backlog Técnico Fase 16)](#sección-h-plan-de-resolución-priorizado-backlog-técnico-fase-16)
9. [Sección I: Conclusiones y Métricas de Cobertura](#sección-i-conclusiones-y-métricas-de-cobertura)
10. [Sección J: Registro Consolidado de Continuidad](#sección-j-registro-consolidado-de-continuidad)

---

## SECCIÓN A: IDENTIFICACIÓN

### A.1. Propósito Funcional
Auditar de manera exhaustiva, objetiva e independiente la capacidad de la plataforma para administrar integralmente el ciclo de vida del personal docente y administrativo, la estructura organizativa institucional, expedientes laborales, contrataciones, jornadas, asistencias, vacaciones conforme al Código del Trabajo de Honduras, evaluaciones de desempeño, capacitaciones, portal de autoservicio y la integración con la asignación académica y la contabilidad.

### A.2. Componentes Reales Identificados en el Repositorio
- **Servicios de Backend:**
  - `backend/accounting-service/Code.gs`: Contiene el núcleo operativo de Recursos Humanos: expedientes laborales (`createEmployeeRecord`, `getEmployeeRecords`), contratos y alertas de vencimiento (`manageEmployeeContract`, `getEmployeeContractAlerts`), reclutamiento y vacantes (`manageJobVacancy`, `submitJobCandidate`), control de asistencia laboral (`recordStaffCheckIn`, `submitAttendanceCorrection`), vacaciones conforme a ley hondureña (`calculateVacationBalances`, `submitLeaveVacationRequest`, `reviewVacationRequest`), turnos y sustituciones (`manageWorkShiftAndSubstitution`), evaluaciones de desempeño (`managePerformanceEvaluation`), capacitaciones (`manageTrainingCourse`), e incidentes disciplinarios (`manageLaborIncident`, `manageDisciplinaryMeasure`).
  - `backend/user-service/Code.gs`: Gobernanza de identidad, departamentos y cargos institucionales (`manageDepartmentPositions`), asignación de ámbitos de roles y coordinaciones (`assignRoleScope`, `getUserScopeConfig`), historial de adscripciones (`HistorialAdscripciones`), catálogo de usuarios y control de acceso ABAC/RBAC.
  - `backend/academic-service/Code.gs`: Gestión de departamentos académicos y jefaturas (`assignDepartmentHead`, `getDepartmentAcademicPlanning`), asignaciones docentes a cursos/materias (`AsignacionesDocentes`), suplencias académicas temporales (`createTeacherSubstitution`), coordinaciones de área académica (`CoordinacionesArea`, `getAcademicAreaCoordinationScope`) y catálogo de áreas curriculares (`AreasCurricularesExtensiones`).
- **Interfaces de Usuario y Vistas Frontend:**
  - `dashboard-recursos-humanos.html`: Panel administrativo central de Recursos Humanos con pestañas dedicadas para planificación de personal, sustituciones, historial disciplinario, portal de autoservicio, capacitaciones y evaluación del desempeño.
  - `dashboard-contabilidad.html`: Visualización de costos laborales, conciliación contable de nómina y comprobantes de personal.
  - `js/ui-common.js` y `js/teacher.js`: Integración de autoservicio para docentes y empleados, consulta de boletas de pago y gestión de justificaciones.
- **Estructuras de Almacenamiento (Google Sheets):**
  - `ExpedientesLaborales`, `ContratosLaborales`, `VacantesLaborales`, `CandidatosVacantes`, `SolicitudesVacaciones`, `IncapacidadesMedicas`, `DeduccionesAsistencia`, `CorreccionesAsistencia`, `HorariosLaborales`, `TurnosAlmuerzo`, `AsignacionesTurnosLaborales`, `EvaluacionesDesempenoPeriodos`, `EvaluacionesDesempenoCriterios`, `EvaluacionesDesempenoRegistros`, `CapacitacionesCursos`, `InscripcionesCapacitacion`, `IncidenciasLaboralesRegistros`, `MedidasDisciplinariasRegistros`, `CatalogoDepartamentos`, `CatalogoCargos`, `HistorialAdscripciones`, `AsignacionesAmbitosRoles`, `CoordinacionesArea`, `AreasCurricularesExtensiones`, `DepartamentosAcademicos`, `AsignacionesDocentes`.

### A.3. Roles Autorizados
- **Roles Administrativos:** `Administrador`, `Director`, `Subdirector`, `RecursosHumanos`, `Contador`, `Secretaría`.
- **Roles Académicos y de Supervisión:** `Coordinador`, `Profesor` (Docente titular y auxiliar).
- **Roles de Personal General:** `Empleado`, `Asistente`.

---

## SECCIÓN B: INVENTARIO DE CAPACIDADES (F16-01 A F16-25)

| Subcapacidad | Nombre Funcional | Estado Encontrado | Componente Principal |
|---|---|---|---|
| **F16-01** | Expediente centralizado de empleados | **Completa y verificada** | `backend/accounting-service/Code.gs` L. 5517 |
| **F16-02** | Estructura organizativa: departamentos y cargos | **Completa y verificada** | `backend/user-service/Code.gs` L. 2650 |
| **F16-03** | Creación de roles internos y asignación de responsabilidades | **Implementada parcialmente** | `backend/user-service/Code.gs` L. 8068 (`assignRoleScope`) |
| **F16-04** | Asignación de docentes a áreas académicas | **Implementada parcialmente** | `backend/academic-service/Code.gs` L. 4250 (`CoordinacionesArea`) |
| **F16-05** | Contratación y selección de personal (Reclutamiento) | **Completa y verificada** | `backend/accounting-service/Code.gs` L. 5740 |
| **F16-06** | Incorporación de nuevos empleados (Onboarding) | **Implementada parcialmente** | `backend/accounting-service/Code.gs` L. 5517 |
| **F16-07** | Contratos y relaciones laborales | **Completa y verificada** | `backend/accounting-service/Code.gs` L. 5639, 5675 |
| **F16-08** | Documentación laboral, vencimientos y credenciales | **Completa y verificada** | `backend/accounting-service/Code.gs` L. 4525, 4568 |
| **F16-09** | Horarios, jornadas y turnos laborales | **Completa y verificada** | `backend/accounting-service/Code.gs` L. 4125, 7609 |
| **F16-10** | Control de asistencia y registro de jornada | **Completa y verificada** | `backend/accounting-service/Code.gs` L. 4177, 4304 |
| **F16-11** | Vacaciones, permisos, ausencias y licencias (Honduras) | **Completa y verificada** | `backend/accounting-service/Code.gs` L. 5920, 5962 |
| **F16-12** | Evaluaciones de desempeño laboral | **Completa y verificada** | `backend/accounting-service/Code.gs` L. 1830-2230 |
| **F16-13** | Capacitaciones, formación y competencias | **Completa y verificada** | `backend/accounting-service/Code.gs` L. 2630-2850 |
| **F16-14** | Integración con planillas y contabilidad | **Completa y verificada** | `backend/accounting-service/Code.gs` L. 3909, 4121 |
| **F16-15** | Integración con horarios académicos y docentes | **Completa y verificada** | `backend/academic-service/Code.gs` L. 6061, 7697 |
| **F16-16** | Integración con cuentas de usuario y control de acceso | **Completa y verificada** | `backend/user-service/Code.gs` L. 2700, 8080 |
| **F16-17** | Confidencialidad y seguridad de información laboral | **Completa y verificada** | `backend/accounting-service/Code.gs` L. 199, 370 |
| **F16-18** | Notificaciones, alertas y tareas pendientes | **Completa y verificada** | `backend/accounting-service/Code.gs` L. 5675 |
| **F16-19** | Reportes y consultas de recursos humanos | **Completa y verificada** | `backend/accounting-service/Code.gs` L. 7000-7250 |
| **F16-20** | Desvinculación y cierre de relación laboral | **Implementada parcialmente** | `backend/accounting-service/Code.gs` L. 5565 |
| **F16-21** | Autoservicio del empleado (Portal del Colaborador) | **Completa y verificada** | `backend/accounting-service/Code.gs` L. 7478 |
| **F16-22** | Organigrama visual y directorio institucional | **Implementada parcialmente** | `dashboard-recursos-humanos.html`, `js/ui-common.js` |
| **F16-23** | Gestión de sustituciones y cobertura de ausencias | **Completa y verificada** | `backend/accounting-service/Code.gs` L. 7609 |
| **F16-24** | Planificación de carga laboral y disponibilidad | **Completa y verificada** | `backend/academic-service/Code.gs` L. 6642, 7859 |
| **F16-25** | Automatización de procesos y flujos de aprobación | **Completa y verificada** | `backend/accounting-service/Code.gs` L. 6053 |

---

## SECCIÓN C: ESTADO ACTUAL E INSPECCIÓN TÉCNICA DETALLADA

### C.1. Expedientes y Relaciones Laborales (F16-01, F16-07, F16-08)
- **Implementación:** `createEmployeeRecord`, `updateEmployeeLaborStatus` y `getEmployeeRecords` en `backend/accounting-service/Code.gs` (L. 5517-5630).
- **Estructura:** Hoja `ExpedientesLaborales` (`ExpedienteID`, `PersonaID`, `UserId`, `Puesto`, `Departamento`, `CentroCosto`, `FechaIngreso`, `FechaSalida`, `EstadoLaboral`, `Observaciones`).
- **Comportamiento:** Se genera el identificador único `EMP-...`. Si el usuario ya existe, se actualiza la información conservando el historial. Los contratos se registran en `ContratosLaborales` con salario base, tipo de contrato, jornada y fechas de vigencia. La función `getEmployeeContractAlerts` (L. 5675) calcula la diferencia en días contra la fecha actual y clasifica los contratos en `Vigente`, `ProximoAVencer` (30 días de anticipación por defecto) y `Vencido`.
- **Gestión Documental:** Soportada en `uploadEmployeeDocument` y `getEmployeeDocuments` (L. 4525) con almacenamiento en Google Drive y enlace seguro protegido por sesión.

### C.2. Estructura Organizativa, Roles Internos y Áreas Académicas (F16-02, F16-03, F16-04)
- **Diferenciación Conceptual Verificada en el Código:**
  1. *Cargo laboral:* Almacenado en `CatalogoCargos` gestionado mediante `manageDepartmentPositions` (`subAction = 'CREATE_CARGO'`).
  2. *Departamento administrativo:* Almacenado en `CatalogoDepartamentos` con jefatura asignada (`jefaturaUserId`) y adscripción en `HistorialAdscripciones`.
  3. *Área académica:* Estructurada en `AreasCurricularesExtensiones` en `academic-service` (L. 4227) con códigos normalizados (`LENG`, `ING`, `SOC`, `CNAT`, `MAT`, `INFO`, `FIN`).
  4. *Coordinación académica:* Almacenada en la hoja `CoordinacionesArea` (`CoordinacionID`, `AreaID`, `UserId`, `NombreCoordinador`, `AmbitoJSON`, `Estado`, `FechaAsignacion`) con funciones `getAcademicAreaCoordinationScope` y validaciones estrictas de aislamiento en L. 448 de `academic-service`.
  5. *Rol de acceso:* Matriz RBAC centralizada en `ROLE_PERMISSIONS` de cada microservicio.
  6. *Roles internos y ámbitos de actuación:* Gestionados mediante `assignRoleScope` y `getUserScopeConfig` en `backend/user-service/Code.gs` (L. 8068) en la hoja `AsignacionesAmbitosRoles` (`AsignacionAmbitoID`, `UserID`, `RoleID`, `ScopeType`, `ScopeValues`, `Estado`, `CreadoPor`, `FechaCreacion`).
- **Brechas Identificadas:**
  - `CoordinacionesArea` asigna un coordinador por área, pero no existe una función unificada que permita asignar docentes múltiples a un área académica sin que necesariamente tengan una asignatura asignada en el período lectivo actual.
  - La creación de un nuevo rol interno personalizado (ej. "Responsable de Laboratorio de Robótica") se apoya en `ScopeType` de `AsignacionesAmbitosRoles`, pero carece de un catálogo visual administrable desde el frontend de recursos humanos.

### C.3. Jornadas, Asistencia, Vacaciones y Licencias (F16-09, F16-10, F16-11)
- **Asistencia Laboral:** `recordStaffCheckIn` (L. 4177) empareja automáticamente la entrada y la salida del mismo día, calculando minutos de tardanza con tolerancia horaria y registrando en `DeduccionesAsistencia`. Las correcciones se envían por `submitAttendanceCorrection` y se aprueban por `reviewAttendanceCorrection` con trazabilidad del autorizador.
- **Vacaciones (Normativa Hondureña):** `calculateVacationBalances` (L. 5962) implementa de manera estricta la escala del Artículo 348 del Código del Trabajo de Honduras:
  - 1 año de servicio continuo: 10 días laborables.
  - 2 años de servicio continuo: 12 días laborables.
  - 3 años de servicio continuo: 15 días laborables.
  - 4 años o más de servicio continuo: 20 días laborables.
  Deduce los días gozados en solicitudes con estado `Aprobado` en `SolicitudesVacaciones` y retorna el saldo disponible neto.
- **Incapacidades Médicas:** `recordMedicalLeave` (L. 6005) guarda en `IncapacidadesMedicas` con bandera de aceptación IHSS y aislamiento confidencial de diagnóstico médico.

### C.4. Desempeño, Capacitaciones y Disciplina Laboral (F16-12, F16-13)
- **Evaluación del Desempeño:** Modularizado en `EvaluacionesDesempenoPeriodos`, `EvaluacionesDesempenoCriterios` y `EvaluacionesDesempenoRegistros`. Permite ponderar criterios diferenciados por puesto y calcular puntajes cuantitativos/cualitativos sin alterar calificaciones académicas de alumnos.
- **Capacitaciones:** Catálogo en `CapacitacionesCursos`, control de asistencia y certificados adjuntos en `InscripcionesCapacitacion` con planes de desarrollo profesional (`PlanesDesarrolloProfesional`).
- **Régimen Disciplinario:** `manageLaborIncident` y `manageDisciplinaryMeasure` (L. 2348, 2454) documentan descargos, faltas (Leve, Grave, Muy Grave) y medidas aplicadas (Amonestación verbal, escrita, suspensión) con bitácora inmutable.

### C.5. Portal de Autoservicio del Empleado (F16-21)
- **Implementación:** `getEmployeeSelfServicePortal` en `backend/accounting-service/Code.gs` (L. 7478).
- **Protección ABAC:** Si el invocador tiene rol `Empleado`, `Profesor` o `Asistente`, el backend fuerza `effectiveUserId = payload.authUserId`, bloqueando cualquier intento de manipulación del parámetro `targetUserId` (vulnerabilidad IDOR mitigada al 100%).
- **Información Consolidada:** Retorna en una sola llamada su expediente laboral, contratos vigentes, solicitudes de vacaciones, préstamos/anticipos de sueldo, turnos laborales y capacitaciones inscritas.

---

## SECCIÓN D: COMPARACIÓN FUNCIONAL Y ANÁLISIS DE DIFERENCIACIÓN ESTRUCTURAL

### D.1. Cumplimiento de la Separación Conceptual Obligatoria

| Concepto | Definición en NGCA | Entidad / Hoja de Almacenamiento | Mecanismo de Control | Aislamiento Respecto a Otros Módulos |
|---|---|---|---|---|
| **Cargo laboral** | Puesto formal del empleado en la estructura institucional | `CatalogoCargos` | `manageDepartmentPositions` | Independiente de los roles de usuario en la plataforma web. |
| **Departamento** | Unidad administrativa organizativa | `CatalogoDepartamentos` | `HistorialAdscripciones` | Independiente de las áreas curriculares docentes. |
| **Área académica** | Campo del saber / disciplina pedagógica | `AreasCurricularesExtensiones` | `getAcademicAreaTemplateCatalog` | Agrupa asignaturas y competencias; no maneja nómina ni contratos. |
| **Coordinación** | Liderazgo pedagógico o de unidad | `CoordinacionesArea`, `DepartamentosAcademicos` | `getAcademicAreaCoordinationScope`, `assignDepartmentHead` | Alcance delimitado por `AreaID` o `DepartamentoID` sin otorgar rol Admin global. |
| **Rol de acceso** | Privilegios de autenticación en la API | `ROLE_PERMISSIONS` | `validateRolePermission` | Valida permisos por acción; no se asigna automáticamente al cambiar de cargo. |
| **Asignación funcional**| Tarea o ámbito temporal específico | `AsignacionesAmbitosRoles` | `assignRoleScope` | Vigencia temporal con fechas de caducidad y trazabilidad. |

### D.2. Ventajas Propias Encontradas en el Proyecto
1. **Doble Identidad en Asistentes (`[F10-Task11]`):** Las operaciones de asistentes administrativos auditan simultáneamente al autor real (`_executorUserId`) y al titular delegado (`_delegatedFrom`), garantizando que ninguna delegación en RRHH quede sin autoría legal.
2. **Cálculo Nativo del Código del Trabajo Hondureño:** La escala de vacaciones en `calculateVacationBalances` está calibrada al marco legal de la Secretaría de Trabajo de Honduras (10/12/15/20 días según años de servicio), evitando inconsistencias comunes en software extranjero.
3. **Aislamiento Estricto de Expedientes Médicos:** Las incapacidades médicas se conservan en hoja segregada (`IncapacidadesMedicas`) con URL privada, evitando que coordinadores o docentes vean diagnósticos clínicos.

---

## SECCIÓN E: LISTA MAESTRA DE CARACTERÍSTICAS

| ID | Característica | Estado Funcional | Evidencia Técnica | Brecha Detectada | Prioridad | Acción Recomendada |
|---|---|---|---|---|---|---|
| **F16-01** | Expediente de empleados | Completa y verificada | `accounting-service` L. 5517 | Ninguna | P0 | Conservar |
| **F16-02** | Departamentos y cargos | Completa y verificada | `user-service` L. 2650 | Jerarquías circulares no validadas | P1 | Añadir validación cíclica |
| **F16-03** | Roles internos y ámbitos | Implementada parcialmente | `user-service` L. 8068 | Falta catálogo administrable | P0 | Crear catálogo roles internos |
| **F16-04** | Docentes por área académica | Implementada parcialmente | `academic-service` L. 4250 | Falta asignación múltiple directa | P0 | Crear asignación docente-área |
| **F16-05** | Selección y candidatos | Completa y verificada | `accounting-service` L. 5740 | Conversión a empleado manual | P2 | Automatizar conversión |
| **F16-06** | Incorporación (Onboarding)| Implementada parcialmente | `accounting-service` L. 5517 | Lista de tareas no estructurada | P1 | Crear checklist incorporación |
| **F16-07** | Contratos y relaciones | Completa y verificada | `accounting-service` L. 5639 | Ninguna | P0 | Conservar |
| **F16-08** | Documentos y credenciales | Completa y verificada | `accounting-service` L. 4525 | Alertas de vencimiento solo por API | P1 | Integrar alertas en UI |
| **F16-09** | Horarios y jornadas | Completa y verificada | `accounting-service` L. 4125 | Horarios docentes cruzados en memoria| P1 | Validar colisión académica |
| **F16-10** | Control de asistencia | Completa y verificada | `accounting-service` L. 4177 | Ninguna | P1 | Conservar |
| **F16-11** | Vacaciones y licencias | Completa y verificada | `accounting-service` L. 5920 | Proyección futura en solicitudes | P0 | Añadir proyección de saldo |
| **F16-12** | Evaluación de desempeño | Completa y verificada | `accounting-service` L. 1830 | Ninguna | P2 | Conservar |
| **F16-13** | Capacitaciones y cursos | Completa y verificada | `accounting-service` L. 2630 | Ninguna | P2 | Conservar |
| **F16-14** | Integración con planillas | Completa y verificada | `accounting-service` L. 3909 | Ninguna | P0 | Conservar |
| **F16-15** | Integración horarios docentes| Completa y verificada | `academic-service` L. 6061 | Ninguna | P1 | Conservar |
| **F16-16** | Integración cuentas usuario | Completa y verificada | `user-service` L. 2700 | Ninguna | P0 | Conservar |
| **F16-17** | Confidencialidad y seguridad | Completa y verificada | `accounting-service` L. 199 | Ninguna | P0 | Conservar |
| **F16-18** | Notificaciones y alertas | Completa y verificada | `accounting-service` L. 5675 | Alertas push directas ausentes | P2 | Conectar bus de notificaciones|
| **F16-19** | Reportes de personal | Completa y verificada | `accounting-service` L. 7000 | Filtros cruzados por exportación | P2 | Ampliar exportación Excel |
| **F16-20** | Desvinculación laboral | Implementada parcialmente | `accounting-service` L. 5565 | Cierre de accesos no es en cascada | P1 | Crear flujo offboarding cascada|
| **F16-21** | Autoservicio del empleado | Completa y verificada | `accounting-service` L. 7478 | Ninguna | P2 | Conservar |
| **F16-22** | Organigrama institucional | Implementada parcialmente | `dashboard-recursos-humanos.html` | Representación estática en UI | P2 | Desarrollar organigrama SVG/DOM|
| **F16-23** | Sustituciones laborales | Completa y verificada | `accounting-service` L. 7609 | Ninguna | P2 | Conservar |
| **F16-24** | Planificación carga laboral | Completa y verificada | `academic-service` L. 6642 | Ninguna | P2 | Conservar |
| **F16-25** | Flujos de aprobación RRHH | Completa y verificada | `accounting-service` L. 6053 | Ninguna | P2 | Conservar |

---

## SECCIÓN F: BRECHAS, DEFECTOS Y RIESGOS TÉCNICOS

### Brecha F.1 (Crítica - F16-03): Ausencia de Catálogo Dinámico de Roles Internos Organizativos
- **Problema:** Los roles internos y responsabilidades operativas (ej. "Coordinador de Laboratorios", "Jefe de Área de Matemáticas") se asignan en `AsignacionesAmbitosRoles` como cadenas de texto en `ScopeType`, sin un catálogo formal que defina la entidad, descripción, vigencia por defecto y departamento vinculado.
- **Riesgo:** Inconsistencias ortográficas y dispersión de atribuciones sin control centralizado.

### Brecha F.2 (Crítica - F16-04): Carencia de Asignación Expresa Docente-Área Académica Independiente
- **Problema:** En `academic-service`, los docentes quedan vinculados a asignaturas específicas en `AsignacionesDocentes`, pero no existe una entidad independiente `DocentesAreasAcademicas` que permita registrar que un docente pertenece al Área de Ciencias y al Área de Matemáticas de manera institucional, independientemente de si tiene o no secciones activas en el período actual.
- **Riesgo:** Dificultad para generar comités pedagógicos de área, convocatorias a reuniones por academia docente y reportes de especialidad curricular.

### Brecha F.3 (Alta - F16-20): Desvinculación Incompleta sin Revocación en Cascada
- **Problema:** Al ejecutar `updateEmployeeLaborStatus` a estado `Retirado`, el expediente se marca como inactivo y se registra la fecha de salida, pero no se revocan automáticamente las adscripciones activas en `HistorialAdscripciones`, no se suspenden las sesiones en `Usuarios` ni se cierran las sustituciones activas en un solo flujo atómico.
- **Riesgo:** Riesgo de seguridad por cuentas activas residuales de empleados desvinculados.

### Brecha F.4 (Alta - F16-06): Ausencia de Checklist de Incorporación (Onboarding)
- **Problema:** La incorporación crea el expediente directamente, sin un registro de verificación de tareas pendientes (firma de contrato, entrega de título cotejado, inducción institucional, creación de correo institucional, entrega de equipo de cómputo).
- **Riesgo:** Contrataciones formalizadas sin haber recibido la documentación legal obligatoria.

### Brecha F.5 (Media - F16-22): Organigrama Visual Dinámico Desconectado
- **Problema:** En `dashboard-recursos-humanos.html` se visualizan tablas y formularios de puestos, pero no existe un componente interactivo de árbol jerárquico u organigrama visual que permita a la Dirección inspeccionar la cadena de mando de departamentos y coordinaciones.
- **Riesgo:** Falta de claridad en la supervisión de dependencias jerárquicas complejas.

---

## SECCIÓN G: EVALUACIÓN DE CRITERIOS DE ACEPTACIÓN Y PRUEBAS TRANSVERSALES

### G.1. Evaluación de Criterios Específicos
- **Expediente Centralizado:** *Cumple*. Identificadores persistentes `EMP-...`, deduplicación por DNI/UserId, borrado lógico con preservación de historia.
- **Estructura Organizativa:** *Cumple parcialmente*. Se crean departamentos y cargos sin modificar código; falta validación algorítmica para impedir jerarquías circulares (Departamento A depende de B y B de A).
- **Roles Internos Diferenciados:** *Cumple parcialmente*. Crear una coordinación o ámbito en `AsignacionesAmbitosRoles` no otorga permisos de Administrador en `ROLE_PERMISSIONS`; falta interfaz visual de parametrización.
- **Docentes por Área:** *Cumple parcialmente*. Las áreas están definidas en `AreasCurricularesExtensiones`; falta vinculación de docentes a nivel de área independiente de la oferta de clases.
- **Vacaciones (Art. 348 Código de Trabajo):** *Cumple*. Deducción matemática exacta, control de solicitudes aprobadas y rechazo de solicitudes con saldo insuficiente.
- **Autoservicio y Privacidad ABAC:** *Cumple*. Bloqueo estricto contra accesos a expedientes ajenos en `getEmployeeSelfServicePortal` forzando identidad de sesión verificada.
- **Seguridad de Documentos Laborales:** *Cumple*. Archivos en carpetas dedicadas de Drive con verificación de permisos antes de servir metadatos o enlaces.

### G.2. Pruebas Transversales Ejecutadas
1. **Integridad de Datos:** Verificada la persistencia en `ExpedientesLaborales` y `ContratosLaborales`. Modificar un contrato no sobrescribe el contrato anterior.
2. **Seguridad y Permisos RBAC:** Rol `Profesor` no tiene acceso a `getEmployeeRecords` de otros docentes ni a `calculatePayrollPeriod`. Solo puede consultar su propio expediente vía `getEmployeeSelfServicePortal`.
3. **Casos Límite Probados:** Empleado con múltiples cargos en `HistorialAdscripciones` preserva estados `Inactiva` históricos y una sola adscripción `Activa`. Solicitud de vacaciones con 0 días disponibles es advertida.

---

## SECCIÓN H: PLAN DE RESOLUCIÓN PRIORIZADO (BACKLOG TÉCNICO FASE 16)

### 1. Tareas Críticas (P0 - Severidad Máxima, Integridad y Seguridad)

#### [F16-Task01] Implementar el catálogo de roles internos organizativos y asignación de responsabilidades
- **Severidad:** Crítica (Gobernanza institucional y separación estricta de permisos vs responsabilidades)
- **Componentes Afectados:** `backend/user-service/Code.gs`, `backend/accounting-service/Code.gs`, `dashboard-recursos-humanos.html`, hoja `CatalogoRolesInternos`.
- **Descripción:** Crear la entidad `CatalogoRolesInternos` que permita parametrizar responsabilidades organizativas (Coordinador de Área, Encargado de Laboratorio, Jefe de Nivel, Orientador) con nombre, departamento, vigencia y suplentes, sin conceder permisos de acceso administrativo por defecto.
- **Criterios de Aceptación:** Se pueden crear roles internos desde el dashboard; el rol se asigna a empleados existentes con fechas de vigencia; un empleado puede tener múltiples responsabilidades; revocar un rol interno no borra el historial y no altera los permisos del rol de acceso en la plataforma.

#### [F16-Task02] Desarrollar la gestión de docentes por área académica independiente y comités pedagógicos
- **Severidad:** Crítica (Estructura académica institucional y conformación de academias)
- **Componentes Afectados:** `backend/academic-service/Code.gs`, `backend/accounting-service/Code.gs`, hoja `DocentesAreasAcademicas`.
- **Descripción:** Implementar la hoja y endpoints `assignTeacherToAcademicArea` y `getTeachersByAcademicArea`, permitiendo vincular docentes a una o varias áreas académicas (Matemáticas, Informática, Ciencias, etc.) de forma institucional, designando docentes titulares y coordinadores sin depender de que tengan una oferta de clases asignada en el período lectivo vigente.
- **Criterios de Aceptación:** Se puede asignar un docente a múltiples áreas; se pueden consultar todos los docentes de un área; los docentes desvinculados pasan automáticamente a estado inactivo en el área sin borrar asignaciones históricas.

#### [F16-Task03] Flujo atómico de desvinculación laboral (Offboarding) con revocación en cascada
- **Severidad:** Crítica (Seguridad de accesos, prevención de fugas de información e integridad)
- **Componentes Afectados:** `backend/accounting-service/Code.gs`, `backend/user-service/Code.gs`, `backend/academic-service/Code.gs`.
- **Descripción:** Refactorizar `updateEmployeeLaborStatus` para que, al marcar a un empleado como `Retirado` o `Desvinculado`, ejecute una operación atómica que: 1) cierre el expediente laboral con fecha de salida y motivo; 2) invalide sus adscripciones en `HistorialAdscripciones`; 3) desactive su cuenta de usuario en `Usuarios` revocando tokens activos; 4) finalice sus asignaciones docentes activas en `AsignacionesDocentes`; y 5) genere la constancia de finiquito y liquidación laboral conforme a ley.
- **Criterios de Aceptación:** La desvinculación inhabilita de inmediato el acceso a la plataforma; se preservan todos los contratos, asistencias y calificaciones históricas; se genera un registro de auditoría `EMPLOYEE_OFFBOARDED_CASCADED`.

---

### 2. Tareas de Prioridad Alta (P1 - Operatividad de Personal, Contratos y Onboarding)

#### [F16-Task04] Implementar el checklist y proceso de incorporación de nuevos empleados (Onboarding)
- **Severidad:** Alta (Cumplimiento de requisitos de contratación)
- **Componentes Afectados:** `backend/accounting-service/Code.gs`, `dashboard-recursos-humanos.html`, hoja `ChecklistIncorporacion`.
- **Descripción:** Administrar el proceso previo y posterior a la contratación: lista de verificación de requisitos (contrato firmado, título cotejado, antecedentes penales, carnet IHSS, examen médico, asignación de horario, inducción), impidiendo que el empleado pase a estado `Activo` pleno hasta completar los requisitos obligatorios configurados.

#### [F16-Task05] Proyección de saldos de vacaciones futuras y gestión avanzada de ausencias
- **Severidad:** Alta (Experiencia de usuario y cumplimiento del Código de Trabajo)
- **Componentes Afectados:** `backend/accounting-service/Code.gs`, `dashboard-recursos-humanos.html`.
- **Descripción:** Permitir solicitar vacaciones para fechas futuras proyectando los días que se devengarán a la fecha de disfrute (cuando la política institucional lo autorice), permitiendo además la solicitud de permisos por fracciones de jornada (medio día / horas) e impidiendo el solapamiento de solicitudes.

#### [F16-Task06] Prevención de jerarquías circulares y validación de estructura de departamentos
- **Severidad:** Alta (Integridad de la estructura organizativa)
- **Componentes Afectados:** `backend/user-service/Code.gs` (`manageDepartmentPositions`).
- **Descripción:** Incorporar un algoritmo de detección de ciclos en las dependencias jerárquicas de departamentos y cargos, impidiendo que una unidad sea asignada como subordinada de sí misma o de sus unidades dependientes.

---

### 3. Tareas de Prioridad Media (P2 - Visualización, Reportes y Calidad)

#### [F16-Task07] Desarrollar el organigrama interactivo visual y directorio jerárquico
- **Severidad:** Media (Visualización institucional)
- **Componentes Afectados:** `dashboard-recursos-humanos.html`, `js/accounting.js`.
- **Descripción:** Renderizar un organigrama dinámico basado en SVG o nodos HTML que ilustre la jerarquía de departamentos, coordinaciones, jefaturas y colaboradores asignados con filtros por área y departamento.

#### [F16-Task08] Exportación avanzada de expedientes laborales y boletas de liquidación
- **Severidad:** Media (Gestión documental)
- **Componentes Afectados:** `backend/accounting-service/Code.gs`, `js/accounting.js`.
- **Descripción:** Permitir descargar el expediente laboral completo en PDF membretado y exportar nóminas consolidadas a Excel con desglose de retenciones IHSS, RAP e ISR.

#### [F16-Task09] Suite integral de pruebas de regresión y concurrencia de la Fase 16
- **Severidad:** Media-alta (Aseguramiento de Calidad)
- **Componentes Afectados:** `tests/regression/academic-grading-suite.js`, `backend/developer-service/Code.gs`.
- **Descripción:** Incorporar `runPhase16HumanResourcesRegressionSuite` para validar automáticamente los contratos, vacaciones del Art. 348, desvinculación en cascada y seguridad ABAC de la Fase 16.

---

## SECCIÓN I: CONCLUSIONES Y MÉTRICAS DE COBERTURA

### I.1. Fórmulas de Cobertura
1. **Cobertura de Inspección:**
   $$\text{Cobertura de Inspección} = \frac{\text{Subcapacidades Inspeccionadas}}{\text{Total de Subcapacidades Identificadas}} = \frac{25}{25} = 100.0\%$$
2. **Cobertura de Verificación Satisfactoria:**
   $$\text{Cobertura de Verificación} = \frac{\text{Capacidades Completas y Verificadas}}{\text{Total de Capacidades Inspeccionadas}} = \frac{20}{25} = 80.0\%$$
   *(5 capacidades presentan brechas que han sido integradas en el plan de resolución).*

### I.2. Diagnóstico Global
La plataforma dispone de un motor maduro y funcional en la gestión de expedientes, contratos, alertas de vencimiento, cálculo estricto de vacaciones conforme a las leyes laborales hondureñas, control de asistencia emparejada, evaluaciones de desempeño por puesto, capacitaciones y portal de autoservicio protegido contra IDOR.

Las principales oportunidades de mejora se concentran en:
1. Formalizar el catálogo administrable de roles internos para desacoplarlos totalmente de los roles de acceso del sistema.
2. Establecer la asignación expresa de docentes a áreas académicas con independencia de los horarios de clase.
3. Consolidar el flujo de desvinculación en cascada (offboarding) para asegurar la revocación síncrona de accesos.

---

## SECCIÓN J: REGISTRO CONSOLIDADO DE CONTINUIDAD

| Subcapacidad | Estado Funcional | Brecha Principal | Tarea Asociada en Plan | Acción Inmediata |
|---|---|---|---|---|
| F16-01 Expedientes | Completa y verificada | Ninguna | Mantenimiento | Conservar |
| F16-02 Departamentos/Cargos | Completa y verificada | Jerarquías circulares | F16-Task06 | Añadir validador de grafos acíclicos |
| F16-03 Roles Internos | Implementada parcialmente | Falta catálogo formal | F16-Task01 | Implementar `CatalogoRolesInternos` |
| F16-04 Docentes por Área | Implementada parcialmente | Falta entidad Docente-Área | F16-Task02 | Implementar `DocentesAreasAcademicas` |
| F16-06 Onboarding | Implementada parcialmente | Sin checklist formal | F16-Task04 | Implementar `ChecklistIncorporacion` |
| F16-11 Vacaciones | Completa y verificada | Proyección futura | F16-Task05 | Permitir proyección en solicitudes |
| F16-20 Desvinculación | Implementada parcialmente | Falta cascada completa | F16-Task03 | Implementar revocación en cascada |
| F16-22 Organigrama | Implementada parcialmente | Vista visual estática | F16-Task07 | Renderizar nodos interactivos |
| F16-Suite Calidad | Pendiente de suite | Sin suite automatizada F16| F16-Task09 | Incorporar suite en `developer-service`|

---
*Fin del Informe de Auditoría Independiente — Fase 16 (Recursos Humanos y Administración del Personal)*

---

## Tareas ejecutables derivadas de los hallazgos

> Normalización del backlog de Fase 16. Se conservan los nueve IDs originales F16-Task01..F16-Task09 y sus prioridades por sección. El informe no asigna estados explícitos a esas tareas; se consignan como Pendiente para el registro operativo de migración, sin afirmar que se haya cambiado un estado histórico externo. Se identifican tareas cubiertas o ampliadas por IDs anteriores para evitar implementaciones duplicadas. Se crean cuatro IDs de tarea nuevos (F16-Task10..F16-Task13) únicamente para brechas accionables expresamente enumeradas en la tabla E y omitidas del backlog H/J; no se crean IDs de hallazgo ni se altera la numeración F16-01..F16-25 de subcapacidades.

### [F16-Task01] Implementar el catálogo de roles internos organizativos y asignación de responsabilidades
- **Hallazgo de origen:** C.2, F.1, G.1, tabla E/F16-03, backlog H.1 y continuidad J.
- **Severidad:** Crítica. **Objetivo:** formalizar responsabilidades organizativas sin confundirlas con privilegios RBAC.
- **Acción ejecutable:** crear `CatalogoRolesInternos` con nombre, descripción, departamento, vigencia, suplencias y estado; habilitar alta/edición/asignación desde RR. HH.; permitir varias responsabilidades por empleado y revocación con historial; impedir que asignar un rol funcional otorgue permisos administrativos.
- **Archivos/módulos:** `backend/user-service/Code.gs`, `backend/accounting-service/Code.gs`, `dashboard-recursos-humanos.html`, `AsignacionesAmbitosRoles`, nueva hoja `CatalogoRolesInternos`.
- **Dependencias/riesgos:** identidad de empleados, catálogo de departamentos/cargos, fechas de vigencia y autorización; riesgo de elevación accidental de privilegios o asignaciones huérfanas.
- **Alcance:** catálogo y ciclo de vida de responsabilidades internas; no sustituir `ROLE_PERMISSIONS` ni la matriz ABAC.
- **Criterios de aceptación:** roles configurables desde UI; asignaciones a empleados existentes con inicio/fin; responsabilidades múltiples; revocación conserva historial; ninguna asignación funcional cambia privilegios RBAC.
- **Prioridad:** P0. **Estado:** Pendiente.
- **Reconciliación:** C1.82 vincula esta causa con AUD-NG-225/TASK-505; TASK-004 figura históricamente completada, pero su prueba solo comprobó presencia de símbolos. Mantener F16-Task01 como trazabilidad de origen y ampliar/verificar TASK-505; no implementar en paralelo.
- **Evidencia de cierre:** pendiente; no se declara ejecución ni verificación.

### [F16-Task02] Desarrollar la gestión de docentes por área académica independiente y comités pedagógicos
- **Hallazgo de origen:** C.2, F.2, G.1, tabla E/F16-04, backlog H.1 y continuidad J.
- **Severidad:** Crítica. **Objetivo:** registrar la pertenencia institucional de docentes a una o varias áreas con independencia de su carga lectiva.
- **Acción ejecutable:** crear `DocentesAreasAcademicas` y endpoints `assignTeacherToAcademicArea` / `getTeachersByAcademicArea`; admitir áreas múltiples, titularidad/coordinación, vigencia, estado y consulta para comités; inactivar al desvincular al empleado sin borrar historial.
- **Archivos/módulos:** `backend/academic-service/Code.gs`, `backend/accounting-service/Code.gs`, hoja `DocentesAreasAcademicas` y pantallas de coordinación/RR. HH.
- **Dependencias/riesgos:** `AreasCurricularesExtensiones`, identidad laboral, permisos y asignaciones docentes; riesgo de confundir pertenencia a un área con asignación de una clase.
- **Alcance:** pertenencia docente-área y comités; no sustituir `AsignacionesDocentes` ni la oferta académica.
- **Criterios de aceptación:** un docente pertenece a varias áreas sin sección activa; consultas devuelven miembros vigentes; titular/coordinador identificado; desvinculación inactiva la relación conservando historia; accesos respetan ámbito.
- **Prioridad:** P0. **Estado:** Pendiente.
- **Reconciliación:** AUD-NG-018 cubre historial de asignaciones docentes y es dependencia, pero no equivale a la entidad de pertenencia institucional docente-área.
- **Evidencia de cierre:** pendiente; no se declara ejecución ni verificación.

### [F16-Task03] Ejecutar un offboarding atómico con revocación de accesos en cascada
- **Hallazgo de origen:** C.1, F.3, G.1, tabla E/F16-20, backlog H.1 y continuidad J.
- **Severidad:** Crítica. **Objetivo:** impedir que una persona desvinculada conserve cuentas, sesiones, adscripciones o asignaciones activas.
- **Acción ejecutable:** consolidar `updateEmployeeLaborStatus` en un flujo transaccional/idempotente que cierre expediente con fecha/motivo, invalide adscripciones, desactive cuenta y tokens, termine asignaciones docentes y sustituciones, genere finiquito/liquidación conforme a reglas aplicables y registre `EMPLOYEE_OFFBOARDED_CASCADED`.
- **Archivos/módulos:** servicios accounting, user y academic; `ExpedientesLaborales`, `HistorialAdscripciones`, `Usuarios`, `AsignacionesDocentes` y sustituciones.
- **Dependencias/riesgos:** identidad/sesiones, historial laboral, asignaciones académicas, contratos y liquidación; riesgo crítico de accesos residuales o cierres parciales.
- **Alcance:** desvinculación y revocación coordinada; preservar contratos, asistencias, calificaciones e historia.
- **Criterios de aceptación:** cuenta inhabilitada inmediatamente; relaciones activas cerradas; fallos no dejan estado parcial irrecuperable; historial íntegro; evento auditable emitido una sola vez.
- **Prioridad:** P0 en H.1; tabla E asigna P1 (discrepancia).
- **Estado:** Pendiente.
- **Reconciliación:** C1.82 vincula offboarding con TASK-006/AUD-NG-017. Reconciliar alcance y ampliar la tarea existente si corresponde; no duplicar implementación.
- **Evidencia de cierre:** pendiente; no se declara ejecución ni verificación.

### [F16-Task04] Implementar el checklist y proceso de incorporación de nuevos empleados
- **Hallazgo de origen:** B/F16-06, F.4, H.2 y continuidad J.
- **Severidad:** Alta. **Objetivo:** asegurar que requisitos documentales y operativos se completen antes de activar plenamente al empleado.
- **Acción ejecutable:** implementar `ChecklistIncorporacion` con requisitos configurables, estados, fechas, responsables y evidencias para contrato firmado, títulos cotejados, antecedentes, carnet IHSS, examen médico, horario, inducción y equipo; bloquear el estado Activo pleno si faltan requisitos obligatorios.
- **Archivos/módulos:** `backend/accounting-service/Code.gs`, `dashboard-recursos-humanos.html`, hoja `ChecklistIncorporacion`.
- **Dependencias/riesgos:** expediente, contratos, almacenamiento, roles RR. HH. y protección de datos médicos; riesgo de activar sin requisitos o bloquear indebidamente.
- **Alcance:** incorporación previa/posterior al alta; no automatizar decisiones de contratación ni exponer documentación sensible.
- **Criterios de aceptación:** checklist por empleado con responsable, vencimiento y evidencia; requisitos obligatorios configurables; transición a Activo validada en backend; excepciones autorizadas justificadas y auditadas.
- **Prioridad:** P1. **Estado:** Pendiente (estado operativo de migración; el informe no declara estado histórico explícito).
- **Evidencia de cierre:** pendiente; no se declara ejecución ni verificación.

### [F16-Task05] Proyectar saldos de vacaciones futuras y gestionar ausencias fraccionadas
- **Hallazgo de origen:** backlog H.2, tabla E/F16-11 y continuidad J; B/C declaran completo el cálculo actual.
- **Severidad:** Alta. **Objetivo:** permitir solicitudes futuras con proyección de días devengados y gestionar permisos fraccionados sin sobreasignar saldos.
- **Acción ejecutable:** proyectar saldo a fecha de disfrute cuando la política lo permita; admitir medio día/horas; detectar solapamientos y recalcular disponibilidad al aprobar/rechazar.
- **Archivos/módulos:** accounting-service, dashboard RR. HH., `calculateVacationBalances`, `submitLeaveVacationRequest`, `reviewVacationRequest`, `SolicitudesVacaciones`.
- **Dependencias/riesgos:** antigüedad, Art. 348, solicitudes aprobadas, jornada y reglas institucionales; riesgo de proyectar días no devengados o descontar dos veces.
- **Alcance:** proyección y fraccionamiento; no alterar escala legal ni saldos históricos consumidos.
- **Criterios de aceptación:** proyección reproducible; solicitud fraccionada conserva unidad/duración; solapamientos rechazados; saldo real y proyectado diferenciados; aprobación actualiza saldo una sola vez.
- **Prioridad:** P1 en H.2; tabla E marca P0 (discrepancia).
- **Estado:** Pendiente (estado operativo de migración; el informe no declara estado histórico explícito).
- **Evidencia de cierre:** pendiente; no se declara ejecución ni verificación.

### [F16-Task06] Impedir jerarquías circulares y validar la estructura de departamentos
- **Hallazgo de origen:** G.1, J, tabla E/F16-02 y backlog H.2. B declara F16-02 completa, pero G.1 identifica cumplimiento parcial por falta de validación de ciclos.
- **Severidad:** Alta. **Objetivo:** preservar una estructura organizativa acíclica y consistente.
- **Acción ejecutable:** validar cada alta/cambio de dependencia mediante detección de ciclos; rechazar auto-referencias, ciclos indirectos y referencias a unidades inexistentes.
- **Archivos/módulos:** `backend/user-service/Code.gs`, `manageDepartmentPositions`, catálogos de departamentos y cargos.
- **Dependencias/riesgos:** integridad referencial, concurrencia y jerarquías existentes; riesgo de romper consultas, organigrama y autorización por ámbito.
- **Alcance:** validación de relaciones jerárquicas; no rediseñar catálogos ni borrar estructuras históricas.
- **Criterios de aceptación:** altas/actualizaciones que generen ciclos rechazadas; relaciones válidas persisten; pruebas cubren ciclo directo/indirecto, referencia inexistente y concurrencia.
- **Prioridad:** P1. **Estado:** Pendiente.
- **Reconciliación:** C1.82 vincula esta causa con TASK-171; verificar cobertura y ampliar esa tarea, sin implementar otro detector.
- **Evidencia de cierre:** pendiente; no se declara ejecución ni verificación.

### [F16-Task07] Desarrollar el organigrama interactivo y directorio jerárquico
- **Hallazgo de origen:** F.5, tabla E/F16-22, H.3 y J.
- **Severidad:** Media. **Objetivo:** permitir a Dirección consultar visualmente la cadena de mando y dependencias institucionales.
- **Acción ejecutable:** renderizar organigrama SVG/HTML con departamentos, coordinaciones, jefaturas y colaboradores; añadir filtros por área/departamento y estados vigentes.
- **Archivos/módulos:** `dashboard-recursos-humanos.html`, `js/accounting.js`, endpoints de estructura y directorio.
- **Dependencias/riesgos:** catálogo de cargos/departamentos, relaciones acíclicas, permisos y vigencia; riesgo de mostrar relaciones obsoletas o datos personales sin autorización.
- **Alcance:** visualización/consulta; no sustituir el mantenimiento de la estructura.
- **Criterios de aceptación:** organigrama representa relaciones persistidas; filtros/navegación funcionan; nodos sin jefatura se muestran; datos respetan permisos y se actualizan tras cambios.
- **Prioridad:** P2. **Estado:** Pendiente.
- **Reconciliación:** C1.82 vincula organigrama con TASK-365. Mantener F16-Task07 como origen y ampliar/verificar TASK-365; no duplicar componente.
- **Evidencia de cierre:** pendiente; no se declara ejecución ni verificación.

### [F16-Task08] Exportar expedientes laborales y boletas de liquidación con filtros avanzados
- **Hallazgo de origen:** backlog H.3. La tabla E/F16-19 agrega filtros cruzados en exportaciones; se integra como ampliación sin crear otro ID.
- **Severidad:** Media. **Objetivo:** facilitar descarga controlada de expedientes y reportes de personal con información financiera desglosada.
- **Acción ejecutable:** exportar expediente laboral completo a PDF membretado y nóminas/boletas a Excel con desglose IHSS, RAP e ISR; incorporar filtros cruzados.
- **Archivos/módulos:** accounting-service, `js/accounting.js`, dashboard RR. HH. y módulos de reportes/exportación.
- **Dependencias/riesgos:** permisos RR. HH./contabilidad, datos laborales/financieros, plantillas y filtros; riesgo de fuga de salarios o exportaciones inconsistentes.
- **Alcance:** exportación documental y reportes; no ampliar accesos ni alterar cálculos de nómina.
- **Criterios de aceptación:** PDF identifica empleado; Excel concilia con fuentes y desglosa retenciones; filtros aplican antes de exportar; usuarios no autorizados reciben denegación; exportaciones auditadas.
- **Prioridad:** P2. **Estado:** Pendiente (estado operativo de migración; el informe no declara estado histórico explícito).
- **Procedencia adicional:** F16-19 figura en tabla E, pero no tiene tarea propia en H/J; se integra aquí para evitar duplicación.
- **Evidencia de cierre:** pendiente; no se declara ejecución ni verificación.

### [F16-Task09] Implementar la suite integral de regresión y concurrencia de la Fase 16
- **Hallazgo de origen:** H.3 y J (F16-Suite Calidad pendiente). G.2 registra pruebas manuales, no una suite automatizada integral.
- **Severidad:** Media-alta. **Objetivo:** verificar contratos, vacaciones, offboarding y seguridad ABAC/RBAC, incluyendo concurrencia y regresiones.
- **Acción ejecutable:** incorporar `runPhase16HumanResourcesRegressionSuite` con casos positivos/negativos para contratos, Art. 348, solapamientos, offboarding en cascada, ABAC, jerarquías y persistencia; registrar entorno, versión, resultado y evidencia.
- **Archivos/módulos:** `tests/regression/academic-grading-suite.js`, `backend/developer-service/Code.gs` y suites de servicios.
- **Dependencias/riesgos:** datos aislados, Apps Script, mocks y contratos interservicio; riesgo de falsos positivos si solo se comprueba presencia de símbolos.
- **Alcance:** suite automatizada Fase 16; no sustituye verificaciones manuales ni extrapola mocks a producción.
- **Criterios de aceptación:** tareas críticas cubiertas por pruebas conductuales; casos negativos detectan permisos indebidos, ciclos y estados parciales; concurrencia prueba duplicados/colisiones; evidencia reproducible y sin PASS por conteos superficiales.
- **Prioridad:** P2 (severidad media-alta). **Estado:** Pendiente.
- **Discrepancia:** G.2 describe pruebas transversales ejecutadas, mientras J mantiene la suite automatizada pendiente; no se equiparan.
- **Evidencia de cierre:** pendiente; no se declara ejecución ni verificación.

### [F16-Task10] Automatizar la conversión de candidatos seleccionados a empleados
- **Hallazgo de origen:** tabla E/F16-05: reclutamiento completo, pero conversión de candidato a empleado manual; omitida de H/J.
- **Severidad:** Media (P2 en tabla E). **Objetivo:** enlazar selección aprobada con creación del expediente laboral.
- **Acción ejecutable:** crear transición candidato-seleccionado a empleado que valide aprobación, evite duplicados, transfiera datos autorizados y conserve vínculo al proceso de reclutamiento.
- **Archivos/módulos:** accounting-service, `VacantesLaborales`, `CandidatosVacantes`, `ExpedientesLaborales` e interfaz RR. HH.
- **Dependencias/riesgos:** identidad, expediente, contrato y onboarding; riesgo de duplicar empleados o convertir candidatos no aprobados.
- **Alcance:** conversión de candidatos seleccionados; no automatizar decisión de contratación ni sustituir F16-Task04.
- **Criterios de aceptación:** solo candidatos aprobados se convierten; operación idempotente; expediente conserva vínculo; datos se transfieren con permisos; duplicados rechazados.
- **Prioridad:** P2. **Estado:** Pendiente. **Tipo:** nueva tarea derivada de la tabla E.
- **Evidencia de cierre:** pendiente; no se declara ejecución ni verificación.

### [F16-Task11] Integrar alertas de vencimiento de documentos y contratos en la interfaz de RR. HH.
- **Hallazgo de origen:** tabla E/F16-08: alertas disponibles por API, pero no integradas en la interfaz.
- **Severidad:** Alta (P1 en tabla E). **Objetivo:** hacer visibles y accionables los vencimientos para responsables autorizados.
- **Acción ejecutable:** conectar `getEmployeeContractAlerts` y alertas de credenciales/documentos al dashboard; mostrar fecha, tipo, empleado, días restantes y estado, con filtros y navegación autorizada.
- **Archivos/módulos:** accounting-service, `dashboard-recursos-humanos.html`, `js/accounting.js` y vistas documentales.
- **Dependencias/riesgos:** fechas de vigencia, permisos, zona horaria y datos documentales; riesgo de alertas tardías o exposición laboral.
- **Alcance:** UI para alertas existentes; no duplicar cálculo backend ni enviar notificaciones sin autorización.
- **Criterios de aceptación:** alertas visibles solo a roles autorizados; filtros por vencimiento/estado; datos concilian con API; estados distinguibles; acceso no autorizado denegado.
- **Prioridad:** P1. **Estado:** Pendiente. **Tipo:** nueva tarea derivada de la tabla E.
- **Evidencia de cierre:** pendiente; no se declara ejecución ni verificación.

### [F16-Task12] Validar colisiones entre jornadas laborales y horarios académicos
- **Hallazgo de origen:** tabla E/F16-09: horarios docentes cruzados en memoria y falta validación de colisiones.
- **Severidad:** Alta (P1 en tabla E). **Objetivo:** impedir asignaciones incompatibles a una misma persona.
- **Acción ejecutable:** validar disponibilidad al crear/modificar jornadas, turnos, sustituciones y asignaciones docentes; comparar intervalos, vigencia, zona horaria y persona; rechazar conflictos antes de persistir.
- **Archivos/módulos:** accounting-service, academic-service, `HorariosLaborales`, `AsignacionesTurnosLaborales`, `AsignacionesDocentes`.
- **Dependencias/riesgos:** modelos de horario/sustitución, concurrencia y calendarios; riesgo de doble asignación o jornadas imposibles.
- **Alcance:** validación cruzada laboral/académica; no rediseñar motores de horarios.
- **Criterios de aceptación:** conflictos detectados antes de guardar; intervalos válidos siguen funcionando; pruebas cubren cruces de día, vigencia y concurrencia; error identifica colisión sin exponer datos ajenos.
- **Prioridad:** P1. **Estado:** Pendiente. **Tipo:** nueva tarea derivada de la tabla E.
- **Evidencia de cierre:** pendiente; no se declara ejecución ni verificación.

### [F16-Task13] Conectar alertas push de RR. HH. al bus institucional de notificaciones
- **Hallazgo de origen:** tabla E/F16-18: notificaciones declaradas completas, pero sin alertas push directas.
- **Severidad:** Media (P2 en tabla E). **Objetivo:** distribuir avisos oportunos de eventos de RR. HH. a destinatarios autorizados.
- **Acción ejecutable:** integrar vencimientos, ausencias y procesos laborales al bus institucional; definir destinatarios por rol/ámbito, preferencias, deduplicación, estado de entrega y manejo de fallos.
- **Archivos/módulos:** accounting-service, user-service, `BandejaNotificaciones` y dashboard RR. HH.
- **Dependencias/riesgos:** preferencias, permisos, identidad, idempotencia y privacidad; riesgo de duplicación o divulgación de información sensible.
- **Alcance:** entrega push integrada; no crear segundo motor ni incluir diagnósticos médicos o datos sensibles en el mensaje.
- **Criterios de aceptación:** máximo una notificación por destinatario/evento; destinatarios autorizados; preferencias respetadas; fallos trazados/recuperables; contenido no expone datos sensibles.
- **Prioridad:** P2. **Estado:** Pendiente. **Tipo:** nueva tarea derivada de la tabla E.
- **Evidencia de cierre:** pendiente; no se declara ejecución ni verificación.

### Reconciliaciones y discrepancias transversales de Fase 16
- **F16-Task01:** solapamiento con AUD-NG-225/TASK-505; TASK-004 tiene marca histórica de completado, pero evidencia de prueba insuficiente.
- **F16-Task02:** relacionado con AUD-NG-018 (historial de asignaciones docentes), pero su alcance docente-área es distinto.
- **F16-Task03:** solapamiento con TASK-006/AUD-NG-017 (offboarding); reconciliar antes de implementar.
- **F16-Task05:** H lo clasifica P1 y tabla E P0; B/C declara completo el cálculo actual, pero H/J solicitan proyección futura.
- **F16-Task06:** solapamiento con TASK-171; B marca F16-02 completa, G.1 detecta cumplimiento parcial.
- **F16-Task07:** solapamiento con TASK-365; no desarrollar un segundo componente.
- **F16-Task08:** aparece en H, pero no en brechas F ni continuidad J; se conserva como recomendación histórica P2 y se amplía con F16-19.
- **F16-Task09:** G.2 registra pruebas manuales, J mantiene suite automatizada pendiente; no son equivalentes.
- **F16-Task10..13:** IDs nuevos asignados a brechas expresas de la tabla E que no tenían tarea en H/J; no son IDs de hallazgo.
- **Estado global:** ninguna tarea se declara completada; todas permanecen pendientes de ejecución, reconciliación o evidencia de cierre.
