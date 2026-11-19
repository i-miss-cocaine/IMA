# Auditoría de completadas.md - TAREA-05

**Fecha:** 2026-11-05  
**Rama:** NG_beta_0.0.0.1_work  
**Tarea:** Consolidar la arquitectura de servicios por departamento y la administración de cuentas  
**Fuente:** completadas.md, SHA f57f1aef832e81e44fc4f7ec36a852d50e464676  
**HEAD de referencia:** 3c8081a2ce51f47e496305521ff3ad81a7158db4

## Dictamen

**CUMPLE PARCIALMENTE.** Hay mapas declarativos de versiones, responsabilidades y servicios por departamento, pero no se acredita una arquitectura institucional operativa con identidades de administración/despliegue/ejecución, permisos efectivos por recurso, aislamiento de datos ni comunicación segura real entre servicios. Existen endpoints y recursos placeholder, registros ficticios y configuración departamental estática. Las brechas ya están cubiertas por tareas pendientes; no se crea un nuevo AUD-NG.

## Evidencia

1. ChangesLogs.txt (SHA d57cf4bd861b5c3720e60cf83241ed804ff645d9) atribuye a TAREA-05 únicamente la incorporación de SERVICE_VERSIONS y DEPARTMENT_SERVICES_MAP en js/config.js; no registra cambios en los cinco archivos backend incluidos en el alcance.
2. SERVICE_VERSIONS define cinco servicios en 1.0.0 y omite DEVELOPER; SERVICE_REGISTRY declara seis servicios en v8.4.0 y ACTIVE, con recursos de ejemplo. Hay contradicción de versiones y estados no verificados.
3. SERVICE_URLS tiene endpoints placeholder para ACCOUNTING y DEVELOPER. Los problemas de disponibilidad y URL están cubiertos por AUD-NG-131 y AUD-NG-144.
4. DEPARTMENT_SERVICES_MAP, getDepartmentalDependencyMap y CURRICULAR_SPECIALIZED_SERVICES son mapas estáticos. No demuestran que una nueva área pueda incorporarse mediante configuración sin editar código.
5. Los cinco archivos backend (USER, ACADEMIC, ACCOUNTING, TASK y EXAM) declaran el mismo SPREADSHEET_ID. No se demuestra separación de almacenamiento por servicio/departamento. Tampoco es posible determinar desde el repositorio qué identidad real ejecuta cada despliegue ni las ACL efectivas de hojas, carpetas y documentos.
6. registerSpreadsheetSource/resolveSpreadsheetSource (USER/ACADEMIC/ACCOUNTING) resuelven por dominio y año lectivo; ignoran departamento/servicio en la búsqueda y hacen fallback al Spreadsheet principal. Esto ya está en AUD-NG-075/076/077.
7. deployAcademicMicroserviceInstance solo registra metadatos en una hoja. scriptId, spreadsheetId y driveFolderId son opcionales; fija connectivityCheck en PASS, declara Activo y registra MICROSERVICE_DEPLOYED sin crear ni comprobar una implementación real.
8. En DEVELOPER, registerServiceInstance admite propietario y recursos enviados en payload, pero usa valores predeterminados y permisos wildcard cuando faltan. getCentralServiceRegistry devuelve registros de ejemplo con status success cuando el catálogo está vacío o falla. updateServiceStatus confía en updatedBy recibido del cliente. Esto está cubierto por AUD-NG-078/079/080.
9. createInterServiceEnvelope/verifyInterServiceEnvelope solo aparecen como definiciones en USER/ACADEMIC/ACCOUNTING; TASK/EXAM no tienen esas funciones. No se encontraron llamadas UrlFetchApp.fetch en los cinco servicios revisados. La autenticación interservicio y la gestión de secretos ya están en AUD-NG-083/084/085/086.
10. Los cinco servicios implementan un fallback de secreto determinista basado en el identificador de Spreadsheet compartido. No es una credencial independiente por servicio; ya está registrado en AUD-NG-084.
11. Las instrucciones de despliegue describen proyectos Apps Script separados y acceso web público, pero no identifican la cuenta propietaria, administradora o ejecutora ni el procedimiento de sustitución/recuperación de administradores.
12. No hay evidencia en el repositorio de permisos efectivos por documento/carpeta, Shared Drives, delegación de Workspace o configuración "ejecutar como". Estos puntos no pueden confirmarse sin revisar la consola real de Google Workspace/Apps Script.

