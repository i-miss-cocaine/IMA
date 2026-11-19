# AUDITORÍA TÉCNICA - TAREA-F6-039: Centralizar la configuración y las dependencias sin centralizar todos los datos (alcance ampliado)

**Fecha:** 2026-11-07  
**Repositorio:** i-miss-cocaine/IMA  
**Rama:** NG_beta_0.0.0.1_work  
**Checkpoint inicial:** C1.230  
**Checkpoint de cierre:** C1.231  
**Sesión:** IMA-AUDIT-20261107-2125Z-01  
**HEAD auditado:** 201373cd3b859eb1cc523eda920ab8a91e4af4ce  
**Estado en completadas.md:** [X] (se conserva como dato histórico)  
**Dictamen:** **NO CUMPLE**  
**Informe base:** AUDITORIAS/AUDITORIA_COMPLETADAS_TAREA-F6-014.md  
**Relación:** F6-039 amplía F6-014 con CA-129..CA-135 y CA-168..CA-169; ambos comparten el bloque canónico de tareas derivadas descrito en el informe base.

## 1. Fuentes y continuidad

- completadas.md SHA f57f1aef832e81e44fc4f7ec36a852d50e464676: F6-039 [X], línea 3802 y criterios ampliados siguientes.
- ChangesLogs.txt SHA 5b5cff1926b73a05d1b92087a7bf4b2db75326ff, líneas 2191-2196: afirma catálogo central y validación previa de dependencias; el código devuelve PASS constante y no verifica recursos.
- Pendientes.md blob SHA 631b4c2dbf0e86d5704b63625382d73ccb8ceb3c: 1.803.672 bytes, 1.782.094 caracteres, 20.182 líneas, sin U+FFFD; F6-039 no aparece. No se modificó.
- No existía informe individual AUDITORIAS/AUDITORIA_COMPLETADAS_TAREA-F6-039.md en el árbol de la rama. Se crea este informe.
- El informe F6-014 contiene los hallazgos técnicos H1-H9, SHAs de respaldo, matriz CA-070..CA-073 y el bloque canónico de tareas. Este informe agrega la evaluación específica de los criterios ampliados, sin duplicar causas ni tareas.

## 2. Matriz de aceptación ampliada

| Criterio | Dictamen | Evidencia |
|---|---|---|
| CA-129: cada servicio tiene configuración registrada y verificable | No cumple | SERVICE_REGISTRY es estático, con recursos de ejemplo y estado ACTIVE; el registro backend omite deploymentId, Drive y dependencias completas. |
| CA-130: las dependencias se consultan desde el dashboard | No cumple | No se localizó integración de getCentralServiceRegistry/getCentralSpreadsheetConfigRegistry ni vista de dependencias en js/developer.js/developer-dashboard.html. |
| CA-131: configuración incompleta detectada antes de activar instancia | No cumple | validateServiceConfigDependencies usa Boolean(valor || true), permissionsCheck PASS e isReadyForActivation true. |
| CA-132: cambios de configuración registrados y auditables | Parcial | updateServiceStatus guarda cambios de estado; no existe historial completo/versionado de endpoints, recursos, dependencias, parámetros y permisos. |
| CA-133: retirar un servicio no deja referencias activas sin identificar | No cumple | el estado se modifica en CatalogoServicios, pero SERVICE_URLS, SERVICE_REGISTRY y contratos estáticos permanecen activos; no hay análisis de referencias entrantes. |
| CA-134: dashboards distinguen indisponibilidad de ausencia de datos | Parcial | fetchApi incluye isFallback, pero devuelve status success/data vacía para get* y depende de que cada consumidor interprete la bandera; no hay contrato uniforme. |
| CA-135: se identifican funciones disponibles cuando falla una dependencia | No cumple | no hay grafo de dependencias operativo ni catálogo de capacidades alternativas/degradadas por servicio. |
| CA-168: endpoints y contratos consultables en un registro central actualizado | Parcial | existe catálogo estático de acciones, pero es parcial, no versiona contratos por operación ni se contrasta con dispatchers/deployments. |
| CA-169: cambios de roles, áreas y coordinaciones se reflejan en servicios autorizados sin cambios manuales dispersos | No cumple | ROLE_PERMISSIONS y configuraciones de dashboards siguen distribuidas; no se demuestra propagación desde una fuente central versionada. |

## 3. Hallazgos ampliados

