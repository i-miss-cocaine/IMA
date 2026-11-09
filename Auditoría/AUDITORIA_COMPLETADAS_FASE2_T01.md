# Auditoría de completadas.md - FASE2-T01

**Fecha:** 2026-11-04  
**Rama:** NG_beta_0.0.0.1_work  
**Tarea:** FASE2-T01 - autorización institucional y vigencia de permisos entre servicios  
**Fuente:** completadas.md, SHA f57f1aef832e81e44fc4f7ec36a852d50e464676

## Dictamen
**CUMPLE PARCIALMENTE.** Existen verificadores HMAC, matrices RBAC y validación contextual en los cinco servicios, pero la propagación del token no está integrada en el cliente, hay rutas públicas que eluden autorización y la revocación de sesiones/privilegios no satisface todos los criterios.

## Evidencia por criterio
1. **Identidad real:** loginUser genera un token firmado con userId, role, accountState, iat, exp y sessionId. js/auth.js:140-165 no conserva sessionToken en currentUser y js/api.js:45-57 no lo transmite. AUD-NG-001.
2. **Autenticación y autorización:** los servicios verifican claims y luego aplican matrices RBAC. TASK/PUBLIC_ACTIONS y EXAM/PUBLIC_ACTIONS eximen consultas sensibles de la validación. AUD-NG-002.
3. **No confiar en datos del cliente:** los validadores derivan _verifiedUserId/_verifiedRole de claims, pero existen rutas públicas y handlers que todavía leen atributos del payload. El caso académico está en AUD-NG-013; logoutUser queda en AUD-NG-159.
4. **Revocación/desactivación:** verifySessionToken comprueba revocación y estado de cuenta. El estado se cachea por usuario durante 60 segundos y las cachés son propias de cada despliegue. AUD-NG-005.
5. **Vigencia:** generateSessionToken fija exp a 24 horas, pero verifySessionToken solo rechaza expiración cuando claims.exp existe. AUD-NG-003.
6. **Cambio de rol:** el token incorpora role al emitirse. verifySessionToken no compara el rol del token con el rol vigente del usuario ni con una versión de rol/sesión. Los validadores usan claims.role. No se encontró invalidación automática ante cambios de rol. Nuevo AUD-NG-160.
7. **Caché:** getUserVerifiedRole no mantiene una caché propia de decisión por usuario. La matriz dinámica es global por rol/acción; el estado de cuenta sí usa caché por userId.
8. **Fallo de autorización:** cuando no hay permiso dinámico disponible, los validadores consultan la matriz estática por rol; no conceden acceso sin coincidencia explícita. Las acciones públicas sí omiten la validación.
9. **Acceso directo:** los routers validan acciones protegidas antes de despachar; la excepción son las acciones públicas. No se ejecutaron pruebas de equivalencia UI/backend.
10. **Auditoría:** USER tiene logStructuredEvent, pero la atribución del actor no es uniforme en todos los handlers. La revocación anónima de logoutUser puede alterar el estado de otro usuario.
11. **Mínimo privilegio y despliegue:** la comunicación interservicio se relaciona con TASK-048 y AUD-NG-083/084/086. Los permisos efectivos de ejecución Apps Script no son verificables desde el repositorio.

## Hallazgos relacionados
AUD-NG-001, AUD-NG-002, AUD-NG-003, AUD-NG-004, AUD-NG-005, AUD-NG-013, AUD-NG-112, AUD-NG-159, AUD-NG-160, TASK-048, AUD-NG-083, AUD-NG-084 y AUD-NG-086.

## Resultado
- FASE2-T01: cumple parcialmente.
- Hallazgo nuevo: AUD-NG-160 (alto, P1); AUD-NG-159 también afecta esta tarea.
- No se modificó código fuente ni completadas.md.
- No se ejecutaron pruebas de integración ni pruebas contra despliegues productivos.

---

## Tareas ejecutables derivadas de los hallazgos

> Se formalizan los dos hallazgos accionables propios de FASE2-T01. AUD-NG-159 conserva su alcance específico de revocación arbitraria; AUD-NG-160 se amplía para incorporar la vigencia del rol firmado en los tokens. Los hallazgos relacionados que ya tienen tareas se mantienen como referencias, sin crear IDs duplicados.