## Tareas existentes relacionadas

- AUD-NG-075/076/077: particiones, dimensiones de resolución, permisos y fallback de fuentes.
- AUD-NG-078/079/080/081/082: propietario/identidad de servicios, mínimo privilegio, catálogo real, historial, pruebas multicuenta y autenticación del plano de control.
- AUD-NG-083/084/085/086: tráfico interservicio, secretos, anti-replay y autorización por acción/versión.
- AUD-NG-131/AUD-NG-144: endpoints reales y health checks.
- TASK-064: consumo de cuotas por servicio/identidad.
- No se crea un hallazgo duplicado. Se amplían criterios existentes en Pendientes.md para incluir identidad de ejecución, recuperación de cuentas, evaluación de Shared Drives/delegación y onboarding departamental.

## Calidad y límites

Calidad **insuficiente** para declarar la tarea completada: mapas estáticos y contradictorios, recursos placeholder, despliegue simulado, ausencia de evidencia de cuentas/ACL reales y comunicación interservicio no integrada.

La revisión fue estática. No se accedió a consolas de Apps Script/Google Workspace, deployments, permisos de Drive/Sheets ni cuentas reales; tampoco se ejecutaron pruebas entre despliegues. No se modificó código fuente ni datos productivos.

## Restricciones

No se modifican código fuente, completadas.md, ChangesLogs.txt ni METODOLOGIA_DESARROLLO.md. La rama base permanece intacta y no se hace merge.


---

## Tareas ejecutables derivadas de los hallazgos

> No se crea un AUD-NG nuevo. Este informe amplía criterios de tareas existentes y distribuye los hallazgos por responsabilidad para evitar duplicar partición de datos, identidad, autenticación interservicio, disponibilidad y observabilidad.

### [AUD-NG-075 / AUD-NG-076 / AUD-NG-077] Resolver fuentes de datos por departamento y servicio
- **Hallazgo de origen:** evidencia 5 y 6; los servicios comparten SPREADSHEET_ID, la resolución usa dominio/año lectivo, ignora departamento/servicio y recurre al Spreadsheet principal.
- **Acción ejecutable:** completar el modelo de partición y resolución para que departamento, servicio, dominio y año lectivo participen según el contrato definido; validar permisos y pertenencia de cada fuente antes de utilizarla; eliminar fallback silencioso a una fuente compartida cuando no exista una coincidencia autorizada.
- **Criterios de aceptación:** cada fuente resuelta corresponde al departamento/servicio solicitado y a una identidad autorizada; las fuentes inexistentes, ambiguas o no autorizadas producen error explícito y no acceden al Spreadsheet principal por defecto; las pruebas cubren separación entre departamentos y servicios.
- **Estado/prioridad:** conservar los valores vigentes de cada tarea; no se reespecifican aquí.

### [AUD-NG-078 / AUD-NG-079 / AUD-NG-080 / AUD-NG-081 / AUD-NG-082] Asegurar identidad, propiedad, mínimo privilegio y administración del registro de servicios
- **Hallazgo de origen:** evidencia 7, 8, 11 y 12; registro de despliegue simulado, recursos opcionales, defaults y permisos wildcard, catálogo de ejemplo y confianza en updatedBy del payload; ausencia de evidencia sobre propietarios, ejecutores y recuperación de administradores.
- **Acción ejecutable:** exigir y verificar los identificadores reales de proyecto/deployment/recursos e identidad propietaria, administradora y ejecutora; sustituir valores de ejemplo y estados PASS/Activo no verificados por comprobaciones reales; aplicar permisos explícitos de mínimo privilegio; derivar el actor desde la identidad autenticada y no desde el payload; mantener catálogo real e historial de cambios; documentar y probar recuperación/sustitución de cuentas administrativas y onboarding de nuevas áreas.
- **Criterios de aceptación:** ningún servicio se registra como activo sin comprobar deployment, endpoint y recursos requeridos; propietario/ejecutor/administrador quedan identificados y autorizados; el catálogo no devuelve registros ficticios como success; cambios de estado registran actor verificado e historial; no existen permisos wildcard por omisión; se documentan y validan procedimientos de recuperación de administradores y alta de áreas.
- **Estado/prioridad:** conservar los valores vigentes de cada tarea; no se reespecifican aquí.

