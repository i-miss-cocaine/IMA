# AUDITORÍA TÉCNICA - TAREA-F6-015: Validar rendimiento, capacidad y recuperación de la arquitectura completa

**Fecha:** 2026-11-07  
**Repositorio:** i-miss-cocaine/IMA  
**Rama:** NG_beta_0.0.0.1_work  
**Checkpoint inicial:** C1.231  
**Checkpoint de cierre:** C1.232  
**Sesión operativa:** IMA-AUDIT-20261107-2134Z-01 (no es ID nativo de ChatGPT)  
**HEAD auditado:** 585a6a797c781fbbb1b22cca8a52a6fa07e02ae9  
**Dictamen:** **NO CUMPLE**  
**Estado histórico en completadas.md:** [X] (se conserva sin modificación).

## 1. Continuidad y alcance

- HEAD inicial verificado: 585a6a797c781fbbb1b22cca8a52a6fa07e02ae9; árbol: a135fedf043aaff16f735df6a4c2b3f975041eec.
- Rama base NG_beta_0.0.0.1: 44d9891132332e692dbe2ba8602b41f50a508a59; comparación inicial 299 adelante, 0 atrás.
- completadas.md SHA f57f1aef832e81e44fc4f7ec36a852d50e464676: F6-015 marcada [X], criterios CA-074..CA-077. La marca histórica se conserva.
- No existía AUDITORIAS/AUDITORIA_COMPLETADAS_TAREA-F6-015.md ni un informe individual F6-040. Se omite el informe previo inexistente y se auditan los requisitos directamente.
- Pendientes.md: lectura normal sin contenido; blob esperado SHA 631b4c2dbf0e86d5704b63625382d73ccb8ceb3c, 1.803.672 bytes, 1.782.094 caracteres y 20.182 líneas, se consultó como referencia de continuidad. No se modificó.
- ChangesLogs.txt SHA 5b5cff1926b73a05d1b92087a7bf4b2db75326ff registra F6-015 como completada por la mera verificación de runFullArchitectureIntegrationAndPerformanceSuite; F6-040 atribuye a la misma suite pruebas de carga, resiliencia y multi-servicio que el código no demuestra.
- Alcance: rendimiento, capacidad, carga, concurrencia, resiliencia, tolerancia a fallos, idempotencia, recuperación, integridad, cuotas GAS/Sheets/Drive, multirol y continuidad de dashboards.

## 2. Archivos y evidencia inspeccionada

- backend/developer-service/Code.gs SHA 8aa4bac67cfe5c8c54da51a0784a56fef633e412: runFullArchitectureIntegrationAndPerformanceSuite (aprox. 91194+); getServiceHealthDiagnostics (113601+).
- backend/academic-service/Code.gs SHA df87a2eea9f0ef79d0b966d03fd5bbe432003df5: getPaginatedAcademicHistory (169191+); withConcurrencyLock/runConcurrencyAndConsistencySuite (171177+); reconcileRestoredDataIntegrity (551117+); verifyBackupIntegrity (545669+); restoreSystemBackup (548240+).
- backend/user-service/Code.gs SHA 12079dd410aa6d8afbce55a4bc62a79dea605f9f: getOperationalCapacityMetrics (197505+); verifySessionToken (aprox. 61034+).
- backend/accounting-service/Code.gs SHA 38b979d41596b85e8884b7060b37bbac0840a28: generateBatchMonthlyCharges (135505+); recordStudentPayment (177205+).
- backend/task-service/Code.gs SHA 1437756a3c3d3d97e06bc1ff21c8e2ca2b2dccbe: getOrCreateFolder (56638+).
- backend/exam-service/Code.gs SHA 1d93296628fae31f680004f637897e2b1314a64c: verifySessionToken (6678+).
- js/api.js SHA 6b24f666db30a811a8e9b38d466fc6001cf6dfa9: fetchApi (11+), reintentos y fallback.
- js/config.js SHA 49ef90807e5b9dfe1379f76d66efdb4ccd2b6cdc: SERVICE_URLS y SERVICE_REGISTRY.
- js/developer.js SHA 6fa4c4bd9be580c974b1fbede4f0cf79485dc331; developer-dashboard.html SHA 2b69f1bf7ffbbe4902e81de14d6315cedb035a1e.
- js/auth.js SHA 8444dd085a3186106d2db7005b61ef934d3c22d8.
- tests/regression/academic-grading-suite.js SHA a22cb3ef376fe09e65c1b17c2f4f5125290bfba6; tests/regression/modular-dashboard-suite.js SHA 0495e1d526a872c33310935a003a83d924d34683.

