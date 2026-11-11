# Auditoría FASE2-T17: versionado y evolución de configuraciones compartidas

**Fecha:** 2026-11-05  
**Repositorio:** i-miss-cocaine/IMA  
**Rama:** NG_beta_0.0.0.1_work  
**HEAD de partida:** 7990bec9295cad395fe4882f5fa0663c94dcb4d6  
**Dictamen:** CUMPLE PARCIALMENTE. Hay identificadores de versión y un comparador nominal, pero no existe una política operativa y consistente de compatibilidad, historial, validación previa ni reversión de configuraciones.

## Alcance

Se auditó FASE2-T17: inventario de configuraciones versionadas, compatibilidad de consumidores, detección de versiones obsoletas, interpretación histórica, validación antes de propagar cambios y procedimiento de rollback. La especificación AUDITORIA_FASE2_ARQUITECTURA_INTEROPERABILIDAD.md no está disponible en la rama; se utilizó el alcance explícito de completadas.md.

## Archivos y versiones inspeccionadas

| Archivo | SHA | Elementos revisados |
|---|---|---|
| js/config.js | 49ef90807e5b9dfe1379f76d66efdb4ccd2b6cdc | SERVICE_VERSIONS (76); getSharedConfigVersion (93); validateServiceVersionCompatibility (97); SERVICE_REGISTRY (245) |
| backend/user-service/Code.gs | 12079dd410aa6d8afbce55a4bc62a79dea605f9f | getServiceHealthReport (73); manageInstitutionalDataCache (156); getSharedConfigurationsCatalog (185); runInterdepartmentalIntegrationTestSuite (221); doGet (917); registerSpreadsheetSource (7293); resolveSpreadsheetSource (7339); getSystemConfigurations (7743); saveSystemConfiguration (7787) |
| js/api.js | 6b24f666db30a811a8e9b38d466fc6001cf6dfa9 | fetchApi (11) |

## Evidencia

### 1. Versiones declaradas y fuentes divergentes

js/config.js declara SERVICE_VERSIONS con USER, ACADEMIC, TASK, EXAM y ACCOUNTING en 1.0.0; omite DEVELOPER. En cambio SERVICE_REGISTRY declara seis servicios, incluido DEVELOPER, y asigna v8.4.0 a todos. Los comentarios de SERVICE_URLS también mencionan versiones heterogéneas (por ejemplo, EXAM v7.7.6 y ACCOUNTING v8.0.0). En backend/user-service, getServiceHealthReport (73) y getSharedConfigurationsCatalog (185) vuelven a declarar 1.0.0 para los cinco servicios, sin consultar despliegues reales. doGet (917) no publica versión del servicio.

getSharedConfigVersion (93) devuelve literalmente 2.0.0. getSharedConfigurationsCatalog (185) devuelve otro literal 2.0.0 y versiones de servicios 1.0.0. La coincidencia de dos constantes no es una fuente central de verdad ni prueba que el cliente y el servidor ejecuten el mismo contrato.

### 2. Comparación de compatibilidad defectuosa

validateServiceVersionCompatibility (97) compara únicamente igualdad de major y que el minor actual sea mayor o igual al minor requerido. Ignora patch: con versión actual 1.0.0 y mínima requerida 1.0.1 la condición da compatible, aunque el servicio sea inferior a la mínima. No valida estrictamente el formato; los componentes inválidos se sustituyen por valores predeterminados mediante expresiones 

---

## Tareas ejecutables derivadas de los hallazgos

> La reconciliación de esta auditoría no crea hallazgos nuevos: amplía TASK-062 y conserva AUD-NG-077/AUD-NG-078 como referencias específicas de schemaVersion y coherencia entre contrato y deployment. Se formaliza un solo alcance integrado para evitar duplicar versionado, handshake, historial e invalidación.

