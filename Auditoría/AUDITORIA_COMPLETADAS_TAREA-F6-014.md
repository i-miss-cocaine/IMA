# AUDITORÍA TÉCNICA - TAREA-F6-014: Centralizar la configuración y las dependencias sin centralizar todos los datos

**Fecha:** 2026-11-07  
**Repositorio:** i-miss-cocaine/IMA  
**Rama:** NG_beta_0.0.0.1_work  
**Checkpoint inicial:** C1.230  
**Checkpoint de cierre:** C1.231  
**Sesión:** IMA-AUDIT-20261107-2125Z-01  
**HEAD auditado:** 201373cd3b859eb1cc523eda920ab8a91e4af4ce  
**Dictamen:** **NO CUMPLE**  
**Estado histórico en completadas.md:** [X] (se conserva sin modificación).

> Esta auditoría se complementa con TAREA-F6-039, que repite el título y amplía el alcance con CA-129..CA-135 y CA-168..CA-169. Se crean informes individuales por identificador, pero ambos comparten las tareas correctivas canónicas existentes para evitar duplicaciones.

## 1. Continuidad, fuentes y alcance

### 1.1 Estado Git y registros de tareas

- HEAD de trabajo verificado: 201373cd3b859eb1cc523eda920ab8a91e4af4ce; commit C1.230, árbol dd5f0d54e2732a93fb34a99fd51b558388b76234.
- Rama base NG_beta_0.0.0.1: 44d9891132332e692dbe2ba8602b41f50a508a59; permanece intacta.
- Comparación inicial: 298 commits adelante, 0 atrás.
- completadas.md SHA f57f1aef832e81e44fc4f7ec36a852d50e464676: TAREA-F6-014 [X], línea 2885 y sección de requisitos a continuación. La marca se conserva como dato histórico, no como certificación.
- Pendientes.md: lectura convencional sin contenido; se recuperó y consultó el blob de esta rama SHA 631b4c2dbf0e86d5704b63625382d73ccb8ceb3c: 1.803.672 bytes, 1.782.094 caracteres, 20.182 líneas, UTF-8 sin U+FFFD. No contiene F6-014/F6-039. Sí contiene TASK-392 (configuración centralizada de servicios complementarios) y registros relacionados de configuración institucional; no sustituyen los criterios de esta tarea. El blob no se modificó.
- ChangesLogs.txt SHA 5b5cff1926b73a05d1b92087a7bf4b2db75326ff, líneas 2007-2012: afirma que el catálogo y la validación central de dependencias fueron verificados. La inspección del código actual contradice esa afirmación: el validador devuelve PASS por construcción y el catálogo es estático.
- No existía AUDITORIAS/AUDITORIA_COMPLETADAS_TAREA-F6-014.md en el árbol de la rama. Se crea este informe.
- El informe F6-004 ya documenta causas compartidas (registro, endpoints, contratos y fetchApi). Se amplían sus tareas y hallazgos existentes, sin crear identificadores globales duplicados.

### 1.2 Alcance auditado y respaldos inmutables

- completadas.md: requisitos funcionales 1-7 y criterios CA-070..CA-073.
- backend/developer-service/Code.gs SHA 8aa4bac67cfe5c8c54da51a0784a56fef633e412:
  - ROLE_PERMISSIONS y doPost: líneas 23-30 y 145-220.
  - getCentralSpreadsheetConfigRegistry: 223 en adelante.
  - getCentralConfigAndContractCatalog: 2262-2285.
  - validateServiceConfigDependencies: 2286-2305.
  - getCentralServiceRegistry: 2415-2472.
  - registerServiceInstance: 2473-2530.
  - updateServiceStatus: 2531-2585.
- js/config.js SHA 49ef90807e5b9dfe1379f76d66efdb4ccd2b6cdc: SERVICE_URLS, SERVICE_REGISTRY y getServiceDescriptor, líneas 224-335.
- js/api.js SHA 6b24f666db30a811a8e9b38d466fc6001cf6dfa9: fetchApi líneas 11-181 y checkAllMicroservicesHealth líneas 240-250.
- backend/user-service/Code.gs SHA 12079dd410aa6d8afbce55a4bc62a79dea605f9f.
- backend/academic-service/Code.gs SHA df87a2eea9f0ef79d0b966d03fd5bbe432003df5.
- backend/accounting-service/Code.gs SHA 38b979d41596b85e8884b7060b37bbac0840a28.
- backend/task-service/Code.gs SHA 1437756a3c3d3d97e06bc1ff21c8e2ca2b2dccbe.
- backend/exam-service/Code.gs SHA 1d93296628fae31f680004f637897e2b1314a64c.
- developer-dashboard.html SHA 2b69f1bf7ffbbe4902e81de14d6315cedb035a1e.
- js/developer.js SHA 6fa4c4bd9be580c974b1fbede4f0cf79485dc331.
- tests/regression/academic-grading-suite.js SHA a22cb3ef376fe09e65c1b17c2f4f5125290bfba6.
- AUDITORIAS/MapaDependencias.md SHA fb6f3870e5f0ca4d11bd39d5adf919e394da3327; AUDITORIAS/Auditoria.txt SHA e1c350cdb86f445759454802ffa296314825e84e.

