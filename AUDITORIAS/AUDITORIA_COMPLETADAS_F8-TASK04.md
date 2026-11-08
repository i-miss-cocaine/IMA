# Auditoría F8-Task04 / TAREA-MOD-06 — Regresión modular y dashboards dinámicos

- Fecha: 2026-11-08.
- Sesión: IMA-AUDIT-20261108-2129Z-01 (ID operativo documental, no ID nativo de ChatGPT).
- Checkpoint inicial: C1.263. Checkpoint de cierre: C1.264.
- Repositorio: i-miss-cocaine/IMA. Rama: NG_beta_0.0.0.1_work. HEAD/árbol inicial: fdd017bbef4bcc045f1fbfab5c1696e9da93376d.
- Rama base protegida: NG_beta_0.0.0.1 @ 44d9891132332e692dbe2ba8602b41f50a508a59.
- Tarea: F8-Task04 / TAREA-MOD-06, marcada [X] en completadas.md, línea 4837.
- Informe individual previo: no existe; auditoría realizada directamente.
- **Dictamen: NO CUMPLE.** CA-MOD-110 y CA-MOD-111 NO CUMPLEN. La marca [X] se conserva como dato histórico, no como certificación técnica.

## 1. Alcance y requisitos

Se deben probar: (1) login, navegación, dashboards, roles y ámbitos; (2) denegación no autorizada, IDOR y revocaciones; (3) procesos académicos de docentes, jornalizaciones, sílabos, eventos, horarios y tareas; (4) carga de scripts, CSS, módulos dinámicos y endpoints backend.

- CA-MOD-110: suite ejecuta 100 % de pruebas con PASS sin degradación.
- CA-MOD-111: pruebas confirman bloqueos de seguridad y restricciones de ámbito.

## 2. Fuentes y respaldos

| Archivo | SHA | Inspección |
|---|---|---|
| completadas.md | f57f1aef832e81e44fc4f7ec36a852d50e464676 | F8-Task04, línea 4837 |
| Pendientes.md blob HEAD | 676a3f798715f0cdd7d4bc75768472545b8465ee | Recuperación íntegra; búsqueda F8-Task04 |
| tests/regression/modular-dashboard-suite.js | 0495e1d526a872c33310935a003a83d924d34683 | 61 líneas, archivo completo |
| backend/developer-service/Code.gs | 8aa4bac67cfe5c8c54da51a0784a56fef633e412 | 2.901 líneas; bloques 1–190, 1638–1730, 2040–2100, 2599–2615 |
| backend/user-service/Code.gs | 12079dd410aa6d8afbce55a4bc62a79dea605f9f | verificador y doPost; contraste de revocaciones |
| js/api.js | 6b24f666db30a811a8e9b38d466fc6001cf6dfa9 | contexto frontend |
| js/auth.js | 8444dd085a3186106d2db7005b61ef934d3c22d8 | contexto frontend |
| AUDITORIAS/Contexto_personal.txt | 5ce1c169f45eba11e3caf76046acc7ef315d7d63 | reglas y C1.263 |
| METODOLOGIA_DESARROLLO.md | cf796728bb384a32537392df2f9c72a339fa03ee | metodología vigente |
| AUDITORIAS/AUDITORIA_COMPLETADAS_PLAN.md | 42a5e51c029705e708a8406a2b7c48caf7208573 | plan hasta C1.263 |
| AUDITORIAS/MapaDependencias.md | 1e21467a4a9899bf90ad15304becc9f04e83631e | mapa acumulativo |
| AUDITORIAS/Auditoria.txt | 3000278b4fef1f0dec73121ce3e30c0e53da397f | bitácora acumulativa |

### Recuperación de Pendientes.md

La lectura convencional devolvió 0 caracteres. Se recuperó el blob actual del HEAD: 1.786.011 caracteres, 20.224 líneas, 0 U+FFFD; SHA 676a3f798715f0cdd7d4bc75768472545b8465ee. Contiene 515 IDs TASK-NNN únicos (TASK-001..TASK-636); no aparecen F8-Task04, CA-MOD-110 ni CA-MOD-111. Se conservó el blob vigente íntegro; no se restauró ni modificó el archivo.

## 3. Suite Node.js

El archivo tiene 61 líneas y 23 llamadas a assert: ocho comprobaciones de rutas, tres de cadenas en js/config.js y doce de nombres de funciones en Code.gs. No ejecuta la suite backend ni prueba comportamiento de login, navegación, DOM, dashboards por rol, RBAC, IDOR, scopes, revocaciones, procesos académicos, HTTP ni endpoints.

La aserción `../../MapaDependencias.md` busca el archivo en la raíz del repositorio. El árbol no contiene `MapaDependencias.md` en raíz; el archivo real es `AUDITORIAS/MapaDependencias.md`. Por ello esa aserción fallará al ejecutar el script con el árbol actual. No se afirma que el test runner se haya ejecutado.

