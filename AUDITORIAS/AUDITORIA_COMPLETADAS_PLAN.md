# Plan maestro de auditoría - completadas.md

**Fecha de inicio:** 2026-11-04  
**Repositorio:** i-miss-cocaine/IMA  
**Rama de trabajo:** NG_beta_0.0.0.1_work  
**Rama base protegida:** NG_beta_0.0.0.1  
**HEAD inicial de trabajo:** aa234f7ae36ea8aa305253b40df8c2d7090c7ff2  
**HEAD base verificado:** 44d9891132332e692dbe2ba8602b41f50a508a59

## 1. Alcance e inventario

Se auditará el registro `completadas.md`, independiente de `completadas_legacy.md`.

- Archivo: 5,963 líneas; SHA Git del contenido de referencia: `f57f1aef832e81e44fc4f7ec36a852d50e464676`.
- Encabezados de tareas: 251.
- Identificadores únicos: 224.
- Hay identificadores repetidos, en particular el conjunto T-UX-01 a T-UX-27 aparece en más de una sección/versión. Se deben contrastar ambas descripciones y resolver cuál es la versión ampliada vigente, sin eliminar registros ni asumir que la repetición equivale a una tarea nueva.
- El resumen ejecutivo y las marcas [X] del documento son afirmaciones del registro, no evidencia de implementación.
- No modificar, reordenar, normalizar ni corregir `completadas.md`.

## 2. Reglas obligatorias

1. Aplicar íntegramente `METODOLOGIA_DESARROLLO.md`, SHA de referencia `1a2d4de602a1449b697c2da82ab6423e7c61b280`.
2. Auditoría manual: inspección archivo por archivo, función por función, variable por variable, flujo por flujo y dependencia por dependencia. No usar escáneres, scripts masivos ni validadores automáticos para decidir cumplimiento.
3. Antes de inspeccionar cada archivo de código, registrar su SHA/blob Git como copia de respaldo inmutable. No modificar código durante esta fase. Al terminar cada archivo, comparar su estado contra ese SHA; si hubiera diferencias, restaurar y documentar.
4. Contrastar todos los puntos del alcance y criterios de aceptación de cada tarea. Los comentarios, nombres de funciones, UI, wrappers, mocks y marcas de estado no son prueba de ejecución.
5. Seguir la ruta completa frontend -> API -> router -> función backend -> almacenamiento/servicio externo -> respuesta/UI. Comprobar permisos, integridad, errores, concurrencia, idempotencia, rendimiento, mantenibilidad y regresiones.
6. Considerar sustituciones y ampliaciones posteriores. Relacionar hallazgos con tareas actuales de `Pendientes.md` y `Auditoria.txt`; no duplicar una causa raíz ya registrada, pero sí ampliar evidencia/alcance cuando sea necesario.
7. Registrar cada hallazgo nuevo en `Auditoria.txt` y convertirlo en tarea concreta en `Pendientes.md`. Actualizar `MapaDependencias.md` y este plan por lote.
8. No cambiar estados de tareas históricas ni declarar una tarea completa por inferencia.
9. Todos los cambios de la tarea/iteración completa se agrupan en **un único commit final**, siempre en `NG_beta_0.0.0.1_work`. No hacer commits atómicos, por archivo ni intermedios. No dividir una entrega para eludir límites/cuotas: si no se puede confirmar el conjunto completo en un commit, detenerse sin commits parciales. No hacer merge, no modificar la rama base, no alterar `ChangesLogs.txt` por ser auditoría sin cambios de código.

## 3. Respaldo inicial y referencias

- `completadas.md`: blob SHA `f57f1aef832e81e44fc4f7ec36a852d50e464676`; respaldo de referencia íntegro.
- `METODOLOGIA_DESARROLLO.md`: blob SHA `1a2d4de602a1449b697c2da82ab6423e7c61b280`; instrucciones de auditoría.
- `Contexto_personal.txt`: blob SHA `36db8632556a5fc46054f16224e65b6b11855404`.
- `MapaDependencias.md`: blob SHA `c7cda1f2026c2325749cb701d2fdaf9e545e95cc`.
- `AUDITORIA_COMPLETADAS_LEGACY_PLAN.md`: blob SHA `c47380f92a43488dcb4a41319dba348cbd1072b7`.
- HEAD inicial de la rama de trabajo: `aa234f7ae36ea8aa305253b40df8c2d7090c7ff2`.
- HEAD de la rama base: `44d9891132332e692dbe2ba8602b41f50a508a59`.

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

- Auditoría de `completadas_legacy.md`: cerrada previamente (49/49); no se repite.
- Auditoría de `completadas.md`: iniciada, 0/183 identificadores únicos auditados; inventario estructural realizado.
- Primera tarea a auditar: AUDIT-CR-01, contrastando su afirmación de implementación en `backend/user-service/Code.gs` con el código actual.
- No se han añadido hallazgos ni se ha modificado código.
- Próxima acción: auditar C0 manualmente y registrar resultados por evidencia; después continuar C1.

## 7. Control de continuidad

Al reanudar:
1. Verificar HEAD de ambas ramas y confirmar que la rama base no cambió.
2. Leer este plan, `Contexto_personal.txt`, `METODOLOGIA_DESARROLLO.md`, `Pendientes.md`, `Auditoria.txt` y `MapaDependencias.md`.
3. Continuar desde el último checkpoint confirmado, sin repetir lotes cerrados.
4. Mantener los identificadores y estados históricos de `completadas.md` intactos.


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


## 56. Resultado C1.51 - T-UX-11 (2026-11-05)

- **Dictamen:** NO CUMPLE. El gestor de historial `{view,params}` no se inicializa; el listener común no procesa ese estado; no se resuelve el hash inicial y los IDs inexistentes retornan silenciosamente. El caché guarda parámetros del destino en la vista saliente y al regresar solo restaura scroll. Docente usa navegación/stack propio y no se demuestra integración equivalente en los otros paneles.
- **AUD-NG-188 / TASK-485 (ALTO/P1):** activar router contextual único, inicialización idempotente, rutas directas/hash, atrás/adelante, destinos inválidos y permisos.
- **AUD-NG-189 / TASK-486 (ALTO/P1):** snapshot/restauración real de filtros, búsqueda, orden, página, selección y scroll; integrar listas/detalle y stack de Docente.
- **Evidencia:** ui-common.js SHA 986938b8a311a41ed4cb3d135b66b6aaea4bed67, líneas 281-385 y 4864-4917; teacher.js SHA c475fce5afcd28fca23e7b64398ad32b17773746, líneas 215-245, 3220-3275 y 5997-6008; student.js SHA e2888cea60322e49a40b89adadb8010489605dcc; accounting.js SHA a79ead4a54ad6fdb2f1e9df4775491ff7191a0c7; siete dashboards revisados.
- **Reconciliación:** AUD-NG-162 cubre sesión vencida; T-UX-13/TASK-483 menú/rutas visibles; T-UX-14 búsqueda; T-UX-15 filtros/paginación. No duplicar esos alcances.
- **Backlog:** Pendientes.md recuperado del blob vigente de NG_beta_0.0.0.1_work SHA 4d2f3cd3bbe391a716f085f77864b82b53d920a2, 1,644,469 caracteres y 19,388 líneas. Inventario previo: 484 TASK y 182 AUD-NG únicos. Se agregaron TASK-485/TASK-486 y AUD-NG-188/AUD-NG-189. Inventario posterior: 486 TASK y 184 AUD-NG únicos (670 identificadores combinados).
- **Pruebas:** inspección estática/manual; no se ejecutaron navegador, DOM real, recarga, eventos popstate ni suites automatizadas.
- **Código fuente:** sin modificaciones. completadas.md, ChangesLogs.txt y METODOLOGIA_DESARROLLO.md intactos.
- **Progreso:** 52/183 identificadores auditados; 131 pendientes.
- **Siguiente tarea:** T-UX-12 - Consolidar los paneles de control por rol y departamento (revisar primero si existen auditorías históricas o hallazgos previos para reconciliar).


## 57. Resultado C1.52 - T-UX-12 (2026-11-05)

- **Dictamen:** NO CUMPLE. Los helpers de resumen de Estudiante, Docente y Contabilidad no están integrados; el modelo de entregas estudiantil no coincide con el helper y el resumen contable permanece estático. Dirección y Coordinación presentan indicadores sin fuente real o hardcodeados. RR. HH. no procesa las solicitudes por discrepancias en la estructura de respuesta, nombres de campos y estados. Además, el rol Empleado puede consultar expedientes y solicitudes laborales ajenas porque el backend no impone aislamiento por identidad.
- **AUD-NG-190 / TASK-487 (ALTO/P1):** integrar los indicadores reales de Estudiante, Docente y Contabilidad, corregir los contratos de datos y distinguir cero de no disponible.
- **AUD-NG-191 / TASK-488 (ALTO/P1):** conectar las aprobaciones de Dirección, calcular pendientes reales de Coordinación y completar cobertura/accesos funcionales del dashboard dinámico.
- **AUD-NG-192 / TASK-489 (ALTO/P1):** corregir el contrato de solicitudes de vacaciones entre el frontend de RR. HH. y el backend.
- **AUD-NG-193 / TASK-490 (ALTO/P1):** restringir en servidor expedientes y solicitudes laborales a la identidad verificada del empleado; mantener acceso global solo para roles administrativos autorizados.
- **Evidencia principal:** js/student.js SHA e2888cea60322e49a40b89adadb8010489605dcc (líneas 5-19); js/teacher.js SHA c475fce5afcd28fca23e7b64398ad32b17773746 (líneas 117-134); js/accounting.js SHA a79ead4a54ad6fdb2f1e9df4775491ff7191a0c7 (líneas 10-24 y 1802-1811); dashboard-direccion.html SHA fefaa3bf7884288aef563cfb8aaf244e6cea8b7c (líneas 62-73); js/secretary.js SHA 08a81266957b4c18cc25f8ba6749eac30a8f2c2c (líneas 522-570); backend/academic-service/Code.gs SHA daf1883ec0b8d4f0ff2bc673af8a4e8c5bbd03fc (líneas 6200-6224); dashboard-recursos-humanos.html SHA 406bedbae5a5bb3b5c03e4ea7aaa95ed68aea8ee (líneas 2360-2415); backend/accounting-service/Code.gs SHA 38b979d41596b85e888b4a7060b37bbac0840a28 (líneas 420-432, 8152-8189 y 8578-8606); ui-common.js SHA 986938b8a311a41ed4cb3d135b66b6aaea4bed67 (líneas 5819-5863); backend/user-service/Code.gs SHA 12079dd410aa6d8afbce55a4bc62a79dea605f9f (líneas 9254-9293).
- **Reconciliación:** T-UX-16, F8-Task12, T-UX-13/TASK-483, T-UX-20 y TAREA-04 son ampliaciones o dependencias relacionadas. No sustituyen el resumen de cada rol ni corrigen el contrato de RR. HH. o el aislamiento por empleado. La Secretaría sí tiene métricas de admisión alimentadas por getAdmissionRequests; el hallazgo de Coordinación se limita a sílabos/jornalizaciones.
- **Backlog:** la lectura convencional de Pendientes.md devolvió 0 caracteres en NG_beta_0.0.0.1_work. Se recuperó el blob actual de la misma rama: 4d4f07655166ebd44bb51e564cdefa3cc73112e2, 1,650,380 caracteres y 19,437 líneas. Se preservó y se añadieron TASK-487..TASK-490 / AUD-NG-190..AUD-NG-193. Blob posterior: 42999b169766bbfd10a2d3de02fc40fc937fc620, 1,664,739 caracteres y 19,537 líneas. Inventario posterior: 490 encabezados TASK únicos (490 referencias TASK únicas, máximo TASK-490) y 188 referencias AUD-NG únicas (máximo AUD-NG-193), 678 IDs combinados. Estados explícitos en los 490 encabezados: 43 completados, 394 pendientes y 53 sin estado explícito; no se alteraron estados históricos.
- **Pruebas:** inspección estática/manual de funciones, contratos, permisos y dashboards. No se ejecutaron navegador, DOM real, APIs, Apps Script, Google Sheets, permisos activos ni suites automatizadas.
- **Código fuente:** sin modificaciones. completadas.md, ChangesLogs.txt y METODOLOGIA_DESARROLLO.md sin cambios.
- **Archivos/documentos:** Pendientes.md actualizado con cuatro tareas; creados AUDITORIA_COMPLETADAS_T-UX-12.md y registros correspondientes en Auditoria.txt y MapaDependencias.md.
- **Commits modulares:** el usuario autorizó expresamente dividir la iteración en commits modulares. Commits publicados durante esta iteración: bcf8facf7e15bd2c512b8d1ec715aeb9d69f832e (backlog); e45fc8dc134bfcdd5cfea70af48b40f108fccb6a (informe); 4469e070431569c3d71102dc66e86e4b234b8a36 (bitácora); a3f3f2d6fdf4c3ceb94e8e9fd8d2e3d827de08da (mapa). La verificación final de HEAD queda para el cierre del checkpoint.
- **Progreso:** 53/183 identificadores auditados; 130 pendientes.
- **Siguiente tarea:** T-UX-13 - Completar el menú lateral específico de cada panel. Reconciliar AUD-NG-186/TASK-483 y las ampliaciones posteriores antes de auditarla.


## 58. Resultado C1.53 - T-UX-13 (2026-11-05)

- **Dictamen:** NO CUMPLE. El drawer común es genérico y no filtra rutas por rol; no hay sidebar desktop funcional; el disparador móvil se inserta dentro de un nav oculto en ocho dashboards y recibe una clase que lo oculta en escritorio; Developer no carga el módulo y dynamic-dashboard no tiene el selector de header requerido. No se marca la ruta activa ni se exponen estados ARIA de acordeones; una acción inmediata se modela como enlace.
- **AUD-NG-194 (MEDIO/P2) / TASK-483 existente:** el disparador móvil queda invisible por anidamiento en `nav.hidden.md:flex`; el drawer carece de ruta activa/estado accesible y mezcla una acción con enlaces. Se amplía TASK-483 sin crear tarea duplicada.
- **Evidencia:** `js/ui-common.js` SHA 986938b8a311a41ed4cb3d135b66b6aaea4bed67, líneas 4710-4721, 4723-4755, 4757-4890 y 4917-4924; `css/style.css` SHA f1ff84312ce70949a58eaa099b2aad0ff0a59cb6, líneas 175-201 y 1053-1063; once dashboards revisados con SHAs registrados en `AUDITORIA_COMPLETADAS_T-UX-13.md`.
- **Reconciliación:** T-UX-13 aparece dos veces en completadas.md (líneas 695 y 1584); la primera es la versión completa, la segunda abreviada. T-UX-09 aparece dos veces y su auditoría C1.49 creó AUD-NG-186/TASK-483. T-UX-19/T-UX-20 y T-UX-10/UX-09 son relacionadas, pero no sustituyen la navegación por rol. T-UX-11/TASK-485/486 cubre historial, no el menú.
- **Pendientes:** se amplió el bloque existente TASK-483 con AUD-NG-194 y criterios específicos para visibilidad del disparador por viewport, ruta activa semántica, botón para acciones y gestión del foco. Estado sigue [ ] Pendiente. No se creó un nuevo TASK.
- **Inventario:** Pendientes.md recuperado desde el blob vigente del HEAD de trabajo al devolver 0 caracteres la lectura convencional. Blob previo 42999b169766bbfd10a2d3de02fc40fc937fc620 (1,664,739 caracteres, 19,537 líneas). Blob posterior cf9bacd54ac4e90e2d9289f41d1db61bac6090b4 (1,665,667 caracteres, 19,542 líneas). Se preservó todo el contenido y se actualizó únicamente TASK-483; inventario previsto: 490 TASK únicos y 189 AUD-NG únicos (679 IDs combinados), a verificar desde el blob publicado.
- **Pruebas:** inspección estática/manual de la especificación ampliada, JS, CSS y 11 dashboards. No se ejecutaron navegador, DOM real, viewports, teclado/táctil, lectores de pantalla ni suites automatizadas.
- **Código fuente:** sin modificaciones. `completadas.md`, `ChangesLogs.txt` y `METODOLOGIA_DESARROLLO.md` intactos.
- **Archivos/documentos:** creado `AUDITORIA_COMPLETADAS_T-UX-13.md`; actualizados Pendientes.md (TASK-483), Auditoria.txt, MapaDependencias.md, AUDITORIA_COMPLETADAS_PLAN.md y Contexto_personal.txt.
- **Progreso acumulado:** 54/183 identificadores auditados; 129 pendientes.
- **Siguiente tarea:** T-UX-14 - Completar la búsqueda global y optimizar sus resultados. Reconciliar AUD-NG-184/TASK-481, AUD-NG-185/TASK-482, T-UX-06 y T-UX-10 antes de revisar el código vigente.


## 59. Resultado C1.54 - T-UX-14 (2026-11-05)

- **Dictamen:** NO CUMPLE. El backend no limita expedientes/usuarios por ámbito académico/departamental por registro; noticias y trámites carecen de filtros de audiencia/titularidad en la búsqueda. El guard omite filterSeccion y consultas vacías habilitadas por otros filtros pueden coincidir con todos los registros de noticias/trámites. El atajo Ctrl+K/Cmd+K interrumpe campos editables; noticias/trámites no navegan a sus registros; el límite de 20 puede excluir entidades; respuestas asíncronas antiguas pueden sobrescribir las actuales y la ausencia de fetchApi deja carga permanente.
- **AUD-NG-195 / TASK-481 (ALTO/P1):** ampliar autorización contextual a expedientes/usuarios y ámbito académico/departamental por registro.
- **AUD-NG-196 / TASK-481 (MEDIO/P2):** corregir el contrato de filtros, la detección de filterSeccion y el comportamiento de consultas vacías/multientidad.
- **AUD-NG-197..AUD-NG-200 / TASK-491:** navegación real por tipo, atajos que respeten controles editables, distribución global de resultados y control de concurrencia/errores.
- **Reconciliación:** AUD-NG-184/TASK-481 y AUD-NG-185/TASK-482 continúan vigentes; T-UX-10/AUD-NG-187/TASK-484 cubre la validez de la suite, no el comportamiento del Omnibox.
- **Evidencia:** js/ui-common.js SHA 986938b8a311a41ed4cb3d135b66b6aaea4bed67 (4937-5082); backend/user-service/Code.gs SHA 12079dd410aa6d8afbce55a4bc62a79dea605f9f (841-844, 1146-1164, 1253-1264, 7992-8144); js/api.js SHA 6b24f666db30a811a8e9b38d466fc6001cf6dfa9.
- **Backlog:** recuperado Pendientes.md desde blob de la rama de trabajo cf9bacd54ac4e90e2d9289f41d1db61bac6090b4 (1,665,667 caracteres, 19,542 líneas). TASK-481 ampliada y TASK-491 creada; blob actualizado 4039a6dc496848c5cf6b112bc41b681d80488bb7 (1,671,553 caracteres, 19,573 líneas). IDs añadidos: AUD-NG-195..AUD-NG-200 y TASK-491. No se modificaron estados históricos.
- **Pruebas:** inspección estática/manual. No se ejecutaron navegador, DOM, teclado/IME, Apps Script, Sheets, APIs productivas ni suites automatizadas.
- **Código:** sin modificaciones; completadas.md y METODOLOGIA_DESARROLLO.md sin cambios.
- **Progreso:** 55/183 identificadores auditados; 128 pendientes.
- **Siguiente tarea:** T-UX-15 - Implementar filtros avanzados, vistas guardadas y paginación coherente. Reconciliar tareas históricas y posteriores relacionadas con filtros, persistencia de vistas, ordenamiento y paginación antes de iniciar.


