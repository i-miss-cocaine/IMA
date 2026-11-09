# AUDITORÍA TÉCNICA - TAREA-F6-010: Administración segura de logs y comandos operativos

**Fecha:** 2026-11-07  
**Repositorio:** i-miss-cocaine/IMA  
**Rama:** NG_beta_0.0.0.1_work  
**Checkpoint inicial:** C1.226  
**Checkpoint de cierre:** C1.227  
**Sesión:** IMA-AUDIT-20261107-2240Z  
**Dictamen:** **NO CUMPLE**  
**Estado histórico en completadas.md:** [X] (se conserva sin modificación).

> Esta auditoría también cubre TAREA-F6-035, que repite el título y amplía los criterios de TAREA-F6-010 con cola asíncrona, cancelación, idempotencia y permisos específicos por comando. Ambos registros están marcados [X] y carecían de informe individual. Se crean informes por ID, pero comparten un único bloque canónico F6-010-A01..A06.

## 1. Continuidad y fuentes

- HEAD inicial: d28540e54020f7a7a0faee89db8e8466cd562d8d (C1.226), rama NG_beta_0.0.0.1_work.
- Comparación anterior con NG_beta_0.0.0.1: 294 commits adelante, 0 detrás. La rama base no se modifica.
- completadas.md SHA f57f1aef832e81e44fc4f7ec36a852d50e464676:
  - TAREA-F6-010 [X], líneas 2781-2804; CA-054..CA-057.
  - TAREA-F6-035 [X], líneas 3694-3722; mismo título y alcance ampliado con CA-096..CA-102/CA-159.
- Pendientes.md recuperado desde blob SHA 631b4c2dbf0e86d5704b63625382d73ccb8ceb3c: 1.803.672 bytes, 1.782.094 caracteres, 20.182 líneas, sin U+FFFD. No contiene F6-010/F6-035; conserva AUD-NG-145, AUD-NG-082 y AUD-NG-086. No se modificó.
- ChangesLogs.txt SHA 5b5cff1926b73a05d1b92087a7bf4b2db75326ff, líneas 1983-1987 afirma que ALLOWED_OPERATIONAL_COMMANDS/getCentralizedLogs/executeOperationalCommand implementan la gestión segura. El catálogo existe, pero el lector y ejecutor devuelven datos/resultados simulados.
- No existían AUDITORIAS/AUDITORIA_COMPLETADAS_TAREA-F6-010.md ni AUDITORIAS/AUDITORIA_COMPLETADAS_TAREA-F6-035.md; se crean ambos.
- Antecedentes: AUD-NG-145 (logs/DTO/filtros/muestras), AUD-NG-082 (fallback authRole), AUD-NG-086 (trazabilidad), AUD-NG-083 (correlationId/HMAC). Se amplían, no se duplican.

## 2. Archivos y evidencia inspeccionados

- backend/developer-service/Code.gs SHA 8aa4bac67cfe5c8c54da51a0784a56fef633e412:
  - ALLOWED_OPERATIONAL_COMMANDS/getCentralizedLogs/executeOperationalCommand:2353-2415.
  - ROLE_PERMISSIONS y doPost:29, 150-180, 2240-2310.
  - getCentralServiceRegistry/updateServiceStatus/auditInterServiceCalls:2415-2584.
- backend/user-service/Code.gs SHA 12079dd410aa6d8afbce55a4bc62a79dea605f9f:
  - getRetentionPolicies/saveRetentionPolicy/executeDataRetentionPolicyCheck:2120-2270.
  - dispatcher de retención/purga:1390-1400 y 1524.
  - checkAndRegisterIdempotencyKey/saveIdempotentResult:1290-1355.
  - purgeStructuredLogs:7967-7990.
- js/developer.js SHA 6fa4c4bd9be580c974b1fbede4f0cf79485dc331:
  - loadStructuredLogs/renderStructuredLogsTable:194-290.
  - botón de mantenimiento: línea 478.
- js/api.js SHA 6b24f666db30a811a8e9b38d466fc6001cf6dfa9:
  - logStructuredEvent:255-282.
  - runMaintenance:310.
- developer-dashboard.html SHA 2b69f1bf7ffbbe4902e81de14d6315cedb035a1e:
  - filtros de logs y tabla:270-330.
  - botón Mantenimiento Preventivo: sección 5, alrededor de 340-380.

## 3. Hallazgos

### H1 - CRÍTICO/P0: getCentralizedLogs no consulta logs reales ni persiste resolución
- getCentralizedLogs (developer-service:2363-2385) crea dos sampleLogs hardcodeados con IDs LOG-1001/LOG-1002 y timestamps de la solicitud.
- service/severity solo se copian en esos dos objetos; el parámetro search no se usa.
- Si se envía resolveLogId, devuelve status success/resolvedAt sin localizar el log, cambiar un estado ni guardar historial.
- No consulta LogsSistema, BitacoraEventos ni las bitácoras de otros servicios.
**Impacto:** no hay consulta multi-servicio ni resolución auditable. CA-054/CA-096 no se cumplen. Se amplía AUD-NG-145.

