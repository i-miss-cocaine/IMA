# Plan maestro de auditoría - completadas.md

**Fecha de inicio:** 2026-11-04  
**Repositorio:** i-miss-cocaine/IMA  
**Rama de trabajo:** NG_beta_0.0.0.1_work  
**Rama base protegida:** NG_beta_0.0.0.1  
**HEAD inicial de trabajo:** aa234f7ae36ea8aa305253b40df8c2d7090c7ff2  
**HEAD base verificado:** 44d9891132332e692dbe2ba8602b41f50a508a59

## 1. Alcance e inventario

Se auditará el registro \`completadas.md\`, independiente de \`completadas_legacy.md\`.

- Archivo: 5,963 líneas; SHA Git del contenido de referencia: \`f57f1aef832e81e44fc4f7ec36a852d50e464676\`.
- Encabezados de tareas: 251.
- Identificadores únicos: 224.
- Hay identificadores repetidos, en particular el conjunto T-UX-01 a T-UX-27 aparece en más de una sección/versión. Se deben contrastar ambas descripciones y resolver cuál es la versión ampliada vigente, sin eliminar registros ni asumir que la repetición equivale a una tarea nueva.
- El resumen ejecutivo y las marcas [X] del documento son afirmaciones del registro, no evidencia de implementación.
- No modificar, reordenar, normalizar ni corregir \`completadas.md\`.

## 2. Reglas obligatorias

1. Aplicar íntegramente \`METODOLOGIA_DESARROLLO.md\`, SHA de referencia \`1a2d4de602a1449b697c2da82ab6423e7c61b280\`.
2. Auditoría manual: inspección archivo por archivo, función por función, variable por variable, flujo por flujo y dependencia por dependencia. No usar escáneres, scripts masivos ni validadores automáticos para decidir cumplimiento.
3. Antes de inspeccionar cada archivo de código, registrar su SHA/blob Git como copia de respaldo inmutable. No modificar código durante esta fase. Al terminar cada archivo, comparar su estado contra ese SHA; si hubiera diferencias, restaurar y documentar.
4. Contrastar todos los puntos del alcance y criterios de aceptación de cada tarea. Los comentarios, nombres de funciones, UI, wrappers, mocks y marcas de estado no son prueba de ejecución.
5. Seguir la ruta completa frontend -> API -> router -> función backend -> almacenamiento/servicio externo -> respuesta/UI. Comprobar permisos, integridad, errores, concurrencia, idempotencia, rendimiento, mantenibilidad y regresiones.
6. Considerar sustituciones y ampliaciones posteriores. Relacionar hallazgos con tareas actuales de \`Pendientes.md\` y \`Auditoria.txt\`; no duplicar una causa raíz ya registrada, pero sí ampliar evidencia/alcance cuando sea necesario.
7. Registrar cada hallazgo nuevo en \`Auditoria.txt\` y convertirlo en tarea concreta en \`Pendientes.md\`. Actualizar \`MapaDependencias.md\` y este plan por lote.
8. No cambiar estados de tareas históricas ni declarar una tarea completa por inferencia.
9. Todos los cambios de la tarea/iteración completa se agrupan en **un único commit final**, siempre en \`NG_beta_0.0.0.1_work\`. No hacer commits atómicos, por archivo ni intermedios. No dividir una entrega para eludir límites/cuotas: si no se puede confirmar el conjunto completo en un commit, detenerse sin commits parciales. No hacer merge, no modificar la rama base, no alterar \`ChangesLogs.txt\` por ser auditoría sin cambios de código.

## 3. Respaldo inicial y referencias

- \`completadas.md\`: blob SHA \`f57f1aef832e81e44fc4f7ec36a852d50e464676\`; respaldo de referencia íntegro.
- \`METODOLOGIA_DESARROLLO.md\`: blob SHA \`1a2d4de602a1449b697c2da82ab6423e7c61b280\`; instrucciones de auditoría.
- \`Contexto_personal.txt\`: blob SHA \`36db8632556a5fc46054f16224e65b6b11855404\`.
- \`MapaDependencias.md\`: blob SHA \`c7cda1f2026c2325749cb701d2fdaf9e545e95cc\`.
- \`AUDITORIA_COMPLETADAS_LEGACY_PLAN.md\`: blob SHA \`c47380f92a43488dcb4a41319dba348cbd1072b7\`.
- HEAD inicial de la rama de trabajo: \`aa234f7ae36ea8aa305253b40df8c2d7090c7ff2\`.
- HEAD de la rama base: \`44d9891132332e692dbe2ba8602b41f50a508a59\`.

Para cada archivo de código y documento que se audite se registrará su propio blob SHA antes de leerlo, como pivote de comparación y restauración. Las referencias Git son inmutables; no se escribirá en los archivos originales durante la inspección.

## 4. División de trabajo

| Lote | Alcance en completadas.md | Líneas aproximadas | Estado |
|---|---|---:|---|
| C0 | AUDIT-CR-01 a 04 y verificación de estructura/duplicados | 22-41 | Pendiente |
| C1 | Fase 1: TAREA-01 a TAREA-20 y prioridades P0-P3 | 42-1428 | Pendiente |
| C2 | Fase 2, Fase 3 y Fase 4 (incluye registros T-UX repetidos y FASE2) | 1429-1817 | Pendiente |
| C3 | Fase 5: admisiones, aspirantes y portal de familias | 1818-2465 | Pendiente |
| C4 | Fases 6 y 7: tareas migradas, registro dual, microservicios y planificación | 2466-4757 | Pendiente |
| C5 | Fase 8: dashboards dinámicos, roles, modularización y Spreadsheets | 4758-5445 | Pendiente |
| C6 | Fase 9: SACE, calificaciones, evaluaciones y resultados académicos | 5446-5963 | Pendiente |

La división en lotes es únicamente para organizar el análisis; no autoriza múltiples commits dentro de una misma entrega. Al cerrar cada tarea/iteración se agrupan todos sus archivos en un único commit final. No subdividir commits por tamaño, archivo o cuota. Si el conjunto completo no puede publicarse en un solo commit, detenerse sin commits parciales y documentar el bloqueo. Cada commit final debe dejar un checkpoint exacto de tareas revisadas, archivos inspeccionados, SHA de respaldo, evidencia y siguiente punto.

## 5. Criterios de dictamen

- **Cumple:** todos los requisitos verificables están implementados, conectados y cuentan con evidencia suficiente.
- **Cumple parcialmente:** hay implementación real, pero faltan criterios, existen fallos o la cobertura es incompleta.
- **No cumple:** no existe implementación funcional o la ruta está desconectada.
- **No verificable:** el requisito depende de despliegue, credenciales, servicios externos o pruebas que no están disponibles; no se convierte en éxito por falta de evidencia.

La calidad se dictamina por separado del cumplimiento funcional.

## 6. Estado y checkpoint inicial

- Auditoría de \`completadas_legacy.md\`: cerrada previamente (49/49); no se repite.
- Auditoría de \`completadas.md\`: iniciada, 0/183 identificadores únicos auditados; inventario estructural realizado.
- Primera tarea a auditar: AUDIT-CR-01, contrastando su afirmación de implementación en \`backend/user-service/Code.gs\` con el código actual.
- No se han añadido hallazgos ni se ha modificado código.
- Próxima acción: auditar C0 manualmente y registrar resultados por evidencia; después continuar C1.

## 7. Control de continuidad

Al reanudar:
1. Verificar HEAD de ambas ramas y confirmar que la rama base no cambió.
2. Leer este plan, \`Contexto_personal.txt\`, \`METODOLOGIA_DESARROLLO.md\`, \`Pendientes.md\`, \`Auditoria.txt\` y \`MapaDependencias.md\`.
3. Continuar desde el último checkpoint confirmado, sin repetir lotes cerrados.
4. Mantener los identificadores y estados históricos de \`completadas.md\` intactos.


## 8. Resultados del lote C0 (2026-11-04)

- Alcance: AUDIT-CR-01 a AUDIT-CR-04.
- Resultado: las cuatro tareas cumplen su alcance específico en el código actual.
- Evidencia: backend/user-service/Code.gs:839-843; js/ui-common.js:4709-4720, 4758-4847 y 4935-5000.
- Hallazgos nuevos: ninguno; Auditoria.txt y Pendientes.md permanecen sin cambios.
- Observación: las referencias de línea de completadas.md son históricas y han cambiado en el código actual.
- Pruebas: inspección estática/manual; no se ejecutó navegador ni Apps Script.
- Progreso: 4/183 identificadores únicos auditados; 179 pendientes.
- Siguiente lote: C1, iniciar por TAREA-01.
- Código fuente y completadas.md: sin modificaciones.

## 9. Resultado parcial del lote C1.1 - TAREA-01 (2026-11-04)

- Dictamen: Cumple parcialmente.
- Evidencia: js/auth.js:140-165 no conserva sessionToken en currentUser; js/api.js:45-57 envía requesterUserId/requesterRole del almacenamiento local, pero no sessionToken. USER emite el token en backend/user-service/Code.gs:2479-2537 y getUserVerifiedRole lo verifica, pero el frontend no completa el contrato.
- Controles parciales: existen validadores HMAC/RBAC en los cinco servicios, con identidades derivadas de claims cuando el token llega.
- Incumplimientos ya registrados: AUD-NG-001, AUD-NG-002, AUD-NG-003, AUD-NG-004, AUD-NG-005, AUD-NG-112, TASK-085, TASK-142 y TASK-418.
- Hallazgo nuevo: AUD-NG-159. USER/logoutUser es público y permite revocar sesiones de userId/sessionId arbitrarios.
- No verificable desde el repositorio: identidad de ejecución y permisos efectivos del despliegue Apps Script; requieren inspección de configuración del despliegue. Tampoco se ejecutaron pruebas reales de origen/CSRF.
- Inventario corregido: 231 declaraciones; 183 identificadores únicos. C0: 4/183; con TAREA-01: 5/183 auditados, 178 pendientes.
- Siguiente tarea: FASE2-T01; continuar con el resto del lote C1 y auditar individualmente las ampliaciones posteriores F4.

## 10. Resultado del lote C1.2 - FASE2-T01 (2026-11-04)

- Dictamen: Cumple parcialmente.
- Evidencia: existen validadores HMAC/RBAC y derivación de identidad desde claims; el frontend no conserva ni transmite sessionToken (AUD-NG-001); TASK/EXAM mantienen consultas sensibles en PUBLIC_ACTIONS (AUD-NG-002); el claim role se emite por 24 horas y no se compara con el rol vigente (nuevo AUD-NG-160).
- Hallazgos vinculados: AUD-NG-001 a AUD-NG-005, AUD-NG-013, AUD-NG-112, AUD-NG-159, TASK-048, AUD-NG-083, AUD-NG-084 y AUD-NG-086.
- Hallazgos nuevos de la auditoría de completadas.md: AUD-NG-159 y AUD-NG-160.
- Progreso: 6/183 identificadores únicos auditados; 177 pendientes.
- Siguiente registro: FASE2-T02.
- Pruebas de integración y despliegue: no ejecutadas.


## 11. Resultado del lote C1.3 - FASE2-T02 (2026-11-04)

- Dictamen: Cumple parcialmente.
- Evidencia principal: js/api.js/fetchApi reintenta solicitudes POST sin clasificar la semántica de la acción ni generar una clave estable; ACADEMIC y ACCOUNTING aceptan claves opcionales y almacenan resultados en CacheService después de ejecutar, sin reserva atómica. El TTL es de 21,600 segundos.
- Controles parciales: recordStudentPayment consulta claves/referencias en PagosAbonos; createAdmissionRequest usa LockService y deduplicación natural; createStudentEnrollment bloquea y devuelve matrículas activas existentes para el mismo estudiante/año.
- Hallazgos existentes vinculados: AUD-NG-006 (idempotencia por operación en cliente/API) y AUD-NG-133 (idempotencia atómica de pagos).
- Hallazgo nuevo: AUD-NG-161. runCriticalProcessConcurrencySuite (ACCOUNTING:10505-10550) no prueba concurrencia ni unicidad; marca PASSED a partir de conteos, consulta TransaccionesCobro en lugar de PagosAbonos y no cubre matrícula ni planilla.
- Informe: AUDITORIA_COMPLETADAS_FASE2_T02.md.
- Archivos inspeccionados y SHA de respaldo: js/api.js 6b24f666db30a811a8e9b38d466fc6001cf6dfa9; backend/academic-service/Code.gs daf1883ec0b8d4f0ff2bc673af8a4e8c5bbd03fc; backend/accounting-service/Code.gs 38b979d41596b85e888b4a7060b37bbac0840a28.
- Progreso: 7/183 identificadores únicos auditados; 176 pendientes.
- Código fuente y completadas.md: sin modificaciones. ChangesLogs.txt sin cambios.
- Pruebas concurrentes, pérdida de respuesta, navegador y despliegue productivo: no ejecutadas.
- Siguiente registro: T-UX-01, inmediatamente después de FASE2-T02 en completadas.md.

 
## 12. Resultado del lote C1.5 - TAREA-02 (2026-11-05)

- **Tarea auditada:** TAREA-02 - Consolidar la matriz maestra de requisitos, dependencias y pruebas.
- **Dictamen:** Cumple parcialmente.
- **Evidencia:** MapaDependencias.md contiene relaciones parciales, pero no la matriz maestra descrita en ChangesLogs.txt. README.md es descriptivo y no relaciona requisitos con criterios, pruebas, evidencias, estados, prioridades y tareas de resolución. El documento AUDITORIA_FASE1_PLANIFICACION_EXPANSION.md no está presente en la raíz actual.
- **Hallazgo nuevo:** ninguno. La causa ya está registrada en AUD-NG-010; se amplía su alcance en Pendientes.md. AUD-NG-011 se mantiene como dependencia relacionada.
- **Calidad:** insuficiente por fragmentación documental, ausencia de estructura uniforme y discrepancia entre el changelog histórico y el artefacto actual.
- **Integridad:** se recuperó Auditoria.txt desde el último snapshot íntegro anterior (commit b2e1f4fa036edfb4028972230eb37e25341dd437), conservando los registros históricos anteriores, y se anexaron AUD-NG-159 a AUD-NG-162 y este resultado.
- **Progreso:** 9/183 identificadores únicos auditados; 174 pendientes.
- **Archivos fuente y completadas.md:** sin modificaciones. ChangesLogs.txt sin cambios.
- **Pruebas:** inspección estática/manual de documentación; no se ejecutaron pruebas de código ni de despliegue.
- **Siguiente tarea:** TAREA-03.


## 13. Resultado del lote C1.6 - TAREA-03 (2026-11-05)

- **Tarea auditada:** TAREA-03 - Implementar supervisión operativa y prevención de agotamiento de cuotas.
- **Dictamen:** Cumple parcialmente.
- **Evidencia:** js/api.js no contiene OPERATIONAL_HEALTH_METRICS ni getServiceHealthMetrics, aunque ChangesLogs.txt los atribuye a esta tarea. USER tiene agregaciones parciales sobre BitacoraTrazabilidad/LogsSistema; ACADEMIC usa capacityUsagePct fijo de 15.5%; TASK mide puntualmente Drive; EXAM mide filas y latencia de lectura. No hay telemetría uniforme ni alertas preventivas verificables.
- **Hallazgo nuevo:** AUD-NG-163, para métricas reales de cuotas/capacidad, alertas y checkpoints generales. Se vincula con AUD-NG-144/AUD-NG-145, AUD-NG-006/AUD-NG-069, AUD-NG-133 y AUD-NG-161 sin duplicar sus alcances.
- **Calidad:** insuficiente; implementación fragmentada y discrepancia entre el changelog y el código vigente.
- **Progreso:** 10/183 identificadores únicos auditados; 173 pendientes.
- **Archivos fuente y completadas.md:** sin modificaciones. ChangesLogs.txt sin cambios.
- **Pruebas:** inspección estática/manual; no se ejecutaron pruebas de carga, cuotas, concurrencia, reanudación ni despliegue.
- **Siguiente tarea:** TAREA-05. TAREA-04 no aparece como identificador único en completadas.md entre TAREA-03 y TAREA-05.


## 14. Reconciliación AUD-NG-163 (2026-11-05)
- AUD-NG-163 se identificó como duplicado de tareas existentes y se marcó como tal en Pendientes.md.
- Cobertura: TASK-064 (cuotas/capacidad/alertas); AUD-NG-144/AUD-NG-145 (health checks/bitácora); AUD-NG-006/AUD-NG-069/AUD-NG-133/AUD-NG-161 (reintentos/idempotencia/pruebas); TASK-154/TASK-227/TASK-265 (checkpoints y reanudación).
- Se conserva el registro histórico, sin ejecutarlo por separado. TAREA-03 sigue CUMPLE PARCIALMENTE; 10/183.


## 15. Resultado del lote C1.7 - TAREA-05 (2026-11-05)

- Tarea auditada: consolidar la arquitectura de servicios por departamento y la administración de cuentas.
- Dictamen: Cumple parcialmente.
- Evidencia: ChangesLogs.txt solo atribuye a TAREA-05 los mapas SERVICE_VERSIONS y DEPARTMENT_SERVICES_MAP en js/config.js. SERVICE_REGISTRY tiene versiones contradictorias, recursos placeholder y estados ACTIVE no verificados; ACCOUNTING/DEVELOPER mantienen endpoint placeholder. Los cinco servicios backend comparten SPREADSHEET_ID. deployAcademicMicroserviceInstance registra una fila y devuelve PASS/Activo sin deployment real.
- Hallazgos nuevos: ninguno. Se amplían AUD-NG-075/076/077, AUD-NG-078/079/080/081/082, AUD-NG-083/084/085/086, AUD-NG-131/AUD-NG-144 y TASK-064.
- Calidad: insuficiente; no se documentan/verifican identidades reales de administración/ejecución, ACL de recursos, continuidad de cuentas, Shared Drives ni comunicación interservicio real.
- Progreso: 11/183; 172 pendientes.
- Pruebas: inspección estática; sin pruebas entre deployments ni inspección de Google Workspace productivo.
- Siguiente tarea: TAREA-06.


## 16. Resultado del lote C1.8 - TAREA-06 (2026-11-05)

- Tarea auditada: completar la gestión institucional de carpetas y permisos documentales.
- Dictamen: Cumple parcialmente.
- Evidencia: TASK y USER usan tryLock sin comprobar adquisición; ACCOUNTING y ACADEMIC crean carpetas sin bloqueo; EXAM no tiene helper equivalente. Las búsquedas son por nombre y no existe catálogo común de IDs estables. USER/ACCOUNTING/TASK contienen enlaces o carpetas ANYONE_WITH_LINK. USER/ACCOUNTING hacen fallback silencioso a la raíz de Drive.
- Hallazgos nuevos: ninguno. Se amplían AUD-NG-154/155, AUD-NG-058, TASK-139/140/143/295/345/346 y TASK-149/150/456.
- Calidad: insuficiente por implementación fragmentada, concurrencia no garantizada, rutas no canónicas y permisos públicos.
- Pruebas: inspección estática; no se ejecutaron pruebas de concurrencia, permisos heredados ni acceso anónimo.
- Progreso: 12/183; 171 pendientes.
- Siguiente tarea: TAREA-07.


## 17. Resultado del lote C1.9 - TAREA-07 (2026-11-05)

- Tarea auditada: implementar una estrategia integral de almacenamiento, conservación y recuperación.
- Dictamen: Cumple parcialmente.
- Evidencia: createSystemBackup guarda hojas JSON, no binarios. computeSimpleHash no es SHA-256; verifyBackupIntegrity acepta cualquier checksum no vacío; restoreSystemBackup no verifica antes de escribir y limpia hojas completas. La retención de expedientes/finanzas solo incrementa un contador; no se acreditan triggers, alertas ni RPO/RTO.
- Hallazgos nuevos: ninguno. Se amplían AUD-NG-146, TASK-151/152, TASK-087/251, TASK-079, TASK-149/150, TASK-064 y TASK-345.
- Calidad: insuficiente por integridad débil, restauración sin validación previa, falta de binarios y retención incompleta.
- Pruebas: inspección estática; no se ejecutaron pruebas de corrupción, restore, retención ni recuperación.
- Progreso: 13/183; 170 pendientes.
- Siguiente tarea: TAREA-08.


## 18. Resultado C1.10 - TAREA-08 (2026-11-05)
- Dictamen: CUMPLE PARCIALMENTE. Cliente declara 12 áreas/8 departamentos; backend inicializa 7 áreas distintas y mantiene catálogos departamentales paralelos. Asignaturas/planes/ofertas tienen metadatos y validaciones incompletos; la interfaz docente no integra el CRUD curricular.
- Hallazgo nuevo: AUD-NG-164, catálogo curricular maestro y relaciones con planes/ofertas.
- Tareas relacionadas: TASK-005, AUD-NG-011/018/093/108/111/113/115/117 y TASK-153.
- Progreso: 14/183; 169 pendientes. Siguiente: TAREA-09.


## 19. Resultado C1.11 - TAREA-09 (2026-11-05)
- Dictamen: CUMPLE PARCIALMENTE. CURRICULAR_SPECIALIZED_SERVICES es un mapa estático de 12 claves/herramientas; no hay deployments ni endpoints por área. fetchApi no usa el mapa. deployAcademicMicroserviceInstance registra metadatos y marca PASS/Activo sin deployment real; runCurricularAreaServiceTests devuelve PASS constante. createTask/createExam no persisten areaId.
- Hallazgos nuevos: ninguno. Se amplía AUD-NG-011; relacionados AUD-NG-078/079/083/084/086/131/144 y AUD-NG-164.
- Recomendar revaluación de AUD-NG-011 de Observación a Alto (P1). Progreso 15/183; 168 pendientes. Siguiente: TAREA-10.


## 20. Reparación de integridad de Pendientes.md (2026-11-05)
- Se detectó que la actualización inicial de TAREA-09 había guardado solo un fragmento de 478 caracteres.
- Se restauró el contenido íntegro previo (1,515,247 caracteres), se conservó AUD-NG-164 y se agregó la ampliación de AUD-NG-011.
- Reparación documental en commit separado; sin borrar registros ni reescribir commits.


## 21. Resultado C1.12 - TAREA-10 (2026-11-05)
- Dictamen: CUMPLE PARCIALMENTE. El servicio contiene creación, borradores, versiones, comentarios y rúbricas básicas, pero no acredita tareas grupales/recurrentes, límites de intentos, comprobantes persistidos/idempotencia ni revisión parcial. getSubmissionComments expone comentarios privados y getSubmissionVersions no verifica propiedad por entregaId.
- Hallazgo nuevo: AUD-NG-165, privacidad y acceso contextual a comentarios/versiones.
- Se amplían AUD-NG-149/121/152/124/158/002. Progreso 16/183; 167 pendientes. Siguiente: TAREA-11.


## 22. Resultado C1.13 - TAREA-11 (2026-11-05)
- Dictamen: CUMPLE PARCIALMENTE. Banco básico con filtros, pero sin validación de esquema/referencias. createExam no persiste los campos declarados de Examenes/PreguntasExamen; la UI solo cubre cinco familias; submitExam ignora puntos, no implementa revisión manual/parcial y no aplica fechas/duración/intentos/idempotencia. localStorage solo recupera en el mismo navegador; no se acredita analítica psicométrica.
- Hallazgo nuevo: AUD-NG-166. Se amplían AUD-NG-121/124/006/011/002/158.
- Calidad: insuficiente; desalineación entre esquemas y escrituras, validación débil y contratos incompletos. Revisión estática/manual; sin pruebas funcionales ni de permisos/concurrencia.
- Progreso: 17/183; 166 pendientes. Siguiente: TAREA-12.


## 23. Resultado C1.14 - TAREA-12 (2026-11-05)
- Dictamen: CUMPLE PARCIALMENTE. Hay cálculo ponderado, categorías, rúbricas, competencias, recuperaciones, cierre/revisión y rectificación, pero el libro usa claves globales evaluacionId+userId, mezcla periodos/asignaturas, y la UI recalcula con porcentajes hardcodeados. El cálculo unificado confía en flags del cliente y admite pesos inválidos; rúbricas/competencias no validan esquema ni se integran en la UI. Cierre/publicación no filtra el contexto completo y no exige revisión; rectificación/reapertura no tienen autorización específica verificable. Recuperación usa CAT-GLOBAL; boletines consultan tablas legacy y se marcan oficiales por periodoId, sin SACE verificable.
- Hallazgo nuevo: AUD-NG-167. Se amplían AUD-NG-002 y AUD-NG-158; AUD-NG-124 conserva su alcance de historial de entregas.
- Calidad: insuficiente por fuentes de datos incompatibles, pesos duplicados, claves incompletas y máquina de estados no protegida.
- Pruebas: inspección estática/manual; no se ejecutaron pruebas de navegador, Apps Script, concurrencia, permisos, datos reales, SACE ni despliegue.
- Progreso: 18/183; 165 pendientes. Siguiente: TAREA-13.


## 24. Resultado C1.15 - TAREA-13 (2026-11-05)
- Dictamen: CUMPLE PARCIALMENTE. Hay jefaturas, asignación a áreas/ofertas, sustituciones, preferencias de carga y motor de conflictos. Sin embargo, getDepartmentAcademicPlanning consulta OfertasAcademicas mientras getAcademicOffers/createAcademicOffer usan OfertaAcademica; getClassSchedules interpreta Estado/UltimaModificacion como grado/sección; createTeacherSubstitution usa índices incorrectos para buscar y comprobar horarios. Carga y ocupación no filtran por año y mezclan estados; la interfaz no integra asignación docente por área y el resumen de vacantes no representa bien docentes compartidos/sustitutos.
- Hallazgo nuevo: AUD-NG-168. Se amplían AUD-NG-164 y AUD-NG-158 sin duplicar catálogo curricular ni ABAC.
- Calidad: insuficiente por divergencia de fuentes, esquema de horarios inconsistente y comprobación de sustituciones/carga no fiable.
- Pruebas: inspección estática/manual; no se ejecutaron pruebas con datos reales, concurrencia, múltiples docentes, periodos, permisos ni despliegue.
- Progreso: 19/183; 164 pendientes. Siguiente: TAREA-14.


## 25. Resultado C1.16 - TAREA-14 (2026-11-05)
- Dictamen: CUMPLE PARCIALMENTE. El panel del estudiante unifica tareas/exámenes y estados, y el docente navega entregas por contexto; existen caché, indicador online/offline y cola local. No obstante, fetchEntregasRecientes no tiene contenedor ni llamada, solo consulta tareas y ordena por fecha de entrega; los filtros docentes se basan en GLOBAL_SCOPE general. El cache-first se reemplaza por error al fallar la red, queueOfflineAction no está integrado en mutaciones académicas, la resolución de conflictos solo muestra éxito y el indicador no verifica servicios. Hay controles clicables sin semántica de teclado/ARIA y el formulario no se adapta por área; WCAG 2.2 AA no está demostrado.
- Hallazgo nuevo: AUD-NG-169. Se amplían AUD-NG-126, AUD-NG-158, TASK-065, TASK-129 y TASK-130, sin duplicar sus alcances.
- Calidad: insuficiente para aceptación integral por falta de bandeja docente conectada, recuperación offline real y accesibilidad funcional.
- Pruebas: inspección estática/manual; no se ejecutaron pruebas de navegador, dispositivos táctiles, lectores de pantalla, red desconectada, sincronización ni despliegue.
- Progreso: 20/183; 163 pendientes. Siguiente: TAREA-15.


## 26. Resultado C1.17 - TAREA-15 (2026-11-05)
- **Dictamen:** CUMPLE PARCIALMENTE.
- **Evidencia:** getServiceHealthReport agrega logs pero fija versiones 1.0.0, no agrupa por servicio/ventana ni mide latencia. El panel ui-common consume getServiceHealthMetrics no definida y muestra cero/verde; el health check cubre servicios incorrectos/incompletos, ping declara dbConnected:true y fetchApi ignora timeout de 6s. requestId/correlationId no se propagan desde fetchApi ni se guardan en LogsSistema; el sobre interservicio está declarado pero no integrado. No hay alertas preventivas deduplicadas demostradas.
- **Reconciliación:** no crear AUD-NG-170; ampliar AUD-NG-131, AUD-NG-144, AUD-NG-145, AUD-NG-083 y TASK-064; pruebas aisladas vinculadas a AUD-NG-161. AUD-NG-163 permanece duplicada/consolidada.
- **Calidad:** insuficiente para aceptar la supervisión institucional integral.
- **Pruebas:** inspección estática/manual; no se ejecutaron health checks productivos, caída de servicios, cuotas, alertas, trazabilidad distribuida ni recuperación/rollback.
- **Archivos fuente e históricos:** sin modificaciones en código, completadas.md, completadas_legacy.md, ChangesLogs.txt o METODOLOGIA_DESARROLLO.md.
- **Progreso:** 21/183 identificadores auditados; 162 pendientes.
- **Siguiente tarea exacta:** TAREA-16, entrada inmediatamente posterior a TAREA-15 en completadas.md.


## 27. Resultado C1.19 - TAREA-16 (2026-11-05)
- Dictamen: CUMPLE PARCIALMENTE; calidad insuficiente para aceptación integral.
- Evidencia: runCriticalProcessConcurrencySuite adquiere un lock y marca pagos/CUV PASSED por conteo; consulta TransaccionesCobro aunque recordStudentPayment escribe PagosAbonos. runConcurrencyAndConsistencySuite solo prueba una adquisición/liberación. recordStudentPayment carece de lock propio y la reserva de caché no es atómica. createStudentEnrollment y generateSchoolDocument sí usan lock; registerStudentEnrollment, submitAssignment y submitExam no. Las suites inspeccionadas son textuales y no acreditan estrés HTTP ni aislamiento de caché por rol/cuenta.
- Reconciliación: no crear AUD-NG nuevo. Ampliar AUD-NG-006, AUD-NG-133, AUD-NG-161 y AUD-NG-009.
- Calidad: insuficiente por ausencia de pruebas concurrentes reales y brechas en pagos, entregas y exámenes.
- Pruebas: inspección estática/manual; no se ejecutaron pruebas HTTP, Apps Script, fixtures, concurrencia real, caché caliente/fría ni despliegue.
- Progreso: 22/183 identificadores auditados; 161 pendientes.
- Siguiente tarea: TAREA-17.


## 28. Resultado C1.20 - TAREA-17 (2026-11-05)
- **Dictamen:** CUMPLE PARCIALMENTE; analítica contextual y exportación institucional no acreditadas.
- **Evidencia:** getCurricularAnalyticsReport calcula un agregado global y no aplica filtros area/asignatura/grado/programa/periodo; excluye borradores/no publicadas del promedio. La tabla fuente CalificacionesEstudiantes no contiene dimensiones curriculares directas y la función no realiza joins. El controlador teacher.js llama con payload vacío, pero teacher-dashboard.html no contiene el modal. RBAC permite la acción a Director/Admin, no Coordinador/Profesor. Las alertas usan mockFailingSubjects/mockMissingTasks, no filtran asistencia por año/período y su deduplicationKey omite año lectivo. REP-ACAD-01 interpreta columnas incorrectas, ignora filtros y genera filas ficticias si no hay datos. El exportador docente usa parcial actual y asigna cero a entregas ausentes.
- **Reconciliación:** no crear AUD-NG nuevo. Ampliar TASK-050/051/052/054/235/237, AUD-NG-167, AUD-NG-158 y F11-Task08.
- **Calidad:** insuficiente para aceptar comparativas homogéneas, alertas académicas reales y exportación analítica confiable.
- **Pruebas:** inspección estática/manual; no se ejecutaron endpoints, fixtures, pruebas de roles, exportaciones ni notificaciones.
- **Progreso:** 23/183 identificadores auditados; 160 pendientes.
- **Siguiente tarea:** TAREA-18.


## 29. Resultado C1.21 - TAREA-18 (2026-11-05)
- Dictamen: CUMPLE PARCIALMENTE; versionado, relaciones interdisciplinarias y UI no acreditados.
- Evidencia: el catálogo filtra parcialmente; manageReusableResource solo inserta filas, no versiona ni actualiza; proyectos guardan departamentos como texto y año 2026 fijo, sin recursos asociados; teacher.js busca un modal ausente; autorId procede del cliente; tabla usa innerHTML con campos controlables y URL sin validar; no hay pruebas específicas.
- Hallazgo nuevo: AUD-NG-171 (P2), catálogo reutilizable, versionado y relaciones proyecto-recurso. AUD-NG-170 permanece sin asignar por decisión específica de TAREA-15.
- Reconciliación: ampliar AUD-NG-164, AUD-NG-158 y TASK-296.
- Calidad: insuficiente para aceptar reutilización interdisciplinaria con permisos y preservación histórica.
- Pruebas: inspección estática/manual; no se ejecutaron CRUD, versionado, ACL, Drive ni pruebas XSS en navegador.
- Progreso: 24/183 identificadores auditados; 159 pendientes. Siguiente tarea: TAREA-19.


## 30. Resultado C1.22 - TAREA-19 (2026-11-05)
- Dictamen: **NO CUMPLE**. Solo existe un esqueleto nominal de equivalencias/prevalidación; no hay migración real ni rollback.
- Evidencia: getCurricularEquivalences ignora PlanesEstudio/PlanAsignaturas y marca todas las asignaturas del catálogo como equivalencias exactas consigo mismas. executeCurricularMigration no usa equivalenciasMap, solo cuenta filas y detecta algunos campos vacíos; no detecta duplicados/huérfanos, no modifica datos ni compara antes/después. En modo REAL devuelve success con modificacionesEfectuadas=0. No existe snapshot ni rollback curricular. El modal no está en teacher-dashboard y el endpoint está limitado a Director/Admin, aunque el controlador está en teacher.js.
- Hallazgo nuevo: AUD-NG-172 (P1), migración curricular transaccional con prevalidación y rollback verificable.
- Reconciliación: AUD-NG-164 (planes/catálogo), AUD-NG-167 (notas/boletines), TASK-078 (rollback/delta), AUD-NG-158 (RBAC) y TASK-296 (renderizado seguro).
- Pruebas: inspección estática/manual; no se ejecutaron migraciones, fixtures, snapshots ni rollback.
- Progreso: 25/183 identificadores auditados; 158 pendientes.
- Siguiente tarea: TAREA-20.


## 31. Resultado C1.23 - TAREA-20 (2026-11-05)
- **Dictamen:** CUMPLE PARCIALMENTE. Existe registro básico y baja lógica, pero no se acredita incorporación operativa de un servicio ni activación segura.
- **Evidencia:** registerCurricularAreaExtension solo exige areaId/name/code y sobrescribe la fila sin lock/versionado. runCurricularAreaServiceTests devuelve PASS constantes y activa. toggleCurricularAreaStatus permite activar directamente. deployAcademicMicroserviceInstance registra metadatos y PASS/Activo sin crear/verificar deployment; después llama al registro que deja el área PendientePruebas. getAcademicAreaTemplateCatalog siembra siete áreas Activo sin pruebas. js/config.js mantiene catálogos estáticos con IDs diferentes; fetchApi solo enruta SERVICE_URLS[service]. La baja no sincroniza deployments/asignaciones/coordinaciones ni demuestra preservación histórica.
- **Reconciliación:** no crear AUD-NG nuevo. Ampliar AUD-NG-011, AUD-NG-164 y AUD-NG-158.
- **Calidad:** parcial; los componentes nominales existen, pero onboarding, despliegue, pruebas, permisos por área y ciclo de vida son incompletos o simulados.
- **Pruebas:** inspección estática/manual; no se ejecutaron endpoints, deployments, RBAC, fixtures ni consultas históricas.
- **Progreso:** 26/183 identificadores auditados; 157 pendientes.
- **Siguiente tarea:** FASE2-T17.


## 32. Resultado C1.24 - FASE2-T17 (2026-11-05)
- **Dictamen:** CUMPLE PARCIALMENTE. Hay constantes de versión y un comparador nominal, pero no existe compatibilidad operativa ni historial/rollback verificable.
- **Evidencia:** SERVICE_VERSIONS declara cinco servicios 1.0.0 y omite DEVELOPER; SERVICE_REGISTRY declara seis v8.4.0. getSharedConfigVersion y getSharedConfigurationsCatalog devuelven 2.0.0 fijo; backend health y catálogo devuelven versiones 1.0.0 fijas. validateServiceVersionCompatibility ignora patch y acepta 1.0.0 con mínimo 1.0.1; servicios desconocidos/versiones inválidas caen a 1.0.0. fetchApi no negocia versión ni consulta catálogo. saveSystemConfiguration sobrescribe y fija versión 1.0, sin historial/locking; getSystemConfigurations omite versión/fecha/actor. FLUSH_GLOBAL solo registra evento. schemaVersion de fuentes se devuelve sin comparar contrato.
- **Reconciliación:** no crear AUD-NG nuevo. Ampliar TASK-062, AUD-NG-077 y AUD-NG-078.
- **Calidad:** parcial; hay metadatos nominales, pero no control real de compatibilidad, evolución histórica ni reversión.
- **Pruebas:** inspección estática/manual; no se ejecutaron API, sesiones obsoletas, concurrencia, sincronización ni rollback.
- **Progreso:** 27/183 identificadores auditados; 156 pendientes.
- **Siguiente tarea:** FASE2-T18.


## 33. Resultado C1.25 - FASE2-T18 (2026-11-05)
- **Dictamen:** CUMPLE PARCIALMENTE. Existen ping y métricas backend separados, pero el tablero institucional no los integra y puede declarar saludable sin telemetría.
- **Evidencia:** openInstitutionalHealthDashboardModal busca getServiceHealthMetrics; no se encontró definición en ui-common.js/api.js/developer.js. Si no existe en otro módulo cargado, usa cero y marca todos los servicios operativos. No llama al monitor ni al backend; muestra hora local, sin latencia/colas/dependencias/filtros. checkAllMicroservicesHealth solo incluye USER/ACADEMIC/TASK/EXAM; TASK/EXAM no implementan ping, ACCOUNTING sí pero se omite, DEVELOPER no prueba recursos. USER/ACADEMIC ping devuelven dbConnected fijo. developer.js considera ONLINE una respuesta success incluso si state=Degradado. fetchApi ignora timeout:6000 y fija 60 s. getOperationalCapacityMetrics no tiene ventana temporal/colas y devuelve OPTIMO sin datos; DTO incompatible con UI e INT-04. getServiceHealthDiagnostics tiene PASS fijos y es público; getTraceabilityCorrelationLogs no filtra periodo/tipo ni sanea errorDetails.
- **Reconciliación:** no crear AUD-NG nuevo. Ampliar AUD-NG-144, AUD-NG-145, AUD-NG-007, AUD-NG-008 y TASK-064. AUD-NG-163 permanece duplicada/consolidada.
- **Calidad:** parcial; health checks y métricas existen de forma fragmentada, sin tablero confiable ni atribución integral de incidentes.
- **Pruebas:** inspección estática/manual; no se ejecutaron pings, caídas, latencia, cuotas, filtros, roles ni colas.
- **Progreso:** 28/183 identificadores auditados; 155 pendientes.
- **Siguiente tarea:** FASE2-T19.


## 34. Resultado C1.26 - FASE2-T19 (2026-11-05)
- **Dictamen:** CUMPLE PARCIALMENTE. Hay cachés con TTL y algunas invalidaciones correctas, pero las políticas declaradas no gobiernan el runtime, existen rutas de invalidación sin efecto, una caché de permisos puede recurrir a permisos estáticos ante fallo de fuente, las delegaciones expiradas pueden seguir autorizando hasta 300 s y COMM_REQ_ no separa resultados por identidad. IndexedDB no aplica TTL ni expone obsolescencia.
- **Evidencia:** USER Code.gs contiene acct_state_ (60 s), revoked_user_/revoked_session_ (21600 s), active_delegations_ (300 s), dynamic_permissions_matrix (600 s), IDEM_USER_ (21600 s), REPLAY_REQ_ (300 s) y COMM_REQ_ (600 s). CACHE_POLICIES declara roles 6 h, catálogos 12 h, permisos 1 h y finanzas sin caché, pero no se integra con fetchApi/PersistenceManager. FLUSH_GLOBAL solo registra; INVALIDATE_USER ignora el resultado; purgeSecurityCaches no tiene definición local. manageAccountState, loginUser y registerUser(forceUpdate) no aseguran invalidación directa de acct_state_. La expiración automática de delegaciones no purga la entrada. La lectura fallida de matriz dinámica retorna null y el validador cae a ROLE_PERMISSIONS. createInstitutionalServiceRequest devuelve un hit COMM_REQ_ sin comprobar identidad/firma. PersistenceManager conserva updated_at pero no verifica TTL ni stale.
- **Reconciliación:** no crear AUD-NG nuevo. Ampliar AUD-NG-005, AUD-NG-160, AUD-NG-070, TASK-062, TASK-234 y TASK-400.
- **Calidad:** parcial; las optimizaciones puntuales no forman una política coherente y existen riesgos de autorización, privacidad y consistencia.
- **Pruebas:** inspección estática/manual; no se ejecutaron Apps Script, concurrencia, pruebas con dos usuarios, expiración, caídas de fuente, latencia ni cuotas.
- **Progreso:** 29/183 identificadores auditados; 154 pendientes.
- **Siguiente tarea:** T-UX-26.


## 35. Resultado C1.27 - T-UX-26 (2026-11-05)
- **Dictamen:** CUMPLE PARCIALMENTE. El bloque de actividad reciente existe en js/ui-common.js, pero no se encontró integración en dashboards principales ni productores de eventos reales. El filtro por rol no aísla cuentas, la clave localStorage es global, targetId no es consumido para abrir el registro y el render usa innerHTML para título/descripción.
- **Reconciliación:** nuevo AUD-NG-173 para integración y navegación; ampliar TASK-067 por aislamiento multiusuario. TASK-221 sigue siendo la fuente de verdad de tareas accionables.
- **Calidad:** funciones aisladas y etiquetadas, pero sin integración de extremo a extremo; riesgo de exposición de actividad al cambiar de usuario y falta de navegación al registro concreto.
- **Pruebas:** inspección estática de js/ui-common.js, dashboards principales, ChangesLogs.txt y suite modular; no se ejecutaron pruebas de navegador ni multiusuario.
- **Progreso:** 30/183 identificadores auditados; 153 pendientes.
- **Siguiente tarea:** T-UX-27.


## 36. Resultado C1.28 - T-UX-27 (2026-11-05)
- **Dictamen:** CUMPLE PARCIALMENTE / INSUFICIENTE. Solo se identifica renderUIProgressSkeleton; no hay consumidores encontrados, medición general de operaciones UI ni deduplicación de solicitudes. El debounce de Omnibox es puntual. fetchApi ignora options.timeout y conserva 60 s aunque checkMicroserviceHealth pide 6 s.
- **Reconciliación:** no crear AUD-NG nuevo. Ampliar TASK-252 (telemetría cliente), TASK-429 (skeleton/debounce/deduplicación segura) y AUD-NG-007 (timeout real).
- **Calidad:** helper aislado, sin ciclo de vida de carga; no hay evidencia de mejora medible.
- **Pruebas:** inspección estática de 24 archivos JS, dashboards principales, api.js, ui-common.js, ChangesLogs y suite modular. No se ejecutaron benchmarks ni pruebas de red lenta/dispositivos reales.
- **Progreso:** 31/183 identificadores auditados; 152 pendientes.
- **Siguiente tarea:** TAREA-17.


## 37. Resultado C1.29 - FASE2-01 (2026-11-05)
- **Dictamen:** NO CUMPLE. Helpers HMAC no conectados a doPost ni a llamadas reales; USER→TASK usa JSON plano; cinco servicios comparten SPREADSHEET_ID; resolver dinámico parcial; fallback de secreto determinista; pruebas de arquitectura locales/estáticas sin E2E.
- **Reconciliación:** ampliar AUD-NG-083, AUD-NG-084, AUD-NG-086 y TASK-046. TASK-048 figura completada pero sus checks de tráfico autenticado/rotación no están sustentados; no crear AUD-NG nuevo.
- **Calidad:** arquitectura declarativa, no protocolo operativo; aislamiento de datos y autenticación entre servicios no acreditados.
- **Pruebas:** inspección estática/manual; no se ejecutaron llamadas HTTP entre deployments, rotación de claves ni pruebas de aislamiento multi-cuenta.
- **Progreso:** 32/183 identificadores auditados; 151 pendientes.
- **Siguiente tarea:** FASE2-02.


## 38. Resultado C1.30 - FASE2-02 (2026-11-05)
- **Dictamen:** CUMPLE PARCIALMENTE. textResponse en Academic/Accounting aporta status/timestamp/código genérico, pero fetchApi no valida esquema, usa fallback success/data:[] para ciertas lecturas y no normaliza errores. validateApiContractsTestSuite es local, limitada y acepta status:error como PASS; no hay suite equivalente en Accounting.
- **Reconciliación:** nuevo AUD-NG-174. AUD-NG-007 mantiene timeout y limpieza de temporizadores. FASE2-T03 aporta helper parcial, no cierre E2E.
- **Calidad:** contrato incompleto; fallos pueden confundirse con resultados vacíos y las pruebas pueden dar falsos positivos.
- **Pruebas:** inspección estática; no se ejecutaron HTTP real, fallos de red, pruebas de navegador ni contratos de Accounting.
- **Progreso:** 33/183 identificadores auditados; 150 pendientes.
- **Siguiente tarea:** FASE2-03.


## 39. Resultado C1.31 - FASE2-03 (2026-11-05)
- **Dictamen:** CUMPLE PARCIALMENTE. El resolver académico existe pero no resuelve la clave compuesta ni valida disponibilidad/esquema, conserva fallback al Spreadsheet principal y no está integrado de forma general. El catálogo académico mapea mal el estado de asignaturas, no filtra inactivos y el cliente disfraza fallos como éxito con datos estáticos.
- **Reconciliación:** ampliación de TASK-046; nuevo AUD-NG-175 para contrato y sincronización de catálogos. No duplicar AUD-NG-083, AUD-NG-084 ni AUD-NG-086.
- **Calidad:** riesgo de lecturas desde partición incorrecta, aceptación de referencias inactivas y divergencia silenciosa entre catálogo remoto y local.
- **Pruebas:** inspección estática/manual; no se ejecutaron pruebas automatizadas, HTTP real, navegador ni consultas productivas.
- **Progreso:** 34/183 identificadores auditados; 149 pendientes.
- **Siguiente tarea:** FASE2-04.


## 40. Resultado C1.32 - FASE2-04 (2026-11-05)
- **Dictamen:** CUMPLE PARCIALMENTE, con brechas críticas. ID documental basado en timestamp; esquema de hoja de ocho encabezados frente a quince campos; correlativo sin segmentación anual; fallback CUV sin revalidar unicidad; verificación pública expone datos internos y no comprueba vigencia.
- **Reconciliación:** ampliar TASK-118 y TASK-351. Mantener AUD-NG-059 (hash binario), AUD-NG-061 (certificado) y AUD-NG-161 (concurrencia y pruebas). No crear AUD-NG duplicado.
- **FASE2-T05:** generador institucional duplicado entre User y Academic; Academic admite skipLock desde payload; Accounting no lo integra en emisión documental.
- **Calidad:** contrato de persistencia inconsistente, identidad actor/titular mezclada y respuesta pública no minimizada.
- **Pruebas:** inspección estática/manual; no se ejecutaron HTTP, Apps Script, concurrencia real ni operaciones productivas.
- **Progreso:** 35/183 identificadores auditados; 148 pendientes.
- **Siguiente tarea:** FASE2-05 - Mecanismo Atómico de Sincronización, LockService e Idempotencia.


## 41. Resultado C1.33 - FASE2-05 (2026-11-05)
- **Dictamen:** CUMPLE PARCIALMENTE. Los helpers de idempotencia son check-then-save en CacheService, el cliente no genera claves y varias escrituras críticas carecen de lock; las suites no demuestran concurrencia real.
- **Reconciliación:** ampliar AUD-NG-006, AUD-NG-129, AUD-NG-133 y AUD-NG-161. No crear AUD-NG duplicado.
- **Implementaciones posteriores:** FASE2-T02 y FASE2-T06 están marcadas completadas, pero su código no acredita reserva atómica, idempotencia automática ni pruebas conductuales.
- **Progreso:** 36/183 identificadores auditados; 147 pendientes.
- **Siguiente tarea:** FASE2-06 - Motor de Eventos Inter-Módulo y Despacho Multicanal.
## 42. Resultado C1.34 - FASE2-06 (2026-11-05)
- **Dictamen:** NO CUMPLE INTEGRALMENTE. El motor ejecuta antes de persistir, deduplica de forma no atómica, no aplica maxRetries/backoff ni integra productores interservicio; las capacidades multicanal son parciales.
- **Reconciliación:** nuevos AUD-NG-176 y AUD-NG-177; tareas TASK-474 (outbox durable, productores, recuperación y pruebas aisladas) y TASK-475 (secretos de proveedores y saneamiento HTML). Ampliar AUD-NG-006 y AUD-NG-161 sin duplicar su alcance transversal.
- **Implementaciones posteriores:** FASE2-T07, FASE2-T14 y F10-Task12 no acreditan despacho interdepartamental robusto, canales externos reales ni pruebas conductuales seguras.
- **Calidad:** efectos secundarios antes del registro durable; reintentos sin reserva ni clave estable; configuración de canales no conectada al emisor; suite que puede operar sobre datos reales y reportar éxito con fallos.
- **Pruebas:** inspección estática/manual; no se ejecutaron Apps Script, HTTP, triggers, concurrencia, envío de correos, llamadas a proveedores ni operaciones productivas.
- **Progreso:** 37/183 identificadores auditados; 146 pendientes.
- **Siguiente tarea:** FASE2-07 - Supervisión de Cuotas Operativas, Paginación y Plan de Crecimiento.

 
===============================================================================
CHECKPOINT C1.35 - AUDITORÍA FASE2-07 (2026-11-05)
===============================================================================
- Rama: NG_beta_0.0.0.1_work. HEAD de partida: 99801144c1b7f373e49fde6bfefecb9821da9074. Rama base NG_beta_0.0.0.1: 44d9891132332e692dbe2ba8602b41f50a508a59, sin cambios.
- Tarea: FASE2-07 - Supervisión de Cuotas Operativas, Paginación y Plan de Crecimiento.
- Dictamen: NO CUMPLE INTEGRALMENTE. T09 parcial, T10 parcial y T12 parcial.
- Evidencia: js/api.js carece de instrumentación OPERATIONAL_HEALTH_METRICS; USER agrega trazas manuales sin cobertura transversal; el panel de salud usa getServiceHealthMetrics no definida; ACADEMIC fija 15.5% de capacidad; paginación backend lee hojas completas; renderPaginatedTable no tiene consumidores localizados; la evaluación de migración solo mide getLastRow y aplica 50,000 filas/2,000 ms.
- Reconciliación: ampliar TASK-064 y TASK-429, mantener AUD-NG-144/AUD-NG-145/AUD-NG-007/AUD-NG-008/AUD-NG-161; no reabrir AUD-NG-163. Hallazgo nuevo AUD-NG-178 para crecimiento/migración transaccional.
- La propuesta de tarea para AUD-NG-178 queda pendiente de registrar en Pendientes.md porque la API devolvió contenido vacío en lecturas completas y por rangos para el archivo de 1.62 MB; no se sobrescribió el backlog.
- Informe: AUDITORIA_COMPLETADAS_FASE2-07.md. Auditoria.txt y MapaDependencias.md se actualizarán en el mismo commit.
- Archivos fuente inspeccionados: js/api.js SHA 6b24f666db30a811a8e9b38d466fc6001cf6dfa9; js/ui-common.js SHA 986938b8a311a41ed4cb3d135b66b6aaea4bed67; USER SHA 12079dd410aa6d8afbce55a4bc62a79dea605f9; ACADEMIC SHA daf1883ec0b8d4f0ff2bc673af8a4e8c5bbd03fc; ACCOUNTING SHA 38b979d41596b85e888b4a7060b37bbac0840a28; TASK SHA 1437756a3c3d3d97e06bc1ff21c8e2ca2b2dccbe; EXAM SHA 1d93296628fae31f680004f637897e2b1314a64c.
- Pruebas: inspección estática/manual; no se ejecutaron Apps Script, HTTP, pruebas de cuota, carga, benchmarks, concurrencia ni migraciones. No se usaron datos productivos.
- Progreso: 38/183 identificadores auditados; 145 pendientes.
- Última tarea auditada: FASE2-07. Siguiente: recuperar íntegramente Pendientes.md, verificar duplicados y registrar la remediación de AUD-NG-178; luego identificar el siguiente ID completado no auditado.
===============================================================================


## GATE OBLIGATORIO DE ITERACIÓN, COMMIT ÚNICO Y CHECKPOINT

Estas reglas son condición de inicio y cierre para todo trabajo de esta auditoría:

- Antes de trabajar, leer Contexto_personal.txt completo, METODOLOGIA_DESARROLLO.md completa, este plan y el último checkpoint; verificar HEAD de NG_beta_0.0.0.1_work y NG_beta_0.0.0.1. No continuar si existe contradicción o checkpoint no validado.
- Todos los cambios de una iteración completa (incluidos todos los archivos documentales, de auditoría y de control) deben publicarse en exactamente un commit final. Prohibidos commits por archivo, commits atómicos, commits intermedios y dividir por subtarea/lote/tamaño/cuota. Solo el usuario puede autorizar expresamente más de un commit.
- La revisión total del diff se realiza antes de crear ese único commit. Si no es posible publicar el conjunto completo, detenerse sin commits parciales.
- Antes de cualquier pausa, cierre, transferencia, interrupción o bloqueo se agrega un checkpoint acumulativo en Contexto_personal.txt. No se puede cerrar la iteración ni responder como trabajo terminado si no se preparó el checkpoint.
- El checkpoint debe indicar HEAD de partida, ramas, último ID terminado, tarea en curso, siguiente tarea exacta, archivo/función/rango de continuidad, evidencia/SHA, pruebas reales, archivos cambiados, bloqueos y acción siguiente. El commit final se identifica como el que contiene el checkpoint y su SHA se confirma consultando el HEAD tras publicarlo (no se intenta autorreferenciar dentro del propio archivo).
- Después del commit se verifican SHA, árbol, archivos incluidos, HEAD de trabajo y que la rama base siga intacta. No hacer un segundo commit para completar el checkpoint.



## 43. Resultado C1.36 - FASE2-T03 (2026-11-05)
- **Dictamen:** CUMPLE PARCIALMENTE. Existen textResponse en Academic/Accounting y suite parcial en Academic; no hay contratos completos por endpoint, inventario de consumidores, validación transversal, versionado ni pruebas conductuales de compatibilidad.
- **Evidencia:** js/api.js SHA 6b24f666db30a811a8e9b38d466fc6001cf6dfa9; Academic SHA daf1883ec0b8d4f0ff2bc673af8a4e8c5bbd03fc; Accounting SHA 38b979d41596b85e888b4a7060b37bbac0840a28; User SHA 12079dd410aa6d8afbce55a4bc62a79dea605f9. La suite validateApiContractsTestSuite cubre cuatro acciones locales y acepta status:error como PASS; fetchApi no valida esquemas y produce falsos éxitos de fallback.
- **Reconciliación:** ampliar AUD-NG-174; no duplicar AUD-NG-007, AUD-NG-006 ni AUD-NG-161.
- **Backlog:** recuperado Pendientes.md íntegro desde blob SHA 52a3215094b8bc28b494402c08c15186b5a3eef3; se registró TASK-476 para AUD-NG-178 y se amplió AUD-NG-174.
- **Pruebas:** inspección estática/manual. No se ejecutaron Apps Script, HTTP, navegador ni suites automatizadas.
- **Progreso:** 39/183 identificadores auditados; 144 pendientes.
- **Siguiente tarea:** FASE2-T04 - Establecer una fuente de verdad institucional para catálogos, configuraciones y referencias.


## 44. Resultado C1.37 - FASE2-T04 (2026-11-05)
- **Dictamen:** CUMPLE PARCIALMENTE. Hay almacenamiento académico y endpoints de catálogo, pero no existe fuente de verdad transversal: el cliente mantiene listas duplicadas, solo sincroniza áreas, los fallos se convierten en success y la validación de referencias no se integra en escrituras.
- **Evidencia:** completadas.md SHA f57f1aef832e81e44fc4f7ec36a852d50e464676; js/config.js SHA 49ef90807e5b9dfe1379f76d66efdb4ccd2b6cdc; Academic SHA daf1883ec0b8d4f0ff2bc673af8a4e8c5bbd03fc; User SHA 12079dd410aa6d8afbce55a4bc62a79dea605f9f. Estado de asignaturas leído desde índice incorrecto r[4] en lugar de r[5]; consultas sin filtro de inactivos; ALL devuelve objeto incompatible con validateCatalogReference; mutaciones no llaman validador; departmentId omitido; no hay historial de cambios.
- **Reconciliación:** ampliar AUD-NG-175. TASK-062 conserva versionado/invalidez; TASK-046 y AUD-NG-083/084/086 conservan resolución de fuentes; AUD-NG-158 conserva estado/ámbito de áreas.
- **Backlog:** se amplió AUD-NG-175 en Pendientes.md; no se creó un nuevo AUD-NG ni se modificó completadas.md.
- **Pruebas:** inspección estática/manual; no se ejecutaron Apps Script, HTTP, navegador, caché real ni operaciones productivas.
- **Progreso:** 40/183 identificadores únicos auditados; 143 pendientes.
- **Siguiente tarea:** FASE2-T05 - Unificar y validar el sistema de identificadores institucionales.


## 45. Resultado C1.40 - FASE2-T05 (2026-11-05)
- **Dictamen:** CUMPLE PARCIALMENTE; no satisface los criterios de aceptación.
- **Evidencia:** ACCOUNTING SHA 38b979d41596b85e888b4a7060b37bbac0840a28; ACADEMIC SHA daf1883ec0b8d4f0ff2bc673af8a4e8c5bbd03fc; USER SHA 12079dd410aa6d8afbce55a4bc62a79dea605f9f; completadas.md SHA f57f1aef832e81e44fc4f7ec36a852d50e464676.
- **Hallazgos:** generador duplicado USER/ACADEMIC; ScriptLock local no compartido; rutas ACADEMIC con skipLock sin lock exterior y bypass mediante isInternalCall; PersonaID/UserId/ExpedienteID sin validación referencial transversal; fallbacks constantes por entidad (EXP/STU/PER/USR/REL/INV/MAT/MOV-000001 y ADM-000001) y detección de duplicados mediante Observaciones; createPerson con PER-timestamp; validador que siempre marca formato válido; auditor de colisiones limitado a cuatro tablas; ACCOUNTING conserva ID documental timestamp, correlativo no segmentado por año y consulta CUV pública con datos internos.
- **Reconciliación:** ampliar TASK-118. Mantener TASK-351, AUD-NG-059, AUD-NG-061 y AUD-NG-161. No crear AUD-NG duplicado.
- **Backlog:** lectura convencional de Pendientes.md devolvió 0 caracteres. Recuperado el blob vigente del HEAD de la rama de trabajo: SHA 4bddbc2f2198d6e144c46674b79589207f624c21, 1,609,995 caracteres y 19,154 líneas. Se amplía TASK-118; no se restaura ni se reemplaza el archivo por una copia legacy.
- **Inventario corregido:** 476 IDs TASK únicos (TASK-001 a TASK-476), 173 IDs AUD-NG únicos (169 encabezados y 4 referencias sin encabezado: AUD-NG-170/176/177/178), total 649 IDs únicos. El checkpoint C1.38 había consignado 170 IDs AUD-NG; esta revisión exhaustiva corrige el conteo sin alterar el checkpoint histórico. El archivo legacy contiene 473 IDs TASK (TASK-001 a TASK-473), no 474 como se había consignado en C1.38.
- **Pruebas:** inspección estática/manual. No se ejecutaron Apps Script, HTTP, concurrencia real, suites automatizadas ni operaciones productivas.
- **Progreso:** 41/183 identificadores auditados; 142 pendientes.
- **Siguiente tarea:** FASE2-T06 - Corregir y formalizar la concurrencia y la consistencia entre servicios. Reconciliar C1.33/AUD-NG-161 antes de continuar para no repetir su alcance.


## 46. Resultado C1.41 - FASE2-T06 (2026-11-05)

- **Dictamen:** CUMPLE PARCIALMENTE; no satisface los criterios de aceptación.
- **Evidencia:** Academic SHA daf1883ec0b8d4f0ff2bc673af8a4e8c5bbd03fc; Accounting SHA 38b979d41596b85e888b4a7060b37bbac0840a28; completadas.md SHA f57f1aef832e81e44fc4f7ec36a852d50e464676.
- **Hallazgos:** helper withConcurrencyLock no integrado en operaciones reales; suites nominales ya cubiertas por AUD-NG-161; ScriptLock local sin coordinación entre proyectos; bypass skipLock/isInternalCall ya cubierto por TASK-118/AUD-NG-161; fallos de adquisición ignorados en checkEnrollmentCapacity y en el bloque presupuestario de recordAccountsPayableExpense (AUD-NG-179); recordPurchaseReceipt puede aplicar movimientos de inventario y fallar antes de registrar la recepción, permitiendo duplicación al reintentar (AUD-NG-180).
- **Reconciliación:** mantener AUD-NG-006, AUD-NG-023, AUD-NG-049, AUD-NG-129, AUD-NG-133, AUD-NG-161 y TASK-118. No duplicar pagos, matrícula legacy, bypasses ni pruebas nominales.
- **Backlog:** lectura convencional de Pendientes.md devolvió 0 caracteres. Se recuperó el blob del HEAD actual de la rama de trabajo: SHA 529615b34cb68477c3b04858fa4365c56bf25902, 1,613,270 caracteres y 19,165 líneas. El blob padre 4bddbc2f2198d6e144c46674b79589207f624c21 no fue utilizado como fuente; corresponde al commit padre. Se añadieron AUD-NG-179/TASK-477 y AUD-NG-180/TASK-478.
- **Inventario antes de añadir:** 476 IDs TASK, 173 IDs AUD-NG, 649 únicos. **Después de añadir:** 478 IDs TASK, 175 IDs AUD-NG, 653 únicos. Últimos IDs: TASK-478 y AUD-NG-180.
- **Pruebas:** inspección estática/manual. No se ejecutaron Apps Script, HTTP, concurrencia real, pruebas de pérdida de respuesta ni suites automatizadas; no se accedió a datos productivos.
- **Código fuente:** sin modificaciones. No se alteraron completadas.md, completadas_legacy.md, ChangesLogs.txt ni METODOLOGIA_DESARROLLO.md.
- **Progreso:** 42/183 identificadores auditados; 141 pendientes.
- **Siguiente tarea:** FASE2-T07 - Fortalecer el motor de eventos y la ejecución de procesos automáticos. No repetir FASE2-T06 salvo regresión o cambio posterior.


## 47. Resultado C1.42 - FASE2-T07 (2026-11-05)

- **Dictamen:** NO CUMPLE INTEGRALMENTE. La tarea figura [X], pero los criterios funcionales de eventos, reintentos, recuperación, preferencias y alertas no se demuestran.
- **Continuidad histórica:** C1.34/FASE2-06 ya había auditado el núcleo del motor y creó AUD-NG-176/TASK-474 y AUD-NG-177/TASK-475. Los SHAs de User/Academic/Accounting/Task siguen idénticos, por lo que los hallazgos persisten; esta auditoría amplía el contraste a los 12 requisitos y 10 criterios de FASE2-T07 sin duplicar IDs.
- **Evidencia:** User SHA 12079dd410aa6d8afbce55a4bc62a79dea605f9f; Academic SHA daf1883ec0b8d4f0ff2bc673af8a4e8c5bbd03fc; Accounting SHA 38b979d41596b85e888b4a7060b37bbac0840a28; Task SHA 1437756a3c3d3d97e06bc1ff21c8e2ca2b2dccbe; completadas.md SHA f57f1aef832e81e44fc4f7ec36a852d50e464676.
- **Reconciliación:** mantener AUD-NG-176/TASK-474 (outbox, autenticación de emisor, productores, reintentos, estados por canal, recuperación y pruebas); AUD-NG-177/TASK-475 (secretos y HTML); AUD-NG-006/AUD-NG-161 (idempotencia/pruebas); AUD-NG-039 (alertas académicas); TASK-422 (preferencias); TASK-404 (alertas financieras/mora). No crear nuevos IDs.
- **Evidencia ampliada:** retryFailedNotificationsQueue carece de maxRetries/backoff; evento puede quedar PROCESADO con entrega pendiente; getNotificationPreferences devuelve valores fijos y sendMultiChannelNotification no consume preferencias/canales; configureAutomationRules no alimenta el evaluador académico; evaluateAndDispatchEarlyWarningAlerts no filtra año/período y acepta mocks del payload; calculateLateFeesForAccount no genera alerta/evento.
- **Backlog:** Pendientes.md recuperado del blob vigente del HEAD de partida SHA fb62c27bf00ab5b0e923170cd549643210e5a7eb (1,619,187 caracteres, 19,219 líneas). Se ampliaron notas de evidencia de TASK-474, TASK-422, TASK-404 y AUD-NG-039; sin cambio de estado ni IDs nuevos. Inventario antes/después: 478 IDs TASK + 175 IDs AUD-NG = 653 IDs únicos; máximos TASK-478/AUD-NG-180.
- **Pruebas:** inspección estática/manual. No se ejecutó runInterdepartmentalIntegrationTestSuite porque invoca la cola real y puede causar efectos secundarios; no se ejecutaron Apps Script, HTTP, triggers, proveedores, correos, concurrencia ni operaciones productivas.
- **Código fuente:** sin modificaciones. completadas.md, completadas_legacy.md, ChangesLogs.txt y METODOLOGIA_DESARROLLO.md sin modificaciones.
- **Progreso:** 43/183 identificadores auditados; 140 pendientes.
- **Siguiente tarea:** FASE2-T08 - Implementar trazabilidad y correlación de operaciones entre servicios. Reconciliar los antecedentes de correlationId/sagaId y registros estructurados antes de iniciar.



## 48. Resultado C1.43 - FASE2-T08 (2026-11-05)

- **Dictamen:** NO CUMPLE INTEGRALMENTE. No existe generación/propagación de correlationId en fetchApi, los helpers HMAC no están conectados al tráfico real, recordTraceabilityLog carece de productores operativos y las consultas/retención tienen incompatibilidades de esquema.
- **Continuidad histórica:** se revisaron los antecedentes AUD-NG-145, TASK-278, AUD-NG-174, AUD-NG-083 y TASK-474. Sus alcances cubren las brechas; no se crean IDs duplicados.
- **Evidencia:** User SHA 12079dd410aa6d8afbce55a4bc62a79dea605f9f; js/api.js SHA 6b24f666db30a811a8e9b38d466fc6001cf6dfa9; Academic SHA daf1883ec0b8d4f0ff2bc673af8a4e8c5bbd03fc; Accounting SHA 38b979d41596b85e888b4a7060b37bbac0840a28; Task SHA 1437756a3c3d3d97e06bc1ff21c8e2ca2b2dccbe; Exam SHA 1d93296628fae31f680004f637897e2b1314a64c; Developer SHA 8aa4bac67cfe5c8c54da51a0784a56fef633e412.
- **Evidencia ampliada:** getStructuredLogs no filtra por correlación/acción/servicio; recordTraceabilityLog no sanitiza errorDetails y no tiene productores; getTraceabilityCorrelationLogs carece de periodo/acción/paginación; getPaginatedAuditLogReport consulta BitacoraTraceability y un DTO incompatible con BitacoraEventos; executeDataRetentionPolicyCheck usa columnas incorrectas y no purga LogsSistema/BitacoraTrazabilidad; purgeStructuredLogs elimina todo LogsSistema.
- **Reconciliación de backlog:** ampliar AUD-NG-145, TASK-278, AUD-NG-174, AUD-NG-083 y TASK-474. Sin IDs nuevos ni cambios de estado.
- **Backlog:** Pendientes.md recuperado del blob del HEAD de partida SHA f9f2bfcf70173efc4b8dead23dbe8d44a55b8a4b (1,621,560 caracteres, 19,223 líneas antes de la ampliación). Blob preparado tras ampliar cinco tareas existentes: SHA 093007608b9c1fdd550305bb8e16ef966c6c4201. Inventario: 478 IDs TASK + 175 IDs AUD-NG = 653 IDs únicos; máximos TASK-478/AUD-NG-180. Sin nuevos IDs.
- **Pruebas:** inspección estática/manual. No se ejecutó la suite de integración porque puede operar colas reales; no se ejecutaron Apps Script, HTTP, triggers, despliegues ni operaciones productivas.
- **Código fuente:** sin modificaciones. completadas.md y METODOLOGIA_DESARROLLO.md sin modificaciones.
- **Progreso:** 44/183 identificadores auditados; 139 pendientes.
- **Siguiente tarea:** T-UX-02 - Soporte Universal Tecla Escape para Cierre de Modales y Restauración de Foco.

 
## 49. Resultado C1.44 - T-UX-02 (2026-11-05)

- **Dictamen:** CUMPLE PARCIALMENTE. Existe listener keydown Escape y cierre de una lista de modales/diálogos, pero no cubre todos los overlays reales y la restauración de foco no funciona universalmente.
- **Evidencia principal:** js/ui-common.js SHA 986938b8a311a41ed4cb3d135b66b6aaea4bed67; listener 87-143; UX-02 superficial en 1846-1867; auto-init 3490-3493; omnibox listener duplicado 5073-5085.
- **Superficies confirmadas:** index.html SHA cd742047cdc4948259dd721119429b04f78330ca / news-detail-modal:391; js/index-ui.js SHA c637535e8cc84f02aa18631bc964ff7ef545722e / showNewsDetail:868-895 y setupCommonUI:11; dashboard-direccion.html SHA fefaa3bf7884288aef563cfb8aaf244e6cea8b7c / overlays:421-455; js/secretary.js SHA 08a81266957b4c18cc25f8ba6749eac30a8f2c2c / abridores:462-465, 808-813; teacher-dashboard.html SHA cbb9e6a272a7d8ad33f99727303305d950533e71 / setupCommonUI:1469; student-dashboard.html SHA 6379ea0ed39d71b89747a0280bb925fdf12202c1 / setupCommonUI:401.
- **Hallazgo:** AUD-NG-181 (ALTO). Ampliar TASK-258, que ya contempla Escape universal, foco de retorno y confinamiento de foco. No crear TASK-479 ni duplicar AUD-NG-169.
- **Calidad:** insuficiente por selector incompleto, lista estática, referencia global no apilada, cierres simultáneos y listeners duplicados.
- **Pruebas:** inspección estática/manual; no se ejecutaron navegador, KeyboardEvent real, lectores de pantalla ni pruebas DOM automatizadas.
- **Código:** sin modificaciones; completadas.md y METODOLOGIA_DESARROLLO.md intactos.
- **Progreso:** 45/183 identificadores auditados; 138 pendientes.
- **Siguiente tarea:** T-UX-03 - Módulo de Protección contra Pérdida de Cambios No Guardados en Formularios.



## 50. Resultado C1.45 - T-UX-03 (2026-11-05)

- **Dictamen:** CUMPLE PARCIALMENTE. La implementación cubre el caso nominal de un control modificado y beforeunload, pero no cumple la ampliación T-UX-17 ni la verificación funcional exigida por T-UX-10.
- **Evidencia:** `js/ui-common.js` SHA 986938b8a311a41ed4cb3d135b66b6aaea4bed67; `setupUnsavedChangesProtection` líneas 5371-5430; caso UX-03 de `runUXSuiteTests` líneas 1869-1875; `completadas.md` SHA f57f1aef832e81e44fc4f7ec36a852d50e464676.
- **Hallazgos:** no existe snapshot/compare de valores iniciales; submit/reset limpian estado antes de confirmar resultado; MutationObserver solo re-enlaza inputs y no gestiona formularios añadidos; selector no cubre contenteditable/controles personalizados; listeners beforeunload y observers carecen de teardown; UX-03 solo comprueba existencia de la función.
- **Reconciliación:** T-UX-17 es la ampliación histórica del mismo módulo y está marcada completada, pero sus criterios no están implementados. T-UX-10 también está marcada completada, pero su prueba UX-03 es nominal. Las tareas de borradores/autoguardado no cubren este contrato transversal. Crear AUD-NG-182/TASK-479; no duplicar tareas existentes ni modificar completadas.md.
- **Backlog:** recuperado desde el blob vigente de la rama de trabajo, SHA 0be7e975c1aec2ccc36a3c11cc0b75cae9522032, 1,625,662 caracteres y 19,229 líneas. La lectura convencional devolvió 0 caracteres. Inventario previo: 478 IDs TASK únicos y 176 referencias AUD-NG (172 encabezados y 4 referencias cruzadas); máximo TASK-478/AUD-NG-181. Se añadió TASK-479/AUD-NG-182. Inventario posterior: 479 TASK y 177 referencias AUD-NG, 656 IDs combinados.
- **Pruebas:** inspección estática/manual. No se ejecutaron navegador, eventos DOM reales, suites automatizadas, Apps Script, HTTP ni guardados reales.
- **Código fuente:** sin modificaciones. `completadas.md`, `ChangesLogs.txt` y `METODOLOGIA_DESARROLLO.md` sin cambios.
- **Progreso:** 46/183 identificadores auditados; 137 pendientes.
- **Siguiente tarea:** T-UX-05 - Normalización Diacrítica Insensible a Tildes para Búsquedas y Filtros. T-UX-04 no aparece en la secuencia vigente entre T-UX-03 y T-UX-05.


## 51. Resultado C1.46 - T-UX-04 (2026-11-05)

- **Dictamen:** NO CUMPLE. El renderer existe, pero no se encontraron llamadas externas en los 21 archivos JavaScript ni en los 13 HTML principales de dashboards revisados; no se inserta un badge visible ni hay callback real de actualización. La prueba UX-04 solo comprueba existencia de función.
- **Evidencia principal:** `js/ui-common.js` SHA 986938b8a311a41ed4cb3d135b66b6aaea4bed67; renderer 5438-5789; UX-04 1879-1885; `completadas.md` SHA f57f1aef832e81e44fc4f7ec36a852d50e464676.
- **Regresión:** `renderDataFreshnessBadge` no se cierra hasta 5789. Las asignaciones globales `openUserManagementAdministrationModal` (5468-5614) y `openSecurityAndComplianceDashboardModal` (5617-5765) quedan anidadas en su cuerpo. Los consumidores de `dashboard-direccion.html` (188-198) y `dashboard-secretaria.html` (330-331) omiten la acción cuando `typeof` no es función.
- **Ampliación histórica:** T-UX-21 exige estados actualizado/desactualizado/pendiente/error, timestamp efectivo y actualización manual solo tras éxito. El timestamp ausente se sustituye por la hora actual; el callback considera fallo solo `success === false`; el botón queda inerte si no hay callback.
- **Reconciliación de secuencia:** T-UX-04 sí aparece en la lista formal FASE 3 de `completadas.md` (1536-1545), además del registro 1150-1158; el checkpoint C1.45 lo omitió al revisar únicamente la secuencia resumida. No existía auditoría previa en `Auditoria.txt`; se audita ahora antes de T-UX-05. T-UX-21 (1183-1192) es su ampliación.
- **Backlog:** recuperado desde el blob del HEAD de trabajo `215944966aa45bbe47182296630e2b68d094272d`, SHA `2d8dceee1b4c943277489c632c62773cd3a845f6`, 1,628,909 caracteres y 19,256 líneas. Inventario previo: 479 IDs TASK únicos y 177 IDs AUD-NG únicos (173 encabezados únicos + 4 referencias cruzadas), máximo TASK-479/AUD-NG-182. Se añadió TASK-480/AUD-NG-183. Inventario posterior: 480 TASK y 178 AUD-NG (174 encabezados únicos + 4 referencias cruzadas), 658 IDs combinados.
- **Pruebas:** inspección estática/manual de la función, límites, prueba UX-04, consumidores y búsqueda de referencias en 21 JS/13 HTML principales. No se ejecutaron navegador, DOM real, suites automatizadas, Apps Script ni sincronizaciones.
- **Código fuente:** sin modificaciones. `completadas.md`, `ChangesLogs.txt` y `METODOLOGIA_DESARROLLO.md` sin cambios.
- **Progreso:** 47/183 identificadores auditados; 136 pendientes.
- **Siguiente tarea:** T-UX-05 - Normalización Diacrítica Insensible a Tildes para Búsquedas y Filtros.

 
## 52. Resultado C1.47 - T-UX-05 (2026-11-05)

- **Dictamen:** CUMPLE. normalizeSearchString usa NFD, elimina marcas diacríticas, convierte a minúsculas y normaliza espacios/puntuación. El flujo renderAdminTicketsUI normaliza query y campos antes de indexOf; «matematica» encuentra «Matemáticas».
- **Evidencia:** js/ui-common.js SHA 986938b8a311a41ed4cb3d135b66b6aaea4bed67; normalizador 2202-2212; setupAdvancedTableFilters 2137-2150; renderAdminTicketsUI 4094-4112; test UX-05 1885-1892.
- **Reconciliación:** T-UX-06 y T-UX-14 usan normalizeString en backend/user-service/Code.gs para el omnibox; T-UX-15 usa el helper frontend en filtros avanzados. T-UX-10 contiene el test UX-05, que solo verifica transformación y no búsqueda end-to-end; se revisará al auditar T-UX-10.
- **Calidad:** regex \w ASCII, ñ/n y puntuación convertida a separador son límites de alcance más amplio; no invalidan el criterio de T-UX-05. Algunos módulos conservan normalizadores NFD locales.
- **Backlog:** Pendientes.md recuperado del blob vigente del HEAD de trabajo SHA e050c03b97fc08916b878c34dcd5c247403d8c4b (1,632,208 caracteres, 19,283 líneas). Inventario: 480 IDs TASK y 178 IDs AUD-NG únicos, máximos TASK-480/AUD-NG-183. No se modificó Pendientes.md; no se creó AUD-NG ni TASK.
- **Pruebas:** inspección estática/manual; no se ejecutaron navegador, DOM real, suites automatizadas ni servicios backend.
- **Código fuente:** sin modificaciones. completadas.md, ChangesLogs.txt y METODOLOGIA_DESARROLLO.md intactos.
- **Progreso:** 48/183 identificadores auditados; 135 pendientes.
- **Siguiente tarea:** T-UX-06 - Omnibox Unificado Multi-Entidad con Atajo Global Ctrl + K.


## 53. Resultado C1.48 - T-UX-06 (2026-11-05)

- **Dictamen:** CUMPLE PARCIALMENTE. El modal abre con Ctrl+K/Cmd+K, cierra con Escape, enfoca el campo, restaura el foco y consulta expedientes, usuarios, noticias y trámites. La autenticación por token firmado existe, pero la autorización por entidad es incompleta: noticias no respetan estado/vigencia/audiencia y trámites no se filtran por titular/estudiante/permiso departamental.
- **AUD-NG-184 / TASK-481 (ALTO/P1):** exposición de noticias y solicitudes fuera del ámbito autorizado en `searchGlobalOmnibox`.
- **AUD-NG-185 / TASK-482 (ALTO/P1):** XSS almacenado por interpolación sin escape de resultados en `innerHTML` y `onclick`; la descripción de solicitud puede ser aportada por usuario.
- **Evidencia:** `js/ui-common.js` SHA 986938b8a311a41ed4cb3d135b66b6aaea4bed67, líneas 4937-5082; `backend/user-service/Code.gs` SHA 12079dd410aa6d8afbce55a4bc62a79dea605f9f, líneas 7992-8142, además de validación, filtros de noticias y solicitudes en las líneas indicadas en el informe C1.48.
- **Reconciliación:** T-UX-14 amplía la búsqueda con navegación directa, contextos de atajo y manejo de consultas vacías/especiales; las brechas observadas se revisarán formalmente en su auditoría. T-UX-10 UX-06 solo verifica presencia de función.
- **Backlog:** Pendientes.md se recuperó del blob e050c03b97fc08916b878c34dcd5c247403d8c4b del HEAD de NG_beta_0.0.0.1_work, al devolver 0 caracteres la lectura convencional. Se preservó el contenido y se agregaron TASK-481/AUD-NG-184 y TASK-482/AUD-NG-185. Inventario previo: 480 TASK únicos y 178 AUD-NG únicos; inventario posterior: 482 TASK y 180 AUD-NG únicos (662 identificadores combinados).
- **Pruebas:** inspección estática/manual. No se ejecutaron navegador, DOM real, suites automatizadas, Apps Script, Google Sheets ni operaciones productivas.
- **Código fuente:** sin modificaciones. `completadas.md`, `ChangesLogs.txt` y `METODOLOGIA_DESARROLLO.md` sin cambios.
- **Progreso:** 49/183 identificadores auditados; 134 pendientes.
- **Siguiente tarea:** T-UX-09 - Menú Lateral Responsivo Específico por Rol con Colapso Móvil Suave.


## 54. Resultado C1.49 - T-UX-09 (2026-11-05)

- **Dictamen:** CUMPLE PARCIALMENTE. Existe drawer móvil y acordeón; sin embargo, el contenido se genera igual para todos los roles y el rol solo determina el grupo inicialmente expandido. El toggle desktop apunta a IDs ausentes en los 11 dashboards inspeccionados. Developer y dynamic dashboard no reciben el menú común; la apertura/cierre no implementa transición real.
- **AUD-NG-186 / TASK-483 (MEDIO/P2):** completar menú lateral responsivo específico por rol, rutas de todos los dashboards, control desktop real y transiciones móviles.
- **Evidencia:** `js/ui-common.js` SHA 986938b8a311a41ed4cb3d135b66b6aaea4bed67, líneas 4710-4924; `css/style.css` SHA f1ff84312ce70949a58eaa099b2aad0ff0a59cb6, líneas 175-201; revisión de 11 dashboards principales; UX-09 de runUXSuiteTests (líneas 1918-1926).
- **Reconciliación:** T-UX-13 amplía rutas por panel, estado activo y teclado/táctil; T-UX-20 amplía adaptación móvil. Se auditarán en su turno. TASK-253 y TASK-430 son relacionados, pero no cubren la matriz funcional de navegación por rol.
- **Backlog:** Pendientes.md recuperado del blob vigente de NG_beta_0.0.0.1_work, SHA b52b2dc96f0c869387a59514b4a53f56ea0ca983. Se agregó TASK-483 vinculada a AUD-NG-186. Inventario previo: 482 TASK únicos y 180 AUD-NG únicos; posterior: 483 TASK y 181 AUD-NG únicos (664 identificadores combinados).
- **Pruebas:** inspección estática/manual de funciones, estilos y 11 dashboards. No se ejecutaron navegador, DOM real, pruebas táctiles/teclado ni suites automatizadas.
- **Código fuente:** sin modificaciones. `completadas.md`, `ChangesLogs.txt` y `METODOLOGIA_DESARROLLO.md` sin cambios.
- **Progreso:** 50/183 identificadores auditados; 133 pendientes.
- **Siguiente tarea:** T-UX-10 - Completar la verificación funcional y automatizar las pruebas de experiencia de usuario.


## 55. Resultado C1.50 - T-UX-10 (2026-11-05)

- **Dictamen:** NO CUMPLE. runUXSuiteTests presenta nueve resultados nominales, pero ocho son comprobaciones de existencia y UX-05 una sola muestra. UX-07 puede aprobar sin badge. El resumen solo tiene PASS/FAIL y no hay evidencia de integración con las suites Node o los cinco dashboards revisados.
- **AUD-NG-187 / TASK-484 (ALTO/P1):** implementar pruebas conductuales reproducibles para UX-01..UX-09, cinco paneles, escenarios positivos/negativos/límite, fixtures aislados y estados PASS/FAIL/SKIPPED/BLOCKED.
- **Evidencia:** js/ui-common.js SHA 986938b8a311a41ed4cb3d135b66b6aaea4bed67, líneas 1846-1937; tests/regression/academic-grading-suite.js SHA 3433b707edd4a2f35c68368a3172932adc2a3b32; tests/regression/modular-dashboard-suite.js SHA 0495e1d526a872c33310935a003a83d924d34683; módulos student/teacher/accounting y dashboards Dirección/RH/Contabilidad/Estudiante/Docente.
- **Reconciliación:** AUD-NG-009 es el hallazgo general de pruebas superficiales. AUD-NG-162, AUD-NG-181 y TASK-479..483 ya cubren causas funcionales específicas; TASK-484 solo crea cobertura conductual para no duplicarlas. Incluir ampliaciones T-UX-13/14/17/20/21/22/23.
- **Backlog:** Pendientes.md recuperado del blob vigente de NG_beta_0.0.0.1_work, SHA 5c25ead336c43d953406fa0ea1a2564fd914add0, 1,638,593 caracteres y 19,348 líneas. Inventario previo: 483 TASK únicos y 181 AUD-NG únicos. Se añadió TASK-484/AUD-NG-187. Inventario posterior: 484 TASK y 182 AUD-NG únicos (666 identificadores combinados).
- **Pruebas:** inspección estática/manual. No se ejecutaron navegador, DOM real, suites automatizadas, APIs, Apps Script ni operaciones productivas.
- **Código fuente:** sin modificaciones. completadas.md, ChangesLogs.txt y METODOLOGIA_DESARROLLO.md sin cambios.
- **Progreso:** 51/183 identificadores auditados; 132 pendientes.
- **Siguiente tarea:** revisar el orden vigente de completadas.md después de T-UX-10 y seleccionar la siguiente tarea no auditada, reconciliando sus ampliaciones posteriores.
