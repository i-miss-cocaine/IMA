# AUDITORÍA TÉCNICA - TAREA-F6-007: Despliegue configurable de microservicios académicos

**Fecha:** 2026-11-07  
**Repositorio:** i-miss-cocaine/IMA  
**Rama:** NG_beta_0.0.0.1_work  
**Checkpoint inicial:** C1.223  
**Checkpoint de cierre:** C1.224  
**Sesión:** IMA-AUDIT-20261107-2115Z  
**Dictamen:** **NO CUMPLE**  
**Estado histórico en completadas.md:** [X] (se conserva sin modificación).

> Esta auditoría también cubre TAREA-F6-032, que repite el mismo título y amplía el alcance con configuración dinámica de niveles, almacenamiento y coordinaciones. Ambos registros están marcados [X] y carecían de informe individual. Se crean informes por ID, pero comparten un único bloque canónico F6-007-A01..A06 para evitar duplicar trabajo.

## 1. Continuidad y fuentes

- HEAD inicial: 510ddbe23393771e74e5652d52fab0fd40099e3d (C1.223), rama NG_beta_0.0.0.1_work.
- Comparación anterior con NG_beta_0.0.0.1: 291 commits adelante, 0 detrás. La rama base no se modifica.
- completadas.md SHA f57f1aef832e81e44fc4f7ec36a852d50e464676:
  - TAREA-F6-007 [X], líneas 2682-2711; ocho requisitos y CA-042..CA-045.
  - TAREA-F6-032 [X], líneas 3576-3608; mismo título, alcance ampliado y CA-071..CA-079/CA-154.
- Pendientes.md se recuperó desde blob SHA 631b4c2dbf0e86d5704b63625382d73ccb8ceb3c: 1.803.672 bytes, 1.782.094 caracteres, 20.182 líneas, sin U+FFFD. No contiene F6-007/F6-032; sí conserva AUD-NG-011 y AUD-NG-164 con tareas derivadas de despliegue/registro. No se modificó.
- ChangesLogs.txt SHA 5b5cff1926b73a05d1b92087a7bf4b2db75326ff:
  - líneas 1972-1975 afirma que deployAcademicMicroserviceInstance/getAcademicMicroserviceDeployments verifican despliegue e inicialización idempotente.
  - líneas 2146-2153 afirma que configureAcademicLevelsAndDynamicStorage crea almacenamiento dinámico y que deployAcademicMicroserviceInstance inicializa idempotentemente.
  - Las funciones existen, pero no realizan despliegue Apps Script ni aprovisionan recursos independientes.
- No existían AUDITORIAS/AUDITORIA_COMPLETADAS_TAREA-F6-007.md ni AUDITORIAS/AUDITORIA_COMPLETADAS_TAREA-F6-032.md; se crean ambos.
- Antecedente principal: AUD-NG-011 (registro de instancia no equivale a despliegue real; no aceptar PASS/Activo por defecto; verificar endpoint/ACL/recursos); se amplía, no se duplica.
- También se amplían AUD-NG-164 (catálogo curricular) y AUD-NG-158 (coordinaciones/ámbitos).

## 2. Archivos y evidencia inspeccionados

- backend/academic-service/Code.gs SHA df87a2eea9f0ef79d0b966d03fd5bbe432003df5, 14.449 líneas:
  - ROLE_PERMISSIONS/doPost: 165-240 y 870-902.
  - runCurricularAreaServiceTests/toggleCurricularAreaStatus: 4147-4245.
  - registerCurricularAreaExtension/getAcademicAreaTemplateCatalog: 4080-4146 y 4281-4320.
  - deployAcademicMicroserviceInstance: 4494-4575.
  - configureAcademicLevelsAndDynamicStorage: 4576-4649.
  - getAcademicMicroserviceDeployments: 4650-4685.
