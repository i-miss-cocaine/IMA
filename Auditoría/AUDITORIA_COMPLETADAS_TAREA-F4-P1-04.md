# Auditoría TAREA-F4-P1-04 - Política unificada de autorización contextual RBAC/ABAC

**Checkpoint:** C1.79  
**Repositorio:** i-miss-cocaine/IMA  
**Rama de trabajo:** NG_beta_0.0.0.1_work  
**HEAD de partida:** 45545ed794e01a6fdf7cd4464f9dbc5f125c4b84  
**Rama base:** NG_beta_0.0.0.1 (44d9891132332e692dbe2ba8602b41f50a508a59)  
**ID operativo de sesión:** IMA-AUDIT-20261106-1338Z (inicio C1.79; abierta)  
**Fecha:** 2026-11-06

## Dictamen

**NO CUMPLE.** Los cinco microservicios tienen validadores contextuales locales y divergentes. No existe una política común que derive y compruebe de forma uniforme el contexto del recurso (estudiante, familiar, docente, área y ámbito institucional). ACADEMIC contiene controles condicionales y rutas fail-open; ACCOUNTING, TASK y EXAM carecen de controles familiares/docentes/ámbitos en su validador contextual. USER implementa solo parte de los controles.

## Alcance documental y limitaciones

En completadas.md, TAREA-F4-P1-04 aparece marcada [X] y su descripción disponible es: implementar una política unificada de autorización contextual RBAC/ABAC; clasificación Alto · Seguridad · Backend; archivos backend/*/Code.gs. El documento fuente AUDITORIA_FASE4_IDENTIDAD_PERMISOS_GOBIERNO.md citado por completadas.md no está presente en el árbol actual. Por ello, este dictamen contrasta el objetivo y la evidencia versionada, sin inventar criterios de aceptación adicionales.

## Evidencia por microservicio

### USER

- backend/user-service/Code.gs SHA 12079dd410aa6d8afbce55a4bc62a79dea605f9f.
- validateContextualAccess (1213-1250) aplica comparación de ID para Estudiante/Alumno y verificación de relación familiar para Padre/Tutor/Responsable únicamente cuando targetStudentId existe y es distinto del ID autenticado. No incorpora comprobación de asignaciones docentes.
- La comprobación familiar consulta getGuardianStudents (3480-3580). La función construye permisos predeterminados con todos los indicadores true cuando no existe JSON de permisos en la relación; la validación solo deniega cuando encuentra un permiso explícitamente false.
- assignRoleScope/getUserScopeConfig/validateRoleScopeAccess (9115-9248) implementan gestión y consulta de ámbitos, pero validateRoleScopeAccess no está integrado en validateContextualAccess ni se invoca como motor común desde los otros cuatro servicios.

### ACADEMIC

- backend/academic-service/Code.gs SHA daf1883ec0b8d4f0ff2bc673af8a4e8c5bbd03fc.
- validateContextualAccess (465-521) solo consulta AsignacionesAmbitosRoles cuando payload.scopeType, payload.requestedValue y verifiedUserId están presentes. Si el cliente omite cualquiera, el bloque no se ejecuta.
- Si la hoja no existe o no contiene registros, no se produce denegación. Los errores de consulta de ámbitos y de coordinación se capturan mediante catch vacíos (504, 517), después de lo cual la función retorna authorized:true.
- Para Coordinador, la comprobación (508-518) solo compara areaId con el resultado de getAcademicAreaCoordinationScope (4321-4349). Aunque el helper devuelve ambitoSupervision, el validador no comprueba sus valores internos.
- La comprobación de scopeType/requestedValue no sustituye controles de asignación docente ni vínculos familiares.

### ACCOUNTING

- backend/accounting-service/Code.gs SHA 38b979d41596b85e888b4a7060b37bbac0840a28.
- validateContextualAccess (418-431) solo impide que Estudiante/Alumno use otro ID cuando el identificador se envía; no verifica relaciones familiares, asignaciones docentes ni ámbitos.
- getStudentAccountStatement (3825-3889) toma userId del payload para roles familiares/administrativos. getPaymentVouchers (4151-4181) no exige un userId autenticado para filtrar resultados.
- Estos accesos concretos ya están cubiertos por AUD-NG-136 y no se crean duplicados.

### TASK

- backend/task-service/Code.gs SHA 1437756a3c3d3d97e06bc1ff21c8e2ca2b2dccbe.
- validateContextualAccess (209-223) solo limita Estudiante/Alumno. No hay verificación contextual familiar, docente ni de ámbito.
- getStudentTasks (613-690) filtra por grado/sección enviados por payload y la acción permanece en PUBLIC_ACTIONS; el bypass ya está documentado en AUD-NG-002.

### EXAM

- backend/exam-service/Code.gs SHA 1d93296628fae31f680004f637897e2b1314a64c.
- validateContextualAccess (191-205) solo limita Estudiante/Alumno. No hay verificación contextual familiar, docente ni de ámbito.
- getStudentExams (1057-1104) filtra por grado/sección enviados por payload y la acción permanece en PUBLIC_ACTIONS; el bypass ya está documentado en AUD-NG-002.

## Reconciliación de hallazgos

- AUD-NG-105/106/108: historial académico, configuración por grado/sección y propiedad de configuraciones docentes.
- AUD-NG-128/130: bypass RBAC/tickets y exposición financiera.
- AUD-NG-136: vínculos familiares y datos financieros/fiscales.
- AUD-NG-217/TASK-496: perfiles, tutores y trámites fuera del ámbito docente.
- AUD-NG-002: acciones públicas sensibles en TASK/EXAM.
- AUD-NG-160: vigencia de rol, fallback e invalidación de cachés.
- AUD-NG-221/TASK-501: matriz dinámica por rol/módulo/acción/ámbito.

Se conserva cada alcance específico. Se registra AUD-NG-222/TASK-502 para la brecha sistémica distinta: ausencia de una política contextual común y de denegación fail-closed ante contexto requerido ausente, error de consulta o fuente de autorización no disponible.

## Nuevo hallazgo y tarea

**AUD-NG-222 (Alto/P1):** falta de política ABAC contextual común y fail-closed en los cinco microservicios.

**TASK-502:** centralizar la evaluación contextual; derivar la identidad y el contexto desde claims verificados; aplicar relaciones familiares, asignaciones docentes, áreas y ámbitos según acción/recurso; no aceptar el contexto de autorización como autoridad proveniente del payload; denegar cuando un contexto requerido falte o no pueda verificarse; normalizar contratos entre servicios; registrar decisiones sin exponer PII y ejecutar pruebas positivas/negativas en USER, ACADEMIC, ACCOUNTING, TASK y EXAM.

## Tareas ejecutables derivadas de los hallazgos

### [AUD-NG-222 / TASK-502] Implementar una política contextual ABAC común y fail-closed

- **Hallazgo de origen:** AUD-NG-222, documentado en «Nuevo hallazgo y tarea» y sustentado por la evidencia de USER, ACADEMIC, ACCOUNTING, TASK y EXAM. Los validadores locales no aplican de forma uniforme relaciones familiares, asignaciones docentes, áreas y ámbitos institucionales; ACADEMIC presenta rutas fail-open cuando faltan datos o fallan consultas.
- **Severidad:** Alto (P1).
- **Objetivo:** asegurar que cada servicio autorice el acceso al recurso concreto usando identidad y contexto verificados, con reglas coherentes y denegación segura cuando no sea posible acreditar el ámbito solicitado.
- **Acción ejecutable:** diseñar e integrar un contrato y motor de políticas contextuales común para los cinco microservicios. Derivar identidad, rol y atributos de seguridad exclusivamente de claims verificados y fuentes institucionales confiables; no aceptar como autoridad valores de identidad, relación, área, grado, sección o ámbito enviados por el cliente. Para cada acción/recurso, evaluar el vínculo titular-estudiante y la representación familiar vigente, las asignaciones docentes activas, el área y los ámbitos institucionales aplicables. Definir explícitamente qué atributos son obligatorios por acción y recurso. Rechazar por defecto cuando falte un atributo requerido, la relación o asignación no exista o esté vencida, la fuente de autorización no esté disponible, la consulta falle o el contrato entre servicios sea inválido. Eliminar los caminos fail-open y las comprobaciones condicionales que permiten omitir la evaluación contextual. Integrar el mismo contrato en USER, ACADEMIC, ACCOUNTING, TASK y EXAM; registrar decisiones y motivos de denegación con correlación, evitando almacenar datos personales innecesarios. Mantener separados los controles específicos ya asignados a AUD-NG-105/106/108/128/130/136/217, AUD-NG-002, AUD-NG-160 y AUD-NG-221/TASK-501; esta tarea resuelve la política transversal y su aplicación coherente, no sustituye esos controles.
- **Archivos/módulos afectados:** `backend/user-service/Code.gs`, `backend/academic-service/Code.gs`, `backend/accounting-service/Code.gs`, `backend/task-service/Code.gs`, `backend/exam-service/Code.gs`; contratos y pruebas de integración asociados a estos servicios. La ubicación de cualquier módulo compartido deberá definirse conforme a la arquitectura real, sin asumir un archivo inexistente.
- **Dependencias y riesgos:** claims y validación de sesión; fuentes institucionales de relaciones familiares, asignaciones docentes, áreas y ámbitos; AUD-NG-001/005 para sesión y revocación; AUD-NG-105/106/108/128/130/136/217 para superficies concretas; AUD-NG-160 para frescura de rol/cachés; AUD-NG-221/TASK-501 para matriz dinámica. Riesgos: denegaciones legítimas por atributos incompletos, divergencia de contratos, confianza accidental en payloads y regresiones al migrar validadores locales.
- **Alcance:** política contextual común aplicada a los cinco microservicios, con evaluación por acción/recurso y pruebas de integración. Incluye el tratamiento seguro de ausencia, error e indisponibilidad de fuentes. No incluye rediseñar la matriz dinámica, el ciclo de delegaciones, la revocación de sesiones ni corregir individualmente cada endpoint ya cubierto por hallazgos específicos, salvo la integración necesaria con el motor común.
- **Criterios de aceptación:** (1) existe un contrato documentado y versionado de atributos contextuales por acción/recurso; (2) los cinco servicios consumen la misma política o implementación compartida, sin validadores divergentes que permitan omitir controles; (3) identidad y atributos de autorización proceden de claims verificados y fuentes institucionales, nunca de valores autoritativos del payload; (4) las relaciones familiares y representaciones, asignaciones docentes, áreas y ámbitos se verifican según el recurso solicitado; (5) la ausencia de contexto requerido, errores de consulta, respuestas inválidas e indisponibilidad producen denegación segura; (6) se eliminan las rutas fail-open identificadas en ACADEMIC; (7) las decisiones generan trazabilidad correlacionada sin exposición innecesaria de PII; (8) pruebas positivas y negativas cubren estudiante propio/ajeno, tutor vinculado/no vinculado, docente con/sin asignación, coordinador dentro/fuera de ámbito y fallos/ausencia de cada fuente en los cinco servicios; (9) pruebas de regresión demuestran que los controles específicos reconciliados siguen aplicándose; (10) se documentan resultados de pruebas y SHAs de los componentes revisados.
- **Prioridad:** P1.
- **Estado:** Pendiente.
- **Evidencia de cierre:** pendiente; registrar contrato, componentes integrados, pruebas ejecutadas, resultados y commits cuando la implementación se realice. La normalización documental de este informe no cierra ni implementa TASK-502.

## Pruebas y limitaciones

**Ejecutadas:** inspección estática/manual, comparación de SHA y búsqueda de integración/uso de validadores.

**No ejecutadas:** peticiones HTTP, explotación controlada, pruebas multiusuario/familia/docente, consultas a hojas productivas, despliegues de Apps Script, pruebas de caché ni suites automatizadas. No se afirma que se haya probado comportamiento runtime.

## Continuidad

- Progreso: 76/183 identificadores auditados; 107 pendientes.
- Siguiente tarea: TAREA-F4-P1-05 - Incorporar un panel de gobierno de privacidad y gestión de derechos sobre datos (ARCO).
- Archivos documentales modificados: Auditoria.txt, MapaDependencias.md, AUDITORIA_COMPLETADAS_PLAN.md, Contexto_personal.txt, Pendientes.md y este informe.
- Sin modificar: código fuente, completadas.md, ChangesLogs.txt y METODOLOGIA_DESARROLLO.md.
- Rama base sin cambios. La API de GitHub reporta protected=false para NG_beta_0.0.0.1; se conserva como rama de referencia y no se escribe en ella.
- Commit de cierre: el commit que contiene este checkpoint.