## 60. Resultado C1.55 - T-UX-15 (2026-11-06)

- **Dictamen:** NO CUMPLE. El motor de filtros es un helper local incompleto, sin allowlist funcional ni tipos/operadores; pierde valores 0/false, no proporciona UI de filtros activos y no integra filtros/orden con paginación. Las vistas guardadas persisten solo filtros en localStorage por containerId, sin identidad/rol/ámbito ni vistas compartidas.
- **AUD-NG-201 (ALTO/P1) / TASK-429 existente:** completar motor de filtros multicriterio, presentación y eliminación de filtros activos, ordenamiento estable e integración con paginación local/remota.
- **AUD-NG-202 (MEDIO/P2) / TASK-429 existente:** aislar vistas de tabla por usuario/rol/ámbito y diferenciar vistas personales/compartidas con permisos efectivos; ampliar estado guardado más allá de filtros.
- **Reconciliación:** FASE2-07 ya había documentado la falta de consumidores de renderPaginatedTable y la modalidad remota no integrada, ampliando TASK-429; no se duplica ese hallazgo. TAREA-04 y FASE2-T10 son antecedentes históricos. TASK-249 cubre vistas de reportes institucionales; TASK-486 cubre snapshot/restauración al navegar; TASK-453 cubre bandejas documentales; T-UX-25/TASK-422 cubren preferencias generales. Se amplía TASK-429 porque ya contiene el alcance de tablas/listados, filtros, ordenamiento y paginación.
- **Evidencia:** js/ui-common.js SHA 986938b8a311a41ed4cb3d135b66b6aaea4bed67, líneas 1999-2067 y 2128-2195; módulos teacher.js, student.js, accounting.js y secretary.js (SHAs registrados en Auditoria.txt y AUDITORIA_COMPLETADAS_T-UX-15.md).
- **Pruebas:** inspección estática/manual. No se ejecutaron navegador, DOM, localStorage multiusuario, filtros/paginación runtime, compartición, permisos activos ni suites automatizadas.
- **Código fuente:** sin modificaciones. completadas.md y METODOLOGIA_DESARROLLO.md intactos.
- **Pendientes:** TASK-429 ampliada con AUD-NG-201/AUD-NG-202 y criterios adicionales; no se crea un nuevo TASK.
- **Progreso:** 56/183 identificadores auditados; 127 pendientes.
- **Siguiente tarea:** T-UX-16 - Unificar los estados de notificaciones, tareas pendientes y aprobaciones.

## 61. Resultado C1.56 - T-UX-16 (2026-11-06)

- **Dictamen:** NO CUMPLE. El helper frontend no agrega fuentes ni está conectado a los paneles; el contrato de campos no coincide con el backend. `getUnifiedNotifications` usa variables no declaradas; el esquema de `BandejaNotificaciones` difiere entre productores de nueve y doce columnas. La lectura no persiste, los contadores no se sincronizan, la deduplicación no es atómica y hay brechas de autorización por propietario/departamento.
- **AUD-NG-203 (ALTO/P1):** consulta de notificaciones potencialmente rota y esquema de persistencia incompatible. Asociado a TASK-227/TASK-316.
- **AUD-NG-204 (CRÍTICO/P0):** falta de autorización por propietario y confianza en departamento/rol del payload. Asociado a TASK-221/TASK-318.
- **AUD-NG-205 (ALTO/P1):** normalizador frontend incompleto/desconectado y ausencia de agregador personal de tareas. Asociado a TASK-221/TASK-318.
- **AUD-NG-206 (ALTO/P1):** deduplicación susceptible a carrera y ausencia de clave persistida en `createUserNotification`. Asociado a TASK-227/TASK-316 y coordinación con TASK-045.
- **Reconciliación:** se amplían TASK-221, TASK-227, TASK-316, TASK-318, AUD-NG-036 y AUD-NG-024; no se crea una tarea funcional paralela. F10-Task12 y F11-Task03 [X] no acreditan integración completa.
- **Evidencia:** `js/ui-common.js` SHA 986938b8a311a41ed4cb3d135b66b6aaea4bed67 (2081-2114); `backend/user-service/Code.gs` SHA 12079dd410aa6d8afbce55a4bc62a79dea605f9f (892, 3916-3939, 4033-4072, 4818-4885, 4993-5030, 6036-6098, 6757-6818); consumidores js/api.js, student.js, teacher.js, secretary.js y accounting.js con SHAs registrados en `AUDITORIA_COMPLETADAS_T-UX-16.md`.
- **Pruebas:** inspección estática/manual y reconciliación documental. No se ejecutaron Apps Script, Sheets, navegador/DOM, roles reales, concurrencia, correo ni suites automatizadas.
- **Código fuente:** sin modificaciones. `completadas.md` y `ChangesLogs.txt` intactos. `Pendientes.md` conserva AUD-NG-203..206 y las ampliaciones de tareas existentes.
- **Archivos/documentos:** actualizado `MapaDependencias.md`; creado `AUDITORIA_COMPLETADAS_T-UX-16.md`; registrado el resultado en `Auditoria.txt` y en este plan; checkpoint en `Contexto_personal.txt`.
- **Progreso:** 57/183 identificadores auditados; 126 pendientes.
- **Siguiente tarea:** T-UX-17 - Corregir y completar la protección de cambios no guardados.


## 62. Resultado C1.60 - T-UX-17 (2026-11-06)

- **Dictamen:** NO CUMPLE. El helper mantiene un booleano dirty sin comparar contra valores iniciales; submit/reset limpian antes de confirmar el resultado; el observer no gestiona formularios descendientes agregados; no existe teardown y UX-03 solo comprueba presencia.
- **Hallazgo/tarea existente:** AUD-NG-182 / TASK-479. Se verificó que TASK-479 sigue en Pendientes.md y cubre snapshot/compare, guardado confirmado, reset cancelable, controles dinámicos, teardown y pruebas conductuales. No se duplica.
- **Reconciliación:** T-UX-03 es el requisito original; T-UX-17 es su ampliación marcada [X]. T-UX-10 exige pruebas funcionales y UX-03 sigue siendo nominal. Los módulos consumidores seleccionados no invocan el helper; student.js mantiene una advertencia separada para cargas de archivos.
- **Evidencia:** js/ui-common.js SHA 986938b8a311a41ed4cb3d135b66b6aaea4bed67, líneas 5371-5430 y 1869-1875; completadas.md SHA f57f1aef832e81e44fc4f7ec36a852d50e464676; TASK-479 en Pendientes.md blob SHA 612eecb1394d79c66e1177cda7180e964e46550c.
- **Pruebas:** inspección estática/manual y reconciliación. No se ejecutaron navegador/DOM, eventos cancelables, guardado asíncrono, navegación SPA, formularios dinámicos, teardown ni suites automatizadas.
- **Código fuente:** sin modificaciones. Pendientes.md no se modifica porque TASK-479 ya cubre los hallazgos. completadas.md, METODOLOGIA_DESARROLLO.md y ChangesLogs.txt intactos.
- **Archivos/documentos:** anexado resultado en Auditoria.txt, MapaDependencias.md y este plan; creado AUDITORIA_COMPLETADAS_T-UX-17.md; checkpoint C1.60 en Contexto_personal.txt.
- **Progreso:** 58/183 identificadores auditados; 125 pendientes.
- **Siguiente tarea:** T-UX-18 - Completar los componentes compartidos de formularios, tablas y vistas de detalle.


## 63. Resultado C1.61 - T-UX-18 (2026-11-06)

- **Dictamen:** NO CUMPLE. No hay contrato común de campos de formulario; los estilos divergen entre Student/Teacher/Accounting/RH/Secretaría. El paginador solo muestra vacío y carece de loading/error/retry; el modal compartido de detalle no implementa acciones, no está integrado y concatena datos sin escape.
- **AUD-NG-207 (MEDIO/P2):** renderPaginatedTable sin estados de carga/error/reintento ni contrato de acción/ID; sin consumidores hallados. Se vincula a TASK-429 existente (AUD-NG-201/202, T-UX-15, paginación/estados/consumidores); no se crea duplicado.
- **AUD-NG-208 (MEDIO/P2):** ausencia de contrato compartido de controles/estados visuales de formularios y divergencia entre vistas. Nueva TASK-492. Coordinar con TASK-130 (ayudas), TASK-307 (reglas de validación de negocio), TASK-430 (sistema de diseño) y T-UX-19 (semántica accesible).
- **AUD-NG-209 (ALTO/P1):** renderSharedDetailViewModal sin acciones/callback/ID, sin consumidores, concatenación insegura en innerHTML/handlers y manejo de foco incompleto. Nueva TASK-493. Coordinar con TASK-482 (Omnibox seguro), TASK-486 (estado de navegación), T-UX-19 y TASK-484.
- **Reconciliación:** TASK-429 cubre el componente de tablas, estados, filtros, orden, paginación y consumidores; TASK-486 cubre snapshot/restauración de contexto; TASK-482 solo el renderizado seguro del Omnibox; TASK-484 pruebas UX-01..09. No se duplican esos alcances.
- **Evidencia:** js/ui-common.js SHA 986938b8a311a41ed4cb3d135b66b6aaea4bed67, líneas 1843-1936, 1998-2069, 2129-2199, 5147-5165 y 5303-5365; css/style.css SHA f1ff84312ce70949a58eaa099b2aad0ff0a59cb6, líneas 413-436, 603-639, 749-809 y 996-1010; consumidores y SHAs detallados en AUDITORIA_COMPLETADAS_T-UX-18.md.
- **Pruebas:** inspección estática/manual y búsqueda de consumidores en 20 módulos JS y 13 páginas HTML de panel/entrada. No se ejecutaron navegador/DOM, pruebas visuales, callbacks de fila, XSS, foco/teclado ni validación runtime.
- **Código fuente:** sin modificaciones. completadas.md, METODOLOGIA_DESARROLLO.md y ChangesLogs.txt intactos. Pendientes.md actualizado solo en NG_beta_0.0.0.1_work con TASK-492/TASK-493.
- **Archivos/documentos:** anexado resultado en Auditoria.txt, MapaDependencias.md y plan; creado AUDITORIA_COMPLETADAS_T-UX-18.md; checkpoint C1.61 en Contexto_personal.txt.
- **Progreso:** 59/183 identificadores auditados; 124 pendientes.
- **Siguiente tarea:** T-UX-19 - Verificar la accesibilidad y corregir las barreras detectadas.


## 64. Resultado C1.62 - T-UX-19 (2026-11-06)

- Dictamen: **NO CUMPLE**. Menús principales dependientes de hover, no se acredita skip link operativo ni foco no oculto; formularios representativos contienen etiquetas sin asociación y controles dependientes de placeholder; helper de accesibilidad parcial y susceptible a excepción ante SVG.
- AUD-NG-210 (ALTO/P1): barreras de navegación/teclado: dropdowns group-hover sin apertura por foco, estado expandido no actualizado, ausencia de enlace de salto en vistas revisadas y falta de scroll-margin frente al header fijo. Relacionado con TASK-258 y AUD-NG-181.
- AUD-NG-211 (ALTO/P1): nombres accesibles y semántica incompletos; auditAndFixAccessibility no asocia campos/errores, no crea focus trap/announcer, asigna nombre genérico y puede fallar con SVGAnimatedString. Formularios Student/RR. HH. muestran asociaciones incompletas. Relacionado con TASK-258, AUD-NG-169, TASK-492, TASK-493, TASK-130 y TASK-484.
- Reconciliación: TASK-258 es la tarea correctiva transversal pendiente; AUD-NG-181 cubre Escape/foco; AUD-NG-169 paneles académicos; TASK-492 campos; TASK-493 modal; TASK-130 ayudas; TASK-484 pruebas UX-01..09. No crear TASK duplicada ni modificar Pendientes.md.
- Evidencia: ui-common.js SHA 986938b8a311a41ed4cb3d135b66b6aaea4bed67; style.css SHA f1ff84312ce70949a58eaa099b2aad0ff0a59cb6; vistas index, Student, Teacher, RR. HH. y Secretaría documentadas en AUDITORIA_COMPLETADAS_T-UX-19.md.
- Pruebas: inspección estática/manual y reconciliación con backlog. No se ejecutaron teclado en navegador, lectores de pantalla, contraste, zoom ni formularios en runtime.
- Código/tests, completadas.md, Pendientes.md, METODOLOGIA_DESARROLLO.md y ChangesLogs.txt intactos.
- Archivos documentales: Auditoria.txt, MapaDependencias.md, este plan, nuevo AUDITORIA_COMPLETADAS_T-UX-19.md y Contexto_personal.txt.
- Progreso: 60/183 identificadores auditados; 123 pendientes.
- Siguiente tarea: T-UX-20 - Completar la adaptación móvil y el comportamiento responsivo.

## 65. Resultado C1.63 - T-UX-20 (2026-11-06)

- **Dictamen:** NO CUMPLE. Hay layouts Tailwind adaptativos, pero la barra inferior móvil queda por encima de modales con z-index 60/70/80 y varios modales de formularios carecen de max-height/scroll interno.
- **AUD-NG-212 (MEDIO/P2):** .mobile-bottom-nav usa z-index 2100 y aparece hasta 767px; overlays de perfil/comprobante/noticia usan z-index inferior. Riesgo de controles tapados o taps interceptados.
- **AUD-NG-213 (MEDIO/P2):** profile-modal en Inicio/Estudiante y voucher-modal no limitan altura ni habilitan scroll interno; submission-modal/news-detail-modal sí tienen contención. El fallo se documenta como riesgo estático, no como reproducción runtime.
- **Reconciliación:** TASK-483 (disparador/drawer), TASK-429 (tablas móviles), TASK-492 (campos), TASK-493 (modal compartido de detalle), TASK-258 (foco/accesibilidad) y TASK-484 (pruebas) mantienen sus alcances. Se crea TASK-494 para capas/scroll responsivo de overlays generales.
- **Evidencia:** ui-common.js SHA 986938b8a311a41ed4cb3d135b66b6aaea4bed67; style.css SHA f1ff84312ce70949a58eaa099b2aad0ff0a59cb6; index.html SHA cd742047cdc4948259dd721119429b04f78330ca; student-dashboard.html SHA 6379ea0ed39d71b89747a0280bb925fdf12202c1. Evidencia adicional de dashboards y calendarios en AUDITORIA_COMPLETADAS_T-UX-20.md.
- **Pruebas:** inspección estática/manual; no se ejecutaron viewports, orientación, touch, teclado, stacking ni scroll en navegador.
- **Archivos/documentos:** se anexan resultados a Auditoria.txt, MapaDependencias.md y este plan; se crea AUDITORIA_COMPLETADAS_T-UX-20.md; se agrega TASK-494 a Pendientes.md; checkpoint C1.63 en Contexto_personal.txt.
- **Progreso:** 61/183 identificadores auditados; 122 pendientes.
- **Siguiente tarea:** T-UX-21 - Completar el indicador de frescura de datos y los estados de sincronización.

## 66. Resultado C1.64 - T-UX-21 (2026-11-06)

- **Dictamen:** NO CUMPLE. La implementación del indicador no está integrada, sustituye timestamps ausentes por la hora actual, acepta respuestas de callback no confirmadas y no modela los estados requeridos. Además, conserva anidados dos helpers administrativos.
- **Reconciliación:** T-UX-04 ya se auditó en C1.46 con AUD-NG-183/TASK-480. La TASK-480 pendiente cubre los requisitos de T-UX-21; no se crea tarea duplicada ni se modifica Pendientes.md.
- **Evidencia:** js/ui-common.js SHA 986938b8a311a41ed4cb3d135b66b6aaea4bed67, 5438-5789; UX-04 1879-1885; dashboard-direccion.html SHA fefaa3bf7884288aef563cfb8aaf244e6cea8b7c, 188-198; dashboard-secretaria.html SHA fa0d8c23aace24a6acab2d4956398a7f5e1309b8, 330-331. Informe: AUDITORIA_COMPLETADAS_T-UX-21.md.
- **Pruebas:** inspección estática/manual y búsqueda de referencias en 15 JS/12 HTML. No se ejecutaron pruebas de navegador/DOM, sincronización, callbacks ni suites automatizadas.
- **Sesión:** IMA-AUDIT-20261106-0254Z; inicio C1.63; sesión abierta (continuará con T-UX-22).
- **Progreso:** 62/183 identificadores auditados; 121 pendientes.
- **Siguiente tarea:** T-UX-22 - Corregir el significado y el comportamiento del indicador de estado en línea.

## 67. Resultado C1.65 - T-UX-22 (2026-11-06)

- **Dictamen:** NO CUMPLE. El indicador traduce navigator.onLine a “Conexión Estable”, sin medir disponibilidad del backend; el estado “Modo Local” también debe distinguirse de la conectividad simple. UX-07 es nominal y puede aprobar aunque no exista badge.
- **AUD-NG-214 (MEDIO/P2):** separar conectividad de dispositivo, salud de servicios y presencia; no inferir backend/presencia desde navigator.onLine. Se registra TASK-495.
- **Reconciliación:** AUD-NG-144 cubre health checks reales; AUD-NG-187/TASK-484 cubre pruebas conductuales UX-07; TASK-494 cubre capas de overlays; tareas offline cubren colas y reintentos. No duplicar.
- **Evidencia:** ui-common.js SHA 986938b8a311a41ed4cb3d135b66b6aaea4bed67, 35-61 y 3490-3494; UX-07 1902-1907; api.js SHA 6b24f666db30a811a8e9b38d466fc6001cf6dfa9, 207-252. Informe AUDITORIA_COMPLETADAS_T-UX-22.md.
- **Pruebas:** inspección estática/manual. No se ejecutaron navegador, eventos online/offline, health checks ni suites automatizadas.
- **Sesión:** IMA-AUDIT-20261106-0254Z; inicio C1.63; sesión abierta.
- **Progreso:** 63/183 identificadores auditados; 120 pendientes.
- **Siguiente tarea:** T-UX-23 - Completar el flujo de reporte de problemas y soporte.

## 68. Resultado C1.66 - T-UX-23 (2026-11-06)

- **Dictamen:** NO CUMPLE. El formulario existe y valida localmente, y el handler backend persiste en TicketsReporteProblemas, pero el payload del frontend carece de token; fetchApi no lo adjunta y validateRolePermission rechaza la petición antes de ejecutar el handler.
- **Reconciliación:** AUD-NG-001 (transporte de token), AUD-NG-128 (RBAC/identidad verificada/IDOR de tickets) y TASK-484 (pruebas UX-08) cubren los defectos observados. No crear hallazgo ni tarea duplicada; Pendientes.md permanece intacto.
- **Evidencia:** ui-common.js SHA 986938b8a311a41ed4cb3d135b66b6aaea4bed67, initProblemReportingUI 3583+, submitProblemReportForm 3768+; api.js SHA 6b24f666db30a811a8e9b38d466fc6001cf6dfa9, 39-58; user-service/Code.gs SHA 12079dd410aa6d8afbce55a4bc62a79dea605f9f, getUserVerifiedRole 1146+, validateRolePermission 1253-1294, doPost 1351+, submitProblemTicket 400-468. Informe AUDITORIA_COMPLETADAS_T-UX-23.md.
- **Pruebas:** inspección estática/manual. No se ejecutaron navegador, HTTP, Apps Script, escritura en Sheets ni suites automatizadas.
- **Sesión:** IMA-AUDIT-20261106-0254Z; inicio C1.63; sesión abierta.
- **Progreso:** 64/183 identificadores auditados; 119 pendientes.
- **Siguiente tarea:** T-UX-24 - Normalizar las acciones, los estados y la jerarquía visual institucional.

