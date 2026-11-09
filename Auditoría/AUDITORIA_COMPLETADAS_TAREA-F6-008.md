# AUDITORÍA TÉCNICA - TAREA-F6-008: Microservicio central del desarrollador y registro de servicios

**Fecha:** 2026-11-07  
**Repositorio:** i-miss-cocaine/IMA  
**Rama:** NG_beta_0.0.0.1_work  
**Checkpoint inicial:** C1.224  
**Checkpoint de cierre:** C1.225  
**Sesión:** IMA-AUDIT-20261107-2140Z  
**Dictamen:** **NO CUMPLE**  
**Estado histórico en completadas.md:** [X] (se conserva sin modificación).

> Esta auditoría también cubre TAREA-F6-033, que repite el título y amplía los criterios de TAREA-F6-008. Ambos registros están marcados [X] y carecían de informe individual. Se crean informes por ID, pero comparten un único bloque canónico F6-008-A01..A06 para evitar tareas duplicadas.

## 1. Continuidad y fuentes

- HEAD inicial: df861afda6dea6b063a8b2702e466a0b838ea0ae (C1.224), rama NG_beta_0.0.0.1_work.
- Comparación anterior con NG_beta_0.0.0.1: 292 commits adelante, 0 detrás. La rama base no se modifica.
- completadas.md SHA f57f1aef832e81e44fc4f7ec36a852d50e464676:
  - TAREA-F6-008 [X], líneas 2712-2747; R1-R6 y CA-046..CA-049.
  - TAREA-F6-033 [X], líneas 3609-3655; mismo título, alcance ampliado y CA-080..CA-087/CA-155..CA-157.
- Pendientes.md recuperado desde blob SHA 631b4c2dbf0e86d5704b63625382d73ccb8ceb3c: 1.803.672 bytes, 1.782.094 caracteres, 20.182 líneas, sin U+FFFD. No contiene F6-008/F6-033; conserva AUD-NG-078, AUD-NG-082, AUD-NG-083, AUD-NG-084 y AUD-NG-086 y sus tareas derivadas. No se modificó.
- ChangesLogs.txt SHA 5b5cff1926b73a05d1b92087a7bf4b2db75326ff, líneas 1975-1979 afirma que getCentralServiceRegistry/registerServiceInstance/updateServiceStatus/auditInterServiceCalls/manageUserMultiRolePermissions implementan el plano de control; las funciones existen, pero varias solo devuelven datos simulados o no están integradas.
- No existían AUDITORIAS/AUDITORIA_COMPLETADAS_TAREA-F6-008.md ni AUDITORIAS/AUDITORIA_COMPLETADAS_TAREA-F6-033.md; se crean ambos.
- Antecedentes: AUD-NG-078 (registro incompleto/permisos wildcard), AUD-NG-082 (fallback de authRole), AUD-NG-083 (HMAC no integrado), AUD-NG-084 (falsos positivos de contratos), AUD-NG-086 (trazabilidad no integrada), AUD-NG-007 (timeout/reintentos) y AUD-NG-158 (multirol/ámbitos). Se amplían, no se duplican.

## 2. Archivos y evidencia inspeccionados

- backend/developer-service/Code.gs SHA 8aa4bac67cfe5c8c54da51a0784a56fef633e412:
  - createInterServiceEnvelope/verifyInterServiceEnvelope: 59-105.
  - ROLE_PERMISSIONS/doPost/auth: 150-180 y 2240-2310.
  - executeOperationalCommand: 2387-2415.
  - getCentralServiceRegistry: 2415-2472.
  - registerServiceInstance: 2473-2530.
  - updateServiceStatus: 2531-2574.
  - auditInterServiceCalls: 2575-2584.
  - manageUserMultiRolePermissions: 2585-2600.
- backend/user-service/Code.gs SHA 12079dd410aa6d8afbce55a4bc62a79dea605f9f:
  - createInterServiceEnvelope/verifyInterServiceEnvelope: 1009-1055.
  - recordTraceabilityLog/getTraceabilityCorrelationLogs: 4548-4615.
  - generateSessionToken: 1065-1085; claim de un solo role.
- backend/academic-service/Code.gs SHA df87a2eea9f0ef79d0b966d03fd5bbe432003df5:
  - createInterServiceEnvelope/verifyInterServiceEnvelope: 345-398.
  - validateApiContractsTestSuite: 3915-3985.
