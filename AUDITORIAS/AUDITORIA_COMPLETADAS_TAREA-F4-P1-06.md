# AUDITORÍA COMPLETADA - TAREA-F4-P1-06
## Checkpoint C1.81 - Trazabilidad, historial de cambios y auditoría de versiones

- Fecha: 2026-11-06.
- Repositorio: i-miss-cocaine/IMA.
- Rama auditada: NG_beta_0.0.0.1_work.
- Rama base: NG_beta_0.0.0.1 (sin modificaciones).
- HEAD de partida verificado: ba92a81f7f3b45a4357fe9c9bfadf6c3fe0290ad.
- HEAD de rama base verificado: 44d9891132332e692dbe2ba8602b41f50a508a59.
- Sesión operativa: IMA-AUDIT-20261106-1338Z; inicio C1.79; permanece ABIERTA. Es un identificador operativo, no un ID técnico nativo de ChatGPT.
- Checkpoint anterior: C1.80 / TAREA-F4-P1-05.
- Tarea oficial: TAREA-F4-P1-06 - Fortalecer la trazabilidad mediante historial de cambios y auditoría de versiones.
- Estado maestro: [X] Completada en completadas.md.
- Dictamen: NO CUMPLE.

## Alcance y fuente
completadas.md identifica como archivos involucrados backend/user-service/Code.gs, BitacoraEventos y BitacoraTraceability. La fuente original AUDITORIA_FASE4_IDENTIDAD_PERMISOS_GOBIERNO.md, citada como origen, no aparece en el árbol de la rama. El registro oficial disponible solo aporta título, clasificación y archivos; no se atribuyen criterios de aceptación no visibles. La inspección se amplió a backend/academic-service/Code.gs y js/secretary.js porque son productores/consumidores reales de la misma hoja HistorialCambiosEntidad.

## Evidencia versionada
- backend/user-service/Code.gs: 12079dd410aa6d8afbce55a4bc62a79dea605f9f.
- backend/academic-service/Code.gs: daf1883ec0b8d4f0ff2bc673af8a4e8c5bbd03fc.
- js/secretary.js: 08a81266957b4c18cc25f8ba6749eac30a8f2c2c.
- js/ui-common.js: 986938b8a311a41ed4cb3d135b66b6aaea4bed67.
- tests/regression/academic-grading-suite.js: 3433b707edd4a2f35c68368a3172932adc2a3b32.
- Auditoria.txt previo: 410ff2b0e279577697d0afcef5783c008cdb5028.
- MapaDependencias.md previo: 76aa096e0b960a411ee28faa21e2fde1d24541d0.

## Hallazgos

### 1. Esquemas incompatibles en una hoja compartida
- USER define recordEntityChangeLog (2715-2742) y crea HistorialCambiosEntidad con columnas: cambioId, entityType, entityId, accion, valoresAnteriores, valoresNuevos, ejecutadoPor, fechaCambio, correlationId.
- ACADEMIC define otra función con el mismo nombre (1568-1592), pero escribe: HistorialID, Fecha, EntidadTipo, EntidadID, Accion, ValorAnteriorJSON, ValorNuevoJSON, UsuarioResponsable, CorrelationID.
- Ambas funciones escriben en la misma hoja y solo crean encabezado cuando getLastRow() === 0. Si la hoja ya existe, la segunda función no adapta su fila al encabezado existente; mezcla posiciones semánticas distintas.
- ACADEMIC también escribe directamente filas de ocho columnas y formatos propios en resolveAdmissionDuplicate (10138-10149), unmergeStudentFiles (10286-10297) y getStudentFileAdministrativeReports (10399-10410).
- getEntityAuditHistory de USER (2745-2798) interpreta row[1] como entityType y row[2] como entityId, por lo que no puede reconocer filas creadas con el esquema ACADEMIC, donde esos valores están en row[2] y row[3].
- getAcademicPlanningAuditLogs (13705-13735) también lee índices incompatibles con los dos formatos de escritura.
- js/secretary.js (1185-1225) consulta getEntityAuditHistory para entityType SolicitudAdmision y muestra un mensaje de historial vacío cuando no recibe coincidencias. ACADEMIC sí registra cambios de admisión mediante su esquema divergente (2022-2024 y 2094-2096), pero el lector USER no los interpreta correctamente. El flujo de auditoría visible de admisiones queda roto por el contrato compartido inconsistente.

### 2. Registro no garantizado ni uniforme
- USER tiene cinco llamadas de negocio a recordEntityChangeLog (2371, 2689, 2884, 9099 y 9166); ACADEMIC tiene ocho llamadas (2023, 2095, 11211, 11729, 11798, 11850, 11999 y 12059), además de tres escritores directos con appendRow.
- Los dos helpers capturan los errores de escritura y solo los envían a console.warn/console.error (USER 2739-2741; ACADEMIC 1589-1591). Sus llamadores no reciben confirmación de persistencia ni un error que impida declarar exitosa una mutación que debía auditarse.
- Los formatos directos de ACADEMIC tampoco garantizan el mismo identificador, actor, fecha, correlationId ni estructura JSON de los helpers.

