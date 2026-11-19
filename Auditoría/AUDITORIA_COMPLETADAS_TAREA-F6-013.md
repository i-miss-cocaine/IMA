# AUDITORÍA TÉCNICA - TAREA-F6-013: Despliegues versionados, migraciones y reversión controlada

- **Sesión:** IMA-AUDIT-20261107-2111Z-01 | **Checkpoint inicial:** C1.229 | **Rama:** NG_beta_0.0.0.1_work
- **HEAD de partida:** 27ad5d7e6f6b1f3c8bcf774cb6c93a7eea5fc2c9 | **Fecha:** 2026-11-07
- **Estado en completadas.md:** [X] (se conserva como dato histórico)
- **Dictamen:** **NO CUMPLE**
- **Ampliación:** TAREA-F6-038; informe individual: AUDITORIAS/AUDITORIA_COMPLETADAS_TAREA-F6-038.md.

## 1. Fuentes y continuidad

- completadas.md SHA f57f1aef832e81e44fc4f7ec36a852d50e464676: F6-013 [X], líneas 2856-2880; F6-038 [X], líneas 3774-3798.
- ChangesLogs.txt SHA 5b5cff1926b73a05d1b92087a7bf4b2db75326ff: F6-013 líneas 2002-2005; F6-038 líneas 2185-2189. Ambos registros afirman versionado/rollback, pero el código no realiza esas operaciones.
- Pendientes.md: lectura ordinaria devuelve 0 caracteres; blob de la rama de trabajo SHA 631b4c2dbf0e86d5704b63625382d73ccb8ceb3c recuperado y validado: 1.803.672 bytes, 1.782.094 caracteres, 20.182 líneas, sin U+FFFD. F6-013/F6-038 no aparecen. No se modificó ni restauró.
- Los informes individuales F6-013/F6-038 no existían en el árbol ni en el historial de esta rama (consulta de historial por ruta sin commits).
- Informes relacionados existentes: F6-007 y F6-032. F6-007-A01/A02/A05/A06 permanecen pendientes y cubren aprovisionamiento real, máquina de estados/rollback, versionado e historial de plantillas y dashboard/pruebas. Se conservan como dependencias, sin duplicar sus IDs.
- Rama base NG_beta_0.0.0.1 HEAD 44d9891132332e692dbe2ba8602b41f50a508a59; rama de trabajo 297 commits adelante y 0 atrás al inicio.

## 2. Archivos inspeccionados y respaldos

