<!-- ID: AUD-NG-063 | Fuente: índice de hallazgos del Plan Maestro; componente USER -->
### [x] [AUD-NG-063] Proteger secretos y credenciales de proveedores de firma
- **Componente:** USER — configureAdvancedSignatureProvider / getAdvancedSignatureProviderConfig.
- **Hallazgo:** apiKey se almacenaba en texto claro en ConfiguracionFirmaAvanzada, aunque la respuesta HTTP solo la enmascaraba.
- **Resolución C1.474:** API_KEY y HMAC_SECRET se guardan en Script Properties con clave por proveedor; la clave HMAC coincide con el callback autenticado. Las filas legacy migran bajo ScriptLock, una propiedad ya existente prevalece sobre el valor antiguo y la celda se limpia después de persistir. La respuesta no devuelve secretos y el log RBAC no registra valores.
- **Controles adicionales:** configuracionJSON no admite claves de secreto; endpoint nuevo requiere HTTPS y no admite credenciales/tokens incrustados; endpoint legacy con credenciales se redacciona; la lectura no crea hojas ni inventa proveedor PSC.
- **Verificación local:** 12 escenarios / 17 aserciones V8 PASS; parseo de servicio y contrato PASS. CI Department Scope 42910740964, Task-Service 42910740844 e Identity Mapping 42910740991 — SUCCESS.
- **Estado:** Completada en código. BETA-FUNC-028 Pendiente beta para migración/PropertiesService real.
- **Riesgo residual:** Script Properties es accesible a editores autorizados del proyecto; no equivale a un gestor externo de secretos ni se afirma cifrado de extremo a extremo.


<!-- ID: AUD-NG-174 | Fuente: Plan Maestro PM-02; auditoría FASE2-02; dependencias TASK-489/T-UX-12 -->
### [x] [AUD-NG-174] Normalizar contratos API y manejo de errores entre cliente y microservicios
- **Alcance ejecutado:** fetchApi; textResponse de Academic y Accounting; validateApiContractsTestSuite común; ContentService.MimeType.TEXT; isFallback; contrato API versionado 1.0.0.
- **Contrato:** éxito con data; error con objeto estructurado, código estable y mensaje público seguro; metadata timestamp/correlationId. doPost propaga correlationId.
- **Cliente:** valida JSON/envelope/versión; diferencia vacío legítimo de error; errores de red, timeout, HTTP, HTML, JSON inválido y dependencia fallida no se convierten en success/data:[]; adaptador legacy para servicios aún no versionados.
- **Seguridad:** mensajes renderizados con textContent; caché reconciliada solo en success; timeout de AUD-NG-007 conservado.
- **Pruebas:** suite Node HTTP local y helpers de ambos servicios PASS; Department Scope 43675111519, Identity Mapping 43675111535, Department Reference Consumers 43675111514 y Task-Service 43675111510 SUCCESS.
- **Estado:** Completada en código/CI; BETA-FUNC-097 pendiente.

<!-- ID: AUD-NG-254 | Fuente: NDASC 1.5, secciones 12 y 17; solicitud de política institucional configurable del 2026-11-19 | Ubicación: última tarea del Plan Maestro (PM-09) -->
### [ ] [AUD-NG-254] Auditoría final de conformidad de módulos con la política institucional configurable y seguridad proporcional
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
