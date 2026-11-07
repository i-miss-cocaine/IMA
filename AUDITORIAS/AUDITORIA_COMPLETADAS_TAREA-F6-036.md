# AUDITORÍA TÉCNICA - TAREA-F6-036: Respaldos independientes y recuperación por área (alcance ampliado)

**Fecha:** 2026-11-07  
**Repositorio:** i-miss-cocaine/IMA  
**Rama:** NG_beta_0.0.0.1_work  
**Checkpoint inicial:** C1.227  
**Checkpoint de cierre:** C1.228  
**Sesión:** IMA-AUDIT-20261107-2039Z-01  
**Dictamen:** **NO CUMPLE**  
**Estado histórico en completadas.md:** [X] (se conserva sin modificación).

## 1. Relación con TAREA-F6-011

TAREA-F6-036 repite el objetivo de TAREA-F6-011 y amplía el alcance con backups por servicio que incluyan Sheets, Drive, configuración y metadatos, almacenamiento aislado, detección de copias corruptas, preview/simulación, control de capacidad, retención y conservación de relaciones entre usuarios, roles, áreas, documentos y datos operativos. Ambas tareas carecían de informe individual y se auditaron conjuntamente. Este informe conserva la trazabilidad de F6-036 y reutiliza el bloque canónico F6-011-A01..A06 de AUDITORIAS/AUDITORIA_COMPLETADAS_TAREA-F6-011.md; no se crean tareas duplicadas.

Fuentes:
- completadas.md SHA f57f1aef832e81e44fc4f7ec36a852d50e464676, líneas 3705-3732.
- Pendientes.md blob SHA 631b4c2dbf0e86d5704b63625382d73ccb8ceb3c, recuperado íntegro desde el blob del HEAD actual.
- ChangesLogs.txt SHA 5b5cff1926b73a05d1b92087a7bf4b2db75326ff, líneas 2174-2177.
- Evidencia detallada de funciones, rutas, hashes y hallazgos: AUDITORIAS/AUDITORIA_COMPLETADAS_TAREA-F6-011.md.

## 2. Verificación del alcance ampliado

### A. Backups por servicio
createSystemBackup siempre abre el SPREADSHEET_ID global del proyecto ACADEMIC y copia todas sus hojas. No acepta serviceId/areaId, no crea carpeta/ACL por servicio y no incorpora documentos Drive ni configuraciones externas. USER, DEVELOPER y ACCOUNTING no tienen handlers equivalentes. CA-103/CA-106 no se cumplen.

### B. Catálogo, integridad y almacenamiento
La metadata contiene timestamp, spreadsheetId, createdById, createdByRole y versión fija. listSystemBackups enumera archivos de una carpeta global y omite checksum, servicio, alcance, versión de esquema, resultado de verificación y estado. computeSimpleHash no es SHA-256 y verifyBackupIntegrity acepta cualquier checksum no vacío. CA-104/CA-105 son parciales; el almacenamiento aislado no existe.

### C. Restauración, preview y relaciones
restoreSystemBackup no ejecuta verifyBackupIntegrity ni previewBackupRestoreImpact; exige campos confirmados que teacher.js no envía con los nombres correctos; limpia hojas del Spreadsheet global sin staging/rollback/LockService. previewBackupRestoreImpact solo cuenta filas y reporta enlaces Drive rotos, pero no invalida la copia ni realiza simulación aislada. reconcileRestoredDataIntegrity comprueba solo CalificacionesEstudiantes e HistorialAcademico y no se invoca desde restore. CA-106/CA-107/CA-108/CA-160 no se cumplen; CA-109 es parcial.

### D. Retención y capacidad
No se encontraron triggers time-based ni política de retención/rotación de backups en ACADEMIC/USER/DEVELOPER/ACCOUNTING. No existe medición específica de volumen o acumulación de copias. CA-110/CA-111 no se cumplen.

### E. Dashboard y procedimiento
developer-dashboard.html solo ofrece USER y ACADEMIC. js/api.js llama acciones USER inexistentes; developer.js presenta un backup ficticio como EXITOSO si no hay registros. La ruta de restore del dashboard no coincide con el contrato backend. No se encontró runbook reproducible para recuperación por servicio. CA-112 no se cumple.

## 3. Matriz de aceptación

| Criterio | Dictamen | Evidencia |
|---|---|---|
| CA-103 backup individual por microservicio | No cumple | sin serviceId/areaId ni handlers por servicio. |
| CA-104 ID, fecha, alcance y resultado | Parcial | fileId/fecha/nombre en Drive; no catálogo con alcance/resultado. |
| CA-105 detectar copia incompleta/corrupta | Parcial | estructura/hojas esenciales; checksum bypass y enlaces rotos no invalidan. |
| CA-106 restauración aislada | No cumple | todas las hojas del Spreadsheet ACADEMIC global. |
| CA-107 preview y confirmación | Parcial | preview separado y contrato de confirmación incompatible. |
| CA-108 simulación aislada | No cumple | solo conteo de filas, sin entorno de prueba. |
| CA-109 registrar resultados/verificaciones | Parcial | logStructuredEvent sin catálogo ni reconciliación integrada. |
| CA-110 retención/rotación | No cumple | sin triggers/política de backup. |
| CA-111 capacidad/acumulación | No cumple | no se mide volumen de respaldos. |
| CA-112 procedimiento documentado | No cumple | no se encontró runbook reproducible. |
| CA-160 conservar relaciones usuarios/roles/áreas/documentos | No cumple | reconciliación limitada a dos hojas y no bloqueante. |

## 4. Tareas ejecutables derivadas de los hallazgos

Se reutiliza el bloque canónico F6-011-A01..A06 de AUDITORIAS/AUDITORIA_COMPLETADAS_TAREA-F6-011.md:
1. F6-011-A01: SHA-256 real y manifiesto verificable.
2. F6-011-A02: backups y almacenamiento aislado por microservicio.
3. F6-011-A03: restauración transaccional, contextual y protegida.
4. F6-011-A04: reconciliación referencial completa y bloqueante.
5. F6-011-A05: programación, retención, rotación y capacidad.
6. F6-011-A06: dashboard/API y pruebas de recuperación.
Todas permanecen pendientes. No se crean IDs globales ni tareas locales duplicadas.

## 5. Cierre

- Dictamen TAREA-F6-036: NO CUMPLE.
- El estado [X] de completadas.md se conserva como histórico.
- El informe detallado y las tareas derivadas están en AUDITORIAS/AUDITORIA_COMPLETADAS_TAREA-F6-011.md.
- Este archivo mantiene la trazabilidad individual de F6-036 y sus criterios ampliados.
- No se modificó código ni se ejecutaron respaldos/restauraciones productivas.
- Siguiente tarea: TAREA-F6-012 y su registro ampliado TAREA-F6-037.