## 4. Suite backend

En `backend/developer-service/Code.gs:2040–2100`, `runModularAndDynamicDashboardsRegressionSuite` contiene cinco casos:

1. REG-01 solo obtiene `getAuthTokenSecret()` y verifica que no sea vacío; no crea ni verifica un token ni prueba login/navegación.
2. REG-02 consulta `getCentralCapabilitiesCatalog(payload)` y comprueba que `modulos` sea array. El catálogo es fijo y no genera dashboard por rol ni ámbito.
3. REG-03 pasa `"INVALID.TOKEN.HERE"` a `verifySessionToken`; se rechaza por tener tres segmentos. No prueba HMAC válido/incorrecto, doPost, RBAC, IDOR, scopes ni revocación.
4. REG-04 llama a `getServiceHealthDiagnostics`, no a procesos académicos. En 2599–2615 la función asigna PASS constante a connectivity, spreadsheetAccess y permissions y devuelve HEALTHY.
5. REG-05 consulta un catálogo declarativo en memoria; no invoca endpoints, no ejecuta módulos ni simula fallos para probar aislamiento.

El bucle captura excepciones y calcula `allPassed`, pero devuelve `status: "success"` incondicionalmente, incluso cuando hay pruebas FAIL.

## 5. Seguridad y ámbitos

### 5.1 Bypass RBAC por rol enviado por el cliente

- `backend/developer-service/Code.gs:24`: ROLE_PERMISSIONS asigna `["*"]` a Administrador.
- `doPost`, líneas 145–174: cuando no hay token, acepta `payload.authRole` como rol; luego consulta ROLE_PERMISSIONS y despacha la acción.
- En consecuencia, un cuerpo sin token que incluya `authRole: "Administrador"` supera la comprobación de rol y alcanza el despachador de acciones protegidas. El cuerpo no acredita la identidad ni la firma del rol. No se ejecutó una petición contra producción; el bypass se deduce del flujo de control.

### 5.2 Sesiones revocadas

En DEVELOPER, `verifySessionToken` líneas 115–142 valida formato, firma y expiración opcional, pero no consulta `revoked_user_`, `revoked_session_` ni estado de cuenta. En USER, `verifySessionToken` líneas 1083–1143 sí comprueba revocación de usuario, de sesión y estado activo. DEVELOPER consume su propio verificador desde doPost y no hereda esas comprobaciones.

### 5.3 El reporte de ámbitos no prueba enforcement

En DEVELOPER líneas 1638–1670, `getRoleFunctionalSpaceConfig` admite `payload.spaceConfig` y considera válida la fuente única si `allowedMasterAccess` no es exactamente `DIRECT_UNCONTROLLED_WRITE`. `auditRoleIndependenceAndMasterDataIntegrity` (1673–1728) usa la misma comparación literal. REG-03 no llama ninguna de esas funciones ni intenta acceso a un ID ajeno.

## 6. Hallazgos

### AUD-NG-289 — Bypass RBAC mediante authRole controlado por cliente
- Severidad: CRÍTICO.
- Archivo: backend/developer-service/Code.gs:24,145–174.
- Evidencia: sin token se acepta payload.authRole; Administrador tiene comodín.
- Impacto: solicitante no autenticado puede superar el control de roles y alcanzar el despachador.
- Criterio: CA-MOD-111 NO CUMPLE.

### AUD-NG-290 — Verificación de sesión sin revocación ni estado de cuenta
- Severidad: ALTO.
- Archivos: developer-service/Code.gs:115–142; user-service/Code.gs:1083–1143.
- Evidencia: DEVELOPER no comprueba revocación de usuario/sesión ni estado de cuenta, a diferencia de USER.
- Impacto: una sesión revocada o de cuenta desactivada puede seguir siendo aceptada si firma/expiración siguen válidas.
- Criterio: CA-MOD-111 NO CUMPLE.

### AUD-NG-291 — REG-03 no prueba RBAC, IDOR, scopes ni revocaciones
- Severidad: ALTO.
- Archivo: developer-service/Code.gs:2040–2100.
- Evidencia: REG-01 solo verifica existencia de secreto; REG-03 rechaza un token de tres segmentos y nunca llama doPost.
- Impacto: controles de seguridad críticos sin cobertura real.
- Criterio: CA-MOD-111 NO CUMPLE.

### AUD-NG-292 — Dashboards y ámbitos reducidos a catálogos declarativos
- Severidad: ALTO.
- Archivo: developer-service/Code.gs:1638–1728,2040–2100.
- Evidencia: REG-02 solo verifica array fijo; no prueba generación por rol, navegación, renderizado ni aislamiento. Las funciones de espacio tampoco son invocadas.
- Impacto: no se demuestra compatibilidad de dashboards, roles ni ámbitos.
- Criterios: CA-MOD-110 y CA-MOD-111 NO CUMPLEN.