- js/api.js SHA 6b24f666db30a811a8e9b38d466fc6001cf6dfa9, 353 líneas:
  - fetchApi: 1-160; timeout 60s, máximo dos reintentos, rutas SERVICE_URLS estáticas, sin correlationId ni idempotencyKey.
- developer-dashboard.html SHA 2b69f1bf7ffbbe4902e81de14d6315cedb035a1e, 481 líneas: no contiene vistas/handlers de getCentralServiceRegistry, registerServiceInstance, updateServiceStatus ni auditInterServiceCalls.
- js/developer.js SHA 6fa4c4bd9be580c974b1fbede4f0cf79485dc331, 552 líneas: no invoca esas acciones.
- backend/task-service/Code.gs SHA 1437756a3c3d3d97e06bc1ff21c8e2ca2b2dccbe y backend/exam-service/Code.gs SHA 1d93296628fae31f680004f637897e2b1314a64c: usan rutas operativas propias, sin llamadas al registro central.

## 3. Hallazgos

### H1 - ALTO/P1: el registro central es un catálogo parcial con valores predeterminados que aparentan salud
getCentralServiceRegistry (developer-service:2415-2472):
- Si CatalogoServicios está vacío o falla la lectura, devuelve seis servicios hardcodeados y todos en estado Activo.
- Los servicios predeterminados comparten SPREADSHEET_ID y no contienen endpointUrl, Drive folder, dependencias, lista de operaciones ni último contacto.
- Los registros personalizados solo exponen serviceId, name, departamento, cuentaPropietaria, endpointUrl, spreadsheetAsociado, dominioDatos, state, version, permisosConcedidos y registeredAt.
- No se registran por separado estado administrativo y último estado operativo; tampoco hay lastContact/lastHealthCheck para detectar estado obsoleto.
- registerServiceInstance (2473-2530) acepta endpointUrl vacío, usa SPREADSHEET_ID compartido como fallback y asigna permisos ["*"] cuando el payload no proporciona permisos.
- serviceId es obligatorio y se comprueban duplicados en lectura, pero no se usa LockService ni clave idempotente; dos altas concurrentes pueden superar la comprobación.
**Impacto:** el catálogo puede mostrar servicios no verificados como Activos y conceder wildcard por omisión. No cataloga todos los endpoints/recursos ni permite detectar estados obsoletos. CA-046/CA-080/CA-081/CA-082/CA-083 no se cumplen.

### H2 - CRÍTICO/P0: el contrato de correlación/HMAC no forma parte de las comunicaciones
- createInterServiceEnvelope y verifyInterServiceEnvelope existen en developer-service, user-service y academic-service, pero la búsqueda de llamadas muestra solo sus declaraciones; no se invocan desde doPost, fetchApi ni otros servicios.
- js/api.js envía {action,payload}; no genera ni propaga correlationId, firma HMAC, requestId ni idempotencyKey.
- auditInterServiceCalls (2575-2584) devuelve auditLogs: [] y no persiste origen/destino/operación/resultado.
- recordTraceabilityLog (user-service:4548-4585) sí escribe en BitacoraTrazabilidad, pero no se invoca automáticamente desde fetchApi ni desde los servicios de negocio; existe como acción manual.
- No hay un contrato común verificado por cada doPost; los servicios aceptan su propio payload.
**Impacto:** no se puede correlacionar una operación extremo a extremo ni demostrar autenticidad de llamadas entre servicios. CA-047/CA-084 no se cumplen. Se amplía AUD-NG-083 y AUD-NG-086.

### H3 - ALTO/P1: timeout/reintentos parciales sin idempotencia de operaciones
- fetchApi usa AbortController con timeout de 60 segundos y hasta dos reintentos ante errores de red.
- No genera correlationId ni idempotencyKey, ni conserva un identificador de operación entre reintentos.
- Una escritura puede haber sido confirmada por el servidor y perderse la respuesta; el cliente reintenta y puede duplicar el efecto.
- El cliente diferencia errores de red y HTTP de forma básica, pero el backend devuelve códigos genéricos y no clasifica de forma uniforme errores de transporte, autorización, validación y ejecución.
**Impacto:** el transporte tiene timeout/retry básico, pero no el contrato común de correlación/idempotencia requerido. CA-047/CA-085 son parciales o incumplidos. Se amplía AUD-NG-007.