1. **Configuración no verificable por instancia:** el catálogo central no enlaza proyecto Apps Script, deployment, URL efectiva, recursos, dependencias y permisos reales. Los valores estáticos del frontend no se actualizan desde el backend.
2. **Validación previa con falso PASS:** la respuesta de validación se construye con valores constantes, sin consultar Drive/Spreadsheet, ACL, endpoint ni dependencias. No puede bloquear activación inválida.
3. **Historial insuficiente:** existe historial de transición de estado, pero no versionado integral de cambios de configuración. No se conserva una versión anterior completa que permita comparar o revertir.
4. **Retiro no propagado:** marcar un servicio como retirado no actualiza el catálogo frontend ni invalida endpoints/contratos; las llamadas pueden continuar dirigiéndose a URL estática.
5. **Dashboard no conectado:** la consola no ofrece consulta ni administración verificable de dependencias, configuraciones, historial o capacidades disponibles.
6. **Degradación opaca:** el fallback de fetchApi puede presentar indisponibilidad como respuesta vacía exitosa si el consumidor no trata isFallback como error explícito.
7. **Permisos no centralizados:** cambios de roles/áreas no se propagan automáticamente a matrices backend y vistas autorizadas; persiste riesgo de divergencia.
8. **Contratos incompletos:** el catálogo de endpoints no ofrece esquemas, parámetros, respuesta, errores, permisos y compatibilidad verificables por versión.
9. **Pruebas insuficientes:** las aserciones existentes verifican presencia textual de funciones/etiquetas, no comportamiento real ni los criterios ampliados.

## 4. Reconciliación

Se reutilizan y amplían sin duplicación:

- AUD-NG-011: registro y ciclo de vida de despliegues, recursos, endpoints y permisos.
- AUD-NG-077: versiones de configuración/esquema, historial y compatibilidad.
- AUD-NG-078: registro central, endpoint/deployment y contratos verificables.
- AUD-NG-081: pruebas aisladas y funcionales.
- AUD-NG-158: roles, áreas, coordinaciones y alcance contextual.
- AUD-NG-174: contratos API, compatibilidad, errores y llamadas obsoletas.
- F6-004-A01/A02/A04/A05/A06; F6-007-A05; F6-008-A04/A05; F6-009-A02/A06.

No se crean nuevos IDs AUD-NG ni tareas locales duplicadas. F6-039 comparte el bloque canónico de tareas del informe F6-014 y agrega CA-129..CA-135/CA-168..CA-169 a sus criterios de aceptación.

## 5. Tareas ejecutables derivadas de los hallazgos

**Bloque canónico compartido:** ver sección 5 de AUDITORIAS/AUDITORIA_COMPLETADAS_TAREA-F6-014.md. F6-039 amplía las mismas tareas existentes:

- F6-004-A01: preservar almacenamiento operativo separado mientras se centraliza metadato y configuración.
- F6-004-A02: registro verificable por servicio, dependencias, estado, historial y retiro (CA-129, CA-131..CA-133).
- F6-004-A04: resolver endpoints y contratos versionados; detectar llamadas obsoletas (CA-133, CA-168).
- F6-004-A05: validar dependencias y declarar capacidades degradadas reales (CA-131, CA-135).
- F6-004-A06: pruebas de compatibilidad, retiro, indisponibilidad y recuperación.
- F6-007-A05: versionar y auditar cambios de configuración por instancia (CA-132).
- F6-008-A04: propagar roles, áreas y coordinaciones con validación backend (CA-169).
- F6-008-A05: dashboard de configuración, dependencias, historial y capacidades disponibles (CA-130, CA-133, CA-135).
- F6-009-A02: distinguir indisponibilidad de ausencia legítima de datos (CA-134).
- F6-009-A06: probar el mapa de dependencias y la degradación segura.

**Estado de todas las tareas:** Pendiente. Los criterios de F6-039 no crean una segunda copia de las tareas; amplían el alcance de los IDs canónicos indicados.

## 6. Pruebas y límites

- **Ejecutadas:** inspección manual de catálogo, validador, registry, lifecycle, resolver API, configuración frontend, roles, dashboard, pruebas estructurales, SHAs, blob de Pendientes.md y árbol de la rama.
- **No ejecutadas:** Apps Script runtime, OAuth, endpoints HTTP, cambios de configuración reales, despliegues, navegador, permisos Drive/Sheets, pruebas de indisponibilidad, concurrencia ni E2E.
- No se modificó código, configuración ni datos productivos.

## 7. Cierre

- TAREA-F6-039: **NO CUMPLE**.
- La marca [X] en completadas.md se conserva como histórico.
- F6-039 amplía F6-014 y comparte su bloque canónico de tareas derivadas.
- Se amplían registros AUD-NG existentes; no se crean IDs duplicados.
- Siguiente auditoría secuencial: TAREA-F6-015 y TAREA-F6-040.

## 8. Referencias

- completadas.md SHA f57f1aef832e81e44fc4f7ec36a852d50e464676, F6-039 línea 3802 y criterios ampliados.
- ChangesLogs.txt SHA 5b5cff1926b73a05d1b92087a7bf4b2db75326ff, líneas 2191-2196.
- Pendientes.md blob SHA 631b4c2dbf0e86d5704b63625382d73ccb8ceb3c.
- Informe base: AUDITORIAS/AUDITORIA_COMPLETADAS_TAREA-F6-014.md.
- Código y UI: mismos respaldos inmutables enumerados en el informe F6-014.
