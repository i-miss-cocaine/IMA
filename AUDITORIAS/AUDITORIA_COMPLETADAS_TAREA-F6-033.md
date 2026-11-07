# AUDITORÍA TÉCNICA - TAREA-F6-033: Microservicio central del desarrollador y registro de servicios (alcance ampliado)

**Fecha:** 2026-11-07  
**Repositorio:** i-miss-cocaine/IMA  
**Rama:** NG_beta_0.0.0.1_work  
**Checkpoint inicial:** C1.224  
**Checkpoint de cierre:** C1.225  
**Sesión:** IMA-AUDIT-20261107-2140Z  
**Dictamen:** **NO CUMPLE**  
**Estado histórico en completadas.md:** [X] (se conserva sin modificación).

## 1. Relación con TAREA-F6-008
TAREA-F6-033 (completadas.md, líneas 3609-3655) repite el título de TAREA-F6-008 y amplía el alcance del registro, estados, diagnóstico, trazabilidad, roles y control de comandos. Ambas carecían de informe individual. Se auditaron conjuntamente porque comparten los mismos servicios y contrato. Este informe conserva la trazabilidad de F6-033 y reutiliza el bloque canónico F6-008-A01..A06 de AUDITORIAS/AUDITORIA_COMPLETADAS_TAREA-F6-008.md; no se crean tareas duplicadas.

Fuentes:
- completadas.md SHA f57f1aef832e81e44fc4f7ec36a852d50e464676, líneas 3609-3655.
- Pendientes.md blob SHA 631b4c2dbf0e86d5704b63625382d73ccb8ceb3c, recuperado íntegro.
- ChangesLogs.txt SHA 5b5cff1926b73a05d1b92087a7bf4b2db75326ff, líneas 1975-1979.
- Evidencia de código y SHAs: AUDITORIAS/AUDITORIA_COMPLETADAS_TAREA-F6-008.md.

## 2. Verificación de criterios ampliados

### Registro y estado
getCentralServiceRegistry devuelve seis servicios hardcodeados como Activos si la hoja está vacía o falla; los defaults comparten Spreadsheet y omiten endpoint, Drive, dependencias y último contacto. Los registros personalizados no tienen estado administrativo y operativo separados ni lastContact. registerServiceInstance permite endpoint vacío, Spreadsheet compartido y permisos wildcard por defecto. updateServiceStatus registra historial, pero actualiza una sola columna state y toma updatedBy del payload.

### Contrato y trazabilidad
createInterServiceEnvelope/verifyInterServiceEnvelope están definidos, pero no son consumidos por fetchApi/doPost. js/api.js no propaga correlationId ni idempotencyKey. auditInterServiceCalls retorna auditLogs vacío. recordTraceabilityLog persiste una fila, pero no se invoca automáticamente. fetchApi tiene timeout y reintentos de red, pero no evita duplicar escrituras cuando el servidor ya procesó una solicitud.

### Roles y responsabilidades
manageUserMultiRolePermissions devuelve los roles/áreas recibidos sin persistirlos. El token de user-service contiene un solo role; assignRoleScope no se integra con las autorizaciones de cada servicio. No se conserva historial verificable de cambios de permisos por área/operación.

### Independencia y comandos
Los servicios operativos se invocan directamente por SERVICE_URLS; no se identificó una dependencia obligatoria del plano de control, por lo que la separación es parcial y requiere prueba de caída. executeOperationalCommand valida una allowlist y no ejecuta código arbitrario, pero devuelve un resultado sintético sin handler operativo real.

## 3. Matriz de aceptación
| Criterio | Dictamen | Evidencia |
|---|---|---|
| CA-080 dashboard muestra registro/configuración | No cumple | no hay UI ni handlers del registro. |
| CA-081 identificador estable | Parcial | IDs por defecto estables; altas personalizadas dependen del cliente y carecen de lock. |
| CA-082 estado administrativo/operativo | No cumple | una sola columna state. |
| CA-083 detectar estado obsoleto | No cumple | sin lastContact/lastHealthCheck. |
| CA-084 correlationId/resultado | No cumple | envelope sin integración; auditInterServiceCalls vacío. |
| CA-085 diferenciar errores | Parcial | cliente diferencia algunos fallos, backend no tiene taxonomía común. |
| CA-086 plano central fuera de línea | Parcial | routing directo, no se probó caída real. |
| CA-087 prohibir código arbitrario | Cumple | allowlist cerrada, sin eval/Function; handler simula resultado. |
| CA-155 multirol sin duplicar identidad | No cumple | helper echo y JWT de rol único. |
| CA-156 roles relacionados con áreas/servicios | No cumple | ámbitos no integrados a enforcement. |
| CA-157 cambios auditados y validados | Parcial | historial de estado parcial, actor no verificado y permisos no versionados. |

## 4. Tareas derivadas
Se reutiliza el bloque canónico F6-008-A01..A06 de AUDITORIAS/AUDITORIA_COMPLETADAS_TAREA-F6-008.md:
1. F6-008-A01: completar registro central y ciclo de vida.
2. F6-008-A02: integrar contrato común correlationId/HMAC/idempotencia.
3. F6-008-A03: integrar trazabilidad persistente.
4. F6-008-A04: implementar multirol y responsabilidades con validación backend.
5. F6-008-A05: dashboard y pruebas de independencia.
6. F6-008-A06: comandos reales y pruebas de contrato.
Todas permanecen pendientes. No se crean IDs globales ni tareas locales duplicadas.

## 5. Cierre
- Dictamen TAREA-F6-033: NO CUMPLE.
- El estado [X] de completadas.md se conserva como histórico.
- El informe detallado y las tareas derivadas están en AUDITORIAS/AUDITORIA_COMPLETADAS_TAREA-F6-008.md.
- Este archivo mantiene la trazabilidad individual de F6-033 y sus criterios ampliados.
- No se modificó código ni se ejecutaron pruebas productivas.
- Siguiente tarea: TAREA-F6-009 y su registro ampliado TAREA-F6-034.
