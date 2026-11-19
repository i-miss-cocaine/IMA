# AUDITORÍA DE CUMPLIMIENTO — TAREA-F4-P1-07

**Fecha:** 2026-11-06  
**Repositorio:** i-miss-cocaine/IMA  
**Rama auditada:** `NG_beta_0.0.0.1_work`  
**HEAD de partida:** `1244d599a185d2760cfe7e050407ad4220f6d37e`  
**Rama base:** `NG_beta_0.0.0.1`  
**HEAD de la rama base:** `44d9891132332e692dbe2ba8602b41f50a508a59`  
**ID operativo de sesión:** `IMA-AUDIT-20261106-1406Z` (inicia en C1.82; no es un ID nativo de ChatGPT).

**Dictamen: NO CUMPLE**

## 1. Alcance y limitación de fuente

`completadas.md` marca TAREA-F4-P1-07 como completada, pero solo conserva el título. La fuente original `AUDITORIA_FASE4_IDENTIDAD_PERMISOS_GOBIERNO.md` no aparece en el árbol actual. El dictamen se limita al título oficial y a los requisitos relacionados documentados en la auditoría de Fase 16 y en las tareas vigentes; no se atribuyen criterios detallados que no están disponibles.

## 2. Evidencia inspeccionada

| Archivo | Blob SHA | Secciones |
|---|---|---|
| `backend/user-service/Code.gs` | `12079dd410aa6d8afbce55a4bc62a79dea605f9f` | `getOrCreateSheet` 863-874; `ROLE_PERMISSIONS` 941-963; `getUserVerifiedRole` 1146-1162; `validateRolePermission` 1253-1295; router 1351-1420 y 1540-1575; `generateInstitutionalId` 1706-1746; `getDynamicPermissionsForRole` 1863-1898; `manageDepartmentPositions` 2801-2894; `getUserInstitutionalAffiliations` 2894-2934; `assignRoleScope` 9117-9181; `getUserScopeConfig` 9183-9220; `validateRoleScopeAccess` 9222-9251; `getUserDynamicDashboardConfig` 9254-9304; `manageInternalRoleCatalog` 9631-9728; `getInternalRoleCatalog` 9730-9765; `getInternalRoleAssignments` 9767-9807. |
| `backend/academic-service/Code.gs` | `daf1883ec0b8d4f0ff2bc673af8a4e8c5bbd03fc` | `getAcademicAreaCoordinationScope` 4321-4349; `assignDepartmentHead` 7282-7306; `getDepartmentAcademicPlanning` 7308-7355; asignaciones docentes a áreas 14048-14316; permisos/router 168-223 y 779-790. |
| `dashboard-recursos-humanos.html` | `406bedbae5a5bb3b5c03e4ea7aaa95ed68aea8ee` | Controlador 981-1013 y referencias de puesto/departamento. |
| `js/ui-common.js` | `986938b8a311a41ed4cb3d135b66b6aaea4bed67` | `loadDynamicDashboard` 5818-5863. |
| `dashboard-direccion.html` | `fefaa3bf7884288aef563cfb8aaf244e6cea8b7c` | Búsqueda dirigida de integración. |
| `dashboard-coordinacion.html` | `08de8e4eb150ee9f6aad536ca08e8f76f2e0e896` | Búsqueda dirigida de integración. |
| `dashboard-secretaria.html` | `fa0d8c23aace24a6acab2d4956398a7f5e1309b8` | Búsqueda dirigida de integración. |
| `tests/regression/academic-grading-suite.js` | `3433b707edd4a2f35c68368a3172932adc2a3b32` | Aserciones TASK-004 119-124 y TASK-005 126-132. |
| `AUDITORIA_FASE_16_RECURSOS_HUMANOS.md` | `13946cc9af0557fb380daec180d442ab0fbc036d` | Secciones B, C.2, H y J. |
| `completadas.md` | `f57f1aef832e81e44fc4f7ec36a852d50e464676` | Estado y título de TAREA-F4-P1-07; TASK-004/005/006. |
| `Pendientes.md` | `a052ef4265d807b440e67b9c074d2a4800bde696` | Blob íntegro recuperado: 19,958 líneas. |

