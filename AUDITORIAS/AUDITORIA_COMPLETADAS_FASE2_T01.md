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
