# AUDITORÍA TÉCNICA - TAREA-F6-004: Reestructurar la arquitectura en microservicios independientes

**Fecha:** 2026-11-07  
**Repositorio:** i-miss-cocaine/IMA  
**Rama:** NG_beta_0.0.0.1_work  
**Checkpoint inicial:** C1.220  
**Checkpoint de cierre:** C1.221  
**Sesión:** IMA-AUDIT-20261107-2000Z  
**Dictamen:** **NO CUMPLE**  
**Estado histórico en completadas.md:** [X] (se conserva sin modificación).

## 1. Continuidad, fuentes y alcance

### 1.1 Estado Git
- HEAD de trabajo verificado al inicio: 18d42543774e7c289126cb2f06f9145e20d5d841, commit audit(C1.220): audit F6-003 lifecycle regression suite.
- HEAD previo del checkpoint C1.220: e1de4306ab4ddeb7de91494f96c17e695f5e8b69; árbol de partida consignado: c7a7367d1ba053e5a3938c0450e2fa11eb53f09b.
- La rama NG_beta_0.0.0.1_work se comparó con NG_beta_0.0.0.1: 288 commits adelante y 0 detrás; base/merge-base 44d9891132332e692dbe2ba8602b41f50a508a59.
- La rama base no se modifica. El commit C1.220 contiene cinco archivos documentales; sus blobs actuales se conservaron al reconstruir el árbol del commit siguiente.

### 1.2 Registros, backlog e historial
- completadas.md SHA f57f1aef832e81e44fc4f7ec36a852d50e464676, líneas 2581-2618: TAREA-F6-004 figura [X]. Se revisaron los 11 requisitos funcionales y CA-023..CA-030.
- Pendientes.md: la lectura convencional devuelve 0 caracteres. Se recuperó y consultó directamente el blob Git SHA 631b4c2dbf0e86d5704b63625382d73ccb8ceb3c: 1.803.672 bytes, 1.782.094 caracteres, 20.182 líneas, sin U+FFFD. El blob está íntegro y coincide con el SHA indicado; no se restauró ni modificó porque pudo leerse desde su propio objeto Git.
- La búsqueda en el blob no encontró TAREA-F6-004, F6-004 ni F6-007. Sí contiene TASK-046, TASK-047 y TASK-048 marcadas [X], junto con ampliaciones C1.29/C1.31 que ya advertían que el router de fuentes no está integrado, que cinco servicios comparten SPREADSHEET_ID, que SERVICE_REGISTRY contiene IDs de ejemplo y que los helpers HMAC no se conectan al tráfico real.
- AUDITORIAS/AUDITORIA_FASE_23_MOTOR_INSTITUCIONAL_FLUJOS_TRABAJO.md existe (SHA 388e8978beb37be64135adf6973e430cb3bb83e8). Sus F23-Task02, F23-Task10 y F23-Task07 están expresamente pendientes de ampliación y contienen acciones para el router de fuentes, el catálogo de servicios autenticado y el protocolo HMAC real.
- AUDITORIAS/AUDITORIA_FASE_6_EXPEDIENTE_CICLO_VIDA.md y AUDITORIAS/AUDITORIA_COMPLETADAS_TAREA-F6-004.md no existen en el árbol actual. Se crea el informe individual F6-004.
- ChangesLogs.txt SHA 5b5cff1926b73a05d1b92087a7bf4b2db75326ff, líneas 1949-1951, afirma que fetchApi ya resuelve endpoints dinámicamente consultando SERVICE_REGISTRY. El código actual de js/api.js contradice esa afirmación: fetchApi selecciona exclusivamente SERVICE_URLS.
- Se comprobó que los informes individuales F6-001, F6-002 y F6-003 ya contienen un bloque de tareas derivadas. No requieren normalización adicional.
- Hallazgos previos relacionados que se amplían, sin duplicar identificadores globales: AUD-NG-078..086, en particular AUD-NG-082, AUD-NG-083, AUD-NG-084, AUD-NG-085 y AUD-NG-086; AUD-NG-174; TASK-046, TASK-047 y TASK-048.