### H4 - CRÍTICO/P0: multirol y responsabilidades no se persisten ni se aplican
- manageUserMultiRolePermissions (2585-2600) recibe userId, roles y assignedAreas y los devuelve como activeRoles/assignedAreas; no actualiza Usuarios, asignaciones de rol, vigencias, revocaciones ni permisos.
- generateSessionToken en user-service incluye un único claims.role.
- assignRoleScope/getInternalRoleAssignments existen en user-service, pero no se integran con el claim de sesión ni con validateRolePermission de cada microservicio.
- Los cambios de permisos no quedan registrados con actor verificado, valor anterior/nuevo y vigencia.
- developer-service tiene fallback de autorización por payload.authRole, documentado en AUD-NG-082.
**Impacto:** no hay múltiples roles efectivos ni separación de privilegios por área/subárea/servicio/operación. CA-049/CA-155/CA-156/CA-157 no se cumplen.

### H5 - ALTO/P1: dashboard sin administración del registro central
- developer-dashboard.html y js/developer.js no contienen interfaz para consultar, registrar, editar, activar/suspender, revisar recursos, ver último contacto o consultar historial del registro.
- getCentralServiceRegistry/registerServiceInstance/updateServiceStatus/auditInterServiceCalls solo están expuestos en backend.
- No existe un flujo de revisión que impida marcar como Activo un servicio sin endpoint, permisos y recursos comprobados.
**Impacto:** CA-080 no se cumple; el plano de control no está disponible para administración normal desde el dashboard.

### H6 - ALTO/P1: trazabilidad y pruebas de contrato no demuestran interoperabilidad real
- auditInterServiceCalls retorna lista vacía.
- recordTraceabilityLog puede escribir filas, pero no se integra en las llamadas reales y no registra actor/rol verificados.
- validateApiContractsTestSuite (academic-service:3915-3985) prueba funciones locales y respuestas construidas en memoria; no llama a los endpoints de otros servicios.
- La condición passed permite status === "success" o status === "error" si están presentes las claves requeridas; una respuesta de error puede marcarse PASS.
**Impacto:** el resultado de la suite no demuestra compatibilidad interservicio y puede producir falsos positivos. CA-084/CA-085 no se cumplen. Se amplía AUD-NG-084.

### H7 - MEDIO/P2: catálogo de comandos es cerrado, pero la ejecución es simulada
- executeOperationalCommand comprueba command contra ALLOWED_OPERATIONAL_COMMANDS y rechaza comandos no catalogados.
- No usa eval, Function ni ejecución de código arbitrario; la lista cerrada satisface la restricción de seguridad.
- Para comandos permitidos, sin embargo, devuelve status success y outputMessage de ejecución exitosa sin invocar un handler operativo real.
**Impacto:** la prohibición de código arbitrario se cumple, pero el resultado anunciado no acredita que la operación haya ocurrido. CA-087 cumple en seguridad; la ejecución funcional permanece incompleta.

### H8 - ALTO/P1: independencia del plano de control solo está presente por rutas directas y no está probada
- js/api.js resuelve servicios desde SERVICE_URLS y llama directamente a cada endpoint.
- La búsqueda de referencias no encuentra llamadas de servicios operativos a getCentralServiceRegistry ni dependencia obligatoria del developer-service para despachar operaciones de negocio.
- Esto permite que las rutas operativas sigan disponibles si el plano de control cae, siempre que los endpoints y sus dependencias propias sigan operativos.
- No se ejecutaron pruebas de indisponibilidad del developer-service ni se verificó el funcionamiento completo con el plano de control apagado.
**Impacto:** separación arquitectónica parcial; CA-048/CA-086 no se acreditan mediante prueba.

## 4. Matriz de requisitos

### TAREA-F6-008 (R1-R6, CA-046..CA-049)
| Requisito | Dictamen | Motivo |
|---|---|---|
| R1 registro central con servicios/endpoints/recursos | Parcial | catálogo de seis defaults; faltan Drive, dependencias, operaciones, último contacto y URLs verificadas. |
| R2 contrato común correlationId/timeout/retry/idempotencia | No cumple | timeout/retry básico; envelope/HMAC y correlationId no integrados; sin idempotencyKey. |
| R3 separar operaciones administrativas y operacionales | Parcial | llamadas operativas directas; registro central no integrado en routing ni dashboard. |
| R4 múltiples roles y responsabilidades por ámbito | No cumple | helper echo y token de un solo rol. |
| R5 tolerancia a caída del central | Parcial | no hay dependencia directa, pero no hay prueba de caída. |
| R6 prohibir código arbitrario | Cumple | catálogo cerrado; no hay eval/Function; handler simula resultado. |
| CA-046 | Parcial | catálogo incompleto y fallback de servicios activos. |
| CA-047 | No cumple | correlationId/HMAC no se propaga ni verifica. |
| CA-048 | Parcial | separación por URL directa, sin prueba de indisponibilidad. |
| CA-049 | No cumple | roles múltiples no se persisten ni aplican. |