La inspección es estática y manual. No se ejecutaron operaciones en Apps Script, endpoints HTTP, OAuth, despliegues, navegador, Drive o Sheets productivas. No se modificó código ni configuración.

## 2. Hallazgos técnicos

### H1 - CRÍTICO/P0: no existe una fuente central operativa de configuración por servicio

- js/config.js define SERVICE_URLS con URLs dentro del código fuente. ACCOUNTING y DEVELOPER contienen valores marcadores, no endpoints de despliegue acreditados.
- SERVICE_REGISTRY se construye estáticamente en el navegador. Los seis registros declaran version v8.4.0 y healthStatus ACTIVE; varios Spreadsheet/Drive IDs son marcadores de ejemplo.
- El registro no constituye una lectura de configuración persistida por servicio, no aporta dependencias verificadas ni permite distinguir configuración real de valores de plantilla.
- Cinco servicios de negocio mantienen el mismo SPREADSHEET_ID en sus cabeceras; el control plane DEVELOPER conserva un identificador marcador. La centralización de metadatos no debe convertirse en centralización de datos operativos.
- getCentralSpreadsheetConfigRegistry consulta una hoja del Spreadsheet del propio servicio DEVELOPER y, cuando no encuentra registros, puede aceptar registeredSpreadsheets desde el payload. No resuelve el catálogo completo de endpoints, carpetas Drive, dependencias, contratos ni permisos efectivos.

**Impacto:** CA-070 no cumple. La configuración declarada no permite identificar de forma confiable cada recurso, endpoint y dependencia, y el almacenamiento compartido contradice la separación de datos exigida.

### H2 - CRÍTICO/P0: la validación previa a la activación siempre produce falsos positivos

validateServiceConfigDependencies (2286-2305) solo exige serviceKey. Las expresiones Boolean(spreadsheetId || true) y Boolean(driveFolderId || true) siempre son verdaderas, permissionsCheck se fija en PASS, obsoleteCallsDetected se fija en 0 y la respuesta devuelve isReadyForActivation: true. No se comprueba existencia de Spreadsheet/Drive, permisos, propiedad, estado del recurso, endpoint, dependencias ni llamadas obsoletas.

**Impacto:** una instancia con configuración vacía o inválida puede ser declarada lista. CA-070 y CA-071 no quedan acreditados; el criterio de validación previa falla.

### H3 - ALTO/P1: fetchApi no consume el registro central ni resuelve configuración dinámica

fetchApi (js/api.js:11-24) toma window.SERVICE_URLS y asigna url = urls[service]. No consulta SERVICE_REGISTRY, getServiceDescriptor ni el catálogo del control plane. Los cambios en el registro central no se propagan al tráfico de los dashboards sin editar el frontend.

**Impacto:** CA-071 no cumple. El mecanismo central no es fuente efectiva de resolución de endpoints y no permite cambiar URL/parámetros/referencias de almacenamiento exclusivamente mediante configuración.

### H4 - ALTO/P1: catálogo de contratos incompleto, estático y sin comparación con dispatchers reales

getCentralConfigAndContractCatalog (2262-2285) enumera una selección de acciones y versiones constantes. No define esquemas de entrada/salida, parámetros, tipos, errores, permisos por operación, efectos secundarios ni compatibilidad. Las listas no representan el inventario íntegro de acciones de los dispatchers; asignan v8.4.0 a servicios con versiones divergentes o sin versión declarada. No se detecta ni compara el conjunto de llamadas reales de js/api.js con los endpoints desplegados.

**Impacto:** CA-073 no cumple. El catálogo puede omitir operaciones, mantener contratos obsoletos y aparentar compatibilidad sin validar el backend.

### H5 - ALTO/P1: registro y retiro de servicios no administran el ciclo de vida completo ni sus referencias