### 1.3 Archivos inspeccionados
- js/config.js SHA 49ef90807e5b9dfe1379f76d66efdb4ccd2b6cdc, líneas 224-345: SERVICE_URLS, SERVICE_REGISTRY y getServiceDescriptor.
- js/api.js SHA 6b24f666db30a811a8e9b38d466fc6001cf6dfa9, líneas 1-24, 145-250: fetchApi, fallback, checkMicroserviceHealth y checkAllMicroservicesHealth.
- backend/developer-service/Code.gs SHA 8aa4bac67cfe5c8c54da51a0784a56fef633e412:
  - SPREADSHEET_ID y ROLE_PERMISSIONS: 5-30.
  - doPost y autorización: 145-175.
  - auditoría declarativa de aislamiento: 1353-1382.
  - validateMonolithDecompositionContracts: 1799-1885.
  - validateModularFolderStructure / validateStagedMigrationProgress: 1896-2037.
  - suites de regresión modular y arquitectura: 2040-2206 y 2132-2206.
  - catálogo de contratos y validateServiceConfigDependencies: 2262-2305.
  - getServiceVersionChangelog: 2308-2322.
  - getCentralServiceRegistry / registerServiceInstance / updateServiceStatus: 2415-2598.
  - getServiceHealthDiagnostics: 2599-2618.
- backend/academic-service/Code.gs SHA df87a2eea9f0ef79d0b966d03fd5bbe432003df5: SPREADSHEET_ID, autenticación, dispatcher y doPost.
- backend/user-service/Code.gs SHA 12079dd410aa6d8afbce55a4bc62a79dea605f9f: SPREADSHEET_ID, autenticación y dispatcher.
- backend/accounting-service/Code.gs SHA 38b979d41596b85e888b4a7060b37bbac0840a28: SPREADSHEET_ID, helpers HMAC y dispatcher.
- backend/task-service/Code.gs SHA 1437756a3c3d3d97e06bc1ff21c8e2ca2b2dccbe: SPREADSHEET_ID, DRIVE_FOLDER_ID, autenticación y doPost.
- backend/exam-service/Code.gs SHA 1d93296628fae31f680004f637897e2b1314a64c: SPREADSHEET_ID, autenticación y doPost.
- completadas.md, Pendientes.md (blob), ChangesLogs.txt y auditoría Fase 23 como fuentes de requisitos, estado e historial.

### 1.4 Alcance y limitaciones de verificación
La revisión fue estática y manual sobre las declaraciones de configuración, puntos de entrada, dispatchers, registro central, autenticación, validadores y suites arquitectónicas. No se ejecutaron llamadas HTTP, despliegues de Apps Script, pruebas entre cuentas Google, pruebas de permisos Drive ni pruebas sobre hojas productivas. Los identificadores operativos están hardcodeados en los servicios y no se proporcionó un entorno aislado de prueba; por seguridad no se ejecutaron funciones que pudieran escribir datos reales.

## 2. Hallazgos técnicos

### H1 - CRÍTICO/P0: los servicios de negocio no tienen aislamiento de Spreadsheet
Los servicios USER, ACADEMIC, ACCOUNTING, TASK y EXAM declaran exactamente el mismo SPREADSHEET_ID: 1txfudU4TR4AhVtvFgGRT5Wtmwjl78hK4bfR4XbRwwww. Se verificó en las cabeceras de los cinco Code.gs. El servicio DEVELOPER declara SPREADSHEET_ID = 1DEVELOPER-CONTROL-PLANE-SPREADSHEET-ID, un marcador de posición, no un ID operativo acreditado. TASK sí declara un DRIVE_FOLDER_ID propio, pero el catálogo frontend conserva marcadores de posición para los recursos de los demás servicios.
- Esto no demuestra proyectos Apps Script ni almacenamiento independientes por servicio, contradice CA-024 y deja sin acreditar la configuración independiente exigida por CA-023.
- La ampliación C1.29 de TASK-046 ya había registrado que cinco servicios comparten el mismo ID y que los accesos siguen usando el Spreadsheet fijo; la inspección actual confirma que las constantes siguen iguales.
- auditServiceBackendIsolationAndDriveSecurity (1353-1382) no inspecciona los recursos reales: construye un arreglo en el que los seis servicios ya están marcados como aislados y con MINIMUM_PRIVILEGE, por lo que devuelve success sin verificar IDs, carpetas ni permisos.
**Impacto:** separación funcional en carpetas/código no equivale a aislamiento de datos; una modificación o permiso sobre la hoja compartida puede afectar múltiples dominios.

