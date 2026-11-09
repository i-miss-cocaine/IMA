# AUDITORÍA TÉCNICA - TAREA-F6-009: Salud, diagnóstico, tráfico y errores en microservicios

**Fecha:** 2026-11-07  
**Repositorio:** i-miss-cocaine/IMA  
**Rama:** NG_beta_0.0.0.1_work  
**Checkpoint inicial:** C1.225  
**Checkpoint de cierre:** C1.226  
**Sesión:** IMA-AUDIT-20261107-2210Z  
**Dictamen:** **NO CUMPLE**  
**Estado histórico en completadas.md:** [X] (se conserva sin modificación).

> Esta auditoría también cubre TAREA-F6-034, que repite el título y amplía los criterios de TAREA-F6-009 con diagnóstico común, métricas, errores correlacionados, filtros y mapa de dependencias. Ambos registros están marcados [X] y carecían de informe individual. Se crean informes por ID, pero comparten un único bloque canónico F6-009-A01..A06.

## 1. Continuidad y fuentes

- HEAD inicial: d44b7131773aac442a74e66549563a408122850a (C1.225), rama NG_beta_0.0.0.1_work.
- Comparación anterior con NG_beta_0.0.0.1: 293 commits adelante, 0 detrás. La rama base no se modifica.
- completadas.md SHA f57f1aef832e81e44fc4f7ec36a852d50e464676:
  - TAREA-F6-009 [X], líneas 2748-2780; R1-R7 y CA-050..CA-053.
  - TAREA-F6-034 [X], líneas 3656-3693; mismo alcance ampliado y CA-088..CA-095/CA-158.
- Pendientes.md recuperado desde blob SHA 631b4c2dbf0e86d5704b63625382d73ccb8ceb3c: 1.803.672 bytes, 1.782.094 caracteres, 20.182 líneas, sin U+FFFD. No contiene F6-009/F6-034; sí conserva AUD-NG-144, AUD-NG-145, AUD-NG-163 y tareas relacionadas. No se modificó.
- ChangesLogs.txt SHA 5b5cff1926b73a05d1b92087a7bf4b2db75326ff, líneas 1979-1983 afirma que getServiceHealthDiagnostics en ACADEMIC/DEVELOPER cubre latencia, sanitización y dependencias. No hay diagnóstico común en todos los servicios; DEVELOPER devuelve PASS constante.
- No existían AUDITORIAS/AUDITORIA_COMPLETADAS_TAREA-F6-009.md ni AUDITORIAS/AUDITORIA_COMPLETADAS_TAREA-F6-034.md; se crean ambos.
- Antecedentes: AUD-NG-144 (health checks incompletos), AUD-NG-145 (logs DTO/filtros/sanitización/muestras), AUD-NG-163 (métricas/cuotas), AUD-NG-086 (trazabilidad), AUD-NG-083 (correlationId/HMAC), AUD-NG-007 (timeout/reintentos). Se amplían, no se duplican.

## 2. Archivos y evidencia inspeccionados

- backend/user-service/Code.gs SHA 12079dd410aa6d8afbce55a4bc62a79dea605f9f:
  - sanitizePayloadForLog:45-70.
  - getServiceHealthReport:73-130.
  - logStructuredEvent/getStructuredLogs:326-405.
  - doPost y dispatcher:1351-1555.
  - getOperationalCapacityMetrics:4080-4145.
  - ping:1552.
- backend/academic-service/Code.gs SHA df87a2eea9f0ef79d0b966d03fd5bbe432003df5:
  - sanitizePayloadForLog/logStructuredEvent:29-75.
  - ping:964.
  - getServiceHealthDiagnostics:4451-4492.
  - getStorageQuotaMetricsReport: referencia de AUD-NG-163; capacityUsagePct fijo.
- backend/accounting-service/Code.gs SHA 38b979d41596b85e888b4a7060b37bbac0840a28:
  - sanitizePayloadForLog/logStructuredEvent:52-100.
  - ping:834.