- getCentralServiceRegistry devuelve defaults hardcodeados cuando el catálogo está vacío o falla; los defaults declaran servicios activos, cuentas de ejemplo y recursos no verificados.
- registerServiceInstance exige serviceId y name, pero endpointUrl y spreadsheetAsociado son opcionales; admite permisos wildcard por defecto y no registra scriptProjectId, deploymentId, Drive folder ni dependencias completas.
- updateServiceStatus actualiza el estado de una fila y agrega un evento de historial. No retira endpoint, no despublica contratos, no desactiva referencias frontend ni identifica dependencias entrantes/huérfanas.
- SERVICE_URLS y SERVICE_REGISTRY permanecen definidos estáticamente aunque un servicio se marque retirado o suspendido.

**Impacto:** CA-072 no cumple. El cambio de estado no garantiza retiro controlado ni evita enlaces activos o referencias huérfanas.

### H6 - ALTO/P1: el dashboard no consume el catálogo de configuración ni presenta dependencias verificadas

El backend expone acciones de consulta y registro, pero no se localizó integración de getCentralConfigAndContractCatalog, getCentralServiceRegistry o validateServiceConfigDependencies en js/developer.js ni una vista operativa de configuración/dependencias en developer-dashboard.html. El panel contiene vistas de logs y respaldos, pero no demuestra consulta/edición de configuración central, dependencias, historial de versiones o disponibilidad por recurso.

**Impacto:** la existencia de endpoints no satisface un flujo operativo de administración ni permite al responsable verificar dependencias antes de activar o retirar servicios.

### H7 - ALTO/P1: las referencias de roles/áreas siguen distribuidas y no se sincronizan desde una fuente central

Los servicios conservan sus propias matrices ROLE_PERMISSIONS y los dashboards utilizan configuraciones locales. No se encontró un mecanismo de configuración central versionada que propague cambios de roles, áreas o coordinaciones a todos los servicios autorizados. Este defecto se solapa con la tarea de multirol y responsabilidades del plano de control, por lo que se amplía su tarea canónica existente.

**Impacto:** cambios institucionales requieren modificaciones dispersas y pueden producir permisos divergentes entre servicios.

### H8 - MEDIO/P1: indisponibilidad y ausencia legítima de datos no tienen un contrato uniforme

fetchApi puede devolver status: success y data: [] para operaciones get* tras errores de red, añadiendo isFallback: true. La bandera permite distinguir el fallback solo si cada consumidor la interpreta; no existe un contrato común obligatorio que impida presentarlo como resultado vacío legítimo. Tampoco se identifica un catálogo de capacidades alternativas por dependencia fallida.

**Impacto:** la interfaz puede ocultar una indisponibilidad y no informar qué funciones continúan disponibles.

### H9 - ALTO/P1: la cobertura de pruebas no acredita configuración, contratos ni interoperabilidad

tests/regression/academic-grading-suite.js comprueba TASK-046/TASK-047 principalmente mediante includes sobre el código. No contiene casos específicos F6-014/F6-039 ni valida cambios dinámicos de endpoint, permisos reales, recursos inexistentes, retiro, referencias huérfanas, contrato contra dispatcher, diferencias entre vacío y error o disponibilidad degradada. No se ejecutaron pruebas E2E ni suites por riesgo de tocar recursos productivos.

**Impacto:** no existe evidencia conductual que permita declarar satisfechos CA-070..CA-073.

## 3. Matriz de criterios de aceptación

| Criterio | Dictamen | Evidencia |
|---|---|---|
| CA-070: servicios y dependencias catalogados centralmente | No cumple | Registro estático/incompleto; recursos ficticios; dependencias no verificadas. |
| CA-071: cambios de URL/referencias mediante configuración sin editar código | No cumple | fetchApi usa SERVICE_URLS hardcodeado; no consulta configuración central. |
| CA-072: retirar servicio sin romper dashboards ni dejar endpoints activos | No cumple | updateServiceStatus solo cambia estado e historial; no sincroniza endpoints ni referencias frontend. |
| CA-073: catálogo valida compatibilidad de llamadas de js/api.js | No cumple | Catálogo estático parcial, sin esquemas ni comparación real con dispatchers. |

**Dictamen funcional:** NO CUMPLE.  
**Calidad técnica:** insuficiente por falsos positivos, fuentes duplicadas, datos de ejemplo, falta de sincronización y pruebas no conductuales.

## 4. Reconciliación de hallazgos e identificadores

Se amplían registros existentes; no se crean nuevos IDs AUD-NG para causas ya documentadas:

