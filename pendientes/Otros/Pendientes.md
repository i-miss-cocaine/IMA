<!-- ID: AUD-NG-063 | Fuente: índice de hallazgos del Plan Maestro; componente USER -->

> **Ciclo 2:** requisito transversal `IMA-REQ-20261123-PORTAL-SERVICES-ROLES-01` aplicable a cada tarea de este backlog. Las marcas de completado se reabren; la evidencia histórica se conserva.
### [ ] [AUD-NG-063] Proteger secretos y credenciales de proveedores de firma
- **Requisito transversal C2:** aplica `IMA-REQ-20261123-PORTAL-SERVICES-ROLES-01` (Plan Maestro §1.1); conservar íntegros todos los requisitos originales.
- **Componente:** USER — configureAdvancedSignatureProvider / getAdvancedSignatureProviderConfig.
- **Hallazgo:** apiKey se almacenaba en texto claro en ConfiguracionFirmaAvanzada, aunque la respuesta HTTP solo la enmascaraba.
- **Resolución C1.474:** API_KEY y HMAC_SECRET se guardan en Script Properties con clave por proveedor; la clave HMAC coincide con el callback autenticado. Las filas legacy migran bajo ScriptLock, una propiedad ya existente prevalece sobre el valor antiguo y la celda se limpia después de persistir. La respuesta no devuelve secretos y el log RBAC no registra valores.
- **Controles adicionales:** configuracionJSON no admite claves de secreto; endpoint nuevo requiere HTTPS y no admite credenciales/tokens incrustados; endpoint legacy con credenciales se redacciona; la lectura no crea hojas ni inventa proveedor PSC.
- **Verificación local:** 12 escenarios / 17 aserciones V8 PASS; parseo de servicio y contrato PASS. CI Department Scope 42910740964, Task-Service 42910740844 e Identity Mapping 42910740991 — SUCCESS.
- **Estado histórico anterior:** Completada en código. BETA-FUNC-028 Pendiente beta para migración/PropertiesService real.
- **Estado:** Pendiente (reinicio del ciclo 2, C1.964).
- **Riesgo residual:** Script Properties es accesible a editores autorizados del proyecto; no equivale a un gestor externo de secretos ni se afirma cifrado de extremo a extremo.


<!-- ID: AUD-NG-174 | Fuente: Plan Maestro PM-02; auditoría FASE2-02; dependencias TASK-489/T-UX-12 -->
### [ ] [AUD-NG-174] Normalizar contratos API y manejo de errores entre cliente y microservicios
- **Requisito transversal C2:** aplica `IMA-REQ-20261123-PORTAL-SERVICES-ROLES-01` (Plan Maestro §1.1); conservar íntegros todos los requisitos originales.
- **Alcance ejecutado:** fetchApi; textResponse de Academic y Accounting; validateApiContractsTestSuite común; ContentService.MimeType.TEXT; isFallback; contrato API versionado 1.0.0.
- **Contrato:** éxito con data; error con objeto estructurado, código estable y mensaje público seguro; metadata timestamp/correlationId. doPost propaga correlationId.
- **Cliente:** valida JSON/envelope/versión; diferencia vacío legítimo de error; errores de red, timeout, HTTP, HTML, JSON inválido y dependencia fallida no se convierten en success/data:[]; adaptador legacy para servicios aún no versionados.
- **Seguridad:** mensajes renderizados con textContent; caché reconciliada solo en success; timeout de AUD-NG-007 conservado.
- **Pruebas:** suite Node HTTP local y helpers de ambos servicios PASS; Department Scope 43675111519, Identity Mapping 43675111535, Department Reference Consumers 43675111514 y Task-Service 43675111510 SUCCESS.
- **Estado histórico anterior:** Completada en código/CI; BETA-FUNC-097 pendiente.
- **Estado:** Pendiente (reinicio del ciclo 2, C1.964).

