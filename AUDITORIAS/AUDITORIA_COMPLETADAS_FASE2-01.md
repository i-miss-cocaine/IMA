AUDITORÍA DE TAREAS COMPLETADAS - FASE2-01
FECHA: 2026-11-05
REPOSITORIO: i-miss-cocaine/IMA
RAMA: NG_beta_0.0.0.1_work
HEAD DE PARTIDA: c56025c1ff88905f7be530d89ace3c4b8da79a42
================================================================

DICTAMEN: NO CUMPLE. Existen descriptores de servicios y funciones auxiliares HMAC, pero el protocolo no está integrado en el tráfico real y no se acredita aislamiento entre servicios. Los cinco servicios USER, ACCOUNTING, ACADEMIC, TASK y EXAM utilizan el mismo SPREADSHEET_ID; el enrutador universal no es consumido de forma general. Las suites de diagnóstico no prueban el aislamiento ni la comunicación entre deployments.

ALCANCE Y EVIDENCIA
- completadas.md identifica FASE2-01 como "Protocolo de Interoperabilidad y Aislamiento entre Servicios Departamentales"; archivos declarados: js/config.js, js/api.js, backend/user-service/Code.gs y backend/accounting-service/Code.gs.
- El informe de origen AUDITORIA_FASE2_ARQUITECTURA_INTEROPERABILIDAD.md citado por ChangesLogs.txt no está presente en el árbol de la rama; se usa el alcance explícito de completadas.md.
- js/config.js SHA 49ef90807e5b9dfe1379f76d66efdb4ccd2b6cdc.
- js/api.js SHA 6b24f666db30a811a8e9b38d466fc6001cf6dfa9.
- backend/user-service/Code.gs SHA 12079dd410aa6d8afbce55a4bc62a79dea605f9f.
- backend/accounting-service/Code.gs SHA 38b979d41596b85e888b4a7060b37bbac0840a28.
- Contraste: backend/academic-service/Code.gs SHA daf1883ec0b8d4f0ff2bc673af8a4e8c5bbd03fc; backend/task-service/Code.gs SHA 1437756a3c3d3d97e06bc1ff21c8e2ca2b2dccbe; backend/exam-service/Code.gs SHA 1d93296628fae31f680004f637897e2b1314a64c; backend/developer-service/Code.gs SHA 8aa4bac67cfe5c8c54da51a0784a56fef633e412.

1. PROTOCOLO INTERSERVICIO
- USER, ACCOUNTING, ACADEMIC y DEVELOPER definen createInterServiceEnvelope/verifyInterServiceEnvelope, pero cada símbolo solo aparece como definición, sin consumidores.
- doPost de USER (1351), ACCOUNTING (572), ACADEMIC (671), TASK (368), EXAM (345) y DEVELOPER (145) no verifican sobre interservicio antes del despacho; realizan validación de usuario/rol o permisos y procesan el action.
- La ruta real delegateToTaskService (USER, 7946) envía JSON plano {action,payload} por UrlFetchApp.fetch, sin firma, identidad de servicio, requestId, correlationId ni verificación en TASK.
- TASK y EXAM no contienen definiciones de createInterServiceEnvelope/verifyInterServiceEnvelope.
- No se halló tráfico autenticado E2E entre deployments separados. El frontend llama endpoints configurados por SERVICE_URLS; eso no reemplaza autenticación servicio a servicio.

2. SECRETOS Y FIRMA
- getAuthTokenSecret en USER/ACCOUNTING/ACADEMIC/DEVELOPER usa PropertiesService AUTH_TOKEN_SECRET, pero si falta deriva SHA-256 de SPREADSHEET_ID + "_MASTER_AUTH_HMAC_SECRET" y lo guarda.
- USER, ACCOUNTING, ACADEMIC, TASK y EXAM tienen el mismo SPREADSHEET_ID literal: 1txfudU4TR4AhVtvFgGRT5Wtmwjl78hK4bfR4XbRwwww. En consecuencia, el fallback determinista es común a esos servicios y derivable de un identificador presente en el código.
- No se observa rotación de claves, versiones de credencial ni revocación selectiva integrada en tráfico.

3. AISLAMIENTO DE DATOS Y DESCUBRIMIENTO
- SERVICE_URLS contiene endpoints estáticos; ACCOUNTING y DEVELOPER contienen valores de marcador (AKfycbzAccountingSvc / AKfycbzDeveloperControlPlaneSvc), no deployments verificables.
- SERVICE_REGISTRY declara recursos spreadsheetId de ejemplo ("1-USER-SPREADSHEET-ID", etc.) que no coinciden con el SPREADSHEET_ID operativo. Las versiones están codificadas como v8.4.0 sin verificación de deployment.
- USER/ACCOUNTING/ACADEMIC definen resolveSpreadsheetSource, pero solo hay una llamada adicional por archivo. TASK y EXAM no implementan el resolver. La mayoría de accesos usa SpreadsheetApp.openById(SPREADSHEET_ID) directamente (USER ~160; ACCOUNTING ~225; ACADEMIC ~221; TASK ~38; EXAM ~42).
- El catálogo de fuentes no demuestra aislamiento por servicio, cuenta, departamento ni ciclo; todos los servicios principales consultan el mismo spreadsheet en el código inspeccionado.

4. PRUEBAS Y DIAGNÓSTICOS
- DEVELOPER.auditInterServiceCalls devuelve siempre auditLogs: [].
- auditServiceBackendIsolationAndDriveSecurity construye un catálogo estático y devuelve directCrossDomainWriteProhibited/driveMinimumPrivilegeEnforced=true sin inspeccionar servicios, hojas ni permisos.
- runFullArchitectureIntegrationAndPerformanceSuite ejecuta funciones locales; PERF-03 usa getServiceHealthDiagnostics que devuelve PASS/HEALTHY fijo; PERF-05 llama manageUserMultiRolePermissions, que devuelve success con los datos recibidos sin persistencia. No acredita comunicación entre servicios ni aislamiento.
- verifyInterServiceEnvelope escribe el replayKey en CacheService antes de verificar HMAC. Además valida target y vigencia, pero no valida sourceService registrado/activo, permiso por acción ni versión/esquema de contrato.

5. DICTAMEN POR CRITERIO
- Registro y descubrimiento de servicios: PARCIAL (catálogo estático presente; endpoints/recursos no verificados y algunos marcadores).
- Identidad de emisor/receptor en tráfico: NO CUMPLE.
- Firma HMAC aplicada a tráfico real: NO CUMPLE.
- Anti-replay y vigencia aplicados en tráfico: NO CUMPLE (solo helper no conectado).
- Secretos independientes, rotación y revocación: NO CUMPLE.
- Aislamiento de datos entre servicios: NO CUMPLE.
- Autorización por servicio/acción y compatibilidad: NO CUMPLE.
- Diagnóstico y pruebas E2E reales: NO CUMPLE.

RECONCILIACIÓN
- No crear AUD-NG nuevo. Ampliar AUD-NG-083, AUD-NG-084, AUD-NG-086 y TASK-046.
- TASK-048 figura completada con criterios [X], pero la inspección del tráfico real no sustenta esas marcas; los follow-ups pendientes siguen sin resolverse.
- No modificar completadas.md, ChangesLogs.txt ni código fuente.

PRUEBAS Y LIMITACIONES
- Inspección estática/manual de config, api, USER, ACCOUNTING y contraste de los otros cuatro microservicios.
- No se ejecutaron requests HTTP entre deployments, rotación de PropertiesService, permisos efectivos de Drive/Sheets ni pruebas multi-cuenta. No se usaron datos productivos.
================================================================