| Archivo | SHA | Rango/elementos revisados |
|---|---|---|
| backend/developer-service/Code.gs | 8aa4bac67cfe5c8c54da51a0784a56fef633e412 | cabecera/doGet 1-16; ROLE_PERMISSIONS/doPost 23-207; recordProvisioningHistory 1286-1302; provisionRoleSpreadsheet 1304-1348; migrateSpreadsheetSchema 1430-1474; validateMonolithDecompositionContracts 1799-1885; validateStagedMigrationProgress 1967-2037; suites 2040-2206; catálogo/validación de dependencias 2262-2305; changelog/rollback 2308-2350; registry/registro/estado 2415-2585 |
| backend/academic-service/Code.gs | df87a2eea9f0ef79d0b966d03fd5bbe432003df5 | cabecera/doGet 1-162; dispatcher 671-907; executeCurricularMigration 3130-3165; validateApiContractsTestSuite 3915-3958; deployAcademicMicroserviceInstance 4494-4560; getAcademicMicroserviceDeployments 4650-4680; verifyBackupIntegrity 12347-12395; restoreSystemBackup 12406-12461; reconcileRestoredDataIntegrity 12463-12512 |
| backend/accounting-service/Code.gs | 38b979d41596b85e8884b7060b37bbac0840a28 | cabecera/doGet 1-193; evaluateTransactionalStorageMigrationNeed 10304-10350 |
| backend/user-service/Code.gs | 12079dd410aa6d8afbce55a4bc62a79dea605f9f | cabecera/doGet 1-917 |
| backend/task-service/Code.gs | 1437756a3c3d3d97e06bc1ff21c8e2ca2b2dccbe | cabecera/doGet 1-75 |
| backend/exam-service/Code.gs | 1d93296628fae31f680004f637897e2b1314a64c | cabecera/doGet 1-64 |
| js/config.js | 49ef90807e5b9dfe1379f76d66efdb4ccd2b6cdc | instrucciones/URLs/registry/descriptor 213-340 |
| js/api.js | 6b24f666db30a811a8e9b38d466fc6001cf6dfa9 | fetchApi 1-100; resolución por SERVICE_URLS |
| js/developer.js | 6fa4c4bd9be580c974b1fbede4f0cf79485dc331 | 1-552; no contiene integración de changelog, migración ni rollback |
| developer-dashboard.html | 2b69f1bf7ffbbe4902e81de14d6315cedb035a1e | 1-481; no contiene UI de versionado/rollback |
| tests/regression/academic-grading-suite.js | a22cb3ef376fe09e65c1b17c2f4f5125290bfba6 | 1-412; no hay casos F6-013/F6-038 |
| tests/regression/modular-dashboard-suite.js | 0495e1d526a872c33310935a003a83d924d34683 | 1-61; comprobaciones estructurales, no pruebas de despliegue/migración |
| js/config.js y manifest.json | SHA indicados arriba / 0caa5febfbd7fdbb88e9d174fa6623fb7daebb4e | SERVICE_URLS/SERVICE_REGISTRY; manifest PWA |
| docs/architecture/staged-migration-procedure.md | 2b46af3095596fcd7a9744e4cc500b50b38a34f0 | procedimiento estático de migración/rollback |
| docs/architecture/spreadsheets-schema.md | 0c8d5c4c2976d4b64949c693e66395896ce16246 | inventario fechado 2025-05-24, sin control de versiones ni migraciones ejecutables |

El árbol no contiene appsscript.json, .clasp.json ni workflows CI/CD. El único manifest.json es el manifiesto PWA.

## 3. Hallazgos técnicos

### H1 - CRÍTICO/P0: no existe una versión efectiva y coherente por microservicio
Las cabeceras declaran USER v8.2.0 (USER:1-4), ACADEMIC v8.4.0 (ACADEMIC:1-4), ACCOUNTING v8.0.0 (ACCOUNTING:1-4) y DEVELOPER v8.4.0 (DEVELOPER:1-4); TASK y EXAM no declaran versión de código. Los doGet de los seis servicios no exponen conjuntamente versión de código, esquema y configuración. js/config.js:224-242 contiene URLs y comentarios de versiones dispares; SERVICE_REGISTRY:245-315 declara v8.4.0/ACTIVE para todos y recursos de ejemplo. El catálogo backend getCentralConfigAndContractCatalog:2262-2285 también declara v8.4.0 para todos. No se consulta un deployment activo ni un identificador de artefacto. CA-066 no queda acreditado.

### H2 - ALTO/P1: changelog estático y sin contrato de compatibilidad real
getServiceVersionChangelog:2308-2322 ignora la versión desplegada y devuelve la misma lista v8.4.0/v2.1 y v8.3.0/v2.0 para cualquier serviceId. No consulta historial persistente, deploymentId, commit, configuración, versión mínima de cliente ni cambios incompatibles. getCentralConfigAndContractCatalog:2262-2285 solo enumera una selección de acciones y versión; no contiene esquemas de entrada/salida, códigos de error, permisos ni compatibilidad entre versiones. validateMonolithDecompositionContracts:1799-1885 puede considerar válida una acción porque el payload la incluye en validContracts. CA-067 de contratos/versionado y compatibilidad no se cumple.

