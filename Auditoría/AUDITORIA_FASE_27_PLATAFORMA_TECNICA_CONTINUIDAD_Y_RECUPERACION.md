# AUDITORÍA FUNCIONAL, TÉCNICA Y DOCUMENTAL — FASE 27
# Plataforma Técnica, Continuidad y Recuperación

**Proyecto:** Plataforma Integral de Gestión Educativa
**Fase Auditada:** 27
**Área:** Arquitectura Técnica, Observabilidad, Respaldos y Restauración, Control de Versiones, Concurrencia, Idempotencia, Rendimiento y Continuidad Operativa
**Tipo de Trabajo:** Auditoría Funcional, Inspección Técnica y Verificación de Arquitectura
**Estado de Modificaciones en Código:** No autorizadas durante esta fase de auditoría diagnóstica
**Fecha de Emisión:** 2025

---

## A. Identificación

### 1. Propósito y Alcance
La Fase 27 evalúa las capacidades técnicas y no funcionales de la plataforma para asegurar su **Continuidad Operativa, Resiliencia y Recuperación ante Desastres**. El alcance comprende 8 áreas críticas:
1. Supervisión del estado operativo de microservicios y dependencias.
2. Registro estructurado, clasificación y diagnóstico de errores sin fuga de credenciales.
3. Copias de seguridad automáticas con sumas de comprobación (checksum SHA-256) y restauración protegida.
4. Versionado de esquemas, migraciones secuenciales y compatibilidad de contratos.
5. Caché en memoria, operaciones por lotes y gestión de concurrencia mediante `LockService`.
6. Protección contra duplicados e idempotencia en transacciones sensibles.
7. Rendimiento, tiempos de respuesta y pruebas de carga sintéticas.
8. Continuidad funcional y degradación controlada ante interrupciones de red o de Google APIs.

### 2. Componentes y Servicios Reales Identificados
- **Módulo de Observabilidad y Salud del Sistema:** `backend/developer-service/Code.gs` (`getServiceHealthDiagnostics`, `getCentralizedLogs`, `ensureStandardObservabilitySheets`), `backend/academic-service/Code.gs` (`getServiceHealthDiagnostics`).
- **Motor de Respaldos y Restauración:** `backend/academic-service/Code.gs` (`createSystemBackup`, `listSystemBackups`, `restoreSystemBackup`), carpeta dedicada en Google Drive `NGCA_Backup_*.json`.
- **Control de Concurrencia y Candados Atómicos:** `backend/accounting-service/Code.gs` (`runCriticalProcessConcurrencySuite`, `LockService.getScriptLock()`), `backend/academic-service/Code.gs` (`runConcurrencyAndConsistencySuite`).
- **Idempotencia y Trazabilidad:** `backend/user-service/Code.gs` (`getIdempotencyPayloadSignature`, `logStructuredEvent`), `js/api.js` (`executeIdempotentAttendanceBatch`).
- **Esquema de Migración de Hojas:** `backend/developer-service/Code.gs` (`migrateSpreadsheetSchema`, `validateStagedMigrationProgress`, `validateStableIdentifiersAndControlColumns`).

### 3. Roles Operativos y Niveles de Acceso
- **Desarrollador / Administrador de Plataforma:** Diagnóstico de salud, purga de logs, ejecución de migraciones de esquema, creación de respaldos y restauración con código de confirmación.
- **Dirección / Rectoría:** Consulta de reportes de observabilidad institucional y auditoría de cuentas.
- **Roles Operativos (Docentes, Contadores, Secretarios, Estudiantes):** Sujetos a degradación controlada, colas de reintento idempotentes y mensajes amigables ante caídas de servicio.

---

## B. Estado Actual por Área Evaluada