### H2 - CRÍTICO/P0: la purga elimina todos los logs del sistema sin respetar retención ni inmutabilidad
- purgeStructuredLogs (user-service:7967-7990) valida que verifiedRole sea Administrador o Desarrollador, pero luego elimina todas las filas de LogsSistema con deleteRows(2,lastRow-1).
- No recibe fecha de corte, categoría, tipo temporal/protegido, confirmationToken ni segundo factor de confirmación.
- No crea backup previo ni preserva registros críticos/legales; el evento LOGS_PURGED se registra después de borrar el historial.
- Las políticas de retención están en PoliticasRetencionDatos, pero purgeStructuredLogs no las consulta.
- executeDataRetentionPolicyCheck solo purga filas antiguas de BitacoraEventos para AUDIT_LOGS y conserva WARN/CRITICAL, no protege de forma general todos los registros de auditoría; la purga directa de LogsSistema ignora ese control.
- saveRetentionPolicy permite modificar accion/preservacionLegal de categorías como STUDENT_EXPEDIENTS/FINANCIAL_RECORDS sin impedir que un administrador cambie una categoría legalmente protegida a PURGE.
- En executeDataRetentionPolicyCheck, las categorías legales se contabilizan como itemsArchived++ sin mover ni crear un archivo real.
**Impacto:** registros de auditoría pueden desaparecer sin selección temporal ni archivo verificable. CA-055/CA-097/CA-098 no se cumplen.

### H3 - ALTO/P1: el catálogo cerrado existe, pero los comandos no ejecutan operaciones reales
- ALLOWED_OPERATIONAL_COMMANDS define DIAGNOSTIC_HEALTH_CHECK, STORAGE_CAPACITY_CHECK, CREATE_SYSTEM_BACKUP, PURGE_TEMPORARY_LOGS, RECONCILE_STALE_TRANSACTIONS y FLUSH_EXPIRED_CACHE.
- executeOperationalCommand valida que command esté en la lista, lo cual sí bloquea comandos desconocidos y código libre.
- No existe un switch/dispatcher de handlers para ejecutar cada comando; parameters se recibe pero no se utiliza.
- Todos los comandos permitidos devuelven status success/result.success=true y un outputMessage que afirma que se ejecutaron, aunque no se llama a health check, backup, purge, reconciliation ni cache flush.
- PURGE_TEMPORARY_LOGS no llama a purgeStructuredLogs ni a executeDataRetentionPolicyCheck.
**Impacto:** CA-056/CA-099 cumple la restricción de catálogo cerrado, pero la función operativa anunciada es simulada.

### H4 - CRÍTICO/P0: no hay cola asíncrona, cancelación ni estados de ejecución
- No se encontraron estructuras/funciones de commandQueue, enqueue, process, retry, cancel o command history.
- executeOperationalCommand genera TASK-CMD-<timestamp> y devuelve inmediatamente; no persiste la solicitud ni un estado Pendiente/EnProceso/Completada/Fallida/Cancelada.
- No hay checkpoints de pasos, reintentos, cancelación segura ni recuperación de una operación parcial.
- runSystemMaintenance no existe en user-service ni en developer-service; sin embargo, js/api.js lo invoca y js/developer.js lo usa desde el botón Mantenimiento Preventivo. La acción no tiene case/function en el backend USER.
**Impacto:** CA-101 no se cumple y el botón de mantenimiento no tiene implementación backend.

### H5 - ALTO/P1: idempotencia de comandos y permisos específicos no están implementados
- executeOperationalCommand no llama checkAndRegisterIdempotencyKey ni guarda resultado idempotente; cada invocación genera un nuevo taskId con Date.now.
- Hay helpers de idempotencia en USER/ACADEMIC/ACCOUNTING, pero no están integrados en el ejecutor de DEVELOPER.
- ROLE_PERMISSIONS autoriza executeOperationalCommand por rol general Desarrollador; no hay mapa command -> permiso ni validación distinta para backup, purga, almacenamiento, reconciliación o flush.
- La validación del developer-service conserva el fallback authRole del payload documentado en AUD-NG-082.
**Impacto:** reintentos pueden duplicar operaciones cuando se implementen handlers y el rol general no satisface el permiso específico por comando. CA-102/CA-159 no se cumplen.

