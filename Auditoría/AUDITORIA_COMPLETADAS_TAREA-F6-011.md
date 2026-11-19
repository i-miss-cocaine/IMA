# AUDITORÍA TÉCNICA - TAREA-F6-011: Respaldos independientes y recuperación por área

**Fecha:** 2026-11-07  
**Repositorio:** i-miss-cocaine/IMA  
**Rama:** NG_beta_0.0.0.1_work  
**Checkpoint inicial:** C1.227  
**Checkpoint de cierre:** C1.228  
**Sesión:** IMA-AUDIT-20261107-2039Z-01  
**Dictamen:** **NO CUMPLE**  
**Estado histórico en completadas.md:** [X] (se conserva sin modificación).

TAREA-F6-036 repite el objetivo y amplía el alcance con almacenamiento aislado, control de capacidad, simulación de restauración y conservación de relaciones. Su auditoría individual se documenta en AUDITORIAS/AUDITORIA_COMPLETADAS_TAREA-F6-036.md. Ambos informes reutilizan un único bloque canónico F6-011-A01..A06.

## 1. Continuidad y fuentes

- HEAD inicial: 8c5ac21347def05c729a9eb498f90152fe1ec968 (C1.227), rama NG_beta_0.0.0.1_work.
- Rama base NG_beta_0.0.0.1: 44d9891132332e692dbe2ba8602b41f50a508a59. Comparación: 295 commits adelante, 0 detrás. Rama base intacta.
- Checkpoint anterior: C1.227, commit audit(C1.227): audit F6-010 and F6-035 logs commands.
- completadas.md SHA f57f1aef832e81e44fc4f7ec36a852d50e464676: F6-011 [X], líneas 2798-2820, CA-058..CA-061; F6-036 [X], líneas 3705-3732, CA-103..CA-112/CA-160.
- Pendientes.md devuelve 0 caracteres por lectura convencional. Blob del mismo HEAD: SHA 631b4c2dbf0e86d5704b63625382d73ccb8ceb3c; 1.803.672 bytes, 1.782.094 caracteres, 20.182 líneas, sin U+FFFD. AUD-NG-146 permanece [ ] Pendiente. No se modificó.
- ChangesLogs.txt SHA 5b5cff1926b73a05d1b92087a7bf4b2db75326ff: F6-011 líneas 1993-1997 afirma SHA-256 y confirmación; F6-036 líneas 2174-2177 afirma backup aislado y checksum SHA-256. El código contradice esas afirmaciones.
- No existían los informes individuales F6-011/F6-036; se crean.
- Antecedentes: AUD-NG-146 (Crítico) y AUD-NG-011; se amplían sin crear IDs globales duplicados.

## 2. Archivos inspeccionados y SHAs de respaldo

| Archivo | SHA | Evidencia |
|---|---|---|
| backend/academic-service/Code.gs | df87a2eea9f0ef79d0b966d03fd5bbe432003df5 | ROLE_PERMISSIONS 165-190; dispatcher 690-715; previewBackupRestoreImpact 3174-3220; computeSimpleHash/getBackupFolder/createSystemBackup 12245-12320; listSystemBackups 12321-12346; verifyBackupIntegrity 12347-12405; restoreSystemBackup 12406-12462; reconcileRestoredDataIntegrity 12463-12504 |
| backend/user-service/Code.gs | 12079dd410aa6d8afbce55a4bc62a79dea605f9f | getAuditReport 8315-8370; no handlers createSpreadsheetBackup/getBackupsList/restoreSpreadsheetBackup |
| backend/developer-service/Code.gs | 8aa4bac67cfe5c8c54da51a0784a56fef633e412 | dispatcher y catálogo de comandos; no handlers backup/restore |
| backend/accounting-service/Code.gs | 38b979d41596b85e888b4a7060b37bbac0840a28 | no funciones createSystemBackup/restoreSystemBackup/createSpreadsheetBackup |
| js/teacher.js | c475fce5afcd28fca23e7b64398ad32b17773746 | previewAndVerifyBackupRestore 2170-2190; gestor 2680-2800 |
| js/developer.js | 6fa4c4bd9be580c974b1fbede4f0cf79485dc331 | load/render 306-389; handlers 391-480 |
| js/api.js | 6b24f666db30a811a8e9b38d466fc6001cf6dfa9 | wrappers 285-310 |
| developer-dashboard.html | 2b69f1bf7ffbbe4902e81de14d6315cedb035a1e | sección 330-365 |
| tests/regression/academic-grading-suite.js | a22cb3ef376fe09e65c1b17c2f4f5125290bfba6 | sin casos de backup/restore |