### H2 - CRÍTICO/P0: el registro central es declarativo y contiene recursos/endpoints ficticios
- js/config.js:224-242 define endpoints estáticos. ACCOUNTING usa https://script.google.com/macros/s/AKfycbzAccountingSvc/exec y DEVELOPER usa https://script.google.com/macros/s/AKfycbzDeveloperControlPlaneSvc/exec; ambos son marcadores visibles, no IDs de despliegue acreditados. Los otros cuatro endpoints tienen forma de URL de Apps Script, pero no se verificó que estén activos.
- SERVICE_REGISTRY (245-315) asigna IDs de Spreadsheet y Drive de ejemplo (por ejemplo, 1-USER-SPREADSHEET-ID y 1-ACADEMIC-DRIVE-FOLDER-ID), marca todos los servicios ACTIVE y declara v8.4.0 para todos. No incluye scriptProjectId ni permisos efectivos consultables.
- backend/developer-service/Code.gs:5 declara un SPREADSHEET_ID marcador. getCentralServiceRegistry (2415-2470) devuelve servicios por defecto con el mismo SPREADSHEET_ID del control plane, cuentas propietarias ficticias y sin endpointUrl cuando el catálogo está vacío o falla.
- registerServiceInstance (2473-2527) solo exige serviceId y name. endpointUrl y spreadsheetAsociado son opcionales; el segundo cae por defecto al SPREADSHEET_ID del control plane. No recibe ni persiste un identificador del proyecto Apps Script.
- validateServiceConfigDependencies (2286-2305) declara spreadsheetBindingValid como Boolean(spreadsheetId || true) y driveFolderBindingValid como Boolean(driveFolderId || true); ambas expresiones siempre son true. También fija permissionsCheck en PASS y obsoleteCallsDetected en 0 sin consultar recursos.
- getServiceVersionChangelog (2308-2322) devuelve v8.4.0/v2.1 para cualquier serviceId, no consulta una versión desplegada. El registro frontend también afirma v8.4.0 para todos, aunque las cabeceras actuales identifican ACADEMIC/DEVELOPER como v8.4.0 y ACCOUNTING como v8.0.0; USER, TASK y EXAM no acreditan esa misma versión.
**Impacto:** el catálogo no permite identificar de forma fiable proyecto, endpoint, almacenamiento, permisos ni versión desplegada. Se amplía TASK-047/F23-Task10 y AUD-NG-078..082; no se crea un ID global duplicado.

### H3 - ALTO/P1: fetchApi no consume SERVICE_REGISTRY
fetchApi (js/api.js:11-24) obtiene URLs exclusivamente desde window.SERVICE_URLS y utiliza urls[service]. No consulta window.SERVICE_REGISTRY, getServiceDescriptor ni el estado de salud. La función getServiceDescriptor de js/config.js existe, pero no está integrada en el resolver de fetchApi.
Esto contradice la entrada de ChangesLogs.txt (1949-1951), que afirma que la resolución dinámica ya fue reforzada consultando SERVICE_REGISTRY antes del fallback SERVICE_URLS. La evidencia actual no contiene esa lógica.
**Impacto:** el registro central no es fuente efectiva de descubrimiento; cambios de endpoint, estado o versión no se propagan a las llamadas de los dashboards. CA-025 solo se acredita parcialmente por existir un helper común; CA-029 no se cumple.

### H4 - ALTO/P1: catálogo de contratos incompleto y validador con falsos positivos
- getCentralConfigAndContractCatalog (2262-2285) publica listas de actions, version y deprecatedActions. No define para cada operación parámetros, esquema de entrada, respuesta, códigos de error, permisos ni compatibilidad de versión.
- Las listas de USER, TASK, EXAM y ACCOUNTING solo contienen una selección de acciones; no son un inventario completo del dispatcher real.
- validateMonolithDecompositionContracts (1799-1885) considera validada una operación si está en el catálogo, en módulos, en globalFunctions o si el propio payload incluye su nombre en validContracts. No comprueba que el dispatcher del servicio implemente la acción ni que su contrato coincida con el código.
- validateServiceConfigDependencies (2286-2305) devuelve preparación exitosa incluso si no se proporcionan IDs de recursos.
**Impacto:** la validación puede certificar contratos no implementados o recursos inexistentes. No se demuestra compatibilidad absoluta ni ausencia de endpoints desconectados (CA-026/CA-030).

