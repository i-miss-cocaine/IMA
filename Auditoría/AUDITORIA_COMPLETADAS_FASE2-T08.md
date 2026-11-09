# Auditoría de tareas completadas - FASE2-T08

**Fecha:** 2026-11-05  
**Repositorio:** i-miss-cocaine/IMA  
**Rama:** NG_beta_0.0.0.1_work  
**HEAD de partida:** 57f7e330ed997457b34c8849cf869297054a5783  
**Rama base:** NG_beta_0.0.0.1 (44d9891132332e692dbe2ba8602b41f50a508a59, sin cambios)  
**Tarea:** FASE2-T08 - Implementar trazabilidad y correlación de operaciones entre servicios  
**Estado en completadas.md:** [X] Completada

## Dictamen

**NO CUMPLE INTEGRALMENTE.** La implementación dispone de helpers para registrar y consultar correlación, y existen restricciones RBAC parciales, pero no genera ni propaga un identificador de operación en el cliente, no integra la envoltura interservicio en el tráfico real, no conecta los registros con las operaciones y presenta incompatibilidades entre las fuentes de datos y sus consultas. La retención configurada tampoco se aplica correctamente a las bitácoras reales.

La auditoría se basa en la definición de FASE2-T08 en completadas.md. El documento fuente citado por esa tarea, AUDITORIA_FASE2_ARQUITECTURA_INTEROPERABILIDAD.md, no está presente en la raíz de la rama con ese nombre; no se atribuye contenido no disponible a ese informe.

## Fuentes y respaldo

- completadas.md: SHA f57f1aef832e81e44fc4f7ec36a852d50e464676.
- METODOLOGIA_DESARROLLO.md: SHA 214e8221bd076c4e89012636c105bffd5ca36467.
- backend/user-service/Code.gs: SHA 12079dd410aa6d8afbce55a4bc62a79dea605f9f.
- js/api.js: SHA 6b24f666db30a811a8e9b38d466fc6001cf6dfa9.
- backend/academic-service/Code.gs: SHA daf1883ec0b8d4f0ff2bc673af8a4e8c5bbd03fc.
- backend/accounting-service/Code.gs: SHA 38b979d41596b85e888b4a7060b37bbac0840a28.
- backend/task-service/Code.gs: SHA 1437756a3c3d3d97e06bc1ff21c8e2ca2b2dccbe.
- backend/exam-service/Code.gs: SHA 1d93296628fae31f680004f637897e2b1314a64c.
- backend/developer-service/Code.gs: SHA 8aa4bac67cfe5c8c54da51a0784a56fef633e412.
- Pendientes.md recuperado del blob del HEAD de partida: SHA f9f2bfcf70173efc4b8dead23dbe8d44a55b8a4b; 1,621,560 caracteres y 19,223 líneas. Blob preparado tras ampliar cinco tareas existentes: SHA 093007608b9c1fdd550305bb8e16ef966c6c4201.

## Evidencia técnica

### 1. Generación y propagación del identificador

- js/api.js, fetchApi (línea 11 en adelante), no crea requestId ni correlationId, no incorpora un contexto de operación a los encabezados o al payload y no conserva una identidad de correlación entre llamadas.
- fetchApi reintenta solicitudes POST hasta dos veces ante determinados errores de red, pero no registra los intentos ni adjunta un identificador estable que permita agruparlos como una sola operación lógica.
- USER, doPost (1351-1620), recibe action/payload y despacha sin generar o exigir correlationId. Los registros de autorización denegada y excepciones tampoco quedan asociados a un identificador de operación.
- createInterServiceEnvelope y verifyInterServiceEnvelope (USER:1009-1055) definen requestId/correlationId en un sobre HMAC, pero en el archivo USER solo aparecen como declaraciones. La evidencia histórica AUD-NG-083 ya constató la falta de consumidores en los servicios; los SHAs actuales de Academic, Accounting, Task y Developer se contrastaron y no muestran una revisión posterior de esos archivos.
- delegateToTaskService (USER:7946-7964) transmite JSON plano {action,payload}, sin sobre firmado ni correlación. Ante una excepción devuelve status success con un identificador local de sesión, ocultando el fallo de dependencia.
- recordTraceabilityLog solo aparece como definición y como acción en el switch de doPost (1457, 4548); no se localizaron llamadas desde operaciones de negocio. Su existencia no instrumenta automáticamente el tráfico.
- registerAndDispatchEvent (USER:4618+) conserva originRequestId opcional, pero el esquema BitacoraEventos no contiene correlationId, causationId ni enlaces de causalidad entre eventos y la operación que los originó.