- developer-dashboard.html SHA 2b69f1bf7ffbbe4902e81de14d6315cedb035a1e, 481 líneas: no contiene formulario, acción ni vista para registrar/desplegar instancias académicas.
- js/developer.js SHA 6fa4c4bd9be580c974b1fbede4f0cf79485dc331, 552 líneas: no contiene llamadas a deployAcademicMicroserviceInstance/getAcademicMicroserviceDeployments/configureAcademicLevelsAndDynamicStorage.
- js/config.js SHA 49ef90807e5b9dfe1379f76d66efdb4ccd2b6cdc: líneas 214-215 instruyen crear manualmente un proyecto Apps Script y copiar Code.gs; SERVICE_URLS es estático.
- backend/developer-service/Code.gs SHA 8aa4bac67cfe5c8c54da51a0784a56fef633e412: no se encontró aprovisionamiento real de proyectos Apps Script.
- ACADEMIC/TASK/EXAM continúan usando un SPREADSHEET_ID compartido.

## 3. Hallazgos

### H1 - CRÍTICO/P0: deployAcademicMicroserviceInstance registra metadatos, no despliega un proyecto
En academic-service:4494-4575:
- No crea ni clona un proyecto Apps Script, no copia la plantilla, no crea una versión ni genera un deploymentId/URL.
- scriptId y driveFolderId son opcionales; se aceptan vacíos.
- spreadsheetId usa SPREADSHEET_ID compartido como fallback.
- No comprueba que los IDs pertenezcan a una instancia distinta ni que el endpoint sea accesible.
- diagnostics.connectivityCheck se fija literalmente en PASS; spreadsheetBinding/driveFolderBinding solo reflejan si el payload envió IDs.
- finalState se fija en Activo, incluso con scriptId/driveFolderId vacíos.
- El esquema InstanciasMicroserviciosAcademicos no tiene deploymentId, deploymentUrl, identidad de ejecución ni ACL verificadas.
- La función actualiza la fila existente por instanceId o agrega una fila; eso es idempotencia de metadatos, no de recursos desplegados.
**Impacto:** se informa una instancia activa que puede no tener proyecto, endpoint, base o carpeta propios. CA-042/CA-044/CA-071/CA-073/CA-075/CA-076 no se cumplen.

### H2 - CRÍTICO/P0: no existe formulario ni flujo de despliegue en el dashboard del desarrollador
- developer-dashboard.html y js/developer.js no contienen formulario ni handlers para registrar, configurar, desplegar, reanudar, suspender o retirar instancias académicas.
- js/config.js:214-215 conserva instrucciones de creación manual de proyectos Apps Script y copia manual de Code.gs.
- El backend expone acciones, pero no hay interfaz que reúna plantilla/versión, scriptId, Spreadsheet, Drive, asignaturas, coordinaciones y responsable.
**Impacto:** CA-042/CA-071 no se cumplen desde la plataforma; el flujo depende de intervención manual y no es una automatización de despliegue.

### H3 - ALTO/P1: estados, fallos, reanudación y rollback no están implementados
- deployAcademicMicroserviceInstance solo escribe EstadoDespliegue=Activo.
- No hay estados Borrador, Pendiente, Preparando, Desplegando, Validando, ConErrores, Suspendido o Retirado.
- No existe try/catch que registre ConErrores ni un checkpoint de pasos para reanudar.
- Si se escribe la fila de instancia y luego falla registerCurricularAreaExtension o el registro del evento, no hay rollback; la fila puede permanecer Activo.
- La función registra primero la instancia como Activo y después llama registerCurricularAreaExtension, que establece el área en Inactivo_PendientePruebas; ambos estados pueden quedar contradictorios.
- toggleCurricularAreaStatus convierte cualquier valor distinto de Activo en Inactivo y permite activar sin exigir una prueba/deployment vigente.
**Impacto:** los fallos no dejan diagnóstico/estado fiable y no hay recuperación segura. CA-044/CA-075/CA-076 no se cumplen.

