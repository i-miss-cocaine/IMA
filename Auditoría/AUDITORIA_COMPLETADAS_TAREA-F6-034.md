# AUDITORÍA TÉCNICA - TAREA-F6-034: Salud, diagnóstico, tráfico y errores en microservicios (alcance ampliado)

**Fecha:** 2026-11-07  
**Repositorio:** i-miss-cocaine/IMA  
**Rama:** NG_beta_0.0.0.1_work  
**Checkpoint inicial:** C1.225  
**Checkpoint de cierre:** C1.226  
**Sesión:** IMA-AUDIT-20261107-2210Z  
**Dictamen:** **NO CUMPLE**  
**Estado histórico en completadas.md:** [X] (se conserva sin modificación).

## 1. Relación con TAREA-F6-009
TAREA-F6-034 amplía el alcance de TAREA-F6-009 con el contrato común de diagnóstico, métricas de tráfico, registro de errores enriquecido, dashboard multi-servicio y mapa de dependencias. Ambas carecían de informe individual y se auditaron conjuntamente. Este informe conserva la trazabilidad de F6-034 y reutiliza el bloque canónico F6-009-A01..A06 de AUDITORIAS/AUDITORIA_COMPLETADAS_TAREA-F6-009.md; no se crean tareas duplicadas.

Fuentes:
- completadas.md SHA f57f1aef832e81e44fc4f7ec36a852d50e464676, líneas 3656-3693.
- Pendientes.md blob SHA 631b4c2dbf0e86d5704b63625382d73ccb8ceb3c, recuperado íntegro.
- ChangesLogs.txt SHA 5b5cff1926b73a05d1b92087a7bf4b2db75326ff, líneas 1979-1983.
- Evidencia detallada y SHAs: AUDITORIAS/AUDITORIA_COMPLETADAS_TAREA-F6-009.md.

## 2. Verificación de criterios ampliados

### Contrato de salud
USER/ACADEMIC/ACCOUNTING exponen ping con dbConnected:true constante; TASK/EXAM no tienen ping; DEVELOPER no tiene ping. Solo ACADEMIC y DEVELOPER exponen getServiceHealthDiagnostics, pero DEVELOPER devuelve PASS sin comprobar dependencias y ACADEMIC deja connectivity/permissions fijos y comprueba Drive root, no el folder específico. USER/getServiceHealthReport es un conteo histórico de LogsSistema, con versiones estáticas.

### Métricas y errores
USER/getOperationalCapacityMetrics depende de BitacoraTrazabilidad, pero recordTraceabilityLog no se invoca automáticamente desde cada solicitud. No hay medición completa de tráfico ni de ejecuciones GAS/cuotas reales; capacityUsagePct en ACADEMIC es fijo. Los logs no comparten contrato: TASK/EXAM carecen del logger estructurado revisado y la acción cliente recordStructuredLog no existe en el dispatcher USER.

### Sanitización y dashboard
sanitizePayloadForLog solo oculta claves de credenciales; no cubre PII/finanzas ni message. getStructuredLogs devuelve DTO en inglés, mientras el dashboard envía/espera campos en español. Los filtros de servicio/límite se ignoran, no hay filtros de área/versión/historial y se muestran fallbackLogs/sampleLogs cuando no hay datos reales. getCentralizedLogs y resolución son simulados.

### Dependencias y causa raíz
No hay una comprobación común que detecte endpoint faltante, incompatibilidad de contrato ni dependencia que impida una operación. El monitor consulta solo parte de los servicios y no construye un mapa de impacto.

## 3. Matriz de aceptación
| Criterio | Dictamen | Motivo |
|---|---|---|
| CA-088 contrato común en todos los servicios | No cumple | faltan endpoints/DTO comunes. |
| CA-089 consulta desde dashboard | Parcial | panel existe, pero cobertura y datos incompletos. |
| CA-090 diferencia conectividad/datos/documentos/lógica | Parcial | checks parciales y constantes. |
| CA-091 filtrar por servicio/módulo/fecha/severidad/categoría | No cumple | DTO/filtros no coinciden y faltan dimensiones. |
| CA-092 error enlazado a operación/versión | Parcial | functionName existe en logs, falta correlationId/version/resolución. |
| CA-093 métricas con fecha y sin valores inventados | No cumple | métricas incompletas y valores fijos. |
| CA-094 sin credenciales/documentos/PII | No cumple | sanitización limitada a algunas claves. |
| CA-095 diagnóstico no altera/bloquea operaciones | Parcial | mayormente lecturas, pero no se probó bajo fallos. |
| CA-158 detecta endpoints/contratos/dependencias faltantes | No cumple | no existe mapa ni verificación común. |

## 4. Tareas ejecutables derivadas de los hallazgos
Se reutiliza el bloque canónico F6-009-A01..A06 de AUDITORIAS/AUDITORIA_COMPLETADAS_TAREA-F6-009.md:
1. F6-009-A01: contrato común de salud para todos los servicios.
2. F6-009-A02: monitor y dashboard de disponibilidad.
3. F6-009-A03: telemetría real de tráfico/rendimiento/cuotas.
4. F6-009-A04: logs y trazabilidad con sanitización de PII.
5. F6-009-A05: DTO, filtros, historial y resolución.
6. F6-009-A06: pruebas de diagnóstico y mapa de dependencias.
Todas permanecen pendientes. No se crean IDs globales ni tareas locales duplicadas.

## 5. Cierre
- Dictamen TAREA-F6-034: NO CUMPLE.
- El estado [X] de completadas.md se conserva como histórico.
- El informe detallado y las tareas derivadas están en AUDITORIAS/AUDITORIA_COMPLETADAS_TAREA-F6-009.md.
- Este archivo mantiene la trazabilidad individual de F6-034 y sus criterios ampliados.
- No se modificó código ni se ejecutaron pruebas productivas.
- Siguiente tarea: TAREA-F6-010 y su registro ampliado TAREA-F6-035.