## 3. Hallazgos

### H1 - CRÍTICO/P0: suite de rendimiento no ejecuta carga, concurrencia ni medición de latencia

runFullArchitectureIntegrationAndPerformanceSuite ejecuta cinco casos secuenciales: consultar registro, consultar catálogo de contratos, consultar diagnóstico, ejecutar un comando operativo y administrar una combinación de roles. No crea usuarios/sesiones paralelas, no simula admisión/matrícula/pagos/asistencia simultáneos, no repite solicitudes bajo carga ni establece umbrales de latencia/throughput. duracionTotalMs mide el tiempo de esa única ejecución secuencial, no un benchmark reproducible.

### H2 - CRÍTICO/P0: tolerancia a fallos declarada sin inyectar una falla

PERF-03-FAULT_TOLERANCE_SIMULATION solo llama getServiceHealthDiagnostics. Esta función devuelve connectivity, spreadsheetAccess y permissions como PASS constantes y HEALTHY, midiendo el tiempo de ejecución local de la función. No corta endpoint, Drive ni Sheets, no prueba aislamiento de fallos ni comprueba continuidad de otro servicio independiente.

### H3 - ALTO/P1: concurrencia no probada y bloqueos con alcance desigual

runConcurrencyAndConsistencySuite adquiere y libera un ScriptLock una sola vez mediante withConcurrencyLock; no genera dos o más ejecuciones contendientes ni comprueba orden, exclusión mutua, duplicados o consistencia. Existen locks puntuales en operaciones como generateBatchMonthlyCharges y getOrCreateFolder, pero no se acredita cobertura integral ni aislamiento entre servicios/deployments. En getOrCreateFolder se ignora el booleano de tryLock(15000), por lo que puede continuar sin confirmar adquisición y finalmente liberar un lock no adquirido.

### H4 - ALTO/P1: métricas operativas incompletas y no equivalentes a cuotas reales

getOperationalCapacityMetrics lee BitacoraTrazabilidad completa, agrupa duraciones y errores, calcula latencia promedio y tasa de error. No produce percentiles p50/p95/p99, máximos, throughput por ventana, series temporales, tamaños de muestra, utilización ni proyección de capacidad. Detecta cuota solo por palabras quota/limit/cuota en texto libre. No consulta límites/cuotas de Apps Script, Sheets, Drive ni APIs, y no mide directamente tiempos de ejecución por etapa. El health check de DEVELOPER es sintético, no consulta recursos.

### H5 - ALTO/P1: paginación superficial sobre lecturas completas

getPaginatedAcademicHistory usa sheet.getDataRange().getValues() y carga todas las filas antes de filtrar, ordenar y aplicar slice. El tamaño de página limita la respuesta, no el volumen leído ni memoria/procesamiento. Otros flujos inspeccionados también usan getDataRange().getValues() para cargar hojas completas, incluyendo verificación de sesión (Usuarios), conciliación de recuperación y operaciones contables. No se evidencia estrategia transversal de rangos acotados, cursor o procesamiento por lotes.

### H6 - CRÍTICO/P0: recuperación declara éxito sin verificar integridad suficiente y no es transaccional

verifyBackupIntegrity usa computeSimpleHash y acepta checksum no vacío por la condición (storedChecksum === computedChecksum || Boolean(storedChecksum)); por tanto, un checksum incorrecto pero presente puede pasar. restoreSystemBackup escribe hojas en el Spreadsheet activo y no demuestra snapshot previo, transacción, rollback automático ni aislamiento por servicio. reconcileRestoredDataIntegrity inspecciona solo CalificacionesEstudiantes e HistorialAcademico, establece reconciliacionCompletada=true y retorna status success incluso si detecta inconsistencias. No valida relaciones completas, documentos Drive, movimientos contables, matrículas y referencias interservicio, ni su resultado bloquea la recuperación.

### H7 - ALTO/P1: idempotencia parcial, opcional y no uniforme frente a reintentos POST

fetchApi reintenta hasta dos veces solicitudes POST ante determinados errores de red, sin distinguir lecturas de operaciones mutables ni inyectar una clave idempotente estable/correlation ID. recordStudentPayment acepta idempotencyKey/tokenTransaccion/referencia opcionales y consulta registros existentes, pero no se demuestra reserva atómica de la clave antes de escribir. generateBatchMonthlyCharges usa ScriptLock y deduplicación lógica por alumno/concepto/período, pero no acredita deduplicación de toda la operación de lote ni respuesta perdida/reintento concurrente. Los mecanismos son locales y no constituyen una garantía uniforme multi-servicio.