### [TASK-062] Establecer versionado canónico, negociación de compatibilidad e historial reversible de configuraciones
- **Hallazgo de origen:** divergencia entre SERVICE_VERSIONS/SERVICE_REGISTRY/catálogo backend; comparador semántico defectuoso; ausencia de handshake en fetchApi; configuraciones sobrescritas sin historial; schemaVersion sin comparación. Referencias AUD-NG-077 y AUD-NG-078.
- **Severidad:** Media/Alta (cumplimiento parcial con riesgo de incompatibilidad entre servicios). **Objetivo:** garantizar una fuente única y verificable de versiones de servicios, contratos y configuraciones, con compatibilidad comprobada antes de consumir o propagar cambios.
- **Acción ejecutable:** definir catálogo canónico persistido de servicios/contratos y versión actual/mínima; incluir todos los servicios y deployments reales; corregir comparación semántica incluyendo patch y rechazar versiones/formato/servicios desconocidos; integrar handshake en `fetchApi` y consumidores; exponer versión real en health/deployment; versionar `ConfiguracionSistema` y fuentes de Spreadsheet con actor/fecha; conservar historial inmutable y rollback; aplicar control de concurrencia al guardar; ejecutar invalidación efectiva de caché tras cambios y no declarar purga global si solo se registra un evento.
- **Archivos/módulos:** `js/config.js` (`SERVICE_VERSIONS`, `SERVICE_REGISTRY`, `getSharedConfigVersion`, `validateServiceVersionCompatibility`); `js/api.js` (`fetchApi`); `backend/user-service/Code.gs` (`getServiceHealthReport`, `getSharedConfigurationsCatalog`, `manageInstitutionalDataCache`, `getSystemConfigurations`, `saveSystemConfiguration`, `registerSpreadsheetSource`, `resolveSpreadsheetSource`); almacenamiento de historial/configuración y endpoints de cada servicio.
- **Dependencias/riesgos:** coordinar deployments independientes y consumidores antiguos; definir política de compatibilidad hacia atrás y migración de versiones existentes; riesgo de bloqueo de clientes legítimos, versiones declaradas que no reflejan deployment real, sobrescritura concurrente y rollback incompleto.
- **Alcance:** versionado de servicios, contratos compartidos, configuraciones institucionales y schemaVersion de fuentes; no confundir una constante en frontend/backend con versión real del deployment.
- **Criterios de aceptación:** existe una sola fuente canónica y todos los servicios/deployments están representados; semver compara major/minor/patch y rechaza valores inválidos; clientes envían/negocian versión y reciben error explícito si son incompatibles; health report refleja versión desplegada; cada cambio guarda versión, actor, fecha y snapshot; rollback restaura versión previa con auditoría; concurrencia no pierde actualizaciones; invalidación realmente purga/renueva cachés; schemaVersion se compara con contrato requerido y conserva historial; pruebas con cliente obsoleto, patch inferior, servicio desconocido, actualización concurrente, rollback y caché.
- **Prioridad:** conservar la prioridad vigente de TASK-062 (no reespecificada en este informe). **Estado:** Pendiente de ejecución/revalidación.
- **Evidencia de cierre:** pendiente; se observaron versiones fijas y divergentes, comparador que ignora patch, ausencia de handshake, sobrescritura sin historial/lock y FLUSH_GLOBAL que solo registra evento.

### Reconciliación y límites
- **TASK-062:** fuente de verdad de la remediación integrada.
- **AUD-NG-077:** conserva validación de compatibilidad e historial de schemaVersion; coordinar dentro de TASK-062, sin crear tarea paralela.
- **AUD-NG-078:** conserva coherencia entre versión declarada, deployment y endpoint real; coordinar dentro de TASK-062.
- **Pruebas:** inspección estática/manual; no se ejecutaron llamadas API, clientes obsoletos, escrituras concurrentes, rollback ni invalidación real.
- **Estado:** FASE2-T17 cumple parcialmente; no se declara compatibilidad ni rollback implementados por la mera existencia de identificadores de versión.