<!-- ID: AUD-NG-254 | Fuente: NDASC 1.5, secciones 12 y 17; solicitud de política institucional configurable del 2026-11-19 | Ubicación: última tarea del Plan Maestro (PM-09) -->
### [ ] [AUD-NG-254] Auditoría final de conformidad de módulos con la política institucional configurable y seguridad proporcional
- **Requisito transversal C2:** aplica `IMA-REQ-20261123-PORTAL-SERVICES-ROLES-01` (Plan Maestro §1.1); conservar íntegros todos los requisitos originales.
- **Prioridad:** P1. **Estado:** Pendiente. **Ejecución:** obligatoriamente al final del Plan Maestro, después de concluir las demás tareas planificadas. Esta ubicación es de cierre y no constituye una dependencia que bloquee tareas anteriores.
- **Objetivo:** comprobar si los módulos de IMA respetan la política vigente y detectar qué módulos implementados antes de NDASC 1.5 necesitan adaptación.
- **Criterios de auditoría:**
  1. Contrastar módulos, servicios, endpoints y flujos académicos relevantes con `Normas_Desarollo.md`, especialmente secciones 12 y 17; comprobar que IMA ofrece capacidades configurables y que cada institución decide sus roles, responsabilidades, privilegios y ámbitos.
  2. Verificar que no existan reglas rígidas codificadas que otorguen o nieguen acceso global por el nombre del cargo (por ejemplo, Director, Secretaría o Profesor); el acceso efectivo debe derivarse de la configuración institucional, asignaciones y ámbito aplicable.
  3. Comprobar que la autorización necesaria se aplica en el punto de entrada de cada acción, que se conserva identidad y separación institucional, y que no se repiten sin necesidad autenticación, reconstrucción de roles/permisos, consultas o validaciones equivalentes en cada subfunción, archivo o etapa.
  4. Revisar el uso del contexto autenticado durante la sesión y las operaciones, considerando las limitaciones reales del runtime (incluido Apps Script); no presumir que la memoria de una invocación persiste entre invocaciones. Confirmar actualización/revocación del contexto cuando corresponda sin revalidaciones completas redundantes.
  5. Evaluar rendimiento y simplicidad: llamadas de red, lecturas repetidas, consultas duplicadas y trabajo innecesario. Mantener comprobaciones indispensables para identidad, permisos, ámbito, integridad y funcionamiento; no añadir controles transaccionales ni capas de seguridad desproporcionadas.
  6. Incluir módulos anteriores a NDASC 1.5 y módulos nuevos para comparar consistencia, sin asumir que todo módulo antiguo está defectuoso ni que todo control existente debe eliminarse.
- **Método y evidencia:** recorrer el inventario real de módulos y sus rutas de entrada/consumidores pertinentes; sustentar cada conclusión con archivos, funciones, flujos y pruebas existentes. Clasificar cada módulo como Conforme, Requiere ajuste, No aplica o Evidencia insuficiente. Diferenciar defecto confirmado de riesgo/hipótesis.
- **Entregable:** informe único en `Auditoría/` con alcance, módulos revisados, evidencia verificable, desviaciones, impacto, prioridad y recomendación concreta. Para cada ajuste real pendiente, crear o ampliar una tarea específica en el backlog correspondiente con alcance y criterios de aceptación; no abrir tareas por observaciones menores resueltas durante la auditoría.
- **Verificación:** ejecutar pruebas locales pertinentes para las correcciones incluidas en el propio trabajo de auditoría; los cambios correctivos sustanciales se implementarán mediante sus tareas específicas y pruebas propias. No declarar PASS para módulos no inspeccionados ni convertir pruebas beta en bloqueo de implementación.
- **Límites:** no reescribir módulos en bloque, no imponer permisos universales por rol, no crear una nueva capa de autorización repetida entre servicios y no debilitar controles básicos necesarios. La auditoría debe medir conformidad con la política, no diseñar una política más restrictiva.
- **Cierre:** entregar matriz completa de módulos y hallazgos trazables; toda desviación accionable queda asociada a una tarea de ajuste concreta. La auditoría no se considera completada con una revisión superficial o solo documental.