### 2. Registro y clasificación de operaciones

- logStructuredEvent (USER:326-350) escribe ID, timestamp, servicio, función, severidad, código, mensaje, payload y rol. No guarda requestId/correlationId, dependencia, duración ni referencia de operación.
- doPost registra rechazos de autorización y excepciones generales, pero no instrumenta sistemáticamente éxitos, reintentos, conflictos, recuperación o resultado de dependencias. El catch general clasifica las excepciones como UNHANDLED_EXCEPTION y devuelve error.message, sin un contrato estable que diferencie validación, negocio, conflicto, dependencia, transporte e interno.
- recordTraceabilityLog (4548-4573) sí acepta correlationId, servicio origen/destino, acción, estado, duración y errorDetails; sin embargo, esos campos dependen de que un consumidor llame manualmente a la acción. No se valida la identidad del servicio emisor y errorDetails se persiste sin sanitización.
- getTraceabilityCorrelationLogs (4575-4616) filtra correlationId, estado y servicio, pero no acción ni periodo; no tiene paginación con cursor ni límite máximo validado y devuelve errorDetails directamente. Su respuesta utiliza registros, mientras la prueba INT-05 espera logs; esta discrepancia ya fue documentada en C1.42/FASE2-T07 y no se duplica como hallazgo nuevo.

### 3. Búsqueda y reconstrucción

- getStructuredLogs (353-392) lee LogsSistema y filtra únicamente severidad y fechas. No filtra por servicio, acción, estado ni correlationId; lee el rango completo y limita la respuesta a 500 registros sin paginación.
- getPaginatedAuditLogReport (4243-4364) intenta consultar eventos y trazabilidad, pero lee BitacoraTraceability mientras recordTraceabilityLog escribe BitacoraTrazabilidad. La fuente de trazabilidad queda desconectada.
- El mismo reporte supone que BitacoraEventos tiene columnas ID, fecha, tipo, usuario, rol, módulo, acción, resultado, detalles y correlationId. El productor real registra EventID, TipoEvento, ServicioOrigen, RequestIDOrigen, DestinatarioID, DatosJSON, Estado, Intentos, UltimoIntentoFecha y ErrorDetalle. En consecuencia, row[1] se interpreta como fecha aunque es TipoEvento, row[2] como tipo aunque es ServicioOrigen y row[9] como correlationId aunque es ErrorDetalle. La fecha resulta inválida para el filtro y no se reconstruye el evento con su esquema real.
- La consulta por correlationId no ofrece una línea de tiempo fiable entre servicios y tareas asíncronas. No se acreditan punteros a eventos anteriores/posteriores, sagaId ni causationId.

### 4. Sanitización, conservación y acceso