### H3 - CRÍTICO/P0: migración de esquema puede devolver éxito sin ejecutar ni validar la migración
migrateSpreadsheetSchema:1430-1474 captura y omite errores al abrir SpreadsheetApp; si activeSS queda null, no ejecuta cambios y aun así registra una respuesta status success con nonDestructiveMigrationVerified=true. Solo inserta hojas inexistentes; no compara encabezados/esquema existente, no valida versión origen/destino, no previsualiza filas/relaciones, no verifica restricciones ni registra un ledger persistente. La reejecución evita insertar una hoja que ya exista, pero no demuestra idempotencia de datos ni compatibilidad. recordProvisioningHistory:1286-1302 solo construye y devuelve un objeto; no escribe historial. CA-067 y CA-123/124 no se cumplen.

### H4 - CRÍTICO/P0: rollback es una respuesta sintética, no una reversión
executeServiceVersionRollback:2325-2350 solo valida serviceId, targetVersion y el texto ROLLBACK-CONFIRMED. No valida que targetVersion exista ni que sea compatible; no consulta artefactos previos, no cambia deployment/código, no restaura esquema ni datos, no crea snapshot, no ejecuta compensaciones ni pruebas posteriores. Devuelve codeRestored=true, schemaRestored=true y dataIntegrityVerified=true sin ejecutar esas operaciones; executedBy procede del payload o de un valor por defecto. validateStagedMigrationProgress:1967-2037 devuelve rollbackProcedureReady=true de forma incondicional. CA-069 y CA-127 no se cumplen.

### H5 - CRÍTICO/P0: despliegue académico solo registra metadatos y marca Activo
deployAcademicMicroserviceInstance:4494-4560 no crea proyecto Apps Script ni deployment, no publica código ni genera URL/deploymentId. scriptId y driveFolderId pueden quedar vacíos; spreadsheetId usa SPREADSHEET_ID compartido por defecto; connectivityCheck es PASS constante y finalState siempre Activo. Sobrescribe la fila existente y luego registra la extensión curricular, sin una transacción que revierta el estado si falla el segundo paso. getAcademicMicroserviceDeployments:4650-4680 solo lee esos metadatos. registerServiceInstance:2479-2527 también permite endpoint vacío, Spreadsheet por defecto y permisos ["*"], y marca Activo. CA-068, CA-122, CA-125 y CA-126 no se cumplen.

### H6 - ALTO/P1: validación de dependencias y pruebas post-despliegue producen falsos positivos
validateServiceConfigDependencies:2286-2305 calcula Boolean(spreadsheetId || true) y Boolean(driveFolderId || true), expresiones siempre verdaderas; permissionsCheck queda en PASS y obsoleteCallsDetected en 0 sin comprobar recursos. validateStagedMigrationProgress:1967-2037 considera etapas completas por la existencia/respuesta de catálogos y suites, no por deployments o pruebas HTTP. runModularAndDynamicDashboardsRegressionSuite:2040-2114 comprueba catálogo, token inválido y diagnóstico local; runFullArchitectureIntegrationAndPerformanceSuite:2132-2206 comprueba respuestas internas y resultados simulados. validateApiContractsTestSuite en ACADEMIC:3915-3958 cubre cuatro acciones locales y cuenta status:error como PASS si tiene las claves requeridas. No hay pruebas reales post-deployment ni de aislamiento entre versiones.

### H7 - CRÍTICO/P0: las migraciones/restauraciones no acreditan integridad referencial ni preservación de relaciones
executeCurricularMigration:3130-3165 recibe equivalenciasMap, planOrigenId y planDestinoId, pero no utiliza el mapa ni modifica datos. Reporta modificacionesEfectuadas=0 y devuelve success también en modo real. evaluateTransactionalStorageMigrationNeed en ACCOUNTING:10304-10350 solo recomienda migrar según filas/latencia. La dependencia declarada reconcileRestoredDataIntegrity:12463-12512 inspecciona únicamente CalificacionesEstudiantes e HistorialAcademico; inicializa reconciliacionCompletada=true, no valida asignaciones de roles, docentes, relaciones familiares, documentos ni referencias entre servicios y no se invoca desde restoreSystemBackup. verifyBackupIntegrity:12347-12395 acepta el checksum si coincide o si cualquier checksum no vacío está presente (storedChecksum === computedChecksum || Boolean(storedChecksum)). El informe F6-011 ya registra esos defectos y sus tareas F6-011-A01/A04; aquí se amplían como dependencia crítica de rollback/migración, sin duplicar tareas. CA-128 y CA-167 no se cumplen.

