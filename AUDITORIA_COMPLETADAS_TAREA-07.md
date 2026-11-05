# Auditoría de completadas.md - TAREA-07

**Fecha:** 2026-11-05  
**Rama:** NG_beta_0.0.0.1_work  
**Tarea:** Implementar una estrategia integral de almacenamiento, conservación y recuperación  
**Fuente:** completadas.md, SHA f57f1aef832e81e44fc4f7ec36a852d50e464676  
**HEAD de referencia:** 510cd622feaa5a170c807efd9f3ad1c29cdda003

## Dictamen

**CUMPLE PARCIALMENTE.** Existe un respaldo JSON de hojas de cálculo, una consulta de respaldos y funciones de verificación/restauración. Sin embargo, el hash usado no es SHA-256, la verificación acepta cualquier checksum no vacío, la restauración no invoca esa verificación y solo recupera hojas, no archivos binarios de Drive. La retención de expedientes/finanzas no ejecuta un archivado real, y no se acredita programación de respaldos, alertas de capacidad ni medición RPO/RTO. Las brechas ya están registradas en tareas existentes; no se crea un nuevo AUD-NG.

## Contraste con ChangesLogs.txt

ChangesLogs.txt atribuye a TAREA-07 únicamente la adición de un comentario identificativo en createSystemBackup dentro de backend/academic-service/Code.gs. No registra cambios funcionales de inventario, retención, respaldos binarios, restauración granular, alertas, Shared Drives ni métricas RPO/RTO. La marca [X] de completada.md no se corresponde con el alcance exigido.

## Evidencia técnica

### 1. Creación y alcance de los respaldos

- createSystemBackup serializa las hojas del Spreadsheet configurado en un archivo JSON dentro de la carpeta New Generation/Respaldos. El objeto metadata contiene timestamp, spreadsheetId, createdById, createdByRole y version; no incorpora un manifiesto de archivos binarios, IDs de documentos físicos, relaciones documentales ni hashes de cada archivo.
- getBackupFolder usa DriveApp.getRootFolder() y crea New Generation/Respaldos en la raíz de la identidad que ejecuta el script. No se observa configuración de Shared Drive ni validación de que la carpeta pertenezca a un repositorio institucional independiente.
- No se encontró una función generateBackupJSON ni una rutina ScriptApp.newTrigger en el módulo revisado. createSystemBackup se ejecuta bajo demanda; no se acreditó un calendario automático de respaldos.
- TASK-151 ya exige respaldos binarios y relaciones documentales; TASK-152 exige restauración integral de tablas y archivos.

### 2. Integridad criptográfica

- computeSimpleHash implementa un acumulador entero de 32 bits (prefijo HASH-), no SHA-256.
- verifyBackupIntegrity elimina el checksum almacenado y recalcula computeSimpleHash, pero define isValid como (storedChecksum === computedChecksum || Boolean(storedChecksum)). Cualquier checksum no vacío hace que la primera comprobación se considere válida, aunque no coincida con el contenido.
- La validación revisa la presencia de algunas hojas esenciales y referencias a archivos en DocumentosEstudiante, pero no demuestra integridad binaria ni consistencia completa de relaciones.
- AUD-NG-146 ya registra el hash débil, la condición que acepta checksums no coincidentes y la necesidad de validar estructura/enlaces antes de restaurar. TASK-151 exige SHA-256 de cada binario y del manifiesto.

### 3. Restauración y protección de datos posteriores

- restoreSystemBackup comprueba un booleano confirmed y una clave fija confirmCode, pero no llama a verifyBackupIntegrity antes de escribir.
- La función recorre todas las hojas incluidas en el JSON; para hojas existentes ejecuta sheet.clear() y luego setValues(). Solo preserva/mezcla CalificacionesEstudiantes y RecuperacionesEstudiante cuando preserveHistoricGrades está activo. No protege de forma general registros más recientes de otras áreas.
- previewBackupRestoreImpact sí llama a verifyBackupIntegrity, pero el resumen compara principalmente cantidades de filas; no ofrece un diff completo de registros, conflictos de IDs y dependencias para decidir una restauración granular.
- reconcileRestoredDataIntegrity verifica algunas tablas/relaciones académicas, pero no acredita conciliación completa de todos los módulos ni de los archivos binarios.
- AUD-NG-146 ya detecta que restoreSystemBackup no verifica la copia antes de restaurar y que la UI teacher.js envía confirmationCode mientras el backend espera confirmed + confirmCode. TASK-087 exige dry-run y copia de seguridad previa; TASK-251 exige restauración granular por hojas/entidades; TASK-152 cubre archivos binarios y validación post-recuperación.
- No se encontró evidencia de pruebas de restauración en un entorno aislado ni medición real del tiempo de recuperación.