- sanitizePayloadForLog (50-67) solo enmascara claves que contienen password, clave, token, secret, credencial o authorization. No cubre PII, RTN, cuentas, correos, teléfonos ni datos financieros. logStructuredEvent tampoco sanitiza message; recordTraceabilityLog no sanitiza errorDetails; las consultas devuelven esos campos.
- getRetentionPolicies (2120+) crea una política AUDIT_LOGS de 365 días. executeDataRetentionPolicyCheck (2203-2254) intenta aplicar esa política únicamente a BitacoraEventos, pero interpreta row[0]/row[1] como fecha y row[2] como severidad, campos que no corresponden al esquema real. No aplica retención a LogsSistema ni BitacoraTrazabilidad.
- purgeStructuredLogs (7967-7990) elimina todas las filas de LogsSistema sin respetar antigüedad, preservación legal, categorías o una política de retención. No sustituye un ciclo de conservación verificable.
- Hay control RBAC parcial: PUBLIC_ACTIONS no incluye las consultas de logs; Administrador y Desarrollador tienen acceso global, y Director tiene acceso a recordTraceabilityLog, getTraceabilityCorrelationLogs y getPaginatedAuditLogReport. Director no figura con getStructuredLogs. La restricción de consulta existe, pero el endpoint de escritura de trazabilidad acepta datos de origen proporcionados por el solicitante y no verifica identidad de servicio.
- window.logStructuredEvent (js/api.js:257+) intenta persistir mediante la acción recordStructuredLog, pero no existe un case recordStructuredLog en el dispatcher USER. El flujo de log cliente no queda conectado al backend por esa ruta.

## Contraste de los nueve requisitos

| Requisito | Resultado | Evidencia resumida |
|---|---|---|
| 1. Asignar identificador a cada operación | No cumple | fetchApi y doPost no generan requestId/correlationId. |
| 2. Propagar entre servicios | No cumple | Sobre HMAC sin consumidores; delegación USER→TASK en JSON plano. |
| 3. Registrar servicio, acción, resultado, duración y dependencia | Parcial | Helper manual con esos campos, sin instrumentación real ni identidad de emisor. |
| 4. Registrar reintentos, conflictos, rechazos y recuperaciones | Parcial | Rechazos/excepciones tienen logs generales; no se correlacionan ni se registran todos los estados/intentos. |
| 5. Diferenciar errores de cliente, validación, dependencia e internos | No cumple | catch general y fallback de dependencia que devuelve éxito. |
| 6. Relacionar eventos automáticos con operación origen | No cumple | originRequestId opcional; no correlationId/causationId en BitacoraEventos. |
| 7. Evitar datos sensibles innecesarios | Parcial | Redacción limitada a credenciales; errorDetails/message/PII/finanzas pueden exponerse. |
| 8. Reglas de conservación y acceso | Parcial | RBAC parcial; retención no aplicada a las bitácoras correctas y purga indiscriminada. |
| 9. Búsqueda por identificador, acción, estado y periodo | No cumple | Filtros incompletos y reporte paginado desconectado de sus hojas/esquemas. |

## Contraste de los seis criterios de aceptación

1. Reconstrucción de una operación que atraviesa dos o más servicios: **No cumple**; no hay ID generado/propagado ni consumidores del sobre.
2. Distinguir éxito, fallo, reintento y recuperación: **Parcial**; hay estados y severidades aislados, pero no una secuencia correlacionada y completa.
3. Relacionar fallo de dependencia con operación origen: **No cumple**; la delegación no transmite correlación y puede devolver éxito falso.
4. No exponer credenciales ni datos sensibles innecesarios: **Parcial**; se enmascaran algunas credenciales, no PII/finanzas ni errorDetails/message.
5. Bloquear usuarios sin permiso: **Parcial**; existen roles y restricciones por acción, pero el origen de registros no se autentica como servicio y no hay redacción por campo.
6. Detectar ausencia de registro esperado en pruebas: **No cumple**; INT-05 no crea una operación distribuida ni valida un registro real; además espera logs donde la función devuelve registros. No se ejecutó la suite porque puede tocar colas reales.

## Reconciliación histórica, sin duplicar IDs