### AUD-NG-293 — Diagnóstico de salud sustituye pruebas académicas
- Severidad: ALTO.
- Archivo: developer-service/Code.gs:2040–2100,2599–2615.
- Evidencia: REG-04 llama un diagnóstico con tres PASS constantes; no ejecuta flujos docentes, jornalizaciones, sílabos, eventos, horarios ni tareas.
- Impacto: ausencia de detección de regresiones académicas.
- Criterio: CA-MOD-110 NO CUMPLE.

### AUD-NG-294 — Suite Node estática y ruta de mapa incorrecta
- Severidad: MEDIO.
- Archivo: tests/regression/modular-dashboard-suite.js:21–48.
- Evidencia: aserciones de existencia/cadenas; no ejecuta backend. Busca ../../MapaDependencias.md en raíz, inexistente; el mapa real está en AUDITORIAS/.
- Impacto: al menos una aserción fallará y las demás no prueban funcionalidad.
- Criterio: CA-MOD-110 NO CUMPLE.

### AUD-NG-295 — Estado global incorrecto si hay fallos
- Severidad: MEDIO.
- Archivo: developer-service/Code.gs:2075–2100.
- Evidencia: calcula allPassed pero retorna status success incondicional.
- Impacto: consumidores que solo lean status pueden interpretar una suite fallida como exitosa.
- Criterio: CA-MOD-110 NO CUMPLE.

### AUD-NG-296 — Sin evidencia de ejecución integral
- Severidad: ALTO.
- Archivos: suite Node y backend DEVELOPER.
- Evidencia: no hay salida Node, ejecución Apps Script, resultados por caso, navegador/DOM, HTTP ni E2E; no hay workflows en .github/workflows/.
- Impacto: no se certifica el 100 % PASS ni ausencia de degradación.
- Criterios: CA-MOD-110 y CA-MOD-111 NO CUMPLEN.

## 7. Matriz de aceptación

| Criterio | Dictamen | Justificación |
|---|---|---|
| CA-MOD-110 | NO CUMPLE | Suite no ejecutada, superficial, con ruta incorrecta; no cubre comportamiento funcional. |
| CA-MOD-111 | NO CUMPLE | Bypass RBAC y falta de revocaciones; no hay pruebas reales de IDOR/scopes. |

## 8. Pruebas y límites

- Realizadas: inspección manual del archivo Node completo; revisión de bloques críticos DEVELOPER; contraste de verificador USER; comprobación de rutas del árbol; revisión de tarea, blob Pendientes, metodología, contexto y plan.
- No ejecutadas: Node, Apps Script, HTTP, navegador/DOM, tokens HMAC runtime, revocaciones runtime, IDOR, scopes, procesos académicos, endpoints desplegados, E2E ni pruebas contra Sheets productivo.
- No se afirma haber observado un ataque en producción ni haber ejecutado el runner. El bypass RBAC se identifica por inspección del flujo y la ruta errónea por el árbol Git.
- Código y tests sin modificar. completadas.md, Pendientes.md y ChangesLogs.txt sin modificar. Rama base intacta.

## 9. Tareas ejecutables derivadas de los hallazgos

### TASK-645 — Eliminar la confianza en roles enviados por el cliente
- Hallazgo: AUD-NG-289. Severidad: Crítico.
- Objetivo: derivar permisos exclusivamente de sesión firmada verificada en servidor.
- Acción: retirar fallback payload.authRole; rechazar solicitudes protegidas sin token válido; enumerar acciones públicas explícitas.
- Archivos: backend/developer-service/Code.gs; tests/regression/modular-dashboard-suite.js.
- Dependencias/riesgos: endpoints de control de servicios y clientes que hoy envían authRole.
- Alcance: autorización DEVELOPER; no ampliar privilegios.
- Aceptación: authRole Administrador sin token es denegado; token inválido/alterado es denegado; token válido obtiene solo permisos de rol firmado.
- Prioridad: P0. Estado: Pendiente.

### TASK-646 — Alinear verificación de sesiones con revocación y estado de cuenta
- Hallazgo: AUD-NG-290. Severidad: Alto.
- Objetivo: rechazar sesiones expiradas, revocadas o de cuentas inactivas.
- Acción: incorporar comprobaciones de revoked_user_, revoked_session_, estado de cuenta y claims requeridos; revisar ausencia de exp.
- Archivos: backend/developer-service/Code.gs; suite de regresión.
- Dependencias/riesgos: CacheService, propiedades de sesión y hoja Usuarios.
- Alcance: tokens DEVELOPER con fixtures aislados.
- Aceptación: pruebas de token expirado, usuario/sesión revocados, cuenta inactiva, firma incorrecta y claims incompletos; token válido pasa.
- Prioridad: P1. Estado: Pendiente.

