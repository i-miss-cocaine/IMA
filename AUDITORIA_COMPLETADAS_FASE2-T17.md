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