# AUDITORÍA TÉCNICA - TAREA-F6-038: Despliegues versionados, migraciones y reversión controlada (alcance ampliado)

- **Sesión:** IMA-AUDIT-20261107-2111Z-01 | **Checkpoint inicial:** C1.229 | **Rama:** NG_beta_0.0.0.1_work
- **HEAD de partida:** 27ad5d7e6f6b1f3c8bcf774cb6c93a7eea5fc2c9 | **Fecha:** 2026-11-07
- **Estado en completadas.md:** [X] (se conserva como dato histórico)
- **Dictamen:** **NO CUMPLE**
- **Informe base:** AUDITORIAS/AUDITORIA_COMPLETADAS_TAREA-F6-013.md
- **Relación:** F6-038 amplía F6-013 con CA-121..CA-128 y CA-166..CA-167; comparte el bloque canónico F6-013-A01..A07.

## 1. Fuentes

- completadas.md SHA f57f1aef832e81e44fc4f7ec36a852d50e464676: F6-038 [X], líneas 3774-3798.
- ChangesLogs.txt SHA 5b5cff1926b73a05d1b92087a7bf4b2db75326ff: líneas 2185-2189; describe getServiceVersionChangelog/executeServiceVersionRollback como versionado y rollback realizados, pero el código solo devuelve metadatos/flags.
- Pendientes.md lectura ordinaria 0 caracteres; blob SHA 631b4c2dbf0e86d5704b63625382d73ccb8ceb3c: 1.803.672 bytes, 1.782.094 caracteres, 20.182 líneas, sin U+FFFD; F6-013/F6-038 no aparecen.
- No existía informe individual F6-038 en árbol ni historial de la rama.
- El informe F6-013 contiene evidencia detallada, SHAs, funciones y tareas canónicas.

## 2. Matriz de aceptación ampliada

| Criterio | Dictamen | Evidencia |
|---|---|---|
| CA-121: cada servicio identifica versión de código y esquema | No cumple | versiones en comentarios no uniformes; doGet no expone código/esquema/config; registry declara v8.4.0 para todos |
| CA-122: despliegue fallido no se registra como satisfactorio | No cumple | deployAcademicMicroserviceInstance fija PASS/Activo; rollback también devuelve success sintético |
| CA-123: migraciones validan alcance antes de modificar datos | No cumple | migrateSpreadsheetSchema no valida versión/headers/alcance y omite error de apertura |
| CA-124: repetir migración no duplica registros/estructuras | Parcial | evita crear una hoja si ya existe, pero no hay ledger, control de filas/columnas ni idempotencia de datos |
| CA-125: actualizar una instancia no altera otras | No cumple | no hay despliegue real aislado; registry/configuración y almacenamiento tienen defaults compartidos |
| CA-126: se identifica versión activa cuando ocurre un error | No cumple | errores y doGet no incluyen versión/deployment; currentVersion es constante |
| CA-127: procedimiento probado para recuperar servicio tras fallo | No cumple | rollback no opera y no hay prueba dinámica |
| CA-128: actualizaciones conservan permisos y relaciones | No cumple | no se verifica ACL/roles ni referencias durante migración; executeCurricularMigration no aplica equivalencias |
| CA-166: auditoría de impacto sobre funciones, variables, endpoints, dashboards y dependencias | No cumple | no hay informe/gate de impacto ligado al despliegue |
| CA-167: migraciones preservan roles, relaciones académicas y referencias entre servicios | No cumple | no hay migración transaccional/reconciliación integral; no se prueban relaciones |

## 3. Hallazgos ampliados

1. **Versiones divergentes:** USER v8.2.0, ACADEMIC v8.4.0, ACCOUNTING v8.0.0 y DEVELOPER v8.4.0; TASK/EXAM no declaran versión. SERVICE_REGISTRY y catálogo backend afirman v8.4.0 de forma uniforme.
2. **Registro insuficiente:** no existe una versión efectiva por instancia que enlace código, esquema, configuración, commit y deploymentId.
3. **Migración incompleta:** la función solo inserta hojas ausentes y puede reportar éxito sin abrir el recurso; no aplica un plan de datos ni conserva un ledger.
4. **Rollback nominal:** el handler devuelve flags verdaderos sin restaurar código, esquema ni datos.
5. **Preservación de relaciones no demostrada:** no hay snapshot/reconciliación obligatoria por release; reconcileRestoredDataIntegrity solo examina dos hojas, declara reconciliacionCompletada=true y no se invoca desde restoreSystemBackup. verifyBackupIntegrity acepta cualquier checksum no vacío; F6-011-A01/A04 ya contienen el trabajo correctivo, que se mantiene como dependencia. El migrador curricular no usa equivalenciasMap y no modifica datos.
6. **Pruebas falsas/insuficientes:** las suites inspeccionadas no hacen despliegue HTTP ni rollback; algunas validaciones cuentan status:error como PASS.
7. **Impacto previo ausente:** no se compara el cambio con funciones, variables, endpoints, dashboards y dependencias antes de desplegar.

## 4. Reconciliación

Se amplían sin crear IDs globales duplicados:
- AUD-NG-011: despliegues aislados y recursos por servicio.
- AUD-NG-077: compatibilidad e historial de schemaVersion.
- AUD-NG-078: versión de contrato y deployment verificados.
- AUD-NG-081: pruebas funcionales aisladas.
- AUD-NG-174: contratos API versionados y compatibilidad.
- F6-007-A01/A02/A05/A06: dependencias previas de despliegue, estados/rollback, versionado/historial y pruebas/dashboard.

## 5. Tareas ejecutables derivadas de los hallazgos

Se reutiliza íntegramente el bloque canónico **F6-013-A01..A07** de AUDITORIAS/AUDITORIA_COMPLETADAS_TAREA-F6-013.md, sin crear IDs duplicados. La ampliación F6-038 agrega los criterios CA-121..CA-128 y CA-166..CA-167 a las mismas tareas:
1. F6-013-A01: registro verificable de versiones de código, esquema y configuración por servicio.
2. F6-013-A02: contratos API versionados y compatibilidad cliente/servicio.
3. F6-013-A03: migraciones de esquema prevalidables, idempotentes y con ledger.
4. F6-013-A04: migraciones de datos con preservación de roles, relaciones académicas y referencias.
5. F6-013-A05: auditoría de impacto previa al despliegue.
6. F6-013-A06: rollback real de código, esquema y datos.
7. F6-013-A07: despliegue aislado, estados verificables y pruebas post-despliegue.

Todas permanecen Pendientes. Las marcas [X] históricas no se interpretan como aceptación funcional.

## 6. Pruebas y límites

- **Ejecutadas:** inspección manual de criterios ampliados, versiones de servicios, catálogo, migración, rollback, deploy, validadores, dashboard, tests y documentación; revisión de SHAs e historial.
- **No ejecutadas:** Apps Script API, OAuth, despliegues, HTTP, migraciones, rollback, navegador, Drive/Sheets productivas, concurrencia ni E2E.
- No se afirma que los criterios CA-121..CA-128 o CA-166..CA-167 hayan pasado pruebas dinámicas.

## 7. Cierre

- TAREA-F6-038: **NO CUMPLE**.
- Se conserva [X] en completadas.md como dato histórico.
- Bloque canónico compartido: F6-013-A01..A07.
- Siguiente auditoría: TAREA-F6-014 y TAREA-F6-039.