## 3. Hallazgos

### AUD-NG-225 — El catálogo de roles internos no gobierna de forma íntegra las asignaciones ni sus vigencias

**Severidad:** Alto (P1).  
**Ubicaciones:** USER 9117-9220, 9631-9807 y 9254-9304; `dashboard-recursos-humanos.html`; `js/ui-common.js`; suite de regresión.

1. `assignRoleScope` acepta `roleId/rolId` opcional, pero no comprueba que exista y esté activo en `CatalogoRolesInternos`. Una asignación puede quedar sin rol catalogado o apuntar a un identificador inexistente.
2. La búsqueda de asignación existente utiliza solo `userId + scopeType`; no incorpora `roleId`. Dos responsabilidades distintas del mismo tipo para un usuario colisionan y una actualización sobrescribe parte de la anterior.
3. En la rama de actualización solo se modifican `scopeValues` y `estado`. No se actualizan `roleId`, `fechaInicio`, `fechaFin`, `esSuplente` ni `suplenteDeUserId`.
4. `fechaInicio` y `fechaFin` se aceptan sin validar formato, orden ni vigencia. `getUserScopeConfig` filtra únicamente por usuario y estado `Activo`, por lo que puede exponer asignaciones futuras o vencidas como ámbitos activos. `getInternalRoleAssignments` revisa la fecha final, pero no excluye asignaciones cuya fecha de inicio aún no llega; además, recibe `departamento` y no lo aplica.
5. `manageInternalRoleCatalog` detecta duplicados por nombre normalizado, pero genera el ID con `Date.now()` y el código mediante un sufijo aleatorio de tres dígitos sin comprobar unicidad de `codigoInterno` ni proteger la creación con bloqueo.
6. No se encontró consola de gestión/asignación conectada a estos endpoints en `dashboard-recursos-humanos.html`, `js/ui-common.js` ni en los dashboards de Dirección, Coordinación y Secretaría revisados. El panel de RRHH solicita `puesto` y `departamento` como texto libre y llama a `ACCOUNTING/createEmployeeRecord` (981-1013), no al catálogo institucional.
7. La regresión existente para TASK-004 comprueba presencia de nombres de funciones y cadenas (119-124), no comportamiento de asignación, integridad referencial, fechas, suplencias, concurrencia ni persistencia.
8. `getUserDynamicDashboardConfig` lee `dataU[u][3]` como rol (USER 9269), aunque el encabezado de `Usuarios` sitúa `Rol` en el índice 6 (USER 873). En `js/ui-common.js` el elemento “Acceder” se renderiza como `span` sin destino ni listener (5818-5863).

**Impacto:** asignaciones no vinculadas a una responsabilidad válida, sobrescritura de asignaciones, vigencias inconsistentes, suplencias sin actualización efectiva y ausencia de un flujo administrativo verificable.

**Reconciliación:** TASK-004/F16-Task01 está marcada completada, pero sus pruebas actuales solo prueban presencia de símbolos; este hallazgo registra brechas conductuales no cubiertas por esa verificación. AUD-NG-221/TASK-501 y AUD-NG-222/TASK-502 conservan los problemas generales de matriz dinámica y autorización contextual; no se duplican. AUD-NG-145/AUD-NG-224 conservan las brechas de bitácoras, trazabilidad y versionado. Nueva tarea TASK-505.

### AUD-NG-226 — Departamentos, cargos y adscripciones carecen de integridad referencial y atomicidad operativa

**Severidad:** Alto (P1).  
**Ubicaciones:** USER 2801-2934 y 1706-1746; ACADEMIC 7282-7355; `dashboard-recursos-humanos.html` 981-1013.