### H5 - CRÍTICO/P0: la autenticación entre servicios no está integrada en el tráfico y el control plane conserva una vía de suplantación
- doPost de DEVELOPER (145-175) acepta payload.authRole como userRole cuando no se presenta token. ROLE_PERMISSIONS asigna ["*"] a Administrador (líneas 23-30). Esto coincide con AUD-NG-082; no se realizó una petición de explotación.
- createInterServiceEnvelope y verifyInterServiceEnvelope están definidos como helpers, pero AUD-NG-083 ya documenta que no se invocan desde doPost ni desde llamadas salientes. Los dispatchers siguen recibiendo action/payload ordinarios sin exigir un sobre firmado.
- getAuthTokenSecret deriva el fallback mediante SHA-256 de SPREADSHEET_ID + sufijo. Los cinco servicios que comparten el ID operativo pueden derivar el mismo secreto si no tienen AUTH_TOKEN_SECRET configurado individualmente. AUD-NG-084 ya documenta el fallback predecible y ausencia de claves por par.
- AUD-NG-086 documenta que verifyInterServiceEnvelope no autoriza sourceService/acción ni valida versión/esquema. AUD-NG-085 conserva el problema de reservar requestId antes de verificar criptográficamente la firma.
- fetchApi envía {action, payload}; no incorpora sessionToken en el cuerpo. La brecha ya se relaciona con AUD-NG-001 y F6-001-A03, por lo que no se crea un hallazgo duplicado.
**Impacto:** no se acredita autenticación mutua ni autorización granular entre despliegues independientes. Los controles de acceso y CA-028 no pueden declararse satisfechos.

### H6 - ALTO/P1: diagnósticos y suites arquitectónicas producen PASS sin comprobar el estado real
- getServiceHealthDiagnostics (2599-2618) devuelve connectivity, spreadsheetAccess y permissions como PASS; mide únicamente el tiempo local entre Date.now() consecutivos y devuelve HEALTHY sin contactar otro servicio ni abrir/verificar el Spreadsheet.
- checkAllMicroservicesHealth (js/api.js:240-250) solo consulta USER, ACADEMIC, TASK y EXAM; omite ACCOUNTING y DEVELOPER.
- runFullArchitectureIntegrationAndPerformanceSuite (2132-2206) verifica que el catálogo devuelva success, que exista el catálogo de contratos y que el diagnóstico devuelva success. PERF-03 llama al diagnóstico estático; no simula indisponibilidad. PERF-05 invoca una función que devuelve los roles enviados por el payload; no verifica aislamiento real.
- runModularAndDynamicDashboardsRegressionSuite (2040-2114) verifica existencia de catálogos y un token inválido, pero no realiza llamadas HTTP ni prueba contratos/despliegues.
- validateStagedMigrationProgress (1967-2037) utiliza esas respuestas superficiales para marcar etapas como COMPLETED.
**Impacto:** los resultados PASS no prueban conectividad, permisos, aislamiento ni tolerancia a fallos. Se amplía TAREA-F6-009 y la cobertura de regresión F6-003.

### H7 - ALTO/P1: el fallback de lecturas puede ocultar la indisponibilidad de un servicio
fetchApi (js/api.js:145-205) convierte errores de red en status: success y data:[] para acciones get*, con isFallback:true. Aunque la bandera existe, el contrato de retorno puede confundirse con un conjunto legítimamente vacío si el consumidor no la comprueba. No se acredita una política de circuit breaker, reintento selectivo por semántica ni pruebas E2E que demuestren que las operaciones de otros servicios siguen funcionando de forma independiente.
**Impacto:** CA-027 solo puede considerarse parcial/no probado. La capa común permite llamadas separadas, pero no certifica una degradación segura y observable.

## 3. Matriz de requisitos y criterios