### 3. No hay integridad criptográfica general ni versionado verificable
- HistorialCambiosEntidad no incluye número de versión, hash previo, hash actual ni mecanismo de verificación de alteraciones.
- verifyWorkflowDecisionAuditChain y recordWorkflowDecisionCorrection (USER 7403-7519) encadenan RevisionesDecisionesTramite; esa protección específica no se aplica a HistorialCambiosEntidad ni a BitacoraEventos/BitacoraTrazabilidad.
- TASK-049 ya cubre la cadena criptográfica de decisiones de workflow; no se duplica ni se afirma que esa cadena cubra el historial general.

### 4. Lectura y autorización incompletas
- getEntityAuditHistory acepta limit mediante parseInt(limit || 100, 10), sin máximo ni cursor de paginación; carga toda la hoja y recorre las filas en memoria.
- El handler permite internamente Administrador, Desarrollador, Secretaría/Secretaria y Director (2752-2755), pero getEntityAuditHistory no aparece como permiso estático en las listas ROLE_PERMISSIONS revisadas. validateRolePermission aplica primero la matriz dinámica y luego los permisos estáticos (1253-1295). En ausencia de una concesión dinámica explícita, Secretaría/Director no superan el control exterior aunque el handler los permita.
- La interfaz de Secretaría invoca la acción para consultar admisiones, de modo que debe existir una concesión explícita y acotada para ese flujo, no una dependencia implícita de una matriz no verificada.

### 5. Sanitización de datos personales
- USER sanitizeValueForAudit (2698-2712) oculta claves que contienen pass/token/secret/clave, pero updateUserProfile registra nombre, email y teléfono en los snapshots anteriores/nuevos (2685-2689); email y teléfono no se redactan.
- ACADEMIC recordEntityChangeLog serializa previousValue y newValue directamente (1584-1585), sin sanitización. Los datos de justificación/motivo pueden contener información personal.
- Esta ampliación de la exposición de PII se reconcilia con AUD-NG-145 (sanitización de logs); no se crea un ID separado para la misma dimensión de redacción.

### 6. Bitácoras de eventos y correlación
- Las incompatibilidades de BitacoraTraceability/BitacoraTrazabilidad, el DTO de BitacoraEventos, la falta de instrumentación transversal, el registro manual sin productor y la sanitización de errorDetails ya están documentados en AUD-NG-145 y tareas relacionadas.
- No se crea un hallazgo duplicado para esos defectos. Se mantiene la distinción entre bitácora de eventos/correlación y el historial de cambios por entidad.

## Reconciliación y nuevo registro
- AUD-NG-145 se amplía como referencia para la redacción insuficiente de datos personales en los registros de auditoría; sus defectos de LogsSistema, BitacoraEventos y BitacoraTrazabilidad permanecen dentro de su alcance.
- TASK-049 cubre el encadenamiento criptográfico de decisiones de workflow, no el historial genérico de entidades.
- Nuevo AUD-NG-224 (Alto/P1): HistorialCambiosEntidad mezcla esquemas incompatibles y carece de integridad/versionado verificable; las consultas no reconstruyen de forma fiable los cambios compartidos.
- Nueva TASK-504: unificar contrato y persistencia del historial de entidades, normalizar/migrar filas existentes, eliminar escritores ad hoc, garantizar actor verificado y correlación, incorporar versión y evidencia de integridad verificable, hacer visibles los fallos de escritura, aplicar sanitización coherente, asegurar RBAC/ABAC y paginación, y añadir pruebas de regresión para USER/ACADEMIC/UI.

## Pruebas y limitaciones
- Ejecutadas: inspección estática de código, búsqueda de referencias/call sites, comparación de SHA y contraste de productores/consumidores.
- No ejecutadas: pruebas HTTP, lectura de hojas productivas, concurrencia real, alteración controlada de registros, deployments Apps Script ni suites automatizadas. No se afirma que la persistencia productiva haya sido probada.
- tests/regression/academic-grading-suite.js no contiene aserciones específicas para recordEntityChangeLog, getEntityAuditHistory ni compatibilidad de esquemas de HistorialCambiosEntidad.

## Continuidad
- Progreso: 78/183 identificadores auditados; 105 pendientes.
- Siguiente tarea oficial: TAREA-F4-P1-07 - Implementar gestión institucional de roles, cargos, departamentos y asignaciones.
- Código fuente sin modificar.
- Archivos documentales previstos para esta iteración: Auditoria.txt, MapaDependencias.md, AUDITORIA_COMPLETADAS_PLAN.md, Contexto_personal.txt, Pendientes.md y este informe.
- Rama base sin cambios.
- Commit de cierre: el commit que contiene este checkpoint.