1. `CREATE_DEPT` admite un `deptId` enviado por el cliente sin comprobar duplicados y no verifica que `jefaturaUserId` exista o esté activo. La estructura creada no contiene referencia a departamento superior.
2. `CREATE_CARGO` admite `cargoId` enviado por el cliente, no verifica unicidad ni que `deptId` exista y esté activo, y usa `DEP-GEN` como valor predeterminado. El manejador solo contempla `CREATE_DEPT`, `CREATE_CARGO` y `ASSIGN_USER`.
3. `ASSIGN_USER` comprueba que exista una fila de usuario, pero no valida que la cuenta esté activa ni que departamento y cargo existan y estén activos. Cierra las adscripciones activas antes de generar el nuevo ID y escribir la nueva fila. Si la generación o escritura posterior falla, la adscripción anterior ya quedó cerrada. No hay bloqueo que cubra la operación completa; dos asignaciones concurrentes pueden dejar más de una fila activa.
4. `generateInstitutionalId` protege su secuencia con un lock propio, pero ese lock no hace atómica la secuencia completa de cierre, generación de ID y alta.
5. `getUserInstitutionalAffiliations` carga toda la hoja y no pagina ni limita el historial; los roles administrativos autorizados pueden consultar cualquier `userId`, sin filtro de ámbito departamental. La autorización contextual general se mantiene en AUD-NG-222/TASK-502 y no se duplica.
6. `assignDepartmentHead` en ACADEMIC crea o actualiza `DepartamentosAcademicos` sin comprobar la existencia/estado del jefe ni una referencia válida al departamento. El modelo académico es una hoja distinta de `CatalogoDepartamentos`; no se encontró relación explícita que permita comprobar la correspondencia. No se presupone que ambas entidades deban fusionarse: se requiere definir y validar su relación o declarar su independencia.
7. La interfaz de RRHH usa texto libre para puesto/departamento y no invoca `manageDepartmentPositions` ni `getUserInstitutionalAffiliations`.

**Impacto:** registros huérfanos, identificadores duplicados, adscripciones activas inconsistentes, pérdida de la asignación vigente ante un fallo parcial y divergencia entre catálogos.

**Reconciliación:** TASK-171/F16-Task06 ya cubre detección de ciclos jerárquicos y referencias a unidades superiores; no se duplica. TASK-365/F16-Task09 cubre organigrama visual, no el CRUD/validación. TASK-006/AUD-NG-017 cubren offboarding. AUD-NG-221/AUD-NG-222 cubren permisos y contexto; AUD-NG-145/AUD-NG-224 cubren trazabilidad. Nueva tarea TASK-506.

## 4. Separación de conceptos y límites

La Fase 16 distingue cargo laboral (`CatalogoCargos`), departamento administrativo (`CatalogoDepartamentos`), área académica (`AreasCurricularesExtensiones`), coordinación académica (`CoordinacionesArea`), rol de acceso (`ROLE_PERMISSIONS`) y responsabilidades internas (`CatalogoRolesInternos`/`AsignacionesAmbitosRoles`). La auditoría conserva esa separación y no recomienda convertir una responsabilidad institucional en permiso global.

La asignación de docentes a áreas académicas y su historial se mantiene dentro de TASK-005/AUD-NG-018; no se vuelve a registrar como hallazgo de esta tarea. La prevención de ciclos se mantiene en TASK-171. La autorización contextual y el versionado de bitácoras permanecen en sus hallazgos existentes.

## 5. Pruebas y limitaciones

**Ejecutado:** inspección estática/manual de funciones, variables, rutas de router, permisos, hojas y call sites; búsqueda dirigida de símbolos para localizar referencias; comparación de SHA de respaldo; revisión del contenido de los tests existentes.

**No ejecutado:** pruebas HTTP, ejecución de Apps Script, lectura/escritura de Google Sheets reales, pruebas multiusuario, concurrencia real, expiración temporal con reloj controlado, despliegues, pruebas de UI en navegador y suites automatizadas. No se afirma que los flujos hayan sido probados en producción.

**Código fuente:** sin modificaciones. La auditoría no corrigió ni refactorizó funciones.

## 6. Archivos documentales de cierre