- backend/task-service/Code.gs SHA 1437756a3c3d3d97e06bc1ff21c8e2ca2b2dccbe: dispatcher 368-435; no case ping ni logger estructurado común en el archivo inspeccionado.
- backend/exam-service/Code.gs SHA 1d93296628fae31f680004f637897e2b1314a64c: dispatcher 345-415; no case ping ni logger estructurado común en el archivo inspeccionado.
- backend/developer-service/Code.gs SHA 8aa4bac67cfe5c8c54da51a0784a56fef633e412:
  - getServiceHealthDiagnostics:2599-2620.
  - getCentralizedLogs:2363-2395.
- js/api.js SHA 6b24f666db30a811a8e9b38d466fc6001cf6dfa9:
  - fetchApi:1-165.
  - checkMicroserviceHealth/checkAllMicroservicesHealth:207-260.
  - logStructuredEvent:260-300.
- js/developer.js SHA 6fa4c4bd9be580c974b1fbede4f0cf79485dc331:
  - executeDevHealthChecks:90-150.
  - loadStructuredLogs/renderStructuredLogsTable:194-290.
- js/teacher.js SHA c475fce5afcd28fca23e7b64398ad32b17773746:
  - runTechnicalHealthChecks:2005-2065.
- developer-dashboard.html SHA 2b69f1bf7ffbbe4902e81de14d6315cedb035a1e:
  - filtros de logs:270-330; solo severidad/servicio/límite.

## 3. Hallazgos

### H1 - CRÍTICO/P0: no existe un contrato común de salud en todos los microservicios
- USER, ACADEMIC y ACCOUNTING exponen ping, pero responden dbConnected:true como literal sin abrir Spreadsheet ni verificar dependencias.
- TASK y EXAM no tienen case ping en sus dispatchers.
- DEVELOPER no tiene ping; solo getServiceHealthDiagnostics.
- getServiceHealthDiagnostics existe en ACADEMIC y DEVELOPER, no en USER/TASK/EXAM/ACCOUNTING.
- USER tiene getServiceHealthReport, pero calcula estado a partir de LogsSistema; no verifica conectividad/Sheets/Drive en vivo.
- checkAllMicroservicesHealth consulta solo USER/ACADEMIC/TASK/EXAM: dos servicios carecen de ping y ACCOUNTING/DEVELOPER quedan fuera.
- js/developer.js usa ese monitor de cuatro servicios. js/teacher.js incluye ACCOUNTING, pero TASK/EXAM siguen sin ping y DEVELOPER no aparece.
**Impacto:** no se puede demostrar salud de todos los servicios. CA-050/CA-088 no se cumplen. Se amplía AUD-NG-144.

### H2 - ALTO/P1: los diagnósticos de dependencias son parciales o simulados
- ACADEMIC/getServiceHealthDiagnostics comprueba SpreadsheetApp.openById y, con fullCheck, DriveApp.getRootFolder; connectivity y permissions están fijados en PASS.
- La comprobación Drive solo valida acceso al root, no al folder específico del servicio/área ni a sus ACL.
- DEVELOPER/getServiceHealthDiagnostics devuelve connectivity, spreadsheetAccess y permissions como PASS sin ejecutar comprobaciones.
- USER/getServiceHealthReport no verifica dependencias: lee LogsSistema, usa versiones estáticas 1.0.0 para cinco servicios y marca saludable según un umbral global de errores históricos (>50).
- Ningún endpoint comprueba de forma común lectura/escritura, espacio disponible, endpoint, versión desplegada o fallo funcional.
**Impacto:** se pueden reportar servicios HEALTHY aunque no tengan acceso real o estén fuera de línea; no se distinguen con fiabilidad red, permisos, Sheets, Drive y lógica. CA-051/CA-090 no se cumplen.