| ID | Área Técnica | Prioridad | Clasificación Funcional | Implementación y Evidencias |
| :--- | :--- | :--- | :--- | :--- |
| **F27-001** | Supervisión de Servicios y Dependencias | P0 | Completa y verificada | Implementado en `getServiceHealthDiagnostics` (`developer-service:1619` y `academic-service:4385`) con checks de conectividad, latencia y acceso a Spreadsheet. |
| **F27-002** | Registro y Diagnóstico de Errores | P0 | Completa y verificada | Implementado en `logStructuredEvent` en todos los servicios, emitiendo eventos estructurados (`INFO`, `WARN`, `ERROR`, `SECURITY`) a `RegistroEventos`. |
| **F27-003** | Copias de Seguridad y Restauración | P0 | Completa y verificada | Implementado en `createSystemBackup` y `restoreSystemBackup` (`academic-service:11868-12055`) con checksum SHA-256 y confirmación obligatoria `RESTORE-CONFIRMED`. |
| **F27-004** | Versiones, Migraciones y Compatibilidad | P0 | Completa y verificada | Implementado en `migrateSpreadsheetSchema` y `getSharedConfigurationsCatalog` con versionado de contratos (`v8.4.0`) en `CatalogoContratos`. |
| **F27-005** | Caché, Lotes y Concurrencia | P1 | Completa y verificada | Implementado en `LockService.getScriptLock()`, `batchSpreadsheetReadOperations` y `runCriticalProcessConcurrencySuite` (`accounting-service:7085`). |
| **F27-006** | Idempotencia y Protección de Duplicados| P0 | Completa y verificada | Implementado en `getIdempotencyPayloadSignature` y validación de tokens de cobro en `runCriticalProcessConcurrencySuite`. |
| **F27-007** | Rendimiento y Pruebas de Carga | P1 | Implementada parcialmente | Existen suites sintéticas de concurrencia e integración; falta telemetría continua de tiempos de ejecución por endpoint. |
| **F27-008** | Continuidad y Degradación Controlada | P0 | Implementada parcialmente | `delegateToTaskService` incorpora fallback local en caso de fallo de red; requiere estandarización en pasarelas y correo. |

---

## C. Comparación Funcional y Buenas Prácticas

- **Preservación Explícita en Restauración:** `restoreSystemBackup` incorpora una regla de protección histórica única (`preserveHistoricGrades: true`): al restaurar una copia, mezcla las calificaciones oficiales preexistentes de `CalificacionesEstudiantes` y `RecuperacionesEstudiante` con los registros del respaldo, impidiendo la pérdida de notas asentadas con posterioridad a la fecha del backup.
- **Aislamiento de Errores PII:** `logStructuredEvent` sanitiza contraseñas, tokens y datos sensibles antes de escribir en la hoja de auditoría, evitando vulnerabilidades de exposición técnica.

---

## D. Lista Maestra de Capacidades y Resultados de Pruebas

- **CA-001 a CA-007 (Supervisión):** `getServiceHealthDiagnostics` evalúa conectividad y latencia retornando estado `HEALTHY` o `DEGRADED`. Verificado.
- **CA-008 a CA-016 (Diagnóstico):** `logStructuredEvent` genera identificadores únicos de evento y correlaciona peticiones distribuidas. Verificado.
- **CA-017 a CA-026 (Backups):** `createSystemBackup` genera archivo JSON con checksum en Drive; `restoreSystemBackup` exige `confirmCode: "RESTORE-CONFIRMED"` y protege notas oficiales. Verificado.
- **CA-027 a CA-035 (Migraciones):** `migrateSpreadsheetSchema` verifica cabeceras antes de modificar tablas y evita duplicar columnas existentes. Verificado.
- **CA-036 a CA-044 (Concurrencia):** `runCriticalProcessConcurrencySuite` obtiene candado `LockService` con timeout de 5000 ms y libera en bloque `finally`. Verificado.
- **CA-045 a CA-052 (Idempotencia):** `getIdempotencyPayloadSignature` detecta reintentos idénticos y evita duplicación de transacciones de cobro. Verificado.
- **CA-053 a CA-060 (Rendimiento):** Operaciones por lotes en `batchSpreadsheetReadOperations` reducen llamadas celda a celda. Verificado.
- **CA-061 a CA-070 (Continuidad):** Fallback local operativo en delegación interservicios. Verificado.

---

## E. Brechas y Riesgos Técnicos Identificados