Se registran AUD-NG-225 y AUD-NG-226 en `Auditoria.txt`; se agregan TASK-505 y TASK-506 a `Pendientes.md`; se actualizan `MapaDependencias.md`, `AUDITORIA_COMPLETADAS_PLAN.md` y el checkpoint C1.82 en `Contexto_personal.txt`. `completadas.md`, `ChangesLogs.txt`, `METODOLOGIA_DESARROLLO.md` y el código fuente permanecen intactos.


## Tareas ejecutables derivadas de los hallazgos

### [TASK-505] Integrar el catálogo de roles internos con asignaciones, vigencias y administración institucional

- **Hallazgo de origen:** AUD-NG-225, sección 3 de este informe. El catálogo CatalogoRolesInternos no gobierna de forma íntegra AsignacionesAmbitosRoles: se admiten referencias inexistentes, las claves de búsqueda colisionan, las actualizaciones omiten atributos relevantes, las vigencias no se aplican coherentemente, faltan controles de unicidad y no existe una consola administrativa funcional conectada.
- **Severidad:** Alto.
- **Objetivo:** garantizar que cada responsabilidad institucional esté asociada a un rol interno válido y activo, tenga una asignación única y temporalmente vigente, y pueda administrarse y consultarse mediante flujos institucionales verificables.
- **Acción ejecutable:**
  1. Definir el contrato de CatalogoRolesInternos y AsignacionesAmbitosRoles, con identificadores estables, relación obligatoria al rol, tipo/valor de ámbito, estado, fechas de inicio y fin, datos de suplencia, actor y metadatos de auditoría.
  2. Validar en servidor que roleId exista y esté activo antes de crear o actualizar una asignación; impedir referencias huérfanas y definir la política ante la desactivación de un rol ya asignado.
  3. Sustituir la clave de búsqueda userId+scopeType por una clave de negocio que distinga usuario, rol, tipo de ámbito y ámbito concreto; imponer unicidad y evitar sobrescrituras entre responsabilidades diferentes.
  4. Hacer que el upsert actualice de manera coherente roleId, scopeValues, estado, fechaInicio, fechaFin, esSuplente y suplenteDeUserId; validar formato, zona horaria, orden y reglas de solapamiento temporal.
  5. Aplicar una única regla de vigencia en getUserScopeConfig y getInternalRoleAssignments: excluir asignaciones futuras, vencidas, suspendidas o incompatibles con el ámbito solicitado; aplicar realmente el filtro departamento y definir cómo se resuelven suplencias activas.
  6. Garantizar unicidad de ID y codigoInterno del catálogo bajo concurrencia, con bloqueo y comprobación de colisión. Reconciliar la estrategia con AUD-NG-161/TASK-118 para no confundir identificadores de roles con la generación de UserId.
  7. Construir una consola de RRHH/administración institucional conectada a los endpoints reales para crear/editar/desactivar roles, asignar ámbitos, establecer vigencias y suplencias, consultar historial y mostrar errores de validación. Sustituir los campos de texto libre cuando representen roles institucionales o ámbitos catalogados.
  8. Corregir getUserDynamicDashboardConfig para leer la columna Rol conforme al esquema real de Usuarios y reparar el control “Acceder” de loadDynamicDashboard para que tenga destino y comportamiento funcional, sin convertir responsabilidades institucionales en permisos globales.
  9. Añadir pruebas conductuales para referencias inexistentes/inactivas, unicidad, colisiones, actualización completa, vigencias en límites temporales, suplencias, filtros, concurrencia, permisos y flujos de UI; sustituir o complementar las pruebas de presencia de símbolos existentes.
