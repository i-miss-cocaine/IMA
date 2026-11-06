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