- **AUD-NG-145:** bitácora central, filtros, sanitización, contratos de consulta y conservación de LogsSistema/BitacoraTrazabilidad.
- **TASK-278:** propagación correlationId/sagaId, visor unificado, reconstrucción cronológica, RBAC y paginación.
- **AUD-NG-174:** envelope API versionado, requestId/correlationId, clasificación de errores y manejo seguro de fallback.
- **AUD-NG-083:** integración efectiva de HMAC y autenticación del tráfico interservicio.
- **TASK-474:** correlationId/causationId en eventos, relación con la operación origen y productores autenticados.
- No se crea AUD-NG ni TASK nuevo. Se amplía evidencia en esas tareas existentes; no se cambian sus estados.

## Calidad de implementación

La calidad es insuficiente para aceptar la tarea: existen varios almacenes y DTO de logs incompatibles, helpers no conectados al flujo real, identificadores no propagados, filtros que consultan esquemas distintos a los productores, redacción incompleta y políticas de retención que no actúan sobre las fuentes correctas. La presencia de funciones con nombres de trazabilidad no acredita observabilidad distribuida efectiva.

## Pruebas y límites

Inspección estática/manual de los archivos y rangos indicados, contraste de SHAs con auditorías previas y revisión de referencias exactas. No se ejecutaron Apps Script, HTTP, triggers, despliegues ni operaciones productivas. No se ejecutó runInterdepartmentalIntegrationTestSuite porque C1.42 ya documentó que invoca la cola real y puede producir efectos secundarios. No se realizaron pruebas de integración entre deployments.

## Progreso y continuidad

- Identificadores auditados: **44/183**; 139 pendientes.
- Última tarea auditada: FASE2-T08.
- Próxima tarea exacta según completadas.md: **T-UX-02 - Soporte Universal Tecla Escape para Cierre de Modales y Restauración de Foco**.
- Código fuente sin modificaciones. No se modificó completadas.md ni METODOLOGIA_DESARROLLO.md.

## Tareas ejecutables derivadas de los hallazgos

### [TASK-278] Completar correlación distribuida y reconstrucción cronológica de operaciones
- **Hallazgo de origen:** FASE2-T08, sección 4; referencia a TASK-278.
- **Severidad:** Alto.
- **Objetivo:** reconstruir una operación completa a través de frontend y microservicios.
- **Acción ejecutable:** generar requestId/correlationId en el cliente; propagarlo en sobres interservicio y eventos; añadir sagaId/causationId donde corresponda; registrar etapas y relaciones; construir visor cronológico con filtros/paginación y RBAC.
- **Archivos/módulos afectados:** js/api.js; backend/user-service/Code.gs, academic-service, accounting-service, task-service y exam-service; BitacoraEventos/LogsSistema/BitacoraTrazabilidad; dashboard Developer.
- **Dependencias y riesgos:** AUD-NG-083 para HMAC; TASK-474 para eventos; AUD-NG-145 para fuentes/DTO de logs.
- **Alcance:** correlación de operaciones y consulta autorizada, no crear un nuevo esquema de logs paralelo.
- **Criterios de aceptación:** una operación genera un ID estable que se conserva entre servicios/eventos; visor reconstruye orden y causa; filtros por acción/fecha/servicio funcionan con paginación; el usuario solo consulta ámbitos autorizados.
- **Prioridad:** P1.
- **Estado:** Pendiente.
- **Evidencia de cierre:** pruebas E2E multi-servicio y consultas RBAC.

### [AUD-NG-145] Unificar fuentes/DTO de bitácoras, filtros, sanitización y retención
- **Hallazgo de origen:** FASE2-T08, secciones 2 y 4; ampliación de AUD-NG-145.
- **Severidad:** Alto.
- **Objetivo:** garantizar que los eventos producidos sean consultables y seguros en el panel institucional.
- **Acción ejecutable:** definir un esquema único; alinear escritores y lectores entre LogsSistema, BitacoraEventos y BitacoraTrazabilidad; corregir filtros/campos/periodos; aplicar redacción de PII/secretos; paginar en origen; aplicar retención sobre las fuentes reales.
- **Archivos/módulos afectados:** backend/user-service/Code.gs, backend/academic-service/Code.gs, backend/accounting-service/Code.gs, dashboard Developer y utilidades de logs.
- **Dependencias y riesgos:** TASK-278 y AUD-NG-177/TASK-475; conservar trazabilidad histórica.
- **Alcance:** contrato y operación de bitácoras.
- **Criterios de aceptación:** cada escritor tiene consumidores compatibles; filtros corresponden a columnas reales; PII/secretos se redactan; paginación ocurre en origen con límites; retención afecta las fuentes correctas y queda auditada.
- **Prioridad:** P1.
- **Estado:** Pendiente.
- **Evidencia de cierre:** pruebas de contrato, privacidad, paginación y retención.