- **Archivos/módulos afectados:** backend/user-service/Code.gs (assignRoleScope, getUserScopeConfig, manageInternalRoleCatalog, getInternalRoleCatalog, getInternalRoleAssignments, getUserDynamicDashboardConfig); dashboard-recursos-humanos.html; js/ui-common.js; dashboards institucionales que deban consumir la administración; tests/regression/academic-grading-suite.js y pruebas específicas de USER/UI.
- **Dependencias y riesgos:** AUD-NG-221/TASK-501 (matriz dinámica), AUD-NG-222/TASK-502 (autorización contextual), AUD-NG-145/AUD-NG-224 (trazabilidad y versionado), AUD-NG-161/TASK-118 (controles de generación/colisión, sin ampliar su alcance de UserId). Riesgos: retirar o desactivar roles con asignaciones vigentes, cambios de semántica de claves, duplicados históricos, solapamiento de suplencias y concesiones de acceso más amplias que la responsabilidad institucional.
- **Alcance:** catálogo de roles internos y asignaciones de ámbitos institucionales, sus reglas de vigencia, administración, consulta y presentación de dashboards. No incluye rediseñar la matriz general de permisos ni la política ABAC, ya cubierta por TASK-501/TASK-502; tampoco convierte el cargo laboral en rol de acceso.
- **Criterios de aceptación:**
  1. Toda asignación nueva o editada referencia un roleId existente y activo; las referencias inválidas son rechazadas con error explícito.
  2. La identidad de una asignación distingue usuario, rol y ámbito; crear o editar una responsabilidad no sobrescribe otra distinta.
  3. El upsert conserva y actualiza todos los atributos de asignación, fechas y suplencia de forma consistente.
  4. Las fechas se validan y todas las consultas aplican la misma regla de vigencia; ninguna asignación futura o vencida aparece como activa.
  5. El filtro departamento/ámbito recibido por los endpoints se aplica efectivamente y los resultados respetan el ámbito autorizado.
  6. IDs y códigos internos son únicos incluso bajo solicitudes concurrentes; se detectan y resuelven duplicados históricos sin pérdida silenciosa.
  7. RRHH puede administrar el catálogo y las asignaciones desde una UI conectada a los endpoints, con validaciones y errores visibles.
  8. El dashboard obtiene el rol desde la columna correcta y sus controles de acceso navegan/ejecutan la acción prevista.
  9. Las pruebas automatizadas demuestran los casos positivos, negativos, límites temporales, concurrencia, autorización y regresión; las pruebas de presencia de símbolos no se consideran evidencia suficiente.
- **Prioridad:** P1.
- **Estado:** Pendiente.
- **Evidencia de cierre:** pendiente. Incorporar SHA de implementación, evidencia de integridad del catálogo/asignaciones, capturas o pruebas de UI y resultados automatizados antes de cambiar el estado.

### [TASK-506] Garantizar integridad referencial y atomicidad en departamentos, cargos y adscripciones institucionales

- **Hallazgo de origen:** AUD-NG-226, sección 3 de este informe. CREATE_DEPT/CREATE_CARGO aceptan identificadores y referencias sin validación suficiente; ASSIGN_USER no valida el estado ni las referencias completas y cierra la adscripción anterior antes de garantizar la nueva; la operación no es atómica bajo fallos o concurrencia; las consultas carecen de paginación y filtro de ámbito; la interfaz no utiliza los catálogos.
- **Severidad:** Alto.
- **Objetivo:** mantener catálogos institucionales consistentes y adscripciones laborales válidas, evitando filas huérfanas, duplicados, pérdida parcial de la adscripción vigente y divergencias entre los modelos administrativo y académico.
- **Acción ejecutable:**
  1. Formalizar los contratos y relaciones de CatalogoDepartamentos, CatalogoCargos e HistorialAdscripciones, incluidos estado, jerarquía, departamento asociado, jefatura, fechas de vigencia y referencias de usuario.
  2. Validar en servidor la unicidad de deptId/cargoId, la existencia y estado de departamentos/cargos, la existencia y estado de jefaturas y usuarios, y la compatibilidad de cada cargo con su departamento. Rechazar referencias inexistentes o inactivas.
  3. Revisar el modelo de departamentos académicos: documentar si DepartamentosAcademicos es una entidad independiente o si debe vincularse con CatalogoDepartamentos; establecer una relación explícita y validable sin fusionar ambos catálogos por suposición.
  4. Rediseñar ASSIGN_USER como operación transaccional lógica: validar todos los datos, reservar/generar el identificador y preparar la nueva adscripción antes de cerrar la anterior; ejecutar el cambio bajo bloqueo que cubra la operación completa; si la escritura falla, conservar o restaurar la adscripción previa y dejar evidencia recuperable.
  5. Impedir más de una adscripción activa incompatible por usuario según las reglas institucionales, incluyendo protección frente a solicitudes concurrentes y reintentos idempotentes.
  6. Completar los tipos de operación de gestión que realmente requiera el modelo (consulta, actualización, desactivación y reasignación), documentando sus transiciones y evitando que un endpoint acepte acciones no implementadas.
  7. Incorporar paginación estable, límites máximos y filtros por departamento/ámbito a getUserInstitutionalAffiliations; aplicar autorización contextual para impedir consultas fuera del ámbito permitido.
  8. Conectar la UI de RRHH con los catálogos y operaciones institucionales; reemplazar texto libre por selectores validados donde corresponda y presentar errores, historial y estado de la adscripción.
  9. Añadir pruebas para integridad referencial, identificadores duplicados, usuario/jefatura inactivos, cargo-departamento incompatible, fallos en cada etapa de reasignación, rollback/recuperación, reintentos, concurrencia, paginación, autorización y UI.