### H6 - ALTO/P1: solicitante, parámetros, resultado y correlationId no se guardan en una bitácora de comandos
- executeOperationalCommand devuelve executedBy tomado de payload.userId o el literal Desarrollador; no deriva el actor de identidad verificada dentro del handler.
- executedAt, taskId, command y correlationId solo aparecen en la respuesta; no se escriben en una tabla de historial.
- parameters no se conserva; no hay servicio/área objetivo, duración, resultado real, error ni transición de estado persistida.
- correlationId se genera aleatoriamente si falta, pero no se integra a HMAC/traceability.
**Impacto:** CA-057/CA-100 no se cumplen. Se amplía AUD-NG-086 y AUD-NG-083.

### H7 - ALTO/P1: el dashboard no administra purga, resolución ni cola de comandos
- El panel de logs consulta USER/getStructuredLogs y tiene filtros, pero estos ya están desalineados con el DTO y no ofrecen registros multi-servicio reales.
- No existe control para marcar un log real como resuelto, ver historial de resolución, archivar, purgar temporales con confirmación ni consultar/cancelar comandos.
- El botón Mantenimiento Preventivo llama a runSystemMaintenance, acción inexistente.
- La UI no muestra estados pendientes/fallidos/completados ni el resultado real de los comandos.
**Impacto:** CA-054/CA-096/CA-097/CA-101 no se cumplen.

## 4. Matriz de requisitos

### TAREA-F6-010 (R1-R6, CA-054..CA-057)
| Requisito | Dictamen | Motivo |
|---|---|---|
| R1 consulta/filtro multi-servicio | No cumple | getCentralizedLogs devuelve dos muestras; dashboard consulta USER solamente. |
| R2 marcar revisado/resuelto sin borrar | No cumple | resolveLogId devuelve éxito sin persistir estado/historial. |
| R3 purga/archivo seguro temporal vs protegido | No cumple | purgeStructuredLogs borra todo LogsSistema; no hay archivo real. |
| R4 catálogo cerrado sin código libre | Cumple | allowlist bloquea comandos fuera de catálogo; no hay eval/Function. |
| R5 cola asíncrona, cancelación e idempotencia | No cumple | no hay cola, estados, cancelación ni idempotencia en comandos. |
| R6 permisos específicos por comando | No cumple | autorización general por rol Desarrollador. |
| CA-054 | No cumple | consulta/archivo/resolución son simulados o parciales. |
| CA-055 | No cumple | purga no preserva logs protegidos. |
| CA-056 | Cumple | catálogo cerrado de comandos. |
| CA-057 | No cumple | no existe historial persistente de ejecución. |

### TAREA-F6-035 (alcance ampliado, CA-096..CA-102 y CA-159)
| Criterio | Dictamen | Motivo |
|---|---|---|
| CA-096 consulta y filtra logs desde dashboard | Parcial | hay UI, pero no es multi-servicio y muestra datos simulados/filtros rotos. |
| CA-097 limpieza con autorización y confirmación | Parcial | verifica rol, pero no solicita confirmación explícita ni token. |
| CA-098 limpieza no elimina auditoría protegida | No cumple | purgeStructuredLogs borra todas las filas de LogsSistema. |
| CA-099 comandos en catálogo permitido | Cumple | allowlist cerrada. |
| CA-100 registra solicitante/servicio/fecha/resultado/error | No cumple | respuesta efímera, sin persistencia y actor del payload. |
| CA-101 distingue pendientes/fallidas/completadas | No cumple | no hay cola ni estados. |
| CA-102 repetición no duplica efectos | No cumple | no hay clave/resultado idempotente en comandos. |
| CA-159 permisos específicos por comando | No cumple | solo permiso general de rol. |

## 5. Reconciliación con auditorías existentes

No se crean IDs globales AUD-NG nuevos:
- AUD-NG-145: DTO/filtros/logs simulados y resolución no persistente.
- AUD-NG-082: fallback authRole del developer-service.
- AUD-NG-086: trazabilidad no integrada.
- AUD-NG-083: correlationId/HMAC no integrado.
- La idempotencia existente en USER/ACADEMIC/ACCOUNTING no cubre el ejecutor de comandos.
- TAREA-F6-035 amplía F6-010; ambos informes referencian un solo bloque canónico de tareas.

## 6. Tareas ejecutables derivadas de los hallazgos

Los siguientes IDs son locales a esta auditoría. TAREA-F6-035 referencia este mismo bloque.

### F6-010-A01 - Implementar consulta real y resolución persistente de logs multi-servicio
- **Origen:** H1 y H7.
- **Prioridad:** P1 / Alto.
- **Acción:** consultar bitácoras reales de todos los servicios; filtrar por servicio/severidad/fecha/categoría/correlationId; persistir estado de revisión/resolución como evento separado sin editar el log original.
- **Criterios:** no hay sampleLogs; resolución conserva actor/fecha/motivo; la bitácora original es inmutable.
- **Referencias:** AUD-NG-145 y AUD-NG-086.
- **Estado:** Pendiente.