| Elemento | Dictamen | Evidencia |
|---|---|---|
| R1: proyecto Apps Script propio, ID, endpoint, Spreadsheet/Drive, diagnóstico y versión | No cumple | No se registra scriptProjectId; endpoints y recursos con marcadores; versiones estáticas; IDs de Spreadsheet compartidos. |
| R2: separación funcional y conservación de relaciones | Parcial | Existen servicios/carpeta por responsabilidad, pero la persistencia comparte el mismo Spreadsheet y no se acredita aislamiento. |
| R3: consumo centralizado desde js/api.js | Parcial | Existe fetchApi, pero usa URLs estáticas y no consume el registro central. |
| R4: descubrimiento central con endpoints, versiones, recursos y permisos | No cumple | SERVICE_REGISTRY está hardcodeado, con IDs de ejemplo, estados ACTIVE fijos y sin permisos efectivos. |
| R5: configuración separada del código | No cumple | URLs e IDs se encuentran en constantes/código; faltan bindings runtime por servicio. |
| R6: contratos completos por operación | No cumple | El catálogo solo lista actions/version; no hay esquema, parámetros, respuestas, errores y permisos por acción. |
| R7: compatibilidad de funciones/endpoints | No acreditado | El validador acepta contratos del payload y no compara con dispatchers reales; no hay prueba E2E. |
| R8: control plane sin intermediario obligatorio | Parcial/Cumple en enrutamiento directo | fetchApi llama directamente al endpoint, pero el control plane no demuestra persistencia ni descubrimiento operativo. |
| R9: tolerancia a fallos entre servicios | Parcial | Llamadas separadas y fallback local existen; health checks incompletos y falsos éxitos en lecturas. |
| R10: fuente única de verdad por entidad | No acreditado | No hay mapa verificable de propiedad por entidad; cinco servicios comparten el mismo Spreadsheet. |
| R11: auditoría antes/después de migraciones | No acreditado | Hay funciones/suites declarativas, pero no evidencia de migraciones y validaciones reales entre despliegues. |
| CA-023 | No cumple | Identidad de proyecto y despliegue no verificables; control plane con ID placeholder. |
| CA-024 | No cumple | Cinco servicios comparten SPREADSHEET_ID; catálogo de recursos contiene placeholders. |
| CA-025 | Parcial | fetchApi existe, pero no resuelve mediante el registro central. |
| CA-026 | No acreditado | No hay pruebas de actualización independiente ni compatibilidad de contratos. |
| CA-027 | Parcial/no probado | Fallback local existe, pero no hay pruebas de indisponibilidad aislada y salud de todos los servicios. |
| CA-028 | No acreditado | Autenticación interservicio no integrada; existe fallback authRole no autenticado en DEVELOPER. |
| CA-029 | No cumple | El registro no identifica proyecto Apps Script ni despliegue operativo; contiene URLs y recursos de ejemplo. |
| CA-030 | No acreditado | El validador no compara todas las acciones con dispatchers reales; no se ejecutaron pruebas de endpoints. |

## 4. Reconciliación con tareas y hallazgos existentes

No se crean nuevos IDs globales AUD-NG para problemas ya registrados.
- TASK-046 / F23-Task02: ampliar la resolución universal de fuentes y la migración de consumidores. La ampliación C1.29 ya documenta SPREADSHEET_ID compartido, resolver parcial y placeholders; el código actual conserva las constantes compartidas.
- TASK-047 / F23-Task10: ampliar el registro central, exigir scriptProjectId/endpoint/owner/resources/permisos, eliminar defaults ficticios y validar recursos reales. AUD-NG-078..082 siguen aplicando; AUD-NG-082 cubre la suplantación por authRole.
- TASK-048 / F23-Task07: ampliar integración HMAC en llamadas salientes y dispatcher entrante, claves por par con rotación/revocación y autorización granular. Reutilizar AUD-NG-083..086; AUD-NG-085 cubre el orden anti-replay.
- AUD-NG-174: ampliar contrato común de respuestas, validación en fetchApi y distinción entre vacío legítimo e indisponibilidad.
- TAREA-F6-009: ampliar diagnósticos reales de todos los servicios y recursos.
- TAREA-F6-003-A09: dependencia de pruebas conductuales y runner; no asumir que el estado [X] histórico certifica las pruebas de arquitectura.
- TAREA-F6-001-A03 / AUD-NG-001: conservar como dependencia de propagación de sessionToken, sin duplicar el hallazgo.

## 5. Tareas ejecutables derivadas de los hallazgos

Las siguientes tareas son locales a esta auditoría; se amplían TASK-046/047/048 y hallazgos AUD-NG existentes, sin duplicar IDs globales. Todas quedan pendientes.