### H4 - ALTO/P1: la inicialización dinámica crea carpetas y una hoja global, no recursos aislados por instancia
configureAcademicLevelsAndDynamicStorage (4576-4649):
- Crea New Generation/Almacenamiento_Rol_<role>/Usuario_<user> bajo Drive root; no crea carpeta por areaId/instanceId ni aplica ACL.
- Crea/actualiza NivelesAcademicosConfiguracion en el Spreadsheet compartido; no crea una base por nivel, área o instancia.
- responsibilities se recibe pero no se utiliza. coordinationType y areaId solo aparecen en el evento de log; no se persisten ni crean asignaciones/coordinaciones.
- Los niveles por defecto (Prebásica, Básica, Secundaria/BTP y Superior), carreras y grados están hardcodeados; academicLevels puede reemplazarlos, pero no existe versionado ni validación suficiente.
- ConfigID se genera con Date.now/random y la fila del nivel se actualiza in-place por nivelId; no se conserva historial.
- La creación de carpetas no utiliza LockService y puede duplicar carpetas bajo concurrencia.
**Impacto:** el requisito de almacenamiento dinámico por rol/usuario solo se cumple parcialmente; no hay aislamiento por instancia ni permisos. CA-073/CA-077/CA-154 no se cumplen.

### H5 - ALTO/P1: no hay historial de versiones ni actualización optativa de plantilla
- deployAcademicMicroserviceInstance actualiza la misma fila por instanceId; solo conserva la versión actual.
- No hay tabla append-only de versiones, diferencias, artefactos, estado de migración ni historial de rollback.
- No hay mecanismo para actualizar una instancia concreta manteniendo las demás sin cambios verificables.
- registerCurricularAreaExtension se invoca en cada despliegue y actualiza el catálogo compartido por areaId, estableciendo serviceUrl vacío y estado pendiente.
**Impacto:** no se puede demostrar qué versión de plantilla usa cada instancia ni controlar una actualización optativa. CA-045/CA-078 no se cumplen.

### H6 - ALTO/P1: autorización manual OAuth y trazabilidad del solicitante no están resueltas
- No existe un estado EsperandoAutorizacionOAuth ni una guía/continuación para el propietario de la cuenta.
- requestedBy/userId y payload.authRole son valores enviados por el cliente; no se guardan a partir de una identidad verificada.
- La fila se sobrescribe en actualizaciones, por lo que no hay historial de quién creó, modificó, suspendió o retiró una instancia.
- logStructuredEvent registra eventos, pero no sustituye un historial inmutable con actor verificado, cambio anterior/nuevo, resultado y correlationId.
**Impacto:** no se acredita autorización manual segura ni auditoría completa. CA-079/CA-154 no se cumplen.

### H7 - ALTO/P1: configureAcademicLevelsAndDynamicStorage no configura realmente coordinaciones ni responsabilidades
- roleName y userId generan carpetas, pero no se aplican ACL ni validación de pertenencia.
- responsibilities se declara pero queda sin uso.
- coordinationType y areaId solo se registran en el log; no se insertan en CoordinacionesArea ni en una tabla de asignaciones.
- El action está disponible para Desarrollador, pero no existe flujo en dashboard para configurar coordinaciones iniciales desde la plataforma.
**Impacto:** CA-154 no se cumple; los niveles y carpetas no representan una configuración operativa de instancia.

## 4. Matriz de requisitos

### TAREA-F6-007 (R1-R8, CA-042..CA-045)
| Requisito | Dictamen | Motivo |
|---|---|---|
| R1 formulario de registro en dashboard | No cumple | developer-dashboard/js/developer.js no contienen el formulario ni handlers. |
| R2 cambios configurativos sin redespliegue | Parcial | existe configuración de niveles, pero no de materias/secciones/docentes por instancia. |
| R3 inicialización idempotente de recursos | Parcial | actualiza una fila y busca carpetas; no aprovisiona proyecto/base/endpoint ni usa lock. |
| R4 estados explícitos | No cumple | deploy fija Activo; toggle solo Activo/Inactivo. |
| R5 reanudar fallos sin duplicar/perder datos | No cumple | no hay estado de paso, reanudación ni rollback. |
| R6 autorización manual OAuth | No cumple | no hay estado ni paso de autorización. |
| R7 historial de versiones | No cumple | fila de instancia sobrescrita; sin versionado append-only. |
| R8 auditoría de solicitante/fecha/resultado | Parcial | hay campos/log, pero solicitante/rol vienen del payload y no existe historial de cambios. |
| CA-042 | No cumple | no se registra/inicializa desde un dashboard funcional. |
| CA-043 | Parcial | solo idempotencia de metadatos/carpetas en secuencia; no de recursos reales. |
| CA-044 | No cumple | se marca Activo/PASS aunque falten recursos. |
| CA-045 | No cumple | no hay historial ni actualización optativa aislada. |

