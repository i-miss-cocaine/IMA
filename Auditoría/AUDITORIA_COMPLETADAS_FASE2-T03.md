# Auditoría de tareas completadas - FASE2-T03

**Fecha:** 2026-11-05  
**Repositorio:** i-miss-cocaine/IMA  
**Rama:** NG_beta_0.0.0.1_work  
**HEAD de partida:** 636627f4083745d2f24f12cf8a52247a901ff31a  
**Rama base:** NG_beta_0.0.0.1 (44d9891132332e692dbe2ba8602b41f50a508a59, sin cambios)  
**Tarea:** FASE2-T03 - Establecer contratos API verificables y pruebas automáticas de compatibilidad

## Dictamen

**CUMPLE PARCIALMENTE.** Existen piezas iniciales de estandarización (`textResponse` en Academic/Accounting y `validateApiContractsTestSuite` en Academic), pero no hay un contrato completo documentado ni validado de extremo a extremo. Faltan inventario de operaciones y consumidores, esquemas y validación transversal, compatibilidad versionada y pruebas fiables para los tres servicios.

## Evidencia y verificación

- `completadas.md` SHA `f57f1aef832e81e44fc4f7ec36a852d50e464676`: nueve requisitos funcionales y ocho criterios de aceptación.
- `js/api.js` SHA `6b24f666db30a811a8e9b38d466fc6001cf6dfa9`, `fetchApi` líneas 11-181: parsea JSON, pero no valida esquemas de entrada/salida; para acciones get rellena data=[] cuando falta; ante fallos puede devolver status success/data vacía/isFallback. El toast concatena parsed.message en innerHTML.
- Academic SHA `daf1883ec0b8d4f0ff2bc673af8a4e8c5bbd03fc`: `textResponse` líneas 20-25 asigna success por defecto, agrega timestamp y código genérico solo para errores. `validateApiContractsTestSuite` aprox. 3915-3965 cubre cuatro acciones; ping es sintético, invoca funciones locales y considera PASS si status es success O error.
- Accounting SHA `38b979d41596b85e888b4a7060b37bbac0840a28`: mismo helper superficial y dispatcher `doPost`; no se identificó suite equivalente de contratos.
- User SHA `12079dd410aa6d8afbce55a4bc62a79dea605f9`: dispatcher `doPost` (1351-1620), aplica autorización, pero su catch devuelve err.message.
- Suites revisadas: modular-dashboard-suite.js SHA `0495e1d526a872c33310935a003a83d924d34683` y academic-grading-suite.js SHA `3433b707edd4a2f35c68368a3172932adc2a3b32`; las comprobaciones son mayormente estructurales, no validan compatibilidad contractual conductual.
- FASE2-02/C1.30 y AUD-NG-174 son posteriores y ya cubren parte del mismo problema; sus hallazgos se amplían, no se duplican.

### Resultado por requisitos

1. **Inventario de operaciones y consumidores:** incumplido. Los routers y matrices de permisos enumeran acciones, pero no existe catálogo contractual completo que las relacione con consumidores, propósito, parámetros, tipos, restricciones, respuesta, errores y efectos secundarios.
2. **Seguridad y repetición por operación:** parcial. Hay autorización central en los routers, pero no especificación contractual por endpoint de permisos, efectos persistentes/externos ni semántica de repetición/idempotencia.
3. **Envelope común de éxito/error:** parcial e insuficiente. textResponse no garantiza data/error, mensaje público seguro, correlationId/requestId, detalles seguros ni versión. Asigna success si falta status. Los catch exponen err.message.
4. **Vacío, fallo y fallback:** incumplido. fetchApi rellena data vacía en respuestas incompletas y puede devolver status success con isFallback ante indisponibilidad.
5. **Validación de solicitudes/respuestas:** incumplido como garantía transversal. fetchApi no valida esquemas; los handlers solo aplican validaciones puntuales.
6. **Compatibilidad y versionado:** incumplido. No se encontró versión común ni política documentada de campos opcionales, deprecación o cambios incompatibles.
7. **Pruebas automatizadas:** incumplido. La suite Academic cubre cuatro acciones locales, acepta status:error como PASS y devuelve status success aun con fallos; no atraviesa HTTP/doPost/fetchApi. No se identificó suite equivalente en Accounting.
8. **Paginación, correlación e idempotencia:** parcial. fetchApi no genera ni propaga metadatos comunes; FASE2-T02 ya fue auditada y la idempotencia sigue parcial.

## Calidad

La implementación es fragmentada. Los helpers normalizan solo campos superficiales, mutan el objeto recibido y asignan éxito por defecto. fetchApi concentra transporte, caché, fallback y presentación sin validación contractual. La suite produce falsos positivos y no está aislada del transporte real. La documentación de dependencias no sustituye un catálogo API.

## Reconciliación

Ampliar **AUD-NG-174** con inventario de endpoints/consumidores, esquemas de entrada/salida, permisos, efectos secundarios, repetición/idempotencia, versionado y pruebas de compatibilidad. No crear un AUD-NG duplicado. Mantener AUD-NG-007, AUD-NG-006 y AUD-NG-161 como referencias transversales.

## Pruebas y limitaciones

Inspección estática/manual. **No se ejecutaron** Apps Script, HTTP a deployments, navegador, simulaciones de timeout/HTML/JSON inválido, suites automatizadas ni operaciones productivas. No se modificó código fuente.

## Progreso

- Identificadores auditados: **39/183**; 144 pendientes.
- Última tarea auditada: FASE2-T03.
- Siguiente tarea: FASE2-T04 - Establecer una fuente de verdad institucional para catálogos, configuraciones y referencias.

## Tareas ejecutables derivadas de los hallazgos

### [AUD-NG-174] Ampliar el contrato API con inventario, esquemas y compatibilidad versionada
- **Hallazgo de origen:** FASE2-T03, secciones Resultado por requisitos y Reconciliación; ampliación del mismo AUD-NG-174 registrado en FASE2-02.
- **Severidad:** Alto.
- **Objetivo:** convertir el contrato común de respuestas en una especificación completa por endpoint, consumidor y efecto.
- **Acción ejecutable:** inventariar operaciones y consumidores; documentar propósito, parámetros/tipos/restricciones, respuesta/error, autorización, efectos persistentes/externos y semántica de repetición; definir versionado, campos opcionales, deprecación y cambios incompatibles; ampliar la suite compartida para USER, ACADEMIC y ACCOUNTING; asegurar que pruebas atraviesen HTTP/doPost/fetchApi.
- **Archivos/módulos afectados:** js/api.js, backend/user-service/Code.gs, backend/academic-service/Code.gs, backend/accounting-service/Code.gs, tests/regression y documentación de contratos.
- **Dependencias y riesgos:** AUD-NG-006 para idempotencia, AUD-NG-007 para timeout, AUD-NG-161 para calidad de pruebas. No crear otro ID para el mismo contrato.
- **Alcance:** ampliación de AUD-NG-174, no una tarea independiente.
- **Criterios de aceptación:** cada endpoint tiene contrato versionado y consumidor identificado; validación de request/response y autorización; errores no exponen excepciones internas; cambios incompatibles se detectan; suite compartida prueba transporte real y falla ante status:error inesperado o envelope inválido.
- **Prioridad:** P1.
- **Estado:** Pendiente.
- **Evidencia de cierre:** catálogo API, esquemas versionados y resultados de suite de compatibilidad.
