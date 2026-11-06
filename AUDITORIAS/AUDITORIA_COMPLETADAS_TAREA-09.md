# Auditoría TAREA-09

Fecha: 2026-11-05  
Rama: NG_beta_0.0.0.1_work  
Dictamen: **CUMPLE PARCIALMENTE**.

## Evidencia

- ChangesLogs.txt solo registra CURRICULAR_SPECIALIZED_SERVICES en js/config.js; no documenta creación de proyectos/deployments por área ni cambios en task-service, exam-service o api.js.
- CURRICULAR_SPECIALIZED_SERVICES declara 12 claves, nombres y listas de herramientas, pero no contiene scriptId, deploymentId, endpoint, propietario, fuente de datos ni permisos.
- js/api.js usa SERVICE_URLS y fetchApi solo resuelve servicios genéricos; no consulta CURRICULAR_SPECIALIZED_SERVICES ni enruta por areaId.
- deployAcademicMicroserviceInstance registra metadatos, acepta scriptId opcional, deja serviceUrl vacío, fija connectivityCheck PASS y estado Activo sin crear ni comprobar un deployment real.
- runCurricularAreaServiceTests devuelve PASS constante para conectividad, RBAC, integridad y esquema; puede activar el área sin ejecutar esas pruebas.
- createTask no persiste areaId y createExam tampoco lo incorpora. No se demuestra aislamiento de tareas/exámenes por área.
- Las herramientas especializadas son identificadores declarativos; no hay dispatch/implementación especializada verificada en el mapa ni en api.js.
- Los cinco servicios siguen usando un Spreadsheet común; no hay evidencia de fuente/ACL independiente por área.

## Relación con tareas existentes

AUD-NG-011 ya exige evidencia de despliegue, fuente de datos, permisos, contratos y pruebas de aislamiento por área. Se amplía su aceptación para exigir deployment real, routing por área, pruebas ejecutadas (no PASS fijo) y areaId persistido/validado en tareas y exámenes. Se relaciona además con AUD-NG-078/079 (registro real), AUD-NG-083/084/086 (HMAC, secretos y autorización), AUD-NG-131/AUD-NG-144 (endpoints y health checks) y AUD-NG-164 (catálogo curricular). No se crea un nuevo AUD-NG.

## Calidad y límites

Calidad insuficiente por catálogo estático, despliegue simulado y pruebas PASS ficticias. Auditoría estática; no se ejecutaron despliegues reales ni pruebas de RBAC, aislamiento, herramientas especializadas o persistencia de datos. No se modificó código fuente, completadas.md ni ChangesLogs.txt.


## Addendum de integridad documental (2026-11-05)
Durante la verificación del commit se detectó que Pendientes.md había sido reemplazado por una lectura parcial de 478 caracteres. Se restauró desde el blob completo previo a TAREA-09 (1,515,247 caracteres), conservando todos los registros y añadiendo la ampliación de AUD-NG-011. No se reescribió historia ni se modificó la rama base.