### TAREA-F6-032 (alcance ampliado, CA-071..CA-079 y CA-154)
| Criterio | Dictamen | Motivo |
|---|---|---|
| CA-071 registro desde dashboard | No cumple | no existe formulario/handler frontend. |
| CA-072 configuración sin editar nombres en código | Parcial | se puede enviar academicLevels, pero hay defaults hardcodeados y catálogo de áreas estático. |
| CA-073 recursos propios por instancia | No cumple | Spreadsheet compartido, scriptId/driveFolderId opcionales, sin proyecto ni endpoint. |
| CA-074 inicialización idempotente | Parcial | actualiza fila y busca carpetas, pero no aprovisiona recursos ni protege concurrencia. |
| CA-075 fallos con estado/diagnóstico verificable | No cumple | PASS constante y sin estado de error. |
| CA-076 instancia incompleta no aparece activa | No cumple | siempre finalState Activo. |
| CA-077 cambios configurativos sin redespliegue | Parcial | niveles se escriben en hoja global; no se enlazan a instancia ni cubren materias/coordinaciones. |
| CA-078 actualización de plantilla no afecta otras | No cumple | no hay versionado ni política de actualización optativa. |
| CA-079 auditoría solicitante/fecha/resultado | Parcial | campos/log existen, pero actor no verificado y fila se sobrescribe. |
| CA-154 coordinaciones/asignaciones iniciales | No cumple | responsibilities sin uso; coordinationType/areaId solo se registran en log. |

## 5. Reconciliación con auditorías existentes

No se crean IDs globales AUD-NG nuevos.
- AUD-NG-011: despliegue real, recursos, endpoint/URL, ACL, estados, diagnóstico, activación tras pruebas, aislamiento y sincronización de baja. Confirmado vigente.
- AUD-NG-164: catálogo canónico, serviceUrl, versionado y estados.
- AUD-NG-158: coordinaciones y asignaciones por ámbito.
- F6-006-A02/A06: despliegue real por instancia y pruebas E2E; se mantiene como dependencia.
- TAREA-F6-032: expansión de F6-007; ambos informes individuales referencian el mismo bloque canónico de tareas.

## 6. Tareas ejecutables derivadas de los hallazgos

Los siguientes IDs son locales a esta auditoría. TAREA-F6-032 referencia este mismo bloque.

### F6-007-A01 - Implementar aprovisionamiento real de proyectos y deployments
- **Origen:** H1 y H2.
- **Prioridad:** P0 / Crítico.
- **Acción:** integrar Apps Script API/flujo OAuth para crear o seleccionar proyecto, publicar versión/deployment, registrar deploymentId/URL/propietario y validar endpoint; crear Spreadsheet y Drive folder únicos.
- **Criterios:** proyecto y endpoint verificables; recursos únicos por instancia; sin fallback compartido; la interfaz muestra resultado real.
- **Referencias:** AUD-NG-011 y F6-006-A02.
- **Estado:** Pendiente.

### F6-007-A02 - Implementar máquina de estados, fallos, reanudación y rollback
- **Origen:** H3.
- **Prioridad:** P1 / Alto.
- **Acción:** definir estados y transiciones válidas; guardar paso actual, error, retryCount y checkpoints; reanudar sin duplicar; compensar o revertir recursos parciales; esperar OAuth manual cuando corresponda.
- **Criterios:** instancia incompleta nunca está Activa; fallos conservan diagnóstico; reintentos seguros; OAuth no se simula como éxito.
- **Estado:** Pendiente.