## 69. Resultado C1.67 - T-UX-24 (2026-11-06)

- **Dictamen:** NO CUMPLE. Las variantes de botones compartidas se usan solo en parte de los paneles; los estados se construyen con alert/Swal/Tailwind local y existen diferencias para el mismo estado en las vistas de tickets.
- **AUD-NG-215 (MEDIO/P2):** contrato transversal incompleto para jerarquía de acciones y estados success/error/warning/loading/empty. Se incorpora como ampliación de TASK-430; no se crea una tarea paralela.
- **Reconciliación:** TASK-492 cubre campos de formularios; TASK-493 modal compartido; TASK-494 overlays; TASK-495 conectividad; TASK-430 sistema visual institucional. No duplicar.
- **Evidencia:** style.css SHA f1ff84312ce70949a58eaa099b2aad0ff0a59cb6, tokens 2-25 y botones 284-348; ui-common.js SHA 986938b8a311a41ed4cb3d135b66b6aaea4bed67, estados de tickets 3918-3923 y 4121-4126; 12 vistas principales inventariadas. Informe AUDITORIA_COMPLETADAS_T-UX-24.md.
- **Pruebas:** inspección estática/manual; no se ejecutaron navegador, comparación de capturas ni contraste automatizado.
- **Sesión:** IMA-AUDIT-20261106-0254Z; inicio C1.63; sesión abierta.
- **Progreso:** 65/183 identificadores auditados; 118 pendientes.
- **Siguiente tarea:** T-UX-25 - Incorporar preferencias de usuario y personalización controlada de vistas.

## 70. Resultado C1.68 - T-UX-25 (2026-11-06)

- **Dictamen:** NO CUMPLE. El modal guarda solo preferencias de notificación; controles de rol son estáticos, no hay reset ni persistencia de tema/layout/idioma/formato. El backend restringe endpoints personales a tres roles y el token no se transmite.
- **AUD-NG-216 (MEDIO/P2):** ampliar persistencia y aplicación de preferencias personales/rol con defaults institucionales y reset. Se incorpora a TASK-422, no se crea tarea duplicada.
- **Reconciliación:** AUD-NG-001 token; AUD-NG-202/TASK-429 vistas guardadas de tablas; TASK-422 preferencias personales; TASK-430 sistema visual. Sin duplicados.
- **Evidencia:** ui-common.js SHA 986938b8a311a41ed4cb3d135b66b6aaea4bed67, 1629-1700, 2214+, 2439-2498; user-service/Code.gs SHA 12079dd410aa6d8afbce55a4bc62a79dea605f9f, 920-990, 7649-7735, 1245-1315; Pendientes.md blob SHA dfe26e3bcc5ef7d6228ca251a08e59ce0e59943b. Informe AUDITORIA_COMPLETADAS_T-UX-25.md.
- **Pruebas:** inspección estática/manual; no se ejecutaron sesiones multirol, persistencia Sheets, restauración cross-device ni suites automatizadas.
- **Sesión:** IMA-AUDIT-20261106-0254Z; inicio C1.63; sesión abierta.
- **Progreso:** 66/183 identificadores auditados; 117 pendientes.
- **Siguiente tarea:** T-UX-26 - Incorporar una vista de actividad reciente contextual.

## 71. Revalidación C1.69 - T-UX-26 (2026-11-06)

- **Dictamen:** NO CUMPLE / CUMPLE PARCIALMENTE, sin corrección acreditada desde el informe histórico.
- **Hallazgo:** AUD-NG-173 sigue pendiente; el código de actividad reciente mantiene el mismo SHA 986938b8a311a41ed4cb3d135b66b6aaea4bed67. Persiste la clave global sin identidad institucional/usuario, filtrado insuficiente, renderizado innerHTML no seguro, falta de integración/producción real y targetId no consumido por switchActiveView.
- **Reconciliación:** TASK-067 cubre aislamiento; TASK-221 bandeja de tareas accionables; AUD-NG-173 cubre integración y navegación. No duplicar.
- **Informe:** AUDITORIA_COMPLETADAS_T-UX-26.md (se agrega revalidación C1.69).
- **Pruebas:** inspección estática y comparación SHA; no se ejecutaron pruebas de navegador ni multiusuario.
- **Sesión:** IMA-AUDIT-20261106-0254Z; inicio C1.63; sesión abierta.
- **Progreso:** 67/183 identificadores auditados; 116 pendientes.
- **Siguiente tarea:** T-UX-27 - Optimizar el rendimiento percibido y la respuesta de las interfaces.

## 72. Revalidación C1.70 - T-UX-27 (2026-11-06)

- **Dictamen:** CUMPLE PARCIALMENTE / INSUFICIENTE; las brechas del informe histórico siguen vigentes.
- **Evidencia:** ui-common.js SHA 986938b8a311a41ed4cb3d135b66b6aaea4bed67, renderUIProgressSkeleton 5147 sin consumidores; api.js SHA 6b24f666db30a811a8e9b38d466fc6001cf6dfa9, timeout fijo 60000ms, options.timeout ignorado, sin deduplicación concurrente; suite SHA 0495e1d526a872c33310935a003a83d924d34683 sin pruebas T-UX-27.
- **Reconciliación:** TASK-252 instrumentación de rendimiento percibido; TASK-429 skeleton/debounce/deduplicación segura; AUD-NG-007 timeout configurable. No crear hallazgo ni tarea duplicada.
- **Pruebas:** inspección estática/comparación SHA; no benchmarks ni perfiles runtime.
- **Sesión:** IMA-AUDIT-20261106-0254Z; inicio C1.63; sesión abierta.
- **Progreso:** 68/183 identificadores auditados; 115 pendientes.
- **Siguiente tarea:** T-UX-28 - Mejorar el comportamiento de navegación y retorno entre vistas.


## 73. Revalidación C1.71 - Navegación y retorno entre vistas (seguimiento T-UX-28)

- **Trazabilidad:** T-UX-28 fue señalado como siguiente elemento en C1.70, pero no aparece como identificador en completadas.md (SHA f57f1aef832e81e44fc4f7ec36a852d50e464676). Se limita esta revisión al alcance verificable de T-UX-11 y TASK-485/486.
- **Dictamen:** NO CUMPLE. El router {view,params} no está integrado con el listener común; el snapshot de switchActiveView almacena parámetros del destino en la vista saliente y solo restaura scroll; el stack de Docente limpia la búsqueda al avanzar/retroceder y no conserva un snapshot completo.
- **Reconciliación:** AUD-NG-188/TASK-485 y AUD-NG-189/TASK-486 siguen pendientes. TASK-429/T-UX-15 conserva el alcance de filtros/paginación; TASK-493 conserva el modal de detalle; AUD-NG-173 conserva targetId no consumido. No crear hallazgo ni tarea duplicada.
- **Evidencia:** ui-common.js SHA 986938b8a311a41ed4cb3d135b66b6aaea4bed67; teacher.js SHA c475fce5afcd28fca23e7b64398ad32b17773746; student.js SHA e2888cea60322e49a40b89adadb8010489605dcc; accounting.js SHA a79ead4a54ad6fdb2f1e9df4775491ff7191a0c7; secretary.js SHA 08a81266957b4c18cc25f8ba6749eac30a8f2c2c; Pendientes.md blob SHA 3d01a8a4cffd0d28de2c2b21ee0732e7631f2b3a.
- **Pruebas:** inspección estática/manual y comparación de SHA; no se ejecutaron pruebas runtime, navegación real ni suites automatizadas.
- **Sesión anterior:** IMA-AUDIT-20261106-0254Z, inicio C1.63, cierre C1.70 a las 2026-11-06T11:38:40Z; estado cerrada.
- **Sesión actual:** IMA-AUDIT-20261106-1138Z, inicio C1.71; estado abierta.
- **Progreso de lista maestra:** 68/183 identificadores auditados; 115 pendientes. Sin incremento porque T-UX-28 no figura en completadas.md.
- **Siguiente acción:** seleccionar el próximo identificador oficial no auditado desde completadas.md; no asumir T-UX-29 sin fuente.


## 74. Resultado C1.72 - TAREA-F4-P0-01 (2026-11-06)

- **Dictamen:** NO CUMPLE. El token emitido por USER se descarta en auth.js y fetchApi no lo transmite; los cinco servicios permiten bypass mediante PUBLIC_ACTIONS; USER permite revocación de sesiones con IDs del payload y ACADEMIC expone lectura/escritura de borradores por correo/draftKey; verifySessionToken no exige exp obligatorio; el fallback HMAC predecible permanece.
- **Evidencia:** auth.js SHA 8444dd085a3186106d2db7005b61ef934d3c22d8; api.js SHA 6b24f666db30a811a8e9b38d466fc6001cf6dfa9; USER SHA 12079dd410aa6d8afbce55a4bc62a79dea605f9f; ACADEMIC SHA daf1883ec0b8d4f0ff2bc673af8a4e8c5bbd03fc; ACCOUNTING SHA 38b979d41596b85e888b4a7060b37bbac0840a28; EXAM SHA 1d93296628fae31f680004f637897e2b1314a64c; TASK SHA 1437756a3c3d3d97e06bc1ff21c8e2ca2b2dccbe.
- **Reconciliación:** AUD-NG-001 (token cliente), AUD-NG-002 (operaciones sensibles públicas), AUD-NG-003 (expiración), AUD-NG-004 (secreto HMAC) y AUD-NG-005 (revocación distribuida) siguen pendientes; AUD-NG-001..003 se amplían. Sin nuevos IDs. Deriva de Director/Dirección se coordina con TAREA-F4-P1-03/P1-04 y TASK-488.
- **Pruebas:** inspección estática/manual. No se ejecutaron pruebas runtime, tokens, revocación, deployments, Script Properties ni suites automatizadas.
- **Sesión:** IMA-AUDIT-20261106-1138Z; inicio C1.71; sesión abierta.
- **Progreso:** 69/183 identificadores auditados; 114 pendientes.
- **Siguiente tarea:** TAREA-F4-P0-02 - Corregir las vulnerabilidades IDOR y garantizar el aislamiento de datos personales.


## 75. Resultado C1.73 - TAREA-F4-P0-02 (2026-11-06)

- **Dictamen:** NO CUMPLE. USER permite a Profesor consultar perfiles/tutores/trámites fuera de asignaciones activas; ACADEMIC no valida relaciones familiares/ámbito docente para historiales; ACCOUNTING no valida vínculo familiar para estados de cuenta/comprobantes; EXAM/TASK mantienen consultas públicas con IDs de payload.
- **Hallazgos existentes revalidados:** AUD-NG-002 (EXAM/TASK), AUD-NG-105/106/108 (ACADEMIC), AUD-NG-128 (USER tickets), AUD-NG-130/136 (finanzas/matrícula).
- **Nuevo hallazgo:** AUD-NG-217, Crítico/P0, para ámbito docente ausente en USER; nueva tarea TASK-496.
- **Ampliaciones:** AUD-NG-105 exige relación familiar y asignación docente para historial académico; AUD-NG-136 incluye getStudentEnrollmentHistory en la protección de información financiera/familiar.
- **Evidencia:** USER SHA 12079dd410aa6d8afbce55a4bc62a79dea605f9f; ACADEMIC SHA daf1883ec0b8d4f0ff2bc673af8a4e8c5bbd03fc; ACCOUNTING SHA 38b979d41596b85e888b4a7060b37bbac0840a28; EXAM SHA 1d93296628fae31f680004f637897e2b1314a64c; TASK SHA 1437756a3c3d3d97e06bc1ff21c8e2ca2b2dccbe.
- **Pruebas:** inspección estática/manual; sin peticiones HTTP, pruebas multiusuario/familia/docente ni suites automatizadas.
- **Sesión:** IMA-AUDIT-20261106-1138Z; inicio C1.71; sesión abierta.
- **Progreso:** 70/183 identificadores auditados; 113 pendientes.
- **Siguiente tarea:** TAREA-F4-P0-03 - Garantizar la revocación efectiva de sesiones y la actualización inmediata de privilegios.


## 76. Resultado C1.74 - TAREA-F4-P0-03 (2026-11-06)

- **Dictamen:** NO CUMPLE. USER escribe revocaciones en su ScriptCache sin propagación demostrada; los cuatro servicios secundarios eliminan la marca revoked_session en su purgeSecurityCaches; el dispatcher de seguridad no tiene implementación local encontrada; estado y privilegios mantienen cachés obsoletas; el logout frontend solo limpia almacenamiento local.
- **Hallazgos revalidados:** AUD-NG-005 (estado y revocación entre servicios), AUD-NG-159 (logout y revocación arbitraria), AUD-NG-160 (rol/privilegios en tokens y cachés). Sin nuevos IDs.
- **Corrección documental:** la asignación de logoutUser a AUD-NG-002 en C1.72 se corrige; corresponde a AUD-NG-159. AUD-NG-002 conserva TASK/EXAM y borradores ACADEMIC.
- **Evidencia:** USER SHA 12079dd410aa6d8afbce55a4bc62a79dea605f9f; ACADEMIC SHA daf1883ec0b8d4f0ff2bc673af8a4e8c5bbd03fc; ACCOUNTING SHA 38b979d41596b85e888b4a7060b37bbac0840a28; EXAM SHA 1d93296628fae31f680004f637897e2b1314a64c; TASK SHA 1437756a3c3d3d97e06bc1ff21c8e2ca2b2dccbe; auth.js SHA 8444dd085a3186106d2db7005b61ef934d3c22d8; api.js SHA 6b24f666db30a811a8e9b38d466fc6001cf6dfa9; ui-common.js SHA 986938b8a311a41ed4cb3d135b66b6aaea4bed67.
- **Pruebas:** inspección estática/manual; sin peticiones HTTP, pruebas runtime de revocación/caché/roles ni deployments.
- **Sesión:** IMA-AUDIT-20261106-1138Z; inicio C1.71; sesión abierta.
- **Progreso:** 71/183 identificadores auditados; 112 pendientes.
- **Siguiente tarea:** TAREA-F4-P0-04 - Registrar los intentos fallidos de autenticación y reforzar la protección contra ataques.

## 77. Resultado C1.75 - TAREA-F4-P0-04 (2026-11-06)

- **Dictamen:** NO CUMPLE. loginUser registra LOGIN_FAILED/LOGIN_SUCCESS solo en LogsSistema, no integra BitacoraEventos/BitacoraTrazabilidad; el tablero de seguridad lee BitacoraEventos y no consume esos registros. La bitácora omite credenciales ausentes, suprime fallos de escritura y conserva identifier/userId sin redacción.
- **Protección antiabuso:** contador por cuenta sin LockService, bloqueo fijo al quinto fallo, sin ventana temporal, espera progresiva ni límite por origen confiable; el bloqueo puede ser inducido y las escrituras concurrentes pueden sobrescribir incrementos.
- **Reconciliación:** ampliar AUD-NG-145 (bitácoras/PII/trazabilidad) y AUD-NG-005 (propagación del bloqueo automático); AUD-NG-159 conserva logout. Nuevo AUD-NG-218/TASK-497 para atomicidad y rate limiting. No duplicar hallazgos existentes.
- **Evidencia:** USER SHA 12079dd410aa6d8afbce55a4bc62a79dea605f9f; loginUser 2479-2554; logStructuredEvent 327-352; getSecurityAndComplianceDashboardData 4453-4545; recordTraceabilityLog 4548-4573; registerAndDispatchEvent 4618-4698; getPaginatedAuditLogReport 4243-4364.
- **Pruebas:** inspección estática/manual; no se ejecutaron HTTP, deployments, concurrencia real, persistencia de Sheets, rate limiting, recuperación de bloqueos ni suites automatizadas.
- **Progreso:** 72/183 identificadores auditados; 111 pendientes.
- **Siguiente tarea oficial:** TAREA-F4-P1-01 - Implementar el motor transversal de delegaciones de seguridad y permisos temporales.

## 78. Resultado C1.76 - TAREA-F4-P1-01 (2026-11-06)

- **Dictamen:** NO CUMPLE. createSecurityDelegation persiste acciones y ámbito, pero no valida autoridad por acción ni limita acciones delegables; USER/ACADEMIC/ACCOUNTING autorizan solo por acción e ignoran ambito. Las delegaciones pueden sobreponerse a una denegación dinámica y permitir cadenas si se delega createSecurityDelegation.
- **Cachés:** USER invalida solo su ScriptCache; ACADEMIC/ACCOUNTING mantienen cachés de 300 s. Expiración/revocación puede conservar permisos temporalmente. Se amplía AUD-NG-160.
- **UI:** ui-common.js muestra el contador y una vista administrativa de cuentas, pero no ofrece crear, consultar ni revocar delegaciones.
- **Reconciliación:** nuevo AUD-NG-219/TASK-498 para autoridad, ámbito, cadena y UI. AUD-NG-160 cubre vigencia/cachés; AUD-NG-217 y TAREA-F4-P1-04 cubren IDOR/ABAC; TASK-228/TASK-282/TASK-311 son delegaciones de workflows.
- **Evidencia:** USER SHA 12079dd410aa6d8afbce55a4bc62a79dea605f9f; ACADEMIC SHA daf1883ec0b8d4f0ff2bc673af8a4e8c5bbd03fc; ACCOUNTING SHA 38b979d41596b85e888b4a7060b37bbac0840a28; ui-common.js SHA 986938b8a311a41ed4cb3d135b66b6aaea4bed67.
- **Pruebas:** inspección estática/manual; no se ejecutaron HTTP, deployments, pruebas multiusuario, cachés reales ni suites automatizadas.
- **Progreso:** 73/183 identificadores auditados; 110 pendientes.
- **Siguiente tarea oficial:** TAREA-F4-P1-02 - Implementar el motor automático de retención, archivo y anonimización de datos.

## 79. Resultado C1.77 - TAREA-F4-P1-02 (2026-11-06)

- **Dictamen:** NO CUMPLE. El motor solo está en USER; no hay triggers. USER_SESSIONS no se procesa; STUDENT_EXPEDIENTS/FINANCIAL_RECORDS solo incrementan itemsArchived; PRESERVE_LEGAL no se ejecuta. AUDIT_LOGS sigue con columnas incompatibles (AUD-NG-145).
- **Anonimización:** lastAccess usa el contador de intentos fallidos si falta fecha; solo sustituye tres campos y conserva userId/personaId/hash y relaciones; ignora preservacionLegal. Nuevo AUD-NG-220/TASK-500.
- **Reconciliación:** ampliar AUD-NG-145 y AUD-NG-146; TASK-499 para motor efectivo y programado. No duplicar TASK-081, TASK-398/TASK-456 ni TASK-151/152.
- **Evidencia:** USER SHA 12079dd410aa6d8afbce55a4bc62a79dea605f9f; ACADEMIC SHA daf1883ec0b8d4f0ff2bc673af8a4e8c5bbd03fc; ACCOUNTING SHA 38b979d41596b85e888b4a7060b37bbac0840a28.
- **Pruebas:** inspección estática/manual; no triggers, HTTP, deployments, archivo/anonimización reales ni suites.
- **Progreso:** 74/183; 109 pendientes.
- **Siguiente tarea oficial:** TAREA-F4-P1-03 - Implementar la matriz dinámica de permisos y su aplicación transversal.

## 80. Resultado C1.78 - TAREA-F4-P1-03 (2026-11-06)