### [AUD-NG-159] Restringir el cierre de sesión y la revocación a identidades autorizadas
- **Hallazgo de origen:** criterios 3 y 10; secciones 3 y 10 de la evidencia; acción `logoutUser` pública y aceptación de `userId`/`sessionId` desde el payload.
- **Severidad:** Crítica. **Objetivo:** impedir que un cliente anónimo o una cuenta pueda revocar sesiones pertenecientes a otra identidad.
- **Acción ejecutable:** retirar `logoutUser` de las acciones públicas o exigir una sesión válida antes de ejecutarla; derivar usuario y sesión exclusivamente de claims verificados; rechazar identificadores del payload que no coincidan con la identidad autenticada; separar la revocación administrativa bajo autorización explícita; hacer que los errores de autenticación/autorización fallen cerrados y registrar el actor real de cada revocación.
- **Archivos/módulos:** `backend/user-service/Code.gs`; `PUBLIC_ACTIONS`; router `doPost`; `logoutUser`; `revokeUserSession`; `verifySessionToken`.
- **Dependencias y riesgos:** AUD-NG-001 (propagación del token del cliente) y AUD-NG-005 (coherencia de revocación entre servicios); coordinar sin absorber esos alcances. Riesgo de denegación de servicio contra cuentas ajenas y de invalidar sesiones nuevas mediante marcas de usuario.
- **Alcance:** autenticación, propiedad de sesión y autorización de la operación logout/revoke. No sustituye la propagación general del token ni la invalidación interservicio.
- **Criterios de aceptación:** una solicitud sin token válido no revoca sesiones; un usuario solo puede cerrar su propia sesión; identificadores ajenos o manipulados se rechazan; la revocación administrativa requiere permiso explícito y actor verificable; las pruebas cubren payload falsificado, sesión ajena, sesión propia, administrador autorizado y ausencia de token.
- **Prioridad:** P0. **Estado:** Pendiente.
- **Evidencia de cierre:** pendiente; no se ejecutaron pruebas de endpoint, integración ni despliegue productivo.

### [AUD-NG-160] Garantizar la vigencia del rol firmado y de los privilegios asociados al token
- **Hallazgo de origen:** criterio 6; `generateSessionToken` incorpora `role` con vigencia de 24 horas, pero `verifySessionToken` y los validadores de los servicios no comparan ese rol con el rol vigente.
- **Severidad:** Alta. **Objetivo:** impedir que un token emitido antes de una degradación o cambio de privilegios conserve permisos obsoletos hasta su expiración.
- **Acción ejecutable:** incorporar una comprobación autoritativa del rol vigente o una versión de privilegios/sesión vinculada al token; invalidar o rechazar tokens cuya versión/rol haya quedado obsoleta; propagar la decisión de forma coherente a USER, ACADEMIC, ACCOUNTING, TASK y EXAM; asegurar que fallos al consultar el estado vigente no se conviertan en autorización basada únicamente en claims antiguos. Esta ampliación se integra en AUD-NG-160 y no crea una tarea paralela.
- **Archivos/módulos:** `backend/user-service/Code.gs`; `backend/academic-service/Code.gs`; `backend/accounting-service/Code.gs`; `backend/task-service/Code.gs`; `backend/exam-service/Code.gs`; `generateSessionToken`; `verifySessionToken`; validadores de autorización.
- **Dependencias y riesgos:** AUD-NG-005 para revocación/estado de cuenta; coordinación con la ampliación de AUD-NG-160 registrada en FASE2-T19 para matriz dinámica, delegaciones, cachés e invalidación interservicio. Mantener separados los criterios de vigencia del rol firmado y los de vigencia de permisos/delegaciones.
- **Alcance:** frescura del rol y de los privilegios incluidos en el token; no duplica propagación del token cliente, expiración general del token ni revocación de cuenta.
- **Criterios de aceptación:** después de degradar o cambiar el rol, un token previo deja de autorizar con el rol anterior; el usuario obtiene permisos nuevos solo mediante un token/versión vigente; los cinco servicios aplican la misma regla; la indisponibilidad de la fuente autoritativa no concede permisos por fallback; pruebas cubren cambio de rol, token antiguo, token renovado, fuente caída y propagación entre servicios.
- **Prioridad:** P1. **Estado:** Pendiente.
- **Evidencia de cierre:** pendiente; no se ejecutaron pruebas de integración ni contra despliegues productivos.

### Reconciliación de hallazgos relacionados
- **AUD-NG-001:** conserva la propagación de `sessionToken` desde el cliente; no se duplica dentro de AUD-NG-159.
- **AUD-NG-002 y AUD-NG-013:** conservan los controles de autorización contextual y las acciones públicas/rutas académicas; no se amplía su alcance con la revocación de sesión.
- **AUD-NG-003:** conserva la validación de expiración del token; AUD-NG-160 cubre el rol obsoleto aun cuando el token no haya expirado.
- **AUD-NG-005:** conserva coherencia e invalidación del estado de cuenta entre servicios; no sustituye la autorización de logout de AUD-NG-159.
- **AUD-NG-112, TASK-048, AUD-NG-083, AUD-NG-084 y AUD-NG-086:** se mantienen como controles/dependencias existentes de auditoría, seguridad y comunicación interservicio; no se crean tareas duplicadas.
- **Pruebas y límites:** inspección estática/manual del informe y reconciliación documental. No se ejecutaron pruebas runtime, integración, concurrencia ni validaciones de despliegues productivos.
- **Dictamen:** FASE2-T01 continúa en CUMPLE PARCIALMENTE; formalizar tareas no equivale a corregir ni aprobar la implementación.