### H8 - ALTO/P1: no hay auditoría de impacto ni flujo de despliegue integrado al dashboard
js/config.js:213-242 instruye crear proyectos Apps Script y pegar URLs manualmente; SERVICE_REGISTRY contiene versiones y recursos estáticos. js/api.js:11-48 enruta por SERVICE_URLS, sin handshake de versión o compatibilidad. developer.js y developer-dashboard.html no contienen acciones de changelog, migración o rollback. docs/architecture/staged-migration-procedure.md describe un procedimiento manual con ROLLBACK-CONFIRMED, pero no constituye ejecución. No se genera una matriz de funciones, variables, endpoints, dashboards y dependencias afectadas antes de cada despliegue. CA-166 no se cumple.

## 4. Matriz de aceptación F6-013

| Criterio | Dictamen | Evidencia |
|---|---|---|
| CA-066: cada microservicio declara y expone versión de código y esquema | No cumple | cabeceras parciales, doGet sin versiones y registry estático |
| CA-067: migraciones idempotentes sin duplicar estructuras/registros | No cumple | migración solo crea hojas faltantes, sin ledger ni validación; historial sintético |
| CA-068: actualizar una instancia no altera las demás ni desconecta consumidores | No cumple | no hay despliegue independiente; configuración estática y recursos compartidos |
| CA-069: rollback probado para código, esquema y datos | No cumple | executeServiceVersionRollback solo devuelve flags success |

## 5. Reconciliación con auditorías existentes

No se crean IDs globales AUD-NG duplicados:
- AUD-NG-011: evidencia de despliegue/aislamiento real y recursos por servicio; se amplía.
- AUD-NG-077: disponibilidad, permisos, schemaVersion, compatibilidad e historial de fuentes; se amplía.
- AUD-NG-078: metadatos verificados, proyecto/deployment, versión de contrato y permisos; se amplía.
- AUD-NG-081: pruebas funcionales en servicios/cuentas aisladas; se amplía.
- AUD-NG-174: contrato API versionado, validación y compatibilidad; se amplía.
- F6-007-A01/A02/A05/A06: aprovisionamiento, estados/rollback, versionado/historial y dashboard/pruebas; dependencias pendientes existentes. No se duplican sus IDs.

## 6. Tareas ejecutables derivadas de los hallazgos

Estas tareas son locales a F6-013; F6-038 amplía los mismos IDs y criterios. Todas quedan Pendientes.