- AUD-NG-011: registro de despliegues, endpoints, recursos propios, permisos y ciclo de vida verificables.
- AUD-NG-077: versión e historial de configuración/esquema y compatibilidad.
- AUD-NG-078: registro central de servicios, deployment, endpoints y contratos.
- AUD-NG-081: pruebas aisladas, funcionales y multi-servicio.
- AUD-NG-174: contrato API completo, compatibilidad, errores y validación de llamadas.
- AUD-NG-158: propagación de roles, áreas y coordinaciones con autorización contextual.
- TASK-046/F23-Task02 y TASK-047/F23-Task10: resolver de fuentes y catálogo institucional, respectivamente.
- Las tareas F6-004, F6-007, F6-008 y F6-009 ya contienen acciones correctivas que cubren estas causas; se amplían, no se duplican.

## 5. Tareas ejecutables derivadas de los hallazgos

No se crean IDs locales nuevos porque las causas correctivas ya tienen tareas canónicas pendientes. Las tareas existentes se amplían con los criterios de F6-014 y, en el informe complementario, F6-039. Todas permanecen Pendientes.

### F6-004-A01 - Aislar fuentes de datos y completar el router por servicio (existente ampliada)
- **Hallazgos:** H1, H5.
- **Acción adicional:** mantener los datos operativos en sus servicios; centralizar solo metadatos de configuración, referencias y dependencias; eliminar el uso compartido accidental de Spreadsheet.
- **Criterios adicionales:** cada servicio resuelve su fuente autorizada; no se centralizan tablas operativas; la configuración central no habilita acceso cruzado; las fuentes fallidas/inactivas fallan cerradas.
- **Dependencias:** TASK-046, AUD-NG-011, AUD-NG-077.
- **Estado:** Pendiente.

### F6-004-A02 - Convertir el registro de servicios en fuente de verdad verificable (existente ampliada)
- **Hallazgos:** H1, H2, H5.
- **Acción adicional:** registrar por instancia endpoints, Spreadsheet, Drive, dependencias, permisos, versión de configuración, responsable y estado real; validar recursos y permisos antes de activar; guardar historial append-only de cambios y retiro.
- **Criterios adicionales:** no existen defaults ficticios; un servicio incompleto no queda Activo; cambios de configuración son auditables; el retiro identifica y deshabilita referencias entrantes.
- **Dependencias:** TASK-047, AUD-NG-011/078.
- **Estado:** Pendiente.

### F6-004-A04 - Integrar descubrimiento central con fetchApi y contratos versionados (existente ampliada)
- **Hallazgos:** H3, H4, H5.
- **Acción adicional:** resolver endpoint y estado desde el registro vigente; validar esquemas, parámetros, respuestas, errores y permisos; contrastar acciones de consumidores con dispatchers; detectar llamadas obsoletas y retirar contratos.
- **Criterios adicionales:** cambiar endpoint no requiere editar js/config.js; servicio retirado no recibe llamadas nuevas; todas las acciones usadas por UI están inventariadas y verificadas.
- **Dependencias:** AUD-NG-078/174.
- **Estado:** Pendiente.

### F6-004-A05 - Implementar diagnósticos reales y validación honesta de dependencias (existente ampliada)
- **Hallazgos:** H2, H5, H8.
- **Acción adicional:** comprobar endpoint, Spreadsheet, Drive, permisos y dependencias declaradas antes de activar; emitir estados diferenciados de listo, degradado, indisponible y configuración inválida.
- **Criterios adicionales:** ningún PASS constante; fallo de recurso bloquea activación; dependencias y capacidades afectadas se identifican.
- **Dependencias:** TAREA-F6-009, AUD-NG-011.
- **Estado:** Pendiente.

### F6-004-A06 - Probar compatibilidad, aislamiento y tolerancia a fallos (existente ampliada)
- **Hallazgos:** H3, H4, H5, H8, H9.
- **Acción adicional:** probar cambios de endpoint/configuración, retirada, llamadas obsoletas, fallos de dependencia, dashboards y contratos en proyectos de prueba aislados.
- **Criterios adicionales:** pruebas HTTP/E2E reproducibles; errores no cuentan como PASS ni como lista vacía; no se modifican datos productivos.
- **Dependencias:** TAREA-F6-003-A09, AUD-NG-081/174.
- **Estado:** Pendiente.

