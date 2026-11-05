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
9. Commits modulares por lote, siempre en \`NG_beta_0.0.0.1_work\`. No hacer merge, no modificar la rama base, no alterar \`ChangesLogs.txt\` por ser auditoría sin cambios de código.

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

Los lotes se subdividirán si el tamaño de los archivos, dependencias o cuota lo exige. Cada commit debe dejar un checkpoint exacto de tareas revisadas, archivos inspeccionados, SHA de respaldo, evidencia y siguiente punto.

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