### H3 - ALTO/P1: el dashboard no supervisa todos los servicios ni usa un timeout efectivo
- checkAllMicroservicesHealth solo consulta USER/ACADEMIC/TASK/EXAM.
- runTechnicalHealthChecks consulta USER/ACADEMIC/TASK/EXAM/ACCOUNTING, pero TASK/EXAM no implementan ping y DEVELOPER no se consulta.
- checkMicroserviceHealth pasa {timeout:6000} a fetchApi; fetchApi recibe options, pero el timeout de AbortController está hardcodeado en 60.000 ms y no lee options.timeout.
- El dashboard muestra latencia de ida/vuelta del navegador, no métricas server-side de dependencias ni historial de disponibilidad.
**Impacto:** cobertura incompleta y tiempos de detección distintos a los declarados. CA-089/CA-095 son parciales; se amplía AUD-NG-144 y AUD-NG-007.

### H4 - ALTO/P1: métricas de tráfico/capacidad no representan todas las solicitudes ni el consumo real
- USER/getOperationalCapacityMetrics agrega BitacoraTrazabilidad; la existencia de recordTraceabilityLog no implica que cada solicitud sea registrada. La búsqueda de llamadas no encuentra integración automática desde fetchApi/doPost.
- El conteo depende de los eventos persistidos, por lo que omite tráfico de TASK/EXAM y operaciones que no invocan el logger.
- getServiceHealthReport usa LogsSistema global, versiones estáticas 1.0.0 y un umbral de errores acumulados sin ventana temporal ni desglose de salud por servicio.
- ACADEMIC/getStorageQuotaMetricsReport asigna capacityUsagePct=15.5 como valor fijo; TASK/getDriveStorageQuotaMetricsReport hace una consulta puntual de Drive; EXAM/getGradingPerformanceAndPersistenceMetrics mide filas/lectura, no consumo total de GAS.
- No se mide de forma fiable cuota disponible/consumida, ejecuciones GAS por servicio/usuario, reintentos ni latencia de todas las operaciones.
- Una prueba interna de USER espera metricsRes.capacidadOperativa, mientras getOperationalCapacityMetrics devuelve resumenGeneral/desgloseServicios; el contrato de prueba y el DTO no coinciden.
**Impacto:** las métricas pueden mostrar capacidad normal con eventos incompletos o valores inventados. CA-093 no se cumple. Se amplía AUD-NG-163.

### H5 - CRÍTICO/P0: logs estructurados no son uniformes y la ruta cliente de registro no existe
- USER/ACADEMIC/ACCOUNTING tienen logStructuredEvent y sanitizePayloadForLog; TASK/EXAM no tienen el mismo logger estructurado en el código revisado; DEVELOPER usa Logger/funciones de muestra.
- js/api.js logStructuredEvent llama fetchApi(service, "recordStructuredLog", payload), pero USER doPost no tiene case recordStructuredLog; la acción no se puede persistir por esa ruta.
- getStructuredLogs existe solo en USER y devuelve DTO con service/functionName/severity/errorCode/message/payload/userRole.
- No se registra de forma común eventId/correlationId/version/estado de resolución como campos consultables.
**Impacto:** no hay bitácora multi-servicio completa ni trazabilidad común. CA-052/CA-091/CA-092 no se cumplen. Se amplía AUD-NG-145 y AUD-NG-086.

### H6 - ALTO/P1: sanitización insuficiente para PII y datos financieros
- sanitizePayloadForLog solo enmascara claves que contienen password, clave, token, secret, credencial o authorization.
- No cubre DNI, RTN, número de cuenta/tarjeta, email, teléfono, dirección, nombre completo, documentos/URLs ni otros identificadores personales.
- El campo message se escribe sin sanitización; un error puede incluir datos sensibles aunque el payload esté parcialmente enmascarado.
- getStructuredLogs devuelve payload completo; el dashboard muestra detalles mediante innerHTML sin escapar el contenido.
**Impacto:** LogsSistema puede retener PII/datos financieros y el renderizado puede interpretar contenido controlado por datos de log. CA-052/CA-094 no se cumplen.