### F6-004-A01 - Aislar fuentes de datos y completar el router por servicio
- **Hallazgos de origen:** H1.
- **Tarea global ampliada:** TASK-046 / F23-Task02.
- **Severidad/Prioridad:** Crítico / P0.
- **Objetivo:** eliminar la dependencia operativa de un Spreadsheet compartido y establecer una fuente autorizada por dominio/servicio.
- **Acción ejecutable:** provisionar y registrar recursos propios por servicio; migrar lecturas/escrituras al resolver común; validar existencia, cuenta, permisos, dominio, esquema y estado; eliminar fallback silencioso al ID compartido salvo excepción documentada.
- **Archivos/módulos:** backend/user-service, academic-service, accounting-service, task-service, exam-service, developer-service; CatalogoSpreadsheets y helpers resolveSpreadsheetSource.
- **Criterios de aceptación:** cada servicio usa el recurso autorizado; IDs distintos cuando no exista excepción; lecturas/escrituras cruzadas bloqueadas; fuentes inexistentes/inactivas fallan cerradas; referencias históricas preservadas; pruebas con hojas de prueba independientes.
- **Estado:** Pendiente.

### F6-004-A02 - Convertir el registro de servicios en fuente de verdad verificable
- **Hallazgos de origen:** H1, H2 y H6.
- **Tarea global ampliada:** TASK-047 / F23-Task10; AUD-NG-078..082.
- **Severidad/Prioridad:** Crítico / P0.
- **Objetivo:** identificar cada despliegue y recurso real sin placeholders ni defaults ficticios.
- **Acción ejecutable:** exigir serviceId, scriptProjectId, deploymentId/endpoint, propietario, dominio, Spreadsheet/Drive, versión, esquema y permisos; validar existencia y acceso; hacer obligatorio endpoint y recurso cuando aplique; retirar el fallback a datos ficticios; registrar cambios con actor autenticado e historial atómico; corregir validateServiceConfigDependencies.
- **Archivos/módulos:** backend/developer-service/Code.gs; js/config.js; CatalogoServicios; HistorialServiciosDistribuidos.
- **Criterios de aceptación:** registro rechaza metadatos faltantes o inválidos; cada servicio apunta a un despliegue y recurso real; estados ACTIVE provienen de comprobación; permisos se consultan; no se informa éxito ante fallos; historial conserva propietario, endpoint y recursos anteriores.
- **Estado:** Pendiente.

### F6-004-A03 - Integrar autenticación y autorización interservicio real
- **Hallazgos de origen:** H5.
- **Tarea global ampliada:** TASK-048 / F23-Task07; AUD-NG-082..086.
- **Severidad/Prioridad:** Crítico / P0.
- **Objetivo:** impedir suplantación y ejecutar únicamente llamadas firmadas y autorizadas.
- **Acción ejecutable:** envolver llamadas salientes con createInterServiceEnvelope; exigir verifyInterServiceEnvelope antes del dispatcher; usar secretos aleatorios por par, rotables y revocables; autenticar emisor activo y autorizar source/target/action; verificar HMAC antes de reservar nonce; retirar authRole confiado al cliente.
- **Archivos/módulos:** USER, ACADEMIC, ACCOUNTING, DEVELOPER y demás servicios que se comuniquen; js/api.js; gestor de credenciales.
- **Criterios de aceptación:** peticiones sin firma/firma incorrecta/expiradas/repetidas/no autorizadas se rechazan; rotación y revocación individual probadas; correlationId y versión propagados; llamadas E2E entre proyectos/cuentas de prueba.
- **Estado:** Pendiente.

### F6-004-A04 - Integrar el descubrimiento central con fetchApi y contratos versionados
- **Hallazgos de origen:** H2, H3 y H4.
- **Tareas/hallazgos relacionados:** TAREA-F6-004; AUD-NG-174.
- **Severidad/Prioridad:** Alto / P1.
- **Objetivo:** hacer que los dashboards resuelvan endpoints desde el registro vigente y validen contratos sin convertir el control plane en proxy obligatorio.
- **Acción ejecutable:** modificar fetchApi para consumir descriptores verificados; resolver URL, estado, versión y permisos por servicio; definir esquemas de entrada/salida, respuestas, errores y permisos por acción; comprobar cada acción contra el dispatcher real; retirar aceptación de validContracts suministrado por el cliente.
- **Archivos/módulos:** js/api.js; js/config.js; backend/developer-service/Code.gs; dispatchers de cada servicio.
- **Criterios de aceptación:** cambios de endpoint se reflejan sin editar fetchApi; endpoints inactivos/no registrados fallan con error explícito; contratos versionados y comprobados; todas las acciones usadas por UI existen y mantienen compatibilidad; no quedan rutas obsoletas.
- **Estado:** Pendiente.

