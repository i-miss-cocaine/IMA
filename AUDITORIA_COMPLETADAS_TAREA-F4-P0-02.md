# AUDITORÍA DE TAREA COMPLETADA - TAREA-F4-P0-02
FECHA: 2026-11-06
REPOSITORIO: i-miss-cocaine/IMA
RAMA: NG_beta_0.0.0.1_work
HEAD DE PARTIDA: ecd7fd035daaa27dfce79eab48d71bf8be715049
RAMA BASE: NG_beta_0.0.0.1
HEAD DE LA RAMA BASE: 44d9891132332e692dbe2ba8602b41f50a508a59
TAREA: TAREA-F4-P0-02 - Corregir las vulnerabilidades IDOR y garantizar el aislamiento de datos personales
ESTADO EN completadas.md: [X] Completada
CHECKPOINT: C1.73
ID OPERATIVO DE SESIÓN: IMA-AUDIT-20261106-1138Z
INICIO DE SESIÓN: C1.71 (sesión abierta)
================================================================

## 1. Alcance y trazabilidad

completadas.md (SHA f57f1aef832e81e44fc4f7ec36a852d50e464676) marca la tarea como [X] y enumera los cinco microservicios USER, ACADEMIC, ACCOUNTING, EXAM y TASK. El registro maestro no incorpora criterios detallados adicionales. El informe de origen AUDITORIA_FASE4_IDENTIDAD_PERMISOS_GOBIERNO.md no aparece en el árbol actual, por lo que el alcance se reconstruye desde el registro maestro, los comentarios TAREA-F4-P0-02 en el código y los hallazgos de backlog ya existentes.

## 2. Dictamen

**NO CUMPLE.** Hay intentos de aislamiento en handlers individuales, pero no existe una política contextual consistente entre servicios. USER omite el ámbito docente en consultas de perfiles, tutores y trámites; ACADEMIC no valida vínculos familiares ni asignaciones docentes en lecturas de historial; ACCOUNTING permite que familiares consulten registros financieros de estudiantes no vinculados; EXAM y TASK exponen consultas estudiantiles mediante PUBLIC_ACTIONS, que omiten la validación de token y contexto.

## 3. USER: ámbito docente incompleto

**Archivo:** backend/user-service/Code.gs  
**SHA:** 12079dd410aa6d8afbce55a4bc62a79dea605f9f

- ROLE_PERMISSIONS de Profesor incluye getUserInfo, getGuardianStudents, getAdministrativeRequests y submitAdministrativeRequest (líneas 952-988).
- validateContextualAccess (líneas 1190-1255) contiene controles para Estudiante/Alumno y Padre/Tutor/Responsable, pero no tiene una rama para Profesor ni deriva el conjunto de estudiantes asignados.
- getUserInfo (líneas 2571-2635) acepta userId/targetUserId/studentId desde payload. Estudiante se fuerza a sí mismo y Padre/Tutor se comprueba contra getGuardianStudents; Profesor no tiene restricción de asignación. La respuesta incluye correo, teléfono y personaId para usuarios no administrativos.
- getGuardianStudents (líneas 3479-3545) acepta userIdResponsable/userId. Padre/Tutor/Responsable se fuerzan a _verifiedUserId; Profesor conserva el identificador del payload y puede consultar los estudiantes vinculados a cualquier tutor.
- getAdministrativeRequests (líneas 5035-5092) filtra por userId/estudianteId enviados por el cliente. submitAdministrativeRequest (líneas 5104-5165) persiste userId y estudianteId recibidos del payload. Como Profesor tiene ambos permisos y no existe control de asignación docente, puede consultar o crear trámites bajo identidades ajenas.
- Los controles familiares existentes en USER para Padre/Tutor/Responsable sí validan la relación mediante getGuardianStudents; el nuevo hallazgo se limita al ámbito docente no aplicado y no duplica esas comprobaciones.

**Nuevo hallazgo:** AUD-NG-217, Crítico/P0, asociado a TASK-496. No se duplica AUD-NG-128, que cubre el IDOR de tickets y otras acciones diferentes.

## 4. ACADEMIC: historial académico y de matrícula

**Archivo:** backend/academic-service/Code.gs  
**SHA:** daf1883ec0b8d4f0ff2bc673af8a4e8c5bbd03fc

- validateContextualAccess (líneas 450-524) restringe Estudiante/Alumno a su propio ID y aplica reglas específicas a Coordinador/ámbitos, pero no verifica vínculos familiares para Padre/Tutor/Responsable ni asignaciones docentes para Profesor.
- ROLE_PERMISSIONS permite getAcademicHistory a Padre/Tutor/Responsable y Profesor; permite getStudentEnrollmentHistory a Padre/Tutor/Responsable.
- getAcademicHistory (líneas 12587-12645) toma estudianteId, grado y sección del payload; solo fuerza verifiedUserId para Estudiante/Alumno. Sin ID/filtros, la consulta puede devolver un conjunto amplio de historial; no se valida vínculo familiar ni asignación docente.
- getStudentEnrollmentHistory (líneas 12746-12805) toma userId del payload y solo lo sustituye para Estudiante/Alumno. Devuelve matrículas y cargos, sin comprobar que un Padre/Tutor/Responsable esté vinculado al estudiante solicitado.
- Se amplía AUD-NG-105 para la lectura del historial académico y se incorpora getStudentEnrollmentHistory al alcance familiar/financiero de AUD-NG-136. No se crean hallazgos duplicados.

