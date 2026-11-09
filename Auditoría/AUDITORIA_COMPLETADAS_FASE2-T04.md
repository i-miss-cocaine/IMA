# Auditoría de tareas completadas - FASE2-T04

**Fecha:** 2026-11-05  
**Repositorio:** i-miss-cocaine/IMA  
**Rama:** NG_beta_0.0.0.1_work  
**HEAD de partida:** 6ba15688a84db7a7edc0c9b7b7f9c75493a188c1  
**Rama base:** NG_beta_0.0.0.1 (44d9891132332e692dbe2ba8602b41f50a508a59, sin cambios)  
**Tarea:** FASE2-T04 - Establecer una fuente de verdad institucional para catálogos, configuraciones y referencias

## Dictamen

**CUMPLE PARCIALMENTE.** Hay un repositorio de datos académico en Sheets y endpoints para consultar/validar catálogos, pero no constituyen una fuente de verdad institucional efectiva: el cliente mantiene copias locales de catálogos, los contratos del backend son inconsistentes, la validación no se integra en las escrituras y los errores de sincronización se presentan como éxito. Se conservan algunos identificadores estables y se declaran políticas de caché/versionado, pero no se demuestra su aplicación al catálogo.

La auditoría previa FASE2-03/C1.31 ya documentó la resolución de fuentes distribuidas y parte de la sincronización. Se reutiliza AUD-NG-175 y se amplía para cubrir FASE2-T04. No se duplica TASK-046 ni las tareas de versionado/caché TASK-062.

## Fuentes y SHAs

- completadas.md SHA f57f1aef832e81e44fc4f7ec36a852d50e464676: FASE2-T04 contiene diez requisitos funcionales y ocho criterios de aceptación.
- js/config.js SHA 49ef90807e5b9dfe1379f76d66efdb4ccd2b6cdc: catálogos estáticos y sincronización, especialmente líneas 2-114, 171-200, 808-825 y 943-965.
- backend/academic-service/Code.gs SHA daf1883ec0b8d4f0ff2bc673af8a4e8c5bbd03fc: getOrCreateSheet (líneas 85-150), dispatcher (aprox. 787), getInstitutionalCatalog (3824-3883), validateCatalogReference (3885-3915), registerCurricularAreaExtension (4084-4145), toggleCurricularAreaStatus (4206-4235), getSubjectCatalog y createSubjectCatalogItem (5995-6027).
- backend/user-service/Code.gs SHA 12079dd410aa6d8afbce55a4bc62a79dea605f9f: getSharedConfigurationsCatalog (185-200), getDynamicPermissionsForRole y getPermissionMatrix (1863-1935).
- Auditoría previa AUDITORIA_COMPLETADAS_FASE2-03.md SHA b0b9a238a27ffc00f356409b7b66e4295e69b5e2, y resultado C1.31 en AUDITORIA_COMPLETADAS_PLAN.md.
- Backlog íntegro recuperado por blob SHA ba9de8d19b8311d99a62681af5cc2b7177132b78 (1,604,821 caracteres).

## Contraste de los diez requisitos