### H8 - ALTO/P1: fallos de red pueden degradarse a respuesta de fallback ambigua

fetchApi presenta fallback para errores de red; operaciones get pueden devolver estructuras vacías con isFallback. Esto evita romper la interfaz, pero no prueba continuidad de funciones independientes ni obliga a cada dashboard a distinguir indisponibilidad de ausencia legítima de datos. No hay matriz de capacidades degradadas ni prueba de aislamiento de servicios.

### H9 - ALTO/P1: multirol y continuidad tras migraciones no están validados de extremo a extremo

La suite invoca manageUserMultiRolePermissions con usuario de prueba sintético y dos roles, pero no valida identidad institucional única, permisos efectivos en dispatchers de cada servicio, denegación de privilegios cruzados ni comportamiento de dashboards. No se encontró una suite que compare flujos antes/después de migración/despliegue y compruebe accesibilidad de funciones existentes, referencias y permisos.

### H10 - ALTO/P1: suite de regresión no acredita los criterios F6-015/F6-040

Los dos archivos de tests/regression son scripts de aserciones estructurales y casos de alcance distinto; no contienen casos identificados F6-015/F6-040 ni ejecutan escenarios de carga, contención real, caída de servicio, reintentos con respuesta perdida, restore aislado, integridad multi-servicio o regresión E2E. No se identificó runner/CI que genere artefactos reproducibles para estas tareas.

## 4. Matriz de criterios de aceptación

| Criterio | Dictamen | Evidencia |
|---|---|---|
| CA-074: nueva instancia académica sin afectar existentes | No cumple | No hay prueba de aprovisionamiento/carga concurrente ni medición antes/después. |
| CA-075: caída simulada no bloquea servicios independientes | No cumple | PERF-03 solo llama health check sintético; no inyecta caída. |
| CA-076: reintentos sin duplicados/inconsistencias | Parcial | Hay dedupe/locks en operaciones puntuales; claves opcionales y sin garantía uniforme/atómica. |
| CA-077: E2E con integridad, permisos y observabilidad | No cumple | Sin E2E ejecutada ni suite específica que verifique todos los dominios. |

**Dictamen F6-015: NO CUMPLE.**

## 5. Tareas derivadas y reconciliación

No se crean IDs globales AUD-NG ni tareas locales duplicadas. Se amplían tareas canónicas ya existentes:
- F6-003-A01..A09: entorno aislado, pruebas conductuales, concurrencia/idempotencia, flujos multi-servicio, fallos/reintentos, reporte y runner/CI. Ampliar con carga reproducible, perfiles de volumen, latencia percentil y aislamiento de fixtures.
- F6-009-A03: telemetría real de tráfico, latencia, rendimiento y cuotas. Ampliar con p50/p95/p99, throughput, máximos, ventana temporal y fuente verificable de cuotas GAS/Sheets/Drive.
- F6-009-A06: pruebas de diagnóstico y mapa de dependencias. Ampliar con inyección controlada de fallos, degradación independiente y recuperación de salud.
- F6-011-A01..A06: checksum/manifiesto, aislamiento por servicio, restore transaccional, reconciliación referencial, retención/capacidad, dashboard/pruebas/runbook. Ampliar con recuperación reproducible y validación bloqueante de integridad antes/después.
- AUD-NG-006, AUD-NG-133 y AUD-NG-161: ampliar alcance para idempotencia atómica por operación y lote, reintentos POST y concurrencia real.
Todas las tareas continúan **Pendientes**; la marca histórica [X] de F6-015 no se cambia.

## 6. Pruebas y límites

- Ejecutadas: inspección estática/manual de suites, locks, paginación, métricas, fallback, reintentos, idempotencia, backups, recuperación, matrices de permisos, dashboard, tests, SHAs, árbol Git e historial.
- No ejecutadas: Apps Script runtime, benchmark, carga, concurrencia real, HTTP, OAuth, Drive/Sheets productivas, caída inyectada, reintentos de red, restauración, navegador ni E2E.
- No se modificó código, configuración ni datos productivos.


## 7. Cierre

- TAREA-F6-015: **NO CUMPLE**.
- La marca [X] histórica se conserva.
- Informe complementario de alcance ampliado: AUDITORIAS/AUDITORIA_COMPLETADAS_TAREA-F6-040.md.
- La siguiente auditoría debe continuar con el siguiente registro cronológico posterior a F6-040.