### F6-007-A05 - Versionar plantillas e historial de cambios/despliegues (existente ampliada)
- **Hallazgos:** H1, H5.
- **Acción adicional:** versionar cambios de configuración por servicio, conservar valores anteriores, autor autenticado, fecha, motivo, versión y rollback.
- **Criterios adicionales:** toda modificación de endpoint, recurso, dependencia o permiso tiene historial recuperable.
- **Estado:** Pendiente.

### F6-008-A04 - Implementar multirol y responsabilidades con validación backend (existente ampliada)
- **Hallazgos:** H7.
- **Acción adicional:** sincronizar roles, áreas y coordinaciones autorizados desde un catálogo versionado común sin edición manual dispersa.
- **Criterios adicionales:** los servicios consumen cambios efectivos; los permisos no se elevan por datos del cliente; se registra propagación y revocación.
- **Estado:** Pendiente.

### F6-008-A05 - Crear dashboard del plano de control y probar independencia (existente ampliada)
- **Hallazgos:** H5, H6, H8.
- **Acción adicional:** incorporar consulta/edición de configuración, dependencias, versiones, historial, retiro y capacidades disponibles ante fallos.
- **Criterios adicionales:** el dashboard refleja datos del registro real y diferencia configuración inválida, indisponibilidad y datos vacíos.
- **Estado:** Pendiente.

### F6-009-A02 - Corregir monitor y dashboard de disponibilidad (existente ampliada)
- **Hallazgos:** H8.
- **Acción adicional:** propagar estado de dependencia y distinguir respuesta vacía legítima de timeout, error HTTP, permisos y fallback.
- **Estado:** Pendiente.

### F6-009-A06 - Implementar pruebas de diagnóstico y mapa de dependencias (existente ampliada)
- **Hallazgos:** H6, H8, H9.
- **Acción adicional:** validar la vista de dependencias y las capacidades disponibles cuando falle un componente; ejecutar pruebas aisladas y reproducibles.
- **Estado:** Pendiente.

## 6. Pruebas y límites

- **Ejecutadas:** inspección manual de las funciones y rangos indicados; contraste de SERVICE_URLS/SERVICE_REGISTRY/fetchApi; registro, validación, contratos, dispatcher, roles, UI, pruebas estructurales, historial de auditoría, SHAs, HEAD y blob de Pendientes.md.
- **No ejecutadas:** Apps Script runtime, OAuth, llamadas HTTP, despliegues, pruebas de permisos reales, navegador, operaciones Drive/Sheets, concurrencia y E2E.
- No se modificó código, configuración, tests ni datos productivos.

## 7. Cierre

- TAREA-F6-014: **NO CUMPLE**.
- La marca [X] en completadas.md se conserva como histórico.
- TAREA-F6-039 amplía el mismo alcance y comparte el bloque canónico de tareas; véase su informe individual.
- No se crean identificadores AUD-NG ni tareas correctivas duplicadas.
- Se actualizaron Auditoria.txt, MapaDependencias.md, AUDITORIA_COMPLETADAS_PLAN.md y Contexto_personal.txt.
- Siguiente auditoría secuencial: TAREA-F6-015 y TAREA-F6-040.

## 8. Referencias

- completadas.md SHA f57f1aef832e81e44fc4f7ec36a852d50e464676, F6-014 línea 2885 y F6-039 línea 3802.
- Pendientes.md blob SHA 631b4c2dbf0e86d5704b63625382d73ccb8ceb3c.
- ChangesLogs.txt SHA 5b5cff1926b73a05d1b92087a7bf4b2db75326ff, F6-014 líneas 2007-2012.
- backend/developer-service/Code.gs SHA 8aa4bac67cfe5c8c54da51a0784a56fef633e412.
- js/config.js SHA 49ef90807e5b9dfe1379f76d66efdb4ccd2b6cdc.
- js/api.js SHA 6b24f666db30a811a8e9b38d466fc6001cf6dfa9.
- USER SHA 12079dd410aa6d8afbce55a4bc62a79dea605f9f; ACADEMIC SHA df87a2eea9f0ef79d0b966d03fd5bbe432003df5; ACCOUNTING SHA 38b979d41596b85e8884b7060b37bbac0840a28; TASK SHA 1437756a3c3d3d97e06bc1ff21c8e2ca2b2dccbe; EXAM SHA 1d93296628fae31f680004f637897e2b1314a64c.
- developer-dashboard.html SHA 2b69f1bf7ffbbe4902e81de14d6315cedb035a1e; js/developer.js SHA 6fa4c4bd9be580c974b1fbede4f0cf79485dc331.
- AUD-NG-011/077/078/081/158/174 y tareas canónicas F6-004/F6-007/F6-008/F6-009.