### [AUD-NG-083 / AUD-NG-084 / AUD-NG-085 / AUD-NG-086] Integrar comunicación interservicio autenticada y protección de secretos
- **Hallazgo de origen:** evidencia 9 y 10; sobres definidos pero no invocados, ausencia de llamadas de transporte interservicio en los servicios revisados y secreto determinista compartido.
- **Acción ejecutable:** integrar el transporte real entre servicios; establecer credenciales independientes y protegidas por servicio; validar autenticidad, integridad, anti-replay, acción y versión en el receptor; retirar el fallback determinista compartido; aplicar autorización por operación y registrar fallos sin exponer secretos.
- **Criterios de aceptación:** las llamadas entre deployments utilizan el contrato autenticado y verificable; los cinco servicios aplicables validan solicitudes entrantes; las credenciales no se derivan de IDs públicos ni se devuelven al cliente; solicitudes repetidas, expiradas, alteradas o no autorizadas se rechazan; las pruebas cubren comunicación y permisos entre servicios.
- **Estado/prioridad:** conservar los valores vigentes de cada tarea; no se reespecifican aquí.

### [AUD-NG-131 / AUD-NG-144] Corregir endpoints reales y comprobar disponibilidad
- **Hallazgo de origen:** evidencia 2 y 3; endpoints placeholder para ACCOUNTING/DEVELOPER y versiones/estados de servicio contradictorios o no verificados.
- **Acción ejecutable:** sustituir placeholders por endpoints reales de deployments autorizados; normalizar el registro de servicios/versiones y verificar la disponibilidad real de cada endpoint, sin inferir estado activo a partir de configuración declarativa.
- **Criterios de aceptación:** los servicios registrados tienen URL y versión verificadas; no quedan placeholders en rutas activas; health checks consultan deployments reales y distinguen fallo, degradación y ausencia de configuración.
- **Estado/prioridad:** conservar los valores vigentes de cada tarea; no se reespecifican aquí.

### [TASK-064] Incorporar consumo de cuotas por servicio e identidad en observabilidad
- **Hallazgo de origen:** relación explícita en el apartado de tareas existentes; consumo de cuotas por servicio/identidad.
- **Acción ejecutable:** integrar en la observabilidad existente métricas de consumo atribuibles a servicio e identidad, conservando la medición real y las alertas dentro del alcance de TASK-064. No crear un monitor paralelo.
- **Criterios de aceptación:** los datos de capacidad permiten identificar el servicio/identidad responsable y se presentan con fuente y periodo verificables; se conservan los criterios vigentes de TASK-064.
- **Estado/prioridad:** conservar los valores vigentes de TASK-064.

### Reconciliación y límites
- AUD-NG-075/076/077 conservan partición, resolución y permisos de fuentes.
- AUD-NG-078/079/080/081/082 conservan identidad, propiedad, catálogo, historial, pruebas multicuenta y control administrativo.
- AUD-NG-083/084/085/086 conservan tráfico interservicio, secretos, anti-replay y autorización por acción/versión.
- AUD-NG-131/AUD-NG-144 conservan URLs reales, disponibilidad y health checks; TASK-064 conserva cuotas/capacidad por servicio e identidad.
- No se crean identificadores nuevos ni se declara ejecutada ninguna corrección. TAREA-05 permanece en CUMPLE PARCIALMENTE.
- **Límites:** inspección estática/manual. No se revisaron consolas reales de Google Workspace/Apps Script, deployments, ACL de Drive/Sheets, cuentas propietarias/ejecutoras ni tráfico entre servicios; tampoco se ejecutaron pruebas multicuenta o entre deployments.