### 4. Retención y conservación

- USER dispone de getRetentionPolicies/saveRetentionPolicy/executeDataRetentionPolicyCheck. Hay políticas para bitácoras, sesiones, expedientes, finanzas y usuarios inactivos.
- executeDataRetentionPolicyCheck sí elimina determinadas filas de BitacoraEventos y anonimiza algunas cuentas inactivas. Para STUDENT_EXPEDIENTS y FINANCIAL_RECORDS con preservación legal, únicamente incrementa itemsEvaluated/itemsArchived; no mueve ni archiva documentos ni registros.
- No se observó un motor completo de retención para archivos Drive, expedientes y documentos financieros, con estados, legal hold, historial de políticas y disposición autorizada. TASK-149 y TASK-150 ya cubren conservación/legal hold y doble autorización de disposición.
- No se acredita una política de retención específica para copias JSON ni un proceso de eliminación segura de respaldos vencidos.

### 5. Cuotas, inventario y continuidad

- getStorageQuotaMetricsReport en ACADEMIC declara capacityUsagePct: 15.5 como valor fijo; no es una medición de cuota real.
- getDriveStorageQuotaMetricsReport en TASK intenta Drive.About.get(), pero si no está disponible estima con un máximo de 100 archivos y un total por defecto de 15 GB. Esa estimación parcial no representa el consumo real de todas las unidades/cuentas.
- No se encontró un inventario integral por departamento/tipo de archivo/propietario, proyección de crecimiento, alerta de almacenamiento próximo al límite ni procedimiento de respuesta asociado. TASK-064 ya cubre cuotas y alertas preventivas.
- No se encontraron métricas RPO/RTO registradas por restauración. TASK-079 exige su medición y pruebas.
- TASK-345 cubre la conciliación Drive-registros para detectar archivos huérfanos, referencias inexistentes y discrepancias.

## Relación con tareas existentes (sin duplicar)

- AUD-NG-146: SHA-256 real, validación previa, contrato de restauración, programación y retención de backups.
- TASK-151: respaldos de archivos binarios, manifiesto, relaciones y hashes.
- TASK-152: restauración integral de binarios/tablas y validación posterior.
- TASK-087: simulación dry-run, análisis de impacto y salvaguarda antes de restaurar.
- TASK-251: restauración granular por hojas/entidades relacionadas.
- TASK-079: medición RPO/RTO y autorización contextual.
- TASK-149/TASK-150: retención, legal hold y disposición controlada.
- TASK-064: cuotas, crecimiento y alertas preventivas.
- TASK-345: conciliación entre Drive y registros.
- No se crea un hallazgo nuevo; se amplían criterios existentes en Pendientes.md para exigir que la restauración no omita la verificación, que el respaldo identifique datos/binarios y que el archivado de expedientes/finanzas sea una operación real.

## Calidad y límites de verificación

La calidad es **insuficiente para declarar TAREA-07 completada**. El checksum no es criptográfico y la función de verificación acepta valores no coincidentes; la restauración omite esa verificación y puede reemplazar hojas completas; los binarios no se respaldan; el archivado de expedientes/finanzas es solo un contador; y no se acreditan triggers, alertas, Shared Drives ni RPO/RTO.

La revisión fue estática. No se accedió a los respaldos reales de Drive, permisos de carpetas, triggers desplegados, datos productivos ni a un entorno de recuperación. No se ejecutaron pruebas de corrupción, restauración, pérdida de archivos ni retención. No se modificó código fuente ni datos productivos.

## Restricciones

No se modifican código fuente, completadas.md, ChangesLogs.txt ni METODOLOGIA_DESARROLLO.md. Solo se amplían registros de auditoría y tareas pendientes existentes. La rama base permanece intacta y no se hace merge.