### F6-013-A01 - Establecer registro verificable de versiones por microservicio
- **Origen/severidad:** H1; Alto/P1.
- **Objetivo/acción:** mantener versiones separadas de código, esquema y configuración por servicio/instancia; registrar commit/artefacto, deploymentId, fecha y versión activa; exponerlas en health/ping y errores.
- **Archivos:** backend/developer-service/Code.gs; backend/*/Code.gs; js/config.js; CatalogoServicios y registro de despliegues.
- **Dependencias/riesgos:** Apps Script deployments, versiones de plantilla, schemaVersion, configuración y clientes existentes.
- **Alcance:** metadatos verificados, sin inferir versión desde un comentario o payload.
- **Aceptación:** cada servicio devuelve sus tres versiones y deployment activo; el catálogo coincide con el runtime; versiones ausentes/inconsistentes fallan cerradas; historial conserva valores anteriores.
- **Prioridad/estado:** P1 / Pendiente. **Cierre:** pendiente de implementación y pruebas.

### F6-013-A02 - Versionar contratos API y aplicar compatibilidad entre cliente/servicio
- **Origen/severidad:** H2/H6; Alto/P1.
- **Objetivo/acción:** definir esquemas de request/response/error por acción, versiones soportadas, compatibilidad hacia atrás, deprecaciones y handshake cliente-servidor; contrastar catálogo contra dispatchers reales.
- **Archivos:** backend/developer-service/Code.gs; dispatchers backend/*; js/api.js; js/config.js; tests/regression.
- **Dependencias/riesgos:** AUD-NG-174, endpoints activos, clientes antiguos y cambios incompatibles.
- **Alcance:** no aceptar contratos declarados por el cliente como prueba de implementación.
- **Aceptación:** acciones, parámetros, respuestas, errores y permisos se validan por versión; consumidor incompatible recibe error explícito; pruebas cubren versiones soportadas y obsoletas.
- **Prioridad/estado:** P1 / Pendiente.

### F6-013-A03 - Implementar motor de migración de esquema idempotente y auditable
- **Origen/severidad:** H3; Crítico/P0.
- **Objetivo/acción:** prevalidar versión origen/destino, tablas, encabezados, restricciones y permisos; ejecutar migraciones numeradas con ledger persistente, lock, checksum y estado por paso; fallar si el recurso no abre o el esquema no coincide.
- **Archivos:** backend/developer-service/Code.gs; backend/*/Code.gs; hojas de control de migraciones y pruebas.
- **Dependencias/riesgos:** Apps Script/Sheets, cuotas, concurrencia, esquemas históricos y respaldo.
- **Alcance:** ninguna migración productiva durante la auditoría; desarrollo posterior en entorno aislado.
- **Aceptación:** dry-run no escribe; reejecución no duplica hojas, columnas ni filas; esquema incompatible bloquea; fallo parcial deja estado recuperable y log persistente; no se informa success sin ejecución.
- **Prioridad/estado:** P0 / Pendiente.

### F6-013-A04 - Migrar datos preservando relaciones e integridad referencial
- **Origen/severidad:** H7; Crítico/P0.
- **Objetivo/acción:** definir mapeos explícitos, snapshots, reconciliación antes/después y compensación; preservar Persona-Cuenta-Roles-Ámbitos, asignaciones docentes, relaciones académicas, IDs y referencias cruzadas.
- **Archivos:** backend/user-service/Code.gs; academic-service/Code.gs; accounting-service/Code.gs; task-service/Code.gs; exam-service/Code.gs; backup/reconciliation.
- **Dependencias/riesgos:** F6-011-A01..A06, relaciones entre servicios, claves históricas y cambios de esquema.
- **Alcance:** no borrar ni transformar datos productivos sin aprobación y respaldo verificado.
- **Aceptación:** conteos/checksums y relaciones coinciden según mapeo; huérfanos/duplicados bloquean; rollback restaura snapshot; auditoría conserva origen/destino y actor.
- **Prioridad/estado:** P0 / Pendiente.

### F6-013-A05 - Crear auditoría de impacto previa a cada despliegue
- **Origen/severidad:** H8; Alto/P1.
- **Objetivo/acción:** comparar artefactos y contratos, mapear funciones/variables/endpoints/dashboards/consumidores/dependencias y emitir plan de migración, riesgos y aprobación previa.
- **Archivos:** backend/developer-service/Code.gs; AUDITORIAS/MapaDependencias.md; docs/architecture; developer-dashboard.html y js/developer.js.
- **Dependencias/riesgos:** inventario real del repositorio, contratos versionados y trazabilidad de cambios.
- **Alcance:** no sustituir revisión manual ni aprobar automáticamente un despliegue.
- **Aceptación:** cada release conserva informe de impacto con diff, dependencias, breaking changes, consumidores, pruebas y decisión; ausencia de informe bloquea activación.
- **Prioridad/estado:** P1 / Pendiente.