### F6-010-A02 - Separar logs temporales y auditorías protegidas con retención segura
- **Origen:** H2.
- **Prioridad:** P0 / Crítico.
- **Acción:** clasificar logs temporales, técnicos, de seguridad y auditoría legal; impedir PURGE para categorías protegidas; aplicar políticas de retención con fecha de corte, backup, preview, confirmación y archivo verificable.
- **Criterios:** purgeStructuredLogs no borra todo; categorías legales no pueden desprotegerse por configuración ordinaria; toda purga conserva manifiesto y auditoría inmutable.
- **Estado:** Pendiente.

### F6-010-A03 - Implementar handlers reales para el catálogo cerrado
- **Origen:** H3.
- **Prioridad:** P1 / Alto.
- **Acción:** asociar cada comando permitido con un handler explícito y validado; validar parameters y ámbito; integrar diagnóstico, capacidad, backup, purga temporal, reconciliación y cache flush.
- **Criterios:** cada comando produce un efecto verificable; si no hay handler, se rechaza y no devuelve success; no se admite código libre.
- **Estado:** Pendiente.

### F6-010-A04 - Crear cola durable de operaciones administrativas
- **Origen:** H4.
- **Prioridad:** P1 / Alto.
- **Acción:** persistir commandId, estado, paso, progreso, solicitante, parámetros, error, correlationId y timestamps; procesar de forma asíncrona con cancelación segura y reanudación.
- **Criterios:** estados Pendiente/EnProceso/Completada/Fallida/Cancelada; cancelación solo en puntos seguros; el dashboard puede consultar y cancelar tareas autorizadas.
- **Estado:** Pendiente.

### F6-010-A05 - Integrar idempotencia y permisos por comando
- **Origen:** H5 y H6.
- **Prioridad:** P0 / Crítico.
- **Acción:** exigir idempotencyKey para operaciones mutables; almacenar firma de parámetros/resultado; definir permisos por comando y ámbito; derivar actor de token verificado; no confiar en authRole/userId del payload.
- **Criterios:** repetir clave con mismo payload devuelve resultado previo; payload distinto rechaza; permisos se verifican por operación y recurso; cada decisión queda auditada.
- **Referencias:** AUD-NG-082 y AUD-NG-083.
- **Estado:** Pendiente.

### F6-010-A06 - Completar dashboard y pruebas de seguridad/retención
- **Origen:** H1, H2, H4 y H7.
- **Prioridad:** P1 / Alto.
- **Acción:** implementar consulta/resolución/archivo/purga confirmada y consola de comandos con historial, progreso y cancelación; corregir runSystemMaintenance o eliminar su botón; probar roles, retención, inmutabilidad, fallos e idempotencia.
- **Criterios:** ninguna acción ficticia; los controles reflejan estado persistido; auditoría protegida sobrevive a purga; pruebas cubren Administrador/Desarrollador y denegaciones.
- **Estado:** Pendiente.

## 7. Cierre
- TAREA-F6-010: NO CUMPLE.
- TAREA-F6-035: NO CUMPLE; mismo módulo con criterios ampliados.
- Ambos estados [X] de completadas.md se conservan como histórico.
- Pendientes.md se recuperó desde el blob íntegro y no se modificó.
- Se crean informes individuales para ambos IDs con un único bloque canónico F6-010-A01..A06.
- No se modificó código, políticas, logs ni datos productivos.
- No se ejecutaron purgas, mantenimiento, comandos ni cambios de retención en producción.
- Siguiente tarea secuencial: TAREA-F6-011 y su registro ampliado TAREA-F6-036, respaldos independientes y recuperación por área.

## 8. Referencias
- completadas.md SHA f57f1aef832e81e44fc4f7ec36a852d50e464676, líneas 2781-2804 y 3694-3722.
- Pendientes.md blob SHA 631b4c2dbf0e86d5704b63625382d73ccb8ceb3c.
- ChangesLogs.txt SHA 5b5cff1926b73a05d1b92087a7bf4b2db75326ff, líneas 1983-1987.
- backend/developer-service/Code.gs SHA 8aa4bac67cfe5c8c54da51a0784a56fef633e412.
- backend/user-service/Code.gs SHA 12079dd410aa6d8afbce55a4bc62a79dea605f9f.
- js/developer.js SHA 6fa4c4bd9be580c974b1fbede4f0cf79485dc331.
- js/api.js SHA 6b24f666db30a811a8e9b38d466fc6001cf6dfa9.
- developer-dashboard.html SHA 2b69f1bf7ffbbe4902e81de14d6315cedb035a1e.
