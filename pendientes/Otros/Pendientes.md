<!-- ID: AUD-NG-063 | Fuente: índice de hallazgos del Plan Maestro; componente USER -->
### [x] [AUD-NG-063] Proteger secretos y credenciales de proveedores de firma
- **Componente:** USER — configureAdvancedSignatureProvider / getAdvancedSignatureProviderConfig.
- **Hallazgo:** apiKey se almacenaba en texto claro en ConfiguracionFirmaAvanzada, aunque la respuesta HTTP solo la enmascaraba.
- **Resolución C1.474:** API_KEY y HMAC_SECRET se guardan en Script Properties con clave por proveedor; la clave HMAC coincide con el callback autenticado. Las filas legacy migran bajo ScriptLock, una propiedad ya existente prevalece sobre el valor antiguo y la celda se limpia después de persistir. La respuesta no devuelve secretos y el log RBAC no registra valores.
- **Controles adicionales:** configuracionJSON no admite claves de secreto; endpoint nuevo requiere HTTPS y no admite credenciales/tokens incrustados; endpoint legacy con credenciales se redacciona; la lectura no crea hojas ni inventa proveedor PSC.
- **Verificación local:** 12 escenarios / 17 aserciones V8 PASS; parseo de servicio y contrato PASS. CI Department Scope 42910740964, Task-Service 42910740844 e Identity Mapping 42910740991 — SUCCESS.
- **Estado:** Completada en código. BETA-FUNC-028 Pendiente beta para migración/PropertiesService real.
- **Riesgo residual:** Script Properties es accesible a editores autorizados del proyecto; no equivale a un gestor externo de secretos ni se afirma cifrado de extremo a extremo.