<!-- ID: F29-TASK01 | Fuente: AUDITORIA_FASE_29_MIGRACION_Y_TRANSICION.md, sección I; Plan Maestro PM-04 -->
### [ ] [F29-TASK01] Tabla Central de Correspondencia de Identificadores (CorrespondenciaIdentificadores)
- **Requisito transversal C2:** aplica `IMA-REQ-20261123-PORTAL-SERVICES-ROLES-01` (Plan Maestro §1.1); conservar íntegros todos los requisitos originales.
- **Prioridad:** P0.
- **Alcance:** persistir la relación por institución entre sistema de origen, tipo de entidad e ID legado con su ID interno; evitar duplicados/conflictos en reimportaciones; conservar hash de origen, versión, estado, método, confianza y actor; resolver referencias en ambos sentidos; exigir revisión humana para confirmar o rechazar; mantener historial auditable y aislamiento institucional.
- **Dependencias:** ninguna declarada en el Plan Maestro.
- **Evidencia de implementación previa:** satisfecha como parte de TASK-068; hoja CorrespondenciaIdentificadores con esquema canónico, inicialización segura, clave compuesta fuente/tipo/ID/institución, registro idempotente, conflicto de destino, resolución bidireccional, revisión humana y HistorialDecisionesIdentidad. La auditoría de consistencia detecta duplicados, filas incompletas y destinos huérfanos sin autocorregir ni fusionar.
- **Verificación:** Auditoría TASK-068 C1.363 dictaminó criterios locales PASS; Identity Mapping and Transport Security Contract run 45291418277 SUCCESS en SHA 364e4dc4c01471226be6fbe47511b306bcc09a73; incluye identity-mapping-contract.test.js y accounting-identity-map-snapshot.test.js, con aislamiento por institución y transporte HMAC firmado ACCOUNTING→USER.
- **Estado histórico anterior:** Completada en código/CI por implementación previa TASK-068; BETA-FUNC-008 permanece PENDIENTE DE BETA para validar transporte entre despliegues, fuentes reales y persistencia en servicios vivos.
- **Estado:** Pendiente (reinicio del ciclo 2, C1.964).
- **Nota de trazabilidad:** se recupera esta entrada faltante del backlog porque el Plan Maestro ya la referencia. No se duplicó ni reimplementó el módulo; se vinculó la evidencia existente al identificador F29-TASK01.


> **Incidencia de integridad C1.964:** el Plan Maestro contiene 1.350 IDs únicos; los siete backlogs actuales contienen 687 IDs únicos; 672 IDs del plan no tienen bloque vigente (671 asignados a Otros y 1 a Docente). No se reconstruyen requisitos desde títulos; recuperación AUD-NG-393.


<!-- ID: AUD-NG-393 | Fuente: auditoría de continuidad C1.964 -->
### [ ] [AUD-NG-393] Recuperar y reconciliar los bloques de tareas ausentes del backlog
- **Requisito transversal C2:** aplica `IMA-REQ-20261123-PORTAL-SERVICES-ROLES-01` (Plan Maestro §1.1); conservar íntegros todos los requisitos originales.
- **Prioridad:** P0 para integridad del plan; no bloquea tareas independientes del portal.
- **Hallazgo:** la tabla del Plan Maestro contiene 1.350 IDs únicos; los siete backlogs actuales contienen 687 IDs únicos. Hay 672 IDs del plan sin bloque vigente: 671 asignados a Otros y 1 a Docente. Nueve IDs actuales no aparecen en la tabla maestra.
- **Objetivo:** recuperar los requisitos originales completos y reconciliar el índice sin inventar requisitos ni sustituir especificaciones por títulos.
- **Acción:** buscar blobs/commits de la rama autorizada, informes de auditoría y fuentes originales; comparar IDs, títulos, requisitos, criterios, dependencias y estados.
- **Criterios:** restaurar los 672 bloques completos o identificar por ID la fuente no recuperable; reconciliar los 1.350 IDs del plan y los 9 no indexados; preservar criterios, dependencias, prioridad, archivos y evidencia.
- **Estado:** Pendiente.
