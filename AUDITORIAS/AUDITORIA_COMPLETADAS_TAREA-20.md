# Auditoría TAREA-20: incorporación de áreas y servicios curriculares

**Fecha:** 2026-11-05  
**Repositorio:** i-miss-cocaine/IMA  
**Rama:** NG_beta_0.0.0.1_work  
**HEAD de partida:** f1c4f0c4116d8444bf091346ef306805cb78be00  
**Dictamen:** CUMPLE PARCIALMENTE. Existe registro de áreas, catálogo y baja lógica, pero no se demuestra un onboarding operativo ni una habilitación segura de servicios curriculares.

## Alcance y criterio

Se contrastó el alcance marcado completado en completadas.md: plantilla técnica para nuevas áreas/servicios Apps Script; pruebas específicas antes de habilitar; vinculación del servicio y permisos; reutilización de componentes; activación sin regresiones y desactivación que conserve historiales. La especificación AUDITORIA_FASE1_PLANIFICACION_EXPANSION.md no está disponible en la rama; se utilizó el alcance explícito de completadas.md.

## Archivos y versiones inspeccionadas

| Archivo | SHA | Elementos revisados |
|---|---|---|
| backend/academic-service/Code.gs | daf1883ec0b8d4f0ff2bc673af8a4e8c5bbd03fc | registerCurricularAreaExtension (4084); runCurricularAreaServiceTests (4147); toggleCurricularAreaStatus (4206); getAcademicAreaTemplateCatalog (4281); deployAcademicMicroserviceInstance (4494); getInstitutionalCatalog (3824); getAcademicAreaCoordinationScope (4321); assignTeacherToAcademicArea (14048) |
| js/config.js | 49ef90807e5b9dfe1379f76d66efdb4ccd2b6cdc | CURRICULAR_AREAS_CATALOG (171); CURRICULAR_SPECIALIZED_SERVICES (198); SERVICE_URLS (224); SERVICE_REGISTRY |
| js/api.js | 6b24f666db30a811a8e9b38d466fc6001cf6dfa9 | fetchApi (11) |

## Evidencia

### 1. Registro de área y plantilla

registerCurricularAreaExtension (4084) exige únicamente areaId, name y code. serviceKey, serviceUrl, tools y departmentId son opcionales; no comprueba que el serviceKey sea único, que el código no esté duplicado, que el departamento exista ni que el endpoint corresponda a un deployment real. No usa LockService. Cuando areaId ya existe, reemplaza toda la fila y reinicia su estado a Inactivo_PendientePruebas; puede sobrescribir URL, herramientas y departamento previamente configurados, sin versionado ni historial de cambios.

getAcademicAreaTemplateCatalog (4281) no genera una plantilla técnica de proyecto ni define archivos, contratos, despliegue o ACL. Si la hoja está vacía, inserta siete áreas predeterminadas directamente con estado Activo, evitando el estado pendiente de pruebas. Los IDs y códigos de esas áreas no corresponden al catálogo cliente AREA-01…AREA-12; usa identificadores como AREA-MATH y AREA-COMUNICATION.

### 2. Pruebas previas a producción

runCurricularAreaServiceTests (4147) no realiza peticiones de conectividad, no inspecciona permisos reales, no compara datos históricos ni valida el esquema de herramientas. Construye cuatro resultados PASS constantes (testPingConnectivity, testRBACIsolation, testDataIntegrity y testToolsSchema) y, como todos pasan, cambia automáticamente Inactivo_PendientePruebas a Activo. El endpoint comunica “pruebas ejecutadas” aunque no ejecuta las pruebas descritas.

La habilitación puede eludirse: toggleCurricularAreaStatus (4206) acepta la activación directa mediante nuevoEstado="Activo", sin exigir un resultado de pruebas. deployAcademicMicroserviceInstance (4494) también escribe la instancia con estado Activo y diagnostics.connectivityCheck="PASS" fijo, sin crear ni verificar un deployment de Apps Script, endpoint, permisos o almacenamiento. Posteriormente llama a registerCurricularAreaExtension, que coloca el área en Inactivo_PendientePruebas. Esto permite que la instancia figure Activo mientras el área queda pendiente.

### 3. Vinculación, configuración y enrutamiento

