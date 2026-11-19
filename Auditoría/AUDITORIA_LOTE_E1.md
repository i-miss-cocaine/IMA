# Informe de auditoría - Lote E1

**Fecha:** 2026-11-04  
**Repositorio:** i-miss-cocaine/IMA  
**Rama base:** `NG_beta_0.0.0.1`  
**Rama de trabajo:** `NG_beta_0.0.0.1_work`  
**Commit de referencia:** `44d9891132332e692dbe2ba8602b41f50a508a59`

## Alcance

Se revisaron REQ-EXP-007 (marca institucional/PWA) y REQ-EXP-008 (RBAC/HMAC). La inspección fue estática. No se modificó código ni se consultaron Script Properties de producción.

## REQ-EXP-007 - Marca institucional y PWA
**Estado: Cumple en las vistas y activos principales inspeccionados.** `index.html`, `login.html`, `register.html`, `student-dashboard.html` y `teacher-dashboard.html` muestran el nombre New Generation Bilingual School and Institute, enlazan `imagenes/new-generation-logo.png` y usan `manifest.json`. El manifest define `name`, `short_name` New Generation, `start_url`, `display: standalone` e iconos con el recurso nuevo. No se encontró el nombre institucional anterior en los encabezados de las páginas revisadas. La existencia del archivo fue confirmada en el árbol Git; no se verificaron sus dimensiones ni el renderizado en un dispositivo real.

## REQ-EXP-008 - RBAC/ABAC server-side y tokens HMAC
**Estado: Cumple parcialmente.** Hay implementación real de HMAC-SHA256, tokens con expiración de 24 horas, revocación de usuario/sesión, verificación de estado de cuenta, matriz `ROLE_PERMISSIONS`, permisos dinámicos, delegaciones, `validateContextualAccess` y respuesta `AUTH_PERMISSION_DENIED`. Sin embargo:

1. `getAuthTokenSecret` (`Code.gs:986-1000`) deriva un secreto si falta `AUTH_TOKEN_SECRET` a partir de `SPREADSHEET_ID` y una cadena fija; el Spreadsheet ID está en el código versionado. Esto hace predecible el secreto de sesión si no se configura correctamente.
2. Los tokens de recuperación usan `SECRET_KEY`, cuyo fallback es un literal de desarrollo conocido (`Code.gs:9`, uso en `2626-2637`).
3. `validateRolePermission` (`1253-1290`) autoriza diez acciones antes de ejecutar la matriz y la validación contextual. En ese conjunto, `getProblemTickets` usa `payload.userId` y si falta devuelve todos los tickets; `replyProblemTicket` puede responder a cualquier ticket si el userId no se proporciona; `submitProblemTicket` acepta el propietario desde el payload; `getAutomationRules` no contiene un control de rol interno.
4. `configureAutomationRules`, `getNotificationAuditLogs`, `getServiceHealthReport` y `getPrivacyRightsRequests` sí tienen verificaciones internas parciales, pero no justifican el bypass general.

Hallazgos AUD-NG-127 y AUD-NG-128.

## Pruebas y límites

No se ejecutaron pruebas de falsificación de tokens, recuperación de contraseña, IDOR o denegación RBAC. No se inspeccionaron las propiedades secretas del despliegue GAS; por ello no se afirma que la instancia productiva use el fallback, pero el código lo permite si las propiedades faltan.

## Continuidad

- Dos tareas históricas inspeccionadas; ninguna marca histórica fue alterada.
- No se modificó código fuente, `completadas_legacy.md` ni `ChangesLogs.txt`.
- Siguiente sublote: E2 (REQ-EXP-009 a REQ-EXP-012).