- **Archivos/módulos afectados:** backend/user-service/Code.gs (manageDepartmentPositions, generateInstitutionalId, getUserInstitutionalAffiliations); backend/academic-service/Code.gs (assignDepartmentHead y consultas relacionadas); dashboard-recursos-humanos.html; tests/regression/academic-grading-suite.js y pruebas específicas de USER/ACADEMIC/UI; contratos y documentación de CatalogoDepartamentos, CatalogoCargos, DepartamentosAcademicos e HistorialAdscripciones.
- **Dependencias y riesgos:** TASK-171 (ciclos y referencias jerárquicas), TASK-365 (organigrama visual), TASK-006/AUD-NG-017 (offboarding), AUD-NG-018/TASK-005 (asignaciones docentes a áreas académicas), AUD-NG-221/TASK-501 y AUD-NG-222/TASK-502 (permisos y autorización contextual), AUD-NG-145/AUD-NG-224 (bitácoras/versionado). AUD-NG-161/TASK-118 puede aportar controles de generación de identificadores, sin trasladar aquí su alcance de UserId. Riesgos: migración de registros huérfanos, reglas de unicidad no acordes con suplencias o adscripciones históricas, bloqueos concurrentes, rollback incompleto y confusión entre departamento laboral y académico.
- **Alcance:** CRUD/validación de catálogos administrativos, jefaturas, cargos y adscripciones laborales; consistencia de la reasignación y consulta histórica; relación explícita con el modelo académico cuando proceda. No incluye la asignación de docentes a áreas curriculares (TASK-005/AUD-NG-018), la visualización del organigrama (TASK-365), prevención de ciclos jerárquicos ya cubierta por TASK-171 ni procesos de baja/offboarding de TASK-006.
- **Criterios de aceptación:**
  1. No pueden crearse departamentos o cargos con IDs duplicados ni referencias inexistentes/inactivas.
  2. Las jefaturas y usuarios asignados existen, están activos y cumplen las reglas de ámbito.
  3. La relación entre departamentos administrativos y académicos está documentada y validada; no se mezclan modelos sin una decisión explícita.
  4. Una reasignación exitosa deja exactamente el estado activo permitido y conserva el historial; un fallo no cierra ni pierde la adscripción previa.
  5. Las operaciones concurrentes y los reintentos no producen adscripciones activas duplicadas ni resultados parciales; el mecanismo de bloqueo cubre el flujo completo.
  6. Las consultas de adscripciones están paginadas, limitadas y filtradas por ámbito con autorización contextual efectiva.
  7. La UI de RRHH utiliza catálogos institucionales y muestra resultados/errores reales, sin depender de texto libre para referencias controladas.
  8. Las pruebas automatizadas cubren integridad, fallos, recuperación, concurrencia, paginación, permisos y regresión de USER/ACADEMIC/UI.
- **Prioridad:** P1.
- **Estado:** Pendiente.
- **Evidencia de cierre:** pendiente. Registrar SHA de implementación, pruebas de integridad/atomicidad y concurrencia, validación de migración y evidencia de UI antes de cambiar el estado.