1. **Inventario de catálogos y referencias:** parcial. config.js define capacidades, módulos, responsabilidades, áreas y departamentos. Academic persiste asignaturas y áreas extendidas. No hay inventario formal que identifique propietario, fuente autoritativa, consumidores y ámbito de cada catálogo.
2. **Fuente autorizada y permisos de modificación:** parcial. Sheets académico funciona como fuente para dos catálogos, pero las listas del cliente siguen disponibles y el backend permite altas/actualizaciones sin una política unificada de propietario por catálogo.
3. **Separación de configuraciones institucionales y técnicas:** parcial. CACHE_POLICIES y versiones son técnicas; áreas, departamentos, capacidades y responsabilidades son definiciones de negocio, pero ambas categorías conviven en el cliente y no existe un registro de autoridad para cada una.
4. **Evitar reglas duplicadas:** incumplido. Los catálogos estáticos continúan en config.js; el backend mantiene tablas propias y el cliente solo sincroniza parte de ellas. No se acredita que módulos distintos consuman una única definición vigente.
5. **Obtención y validación en servidor:** incumplido. El endpoint validateCatalogReference existe, pero no se invoca desde las operaciones de escritura inspeccionadas. No rechaza registros inactivos y no funciona con el formato ALL.
6. **Publicación, caché e incompatibilidad:** incumplido para el catálogo. CACHE_POLICIES.INSTITUTIONAL_CATALOGS declara TTL 43,200 segundos, pero no se consume en fetchInstitutionalCatalog; no se observa invalidación asociada a cambios de catálogo. TASK-062 ya cubre la política transversal de versionado/invalidez, por lo que se referencia y no se duplica.
7. **Identificadores estables:** parcial. Las áreas se actualizan por areaId y el nombre visible no forma la clave. Las asignaturas generan IDs basados en Date.now(), sin evidencia de unicidad transaccional ni historial de cambios. No se acredita una regla global de identidad para todos los catálogos.
8. **Configuración por nivel/departamento/contexto:** parcial. registerCurricularAreaExtension recibe departmentId, pero getInstitutionalCatalog no lo devuelve ni filtra por ámbito. El cliente conserva un catálogo estático de departamentos.
9. **Lista local desactualizada:** incumplido. fetchInstitutionalCatalog devuelve status:"success" con catálogo local ante ausencia de API, respuesta inválida o fallo de red. Las escrituras no revalidan la referencia con el servidor.
10. **Valores históricos:** incumplido. Las actualizaciones de áreas sobrescriben la fila existente y el cambio de estado muta el registro actual; no se encontró historial/versionado de los metadatos de catálogo que permita interpretar su valor histórico.

## Criterios de aceptación

| Criterio | Resultado | Evidencia |
|---|---|---|
| Fuente autorizada y documentada | Parcial | Sheets académico existe, pero faltan propietario/ámbito y catálogo de autoridad para las listas compartidas del cliente. |
| Módulos reciben definiciones compatibles | No cumple | El cliente solo sincroniza áreas; asignaturas y otros catálogos permanecen locales o usan endpoints distintos. |
| Referencia manual inválida rechazada | No cumple | Validador no integrado en mutaciones; no verifica estado y falla con ALL. |
| Cambios reflejados con política comprobable | No cumple | Sin sincronización de asignaturas ni actualización local de metadatos existentes. |
| Caché obsoleta no persiste referencias inválidas | No cumple | Fallback local exitoso y ausencia de revalidación en escrituras. |
| Renombrar no altera identidad | Parcial | IDs de área separados del nombre, pero no hay contrato/historial general para todos los catálogos. |
| Configuración obligatoria ausente produce error | No cumple | Fallback estático y defaults como General/departamento genérico pueden ocultar configuración ausente. |
| Se preservan diferencias institucionales/académicas/técnicas | Parcial | Hay ámbitos en algunas tablas, pero se omiten al consultar y no existe clasificación autoritativa transversal. |

## Hallazgos técnicos y calidad

### Contrato y mapeo de datos
- CatalogoAsignaturas se inicializa con columnas AsignaturaID, NombreOficial, Codigo, AreaAcademica, CargaHorariaRef, Estado. getInstitutionalCatalog y getSubjectCatalog asignan estado:r[4], por lo que leen CargaHorariaRef; el estado real está en r[5].
- Los catálogos específicos devuelven data como array; ALL devuelve un objeto con areasCurriculares y asignaturas. validateCatalogReference solo recorre data si es array, por lo que ALL no puede validarse.
- Las respuestas de catálogo específico no incluyen versión; ALL incluye version:"2026.1". Las áreas no devuelven departamento, URL ni herramientas aunque se almacenan.