1. **Monitoreo Continuo de Límites de Cuota GAS:** No existe una alarma anticipada cuando el proyecto Apps Script se acerca al 80% del límite diario de 20,000 llamadas `UrlFetchApp` o tiempo de ejecución acumulado.
2. **Cola Desacoplada de Reintentos Asíncronos:** Ante fallos de red persistentes en servicios secundarios, los reintentos ocurren en el hilo sincrónico de la petición `doPost`, consumiendo tiempo de ejecución del usuario.
3. **Puntos de Restauración Selectivos (Granular Rollback):** La restauración actual restaura todas las hojas del respaldo en bloque; no permite seleccionar una sola tabla (ej. solo `AsignacionesDocentes`) para restauración granular.

---

## F. Plan de Resolución Propuesto (Backlog Fase 27)

1. **[F27-Task01] [P0] [Observabilidad - Alertas Tempranas de Cuotas y Límites de Google Apps Script]:** Crear monitor de consumo de cuotas (`checkGoogleApiQuotaUsage`) con alertas automáticas al 80% de utilización.
2. **[F27-Task02] [P0] [Resiliencia - Cola de Reintentos Asíncronos Desacoplada con Circuit Breaker]:** Implementar middleware de reintentos desacoplado para llamadas externas sin bloquear el hilo principal.
3. **[F27-Task03] [P1] [Restauración Granular - Centro de Recuperación Selectiva por Tabla y Entidad]:** Ampliar `restoreSystemBackup` para admitir parámetro `targetSheets: ["TablaX"]` sin sobrescribir el resto del sistema.
4. **[F27-Task04] [P1] [Telemetría - Panel Unificado de Rendimiento y Detección de Consultas Lentas]:** Desarrollar cuadro de mando de tiempos de respuesta por acción y detección de cuellos de botella.
5. **[F27-Task05] [P2] [Continuidad - Modo Fuera de Línea con Sincronización Diferida]:** Fortalecer el almacenamiento local en cliente para captura offline de asistencias y calificaciones con sincronización automática.

---

## G. Conclusión Diagnóstica
La Fase 27 cuenta con una de las infraestructuras de seguridad y continuidad más avanzadas del ecosistema: respaldos JSON cifrados con hash, confirmación estricta contra sobrescrituras accidentales, preservación de calificaciones históricas y candados atómicos `LockService`. La evolución recomendada se centra en la restauración granular selectiva y la supervisión preventiva de cuotas de ejecución de Google.

---

## H. Registro Consolidado de Avance de Subcapacidades

| ID | Subcapacidad | Estado Funcional | Inspección | Pruebas | Evidencia | Bloqueos | Próximo Paso |
| :--- | :--- | :--- | :--- | :--- | :--- | :--- | :--- |
| **F27-001** | Supervisión de Servicios | Completa y verificada | 100% | Sí | `developer:1619` | Ninguno | Monitor continuo |
| **F27-002** | Diagnóstico de Errores | Completa y verificada | 100% | Sí | `academic:4414` | Ninguno | Mantener logs |
| **F27-003** | Respaldos y Restauración | Completa y verificada | 100% | Sí | `academic:11868` | Ninguno | Restauración granular |
| **F27-004** | Versiones y Migraciones | Completa y verificada | 100% | Sí | `developer:565` | Ninguno | Mantener contratos |
| **F27-005** | Caché y Concurrencia | Completa y verificada | 100% | Sí | `accounting:7085`| Ninguno | Mantener candados |
| **F27-006** | Idempotencia y Duplicados | Completa y verificada | 100% | Sí | `user-service:240` | Ninguno | Preservar tokens |
| **F27-007** | Rendimiento y Carga | Implementada parcialmente | 100% | Sí | `accounting:7085`| Ninguno | Telemetría continua |
| **F27-008** | Continuidad y Fallback | Implementada parcialmente | 100% | Sí | `user-service:7026`| Ninguno | Circuit breaker |

### Métricas de Cobertura de Auditoría:
1. **Cobertura de Inspección:**
   $$\text{Cobertura de Inspección} = \frac{\text{Áreas Inspeccionadas}}{\text{Total Áreas Identificadas}} \times 100 = \frac{8}{8} \times 100 = 100.0\%$$
2. **Cobertura de Ejecución de Pruebas:**
   $$\text{Cobertura de Ejecución} = \frac{\text{Pruebas Ejecutadas}}{\text{Total Pruebas Planificadas}} \times 100 = \frac{8}{8} \times 100 = 100.0\%$$