No se modificaron archivos durante la inspección ni se ejecutaron operaciones sobre Drive/Sheets productivas.

## 3. Hallazgos

### H1 - CRÍTICO/P0: checksum no criptográfico y validación que acepta datos alterados
computeSimpleHash (12254-12262) usa un acumulador aritmético de 32 bits y devuelve HASH- más un valor hexadecimal; no calcula SHA-256. createSystemBackup persiste ese valor. verifyBackupIntegrity (12347-12405) usa la condición storedChecksum === computedChecksum || Boolean(storedChecksum), por lo que cualquier checksum no vacío se acepta aunque no coincida. Las hojas esenciales faltantes se detectan, pero los enlaces Drive rotos solo se contabilizan y no invalidan el backup.
**Impacto:** una copia alterada puede aprobar la validación. CA-058/CA-060 no cumplen.

### H2 - CRÍTICO/P0: restore no verifica integridad ni compatibilidad antes de sobrescribir
restoreSystemBackup (12406-12462) solo comprueba parsed.sheets; no llama a verifyBackupIntegrity ni a previewBackupRestoreImpact. No valida metadata.spreadsheetId, servicio, área ni versión/esquema. Itera todas las hojas y ejecuta sheet.clear() antes de escribir. No usa LockService, staging, transacción ni rollback ante fallo parcial. La preservación de dos hojas de calificaciones no reconcilia el resto de relaciones.
**Impacto:** puede sobrescribir varias tablas con una copia corrupta o incompatible y dejar restauración parcial. CA-059/CA-060 no cumplen.

### H3 - CRÍTICO/P0: no hay backups independientes por microservicio
createSystemBackup no recibe serviceId/areaId y abre siempre el SPREADSHEET_ID global de ACADEMIC. Exporta todas las hojas de esa base. getBackupFolder (12265-12270) usa DriveApp.getRootFolder() y una carpeta global New Generation/Respaldos, sin ACL/carpeta por servicio. La metadata no identifica servicio, área, alcance ni versión de esquema. No incluye documentos Drive ni configuración externa. USER, DEVELOPER y ACCOUNTING carecen de handlers equivalentes.
**Impacto:** no existe restauración aislada por servicio y se mezclan datos. CA-058/CA-059/CA-103/CA-106 no cumplen.

### H4 - ALTO/P1: no existe catálogo central completo de respaldos
listSystemBackups (12321-12346) recorre archivos por prefijo y solo devuelve fileId, fileName, sizeBytes, createdDate y fileUrl. No devuelve checksum, serviceId/areaId, alcance, versión, estado de verificación/restauración ni resultado. No existe catálogo persistente; el listado es un recorrido de carpeta.
**Impacto:** no se puede determinar desde el dashboard qué servicio está protegido ni si la copia fue verificada. CA-104/CA-109 parciales.

### H5 - ALTO/P1: faltan programación, retención, rotación y capacidad
No se encontraron ScriptApp.newTrigger/timeBased ni programador de backups en ACADEMIC, USER, DEVELOPER o ACCOUNTING. No hay política específica de retención/rotación ni medición de acumulación/capacidad de copias. AUD-NG-146 ya documenta ausencia de triggers y retención incompleta; se confirma vigente.
**Impacto:** respaldos manuales sin recurrencia, retención ni alerta. CA-110/CA-111 no cumplen.

### H6 - ALTO/P1: preview no simula una restauración aislada ni bloquea todos los riesgos
previewBackupRestoreImpact (3174-3220) invoca el verificador con bypass de checksum; compara conteos de filas y cuatro hojas esenciales. No crea entorno aislado. brokenDriveLinksCount solo se informa y no invalida. No verifica relaciones de usuarios, tutores, documentos, matrículas, roles y áreas. previewAndVerifyBackupRestore es independiente y triggerRestoreSystemBackup no lo exige antes de restaurar.
**Impacto:** el preview no representa el impacto real ni garantiza recuperabilidad. CA-107/CA-108/CA-160 no cumplen.