### Validación de referencias
- El dispatcher expone validateCatalogReference, pero en el código inspeccionado su única invocación es el despacho del endpoint; no se encontró integración dentro de las mutaciones de catálogo o relaciones académicas.
- No comprueba estado activo. La asignatura puede figurar como activa por leer la carga horaria; áreas inactivas se incluyen en las consultas.
- createSubjectCatalogItem admite areaAcademica || "General" y no valida la referencia de área en el servidor.

### Sincronización del cliente
- fetchInstitutionalCatalog sincroniza solo areasCurriculares; ignora asignaturas.
- Si no existe fetchApi, la respuesta no tiene el formato esperado o ocurre un error, devuelve status:"success" con CURRICULAR_AREAS_CATALOG.
- registerNewCurricularAreaServiceConfig solo inserta IDs nuevos; si ya existe el ID, no actualiza nombre/código ni elimina o marca inactivo. El objeto local no contiene estado ni departamento.
- La función está definida en config.js; no se identificó en ese archivo un consumidor distinto de la propia sincronización.

### Identidad, ámbito e historial
- Las áreas se localizan por ID, pero el registro existente se sobrescribe y se fuerza a Inactivo_PendientePruebas; toggleCurricularAreaStatus cambia estado in situ. No se conserva historial del nombre, departamento o estado anterior.
- departmentId se persiste al registrar áreas, pero se omite de getInstitutionalCatalog. El catálogo local de departamentos no se sincroniza desde el backend.
- Los IDs de asignatura se forman con ASIG- + timestamp; no se observó mecanismo de reserva/colisión en la función de creación.

### Separación de responsabilidades y trabajos posteriores
- getSharedConfigurationsCatalog en USER entrega versiones estáticas de servicios, no un catálogo persistente de definiciones institucionales.
- CACHE_POLICIES declara un TTL para catálogos que no se consume en la función de sincronización. Las deficiencias transversales de versionado e invalidación se mantienen en TASK-062 (FASE2-T17/T19).
- La resolución de Spreadsheets se mantiene en TASK-046 y AUD-NG-083/AUD-NG-084/AUD-NG-086; no duplicar ese problema aquí.
- La gestión de estado y ámbito de áreas tiene relación con AUD-NG-158; no duplicar su causa raíz.

## Reconciliación

**Ampliar AUD-NG-175** con los requisitos y criterios derivados de FASE2-T04. No crear un AUD-NG duplicado. Mantener TASK-062 para versionado/invalidez de configuraciones, TASK-046 para resolución de fuentes, AUD-NG-158 para estado/ámbito de áreas y AUD-NG-083/AUD-NG-084/AUD-NG-086 para enrutamiento distribuido.

## Pruebas y limitaciones

Inspección estática/manual de los bloques y funciones indicados. **No se ejecutaron** Apps Script, llamadas HTTP a deployments, navegador, pruebas de caché real, concurrencia, acceso a Sheets/Drive productivo ni suites automatizadas. No se consultaron ni modificaron datos productivos. No se modificó código fuente.

## Progreso

- Identificadores auditados: **40/183**; 143 pendientes.
- Última tarea auditada: FASE2-T04.
- Siguiente tarea: FASE2-T05 - Unificar y validar el sistema de identificadores institucionales.

## Tareas ejecutables derivadas de los hallazgos

### [AUD-NG-175] Completar la fuente de verdad y sincronización de catálogos
- **Hallazgo de origen:** AUD-NG-175; ampliación documentada en FASE2-T04.
- **Severidad:** Alto.
- **Objetivo:** mantener un catálogo institucional coherente entre servidor y consumidores.
- **Acción ejecutable:** corregir el mapeo de columnas; excluir referencias inactivas; validar vigencia en cada mutación; sincronizar áreas y asignaturas; actualizar metadatos existentes; impedir fallback silencioso a catálogos locales ante errores.
- **Archivos/módulos afectados:** backend/academic-service/Code.gs, js/config.js.
- **Dependencias y riesgos:** TASK-046 para resolver fuente autorizada; AUD-NG-158 para estado/ámbito; TASK-062 para caché/versionado.
- **Alcance:** ampliación de AUD-NG-175, no crear un hallazgo paralelo.
- **Criterios de aceptación:** mapeo de columnas coincide con esquema; referencias inactivas se rechazan; cliente y servidor reflejan altas/cambios/bajas; fallos de API no devuelven success con catálogo local.
- **Prioridad:** P1.
- **Estado:** Pendiente.
- **Evidencia de cierre:** pruebas de contrato, sincronización y referencias activas/inactivas.