### TAREA-F6-033 (alcance ampliado, CA-080..CA-087 y CA-155..CA-157)
| Criterio | Dictamen | Motivo |
|---|---|---|
| CA-080 dashboard presenta servicios/configuración | No cumple | no existe UI del registro. |
| CA-081 identificador estable | Parcial | defaults tienen IDs estables; los nuevos dependen de serviceId del cliente y no tienen lock. |
| CA-082 estado administrativo/operativo separado | No cumple | una sola columna state. |
| CA-083 detectar estado obsoleto | No cumple | no existe lastContact/lastHealthCheck. |
| CA-084 correlationId y resultado | No cumple | envelope no integrado; auditoría devuelve lista vacía. |
| CA-085 diferenciar errores de ejecución/comunicación | Parcial | cliente diferencia algunos errores; backend no tiene taxonomía común. |
| CA-086 central offline no detiene servicios | Parcial | llamadas directas, pero no se ejecutó prueba de caída. |
| CA-087 prohibir código arbitrario | Cumple | allowlist cerrada y sin eval; handler no ejecuta operación real. |
| CA-155 múltiples roles/responsabilidades | No cumple | manageUserMultiRolePermissions solo devuelve payload. |
| CA-156 roles relacionados con áreas/servicios | No cumple | scopes no se conectan a permisos de cada servicio. |
| CA-157 cambios auditados y validados | Parcial | updateServiceStatus registra historial, pero updatedBy viene del payload y no hay historial de roles/permisos. |

## 5. Reconciliación con auditorías existentes

No se crean IDs globales AUD-NG nuevos:
- AUD-NG-078: registro central, campos incompletos, wildcard y recursos compartidos.
- AUD-NG-082: fallback de authRole en el plano de control.
- AUD-NG-083: helpers HMAC definidos pero no integrados.
- AUD-NG-084: suite de contratos con falsos PASS.
- AUD-NG-086: trazabilidad/auditoría interservicio no integrada.
- AUD-NG-007: timeout/reintentos del cliente.
- AUD-NG-158: multirol y ámbitos.
- TAREA-F6-033 amplía F6-008; ambos informes referencian el mismo bloque canónico de tareas.

## 6. Tareas ejecutables derivadas de los hallazgos

Los siguientes IDs son locales a esta auditoría. TAREA-F6-033 referencia este mismo bloque.

### F6-008-A01 - Completar el registro central y su ciclo de vida
- **Origen:** H1 y H5.
- **Prioridad:** P1 / Alto.
- **Acción:** definir esquema canónico con serviceId estable, tipo, estado administrativo/operativo, versión, endpoints/operaciones, Spreadsheet/Drive, permisos, dependencias, responsable, lastContact y diagnóstico; eliminar fallback que marca todos Activos y wildcard.
- **Criterios:** todos los servicios/endpoints y recursos se registran; un servicio sin endpoint/health no queda Activo; duplicados se previenen bajo concurrencia; estados obsoletos son detectables.
- **Referencias:** AUD-NG-078 y AUD-NG-011.
- **Estado:** Pendiente.

### F6-008-A02 - Integrar el contrato común de comunicación
- **Origen:** H2 y H3.
- **Prioridad:** P0 / Crítico.
- **Acción:** generar y propagar correlationId/requestId; verificar envelope HMAC en cada doPost; definir timeouts, retry por tipo de operación, idempotencyKey para escrituras y taxonomía de errores.
- **Criterios:** llamadas entre servicios conservan el mismo correlationId; firmas inválidas se rechazan; reintentos no duplican escrituras; errores de red/HTTP/validación/ejecución se distinguen.
- **Referencias:** AUD-NG-083 y AUD-NG-007.
- **Estado:** Pendiente.