### H7 - ALTO/P1: filtros y DTO de logs no coinciden y se muestran registros ficticios
- getStructuredLogs solo filtra severity/startDate/endDate; no filtra service, module, category, area o version y devuelve hasta 500 registros.
- loadStructuredLogs envía severidad/servicio/limit, claves que el backend no lee; el límite y filtro de servicio se ignoran.
- renderStructuredLogsTable espera severidad/servicio/funcion/codigoError/usuarioId/detalles, pero el backend devuelve severity/service/functionName/errorCode/message/payload/userRole.
- Si la hoja está vacía, el dashboard muestra fallbackLogs inventados como si fueran registros reales.
- getCentralizedLogs devuelve dos sampleLogs hardcodeados y resolveLogId devuelve éxito sin persistir un estado de resolución.
**Impacto:** filtros, columnas, historial y resolución no son fiables. CA-052/CA-091/CA-092 no se cumplen. Se amplía AUD-NG-145.

### H8 - ALTO/P1: no se identifica mapa de dependencias ni endpoints/contratos incompatibles
- No hay una prueba común que compare los endpoints esperados con los registrados por cada servicio.
- No se construye un grafo de dependencias afectadas ni se relaciona una operación fallida con servicio, versión, dependencia y correlationId.
- La suite de contratos local no reemplaza una prueba de endpoint y puede aceptar status:error como PASS (AUD-NG-084).
**Impacto:** CA-053/CA-058 no se cumplen; no se detectan de forma fiable endpoints faltantes ni incompatibilidades. Se amplía AUD-NG-144/AUD-NG-084.

## 4. Matriz de requisitos

### TAREA-F6-009 (R1-R7, CA-050..CA-053)
| Requisito | Dictamen | Motivo |
|---|---|---|
| R1 salud en cada microservicio | No cumple | USER/ACADEMIC/ACCOUNTING ping simple; TASK/EXAM sin ping; DEVELOPER sin ping. |
| R2 diagnóstico básico y completo | Parcial | ACADEMIC comprueba Sheet/Drive root; DEVELOPER PASS fijo; otros sin diagnóstico común. |
| R3 pruebas de diagnóstico sin alterar producción | Parcial | existen pruebas locales/lecturas, pero no contrato E2E ni cobertura de dependencias; diagnósticos escriben logs. |
| R4 métricas reales de tráfico/rendimiento/cuotas/GAS | No cumple | métricas basadas en logs incompletos y valores estáticos. |
| R5 errores enriquecidos y correlacionados | No cumple | faltan correlationId/version/resolución como campos comunes. |
| R6 sanitización de PII/finanzas/credenciales | No cumple | solo máscaras de credenciales por nombre de clave; mensaje y PII quedan expuestos. |
| R7 dashboard por área/versión/severidad/historial | No cumple | filtros rotos y sin área/version/historial. |
| CA-050 | No cumple | no todos los servicios tienen contrato común. |
| CA-051 | Parcial | algunos chequeos de Sheets/Drive; conectividad/permisos simulados y sin lógica. |
| CA-052 | No cumple | filtros DTO rotos y sanitización insuficiente. |
| CA-053 | No cumple | no se construye causa/dependencias afectadas. |

### TAREA-F6-034 (alcance ampliado, CA-088..CA-095 y CA-158)
| Criterio | Dictamen | Motivo |
|---|---|---|
| CA-088 contrato común en todos los servicios | No cumple | endpoints ausentes y respuestas heterogéneas. |
| CA-089 consulta desde dashboard | Parcial | hay panel, pero solo cuatro servicios y métricas incompletas. |
| CA-090 diferencia conectividad/datos/documentos/lógica | Parcial | ACADEMIC comprueba Sheet/Drive root; varios checks son constantes. |
| CA-091 filtrar por servicio/módulo/fecha/severidad/categoría | No cumple | backend solo severity/fecha; UI manda DTO distinto. |
| CA-092 error ligado a operación/versión | Parcial | functionName/errorCode presentes en algunos logs; falta correlationId/version/resolución. |
| CA-093 métricas con actualización y sin valores inventados | No cumple | versiones fijas y capacityUsagePct=15.5. |
| CA-094 logs sin credenciales/documentos/PII | No cumple | sanitización limitada a claves de credenciales. |
| CA-095 diagnóstico no altera/bloquea operaciones | Parcial | checks mayormente de lectura, pero no se validó comportamiento bajo fallos y logs se escriben en la misma base. |
| CA-158 identifica endpoints/contratos/dependencias que bloquean operaciones | No cumple | no existe mapa ni verificación común de contratos/dependencias. |