### F6-013-A06 - Implementar rollback real de código, esquema y datos
- **Origen/severidad:** H4/H7; Crítico/P0.
- **Objetivo/acción:** resolver artefacto/versiones existentes; desplegar versión previa; revertir migraciones mediante estrategia compensatoria o snapshot; verificar integridad y salud; registrar cada paso y resultado real.
- **Archivos:** backend/developer-service/Code.gs; backend/*/Code.gs; Apps Script deployments; almacenamiento de respaldos y migraciones.
- **Dependencias/riesgos:** F6-007-A02, F6-007-A05, F6-011-A01..A04 y F6-013-A03/A04.
- **Alcance:** confirmación explícita no reemplaza autorización, validación de destino ni pruebas.
- **Aceptación:** targetVersion existe y pertenece al servicio; rollback afecta solo el servicio objetivo; código/esquema/datos quedan en versión consistente; fallo de rollback se declara error y conserva diagnóstico; prueba aislada demuestra restauración y preservación de relaciones.
- **Prioridad/estado:** P0 / Pendiente.

### F6-013-A07 - Implementar despliegue aislado y verificación post-despliegue
- **Origen/severidad:** H5/H6; Crítico/P0.
- **Objetivo/acción:** desplegar una instancia sin modificar las demás; mantener estados Registrado/Preparando/Validando/Activo/Fallido/Rollback; ejecutar health, contrato, permisos, Sheets/Drive y regresión antes de activar; asociar errores a versión activa.
- **Archivos:** backend/developer-service/Code.gs; backend/*/Code.gs; js/api.js; js/config.js; developer-dashboard.html; js/developer.js; tests/regression.
- **Dependencias/riesgos:** F6-007-A01/A02/A06, F6-013-A01/A02/A05/A06 y entorno aislado.
- **Alcance:** no declarar despliegues productivos ni activar una instancia por respuesta sintética.
- **Aceptación:** despliegue fallido nunca queda Activo; cada instancia identifica versión y error; consumidores compatibles siguen operando; una actualización no cambia otra instancia; pruebas HTTP/E2E reales y evidencia de rollback.
- **Prioridad/estado:** P0 / Pendiente.

## 7. Pruebas y límites

- **Ejecutadas:** inspección manual de funciones y dispatchers citados; comparación de versiones de cabeceras/configuración/registry; revisión de migración, changelog, rollback, deployment, contratos, pruebas, documentación, tree, SHAs e historial de informes.
- **No ejecutadas:** Apps Script runtime, Apps Script API/OAuth, despliegues, HTTP, navegador, cambios de esquema, migraciones, snapshots, rollback, concurrencia, Drive/Sheets productivas ni suites automatizadas.
- No se ejecutaron funciones que escriban en producción; no se modificaron datos ni código.

## 8. Cierre

- TAREA-F6-013: **NO CUMPLE**; [X] en completadas.md preservado como histórico.
- TAREA-F6-038: **NO CUMPLE**; comparte este bloque canónico F6-013-A01..A07.
- Se amplían AUD-NG-011/077/078/081/174; no se crean IDs globales duplicados.
- Sin cambios en backend, js, HTML, tests, completadas.md, Pendientes.md, ChangesLogs.txt, metodología, README, manifest.json ni rama base.
- Siguiente auditoría secuencial: TAREA-F6-014 y TAREA-F6-039, centralización de configuración y dependencias sin centralizar todos los datos.

## 9. Referencias

completadas.md SHA f57f1aef832e81e44fc4f7ec36a852d50e464676; Pendientes.md blob SHA 631b4c2dbf0e86d5704b63625382d73ccb8ceb3c; ChangesLogs.txt SHA 5b5cff1926b73a05d1b92087a7bf4b2db75326ff. Los SHAs y rangos de los archivos inspeccionados se detallan en la sección 2.