### H7 - ALTO/P1: frontend y API no coinciden con los contratos de backend
restoreSystemBackup exige confirmed=true y confirmCode=RESTORE-CONFIRMED; teacher.js envía confirmationCode y omite ambos campos, por lo que el backend rechaza la restauración. js/api.js llama createSpreadsheetBackup, USER/getBackupsList y USER/restoreSpreadsheetBackup, funciones inexistentes en los servicios inspeccionados. developer.js muestra un backup ficticio EXITOSO si la lista está vacía y espera resp.backup.backupId/checksum, mientras ACADEMIC devuelve fileId/fileName/checksum en el nivel superior. El selector del dashboard solo ofrece USER y ACADEMIC. teacher.js espera createdTime/timestamp/checksum; listSystemBackups devuelve createdDate y no checksum.
**Impacto:** panel central desconectado, éxito ficticio y restore académico no funcional.

### H8 - ALTO/P1: reconciliación post-restore parcial y no obligatoria
reconcileRestoredDataIntegrity (12463-12504) solo inspecciona CalificacionesEstudiantes e HistorialAcademico; no comprueba usuarios, roles, áreas, tutores, ExpedientesEstudiantes, Matriculas, DocumentosEstudiante ni referencias Drive. Devuelve status success y reconciliacionCompletada=true aunque existan inconsistencias. restoreSystemBackup no la invoca.
**Impacto:** CA-061/CA-160 no cumplen.

### H9 - MEDIO/P2: ausencia de pruebas específicas y runbook reproducible
tests/regression/academic-grading-suite.js no contiene casos de checksum corrupto, preview, restore, reconciliación, triggers o retención. No se encontró runbook reproducible para recuperación aislada por servicio. No se ejecutaron pruebas reales contra Apps Script/Drive/Sheets.
**Impacto:** no existe evidencia reproducible para CA-108/CA-109/CA-112.

## 4. Matriz de requisitos

### TAREA-F6-011 (CA-058..CA-061)
| Criterio | Dictamen | Motivo |
|---|---|---|
| CA-058 backup aislado por microservicio con SHA-256 | No cumple | backup único ACADEMIC; hash aritmético de 32 bits. |
| CA-059 restore no altera otros servicios | No cumple | restaura todas las hojas del Spreadsheet global. |
| CA-060 copia corrupta rechazada antes de escribir | No cumple | checksum no vacío pasa y restore no verifica. |
| CA-061 relaciones referenciales conservadas | No cumple | reconciliación parcial, no obligatoria ni bloqueante. |

### TAREA-F6-036 (CA-103..CA-112/CA-160)
| Criterio | Dictamen | Motivo |
|---|---|---|
| CA-103 backup individual por microservicio | No cumple | sin serviceId/areaId ni handlers por servicio. |
| CA-104 ID/fecha/alcance/resultado | Parcial | Drive aporta ID/fecha/nombre; no catálogo con alcance/resultado. |
| CA-105 detectar copia incompleta/corrupta | Parcial | estructura/hojas esenciales; checksum bypass y enlaces rotos no invalidan. |
| CA-106 restore aislado | No cumple | target global sin aislamiento. |
| CA-107 preview y confirmación | Parcial | preview separado y payload de confirmación incompatible. |
| CA-108 simulación sin producción | No cumple | solo conteo de filas; no entorno de prueba. |
| CA-109 registrar resultado/verificaciones | Parcial | logs sin catálogo ni reconciliación integrada. |
| CA-110 retención/rotación | No cumple | sin política ni triggers. |
| CA-111 capacidad/acumulación | No cumple | no hay medición específica. |
| CA-112 procedimiento documentado | No cumple | no se encontró runbook reproducible. |
| CA-160 conservar relaciones de usuarios/roles/áreas/documentos | No cumple | reconciliación limitada a dos hojas y no bloqueante. |

## 5. Reconciliación con auditorías existentes

- AUD-NG-146 (Crítico): se amplía y confirma hash no criptográfico, bypass de integridad, restore UI roto, falta de triggers/retención y ausencia de pruebas. No se crea otro ID global.
- AUD-NG-011: aislamiento por servicio; backup sin serviceId/areaId ni almacenamiento separado.
- AUD-NG-086: eventos de backup registrados, pero sin catálogo completo ni reconciliación integrada.
- El antecedente REQ-EXP-019 ya documentó computeSimpleHash, Boolean(storedChecksum), restore sin verify y wrappers USER ausentes. La revisión actual confirma que siguen presentes en HEAD C1.227.
- F6-036 amplía F6-011; informes individuales, un solo bloque canónico.

## 6. Tareas ejecutables derivadas de los hallazgos

IDs locales únicos a esta auditoría. F6-036 referencia este bloque; no se duplican tareas.