## 5. Reconciliación con auditorías existentes

No se crean IDs globales AUD-NG nuevos:
- AUD-NG-144: health checks incompletos, ping ausente en TASK/EXAM y DEVELOPER falso HEALTHY.
- AUD-NG-145: DTO/filtros de logs rotos, sanitización insuficiente, muestras simuladas y resolución no persistente.
- AUD-NG-163: métricas de cuotas/capacidad incompletas, valores fijos y falta de eventos/alertas reales.
- AUD-NG-086: trazabilidad no integrada.
- AUD-NG-083: correlationId/HMAC no integrado.
- AUD-NG-007: timeout/reintentos.
- AUD-NG-084: pruebas de contrato con falsos PASS.
- TAREA-F6-034 amplía F6-009; ambos informes referencian un solo bloque canónico de tareas.

## 6. Tareas ejecutables derivadas de los hallazgos

Los siguientes IDs son locales a esta auditoría. TAREA-F6-034 referencia este mismo bloque.

### F6-009-A01 - Implementar contrato común de salud para todos los servicios
- **Origen:** H1 y H2.
- **Prioridad:** P0 / Crítico.
- **Acción:** agregar ping/diagnóstico básico y completo en USER, ACADEMIC, TASK, EXAM, ACCOUNTING y DEVELOPER; comprobar endpoint, Spreadsheet, Drive específico, permisos de lectura/escritura, versión y dependencias.
- **Criterios:** todos devuelven el mismo DTO; ningún PASS es constante; se identifica qué dependencia falla; health status deriva de pruebas reales.
- **Referencias:** AUD-NG-144 y AUD-NG-011.
- **Estado:** Pendiente.

### F6-009-A02 - Corregir monitor y dashboard de disponibilidad
- **Origen:** H1 y H3.
- **Prioridad:** P1 / Alto.
- **Acción:** incluir todos los servicios y endpoints; respetar timeout por solicitud; medir latencia y conservar historial de disponibilidad/degradación; diferenciar error de red, timeout, permiso y respuesta inválida.
- **Criterios:** checkAllMicroservicesHealth cubre seis servicios; los pings existen; el timeout configurado se aplica; historial no usa muestras simuladas.
- **Referencias:** AUD-NG-144 y AUD-NG-007.
- **Estado:** Pendiente.

### F6-009-A03 - Implementar telemetría real de tráfico, rendimiento y cuotas
- **Origen:** H4.
- **Prioridad:** P1 / Alto.
- **Acción:** instrumentar solicitudes en middleware común; medir éxitos/fallos, latencia, reintentos, categoría, cuotas disponibles/consumidas y ejecución GAS por servicio; publicar timestamp y ventana de medición.
- **Criterios:** métricas cubren todas las solicitudes relevantes; no se usan constantes; los datos tienen origen/fecha; no se confunde conteo de logs con tráfico total.
- **Referencias:** AUD-NG-163.
- **Estado:** Pendiente.

### F6-009-A04 - Unificar logs y trazabilidad con sanitización de PII
- **Origen:** H5 y H6.
- **Prioridad:** P0 / Crítico.
- **Acción:** implementar recordStructuredLog en todos los dispatchers o middleware; añadir eventId, service, module, operation, timestamp, severity, errorCode, correlationId, version, result y resolutionStatus; redactar PII, finanzas, secretos y documentos.
- **Criterios:** todas las operaciones relevantes registran eventos; correlationId se propaga; payload y mensaje pasan por sanitización; no se guardan datos sensibles completos.
- **Referencias:** AUD-NG-145, AUD-NG-086 y AUD-NG-083.
- **Estado:** Pendiente.