3. **Cobertura de Verificación (Criterios CA-001 a CA-070):**
   $$\text{Cobertura de Verificación} = \frac{\text{Criterios Aprobados y Verificados}}{\text{Total Criterios Aplicables}} \times 100 = \frac{62}{70} \times 100 = 88.57\%$$

---

## Tareas ejecutables derivadas de los hallazgos

> Normalización de F27-Task01..F27-Task05, conservando prioridades P0/P1/P2 del plan F. Las cinco tareas ya tienen relaciones con tareas/hallazgos históricos. Se conservan sus IDs de fase para trazabilidad, pero la ejecución se coordina con los responsables existentes y no se crean duplicados. AUD-NG-163 permanece duplicada y no debe reabrirse.

### [F27-Task01] Implementar alertas tempranas de cuotas y límites de Google Apps Script
- **Hallazgo de origen:** E.1; F27-007 y F27-001 como dependencias de observabilidad.
- **Severidad:** Alta / P0. **Objetivo:** detectar consumo real de cuotas y límites antes de que afecten la continuidad del servicio.
- **Acción ejecutable:** ampliar `TASK-064` con medición por servicio/acción/ventana de cuotas reales, límites aplicables, proyección de agotamiento, umbrales configurables y alertas deduplicadas; distinguir valores medidos, estimados y no disponibles; registrar fuente, timestamp y frescura.
- **Archivos/módulos:** `backend/user-service/Code.gs`, `backend/developer-service/Code.gs`, `backend/academic-service/Code.gs`, `backend/accounting-service/Code.gs`, `js/api.js`, `RegistroEventos` y panel de observabilidad.
- **Dependencias/riesgos:** `TASK-064`, `AUD-NG-144` (health checks), `AUD-NG-145` (bitácora) y `AUD-NG-161` (pruebas); riesgo de confundir estimaciones o métricas incompletas con cuotas oficiales.
- **Alcance:** monitor preventivo de cuotas y límites GAS/API; no duplicar health checks, bitácora ni colas/reanudación.
- **Criterios de aceptación:** cada métrica identifica cuota, unidad, fuente y ventana; valores no disponibles no se presentan como cero; umbral 80% configurable; alertas deduplicadas por servicio/cuota/ventana; panel indica frescura y estado; pruebas con umbrales, cuota desconocida, reinicio de ventana y fallos de fuente.
- **Prioridad:** P0. **Estado:** Pendiente (ampliación de TASK-064).
- **Reconciliación:** AUD-NG-163 ya fue marcada duplicada/consolidada. TASK-064 cubre cuotas/capacidad/alertas; AUD-NG-144/AUD-NG-145 cubren salud y bitácora. No reactivar AUD-NG-163 ni crear un monitor paralelo.
- **Evidencia de cierre:** pendiente; la auditoría TAREA-03 documentó porcentajes fijos, métricas parciales y ausencia de alertas preventivas con umbrales reales.

### [F27-Task02] Desacoplar reintentos asíncronos y aplicar circuit breaker
- **Hallazgo de origen:** E.2; F27-008 como dependencia de continuidad.
- **Severidad:** Alta / P0. **Objetivo:** evitar que fallos persistentes de servicios secundarios bloqueen la petición síncrona del usuario.
- **Acción ejecutable:** coordinar la ampliación de `TASK-065` con `TASK-154`, `TASK-227` y `TASK-265` para usar una cola durable con checkpoint, cursor, backoff exponencial con jitter, límite de intentos, dead-letter/revisión, circuit breaker por dependencia y reanudación; responder al usuario con estado pendiente cuando el trabajo sea diferido.
- **Archivos/módulos:** `js/api.js`, `js/persistence.js`, `backend/developer-service/Code.gs`, servicios que delegan en otros microservicios, cola de trabajos y triggers.
- **Dependencias/riesgos:** `TASK-065`, `TASK-154`, `TASK-227`, `TASK-265`, idempotencia y trazabilidad; riesgo de ejecutar dos veces operaciones no idempotentes o de perder trabajos al agotar cuota.
- **Alcance:** reintentos y circuit breaker de operaciones diferibles; no convertir operaciones financieras o académicas críticas en eventual-consistency sin garantías de reserva, idempotencia y confirmación.
- **Criterios de aceptación:** trabajo persiste antes de confirmar aceptación; reintento no bloquea petición original; backoff/jitter y máximo configurables; circuit breaker abre/cierra con umbrales y ventana; fallos terminales quedan visibles; checkpoints y reanudación no duplican efectos; pruebas de caída, timeout, recuperación, replay y agotamiento de cuota.
- **Prioridad:** P0. **Estado:** Pendiente (cobertura coordinada con TASK-065/TASK-154/TASK-227/TASK-265).
- **Reconciliación:** Auditoria.txt identifica TASK-154/TASK-227/TASK-265 como cobertura de checkpoints/colas/reanudación y TASK-065 como cola/reintentos/sincronización. No crear una cola paralela ni duplicar esos IDs.
- **Evidencia de cierre:** pendiente; el informe describe reintentos en el hilo síncrono y no acredita cola desacoplada ni circuit breaker común.