### F6-011-A01 - Implementar SHA-256 real y manifiesto verificable
- **Hallazgo de origen:** H1/H4.
- **Severidad:** Crítico.
- **Objetivo:** detectar corrupción/alteración antes de restaurar.
- **Acción ejecutable:** reemplazar computeSimpleHash por SHA-256; generar manifiesto con servicio/área, spreadsheetId, versión de código/esquema/configuración, timestamp, alcance, tamaño y checksum; comparar estrictamente y rechazar datos ausentes/discrepantes.
- **Archivos/módulos afectados:** backend/academic-service/Code.gs; backend/developer-service/Code.gs; catálogo central; pruebas.
- **Dependencias y riesgos:** Utilities.computeDigest, formato JSON, compatibilidad histórica y propiedad del recurso.
- **Alcance:** creación/verificación de manifiestos; no migrar/restaurar copias antiguas sin validación.
- **Criterios de aceptación:** hash SHA-256 de 64 caracteres hexadecimales; alterar un byte invalida; checksum vacío/malformado/no coincidente se rechaza; catálogo refleja resultado real.
- **Prioridad:** P0. **Estado:** Pendiente. **Evidencia de cierre:** pendiente de implementación/pruebas/Code Review.

### F6-011-A02 - Provisionar backups y almacenamiento aislado por microservicio
- **Hallazgo de origen:** H3/H4.
- **Severidad:** Crítico.
- **Objetivo:** respaldar cada servicio/área sin mezclar datos ni permisos.
- **Acción ejecutable:** incorporar serviceId/areaId y alcance; provisionar carpetas/recursos con ACL propios; respaldar Sheets, documentos Drive y configuración/metadatos; persistir catálogo central.
- **Archivos/módulos afectados:** backend/*/Code.gs; backend/developer-service/Code.gs; js/api.js; js/developer.js; developer-dashboard.html.
- **Dependencias y riesgos:** AUD-NG-011, F6-006-A02, permisos Drive, IDs de instancia y contratos de servicios.
- **Alcance:** operación individual por servicio; no presentar un backup global como aislado.
- **Criterios de aceptación:** cada servicio tiene backup/carpeta propios; catálogo identifica alcance/versión/fecha/resultado; no se listan/restauran backups de áreas no autorizadas.
- **Prioridad:** P0. **Estado:** Pendiente. **Evidencia de cierre:** pendiente.

### F6-011-A03 - Crear restauración transaccional, contextual y protegida
- **Hallazgo de origen:** H2/H3/H7.
- **Severidad:** Crítico.
- **Objetivo:** restaurar solo el servicio autorizado y evitar estados parciales.
- **Acción ejecutable:** exigir SHA-256/compatibilidad antes de escribir; validar propiedad/destino; preview obligatorio; token de un solo uso emitido por servidor; alinear contrato frontend/backend; LockService, staging, compensación/rollback y registro de resultado.
- **Archivos/módulos afectados:** backend/academic-service/Code.gs; backend/developer-service/Code.gs; js/teacher.js; js/developer.js; js/api.js.
- **Dependencias y riesgos:** permisos por servicio, catálogo, cuotas Apps Script, tamaño de datos, concurrencia y cambios posteriores al backup.
- **Alcance:** restauración de un serviceId por operación; prohibido sobrescribir otros servicios.
- **Criterios de aceptación:** hash/compatibilidad inválidos bloquean; preview y confirmación obligatorios; repetición no duplica; fallo permite rollback/reanudación; otros servicios no cambian.
- **Prioridad:** P0. **Estado:** Pendiente. **Evidencia de cierre:** pendiente.

### F6-011-A04 - Implementar reconciliación referencial completa y bloqueante
- **Hallazgo de origen:** H6/H8.
- **Severidad:** Alto.
- **Objetivo:** acreditar integridad de entidades/relaciones después de restaurar.
- **Acción ejecutable:** verificar usuarios, roles, áreas, matrículas, expedientes, tutores, documentos, referencias Drive y entidades operativas; reportar huérfanos/duplicados; bloquear cierre ante inconsistencias críticas.
- **Archivos/módulos afectados:** backend/academic-service/Code.gs; backend/user-service/Code.gs; servicios dueños de datos; pruebas.
- **Dependencias y riesgos:** contratos interservicio, IDs canónicos, documentos externos y referencias históricas.
- **Alcance:** validar sin autoeliminar ni inventar relaciones.
- **Criterios de aceptación:** cada relación crítica se valida; inconsistencias enumeradas; estado no exitoso ante fallos críticos; reporte persistido.
- **Prioridad:** P1. **Estado:** Pendiente. **Evidencia de cierre:** pendiente.

### F6-011-A05 - Programar backups, retención, rotación y capacidad
- **Hallazgo de origen:** H5.
- **Severidad:** Alto.
- **Objetivo:** garantizar backups recurrentes con retención/capacidad medibles.
- **Acción ejecutable:** crear triggers time-based por servicio; configurar frecuencia/retención/rotación; medir antigüedad, tamaño y cuota; alertar fallos; evitar purgar la única copia íntegra.
- **Archivos/módulos afectados:** backend/developer-service/Code.gs; backend/academic-service/Code.gs; backend/user-service/Code.gs; backend/accounting-service/Code.gs; dashboard.
- **Dependencias y riesgos:** cuotas Apps Script/Drive, políticas legales, AUD-NG-146/AUD-NG-145 y permisos de triggers.
- **Alcance:** solo backups, no sustituye retención de logs/documentos.
- **Criterios de aceptación:** trigger verificable por servicio; fallo genera estado/error; rotación conserva copias verificadas mínimas; capacidad medida realmente.
- **Prioridad:** P1. **Estado:** Pendiente. **Evidencia de cierre:** pendiente.

### F6-011-A06 - Corregir dashboard/API y añadir pruebas de recuperación
- **Hallazgo de origen:** H7/H9.
- **Severidad:** Alto.
- **Objetivo:** exponer el flujo real y demostrarlo sin datos productivos.
- **Acción ejecutable:** alinear wrappers/dispatchers; retirar mocks; mostrar servicio, alcance, checksum, estado, preview y resultado; añadir pruebas aisladas de corrupción, restore, concurrencia, rollback, triggers, retención y permisos; documentar runbook.
- **Archivos/módulos afectados:** js/api.js; js/developer.js; js/teacher.js; developer-dashboard.html; backend/*; tests/regression/*; documentación de continuidad.
- **Dependencias y riesgos:** A01-A05, permisos, entornos de prueba, Drive/Sheets y contratos API.
- **Alcance:** no declarar éxito por respuestas simuladas o datos de ejemplo.
- **Criterios de aceptación:** ninguna UI muestra mocks; endpoints/DTO coinciden; pruebas aisladas demuestran que otros servicios no cambian; runbook reproducible.
- **Prioridad:** P1. **Estado:** Pendiente. **Evidencia de cierre:** pendiente.

## 7. Cierre

- TAREA-F6-011: NO CUMPLE.
- TAREA-F6-036: NO CUMPLE; amplía el mismo objetivo con CA-103..CA-112/CA-160.
- Estados [X] de completadas.md conservados como histórico.
- Pendientes.md consultado desde blob íntegro; no modificado.
- Se crean informes individuales con un único bloque canónico F6-011-A01..A06.
- Se amplía AUD-NG-146; no se crean IDs globales duplicados.
- No se modificó código/configuración/dashboard/tests/datos productivos.
- No se ejecutaron Apps Script runtime, HTTP, triggers, Drive/Sheets productivas ni restauraciones reales.
- Siguiente tarea: TAREA-F6-012 y su registro ampliado TAREA-F6-037, seguridad, aislamiento y permisos.

## 8. Referencias

- completadas.md SHA f57f1aef832e81e44fc4f7ec36a852d50e464676, líneas 2798-2820 y 3705-3732.
- Pendientes.md blob SHA 631b4c2dbf0e86d5704b63625382d73ccb8ceb3c.
- ChangesLogs.txt SHA 5b5cff1926b73a05d1b92087a7bf4b2db75326ff, líneas 1993-1997 y 2174-2177.
- backend/academic-service/Code.gs SHA df87a2eea9f0ef79d0b966d03fd5bbe432003df5.
- backend/user-service/Code.gs SHA 12079dd410aa6d8afbce55a4bc62a79dea605f9f.
- backend/developer-service/Code.gs SHA 8aa4bac67cfe5c8c54da51a0784a56fef633e412.
- backend/accounting-service/Code.gs SHA 38b979d41596b85e888b4a7060b37bbac0840a28.
- js/teacher.js SHA c475fce5afcd28fca23e7b64398ad32b17773746.
- js/developer.js SHA 6fa4c4bd9be580c974b1fbede4f0cf79485dc331.
- js/api.js SHA 6b24f666db30a811a8e9b38d466fc6001cf6dfa9.
- developer-dashboard.html SHA 2b69f1bf7ffbbe4902e81de14d6315cedb035a1e.
- tests/regression/academic-grading-suite.js SHA a22cb3ef376fe09e65c1b17c2f4f5125290bfba6.
