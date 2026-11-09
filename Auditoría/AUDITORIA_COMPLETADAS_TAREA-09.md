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


## Tareas ejecutables derivadas de los hallazgos

**AUD-NG-011 - Aislamiento curricular por área y despliegues especializados verificables**

**Ampliación derivada de TAREA-09 (sin crear un nuevo identificador):**
- Mantener el requisito original de demostrar aislamiento operativo por área curricular. La existencia de claves o herramientas declarativas en `CURRICULAR_SPECIALIZED_SERVICES` no demuestra que existan microservicios desplegados ni que sus datos y permisos estén aislados.
- Registrar para cada área el proyecto/script real, `scriptId`, `deploymentId`, URL de endpoint, versión desplegada, propietario e identidad de ejecución, fuente de datos y permisos/ACL aplicables. Los campos no pueden quedar vacíos ni sustituirse por valores de ejemplo.
- Hacer que el despliegue cree o verifique un deployment real y compruebe su endpoint. No asignar `PASS`, `Activo` o `healthy` por constantes ni permitir activar un área si no existe evidencia de conectividad y configuración válidas.
- Enrutar las llamadas mediante `areaId` y el registro validado de servicios por área. El cliente no debe resolver únicamente URLs genéricas ni ignorar `CURRICULAR_SPECIALIZED_SERVICES`.
- Persistir `areaId` en las entidades de tareas y exámenes; validar que el área exista, esté activa y corresponda al contexto autorizado antes de crear, consultar o modificar esos registros.
- Implementar un dispatch verificable entre cada herramienta especializada declarada y su función/endpoint real. Rechazar herramientas no registradas o sin implementación; no presentar una clave declarativa como funcionalidad disponible.
- Acreditar la separación de fuentes de datos y ACL por área, o documentar de forma verificable el modelo de aislamiento adoptado. El uso compartido de un Spreadsheet sin partición/autorización efectiva no acredita aislamiento.
- Sustituir `runCurricularAreaServiceTests` y cualquier comprobación constante por pruebas ejecutadas contra los deployments reales. Las pruebas deben cubrir conectividad, autorización, integridad de esquema, persistencia de `areaId`, rechazo de acceso cruzado y aislamiento entre áreas; conservar resultados y evidencia reproducible.
- Impedir que un área se active o se anuncie como disponible cuando fallen el deployment, el endpoint, la autorización, la fuente de datos o las pruebas de aislamiento.

**Reconciliación de responsabilidades:**
- `AUD-NG-078/079`: conservan el registro e identidad real de servicios/despliegues; AUD-NG-011 exige que esa evidencia exista y demuestre aislamiento por área.
- `AUD-NG-083/084/086`: conservan sobres HMAC, secretos y autorización interservicio; no se duplican aquí.
- `AUD-NG-131/AUD-NG-144`: conservan endpoints, health checks y verificación de disponibilidad; AUD-NG-011 exige que sus resultados se apliquen a los servicios curriculares por área.
- `AUD-NG-164`: conserva el catálogo curricular maestro y la validez de áreas/programas/asignaturas/planes/ofertas; AUD-NG-011 consume el `areaId` canónico sin redefinir el catálogo.
- No se crea un AUD-NG adicional ni se absorben las responsabilidades de esas tareas.

**Evidencia requerida para cerrar esta ampliación:** inventario de deployments reales por área con IDs y endpoints verificables; prueba de routing por `areaId`; persistencia y validación de área en tareas/exámenes; ejecución real de pruebas de conectividad, RBAC, integridad y aislamiento; y evidencia de separación de fuentes/ACL. Un resultado PASS constante o una declaración estática no satisface el criterio.