### F6-007-A03 - Aprovisionar recursos y permisos aislados por instancia/nivel/rol
- **Origen:** H4 y H7.
- **Prioridad:** P1 / Alto.
- **Acción:** crear Drive folder y Spreadsheet por instancia; aplicar ACL por rol/área; asociar niveles y coordinaciones mediante IDs; usar responsibilities/coordinationType/areaId en la configuración real; no usar root/shared storage como fallback silencioso.
- **Criterios:** cada instancia tiene recursos propios; coordinaciones iniciales se persisten; los permisos se verifican; no se exponen carpetas por herencia pública.
- **Referencias:** AUD-NG-011, AUD-NG-158 y F6-006-A02.
- **Estado:** Pendiente.

### F6-007-A04 - Garantizar idempotencia y consistencia bajo concurrencia
- **Origen:** H1, H3 y H4.
- **Prioridad:** P1 / Alto.
- **Acción:** usar locks/keys de idempotencia por instancia y recurso; comprobar existencia y propiedad de proyecto/Spreadsheet/Drive; ejecutar pasos con transacciones/compensaciones; reconciliar recursos huérfanos.
- **Criterios:** reejecutar no duplica proyectos, carpetas, hojas ni coordinaciones; llamadas concurrentes convergen al mismo resultado; fallos parciales se reanudan.
- **Estado:** Pendiente.

### F6-007-A05 - Versionar plantillas e historial de cambios/despliegues
- **Origen:** H5 y H6.
- **Prioridad:** P1 / Alto.
- **Acción:** mantener versiones append-only por instancia; registrar artefacto/commit/versión anterior/nueva, solicitante verificado, fecha, cambios, resultado y rollback; separar actualización de plantilla de despliegue.
- **Criterios:** cada instancia conserva su versión; actualizar una no altera otras; rollback verificable; actor no proviene del payload.
- **Estado:** Pendiente.

### F6-007-A06 - Crear dashboard de despliegue y pruebas reales
- **Origen:** H2, H3, H6 y H7.
- **Prioridad:** P1 / Alto.
- **Acción:** implementar formulario y panel para registrar, configurar, desplegar, validar, reanudar, suspender y retirar instancias; mostrar OAuth pendiente y diagnóstico; ejecutar pruebas reales de endpoint, RBAC, Spreadsheet, Drive y aislamiento.
- **Criterios:** interfaz operativa; pruebas no son constantes PASS; estado Activo solo con evidencia; historial visible y auditable.
- **Referencias:** TAREA-F6-003-A09, AUD-NG-011 y AUD-NG-164.
- **Estado:** Pendiente.

## 7. Cierre
- TAREA-F6-007: NO CUMPLE.
- TAREA-F6-032: NO CUMPLE; mismo título con criterios ampliados.
- Ambos estados [X] de completadas.md se conservan como histórico.
- Pendientes.md se recuperó desde el blob íntegro y no se modificó.
- Se crean informes individuales para ambos IDs con un único bloque canónico F6-007-A01..A06.
- No se modificó código, configuración, dashboard, tests ni datos productivos.
- No se ejecutaron Apps Script API, OAuth, despliegues, Drive/Sheets productivas ni pruebas E2E.
- Siguiente tarea secuencial: TAREA-F6-008 y su registro ampliado TAREA-F6-033, plano de control y registro central de servicios; localizar informes e historial antes de auditar.

## 8. Referencias
- completadas.md SHA f57f1aef832e81e44fc4f7ec36a852d50e464676, líneas 2682-2711 y 3576-3608.
- Pendientes.md blob SHA 631b4c2dbf0e86d5704b63625382d73ccb8ceb3c.
- ChangesLogs.txt SHA 5b5cff1926b73a05d1b92087a7bf4b2db75326ff, líneas 1972-1975 y 2146-2153.
- backend/academic-service/Code.gs SHA df87a2eea9f0ef79d0b966d03fd5bbe432003df5.
- developer-dashboard.html SHA 2b69f1bf7ffbbe4902e81de14d6315cedb035a1e.
- js/developer.js SHA 6fa4c4bd9be580c974b1fbede4f0cf79485dc331.
- js/config.js SHA 49ef90807e5b9dfe1379f76d66efdb4ccd2b6cdc.
- backend/developer-service/Code.gs SHA 8aa4bac67cfe5c8c54da51a0784a56fef633e412.