### TASK-647 — Implementar pruebas efectivas de RBAC, IDOR y ámbitos
- Hallazgos: AUD-NG-291/292. Severidad: Alto.
- Objetivo: verificar autorización en el punto real de entrada y aislamiento por usuario/rol/ámbito.
- Acción: invocar doPost con tokens firmados válidos/invalidos; probar roles autorizados/no autorizados, IDs alterados, scopes vacíos/cruzados y revocaciones.
- Archivos: tests/regression/modular-dashboard-suite.js; backend/developer-service/Code.gs; contratos USER/ACADEMIC.
- Dependencias/riesgos: fixtures, reloj y CacheService simulados; no usar identidades reales.
- Alcance: pruebas no destructivas y aisladas.
- Aceptación: cada escenario tiene resultado esperado; bypass, IDOR y scopes cruzados se deniegan; permisos legítimos siguen operativos.
- Prioridad: P0. Estado: Pendiente.

### TASK-648 — Incorporar regresión funcional de procesos académicos
- Hallazgo: AUD-NG-293. Severidad: Alto.
- Objetivo: probar flujos de docentes, jornalizaciones, sílabos, eventos, horarios y tareas.
- Acción: fixtures/dobles aislados; invocar contratos y operaciones de cada flujo; validar estados, reglas, errores y persistencia simulada.
- Archivos: suite modular-dashboard; servicios USER/ACADEMIC/TASK/EXAM y DEVELOPER.
- Dependencias/riesgos: reglas académicas, datos sintéticos y contratos.
- Alcance: sin escrituras productivas.
- Aceptación: casos positivos, negativos y límite por flujo; resultados individuales reproducibles.
- Prioridad: P1. Estado: Pendiente.

### TASK-649 — Probar dashboards, navegación, recursos y endpoints
- Hallazgos: AUD-NG-292/296. Severidad: Alto.
- Objetivo: validar carga integral por rol y dependencias frontend/backend.
- Acción: pruebas de renderizado, navegación, scripts/CSS/assets/imports y endpoints en integración aislada; verificar aislamiento ante fallos de módulos.
- Archivos: suite, js/config.js, js/api.js, js/auth.js, dynamic-dashboard.html y servicios backend.
- Dependencias/riesgos: navegador, URLs de prueba, auth y CORS.
- Alcance: integración de pruebas, sin despliegue productivo.
- Aceptación: cada rol ve solo módulos permitidos; sin errores de recursos; endpoints cumplen contratos; fallos aislados no rompen otros módulos.
- Prioridad: P1. Estado: Pendiente.

### TASK-650 — Corregir y fortalecer la suite Node
- Hallazgo: AUD-NG-294. Severidad: Medio.
- Objetivo: validar comportamiento y rutas reales, no solo cadenas.
- Acción: corregir la ruta del mapa a AUDITORIAS/MapaDependencias.md; sustituir comprobaciones textuales por pruebas ejecutables; integrar harness backend con mocks.
- Archivos: tests/regression/modular-dashboard-suite.js y fixtures.
- Dependencias/riesgos: compatibilidad Node y APIs GAS simuladas.
- Alcance: harness aislado, sin servicios productivos.
- Aceptación: rutas correctas; casos ejecutan comportamiento; fallos producen FAIL; prueba negativa demuestra que el harness detecta una regresión.
- Prioridad: P1. Estado: Pendiente.

### TASK-651 — Propagar correctamente el resultado global de la suite backend
- Hallazgo: AUD-NG-295. Severidad: Medio.
- Objetivo: impedir status success cuando existan pruebas FAIL.
- Acción: derivar status de allPassed y propagar resultado a validateStagedMigrationProgress.
- Archivos: backend/developer-service/Code.gs; tests/regression/modular-dashboard-suite.js.
- Dependencias/riesgos: consumidores actuales del contrato de respuesta.
- Alcance: contrato de resultados de esta suite.
- Aceptación: todos PASS => success; cualquier FAIL => error y todasPruebasPasaron=false; etapa consumidora queda pendiente.
- Prioridad: P2. Estado: Pendiente.

## 10. Continuidad

- Última tarea auditada: F8-Task04 / TAREA-MOD-06.
- Dictamen: NO CUMPLE.
- Tarea en curso al cierre: ninguna.
- Siguiente tarea cronológica: F8-Task05 — reorganización mediante etapas verificables, CA-MOD-112/113.
- Próxima acción: comprobar si existe informe F8-Task05; si falta, auditar completadas.md, docs/architecture/staged-migration-procedure.md y backend/developer-service/Code.gs; verificar línea base, aislamiento de etapas, rollback real y trazabilidad.
