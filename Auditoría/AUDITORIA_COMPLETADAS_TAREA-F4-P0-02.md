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

## Tareas ejecutables derivadas de los hallazgos

> Derivadas de la inspección estática de TAREA-F4-P0-02. Se conserva el dictamen **NO CUMPLE** y el estado `[X]` de `completadas.md`; este bloque registra trabajo pendiente y no certifica correcciones.

### AUD-NG-217 / TASK-496 — Restringir el acceso docente a estudiantes, tutores y trámites asignados (CRÍTICO/P0)

- [ ] Implementar una resolución server-side del conjunto de estudiantes asignados al profesor autenticado, basada en asignaciones activas y vigentes. No aceptar como autoridad `userId`, `targetUserId`, `studentId`, `userIdResponsable`, `grado` o `seccion` enviados por el cliente.
- [ ] En USER, aplicar ese ámbito a `getUserInfo`: el profesor solo podrá consultar perfiles de estudiantes bajo su asignación vigente y la respuesta deberá limitarse a los campos necesarios para su función.
- [ ] En USER, restringir `getGuardianStudents`: un profesor no puede consultar estudiantes vinculados a cualquier tutor; debe comprobar que cada estudiante pertenece al ámbito docente autorizado. Mantener la validación familiar existente para Padre/Tutor/Responsable.
- [ ] En USER, filtrar `getAdministrativeRequests` por estudiantes asignados y validar la propiedad/relación antes de devolver trámites. En `submitAdministrativeRequest`, derivar el actor del principal verificado y comprobar la asignación del estudiante antes de aceptar la creación; no permitir que el payload suplante al solicitante o al representado.
- [ ] Definir comportamiento de denegación uniforme para estudiante fuera de asignación, asignación vencida, asignación revocada, profesor sin asignaciones y roles no docentes; evitar que una consulta sin filtros se convierta en acceso global.
- [ ] Añadir pruebas multiusuario para profesor A/B, estudiantes asignados/no asignados, tutores con y sin vínculo, trámites de terceros, cambio de IDs en payload, ausencia de filtros y asignación revocada.
- **Criterio de aceptación:** los cuatro handlers USER aplican el ámbito docente en backend y no revelan perfiles, vínculos familiares ni trámites fuera de asignaciones activas. Evidencia: pruebas negativas/positivas reproducibles y matriz de autorización por rol y relación.

### AUD-NG-105 — Corregir el contrato de historial académico y aplicar autorización contextual (ALTO)

- [ ] Corregir el esquema de historial para almacenar una clave estable de estudiante separada del identificador del registro `hist-XXXX`; migrar o reconciliar registros existentes sin reinterpretar el ID histórico como identidad del estudiante.
- [ ] Alinear `ROLE_PERMISSIONS`, `getAcademicHistory` y el cliente `fetchAcademicHistory` para que los roles autorizados invoquen el endpoint con un contrato coherente y el servidor derive el principal de claims verificados.
- [ ] Extender `validateContextualAccess` para Padre/Tutor/Responsable: verificar el vínculo familiar real con cada estudiante solicitado. Para Profesor, comprobar asignación docente activa y alcance sobre el estudiante.
- [ ] Ignorar/rechazar `estudianteId`, `grado` y `seccion` arbitrarios cuando no estén respaldados por el principal y las relaciones autorizadas. Las consultas sin filtros no deben devolver historiales globales a roles familiares o docentes.
- [ ] Añadir pruebas de correspondencia entre ID de historial y estudiante, lectura propia, tutor vinculado/no vinculado, profesor asignado/no asignado, rol sin permiso, payload manipulado y conjunto vacío.
- **Criterio de aceptación:** el estudiante autorizado puede leer su historial mediante una clave de estudiante inequívoca; tutores y profesores solo acceden a historiales de estudiantes vinculados/asignados; no hay consulta global por omisión de filtros.

### AUD-NG-136 — Aislar historial de matrícula, estados de cuenta y comprobantes por vínculo familiar (CRÍTICO)

- [ ] En ACADEMIC, extender `validateContextualAccess` y `getStudentEnrollmentHistory` para que Padre/Tutor/Responsable solo consulten estudiantes vinculados mediante una relación familiar vigente y verificada; el `userId` del payload no acredita propiedad.
- [ ] En ACCOUNTING, aplicar el mismo vínculo familiar a `getStudentAccountStatement` y `getPaymentVouchers`; no devolver todos los comprobantes cuando falte `userId`, ni aceptar un identificador arbitrario para consultar registros de terceros.
- [ ] Revisar los endpoints financieros/documentales ya incluidos en AUD-NG-136 (incluidos recibos y facturas fiscales) para exigir titularidad o vínculo familiar antes de recuperar o generar documentos; comprobar también filtros por `reciboId`, `pagoId` y `facturaId`.
- [ ] Derivar el actor desde claims verificados y resolver el estudiante representado desde relaciones persistidas; validar la relación en cada petición, sin confiar en listas de IDs del cliente ni en filtros de interfaz.
- [ ] Aplicar denegación por defecto, minimización de campos y separación entre consultas de un titular y consultas administrativas explícitamente autorizadas.
- [ ] Añadir pruebas cruzadas entre dos familias, tutor sin vínculo, estudiante propio/ajeno, comprobantes sin filtro, IDs de recibo/pago/factura manipulados, y roles administrativos con ámbito explícito.
- **Criterio de aceptación:** ningún rol familiar accede a matrículas, cargos, estados de cuenta, comprobantes, recibos o facturas de un estudiante no vinculado; omitir filtros no amplía el alcance. Las consultas administrativas requieren permiso y ámbito verificables.

### Dependencias que se mantienen sin duplicar

- **AUD-NG-002:** conserva la corrección de consultas TASK/EXAM en `PUBLIC_ACTIONS`, identidad derivada del token y aislamiento de consultas estudiantiles. No duplicar aquí sus tareas ya registradas en C1.172.
- **AUD-NG-106 / AUD-NG-108:** permanecen responsables de la autorización contextual de configuración académica y su vínculo con el profesor autenticado; este informe no los reemplaza.
- **AUD-NG-128:** conserva IDOR de tickets y otras acciones USER distintas de perfiles/tutores/trámites docentes.
- **AUD-NG-130:** mantiene el alcance de permisos financieros y la prohibición de mutaciones durante consultas.
- **TASK-105:** mantiene el ciclo de vida/sincronización de justificaciones; no sustituye la autorización contextual del solicitante.
- No crear otro ID para el ámbito docente USER: AUD-NG-217/TASK-496 es el identificador específico. AUD-NG-105 y AUD-NG-136 se amplían, no se duplican.

### Límites de verificación

- La inspección que origina este bloque es estática. No afirmar explotación, fuga real en producción ni corrección efectiva sin pruebas autorizadas en entorno controlado.
- No se modifican código fuente, pruebas, estados maestros ni registros de completitud en esta iteración.