- **Dictamen:** NO CUMPLE. Los cinco servicios solo evalúan rol+acción; módulo y ámbito se almacenan pero se ignoran. savePermissionMatrix también hace upsert por rol+acción y carece de guardia interna que impida a un rol con permiso dinámico editar toda la matriz. No hay interfaz en ui-common.js/dashboards revisados.
- **Reconciliación:** AUD-NG-160 mantiene caché/fallback e invalidación; nuevo AUD-NG-221/TASK-501 para dimensiones, editor y UI. TASK-139 cubre permisos documentales; AUD-NG-094 catálogo de informes; TAREA-F4-P1-04 modelo contextual general.
- **Evidencia:** USER SHA 12079dd410aa6d8afbce55a4bc62a79dea605f9f; ACADEMIC SHA daf1883ec0b8d4f0ff2bc673af8a4e8c5bbd03fc; ACCOUNTING SHA 38b979d41596b85e888b4a7060b37bbac0840a28; TASK/EXAM inspeccionados en la misma rama; ui-common SHA 986938b8a311a41ed4cb3d135b66b6aaea4bed67.
- **Pruebas:** inspección estática/manual; no se leyó la hoja real ni se ejecutaron endpoints, pruebas de matriz o invalidación de caché.
- **Progreso:** 75/183; 108 pendientes.
- **Siguiente tarea oficial:** TAREA-F4-P1-04 - Implementar una política unificada de autorización contextual RBAC/ABAC.

## 81. Resultado C1.79 - TAREA-F4-P1-04 (2026-11-06)

- **Dictamen:** NO CUMPLE. Los cinco microservicios mantienen validadores contextuales divergentes; ACADEMIC presenta controles condicionales y fail-open, mientras ACCOUNTING/TASK/EXAM carecen de controles familiares/docentes/ámbitos y USER no integra su validador de ámbitos como política común.
- **Reconciliación:** AUD-NG-105/106/108/128/130/136/217, TASK-496 y AUD-NG-002 cubren exposiciones específicas; AUD-NG-160 y AUD-NG-221/TASK-501 conservan sus alcances. Nuevo AUD-NG-222/TASK-502 para política ABAC contextual común y denegación fail-closed.
- **Evidencia:** USER SHA 12079dd410aa6d8afbce55a4bc62a79dea605f9f; ACADEMIC SHA daf1883ec0b8d4f0ff2bc673af8a4e8c5bbd03fc; ACCOUNTING SHA 38b979d41596b85e888b4a7060b37bbac0840a28; TASK SHA 1437756a3c3d3d97e06bc1ff21c8e2ca2b2dccbe; EXAM SHA 1d93296628fae31f680004f637897e2b1314a64c.
- **Pruebas:** inspección estática/manual; no se ejecutaron HTTP, pruebas multiusuario/familia/docente, hojas productivas, deployments ni suites automatizadas.
- **Progreso:** 76/183 identificadores auditados; 107 pendientes.
- **Siguiente tarea oficial:** TAREA-F4-P1-05 - Incorporar un panel de gobierno de privacidad y gestión de derechos sobre datos (ARCO).

## 82. Resultado C1.80 - TAREA-F4-P1-05 (2026-11-06)

- **Dictamen:** NO CUMPLE. El backend registra solicitudes ARCO y cambia estados, pero no ejecuta acceso, rectificación, exportación, eliminación u oposición. No se encontró panel de usuario/administrador en UI; la política anuncia un módulo inexistente.
- **Reconciliación:** AUD-NG-145/146 y TASK-499/TASK-500 cubren bitácoras/retención/anonimización; AUD-NG-222/TASK-502 cubre política ABAC común. Nuevo AUD-NG-223/TASK-503 para panel y ejecución end-to-end de derechos ARCO.
- **Evidencia:** USER SHA 12079dd410aa6d8afbce55a4bc62a79dea605f9f; ui-common.js SHA 986938b8a311a41ed4cb3d135b66b6aaea4bed67; politica-de-privacidad.html SHA 8854bae3021e1cdde288709e3fa411b3d6da20c7.
- **Pruebas:** inspección estática/manual; no se ejecutaron HTTP, derechos reales, representación legal, hojas productivas, deployments ni suites automatizadas.
- **Progreso:** 77/183 identificadores auditados; 106 pendientes.
- **Siguiente tarea oficial:** TAREA-F4-P1-06 - Fortalecer la trazabilidad mediante historial de cambios y auditoría de versiones.


## 83. Resultado C1.81 - TAREA-F4-P1-06 (2026-11-06)

- **Dictamen:** NO CUMPLE. USER y ACADEMIC escriben HistorialCambiosEntidad con órdenes de columnas incompatibles; ACADEMIC añade escritores directos de ocho columnas. Los lectores no reconstruyen los registros de forma uniforme; los helpers silencian fallos y el historial general carece de versionado/integridad criptográfica.
- **Efecto UI:** js/secretary.js solicita historial de SolicitudAdmision mediante USER/getEntityAuditHistory, pero el lector interpreta posiciones del esquema USER y no reconoce filas ACADEMIC; además, Secretaría/Director no tienen concesión estática explícita para la acción y dependen de matriz dinámica.
- **Privacidad:** USER redacta solo credenciales y conserva email/teléfono en snapshots; ACADEMIC no sanitiza. Ampliar AUD-NG-145, sin duplicar ID.
- **Reconciliación:** AUD-NG-145 mantiene BitacoraEventos/BitacoraTrazabilidad, DTO, instrumentación y sanitización de logs; TASK-049 solo cubre la cadena de decisiones de workflow. Nuevo AUD-NG-224/TASK-504 para contrato único, migración, escritura común, integridad/versionado general, fallos explícitos, sanitización, autorización/paginación y pruebas.
- **Evidencia:** USER SHA 12079dd410aa6d8afbce55a4bc62a79dea605f9f; ACADEMIC SHA daf1883ec0b8d4f0ff2bc673af8a4e8c5bbd03fc; secretary.js SHA 08a81266957b4c18cc25f8ba6749eac30a8f2c2c; ui-common.js SHA 986938b8a311a41ed4cb3d135b66b6aaea4bed67; tests/regression/academic-grading-suite.js SHA 3433b707edd4a2f35c68368a3172932adc2a3b32.
- **Pruebas:** inspección estática/manual, búsqueda de call sites y comparación de SHA; no se ejecutaron HTTP, hojas productivas, concurrencia, manipulación controlada, deployments ni suites automatizadas.
- **Progreso:** 78/183 identificadores auditados; 105 pendientes.
- **Siguiente tarea oficial:** TAREA-F4-P1-07 - Implementar gestión institucional de roles, cargos, departamentos y asignaciones.


## 84. Resultado C1.82 - TAREA-F4-P1-07 (2026-11-06)

- **Dictamen:** NO CUMPLE. Existen catálogos/endpoints parciales, pero las asignaciones internas no validan el rol catalogado ni aplican fechas de inicio/fin uniformemente; las actualizaciones pisan datos sin conservar todos los atributos y no hay consola HR conectada. El panel dinámico lee la columna Sección como rol y sus tarjetas “Acceder” no navegan.
- **Departamentos/cargos:** CREATE_DEPT/CREATE_CARGO no garantizan unicidad ni referencias válidas; ASSIGN_USER no verifica cuenta activa ni FK, cierra la adscripción previa antes de crear la nueva y carece de lock transaccional; assignDepartmentHead no valida jefe/departamento. La UI usa texto libre.
- **Reconciliación:** TASK-004 está marcada completada, pero sus tests son aserciones de presencia de símbolos; se registran brechas residuales en AUD-NG-225/TASK-505 y AUD-NG-226/TASK-506. TASK-171 mantiene ciclos; TASK-365 organigrama; TASK-006/AUD-NG-017 offboarding; AUD-NG-018 asignaciones académicas; AUD-NG-221/222 permisos/ABAC; AUD-NG-145/224 trazabilidad/versionado.
- **Fuente:** completadas.md solo contiene el título de TAREA-F4-P1-07; AUDITORIA_FASE4_IDENTIDAD_PERMISOS_GOBIERNO.md no está en el árbol. Se contrastó con AUDITORIA_FASE_16_RECURSOS_HUMANOS.md y el código actual.
- **Evidencia:** USER SHA 12079dd410aa6d8afbce55a4bc62a79dea605f9f; ACADEMIC SHA daf1883ec0b8d4f0ff2bc673af8a4e8c5bbd03fc; dashboard-recursos-humanos SHA 406bedbae5a5bb3b5c03e4ea7aaa95ed68aea8ee; ui-common SHA 986938b8a311a41ed4cb3d135b66b6aaea4bed67; tests SHA 3433b707edd4a2f35c68368a3172932adc2a3b32.
- **Pruebas:** inspección estática/manual y revisión de aserciones; no se ejecutaron HTTP, Apps Script, Sheets reales, concurrencia, UI en navegador, deployments ni suites.
- **Progreso:** 79/183 identificadores auditados; 104 pendientes.
- **Siguiente tarea oficial:** TAREA-F4-P1-08 - Implementar un mecanismo central de propagación y recuperación de cambios de seguridad.


## 85. Resultado C1.83 - TAREA-F4-P1-08 (2026-11-06)