js/config.js mantiene CURRICULAR_AREAS_CATALOG (AREA-01…AREA-12), ACADEMIC_DEPARTMENTS_CATALOG (ocho departamentos) y CURRICULAR_SPECIALIZED_SERVICES como mapas estáticos. No se observa una carga o sincronización de nuevas áreas registradas en AreasCurricularesExtensiones hacia esos catálogos. SERVICE_URLS y SERVICE_REGISTRY enumeran servicios globales fijos; no contienen un registro dinámico por areaId.

fetchApi (js/api.js, 11) resuelve el destino únicamente con SERVICE_URLS[service]. No consulta el catálogo de áreas, serviceKey, serviceUrl ni una instancia por área. Además, getInstitutionalCatalog (3824) devuelve areaId, nombre, código, serviceKey y estado, pero omite serviceUrl y herramientas. Por tanto, el registro de un área no crea por sí mismo un destino enrutable ni demuestra que su servicio esté vinculado operativamente.

### 4. Permisos y ámbito

Los endpoints registerCurricularAreaExtension, runCurricularAreaServiceTests y toggleCurricularAreaStatus están en la lista de acciones de Director y Administrador; deployAcademicMicroserviceInstance también permite Desarrollador. Esto es una protección RBAC básica positiva.

Sin embargo, los resultados testRBACIsolation son constantes, no prueban permisos del servicio nuevo. assignTeacherToAcademicArea (14048) no verifica que areaId exista o esté Activo antes de crear la relación. getAcademicAreaCoordinationScope (4321) filtra coordinaciones activas, pero no comprueba el estado del área. La desactivación no revoca ni desactiva las asignaciones docentes, coordinaciones o deployments relacionados. El alcance contextual de Coordinador depende de esas coordinaciones y puede seguir encontrando una relación para un área desactivada.

### 5. Desactivación e historial

toggleCurricularAreaStatus (4206) cambia el estado del catálogo sin borrar la fila, lo que constituye una baja lógica básica. No elimina directamente historiales ni entregas, pero tampoco identifica referencias dependientes, verifica su conservación, invalida rutas/cachés, desactiva instancias o bloquea nuevas asignaciones y operaciones para esa área. getInstitutionalCatalog y getAcademicAreaTemplateCatalog siguen devolviendo las áreas sin excluir las inactivas. La preservación histórica es una afirmación en el mensaje de respuesta, no una prueba de integridad ni de disponibilidad de consulta histórica.

## Dictamen por criterio

| Criterio | Dictamen |
|---|---|
| Plantilla/procedimiento estandarizado para nuevas áreas y servicios | No cumple |
| Registro básico del área | Parcial |
| Vinculación real a servicio Apps Script y endpoint | No cumple |
| Permisos efectivos y aislamiento por área | Parcial / no demostrado |
| Reutilización de componentes | Parcial; hay catálogos/mapas, no plantilla de proyecto comprobada |
| Pruebas específicas ejecutadas antes de producción | No cumple |
| Activación protegida por pruebas | No cumple |
| Desactivación lógica sin borrar la fila | Cumple parcialmente |
| Preservación verificable de historiales/entregas | No demostrado |
| No afectar áreas y servicios existentes | No demostrado; catálogos duplicados y estados contradictorios |

## Reconciliación de hallazgos

No se crea un AUD-NG nuevo. Las brechas ya están cubiertas por tareas pendientes:

- **AUD-NG-011:** ampliar el requisito de despliegue real con lifecycle coherente área/instancia, endpoint y fuente de datos verificados; eliminar PASS constantes; impedir habilitación por rutas alternativas; ejecutar pruebas reales de conectividad, RBAC, esquema, integridad y regresión.
- **AUD-NG-164:** unificar el catálogo de áreas/departamentos/servicios entre backend y cliente; normalizar IDs/códigos únicos; versionar cambios; validar referencias; definir semántica de estado y desactivar sin pérdida histórica ni relaciones activas huérfanas.
- **AUD-NG-158:** validar en servidor que asignaciones docentes y coordinaciones pertenezcan a áreas existentes y activas, y aplicar el ámbito derivado de claims verificados.

## Límites

Inspección estática/manual. No se desplegaron proyectos Apps Script, no se ejecutaron endpoints, pruebas RBAC, pruebas de integridad, consultas a Drive, pruebas de regresión ni fixtures de áreas. No se utilizaron datos institucionales reales y no se modificó código fuente.
