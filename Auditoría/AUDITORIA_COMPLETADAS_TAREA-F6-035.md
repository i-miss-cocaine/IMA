# AUDITORÍA TÉCNICA - TAREA-F6-035: Administración segura de logs y comandos operativos (alcance ampliado)

**Fecha:** 2026-11-07  
**Repositorio:** i-miss-cocaine/IMA  
**Rama:** NG_beta_0.0.0.1_work  
**Checkpoint inicial:** C1.226  
**Checkpoint de cierre:** C1.227  
**Sesión:** IMA-AUDIT-20261107-2240Z  
**Dictamen:** **NO CUMPLE**  
**Estado histórico en completadas.md:** [X] (se conserva sin modificación).

## 1. Relación con TAREA-F6-010
TAREA-F6-035 repite el alcance de TAREA-F6-010 y amplía los criterios con consulta desde dashboard, confirmación de limpieza, estados de ejecución, idempotencia y permisos por comando. Ambas carecían de informe individual y se auditaron conjuntamente. Este informe conserva la trazabilidad de F6-035 y reutiliza el bloque canónico F6-010-A01..A06 de AUDITORIAS/AUDITORIA_COMPLETADAS_TAREA-F6-010.md; no se crean tareas duplicadas.

Fuentes:
- completadas.md SHA f57f1aef832e81e44fc4f7ec36a852d50e464676, líneas 3694-3722.
- Pendientes.md blob SHA 631b4c2dbf0e86d5704b63625382d73ccb8ceb3c, recuperado íntegro.
- ChangesLogs.txt SHA 5b5cff1926b73a05d1b92087a7bf4b2db75326ff, líneas 1983-1987.
- Evidencia detallada de código: AUDITORIAS/AUDITORIA_COMPLETADAS_TAREA-F6-010.md.

## 2. Verificación de criterios ampliados

### Consulta, resolución y retención
getCentralizedLogs devuelve dos sampleLogs y no consulta bitácoras reales; resolveLogId devuelve éxito sin persistir estado. El dashboard consulta USER/getStructuredLogs, con filtros/DTO desalineados. purgeStructuredLogs verifica rol Administrador/Desarrollador, pero elimina todas las filas de LogsSistema sin fecha de corte, confirmación ni protección de auditoría inmutable. Las políticas de retención no se aplican a esa purga; el motor de retención solo purga BitacoraEventos bajo una regla parcial y contabiliza archivos legales sin archivarlos realmente.

### Comandos y cola
ALLOWED_OPERATIONAL_COMMANDS limita los nombres permitidos, pero executeOperationalCommand no ejecuta handlers: ignora parameters y siempre devuelve éxito. No existe cola durable, cancelación, reanudación ni historial. runSystemMaintenance no existe aunque el dashboard lo invoca. No hay idempotencyKey en el ejecutor; el taskId se deriva de Date.now.

### Autorización y auditoría
El permiso es general por rol Desarrollador, no específico por comando. executedBy viene de payload.userId; correlationId se devuelve pero no se persiste. El fallback authRole del developer-service permanece documentado en AUD-NG-082.

## 3. Matriz de aceptación
| Criterio | Dictamen | Motivo |
|---|---|---|
| CA-096 consulta/filtro desde dashboard | Parcial | UI existe, pero backend central devuelve muestras y filtros no coinciden. |
| CA-097 limpieza con autorización y confirmación | Parcial | role gate presente; falta confirmación explícita. |
| CA-098 no eliminar auditoría protegida | No cumple | purgeStructuredLogs borra todas las filas de LogsSistema. |
| CA-099 comandos de catálogo permitido | Cumple | allowlist cerrada. |
| CA-100 solicitante/servicio/fecha/resultado/error registrados | No cumple | respuesta efímera, sin historial persistente ni actor verificado. |
| CA-101 estados pendientes/fallidas/completadas | No cumple | no hay cola/estados. |
| CA-102 repetición idempotente | No cumple | ejecutor no usa idempotencyKey. |
| CA-159 permisos específicos por comando | No cumple | permiso general de rol. |

## 4. Tareas ejecutables derivadas de los hallazgos
Se reutiliza el bloque canónico F6-010-A01..A06 de AUDITORIAS/AUDITORIA_COMPLETADAS_TAREA-F6-010.md:
1. F6-010-A01: consulta real y resolución persistente de logs.
2. F6-010-A02: retención segura y separación de auditorías protegidas.
3. F6-010-A03: handlers reales para catálogo cerrado.
4. F6-010-A04: cola durable, estados, cancelación y reanudación.
5. F6-010-A05: idempotencia y permisos por comando.
6. F6-010-A06: dashboard y pruebas de seguridad/retención.
Todas permanecen pendientes. No se crean IDs globales ni tareas locales duplicadas.

## 5. Cierre
- Dictamen TAREA-F6-035: NO CUMPLE.
- El estado [X] de completadas.md se conserva como histórico.
- El informe detallado y las tareas derivadas están en AUDITORIAS/AUDITORIA_COMPLETADAS_TAREA-F6-010.md.
- Este archivo mantiene la trazabilidad individual de F6-035.
- No se modificó código ni se ejecutaron purgas productivas.
- Siguiente tarea: TAREA-F6-011 y su registro ampliado TAREA-F6-036.
