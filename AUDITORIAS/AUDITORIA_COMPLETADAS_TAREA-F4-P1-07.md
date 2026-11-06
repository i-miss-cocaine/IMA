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