- **Dictamen:** NO CUMPLE. USER enruta cuatro handlers de propagación/cola/purga sin definiciones locales; manageAccountState persiste antes de invocar dispatchSecurityEvent y termina en error sin rollback ni propagación confirmada. Los purgadores de ACADEMIC/ACCOUNTING/TASK/EXAM son locales y eliminan revoked_session_<id> en vez de establecerlo. DEVELOPER no recibe eventos ni comprueba revocación/estado.
- **Cachés:** los cinco validadores consumen dynamic_permissions_matrix y active_delegations_<userId>; los purgadores eliminan claves distintas (perm_matrix_/dynamic_perms_ y delegations_). savePermissionMatrix y revokeSecurityDelegation solo invalidan USER. FLUSH_GLOBAL no purga.
- **Reconciliación:** ampliar AUD-NG-005 (propagación/revocación) y AUD-NG-160 (vigencia/invalidación de roles, matriz y delegaciones). AUD-NG-176/TASK-474 conserva la cola general de notificaciones; AUD-NG-219/498, AUD-NG-221/501 y AUD-NG-222/502 conservan delegaciones, matriz y ABAC. No se crean IDs nuevos.
- **Fuente:** completadas.md marca TAREA-F4-P1-08 como [X], pero solo aporta título, origen, severidad y backend/*/Code.gs; la fuente original AUDITORIA_FASE4_IDENTIDAD_PERMISOS_GOBIERNO.md no está en el árbol. Se limita el dictamen al título y a las obligaciones ya documentadas.
- **Evidencia:** USER SHA 12079dd410aa6d8afbce55a4bc62a79dea605f9f; ACADEMIC SHA daf1883ec0b8d4f0ff2bc673af8a4e8c5bbd03fc; ACCOUNTING SHA 38b979d41596b85e888b4a7060b37bbac0840a28; TASK SHA 1437756a3c3d3d97e06bc1ff21c8e2ca2b2dccbe; EXAM SHA 1d93296628fae31f680004f637897e2b1314a64c; DEVELOPER SHA 8aa4bac67cfe5c8c54da51a0784a56fef633e412.
- **Pruebas:** inspección estática/manual y búsqueda dirigida de referencias/definiciones; no se ejecutaron Apps Script, HTTP, ScriptCache real, fallos parciales, reintentos, concurrencia, multiusuario, deployments ni suites.
- **Progreso:** 80/183 identificadores auditados; 103 pendientes.
- **Siguiente tarea oficial:** TAREA-F4-P1-09 - Crear un panel de seguridad, auditoría y cumplimiento institucional.


## 86. Resultado C1.84 - TAREA-F4-P1-09 (2026-11-06)

- **Dictamen:** NO CUMPLE. Los KPI no respetan los filtros aplicados a la tabla; la consulta se corta a 200 eventos sin paginación visible; las consultas de delegaciones desde el panel y el reporte de privilegios pierden el contexto autenticado y usan statusFilter en lugar de estado; los reportes de privilegios/auditoría y el healthReport no se integran en la UI.
- **Reconciliación:** ampliar AUD-NG-145 por renderizado de registros en innerHTML sin escape contextual y AUD-NG-219 por la consulta de delegaciones sin token/contexto. Nuevo AUD-NG-227/TASK-507 para consistencia de indicadores, paginación e integración del panel. No duplicar las fuentes/DTO de logs ni el motor de delegaciones.
- **Evidencia:** USER SHA 12079dd410aa6d8afbce55a4bc62a79dea605f9f; ui-common.js SHA 986938b8a311a41ed4cb3d135b66b6aaea4bed67; dashboard-direccion.html SHA fefaa3bf7884288aef563cfb8aaf244e6cea8b7c; completadas.md SHA f57f1aef832e81e44fc4f7ec36a852d50e464676.
- **Pruebas:** inspección estática/manual y comparación de SHA; no se ejecutaron Apps Script, HTTP, Sheets productivas, navegador/DOM, filtros con datos reales, paginación >200, pruebas multirol, delegaciones reales, health check productivo, XSS ni suites automatizadas.
- **Progreso:** 81/183 identificadores auditados; 102 pendientes.
- **Siguiente tarea oficial:** TAREA-F4-P2-01 - Eliminar la generación de identificadores de usuario basada en marcas de tiempo.


## 87. Resultado C1.85 - TAREA-F4-P2-01 (2026-11-06)

- **Dictamen:** CUMPLE PARCIALMENTE. registerUser ya no genera UserId con timestamp y falla de forma cerrada si generateInstitutionalId no devuelve generatedId. No se acredita unicidad global: ACADEMIC conserva un generador duplicado, un ScriptLock independiente y fallback constante USR-000001.
- **Reconciliación:** no crear AUD-NG/TASK duplicado. Mantener AUD-NG-161/TASK-118 para generadores duplicados, alcance local de ScriptLock, fallback y pruebas conductuales de colisión/concurrencia. AUD-NG-225/226 no corresponden a este ámbito.
- **Evidencia:** USER SHA 12079dd410aa6d8afbce55a4bc62a79dea605f9f; ACADEMIC SHA daf1883ec0b8d4f0ff2bc673af8a4e8c5bbd03fc; tests/regression/academic-grading-suite.js SHA 3433b707edd4a2f35c68368a3172932adc2a3b32; completadas.md SHA f57f1aef832e81e44fc4f7ec36a852d50e464676; ChangesLogs.txt SHA d57cf4bd861b5c3720e60cf83241ed804ff645d9.
- **Pruebas:** inspección estática/manual y búsqueda dirigida. No se ejecutaron Apps Script, HTTP, Sheets productivo, concurrencia cruzada, pruebas de colisión ni suites automatizadas.
- **Progreso:** 82/183 identificadores auditados; 101 pendientes.
- **Siguiente tarea oficial:** TAREA-F4-P2-02 - Implementar una gestión completa del ciclo de vida de cuentas y sesiones.


## 88. Resultado C1.86 - TAREA-F4-P2-02 (2026-11-06)

- **Dictamen:** NO CUMPLE. loginUser emite sessionToken, pero auth.js no lo conserva y api.js no lo transmite; handleLogout solo limpia estado local; logoutUser continúa público y acepta userId/sessionId del payload; la marca de revocación dura 6 horas frente a tokens de 24 horas; login permite Pendiente/InvitacionEnviada aunque verifySessionToken exige Activa; manageAccountState persiste antes de llamar a dispatchSecurityEvent, cuya definición local no aparece en el único Code.gs versionado.
- **Reconciliación:** revalidar AUD-NG-001 y AUD-NG-159; ampliar AUD-NG-005. AUD-NG-160 conserva vigencia de roles/cachés; AUD-NG-006 conserva reintentos/idempotencia. No se crean IDs nuevos.
- **Fuente:** completadas.md marca TAREA-F4-P2-02 como [X], pero no conserva criterios detallados. ChangesLogs.txt solo describe máquina de estados y llamada al dispatcher. La fuente original AUDITORIA_FASE4_IDENTIDAD_PERMISOS_GOBIERNO.md no está en el árbol; el dictamen se limita a la evidencia disponible.
- **Evidencia:** USER SHA 12079dd410aa6d8afbce55a4bc62a79dea605f9f; auth.js SHA 8444dd085a3186106d2db7005b61ef934d3c22d8; api.js SHA 6b24f666db30a811a8e9b38d466fc6001cf6dfa9; ui-common.js SHA 986938b8a311a41ed4cb3d135b66b6aaea4bed67; tests academic-grading-suite.js SHA 3433b707edd4a2f35c68368a3172932adc2a3b32; tests modular-dashboard-suite.js SHA 0495e1d526a872c33310935a003a83d924d34683; completadas.md SHA f57f1aef832e81e44fc4f7ec36a852d50e464676; ChangesLogs.txt SHA d57cf4bd861b5c3720e60cf83241ed804ff645d9.
- **Pruebas:** inspección estática/manual y búsqueda dirigida en ambos archivos bajo tests/regression. No se ejecutaron Apps Script, HTTP, Sheets/CacheService productivos, navegador/DOM, pruebas de TTL, login/logout real ni suites automatizadas.
- **Progreso:** 83/183 identificadores auditados; 100 pendientes.
- **Siguiente tarea oficial:** TAREA-F4-P2-03 - Mejorar la experiencia administrativa de gestión de usuarios, permisos y delegaciones.


## 89. Resultado C1.87 - TAREA-F4-P2-03 (2026-11-06)

- **Dictamen:** NO CUMPLE. El modal está anidado dentro de renderDataFreshnessBadge y no se registra en la carga normal (TASK-480/AUD-NG-183); las llamadas fetchApi invierten service/action/payload y no llegan al backend; getStudents ignora filtros y no devuelve los campos que la UI muestra. No hay UI de permisos/delegaciones, ya cubiertas por AUD-NG-221 y AUD-NG-219.
- **Nuevo hallazgo:** AUD-NG-228/TASK-508 para el contrato de fetchApi y el DTO/filtros del directorio. No duplica TASK-480, AUD-NG-219 ni AUD-NG-221.
- **Evidencia:** ui-common.js SHA 986938b8a311a41ed4cb3d135b66b6aaea4bed67; api.js SHA 6b24f666db30a811a8e9b38d466fc6001cf6dfa9; config.js SHA 49ef90807e5b9dfe1379f76d66efdb4ccd2b6cdc; USER SHA 12079dd410aa6d8afbce55a4bc62a79dea605f9f; dashboard-direccion SHA fefaa3bf7884288aef563cfb8aaf244e6cea8b7c; dashboard-secretaria SHA fa0d8c23aace24a6acab2d4956398a7f5e1309b8; tests SHA 3433b707edd4a2f35c68368a3172932adc2a3b32/0495e1d526a872c33310935a003a83d924d34683.
- **Pruebas:** inspección estática/manual y búsqueda dirigida; no se ejecutaron navegador/DOM, Apps Script, HTTP, Sheets productivo ni suites automatizadas.
- **Progreso:** 84/183 identificadores auditados; 99 pendientes.
- **Siguiente tarea oficial:** TAREA-F4-P2-04 - Optimizar la concurrencia y la consistencia de las operaciones de identidad.


## 90. Resultado C1.88 - TAREA-F4-P2-04 (2026-11-06)

- **Dictamen:** NO CUMPLE. El changelog afirma locks en cuatro operaciones USER; el código solo protege createSecurityDelegation y manageAccountState. revokeSecurityDelegation y updateUserProfile no adquieren lock. getSecurityDelegations escribe Expirada sin lock.
- **Nuevo hallazgo:** AUD-NG-229/TASK-509 por updateUserProfile: read-modify-write de fila completa sin serialización ni control de versión.
- **Reconciliación:** ampliar AUD-NG-219 por revocación/expiración; TASK-118 por inicialización de SecuenciasIDs antes del lock y posibles adquisiciones anidadas; AUD-NG-161 por falta de pruebas conductuales; AUD-NG-218 conserva login counter. No duplicar.
- **Evidencia:** USER Code.gs SHA 12079dd410aa6d8afbce55a4bc62a79dea605f9f; tests SHA 3433b707edd4a2f35c68368a3172932adc2a3b32/0495e1d526a872c33310935a003a83d924d34683; completadas.md SHA f57f1aef832e81e44fc4f7ec36a852d50e464676; ChangesLogs.txt SHA d57cf4bd861b5c3720e60cf83241ed804ff645d9.
- **Pruebas:** inspección estática/manual; no se ejecutaron Apps Script runtime ni pruebas concurrentes reales.
- **Progreso:** 85/183 identificadores auditados; 98 pendientes.
- **Siguiente tarea oficial:** TAREA-F4-P2-05 - Consolidar la documentación institucional de privacidad y tratamiento de datos.


## 91. Resultado C1.89 - TAREA-F4-P2-05 (2026-11-06)

- **Dictamen:** NO CUMPLE. Los documentos declaran 180 días de bitácoras, 30 días de sesiones, 730 días de anonimización y conservación permanente de expedientes académicos/financieros. El motor USER define defaults 365/90/730/3650/2555, no procesa USER_SESSIONS, no archiva registros académicos/financieros y no tiene trigger time-based. La anonimización es parcial y usa fallback incorrecto para fecha; los derechos ARCO no tienen UI ni ejecución.
- **Reconciliación:** ampliar AUD-NG-145 (bitácoras), AUD-NG-146/TASK-499 (motor), AUD-NG-220/TASK-500 (anonimización), AUD-NG-222/TASK-502 (RBAC/ABAC) y AUD-NG-223/TASK-503 (ARCO). Sin IDs nuevos.
- **Evidencia:** privacy SHA 8854bae3021e1cdde288709e3fa411b3d6da20c7; usage SHA ca252904e9f7ad7301d1793ed07585a92a4c060f; financial SHA bb75dc6b72098b825a18025781346b4252fe33cf; USER SHA 12079dd410aa6d8afbce55a4bc62a79dea605f9f; ACADEMIC SHA daf1883ec0b8d4f0ff2bc673af8a4e8c5bbd03fc; ACCOUNTING SHA 38b979d41596b85e888b4a7060b37bbac0840a28.
- **Pruebas:** inspección estática y búsquedas de triggers/UI; no se ejecutó motor ni se consultó hoja productiva.
- **Progreso:** 86/183 identificadores auditados; 97 pendientes.
- **Siguiente tarea oficial:** TAREA-F4-P3-01 - Implementar informes periódicos de revisión de privilegios y cuentas.


## 92. Resultado C1.90 - TAREA-F4-P3-01 (2026-11-06)

- **Dictamen:** NO CUMPLE. Existe generatePrivilegeAndAccountAuditReport, pero solo devuelve JSON bajo invocación; no hay trigger temporal, callsite frontend, persistencia, entrega ni evidencia de revisión. La métrica de delegaciones usa getSecurityDelegations sin contexto y con filtro statusFilter incompatible, por lo que devuelve cero.
- **Nuevo hallazgo:** AUD-NG-230/TASK-510 para periodicidad verificable, persistencia/entrega, revisión formal y corrección del conteo de delegaciones.
- **Reconciliación:** ampliar AUD-NG-219 por consulta de delegaciones sin contexto/filtro; AUD-NG-161 por falta de pruebas específicas. No duplicar AUD-NG-160/220.
- **Evidencia:** USER SHA 12079dd410aa6d8afbce55a4bc62a79dea605f9f; frontend SHA 6fa4c4bd9be580c974b1fbede4f0cf79485dc331/986938b8a311a41ed4cb3d135b66b6aaea4bed67/fefaa3bf7884288aef563cfb8aaf244e6cea8b7c/fa0d8c23aace24a6acab2d4956398a7f5e1309b8; backends SHA daf1883ec0b8d4f0ff2bc673af8a4e8c5bbd03fc/38b979d41596b85e888b4a7060b37bbac0840a28/1437756a3c3d3d97e06bc1ff21c8e2ca2b2dccbe/1d93296628fae31f680004f637897e2b1314a64c/8aa4bac67cfe5c8c54da51a0784a56fef633e412; tests SHA 3433b707edd4a2f35c68368a3172932adc2a3b32/0495e1d526a872c33310935a003a83d924d34683.
- **Pruebas:** inspección estática y búsqueda de triggers/callsites/tests; no se ejecutó Apps Script ni automatización real.
- **Progreso:** 87/183 identificadores auditados; 96 pendientes.
- **Siguiente tarea oficial:** TAREA-F4-P3-02 - Optimizar los informes de auditoría y el diagnóstico de incidencias.


## 93. Resultado C1.91 - TAREA-F4-P3-02 (2026-11-06)

- **Dictamen:** NO CUMPLE. getPaginatedAuditLogReport interpreta BitacoraEventos con índices incorrectos, busca BitacoraTraceability mientras el escritor usa BitacoraTrazabilidad y carga/ordena todas las filas antes de paginar. El dashboard Developer sigue usando getStructuredLogs con filtros incompatibles y sin paginación.
- **Reconciliación:** ampliar AUD-NG-145 por DTO/nombre de hoja/paginación/integración; AUD-NG-161 por falta de pruebas. Sin IDs nuevos.
- **Evidencia:** USER SHA 12079dd410aa6d8afbce55a4bc62a79dea605f9f; developer.js SHA 6fa4c4bd9be580c974b1fbede4f0cf79485dc331; tests SHA 3433b707edd4a2f35c68368a3172932adc2a3b32/0495e1d526a872c33310935a003a83d924d34683.
- **Pruebas:** inspección estática; no se consultaron hojas productivas ni se midió rendimiento.
- **Progreso:** 88/183 identificadores auditados; 95 pendientes.
- **Siguiente tarea oficial:** TAREA-F4-P3-03 - Establecer un sistema de detección y reconciliación de inconsistencias de identidad.


## 94. Resultado C1.92 - TAREA-F4-P3-03 (2026-11-06)

- **Dictamen:** NO CUMPLE. Si Usuarios falta o está vacío, validUserIds queda vacío; con autoFix truthy, todas las delegaciones/adscripciones activas se marcan como huérfanas. La cadena "false" también activa cambios. No hay lock, prevalidación, rollback ni auditoría por registro; la revocación directa no invalida caché; la validación de adscripciones no comprueba deptId/cargoId.
- **Nuevo hallazgo:** AUD-NG-231/TASK-511 para autoFix fail-safe y trazable.
- **Reconciliación:** ampliar AUD-NG-219 por caché de delegaciones; AUD-NG-161 por falta de pruebas. Sin duplicar AUD-NG-229/AUD-NG-005.
- **Evidencia:** USER SHA 12079dd410aa6d8afbce55a4bc62a79dea605f9f; tests SHA 3433b707edd4a2f35c68368a3172932adc2a3b32/0495e1d526a872c33310935a003a83d924d34683; completed SHA f57f1aef832e81e44fc4f7ec36a852d50e464676; changes SHA d57cf4bd861b5c3720e60cf83241ed804ff645d9.
- **Pruebas:** inspección estática; no se ejecutó autoFix real ni Apps Script.
- **Progreso:** 89/183 identificadores auditados; 94 pendientes.
- **Siguiente tarea oficial:** TAREA-F5-001 - Corregir la conversión de aspirantes y garantizar la integridad del expediente.


## C1.96. TAREA-F5-001 — conversión de aspirantes y expediente (2026-11-06)

- **Dictamen:** NO CUMPLE. La relación familiar se marca Verificada por coincidencia de email sin token; la solicitud se marca Convertida antes de completar matrícula/cargos/documentos; no hay rollback/recuperación; flags de override del payload usan truthiness; documentos ausentes pasan; oferta inexistente se asume con capacidad 35/Activa; monto fallback 1500; IDs/persona/usuario siguen cubiertos por TASK-118.
- **Reconciliación:** AUD-NG-036, AUD-NG-129, TASK-118, AUD-NG-161 y AUD-NG-179; nuevos AUD-NG-232/TASK-512 (conversión parcial) y AUD-NG-233/TASK-513 (validación documental/capacidad/overrides).
- **Evidencia:** ACADEMIC SHA daf1883ec0b8d4f0ff2bc673af8a4e8c5bbd03fc; USER SHA 12079dd410aa6d8afbce55a4bc62a79dea605f9f; ACCOUNTING SHA 38b979d41596b85e888b4a7060b37bbac0840a28; tests SHA 3433b707edd4a2f35c68368a3172932adc2a3b32/0495e1d526a872c33310935a003a83d924d34683; informes FASE2-T05/T06.
- **Pruebas:** inspección estática; no se ejecutó Apps Script, correo/token, fallos inyectados ni datos productivos.
- **Progreso:** 90/183 identificadores auditados; 93 restantes.
- **Siguiente tarea oficial:** TAREA-F5-002 — Implementar una máquina de estados y reglas de transición para las solicitudes.


## C1.196. Registro documental de TAREA-F5-002 (2026-11-07)

- Se completó el registro obligatorio en Auditoria.txt y la trazabilidad en MapaDependencias.md del informe F5-002 (SHA e96e9ccc3f8ce56ba58709e57654707a2029b4dd).
- Hallazgos registrados: AUD-NG-234/TASK-514 (reapertura, matriz y bypass de lock), AUD-NG-006 (idempotencia), AUD-NG-145 (historial/correlationId), AUD-NG-233/TASK-513 (guardas de etapa) y AUD-NG-161 (pruebas).
- Dictamen NO CUMPLE. No se modificó código ni pruebas; la implementación permanece pendiente.
- Siguiente tarea indicada por el checkpoint previo: TAREA-F5-003 — implementar identificadores únicos, control de concurrencia e idempotencia en admisiones. El informe debe buscarse en árbol e historial antes de iniciar; si no existe, auditar desde cero y generar informe con tareas ejecutables.


## C1.197. TAREA-F5-003 — IDs, concurrencia e idempotencia en admisiones (2026-11-07)

- **Dictamen:** NO CUMPLE. El generador institucional acepta skipLock y crea/inicializa SecuenciasIDs antes del lock; createAdmissionRequest permite omitir el lock mediante skipLock/isInternalCall desde el payload público; la detección de duplicados no utiliza email; la idempotencia global de doPost solo usa CacheService TTL 21.600, sin reserva atómica ni persistencia durable; registerStudentEnrollment persiste MAT-Date.now() y no tiene lock propio; el ID MAT secuencial generado por conversión se descarta; faltan pruebas conductuales.
- **Reconciliación:** ampliar TASK-118, AUD-NG-006, AUD-NG-234/TASK-514, AUD-NG-129, AUD-NG-145 y AUD-NG-161; coordinar AUD-NG-232/TASK-512. No crear identificadores nuevos.
- **Informe creado desde cero:** AUDITORIAS/AUDITORIA_COMPLETADAS_TAREA-F5-003.md; no existía en árbol ni historial. La marca histórica [X] en completadas.md y ChangesLogs no prueba cumplimiento actual.
- **Corrección cruzada:** se rectificó H4 de F5-002: doPost sí guarda resultados exitosos globalmente (967-968), pero solo en caché y sin reserva atómica/durabilidad. Informe F5-002 actualizado a SHA b1809a57c8ff285b3e1abe983a7a1fd207e54186.
- **Pruebas:** inspección estática/manual; no se ejecutaron suites, Apps Script, HTTP concurrente, datos productivos ni fallos inyectados.
- **Progreso:** 91/183 identificadores auditados; 92 restantes.
- **Siguiente tarea:** TAREA-F5-004 — construir el formulario público de admisión y conectarlo con el backend. Verificar primero informe existente.


## C1.198. TAREA-F5-004 — formulario público de admisión (2026-11-07)

- **Dictamen:** NO CUMPLE. Existe admision.html con cuatro pasos, validaciones cliente, consentimiento ARCO, consulta y modal; sin embargo, los borradores se sincronizan antes del consentimiento y pueden recuperarse públicamente por email/DNI; el seguimiento público acepta código o DNI y devuelve nombres/expedienteId; renderizado innerHTML permite XSS; getAcademicOffers no es público y se consulta con año fijo; parentesco/consentimiento no se envían; backend no valida todos los campos ni oferta; index/login carecen de enlace; accesibilidad parcial.
- **Informe:** AUDITORIAS/AUDITORIA_COMPLETADAS_TAREA-F5-004.md, creado desde cero tras verificar ausencia en árbol/historial.
- **Nuevo hallazgo:** AUD-NG-235 (confidencialidad de endpoints públicos de admisión y salida HTML segura).
- **Reconciliación:** ampliar AUD-NG-006, TASK-118, AUD-NG-145, AUD-NG-161, T-UX-19/T-UX-20 y coordinar AUD-NG-036.
- **Pruebas:** inspección estática/manual; no se ejecutaron navegador, HTTP, XSS dinámico, rate-limit, Apps Script, lector de pantalla ni pruebas móviles.
- **Progreso:** 91/183 del conjunto histórico; AUD-NG-235 se incorpora como hallazgo nuevo y debe reconciliarse en el conteo global.
- **Siguiente tarea:** TAREA-F5-005 — consola administrativa de revisión y decisión de admisiones. Verificar informe existente antes de auditar.


## C1.199. TAREA-F5-005 — consola administrativa de revisión y decisión (2026-11-07)

- **Dictamen:** NO CUMPLE. La consola existe con tabla, métricas, filtros básicos y modal integral, pero fetchApi no transmite sessionToken (AUD-NG-001); getAdmissionRequests no aplica ámbito departamental (TAREA-AD-03); no hay paginación conectada ni filtros por fecha/documentos; falta asignación de revisor y nota interna confidencial; los botones se calculan por estado, no por rol; Reabierta usa ruta ordinaria; la conversión no navega al expediente; hay innerHTML inseguro en paneles.
- **Informe creado desde cero:** AUDITORIAS/AUDITORIA_COMPLETADAS_TAREA-F5-005.md; no existía en árbol ni historial.
- **Reconciliación:** AUD-NG-001, TAREA-AD-03, AUD-NG-234/TASK-514, AUD-NG-235, AUD-NG-145, AUD-NG-006, AUD-NG-161, T-UX-19 y AUD-NG-233/TASK-513. No crear IDs nuevos.
- **Pruebas:** inspección estática/manual; no se ejecutaron HTTP, Apps Script, navegador, concurrencia, XSS dinámico ni suites.
- **Progreso:** 91/183 identificadores del conjunto histórico; sin nuevos IDs.
- **Siguiente tarea:** TAREA-F5-006 — gestión documental de aspirantes antes de la matrícula. Verificar informe existente antes de auditar.


## C1.200. TAREA-F5-006 — gestión documental de aspirantes antes de matrícula (2026-11-07)

- **Dictamen técnico:** NO CUMPLE. La carga backend acepta solicitudId/expedienteId y limita tamaño/0 bytes, pero no existe interfaz/callsite de carga pre-matrícula; Student/Alumno no tiene permiso de carga; MIME se confía al cliente sin Magic Bytes; el catálogo es estático; estados no están normalizados; fallos pueden dejar archivos huérfanos; acceso por documento no verifica pertenencia y la UI usa driveUrl; el proxy no está despachado; la conversión ignora documentos faltantes/EnRevision/Requiere_Sustitucion/vencidos y silencia fallos de migración; faltan alertas y bitácora completa.
- **Informe creado desde cero:** AUDITORIAS/AUDITORIA_COMPLETADAS_TAREA-F5-006.md; ausencia confirmada en árbol e historial.
- **Fuentes:** completadas.md SHA f57f1aef832e81e44fc4f7ec36a852d50e464676, líneas 1986-2021; Pendientes.md blob SHA 631b4c2dbf0e86d5704b63625382d73ccb8ceb3c (lectura íntegra); ChangesLogs.txt SHA d57cf4bd861b5c3720e60cf83241ed804ff645d9.
- **Reconciliación:** TASK-038, TASK-134, TASK-135, TASK-140, TASK-142, TASK-144, TASK-145, TASK-146, TASK-153, AUD-NG-232/TASK-512, AUD-NG-233/TASK-513, AUD-NG-145, AUD-NG-161 y TASK-118. No crear IDs globales duplicados.
- **Tareas derivadas:** cuatro acciones locales F5-006-A01/A02/A03/A04 y ampliaciones de los IDs existentes. Detalle y criterios de cierre en el informe.
- **Pruebas:** inspección estática/manual de Code.gs, secretary.js, student.js, admision.html, dashboard-secretaria.html y suites. No se ejecutaron Apps Script, HTTP, Drive, navegador, concurrencia, fallos inyectados ni suites.
- **Archivos documentales:** informe F5-006 nuevo, Auditoria.txt, MapaDependencias.md, AUDITORIA_COMPLETADAS_PLAN.md y Contexto_personal.txt.
- **Sin cambios:** código, pruebas, completadas.md, Pendientes.md, ChangesLogs.txt, METODOLOGIA_DESARROLLO.md y rama base.
- **Siguiente tarea oficial:** TAREA-F5-007 — módulo de entrevistas y evaluaciones de admisión; verificar informe e historial antes de iniciar.


## C1.201. TAREA-F5-007 — módulo de entrevistas y evaluaciones de admisión (2026-11-07)

- **Dictamen:** NO CUMPLE. Existen hojas, cinco endpoints y paneles, pero el módulo no transmite sessionToken (AUD-NG-001), no valida solicitud/grupos, carece de reprogramación/cancelación/notificaciones y permite estados arbitrarios; el conflicto de agenda no está protegido por lock y el generador se llama skipLock=true; no hay ABAC por evaluador; la UI no transmite rúbrica ni escala cualitativa; no existe política de evaluaciones obligatorias por grado y la guardia Admitida falla abierto si faltan filas; no hay excepción firmada; el log no identifica actor confiable y recordInterviewOutcome no audita; renderizado innerHTML vulnerable; no hay pruebas específicas.
- **Informe creado desde cero:** AUDITORIAS/AUDITORIA_COMPLETADAS_TAREA-F5-007.md; ausencia comprobada en árbol e historial de la rama de trabajo.
- **Fuentes:** completadas.md SHA f57f1aef832e81e44fc4f7ec36a852d50e464676, líneas 2022-2055; Pendientes.md blob SHA 631b4c2dbf0e86d5704b63625382d73ccb8ceb3c recuperado directamente (1.782.094 caracteres/20.182 líneas, sin U+FFFD); ChangesLogs.txt SHA d57cf4bd861b5c3720e60cf83241ed804ff645d9, líneas 1814-1822.
- **Tareas derivadas:** F5-007-A01 a F5-007-A06. Ampliar AUD-NG-001, AUD-NG-234/TASK-514, AUD-NG-145, AUD-NG-235, AUD-NG-161; coordinar TAREA-AD-03/AUD-NG-153 y AUD-NG-233/TASK-513. Sin nuevos IDs globales.
- **Pruebas:** inspección estática/manual de Code.gs, secretary.js, dashboard-secretaria.html, api.js, auth.js y suites. No se ejecutaron Apps Script, HTTP, hojas productivas, navegador, concurrencia, notificaciones, firma digital, XSS dinámico ni suites automatizadas.
- **Archivos documentales:** informe F5-007 nuevo, Auditoria.txt, MapaDependencias.md, AUDITORIA_COMPLETADAS_PLAN.md y Contexto_personal.txt.
- **Sin cambios:** código, pruebas, completadas.md, Pendientes.md, ChangesLogs.txt, metodología y rama base.
- **Continuidad:** C1.200 se conserva como punto de partida; F5-007 queda auditada y NO CUMPLE. Siguiente tarea: TAREA-F5-008 — listas de espera con orden de prelación y asignación controlada de plazas. Buscar primero informe e historial.


## C1.202. TAREA-F5-008 - listas de espera con prelación y asignación controlada (2026-11-07)

- **Dictamen:** NO CUMPLE. La tabla y endpoints existen, pero addToWaitlist no valida estado ni criterios; el puntaje es hardcodeado y no determina posición; el reordenamiento cambia una fila; las ofertas no identifican ni comprueban vacante; no hay lock, expiración, promoción del siguiente ni notificaciones de oferta/rechazo; aceptación no es atómica; familias no tienen endpoint/posición/respuesta; no existe historial completo ni pruebas específicas.
- **Informe creado desde cero:** AUDITORIAS/AUDITORIA_COMPLETADAS_TAREA-F5-008.md; ausencia comprobada en árbol e historial para las rutas específicas y el informe de fase.
- **Fuente:** completadas.md SHA f57f1aef832e81e44fc4f7ec36a852d50e464676, líneas 2057-2089; tarea marcada [X], con 12 puntos de alcance y 10 criterios [x]. ChangesLogs.txt SHA d57cf4bd861b5c3720e60cf83241ed804ff645d9, líneas 1824-1833.
- **Pendientes.md:** lectura ordinaria vacía; blob SHA 631b4c2dbf0e86d5704b63625382d73ccb8ceb3c recuperado directamente (1.782.094 caracteres, 20.182 líneas, sin U+FFFD); línea 5364 advierte skipLock=true en addToWaitlist; no hay entrada directa TAREA-F5-008. No se modifica.
- **Reconciliación:** AUD-NG-001; AUD-NG-179; AUD-NG-234/TASK-514; AUD-NG-145; AUD-NG-161; AUD-NG-233/TASK-513; TAREA-F5-010 (capacidad); TAREA-F5-011 (notificaciones); TAREA-F5-012 (portal familiar). Sin IDs globales nuevos.
- **Tareas derivadas locales:** F5-008-A01 elegibilidad/prelación; A02 reserva atómica; A03 estados/expiración/promoción; A04 consulta/respuesta familiar; A05 notificaciones/trazabilidad; A06 vista administrativa; A07 pruebas. Criterios detallados en el informe.
- **Pruebas:** inspección estática/manual de ACADEMIC, USER, UI administrativa, portal familiar, api/auth y suites; verificación de árbol, historial e integridad del blob Pendientes. No se ejecutaron Apps Script, HTTP, Sheets productivo, navegador, concurrencia real, triggers, correo ni suites automatizadas.
- **Archivos documentales:** informe F5-008 nuevo, Auditoria.txt, MapaDependencias.md, AUDITORIA_COMPLETADAS_PLAN.md y Contexto_personal.txt.
- **Sin cambios:** código, pruebas, completadas.md, Pendientes.md, ChangesLogs.txt, METODOLOGIA_DESARROLLO.md y rama base.
- **Continuidad:** C1.201 queda como checkpoint de inicio; F5-008 auditada NO CUMPLE. Siguiente tarea: TAREA-F5-009 - vinculación familiar y permisos granulares por tutor. Verificar informe/historial antes de iniciar.


## C1.203 - TAREA-F5-009: vinculación familiar y permisos granulares por tutor

- Informe nuevo desde cero: AUDITORIAS/AUDITORIA_COMPLETADAS_TAREA-F5-009.md; no existía en árbol/historial, ni el informe de fase citado.
- Fuente: completadas.md SHA f57f1aef832e81e44fc4f7ec36a852d50e464676 líneas 2090-2128; [X] Completada, 15 puntos/10 criterios. ChangesLogs.txt SHA d57cf4bd861b5c3720e60cf83241ed804ff645d9 líneas 1834-1841.
- Dictamen NO CUMPLE. HALLAZGOS-F5-P0-02 no aparece en Auditoria.txt.
- Pendientes.md blob SHA 631b4c2dbf0e86d5704b63625382d73ccb8ceb3c consultado; sin F5-009 directo; dependencias AUD-NG-036/105/123/136/001/145/161/232/233/234.
- Hallazgos: ACADEMIC sin aislamiento familiar en endpoints de expediente/documentos/asistencia/historial; conversión/saveStudentGuardian crean vínculos sin aceptación; email de aceptación opcional/client-controlled; invitación por solicitud sola pierde expediente; consumo no atómico; no hay revocación de invitación pendiente; flag granular no definido y enforcement solo financiero; RBAC/UI incompletos; esquemas/tablas divergentes; validación USER anidada sin token; getGuardianApplicants no exige vínculo; UI de aceptación/entrega no encontrada; bitácora parcial; suites sin pruebas.
- Ampliar IDs existentes: AUD-NG-001/036/105/123/136/145/161/232/TASK-512/233/TASK-513/234/TASK-514. Coordinar F5-011/F5-012. Sin IDs globales nuevos.
- Tareas derivadas locales F5-009-A01..A08 en informe.
- Pruebas ejecutadas: inspección estática/manual, callsites, RBAC, esquemas, conversión, UI, suites, historial y blob Pendientes. No ejecutados Apps Script, HTTP, Sheets/Drive productivo, navegador, familias reales, correo/push, concurrencia ni suites automatizadas.
- Archivos: informe F5-009 nuevo; Auditoria.txt; MapaDependencias.md; AUDITORIA_COMPLETADAS_PLAN.md; Contexto_personal.txt.
- Sin cambios: código, pruebas, completadas.md, Pendientes.md, ChangesLogs.txt, metodología y rama base.
- Continuidad: C1.202 inicio; C1.203 cierre; sesión IMA-AUDIT-20261107-0325Z cerrada. Siguiente tarea exacta: TAREA-F5-010 - integrar plazas, reservas y matrículas en control de capacidad. Verificar informe/historial antes de auditar.


## C1.204 - TAREA-F5-010: control consistente de capacidad, reservas y matrículas

- **Dictamen:** NO CUMPLE. La oferta académica se escribe con columnas incompatibles con su esquema canónico; reservas se cuentan por grado y no por sección; el timeout del lock se ignora; rutas legacy de matrícula omiten capacidad/lock; expiración no persiste ni audita; override no autentica firma/rol de Dirección; reporte no está expuesto; suites sin cobertura específica.
- **Informe creado desde cero:** AUDITORIAS/AUDITORIA_COMPLETADAS_TAREA-F5-010.md. Se comprobó ausencia en árbol e historial.
- **Fuente:** completadas.md SHA f57f1aef832e81e44fc4f7ec36a852d50e464676 (12 requisitos/9 criterios, marcado [X]); Pendientes.md blob SHA 631b4c2dbf0e86d5704b63625382d73ccb8ceb3c leído íntegro. Relación directa TASK-477/AUD-NG-179; sin entrada directa F5-010.
- **Subtareas locales:** F5-010-A01..A08; detalle y criterios en el informe. Ampliar TASK-477/AUD-NG-179, AUD-NG-234/TASK-514, AUD-NG-145 y AUD-NG-161; coordinar F5-008/F5-011/F5-012. No crear IDs globales duplicados.
- **Pruebas:** inspección estática/manual de backend, RBAC, dispatch, esquema, UI, callsites y suites; lectura de backlog por blob. No ejecutados Apps Script, HTTP, Sheets productivo, navegador, concurrencia real, firma digital ni suites automatizadas.
- **Archivos documentales:** informe F5-010 nuevo; Auditoria.txt; MapaDependencias.md; AUDITORIA_COMPLETADAS_PLAN.md; Contexto_personal.txt.
- **Sin cambios:** código, pruebas, completadas.md, Pendientes.md, ChangesLogs.txt, metodología y rama base.
- **Continuidad:** C1.203 (F5-009) es el checkpoint previo. C1.204 cierra la auditoría F5-010. Siguiente paso: ejecutar F5-010-A01..A08 según dependencias y metodología; no pasar a F5-011 hasta completar las tareas derivadas o documentar bloqueo.


## C1.205 - Desarrollo TAREA-F5-010-A01: esquema de OfertaAcademica

- **Estado:** implementación preparada, no marcada como completada; falta persistencia real y Code Review.
- **Cambios:** adaptador de columnas por encabezado; compatibilidad de lectura legacy; escritura alineada con esquema de 11 campos; capacidad máxima y estado validados; lectores de ofertas, coordinación, horarios, capacidad y analítica actualizados; caché versionada.
- **Pruebas:** mock local del adaptador, 12 aserciones PASS; revisión estática del diff. No ejecutados suite Node completa, Apps Script ni Google Sheets real.
- **Archivos:** backend/academic-service/Code.gs; tests/regression/academic-grading-suite.js; informe F5-010; MapaDependencias.md; ChangesLogs.txt; Contexto_personal.txt.
- **Siguiente:** terminar verificación funcional de A01; después F5-010-A02 (conteo por sección). No iniciar F5-011.


## C1.206 - TAREA-F5-011: notificaciones automáticas y seguimiento de admisión

- **Dictamen:** NO CUMPLE. La conexión ACADEMIC→USER no está implementada como integración interservicio; los hooks de recepción/estado pueden omitirse silenciosamente; faltan eventos de entrevistas, documentos, lista de espera, invitación y conversión; el esquema de BandejaNotificaciones es incompatible; reintentos no programados ni acotados; preferencias no aplicadas; estado Entregado no prueba entrega; no hay BitacoraTraceability append-only, reenvío manual ni pruebas conductuales específicas.
- **Informe nuevo desde cero:** AUDITORIAS/AUDITORIA_COMPLETADAS_TAREA-F5-011.md. Ausencia confirmada en árbol e historial. El informe de fase citado y HALLAZGOS-F5-P1-03 tampoco se encontraron en árbol/historial o Auditoria.txt.
- **Fuente:** completadas.md SHA f57f1aef832e81e44fc4f7ec36a852d50e464676, líneas 2158-2193 (12 puntos/8 criterios, marcada [X]); Pendientes.md blob SHA 631b4c2dbf0e86d5704b63625382d73ccb8ceb3c leído íntegro, sin entrada directa F5-011.
- **Reconciliación:** ampliar AUD-NG-083, AUD-NG-145, AUD-NG-161, AUD-NG-176/TASK-474, AUD-NG-177/TASK-475 y TASK-422; coordinar F5-007-A05, F5-008-A05, F5-009-A06 y F5-012. No crear IDs globales duplicados.
- **Tareas derivadas locales:** F5-011-A01..A09: integración interservicio; cobertura de eventos; esquema canónico/migración; cola durable; preferencias; plantillas seguras; trazabilidad append-only; consola/reenvío; suite conductual. Detalle y criterios en el informe.
- **Pruebas:** inspección estática/manual de ACADEMIC/USER, handlers, dispatch, RBAC, esquema, UI y suites; verificación de árbol/historial y blob Pendientes. No ejecutados Apps Script, HTTP, MailApp, Sheets productivo, triggers, navegador, concurrencia ni suites automatizadas.
- **Archivos documentales:** informe F5-011 nuevo; Auditoria.txt; MapaDependencias.md; AUDITORIA_COMPLETADAS_PLAN.md; Contexto_personal.txt.
- **Sin cambios:** código, pruebas, completadas.md, Pendientes.md, ChangesLogs.txt, metodología y rama base. C1.205 permanece intacto por instrucción del usuario; su implementación previa no se ejecuta ni se valida en esta iteración.
- **Continuidad:** C1.205 es el HEAD de partida publicado; C1.206 cierra la auditoría F5-011. Siguiente tarea: TAREA-F5-012 - seguimiento de aspirantes en el portal familiar; comprobar informe e historial antes de auditar.


## C1.207 - Revalidación TAREA-F5-011 desde el checkpoint válido C1.204

- **Resultado:** TAREA-F5-011 permanece **NO CUMPLE**; se revalidaron los hallazgos H1-H9 y se añadió H10 (riesgo de XSS almacenado en el historial de Secretaría por interpolación de destino/estado sin escape).
- **Fuente de requisitos:** completadas.md SHA f57f1aef832e81e44fc4f7ec36a852d50e464676, líneas 2158-2193; 12 puntos y 8 criterios, marcada [X]. Pendientes.md blob SHA 631b4c2dbf0e86d5704b63625382d73ccb8ceb3c, leído íntegro; sin tarea directa F5-011, con dependencias globales relacionadas.
- **Normalización:** el informe conserva el bloque F5-011-A01..A09 y agrega F5-011-A10 con hallazgo, severidad, archivos, dependencias y criterios verificables. No se crean IDs globales duplicados.
- **Evidencia adicional:** js/config.js confirma proyectos Apps Script separados para USER/ACADEMIC; secretary.js 1384 y USER Code.gs 4830-4882/4937-4971 confirman la cadena de datos sin escape.
- **Pruebas:** inspección estática/manual; no ejecutados navegador, XSS dinámico, Apps Script, HTTP, MailApp, Sheets productivo, triggers ni suites automatizadas.
- **Archivos:** informe F5-011, Auditoria.txt, MapaDependencias.md, este plan y Contexto_personal.txt. Sin cambios en código, pruebas, completadas.md, Pendientes.md, ChangesLogs.txt, metodología o rama base.
- **Siguiente tarea:** TAREA-F5-012 - seguimiento de aspirantes en el portal familiar; verificar informe e historial antes de iniciar.


## C1.208 - TAREA-F5-012: seguimiento de aspirantes en el Portal Familiar

- **Estado administrativo:** completadas.md [X], 13 requisitos/8 criterios [x]; **dictamen técnico: NO CUMPLE**.
- **Informe individual:** AUDITORIAS/AUDITORIA_COMPLETADAS_TAREA-F5-012.md creado desde cero; no existía en árbol ni historial. El informe de fase citado y HALLAZGOS-F5-P0-01 no se pudieron recuperar.
- **Hallazgos principales:** interfaz familiar ausente y guard de rol incompatible; getGuardianApplicants no valida relación activa y devuelve PII; getStudentDocuments permite IDOR por solicitudId/expedienteId; fallback público getPublicAdmissionStatus; getAdmissionDraft público por email; ausencia de documentos/entrevistas/borradores/ofertas en UI; timeline/errores/conversión incompletos; innerHTML sin escape; pruebas específicas ausentes.
- **Reconciliación:** AUD-NG-002/036/145/161/222; TASK-140/142/146/153; F5-006-A01/A03; F5-007-A02/A05; F5-008-A04/A05; F5-009-A01/A03/A06/A08. Sin IDs globales duplicados. Ocho subtareas locales F5-012-A01..A08.
- **Pendientes.md:** blob íntegro SHA 631b4c2dbf0e86d5704b63625382d73ccb8ceb3c; 1.782.094 caracteres, 20.182 líneas, sin U+FFFD; inventario 693 IDs únicos (509 TASK, 184 AUD-NG), sin F5-012 directo.
- **Pruebas:** inspección estática/manual, lectura de blob y verificación árbol/historial. No se ejecutaron Apps Script, HTTP, Sheets/Drive productivos, navegador, cuentas reales, XSS dinámico ni suites.
- **Archivos modificados:** informe F5-012, Auditoria.txt, MapaDependencias.md, este plan y Contexto_personal.txt. Sin cambios en código, pruebas, completadas.md, Pendientes.md, ChangesLogs.txt, metodología ni rama base.
- **Siguiente tarea:** TAREA-F5-013 - integración de cobros, pagos y becas de admisión; comprobar informe individual/historial antes de iniciar.


## C1.209 - TAREA-F5-013: integración de cobros, pagos y becas de admisión

- **Estado administrativo:** completadas.md [X], 14 requisitos/8 criterios [x]; **dictamen técnico: NO CUMPLE**.
- **Informe individual:** AUDITORIAS/AUDITORIA_COMPLETADAS_TAREA-F5-013.md creado desde cero; la ruta no existía en la rama consultada y las búsquedas de contenido/historial no devolvieron informe.
- **Hallazgos principales:** autorización de objeto ausente para consultas/cargos familiares; esquema de cargos sin SolicitudID/tipo de entidad y conceptos hardcodeados; idempotencia check-then-append; comprobantes/pagos no integrados con solicitud; estados/gate incompletos; becas familiares desconectadas del motor contable; conversión sin migración de historial; resumen familiar sin aspirantes; trazabilidad/contabilidad parcial; suites sin cobertura.
- **Reconciliación:** ampliar TASK-001/F15-Task01, TASK-002/F15-Task02, TASK-003/F15-Task03, AUD-NG-036/145/161/222 y coordinar F5-012-A01/A02/A03/A07. Sin IDs globales duplicados.
- **Pendientes.md:** blob íntegro SHA 631b4c2dbf0e86d5704b63625382d73ccb8ceb3c; 1.782.094 caracteres, 20.182 líneas, sin U+FFFD; 509 TASK y 184 AUD-NG únicos, último TASK-511/AUD-NG-231, sin F5-013 directo.
- **Tareas locales:** F5-013-A01..A10, todas Pendientes. Detalle y criterios en el informe individual.
- **Pruebas:** inspección estática/manual de backend, RBAC, dispatch, esquema, pagos, comprobantes, becas, conversión, UI y suites; lectura de blob y verificación de ramas. No ejecutados Apps Script, HTTP, Sheets/Drive productivos, navegador, comprobantes reales, concurrencia ni suites automatizadas.
- **Archivos modificados:** informe F5-013 nuevo; Auditoria.txt; MapaDependencias.md; este plan; Contexto_personal.txt.
- **Sin cambios:** backend/*; js/*; HTML; tests/*; completadas.md; Pendientes.md; ChangesLogs.txt; METODOLOGIA_DESARROLLO.md; rama base.
- **Siguiente tarea:** TAREA-F5-014 - trazabilidad de admisiones y notificaciones de auditoría; verificar primero informe individual e historial.


## C1.210 - TAREA-F5-014: trazabilidad de admisiones y notificaciones de auditoría

- **Estado administrativo:** completadas.md [X], 12 requisitos/7 criterios [x]; **dictamen técnico: NO CUMPLE**.
- **Informe individual:** AUDITORIAS/AUDITORIA_COMPLETADAS_TAREA-F5-014.md creado desde cero; ruta NOT_FOUND e historial de commits vacío en NG_beta_0.0.0.1_work.
- **Hallazgos críticos:** esquema incompatible entre escritores USER/ACADEMIC sobre la misma hoja; diff no generado para creación/conversión/documentos; BitacoraTraceability sin productores automáticos; correlationId no propagado; IP/sesión/actor insuficientes; sanitización no cubre DNI/PII; falta de inmutabilidad verificable; accesos/descargas de menores no registrados; permiso estático de consulta ausente para Secretaría/Dirección; historial no paginado; fallos del logger silenciados; UI con interpolación sin escape; suites sin pruebas F5-014.
- **Reconciliación:** ampliar AUD-NG-145, AUD-NG-161 y AUD-NG-222/TASK-502; coordinar F5-011-A07/A10, F5-012-A07, F5-013-A09 y TASK-474/TASK-475. No crear IDs globales duplicados.
- **Tareas locales:** F5-014-A01..A11, todas Pendientes; detalle, alcance y criterios verificables en el informe individual.
- **Evidencia:** ACADEMIC Code.gs SHA df87a2eea9f0ef79d0b966d03fd5bbe432003df5; USER Code.gs SHA 12079dd410aa6d8afbce55a4bc62a79dea605f9f; ACCOUNTING Code.gs SHA 38b979d41596b85e888b4a7060b37bbac0840a28; TASK Code.gs SHA 1437756a3c3d3d97e06bc1ff21c8e2ca2b2dccbe; EXAM Code.gs SHA 1d93296628fae31f680004f637897e2b1314a64c; js/api.js SHA 6b24f666db30a811a8e9b38d466fc6001cf6dfa9; js/secretary.js SHA 08a81266957b4c18cc25f8ba6749eac30a8f2c2c; dashboard-secretaria.html SHA fa0d8c23aace24a6acab2d4956398a7f5e1309b8; suites SHA a22cb3ef376fe09e65c1b17c2f4f5125290bfba6 y 0495e1d526a872c33310935a003a83d924d34683.
- **Pruebas:** inspección estática/manual, revisión de esquemas/callsites/RBAC/dispatch/UI, árbol Git recursivo no truncado, búsqueda de ruta e historial. No ejecutados Apps Script, HTTP, Sheets/Drive productivos, ACL, navegador/XSS, descargas, concurrencia ni suites.
- **Archivos documentales:** informe F5-014 nuevo, Auditoria.txt, MapaDependencias.md, este plan y Contexto_personal.txt.
- **Sin cambios:** código, pruebas, completadas.md, Pendientes.md, ChangesLogs.txt, metodología y rama base.
- **Siguiente tarea:** TAREA-F5-015 - guardado automático de borradores y recuperación de solicitudes; comprobar informe individual e historial antes de auditar.


## C1.211 - TAREA-F5-015: guardado automático de borradores y recuperación de solicitudes

- **Estado administrativo:** completadas.md [X], 10 requisitos/6 criterios [x]; **dictamen técnico: NO CUMPLE**.
- **Informe individual:** AUDITORIAS/AUDITORIA_COMPLETADAS_TAREA-F5-015.md creado desde cero; ruta NOT_FOUND e historial de commits vacío en NG_beta_0.0.0.1_work. El informe de fase citado y HALLAZGOS-F5-P2-02 no se recuperaron en árbol/historial ni en Auditoria.txt vigente.
- **Hallazgos principales:** cloud get no conectado al formulario; localStorage con escritura retrasada, fallback compartido y PII en texto claro; recuperación elige la primera clave; PUBLIC_ACTIONS permite leer/escribir sin token/propiedad; indicador afirma éxito sin comprobar status; reintentos genéricos sin cola/reconexión; falta guardado manual/fecha visible; upsert sin lock/versionado; local no se elimina al enviar; restauración incompleta; pruebas específicas ausentes.
- **Reconciliación:** ampliar AUD-NG-002 (seguridad y propiedad de borradores) y AUD-NG-161 (pruebas); coordinar T-UX-03/T-UX-17/T-UX-10 y F5-012-A07. Sin IDs globales duplicados.
- **Pendientes.md:** blob íntegro SHA 631b4c2dbf0e86d5704b63625382d73ccb8ceb3c; 1.782.094 caracteres, 20.182 líneas, sin U+FFFD; AUD-NG-002 continúa [ ] Pendiente.
- **Tareas locales:** F5-015-A01..A09, todas Pendientes; detalle y criterios verificables en el informe individual.
- **Evidencia:** ACADEMIC Code.gs df87a2eea9f0ef79d0b966d03fd5bbe432003df5; admision.html 45b84c80d22d2e8dab75852e65847bae6425db44; js/api.js 6b24f666db30a811a8e9b38d466fc6001cf6dfa9; js/ui-common.js 986938b8a311a41ed4cb3d135b66b6aaea4bed67; js/student.js e2888cea60322e49a40b89adadb8010489605dcc; suites a22cb3ef376fe09e65c1b17c2f4f5125290bfba6 y 0495e1d526a872c33310935a003a83d924d34683.
- **Pruebas:** inspección estática/manual, árbol Git recursivo no truncado, historial de rutas, revisión de handlers/RBAC/dispatch/UI/API/suites y lectura íntegra del blob. No ejecutados Apps Script, HTTP, Sheets productivo, navegador, offline/reconexión, concurrencia ni suites automatizadas.
- **Archivos documentales:** informe F5-015 nuevo, Auditoria.txt, MapaDependencias.md, este plan y Contexto_personal.txt.
- **Sin cambios:** backend/*; js/*; HTML; tests/*; completadas.md; Pendientes.md; ChangesLogs.txt; METODOLOGIA_DESARROLLO.md; rama base.
- **Siguiente tarea:** TAREA-F5-016 - accesibilidad WCAG 2.2 AA y adaptación móvil de admisiones; verificar primero informe individual e historial.


## C1.212 - TAREA-F5-016: accesibilidad WCAG 2.2 AA y adaptación móvil de admisiones

- **Estado administrativo:** completadas.md [X], 11 requisitos/6 criterios [x]; **dictamen técnico: NO CUMPLE**.
- **Informe individual:** AUDITORIAS/AUDITORIA_COMPLETADAS_TAREA-F5-016.md creado desde cero; no existía en el árbol ni en el historial de NG_beta_0.0.0.1_work.
- **Hallazgos principales:** stepper de cuatro pasos en vez de seis; progreso sin semántica ARIA; nodos sin estado de error; validación solo en pasos 1/2; mensajes sin aria-describedby/aria-invalid ni foco; texto pequeño de bajo contraste; helper WCAG parcial y sin ejecución inicial; modal sin ciclo de foco; responsividad 320px no verificada; suites sin casos F5-016.
- **Reconciliación:** ampliar AUD-NG-211/TASK-258 (accesibilidad), TASK-484 (pruebas), coordinar TASK-492, TASK-493, TASK-130, AUD-NG-181, T-UX-19/T-UX-20 y TASK-494. Sin IDs globales duplicados.
- **Pendientes.md:** blob íntegro SHA 631b4c2dbf0e86d5704b63625382d73ccb8ceb3c; 1.782.094 caracteres, 20.182 líneas, sin U+FFFD; sin F5-016 directo; TASK-258 y TASK-484 continúan [ ] Pendiente.
- **Tareas locales:** F5-016-A01..A06, todas Pendientes; detalle, alcance y criterios en el informe individual.
- **Evidencia:** admision.html SHA 45b84c80d22d2e8dab75852e65847bae6425db44; js/ui-common.js SHA 986938b8a311a41ed4cb3d135b66b6aaea4bed67; css/style.css SHA f1ff84312ce70949a58eaa099b2aad0ff0a59cb6; academic-grading-suite.js SHA a22cb3ef376fe09e65c1b17c2f4f5125290bfba6; modular-dashboard-suite.js SHA 0495e1d526a872c33310935a003a83d924d34683.
- **Ramas:** C1.210 es el último checkpoint designado por el usuario (HEAD 8ab2fdf7e1825f04a977ff9ac93f52bcb41ae641). HEAD real de NG_beta_0.0.0.1_work al iniciar: 70350a196fe3d944dba0e1a23d8e02e29fe8e7a5; el commit existente C1.211 se conserva como antecedente Git, no se adopta como checkpoint de referencia. Rama base NG_beta_0.0.0.1 permanece en 44d9891132332e692dbe2ba8602b41f50a508a59. Comparación: 279 ahead/0 behind.
- **Pruebas:** inspección estática/manual, matriz 11/6, contraste de colores, árbol/historial, comparación de SHA y lectura íntegra del blob. No ejecutados navegador, teclado, lectores de pantalla, 320px/zoom/orientación, auditoría dinámica ni suites.
- **Archivos documentales:** informe F5-016 nuevo; Auditoria.txt; MapaDependencias.md; este plan; Contexto_personal.txt.
- **Sin cambios:** admision.html; js/ui-common.js; css/style.css; tests/*; completadas.md; Pendientes.md; ChangesLogs.txt; metodología; README de auditorías; rama base.
- **Siguiente tarea:** TAREA-F5-017 - detección y gestión de duplicados, validación y calidad de datos de aspirantes; comprobar primero informe individual e historial.


## C1.213 - TAREA-F5-017: detección de duplicados, validación y calidad de datos de aspirantes

- **Estado administrativo:** completadas.md [X], nueve requisitos/cinco criterios [x]; **dictamen técnico: NO CUMPLE**.
- **Informe individual:** AUDITORIAS/AUDITORIA_COMPLETADAS_TAREA-F5-017.md creado desde cero; la ruta no existía en árbol ni historial de NG_beta_0.0.0.1_work.
- **Hallazgos principales:** falta de validación server-side; normalización incompleta; join PersonaID/UserId incorrecto y fecha de nacimiento leída desde EstadoExpediente; clasificación media por email O teléfono; bloqueo de DNI limitado a solicitudes del mismo año; conversión con vinculación automática por texto en Observaciones; exposición pública del ID de solicitud duplicada junto con el nombre reflejado desde el payload; PII y innerHTML sin escape; discrepancia de roles y actor de auditoría falsificable; esquema de bitácora incompatible; ausencia de corrección trazable; TC-04 con contrato incorrecto y suites sin cobertura.
- **Reconciliación:** ampliar AUD-NG-224/TASK-504 (esquema/actor/fallos de bitácora), AUD-NG-145 (PII) y AUD-NG-161 (pruebas); coordinar F5-007-A05 y F5-012 H8. TASK-113 corresponde a importación Fase 35, no duplica el flujo de admisión. Sin IDs globales duplicados.
- **Pendientes.md:** blob íntegro SHA 631b4c2dbf0e86d5704b63625382d73ccb8ceb3c; 1.782.094 caracteres, 20.182 líneas, sin U+FFFD; sin entrada directa F5-017; AUD-NG-145 y AUD-NG-224/TASK-504 relacionados.
- **Tareas locales:** F5-017-A01..A07, todas Pendientes; detalle y criterios verificables en el informe individual.
- **Evidencia:** ACADEMIC Code.gs SHA df87a2eea9f0ef79d0b966d03fd5bbe432003df5; secretary.js SHA 08a81266957b4c18cc25f8ba6749eac30a8f2c2c; dashboard-secretaria.html SHA fa0d8c23aace24a6acab2d4956398a7f5e1309b8; suites SHA a22cb3ef376fe09e65c1b17c2f4f5125290bfba6 y 0495e1d526a872c33310935a003a83d924d34683; completadas.md SHA f57f1aef832e81e44fc4f7ec36a852d50e464676; ChangesLogs.txt SHA 5b5cff1926b73a05d1b92087a7bf4b2db75326ff.
- **Ramas:** último checkpoint designado expresamente por el usuario C1.210 (HEAD 8ab2fdf7e1825f04a977ff9ac93f52bcb41ae641); HEAD real de partida C1.212 d72e39580df79369b45b418a4773eda25fc36679; base NG_beta_0.0.0.1 permanece en 44d9891132332e692dbe2ba8602b41f50a508a59; 280 ahead/0 behind.
- **Pruebas:** inspección estática/manual de requisitos, handlers, esquema, roles, dispatcher, conversión, UI, TC-04 y suites; árbol/historial, lectura íntegra del blob y comparación de ramas. No ejecutados Apps Script, HTTP, Sheets productivo, navegador/XSS, pruebas por rol, concurrencia ni suites automatizadas.
- **Archivos documentales:** informe F5-017 nuevo; Auditoria.txt; MapaDependencias.md; este plan; Contexto_personal.txt.
- **Sin cambios:** backend/*; js/*; dashboard-secretaria.html; tests/*; completadas.md; Pendientes.md; ChangesLogs.txt; metodología; README de auditorías; rama base.
- **Siguiente tarea:** TAREA-F5-018 - experiencia multiestudiante y resumen familiar consolidado; comprobar informe individual e historial antes de auditar.


## C1.214 - TAREA-F5-017: detección de duplicados, validación y calidad de datos

- **Sesión:** IMA-AUDIT-20261107-1744Z.
- **Checkpoint válido de inicio:** C1.212, commit d72e39580df79369b45b418a4773eda25fc36679, árbol 1e5c70b8fb865aed7592fb3f0ca4298d7453ff91.
- **C1.213:** no se acepta como checkpoint válido por instrucción del usuario. El HEAD de rama antes de publicar era 5307832d34e767dbda5052cc6d0c7295c48565c0; su commit modifica documentación, no código. Los SHA del código y suites inspeccionados son idénticos a C1.212. Se conserva historial, sin reset ni force-push.
- **Rama de trabajo:** NG_beta_0.0.0.1_work. **Rama base protegida:** NG_beta_0.0.0.1, HEAD 44d9891132332e692dbe2ba8602b41f50a508a59. Comparación previa: 281 ahead / 0 behind.
- **Requisito administrativo:** completadas.md [X], nueve requisitos y cinco criterios [x]. La marca no prueba cumplimiento.
- **Informe individual:** AUDITORIAS/AUDITORIA_COMPLETADAS_TAREA-F5-017.md. Ausente en C1.212; su versión provisional C1.213 se volvió a auditar y se sustituye por esta revisión C1.214.
- **Dictamen técnico:** NO CUMPLE. Hallazgos H1-H11: validación de formato ausente; normalización incompleta; join PersonaID/UserId e índice FechaNacimiento incorrectos; matching medio por OR y bloqueo DNI solo mismo año; vinculación automática y destino no validado; respuesta pública enumera solicitud y UI con XSS potencial; discrepancia de permisos estáticos y actor falsificable; bitácora incompatible y silenciosa; corrección sin historial; TC-04 roto/sin cobertura; resolución sin lock/idempotencia.
- **Reconciliación:** ampliar AUD-NG-145, AUD-NG-224/TASK-504 y AUD-NG-161. TASK-113 es importación Fase 35 y no duplica el flujo de admisión. Sin nuevos IDs globales duplicados.
- **Pendientes.md:** blob SHA 631b4c2dbf0e86d5704b63625382d73ccb8ceb3c; lectura íntegra 1.782.094 caracteres / 20.182 líneas / sin U+FFFD; sin tarea directa F5-017.
- **Tareas locales:** F5-017-A01..A07, todas Pendientes y documentadas en el informe individual.
- **Evidencia:** Code.gs df87a2eea9f0ef79d0b966d03fd5bbe432003df5; secretary.js 08a81266957b4c18cc25f8ba6749eac30a8f2c2c; dashboard-secretaria.html fa0d8c23aace24a6acab2d4956398a7f5e1309b8; suites a22cb3ef376fe09e65c1b17c2f4f5125290bfba6 / 0495e1d526a872c33310935a003a83d924d34683.
- **Pruebas ejecutadas:** inspección estática/manual, revisión de handlers/RBAC/dispatcher/UI/esquemas/conversión/TC-04/suites, árbol e historial, SHA y blob Pendientes.
- **No ejecutadas:** Apps Script, Sheets productivo, HTTP, matriz dinámica productiva, navegador/XSS, pruebas por rol, concurrencia y suites.
- **Archivos documentales modificados:** informe individual F5-017, Auditoria.txt, MapaDependencias.md, AUDITORIA_COMPLETADAS_PLAN.md y Contexto_personal.txt.
- **Archivos no modificados:** backend/academic-service/Code.gs; js/secretary.js; dashboard-secretaria.html; tests/*; completadas.md; Pendientes.md; ChangesLogs.txt; METODOLOGIA_DESARROLLO.md; AUDITORIAS/README.md; rama base.
- **Siguiente tarea:** TAREA-F5-018 - experiencia multiestudiante y resumen familiar consolidado; verificar primero informe individual e historial.


## C1.215 - TAREA-F5-018: experiencia multiestudiante y resumen familiar consolidado

- **Sesión:** IMA-AUDIT-20261107-1821Z; checkpoint inicial C1.214; checkpoint de cierre C1.215.
- **Rama:** NG_beta_0.0.0.1_work; HEAD de partida d8919e1dd48b7cb4ab9997db9b26d1d52885cc54; árbol 7404a6d3ad0d7da3c42220f46bd3c8f99dd590ae. Rama base NG_beta_0.0.0.1: 44d9891132332e692dbe2ba8602b41f50a508a59; 282 ahead/0 behind.
- **Fuente:** completadas.md SHA f57f1aef832e81e44fc4f7ec36a852d50e464676, líneas 2383-2412; nueve requisitos/cinco criterios [x]. ChangesLogs.txt SHA 5b5cff1926b73a05d1b92087a7bf4b2db75326ff, líneas 1916-1924. Pendientes.md blob SHA 631b4c2dbf0e86d5704b63625382d73ccb8ceb3c; sin F5-018 directo.
- **Informe:** AUDITORIAS/AUDITORIA_COMPLETADAS_TAREA-F5-018.md creado desde cero; ruta ausente en árbol e historial.
- **Dictamen:** NO CUMPLE. H1-H12: portal familiar inaccesible/DOM ausente; llamadas sin token y permisos estáticos ausentes; cambio de hijo reemplaza identidad autenticada; cache stores dinámicos inválidos; resumen usa índices contables erróneos y falsea solvencia; resumen no distingue estados ni integra datos académicos; permisos por relación fallan abiertos; endpoint de pago no valida actor/vínculos/permisos/montos; pago conjunto no se aplica al libro de cada hijo y no es atómico; revocación no refresca UI; XSS por interpolación sin escape; suites sin cobertura.
- **Tareas locales:** F5-018-A01..A05, todas Pendientes. Detalle y criterios en el informe individual.
- **Reconciliación:** F5-012-A01/A06/A07/A08; F5-009-A03/A04/A05/A08; F5-013-A01/A03/A04/A08/A09/A10; AUD-NG-036; AUD-NG-133; AUD-NG-145; AUD-NG-161; AUD-NG-222/TASK-502. Sin IDs globales duplicados.
- **Evidencia SHA:** USER Code.gs 12079dd410aa6d8afbce55a4bc62a79dea605f9; ACCOUNTING Code.gs 38b979d41596b85e888b4a7060b37bbac0840a28; student.js e2888cea60322e49a40b89adadb8010489605dcc; persistence.js 94ac26feb4f7f31f1f3f2a238e164d23be565d94; api.js 6b24f666db30a811a8e9b38d466fc6001cf6dfa9; student-dashboard.html 6379ea0ed39d71b89747a0280bb925fdf12202c1; suites a22cb3ef376fe09e65c1b17c2f4f5125290bfba6 y 0495e1d526a872c33310935a003a83d924d34683.
- **Pruebas ejecutadas:** inspección manual focalizada de requisitos, roles, tokens, dispatcher, vínculos, resumen, esquemas contables, pagos, selector, caché, API, HTML, suites, SHAs, árbol/historial y blob Pendientes.
- **No ejecutadas:** Apps Script, HTTP, Sheets/Drive productivo, navegador/XSS dinámico, concurrencia ni suites automatizadas.
- **Archivos documentales modificados:** informe F5-018 nuevo; Auditoria.txt; MapaDependencias.md; AUDITORIA_COMPLETADAS_PLAN.md; Contexto_personal.txt.
- **Sin cambios:** backend/*; js/*; HTML; tests/*; completadas.md; Pendientes.md; ChangesLogs.txt; METODOLOGIA_DESARROLLO.md; AUDITORIAS/README.md; rama base.
- **Siguiente tarea:** TAREA-F5-019 - herramientas de seguimiento operativo y análisis de admisiones. Comprobar informe individual e historial antes de auditar; contrastar filtros, métricas, conversiones, exportaciones CSV/PDF, permisos, sanitización y pruebas.


## C1.216 — TAREA-F5-019: herramientas de seguimiento operativo y análisis de admisiones

- **Sesión:** IMA-AUDIT-20261107-1844Z.
- **Checkpoint de inicio:** C1.215; HEAD 3d9b1fefc3f78630cea73272bad04ab4a392502a; árbol cea8bd314a917eec982b2b264e7ff315049423b4.
- **Rama de trabajo:** NG_beta_0.0.0.1_work. **Rama base:** NG_beta_0.0.0.1, HEAD 44d9891132332e692dbe2ba8602b41f50a508a59. Comparación previa 283 ahead / 0 behind.
- **Requisito administrativo:** completadas.md [X], líneas 2414-2437; siete requisitos/cinco criterios [x]. ChangesLogs.txt líneas 1925-1932.
- **Informe individual:** AUDITORIAS/AUDITORIA_COMPLETADAS_TAREA-F5-019.md ausente en árbol e historial; creado desde cero.
- **Origen citado:** el informe AUDITORIA_FASE_5_ADMISIONES_PORTAL_FAMILIAS.md no aparece en el árbol; no se localizó marcador literal HALLAZGOS-F5-P3-01 en Auditoria.txt.
- **Dictamen técnico:** NO CUMPLE. H1-H10: llamada sin token rechazada por validateRolePermission; tasa de conversión con denominador incorrecto; fecha de decisión/actualización ausente y promedio 0; filtros por periodo/nivel/departamento/grado ausentes; contador de estancamiento no consulta documentos/citas/última actividad; interpolación DOM sin escape; motivos genéricos/PII y abandono no analizado; exportación solo CSV y vulnerable a CSV Injection; lectura no acotada/posible creación de hoja; pruebas F5-019 inexistentes.
- **Reconciliación:** AUD-NG-001 (token); AUD-NG-235/AUD-NG-145 (XSS/PII); TASK-237 (exportación anti-inyección y PDF); AUD-NG-161 (pruebas); coordinar TAREA-F5-020 (rendimiento). Sin nuevos IDs globales.
- **Tareas locales:** F5-019-A01..A07, todas Pendientes. Detalle y criterios en el informe individual.
- **Evidencia SHA:** ACADEMIC Code.gs df87a2eea9f0ef79d0b966d03fd5bbe432003df5; dashboard-direccion.html fefaa3bf7884288aef563cfb8aaf244e6cea8b7c; js/teacher.js c475fce5afcd28fca23e7b64398ad32b17773746; js/api.js 6b24f666db30a811a8e9b38d466fc6001cf6dfa9; js/auth.js 8444dd085a3186106d2db7005b61ef934d3c22d8; tests a22cb3ef376fe09e65c1b17c2f4f5125290bfba6 / 0495e1d526a872c33310935a003a83d924d34683.
- **Pruebas ejecutadas:** inspección manual de router, roles, token, esquema, writers, métricas, filtros, DOM, CSV, suites, árbol/historial y blob Pendientes.
- **No ejecutadas:** Apps Script, HTTP, Spreadsheet productivo, navegador/XSS, Excel/LibreOffice, PDF, pruebas de carga ni suites automatizadas.
- **Archivos documentales:** informe F5-019 nuevo; Auditoria.txt; MapaDependencias.md; AUDITORIA_COMPLETADAS_PLAN.md; Contexto_personal.txt.
- **Sin cambios:** backend/*; js/*; HTML; tests/*; completadas.md; Pendientes.md; ChangesLogs.txt; METODOLOGIA_DESARROLLO.md; AUDITORIAS/README.md; rama base.
- **Siguiente tarea:** TAREA-F5-020 - optimizar consultas, sincronización y capacidad de respuesta del proceso de admisión; verificar primero informe e historial, después paginación, caché, invalidación, concurrencia, rate limiting, límites y pruebas.


## C1.217 — TAREA-F5-020: optimización de consultas, sincronización y capacidad de respuesta

- **Sesión:** IMA-AUDIT-20261107-1900Z; inicio C1.216; cierre C1.217.
- **Rama:** NG_beta_0.0.0.1_work; HEAD de partida a858781cb4e2ee2e32e7e2d294a9c49473b68f28; árbol e94ffec04ed7743dc515498e5d8adefdf3fa407c. Base NG_beta_0.0.0.1: 44d9891132332e692dbe2ba8602b41f50a508a59; 284 ahead/0 behind.
- **Fuente administrativa:** completadas.md SHA f57f1aef832e81e44fc4f7ec36a852d50e464676, líneas 2438-2465; siete requisitos/cinco criterios [x], estado [X]. ChangesLogs.txt SHA 5b5cff1926b73a05d1b92087a7bf4b2db75326ff, líneas 1934-1941.
- **Informe individual:** AUDITORIAS/AUDITORIA_COMPLETADAS_TAREA-F5-020.md ausente en árbol e historial; creado desde cero.
- **Origen citado:** AUDITORIA_FASE_5_ADMISIONES_PORTAL_FAMILIAS.md no está en árbol; no se localizó bloque primario HALLAZGOS-F5-P3-01 en Auditoria.txt. El identificador aparece en una nota anterior que informa su ausencia.
- **Dictamen:** NO CUMPLE. H1-H8: Secretaría no solicita page/pageSize y recibe todo; backend lee toda la hoja antes de paginar y no valida límites; caché solo ofertas y gestor declara TTL 12h/FLUSH_GLOBAL ficticio; invalidación parcial y desconectada de updateAdmissionStatus/revokeFamilyLink; portal familiar lee hojas completas aunque usa Promise.all; ausencia de límites de payload/rate limiting; monitoreo parcial y timeout configurable ignorado; no hay pruebas de estrés conductuales.
- **Tareas locales:** F5-020-A01..A07, todas Pendientes; detalle y criterios en informe individual.
- **Archivos inspeccionados/SHA:** ACADEMIC Code.gs df87a2eea9f0ef79d0b966d03fd5bbe432003df5; USER Code.gs 12079dd410aa6d8afbce55a4bc62a79dea605f9f; js/api.js 6b24f666db30a811a8e9b38d466fc6001cf6dfa9; js/secretary.js 08a81266957b4c18cc25f8ba6749eac30a8f2c2c; js/student.js e2888cea60322e49a40b89adadb8010489605dcc; suites a22cb3ef376fe09e65c1b17c2f4f5125290bfba6 / 0495e1d526a872c33310935a003a83d924d34683.
- **Pruebas ejecutadas:** inspección manual de handlers, paginación, cache keys/TTL, invalidación, rutas de mutación, endpoints familiares, fetchApi, consumidores, doPost y suites; verificación de árbol, historial y SHA.
- **No ejecutadas:** Apps Script, HTTP, Sheets productivo, benchmarks/percentiles, estrés, concurrencia, payload límite, rate limiting ni suites automatizadas.
- **Sin cambios:** código, tests, completadas.md, ChangesLogs.txt, metodología, README y rama base.
- **Archivos documentales:** informe F5-020 nuevo; Auditoria.txt; MapaDependencias.md; AUDITORIA_COMPLETADAS_PLAN.md; Contexto_personal.txt.
- **Siguiente tarea:** TAREA-F5-021; verificar su entrada en completadas.md, informe individual e historial y ChangesLogs.txt antes de definir alcance.


===============================================================================
CHECKPOINT C1.218 - 2026-11-07 - AUDITORÍA TAREA-F6-001
Sesión: IMA-AUDIT-20261107-1911Z | checkpoint inicial C1.217 | cierre C1.218
Repositorio: i-miss-cocaine/IMA
Rama base: NG_beta_0.0.0.1 @ 44d9891132332e692dbe2ba8602b41f50a508a59
Rama trabajo: NG_beta_0.0.0.1_work @ ae5dea9f7d342df58a5db393e66691d8249f892e
Comparación: 285 commits ahead, 0 behind; merge-base = HEAD base.
Informe nuevo: AUDITORIAS/AUDITORIA_COMPLETADAS_TAREA-F6-001.md
Dictamen: NO CUMPLE; F6-001 permanece [X] históricamente en completadas.md, sin modificar el registro maestro.
Hallazgos H1-H6: modal/tab no localizado; RoleCapabilities divergente de permisos por acción; token no propagado (amplía AUD-NG-001); contratos UI/API incompatibles; sesión no revalidada; suites sin pruebas F6-001.
Tareas locales: F6-001-A01..A06 pendientes. Se amplían AUD-NG-001, AUD-NG-160 y AUD-NG-221/TASK-501; contratos dependen de F5-017/F6-019.
Archivos inspeccionados y SHAs: teacher-dashboard.html cbb9e6a272a7d8ad33f99727303305d950533e71; teacher.js c475fce5afcd28fca23e7b64398ad32b17773746; auth.js 8444dd085a3186106d2db7005b61ef934d3c22d8; api.js 6b24f666db30a811a8e9b38d466fc6001cf6dfa9; ui-common.js 986938b8a311a41ed4cb3d135b66b6aaea4bed67; ACADEMIC Code.gs df87a2eea9f0ef79d0b966d03fd5bbe432003df5; suites a22cb3ef376fe09e65c1b17c2f4f5125290bfba6 / 0495e1d526a872c33310935a003a83d924d34683.
Pendientes.md: consultado desde blob íntegro SHA 631b4c2dbf0e86d5704b63625382d73ccb8ceb3c (1.803.672 bytes, 1.782.094 caracteres, 20.182 líneas, sin U+FFFD); no modificado.
Pruebas ejecutadas: inspección manual de requisitos, HTML, UI, auth, ROLE_PERMISSIONS, matriz dinámica, dispatcher, contratos, suites, árbol/historial/SHAs.
Pruebas no ejecutadas: Apps Script, HTTP, navegador, MatrizPermisosRoles/delegaciones productivas, llamadas por rol, móvil/escritorio y suites automatizadas.
Archivos modificados: informe F6-001 nuevo; Auditoria.txt; MapaDependencias.md; AUDITORIA_COMPLETADAS_PLAN.md; Contexto_personal.txt.
Archivos no modificados: código, tests, completadas.md, Pendientes.md, ChangesLogs.txt, metodología, README y rama base.
Última tarea auditada: TAREA-F6-001 (NO CUMPLE). Tarea en curso: ninguna.
Siguiente tarea: TAREA-F6-002 - Robustecer las operaciones del ciclo de vida y prevenir estados de matrícula incompatibles (completadas.md:2505-2538).
Próxima acción: buscar informe individual F6-002 e historial; localizar informe de fase 6 y ChangesLogs; revisar criterios; inspeccionar changeStudentSection, recordStudentTransfer, recordStudentWithdrawal, processStudentReentry, renewStudentEnrollment, Matriculas, ExpedientesEstudiantes y LockService.
HEAD de partida verificado: ae5dea9f7d342df58a5db393e66691d8249f892e. Commit de cierre: el commit que contiene este checkpoint; SHA confirmado externamente tras publicar.
Hora UTC de cierre: 2026-11-07T19:16:22Z. Sesión cerrada.
===============================================================================


===============================================================================
CHECKPOINT C1.219 - 2026-11-07 - AUDITORÍA TAREA-F6-002
Sesión: IMA-AUDIT-20261107-1943Z | checkpoint inicial C1.218 | cierre C1.219
Repositorio: i-miss-cocaine/IMA
Rama base: NG_beta_0.0.0.1 @ 44d9891132332e692dbe2ba8602b41f50a508a59
Rama trabajo: NG_beta_0.0.0.1_work @ 8c492238f99f7902c7468b06676aab819f9eab35
Árbol inicial: fef688a80199fcba7b620cea2c5bfaad4dbffccc. Comparación al checkpoint C1.218: 285 ahead, 0 behind.
Informe nuevo: AUDITORIAS/AUDITORIA_COMPLETADAS_TAREA-F6-002.md
Dictamen: NO CUMPLE; TAREA-F6-002 permanece [X] histórico en completadas.md, sin alterar el registro maestro.
Hallazgos H1-H10: escrituras parciales sin rollback; matriz de estados omitida por endpoints; validaciones de expediente/matrícula/periodo incompletas; traslado solicitado se marca completado; retiro temporal/definitivo indistintos; promoción no usa periodo cerrado; graduación sin requisitos; idempotencia opcional/cache 6h y sin reserva concurrente; conciliación limitada; fechaRegistro no explícita; UI/pruebas incompletas.
Tareas locales: F6-002-A01..A10 pendientes. TAREA-F6-003 se mantiene como dependencia para la suite general.
Código auditado: backend/academic-service/Code.gs SHA df87a2eea9f0ef79d0b966d03fd5bbe432003df5; líneas clave: 1546-1553, 279-318, 2510-2614, 3965-4081, 11147-11243, 11271-11395, 11403-11480, 11819-12248.
UI SHAs: dashboard-secretaria.html fa0d8c23aace24a6acab2d4956398a7f5e1309b8; secretary.js 08a81266957b4c18cc25f8ba6749eac30a8f2c2c; teacher-dashboard.html cbb9e6a272a7d8ad33f99727303305d950533e71; teacher.js c475fce5afcd28fca23e7b64398ad32b17773746.
Tests SHAs: academic-grading-suite.js a22cb3ef376fe09e65c1b17c2f4f5125290bfba6; modular-dashboard-suite.js 0495e1d526a872c33310935a003a83d924d34683.
Pendientes.md: blob SHA 631b4c2dbf0e86d5704b63625382d73ccb8ceb3c, 1.803.672 bytes, 1.782.094 caracteres, 20.182 líneas, sin U+FFFD; lectura convencional 0 caracteres. Consultado, no modificado.
Informe de fase AUDITORIA_FASE_6_EXPEDIENTE_CICLO_VIDA.md: ausente del árbol e historial de rama; informe individual F6-002 no existía.
Pruebas ejecutadas: inspección manual dirigida de requisitos, funciones, dispatcher, estado, idempotencia, locks, movimientos, UI, suites, blob Pendientes e historial de ruta.
Pruebas no ejecutadas: Apps Script, navegador, Google Sheets productivo, HTTP, concurrencia real, fallos simulados, recuperación y configuración de graduación.
Archivos modificados: informe F6-002 nuevo; Auditoria.txt; MapaDependencias.md; AUDITORIA_COMPLETADAS_PLAN.md; Contexto_personal.txt.
Archivos no modificados: código, JS, HTML, tests, completadas.md, Pendientes.md, ChangesLogs.txt, metodología, README y rama base.
Última tarea auditada: TAREA-F6-002 (NO CUMPLE). Tarea en curso: ninguna.
Siguiente tarea: TAREA-F6-003 - Establecer una batería automatizada de regresión para el ciclo de vida del estudiante (completadas.md inmediatamente después de F6-002).
Próxima acción: buscar informe individual F6-003 e historial; revisar alcance de la suite; inspeccionar pruebas en backend/academic-service/Code.gs y tests/regression; comprobar cada flujo, fixture, concurrencia, fallos y persistencia, sin ejecutar sobre datos productivos.
HEAD de partida verificado: 8c492238f99f7902c7468b06676aab819f9eab35. Commit de cierre: el commit que contiene este checkpoint; SHA confirmado externamente tras publicar.
Hora UTC de cierre: 2026-11-07T20:04:00Z. Sesión cerrada.
===============================================================================


===============================================================================
CHECKPOINT C1.220 - 2026-11-07 - AUDITORÍA TAREA-F6-003
Sesión: IMA-AUDIT-20261107-1953Z | checkpoint inicial C1.219 | cierre C1.220
Repositorio: i-miss-cocaine/IMA
Rama base: NG_beta_0.0.0.1 @ 44d9891132332e692dbe2ba8602b41f50a508a59
Rama trabajo: NG_beta_0.0.0.1_work @ e1de4306ab4ddeb7de91494f96c17e695f5e8b69
Árbol de partida: c7a7367d1ba053e5a3938c0450e2fa11eb53f09b. Comparación al inicio: 287 ahead, 0 behind.
Checkpoint C1.219 consignaba 8c492238 como HEAD previo; e1de430 es su commit documental descendiente, sin divergencia.
Informe nuevo: AUDITORIAS/AUDITORIA_COMPLETADAS_TAREA-F6-003.md
Dictamen: NO CUMPLE; TAREA-F6-003 permanece [X] histórico en completadas.md.
Hallazgos H1-H10: suite conectada a spreadsheet productivo y registra LogsSistema; TC-07 puede insertar matrícula y no prueba concurrencia/idempotencia; TC-04 usa parámetros incompatibles; TC-01/03 son estáticos; TC-02/05 solo validan formato; TC-06 no compara snapshots; cobertura de expediente/Drive/tutores/movimientos/permisos/backups ausente; sin fallos/reintentos; reporte ambiguo; no runner/CI.
Tareas locales: F6-003-A01..A09 pendientes; ver informe individual.
Código auditado: backend/academic-service/Code.gs SHA df87a2eea9f0ef79d0b966d03fd5bbe432003df5; suite línea 3964, dispatcher 892, permisos 168, capacidad 11147, matrícula 11271, conciliación 12199, duplicados 10107, merge 10282, tutores 10553, documentos 10693.
Otros backend SHAs: user-service 12079dd410aa6d8afbce55a4bc62a79dea605f9f; accounting-service 38b979d41596b85e888b4a7060b37bbac0840a28; developer-service 8aa4bac67cfe5c8c54da51a0784a56fef633e412.
Tests: academic-grading-suite.js a22cb3ef376fe09e65c1b17c2f4f5125290bfba6; modular-dashboard-suite.js 0495e1d526a872c33310935a003a83d924d34683. Solo dos scripts en tests/regression; no runner/CI identificado.
Pendientes.md: blob SHA 631b4c2dbf0e86d5704b63625382d73ccb8ceb3c, 1782094 caracteres, 20182 líneas; lectura convencional 0 caracteres; no contiene F6-003. Consultado, no modificado.
ChangesLogs.txt SHA 5b5cff1926b73a05d1b92087a7bf4b2db75326ff, líneas 1945-1948: solo registra adición de TC-06/TC-07.
Informe individual F6-003 e informe de fase 6 ausentes del árbol/historial consultado.
Pruebas ejecutadas: inspección estática de casos, payloads, efectos secundarios, locks, RBAC, dispatcher, logs, dependencias, scripts, tree e historial.
Pruebas no ejecutadas: suite, Apps Script, Sheets, Drive, navegador, HTTP, concurrencia, fallos inyectados, reintentos, persistencia y respaldos; se evitó ejecutar código conectado a producción.
Archivos modificados: nuevo informe F6-003; Auditoria.txt; MapaDependencias.md; AUDITORIA_COMPLETADAS_PLAN.md; Contexto_personal.txt.
Archivos no modificados: código, JS, HTML, tests, completadas.md, Pendientes.md, ChangesLogs.txt, metodología, README y rama base.
Última tarea auditada: TAREA-F6-003 (NO CUMPLE). Tarea en curso: ninguna.
Siguiente tarea: TAREA-F6-004 - Reestructurar la arquitectura en microservicios independientes.
Próxima acción: buscar informe individual F6-004 e historial; comprobar si existe auditoría de fase y ChangesLogs; revisar alcance en completadas.md/Pendientes.md; verificar contratos, despliegues, enrutamiento, SERVICE_REGISTRY, fallback SERVICE_URLS, aislamiento y comunicación interservicio; contrastar cada requisito con código y pruebas, sin modificarlo durante la auditoría.
HEAD de partida verificado: e1de4306ab4ddeb7de91494f96c17e695f5e8b69. Commit de cierre: el commit que contiene este checkpoint; SHA confirmado externamente tras publicar.
Hora UTC de cierre: la registra el timestamp GitHub del commit de cierre. Sesión cerrada.
===============================================================================
