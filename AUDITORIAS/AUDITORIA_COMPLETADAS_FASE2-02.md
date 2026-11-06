AUDITORÍA DE TAREAS COMPLETADAS - FASE2-02
FECHA: 2026-11-05
REPOSITORIO: i-miss-cocaine/IMA
RAMA: NG_beta_0.0.0.1_work
HEAD DE PARTIDA: 17967cec0c62eed762068bfa03be19c88714635f
================================================================

DICTAMEN: CUMPLE PARCIALMENTE. Academic y Accounting comparten un helper de respuesta que añade status, timestamp y un código genérico de error, y el cliente parsea JSON y presenta fallbacks. Sin embargo, no existe un contrato de respuesta completo y validado extremo a extremo: fetchApi no valida esquemas, devuelve respuestas de error de forma heterogénea y puede convertir fallos de lectura en respuestas success vacías. La prueba de contratos de Academic es limitada y permite que una respuesta error cuente como PASS; Accounting carece de una suite equivalente.

ALCANCE Y EVIDENCIA
- completadas.md define FASE2-02 como "Normalización de Contratos API y Manejo Controlado de Errores"; archivos: js/api.js, backend/academic-service/Code.gs y backend/accounting-service/Code.gs.
- El informe de origen AUDITORIA_FASE2_ARQUITECTURA_INTEROPERABILIDAD.md citado por ChangesLogs.txt no está presente en el árbol de la rama; se utiliza el alcance explícito de completadas.md.
- js/api.js SHA 6b24f666db30a811a8e9b38d466fc6001cf6dfa9.
- backend/academic-service/Code.gs SHA daf1883ec0b8d4f0ff2bc673af8a4e8c5bbd03fc.
- backend/accounting-service/Code.gs SHA 38b979d41596b85e888b4a7060b37bbac0840a28.
- tests/regression/modular-dashboard-suite.js SHA 0495e1d526a872c33310935a003a83d924d34683.

1. NORMALIZACIÓN BACKEND
- Academic y Accounting definen textResponse con la misma lógica: si falta status, se asigna "success"; si falta timestamp, se genera; si status es "error" y falta code, se asigna "INTERNAL_ERROR".
- El helper no normaliza un esquema de error completo (tipo, código estable, mensaje público, detalles seguros, correlationId), ni garantiza data para lecturas o un envelope único para todos los endpoints.
- La respuesta JSON se envía con ContentService.MimeType.TEXT. fetchApi consume response.text() y luego JSON.parse; funciona para este cliente, pero no hay contrato de media type JSON uniforme.
- Los catch de doPost devuelven error.message al cliente. No se demuestra una capa que traduzca excepciones internas a códigos públicos estables y mensajes seguros.

2. CLIENTE js/api.js
- fetchApi hace JSON.parse, pero no valida un esquema de respuesta común ni verifica que status, data/error y metadatos cumplan un contrato.
- Para acciones que empiezan por "get", si status es success y falta data, asigna data=[]; puede ocultar respuestas incompletas o incompatibles.
- Ante fallos de transporte, HTML o JSON inválido, algunas lecturas retornan {status:"success", data:[], isFallback:true}; otros casos retornan status:error. El marcador isFallback existe, pero un consumidor que no lo compruebe puede confundir indisponibilidad con una consulta válida sin resultados.
- Las respuestas backend status:error se devuelven sin normalización de campos; el cliente mezcla errores HTTP, de transporte, parseo y negocio con formatos distintos.
- El toast de autorización inserta parsed.message en innerHTML sin escape contextual.
- El timeout configurable ignorado y la limpieza del temporizador están registrados en AUD-NG-007 (C1.28); no se duplica ese hallazgo aquí.

3. PRUEBAS Y COMPATIBILIDAD
- Academic contiene validateApiContractsTestSuite (línea aproximada 3915), con cuatro casos: ping sintético, getAcademicConfig, getSectionEquivalences y calculateUnifiedAcademicGrade.
- El ping se construye localmente, no hace una petición HTTP. La suite no pasa por textResponse/fetchApi ni verifica el contrato entre deployments.
- La condición de PASS permite status "success" O "error" siempre que existan las claves requeridas. Una respuesta de error puede contabilizarse como contrato aprobado incluso cuando el caso esperaba éxito.
- No se encontraron pruebas de contrato equivalentes en Accounting ni casos que prueben HTTP error, JSON inválido, HTML, timeout, payload malformado, error interno o fallbacks de lecturas.
- tests/regression/modular-dashboard-suite.js no contiene referencias a FASE2-02, fetchApi, textResponse ni validación de contratos.

4. CALIDAD Y RIESGOS
- La normalización parcial mejora la consistencia mínima de status/timestamp, pero deja formatos de éxito y error dependientes de cada handler.
- El fallback success/data:[] en consultas puede ocultar un servicio caído o una respuesta incompatible si el consumidor ignora isFallback.
- La suite de contratos produce falsos positivos potenciales porque acepta status:error y no ejecuta el transporte real.
- La inserción de parsed.message en innerHTML requiere renderizado como texto para evitar interpretar contenido dinámico como HTML.
- No hay evidencia de compatibilidad contractual entre Academic y Accounting ni de una versión de esquema compartida.

RECONCILIACIÓN
- Nuevo hallazgo AUD-NG-174: definir y aplicar un contrato común de respuestas/errores, validar el envelope en fetchApi, separar vacío legítimo de indisponibilidad y probar Academic/Accounting sobre transporte real.
- AUD-NG-007 conserva el timeout configurable y limpieza de temporizadores; no duplicar.
- FASE2-T03 aporta el helper textResponse y una suite parcial, pero no cierra la integración ni los falsos positivos descritos.
- No modificar completadas.md, ChangesLogs.txt ni código fuente.

PRUEBAS Y LIMITACIONES
- Inspección estática/manual de js/api.js, Academic, Accounting, validateApiContractsTestSuite y suite de regresión.
- No se ejecutaron requests HTTP a deployments, simulaciones de fallos, pruebas de contrato de Accounting ni pruebas de navegador.
- No se usaron datos productivos; no se afirma validación dinámica.
================================================================