### F6-004-A05 - Implementar diagnósticos reales y validación honesta de dependencias
- **Hallazgos de origen:** H2 y H6.
- **Tarea global ampliada:** TAREA-F6-009.
- **Severidad/Prioridad:** Alto / P1.
- **Objetivo:** que PASS/HEALTHY represente comprobaciones reales y reproducibles.
- **Acción ejecutable:** probar endpoint, permisos, Spreadsheet/Drive, versión y latencia; monitorizar los seis servicios; reemplazar arreglos hardcodeados y resultados constantes por inspección de recursos reales; corregir suites que aceptan catálogos o diagnósticos estáticos como prueba de integración.
- **Archivos/módulos:** backend/developer-service/Code.gs; js/api.js; dashboards de monitoreo.
- **Criterios de aceptación:** cada chequeo identifica servicio/recurso/versión; fallo de acceso devuelve FAIL; medición de latencia incluye llamada real; los seis servicios aparecen; no se emite HEALTHY si no se ejecutaron las comprobaciones.
- **Estado:** Pendiente.

### F6-004-A06 - Probar compatibilidad, aislamiento y tolerancia a fallos entre despliegues
- **Hallazgos de origen:** H3, H4, H5, H6 y H7.
- **Tareas relacionadas:** TAREA-F6-003-A09; TASK-046/047/048; AUD-NG-083..086 y AUD-NG-174.
- **Severidad/Prioridad:** Alto / P1.
- **Objetivo:** demostrar que una actualización o caída de un servicio no desconecta funciones independientes ni altera permisos/resultados.
- **Acción ejecutable:** crear entorno aislado multi-proyecto; probar contratos de cada dispatcher, compatibilidad de versiones, indisponibilidad selectiva, reintentos, autenticación, aislamiento de datos y recuperación; distinguir respuesta vacía de fallback/error; registrar expected/actual y evidencias.
- **Archivos/módulos:** tests/regression; suites del servicio DEVELOPER; despliegues de prueba de los seis servicios.
- **Criterios de aceptación:** pruebas E2E ejecutadas contra deployments de prueba; caída de un servicio no bloquea operaciones independientes; ningún fallo de red se reporta como lectura vacía exitosa; resultados equivalentes y permisos preservados; fixtures y limpieza no tocan producción.
- **Estado:** Pendiente.

## 6. Cierre
- Dictamen: NO CUMPLE.
- TAREA-F6-004 permanece [X] en completadas.md como registro histórico; no se modificó el estado maestro.
- Pendientes.md se recuperó desde su blob íntegro, se consultó y no se modificó.
- Se creó el informe individual y se actualizaron los registros de auditoría y contexto.
- No se modificó código, configuración, tests ni datos productivos.
- No se ejecutaron suites ni llamadas de red por falta de entorno de prueba aislado y por el riesgo de escribir en recursos productivos.
- Siguiente tarea secuencial: TAREA-F6-005 - Crear los microservicios administrativos y financieros con separación por responsabilidades; primero localizar su informe individual e historial y verificar sus requisitos contra código.

## 7. Referencias
- completadas.md SHA f57f1aef832e81e44fc4f7ec36a852d50e464676, líneas 2581-2618.
- Pendientes.md blob SHA 631b4c2dbf0e86d5704b63625382d73ccb8ceb3c.
- ChangesLogs.txt SHA 5b5cff1926b73a05d1b92087a7bf4b2db75326ff, líneas 1949-1951.
- AUDITORIAS/AUDITORIA_FASE_23_MOTOR_INSTITUCIONAL_FLUJOS_TRABAJO.md SHA 388e8978beb37be64135adf6973e430cb3bb83e8.
- js/config.js SHA 49ef90807e5b9dfe1379f76d66efdb4ccd2b6cdc.
- js/api.js SHA 6b24f666db30a811a8e9b38d466fc6001cf6dfa9.
- backend/developer-service/Code.gs SHA 8aa4bac67cfe5c8c54da51a0784a56fef633e412.
- backend/academic-service/Code.gs SHA df87a2eea9f0ef79d0b966d03fd5bbe432003df5.
- backend/user-service/Code.gs SHA 12079dd410aa6d8afbce55a4bc62a79dea605f9f.
- backend/accounting-service/Code.gs SHA 38b979d41596b85e888b4a7060b37bbac0840a28.
- backend/task-service/Code.gs SHA 1437756a3c3d3d97e06bc1ff21c8e2ca2b2dccbe.
- backend/exam-service/Code.gs SHA 1d93296628fae31f680004f637897e2b1314a64c.
