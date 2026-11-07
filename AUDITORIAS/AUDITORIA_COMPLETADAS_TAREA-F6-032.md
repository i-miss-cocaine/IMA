# AUDITORÍA TÉCNICA - TAREA-F6-032: Despliegue configurable de microservicios académicos (alcance ampliado)

**Fecha:** 2026-11-07  
**Repositorio:** i-miss-cocaine/IMA  
**Rama:** NG_beta_0.0.0.1_work  
**Checkpoint inicial:** C1.223  
**Checkpoint de cierre:** C1.224  
**Sesión:** IMA-AUDIT-20261107-2115Z  
**Dictamen:** **NO CUMPLE**  
**Estado histórico en completadas.md:** [X] (se conserva sin modificación).

## 1. Relación con TAREA-F6-007
TAREA-F6-032 (completadas.md, líneas 3576-3608) repite el título de TAREA-F6-007 y amplía requisitos de aprovisionamiento, almacenamiento por rol/nivel, estados, OAuth, versionado y coordinaciones. Ambas carecían de informe individual. Se auditaron conjuntamente porque usan las mismas funciones y recursos. Este informe conserva la trazabilidad de F6-032 y reutiliza el bloque canónico F6-007-A01..A06 de AUDITORIAS/AUDITORIA_COMPLETADAS_TAREA-F6-007.md; no se crean tareas duplicadas.

Fuentes:
- completadas.md SHA f57f1aef832e81e44fc4f7ec36a852d50e464676, líneas 3576-3608.
- Pendientes.md blob SHA 631b4c2dbf0e86d5704b63625382d73ccb8ceb3c, recuperado íntegro.
- ChangesLogs.txt SHA 5b5cff1926b73a05d1b92087a7bf4b2db75326ff, líneas 2146-2153.
- Evidencia detallada de código y funciones: AUDITORIAS/AUDITORIA_COMPLETADAS_TAREA-F6-007.md.

## 2. Verificación de criterios ampliados

### Registro y despliegue de instancias
deployAcademicMicroserviceInstance solo crea/actualiza una fila en InstanciasMicroserviciosAcademicos. No crea proyecto Apps Script, deploymentId/URL, Spreadsheet ni Drive folder. scriptId/driveFolderId pueden quedar vacíos; spreadsheetId usa la base compartida; la función fija connectivityCheck=PASS y estado Activo. getAcademicMicroserviceDeployments solo lee esos metadatos.

### Configuración dinámica de niveles y almacenamiento
configureAcademicLevelsAndDynamicStorage sí existe y crea carpetas New Generation/Almacenamiento_Rol_<role>/Usuario_<user>, pero:
- No aplica ACL ni permisos por rol/usuario.
- No crea una estructura de Spreadsheet por área/instancia; NivelesAcademicosConfiguracion queda en el Spreadsheet compartido.
- Los cuatro niveles por defecto siguen hardcodeados.
- responsibilities no se utiliza; coordinationType y areaId solo se escriben en el log, no crean asignaciones.
- Las filas se actualizan in-place y ConfigID cambia con Date.now/random; no hay historial.
- No se usa LockService; una ejecución concurrente puede duplicar carpetas.
- El action está restringido al rol Desarrollador y no existe interfaz en developer-dashboard/js/developer.js para administrar esas configuraciones.

### Estados, fallos, OAuth y versionado
No existe una máquina de estados completa. deployAcademicMicroserviceInstance siempre escribe Activo; toggleCurricularAreaStatus permite Activo/Inactivo sin validar deployment ni pruebas. No hay reanudación, rollback, estado OAuth pendiente, historial de versiones ni auditoría append-only. Los fallos posteriores a la escritura inicial pueden dejar filas activas incompletas.

## 3. Matriz de aceptación
| Criterio | Dictamen | Motivo |
|---|---|---|
| CA-071 registro desde dashboard | No cumple | no existe formulario/handler frontend. |
| CA-072 configuración sin editar código | Parcial | se acepta academicLevels, pero defaults están hardcodeados y el catálogo no está sincronizado. |
| CA-073 recursos propios por instancia | No cumple | scriptId/driveFolderId vacíos permitidos y Spreadsheet compartido. |
| CA-074 inicialización idempotente | Parcial | fila/folders se reutilizan en secuencia; no hay aprovisionamiento ni lock. |
| CA-075 diagnóstico verificable | No cumple | connectivityCheck es PASS constante. |
| CA-076 instancia incompleta no activa | No cumple | finalState siempre Activo. |
| CA-077 configuración sin redespliegue | Parcial | niveles se escriben en hoja global, no en instancia ni en materias/coordinaciones. |
| CA-078 plantilla optativa sin afectar otras | No cumple | no hay historial/versiones ni mecanismo de actualización selectiva. |
| CA-079 auditoría de solicitante/fecha/resultado | Parcial | requestedBy/authRole vienen del payload y la fila se sobrescribe. |
| CA-154 coordinaciones/asignaciones iniciales | No cumple | responsibilities sin uso; coordinationType/areaId solo aparecen en log. |

## 4. Tareas derivadas
Se reutiliza el bloque canónico F6-007-A01..A06 de AUDITORIAS/AUDITORIA_COMPLETADAS_TAREA-F6-007.md:
1. F6-007-A01: aprovisionamiento real de proyectos y deployments.
2. F6-007-A02: máquina de estados, fallos, reanudación y rollback.
3. F6-007-A03: recursos/ACL aislados por instancia, nivel y rol.
4. F6-007-A04: idempotencia y consistencia bajo concurrencia.
5. F6-007-A05: versionado e historial de cambios/despliegues.
6. F6-007-A06: dashboard de despliegue y pruebas reales.
Todas permanecen pendientes. No se crean IDs globales ni tareas locales duplicadas.

## 5. Cierre
- Dictamen TAREA-F6-032: NO CUMPLE.
- El estado [X] de completadas.md se conserva como histórico.
- El informe detallado y las tareas derivadas están en AUDITORIAS/AUDITORIA_COMPLETADAS_TAREA-F6-007.md.
- Este archivo mantiene la trazabilidad individual de F6-032 y sus criterios ampliados.
- No se modificó código ni se ejecutaron despliegues productivos.
- Siguiente tarea: TAREA-F6-008 y su registro ampliado TAREA-F6-033.