### [TASK-046] Resolver fuentes por departamento, servicio y tipo de información
- **Hallazgo de origen:** FASE2-T04; tarea existente relacionada.
- **Severidad:** Crítico.
- **Objetivo:** evitar que un catálogo o fuente de otro ámbito se use como fallback.
- **Acción ejecutable:** incluir departamento, servicio y tipo de información en la clave; validar permisos y esquema; integrar resolver en consumidores y retirar fallback implícito a SPREADSHEET_ID.
- **Archivos/módulos afectados:** backend/academic-service/Code.gs, js/config.js y consumidores de microservicios.
- **Dependencias y riesgos:** AUD-NG-083/084/086; preservar aislamiento entre servicios.
- **Alcance:** ampliación de TASK-046 ya existente.
- **Criterios de aceptación:** selección inequívoca por contexto; fuente ausente/inactiva/incompatible falla de forma explícita; pruebas demuestran ausencia de lecturas cruzadas.
- **Prioridad:** P0.
- **Estado:** Pendiente.
- **Evidencia de cierre:** matriz de fuentes y pruebas multiámbito.

### [TASK-062] Aplicar versionado, TTL e invalidación efectiva a catálogos
- **Hallazgo de origen:** FASE2-T04, requisito 6; referencia a TASK-062.
- **Severidad:** Medio.
- **Objetivo:** evitar que los consumidores usen catálogos obsoletos después de cambios.
- **Acción ejecutable:** integrar CACHE_POLICIES.INSTITUTIONAL_CATALOGS en fetchInstitutionalCatalog; definir versión/ETag o equivalente; invalidar caché al crear, modificar, desactivar o reactivar una referencia; validar compatibilidad de versión.
- **Archivos/módulos afectados:** js/config.js, backend/academic-service/Code.gs y mecanismo común de caché.
- **Dependencias y riesgos:** AUD-NG-175 y TASK-046; no mezclar caché con fallback de disponibilidad.
- **Alcance:** política transversal de versionado e invalidación.
- **Criterios de aceptación:** TTL configurado se aplica; cambios invalidan entradas afectadas; consumidores detectan versión incompatible; error de API no se transforma en éxito con caché obsoleta.
- **Prioridad:** P2.
- **Estado:** Pendiente.
- **Evidencia de cierre:** pruebas de TTL, invalidación y compatibilidad.

### [AUD-NG-158] Mantener estado y ámbito departamental de áreas curriculares
- **Hallazgo de origen:** FASE2-T04, sección de reconciliación; referencia a AUD-NG-158.
- **Severidad:** Alto.
- **Objetivo:** conservar estado y departamento de cada área en lectura, actualización y consumo.
- **Acción ejecutable:** devolver departmentId/estado en el catálogo; filtrar por ámbito autorizado; actualizar registros existentes por ID; preservar historial de cambios de estado/ámbito.
- **Archivos/módulos afectados:** backend/academic-service/Code.gs, js/config.js y catálogo local sincronizado.
- **Dependencias y riesgos:** AUD-NG-175/TASK-046; no duplicar el problema de resolución de fuentes.
- **Alcance:** estado/ámbito de áreas curriculares.
- **Criterios de aceptación:** el catálogo devuelve estado y departamento correctos; áreas inactivas no aparecen como utilizables; los cambios preservan historial y no cruzan departamentos.
- **Prioridad:** P1.
- **Estado:** Pendiente.
- **Evidencia de cierre:** pruebas por departamento y transiciones de estado.
