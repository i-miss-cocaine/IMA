# Auditoría de completadas.md - T-UX-01

**Fecha:** 2026-11-04  
**Rama:** NG_beta_0.0.0.1_work  
**Tarea:** T-UX-01 - Manejo Centralizado de Expiración de Sesión y Excepciones de Autorización  
**Fuente:** completadas.md, SHA f57f1aef832e81e44fc4f7ec36a852d50e464676  
**HEAD de referencia:** ca50510249494edb18cf256b760b76ed4fc05db5

## Dictamen

**CUMPLE PARCIALMENTE.** Existe un manejador central que elimina varias claves de sesión y redirige a `login.html?session_expired=...`. Sin embargo, `fetchApi` no lo invoca cuando recibe `AUTH_PERMISSION_DENIED`; solo registra el rechazo y muestra un toast. La página de login tampoco procesa el parámetro de expiración ni presenta un banner. La prueba UX-01 únicamente verifica que la función exista, no que el flujo completo opere.

## Evidencia

1. **Detección en API:** `js/api.js:116-135` detecta `status === 'error'` y `code === 'AUTH_PERMISSION_DENIED'`, registra el rechazo, muestra una notificación temporal y devuelve `parsed`. No llama a `window.handleSessionExpired`, no limpia credenciales ni redirige. No hay referencias a `handleSessionExpired`, `SESSION_EXPIRED`, `TOKEN_EXPIRED` ni `session_expired` en este archivo.
2. **Contrato backend ambiguo:** `backend/user-service/Code.gs:getUserVerifiedRole` devuelve `NO_ACCESS` si falta el token o `verifySessionToken` no lo valida. `doPost` responde `AUTH_PERMISSION_DENIED` ante el rechazo RBAC (líneas 1351-1358). El mismo código se usa para denegaciones normales de rol, por ejemplo `updateTicketStatus` (línea 547), `replyProblemTicket` (línea 636) y `saveVisualPaletteProposal` (línea 665). No debe cerrarse la sesión ante cualquier 403 de permisos; se necesita diferenciar autenticación inválida/expirada/revocada de autorización insuficiente.
3. **Manejador:** `js/ui-common.js:239-252` define `window.handleSessionExpired(reason)`; elimina `currentUser`, `usuario_actual`, `usuario_sesion` y `sessionToken` de localStorage y sessionStorage, codifica el motivo y redirige a `login.html?session_expired=...`. La limpieza y redirección están implementadas, pero la función se define dentro de `setupCommonUI` y no está conectada a `fetchApi`.
4. **Aviso en login:** se inspeccionó `login.html` completo (172 líneas) y `js/auth.js` completo (252 líneas). Ninguno lee `session_expired`, usa `URLSearchParams` para este fin ni presenta un banner. `js/auth.js` tampoco referencia `handleSessionExpired`.
5. **Prueba UX-01:** `js/ui-common.js:1853-1860` comprueba solo `typeof window.handleSessionExpired === 'function'`. No ejecuta el manejador ni verifica almacenamiento, URL final, banner o diferencia entre sesión inválida y permiso insuficiente. Puede marcar PASS aunque la integración esté desconectada.

## Hallazgo nuevo

**AUD-NG-162 (ALTO, P1): el flujo centralizado de expiración de sesión no está conectado a fetchApi y login no presenta el aviso de expiración.**

El manejador existe, pero el cliente no lo invoca al recibir el rechazo del backend. La página de destino no interpreta el parámetro ni muestra el aviso; la prueba UX-01 solo verifica presencia. Además, el código backend mezcla autenticación inválida/expirada/revocada con denegaciones de rol. Debe separarse el contrato de autenticación del de autorización antes de conectar la redirección, para no cerrar sesiones válidas ante un rechazo ordinario de permisos.

**Tarea derivada:** AUD-NG-162, pendiente de implementación.

## Hallazgos relacionados sin duplicación

- **AUD-NG-001:** propagación incompleta de `sessionToken`; defecto independiente y ya registrado.
- **AUD-NG-003:** vigencia del token en backend; no cubre la integración UX.
- **AUD-NG-005:** coherencia de revocación entre servicios.
- **AUD-NG-159:** bypass de logout y revocación arbitraria.
- **AUD-NG-160:** vigencia del rol firmado en tokens.
- AUD-NG-162 se limita al contrato de errores y la integración de la experiencia de expiración.

## Evaluación de calidad

Hay piezas reutilizables, pero la integración está incompleta. El código de respuesta no distingue autenticación de autorización, la prueba es superficial y puede producir un falso positivo. La calidad de la capacidad es insuficiente para considerar verificado el flujo extremo a extremo.

## Pruebas y límites

- Inspección estática/manual del código versionado.
- No se ejecutaron pruebas de navegador, expiración real, revocación real, navegación ni almacenamiento del navegador.
- No se modificó código fuente, `completadas.md` ni `ChangesLogs.txt`; no se modificó la rama base ni se realizó merge.

## SHA de respaldo

- `js/api.js`: 6b24f666db30a811a8e9b38d466fc6001cf6dfa9.
- `js/ui-common.js`: 986938b8a311a41ed4cb3d135b66b6aaea4bed67.
- `js/auth.js`: 8444dd085a3186106d2db7005b61ef934d3c22d8.
- `login.html`: 3b2e1e8d12a90552ac7b7d584294463a3e8e8f15.
- `backend/user-service/Code.gs`: 12079dd410aa6d8afbce55a4bc62a79dea605f9f.

## Resumen

- T-UX-01: cumple parcialmente.
- Hallazgo nuevo: AUD-NG-162.
- Hallazgos relacionados: AUD-NG-001, AUD-NG-003, AUD-NG-005, AUD-NG-159 y AUD-NG-160.
- Progreso acumulado: 8/183 identificadores únicos auditados; 175 pendientes.
- Siguiente tarea: TAREA-02.