### F6-009-A05 - Reparar DTO, filtros, historial y resolución de logs
- **Origen:** H5 y H7.
- **Prioridad:** P1 / Alto.
- **Acción:** definir un DTO único frontend/backend; filtros por servicio/módulo/fecha/severidad/categoría/área/versión; paginación; resolución persistente con historial; eliminar fallbackLogs/sampleLogs y renderizar texto escapado.
- **Criterios:** filtros corresponden a parámetros soportados; columnas muestran los campos reales; no hay eventos ficticios; resolver un error persiste actor/fecha/estado sin borrar el original.
- **Referencias:** AUD-NG-145.
- **Estado:** Pendiente.

### F6-009-A06 - Implementar pruebas de diagnóstico y mapa de dependencias
- **Origen:** H2, H3 y H8.
- **Prioridad:** P1 / Alto.
- **Acción:** probar endpoints y contratos de cada servicio en entorno de prueba; detectar endpoints faltantes, contratos incompatibles y dependencias; generar mapa de impacto; demostrar que diagnósticos no modifican datos operativos.
- **Criterios:** pruebas no consideran error como PASS; dependencias afectadas se identifican; pruebas no alteran producción; resultados son reproducibles.
- **Referencias:** AUD-NG-144, AUD-NG-084 y TAREA-F6-003-A09.
- **Estado:** Pendiente.

## 7. Cierre
- TAREA-F6-009: NO CUMPLE.
- TAREA-F6-034: NO CUMPLE; alcance ampliado del mismo módulo.
- Ambos estados [X] de completadas.md se conservan como histórico.
- Pendientes.md se recuperó desde el blob íntegro y no se modificó.
- Se crean informes individuales para ambos IDs con un único bloque canónico F6-009-A01..A06.
- No se modificó código, dashboard, logs ni datos productivos.
- No se ejecutaron endpoints HTTP, pruebas E2E, cuotas reales, llamadas Drive/Sheets productivas ni pruebas de indisponibilidad.
- Siguiente tarea secuencial: TAREA-F6-010 y su registro ampliado TAREA-F6-035, administración segura de logs y comandos operativos.

## 8. Referencias
- completadas.md SHA f57f1aef832e81e44fc4f7ec36a852d50e464676, líneas 2748-2780 y 3656-3693.
- Pendientes.md blob SHA 631b4c2dbf0e86d5704b63625382d73ccb8ceb3c.
- ChangesLogs.txt SHA 5b5cff1926b73a05d1b92087a7bf4b2db75326ff, líneas 1979-1983.
- backend/user-service/Code.gs SHA 12079dd410aa6d8afbce55a4bc62a79dea605f9f.
- backend/academic-service/Code.gs SHA df87a2eea9f0ef79d0b966d03fd5bbe432003df5.
- backend/accounting-service/Code.gs SHA 38b979d41596b85e888b4a7060b37bbac0840a28.
- backend/task-service/Code.gs SHA 1437756a3c3d3d97e06bc1ff21c8e2ca2b2dccbe.
- backend/exam-service/Code.gs SHA 1d93296628fae31f680004f637897e2b1314a64c.
- backend/developer-service/Code.gs SHA 8aa4bac67cfe5c8c54da51a0784a56fef633e412.
- js/api.js SHA 6b24f666db30a811a8e9b38d466fc6001cf6dfa9.
- js/developer.js SHA 6fa4c4bd9be580c974b1fbede4f0cf79485dc331.
- js/teacher.js SHA c475fce5afcd28fca23e7b64398ad32b17773746.
- developer-dashboard.html SHA 2b69f1bf7ffbbe4902e81de14d6315cedb035a1e.