## 5. ACCOUNTING: aislamiento financiero familiar

**Archivo:** backend/accounting-service/Code.gs  
**SHA:** 38b979d41596b85e888b4a7060b37bbac0840a28

- validateContextualAccess (líneas 410-434) solo restringe Estudiante/Alumno al ID verificado; no comprueba relaciones de Padre/Tutor/Responsable.
- ROLE_PERMISSIONS concede getStudentAccountStatement y getPaymentVouchers a Padre/Tutor/Responsable.
- getStudentAccountStatement (líneas 3824-3895) acepta userId del payload para roles no estudiantiles y no comprueba relación familiar.
- getPaymentVouchers (líneas 4150-4215) acepta userId; si no se envía filtro, devuelve todos los comprobantes. No valida vínculo familiar.
- AUD-NG-136 ya cubre estos endpoints y permanece pendiente. Se revalida su vigencia; no se crea un nuevo hallazgo.

## 6. EXAM y TASK: consultas públicas que eluden autorización

**EXAM:** backend/exam-service/Code.gs, SHA 1d93296628fae31f680004f637897e2b1314a64c.
- getStudentExams (líneas 1056-1125) utiliza userId, grado y sección del payload cuando no existe _verifiedUserId; devuelve estados, calificaciones y comentarios de entregas.
- getStudentExams y getAllExams permanecen en PUBLIC_ACTIONS, por lo que validateRolePermission retorna autorizado antes de verificar token/contexto.

**TASK:** backend/task-service/Code.gs, SHA 1437756a3c3d3d97e06bc1ff21c8e2ca2b2dccbe.
- getStudentTasks (líneas 612-690) utiliza userId, grado y sección del payload cuando no existe _verifiedUserId; incluye datos de entrega, calificación y estado.
- getStudentTasks y otras consultas permanecen en PUBLIC_ACTIONS, por lo que el validador contextual se omite.

Ambos casos continúan dentro de AUD-NG-002, ya ampliado en C1.72. No se duplica.

## 7. Reconciliación de hallazgos

- **AUD-NG-002:** continúa para consultas TASK/EXAM expuestas en PUBLIC_ACTIONS y operaciones sensibles públicas. Se mantiene pendiente.
- **AUD-NG-105:** se amplía para exigir alcance familiar/docente en getAcademicHistory, además de alinear esquema y permisos.
- **AUD-NG-106:** continúa para derivar grado/sección de identidad verificada en getAcademicConfig.
- **AUD-NG-108:** continúa para vincular configuración académica al profesor autenticado.
- **AUD-NG-128:** cubre IDOR de tickets y acciones específicas del servicio USER; no sustituye el nuevo ámbito docente de perfiles/tutores/trámites.
- **AUD-NG-130:** continúa para permisos financieros y evitar mutaciones durante consultas.
- **AUD-NG-136:** se amplía a getStudentEnrollmentHistory en ACADEMIC y conserva los endpoints de ACCOUNTING.
- **AUD-NG-217 / TASK-496:** nuevo alcance para USER, limitado a consultas y trámites docentes fuera de las asignaciones activas.
- **TASK-105:** mantiene el ciclo de vida y sincronización de justificaciones; no sustituye la autorización contextual del solicitante.
- No se crean otros IDs nuevos.

## 8. Pruebas y límites

Inspección estática/manual de los cinco servicios, matrices ROLE_PERMISSIONS, validateContextualAccess, validateRolePermission y los handlers identificados con TAREA-F4-P0-02. Se cotejaron las tareas pendientes AUD-NG-002, 105, 106, 108, 128, 130 y 136.

No se ejecutaron llamadas HTTP, pruebas multiusuario, pruebas cruzadas entre familias, docentes/asignaciones, matrículas reales, consultas a Google Sheets de producción ni suites automatizadas. El dictamen se basa en rutas de código y contratos estáticos; no se afirma explotación runtime.

## 9. Estado

- Dictamen: **NO CUMPLE**.
- Progreso de la lista maestra: 70/183 identificadores auditados; 113 pendientes.
- TAREA-F4-P0-02 permanece marcada [X] en completadas.md, pero las brechas de aislamiento siguen abiertas.
- Nuevo hallazgo: AUD-NG-217 (Crítico/P0); nueva tarea: TASK-496.
- Hallazgos ampliados: AUD-NG-105 y AUD-NG-136.
- Código fuente: sin modificaciones.
- Próxima tarea oficial: TAREA-F4-P0-03 - Garantizar la revocación efectiva de sesiones y la actualización inmediata de privilegios.

================================================================