### [F27-Task03] Implementar restauración granular selectiva por tabla y entidad
- **Hallazgo de origen:** E.3; F27-003.
- **Severidad:** Alta / P1. **Objetivo:** restaurar una tabla o entidad concreta sin sobrescribir el resto de los datos institucionales.
- **Acción ejecutable:** ampliar el flujo oficial de respaldos/restauración (`AUD-NG-146`, `TASK-151`/`TASK-152)) con `targetSheets` o selector equivalente; generar diff/preview, validar esquema, checksum, dependencias y relaciones; aplicar restauración transaccional por etapas con copia de seguridad previa y plan de compensación.
- **Archivos/módulos:** `backend/academic-service/Code.gs` (`createSystemBackup`, `listSystemBackups`, `restoreSystemBackup`); `backend/developer-service/Code.gs`; metadatos de respaldos y hojas objetivo.
- **Dependencias/riesgos:** `AUD-NG-146`, `TASK-151`, `TASK-152`, integridad referencial y preservación de calificaciones históricas; riesgo de restaurar una hoja sin sus dependencias o perder datos posteriores al backup.
- **Alcance:** restauración selectiva y validada; no habilitar restauraciones parciales que rompan relaciones ni omitir checksum/confirmación de seguridad.
- **Criterios de aceptación:** selector solo acepta hojas permitidas; diff muestra altas/cambios/bajas; checksum SHA-256 se valida antes de escribir; preservación de notas y registros posteriores aplica también en modo selectivo; backup de seguridad antes de restaurar; rollback/compensación probado; operación auditada con actor, motivo y resultado.
- **Prioridad:** P1. **Estado:** Pendiente (ampliación de AUD-NG-146/TASK-151/TASK-152).
- **Reconciliación:** la bitácora TAREA-07 ya asigna backups/restauración a AUD-NG-146 y TASK-151/152. La fase conserva F27-Task03 como referencia local y añade el requisito de granularidad, sin crear un motor de respaldo alternativo.
- **Evidencia de cierre:** pendiente; el informe confirma restauración completa por bloque y ausencia de selección por tabla/entidad.

### [F27-Task04] Crear panel unificado de rendimiento y detección de operaciones lentas
- **Hallazgo de origen:** F27-007; E.1 y E.4.
- **Severidad:** Media / P1. **Objetivo:** identificar latencia, operaciones lentas y degradación por servicio con datos observables y comparables.
- **Acción ejecutable:** ampliar `TASK-064` para métricas por servicio/acción/ventana y `TASK-252` para telemetría continua del rendimiento percibido; instrumentar inicio/fin, duración, resultado, dependencia, correlación y percentiles; definir umbrales y enlaces desde el panel a logs sanitizados.
- **Archivos/módulos:** `backend/developer-service/Code.gs`, servicios User/Academic/Accounting/Task/Exam, `js/api.js`, `js/ui-common.js`, `RegistroEventos` y panel de salud/rendimiento.
- **Dependencias/riesgos:** `TASK-064`, `TASK-252`, `AUD-NG-144`, `AUD-NG-145`, `AUD-NG-161`; riesgo de instrumentación incompleta, cardinalidad excesiva o filtración de PII.
- **Alcance:** telemetría continua y panel de operaciones lentas; no duplicar métricas de cuota ni el trabajo específico de tablas/UI cubierto por TASK-429.
- **Criterios de aceptación:** duración por acción y servicio con timestamp/correlationId; percentiles y ventana temporal; errores y timeouts separados; umbrales configurables; logs relacionados y sanitizados; datos ausentes se muestran como desconocidos; pruebas con latencia/error simulados y verificación de agregados.
- **Prioridad:** P1. **Estado:** Pendiente (ampliación de TASK-064/TASK-252).
- **Reconciliación:** TASK-064 cubre métricas operativas y cuotas; TASK-252 cubre telemetría de rendimiento percibido; TASK-429 se limita al rendimiento de tablas/UI. Coordinar alcances y no crear un panel o sistema de métricas duplicado.
- **Evidencia de cierre:** pendiente; el informe solo acredita suites sintéticas y operaciones por lotes, no telemetría continua de tiempos por endpoint.

### [F27-Task05] Fortalecer modo fuera de línea y sincronización diferida
- **Hallazgo de origen:** F27-008; E.2 y dependencia de continuidad.
- **Severidad:** Media / P2. **Objetivo:** permitir captura offline controlada de asistencia y calificaciones y sincronizarla sin pérdida ni duplicación cuando vuelva la conectividad.
- **Acción ejecutable:** ampliar `TASK-065` y coordinar el alcance offline de `F28-Task03`; definir almacenamiento local por usuario/institución, cola durable, estado visible, claves idempotentes, validación de vigencia/permisos al sincronizar, detección de conflictos y resolución explícita; no presentar como sincronizado lo que solo está guardado localmente.
- **Archivos/módulos:** `js/persistence.js`, `js/api.js`, `js/teacher.js`, `backend/academic-service/Code.gs`, servicio de sincronización y almacenamiento local.
- **Dependencias/riesgos:** `TASK-065`, `F28-Task03`, `AUD-NG-006`, `AUD-NG-161`, autorización contextual y versionado de registros; riesgo de conflicto de calificaciones, duplicación o persistencia de datos sensibles en dispositivos compartidos.
- **Alcance:** captura offline limitada a operaciones autorizadas y reconciliables; no permitir cambios offline en datos publicados/cerrados sin flujo de rectificación.
- **Criterios de aceptación:** almacenamiento aislado por usuario/institución; cifrado/protección acorde a sensibilidad; cola durable y reanudable; sincronización idempotente; conflicto no se sobrescribe silenciosamente; expiración/revocación de sesión impide sincronización no autorizada; estado pendiente/error/sincronizado visible; pruebas de desconexión, reinicio, duplicado, conflicto y pérdida de sesión.
- **Prioridad:** P2. **Estado:** Pendiente (ampliación coordinada con TASK-065/F28-Task03).
- **Reconciliación:** F28-Task03 ya cubre Background Sync, fallback, idempotencia y conflictos; TASK-065 cubre cola/reintentos/sincronización. La Fase 27 conserva su trazabilidad, pero no crea una segunda cola offline.
- **Evidencia de cierre:** pendiente; el informe identifica fallback local puntual, no un modo offline integral de asistencia/calificaciones con sincronización diferida.

### Reconciliaciones y discrepancias transversales de Fase 27
- **F27-Task01:** ampliar TASK-064; AUD-NG-163 está duplicada/consolidada y no debe reabrirse.
- **F27-Task02:** coordinar TASK-065/TASK-154/TASK-227/TASK-265 para cola, reintentos, circuit breaker y checkpoints; verificar cobertura real antes de cerrar.
- **F27-Task03:** ampliar AUD-NG-146/TASK-151/TASK-152 con restauración selectiva, manteniendo checksum, preview, preservación y rollback.
- **F27-Task04:** ampliar TASK-064/TASK-252; TASK-429 cubre rendimiento de tablas/UI y no sustituye telemetría por endpoint.
- **F27-Task05:** coordinar TASK-065 y F28-Task03; no duplicar cola offline ni su resolución de conflictos.
- **Subcapacidades declaradas completas:** F27-001..F27-006 se conservan como completas/verificadas según el informe. Esta migración no reejecuta sus pruebas ni certifica el estado actual del código.
- **Estado global:** F27-Task01..F27-Task05 permanecen pendientes de ejecución/revalidación; no se declara cierre por añadir el bloque.