### [AUD-NG-174] Propagar y validar metadatos comunes del contrato API
- **Hallazgo de origen:** FASE2-T08, sección 4; ampliación de AUD-NG-174.
- **Severidad:** Alto.
- **Objetivo:** asegurar que requestId/correlationId y errores estructurados sean consistentes en todos los servicios.
- **Acción ejecutable:** incluir metadatos comunes en request/response; preservar correlationId a través de fetchApi/doPost; clasificar errores y evitar fallback success ante indisponibilidad; validar esquema/versionado en cada frontera.
- **Archivos/módulos afectados:** js/api.js y dispatchers de USER/ACADEMIC/ACCOUNTING/TASK/EXAM.
- **Dependencias y riesgos:** AUD-NG-083 y TASK-278.
- **Alcance:** ampliación de AUD-NG-174 ya registrado en FASE2-02/T03.
- **Criterios de aceptación:** metadatos se propagan sin regenerarse en cada salto; error de transporte/servicio no se confunde con vacío; contratos versionados y pruebas HTTP verifican correlación.
- **Prioridad:** P1.
- **Estado:** Pendiente.
- **Evidencia de cierre:** suite común de contrato y pruebas de correlación.

### [AUD-NG-083] Integrar HMAC en el tráfico interservicio efectivo
- **Hallazgo de origen:** FASE2-T08, sección 4; referencia al hallazgo original AUD-NG-083.
- **Severidad:** Crítico.
- **Objetivo:** autenticar y autorizar los saltos entre deployments.
- **Acción ejecutable:** integrar sobre firmado y verificado en cada llamada real, incorporando correlationId y validación de emisor/receptor/acción.
- **Archivos/módulos afectados:** dispatchers y clientes interservicio de los cinco microservicios.
- **Dependencias y riesgos:** AUD-NG-084/086, TASK-278 y TASK-474.
- **Alcance:** ampliación por correlación del mismo hallazgo, sin crear ID duplicado.
- **Criterios de aceptación:** ninguna llamada interna se despacha sin sobre válido; el mismo correlationId se conserva de extremo a extremo; llamadas no autorizadas se rechazan.
- **Prioridad:** P0.
- **Estado:** Pendiente.
- **Evidencia de cierre:** pruebas HTTP entre deployments.

### [TASK-474] Relacionar eventos con la operación origen
- **Hallazgo de origen:** FASE2-T08, sección 4; ampliación de TASK-474.
- **Severidad:** Alto.
- **Objetivo:** que cada evento permita identificar la operación que lo produjo y su cadena causal.
- **Acción ejecutable:** hacer obligatorios correlationId y causationId en eventos derivados; asociar eventId a requestId y servicio productor; validar el emisor y conservar la relación en el outbox.
- **Archivos/módulos afectados:** backend/user-service/Code.gs y productores/consumidores de eventos.
- **Dependencias y riesgos:** TASK-278, AUD-NG-083 y AUD-NG-006.
- **Alcance:** metadatos causales del bus ya asignado a TASK-474.
- **Criterios de aceptación:** ningún evento derivado carece de correlación/cadena causal; el visor puede reconstruir operación y eventos asociados; pruebas verifican la cadena entre servicios.
- **Prioridad:** P1.
- **Estado:** Pendiente.
- **Evidencia de cierre:** pruebas E2E de causalidad y consulta.