### F6-008-A03 - Integrar trazabilidad interservicio persistente
- **Origen:** H2 y H6.
- **Prioridad:** P1 / Alto.
- **Acción:** invocar recordTraceabilityLog desde fetchApi/doPost o middleware común; implementar auditInterServiceCalls con almacenamiento persistente; registrar origen, destino, operación, correlationId, duración, resultado, error y actor verificado; sanitizar secretos/PII.
- **Criterios:** cada operación relevante tiene trazabilidad consultable; no hay respuestas auditLogs vacías como éxito; logs se enlazan por correlationId.
- **Referencias:** AUD-NG-086 y AUD-NG-084.
- **Estado:** Pendiente.

### F6-008-A04 - Implementar multirol y responsabilidades con validación backend
- **Origen:** H4.
- **Prioridad:** P0 / Crítico.
- **Acción:** persistir roles simultáneos, asignaciones por área/subárea/servicio/módulo/operación, vigencia y revocación; resolver roles activos server-side o en claims verificadas; integrar cada servicio con la misma política; auditar cambios.
- **Criterios:** una identidad puede tener varios roles; cada acción requiere permiso explícito; no se confía en authRole del payload; las asignaciones no elevan permisos de otras áreas.
- **Referencias:** AUD-NG-082, AUD-NG-158 y F6-005-A04.
- **Estado:** Pendiente.

### F6-008-A05 - Crear el dashboard del plano de control y probar independencia
- **Origen:** H1, H5 y H8.
- **Prioridad:** P1 / Alto.
- **Acción:** agregar UI para registrar/configurar/consultar servicios, ver estado administrativo/operativo, recursos, dependencias, lastContact, diagnóstico e historial; probar caída del developer-service manteniendo endpoints operativos.
- **Criterios:** dashboard refleja el registro real; servicios operativos no dependen del control plane; caída central se detecta sin bloquear operaciones.
- **Referencias:** AUD-NG-078 y TAREA-F6-007-A06.
- **Estado:** Pendiente.

### F6-008-A06 - Hacer ejecutables y verificables los comandos y contratos
- **Origen:** H6 y H7.
- **Prioridad:** P1 / Alto.
- **Acción:** mantener allowlist cerrada y mapear cada comando a un handler explícito; eliminar respuestas de éxito simuladas; ejecutar contratos contra endpoints reales de prueba y fallar si la respuesta tiene status error.
- **Criterios:** comandos no catalogados se rechazan; comandos permitidos ejecutan una acción verificable; error no puede contar como PASS; pruebas cubren todos los servicios y contratos.
- **Referencias:** AUD-NG-084 y AUD-NG-086.
- **Estado:** Pendiente.

## 7. Cierre
- TAREA-F6-008: NO CUMPLE.
- TAREA-F6-033: NO CUMPLE; mismo título con criterios ampliados.
- Ambos estados [X] de completadas.md se conservan como histórico.
- Pendientes.md se recuperó desde el blob íntegro y no se modificó.
- Se crean informes individuales para ambos IDs con un único bloque canónico F6-008-A01..A06.
- No se modificó código, configuración, dashboard, tests ni datos productivos.
- No se ejecutaron llamadas interservicio, pruebas HTTP, OAuth, caída del plano de control ni E2E.
- Siguiente tarea secuencial: TAREA-F6-009 y su registro ampliado TAREA-F6-034, salud, diagnóstico, tráfico y errores en todos los microservicios.

## 8. Referencias
- completadas.md SHA f57f1aef832e81e44fc4f7ec36a852d50e464676, líneas 2712-2747 y 3609-3655.
- Pendientes.md blob SHA 631b4c2dbf0e86d5704b63625382d73ccb8ceb3c.
- ChangesLogs.txt SHA 5b5cff1926b73a05d1b92087a7bf4b2db75326ff, líneas 1975-1979.
- backend/developer-service/Code.gs SHA 8aa4bac67cfe5c8c54da51a0784a56fef633e412.
- backend/user-service/Code.gs SHA 12079dd410aa6d8afbce55a4bc62a79dea605f9f.
- backend/academic-service/Code.gs SHA df87a2eea9f0ef79d0b966d03fd5bbe432003df5.
- js/api.js SHA 6b24f666db30a811a8e9b38d466fc6001cf6dfa9.
- developer-dashboard.html SHA 2b69f1bf7ffbbe4902e81de14d6315cedb035a1e.
- js/developer.js SHA 6fa4c4bd9be580c974b1fbede4f0cf79485dc331.
