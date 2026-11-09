# AUDITORÍA COMPLETADA — TAREA-F5-005
## Consola administrativa de revisión y decisión de admisiones

- **Repositorio:** `i-miss-cocaine/IMA`
- **Rama:** `NG_beta_0.0.0.1_work`
- **HEAD auditado:** `9b4f1b2fbdf159a3a8feb401d8df4f27de3215e5`
- **Tree SHA:** `f66c7a2a12b2f826aed89f82e9b8ab236f52b78f`
- **Fecha:** 2026-11-07
- **ID operativo de sesión/chat:** `IMA-AUDIT-20261107-0205Z` (identificador operativo, no ID nativo de ChatGPT).
- **Informe específico:** no existe en el árbol ni en el historial de la rama; se crea desde cero.
- **Dictamen:** **NO CUMPLE**.
- **Alcance:** consola, filtros, modal, consulta y decisión, RBAC/ABAC, transiciones, concurrencia, conversión, paginación, trazabilidad, privacidad y pruebas.

## 1. Existencia del informe y antecedentes

Se verificó el árbol recursivo completo de la rama de trabajo (967 entradas, `truncated=false`). No existe `AUDITORIAS/AUDITORIA_COMPLETADAS_TAREA-F5-005.md`; el historial Git consultado para esa ruta devolvió cero commits. Tampoco se localizó `AUDITORIA_FASE_5_ADMISIONES_PORTAL_FAMILIAS.md` en el árbol ni en el historial consultado.

La reconstrucción se hizo desde:
- `completadas.md`, SHA `f57f1aef832e81e44fc4f7ec36a852d50e464676`, líneas 1952-1980: requisitos de la consola y criterios de aceptación; la tarea aparece marcada históricamente como completada.
- `ChangesLogs.txt`, SHA `d57cf4bd861b5c3720e60cf83241ed804ff645d9`, líneas 1793-1803: declara la creación de `dashboard-secretaria.html`, tabla, filtros, modal, link desde Dirección, redirección post-login y permisos del rol Secretaria.
- `AUDITORIAS/Auditoria.txt`, SHA `e1f3daa81693abfb3b4ee497032168836996d772`: no contiene registro específico de F5-005.
- La versión histórica de raíz `Auditoria.txt`, blob SHA `7f8783e353fe3b5b2a66e4e8569986f6d0097fff`, y la variante acentuada `AUDITORIAS/Auditoría.txt`, SHA `e63c6cfcfaf05238d1a07a375ba65e16b83b9184`, tampoco contienen `TAREA-F5-005` ni `HALLAZGOS-F5-P0-05`.

La marca `[X] Completada` se conserva como antecedente histórico, no como prueba de aceptación vigente.

## 2. Evidencia inspeccionada

| Archivo | SHA | Alcance |
|---|---|---|
| `dashboard-secretaria.html` | `fa0d8c23aace24a6acab2d4956398a7f5e1309b8` | Filtros, tabla, modal, scripts, control local de roles y navegación; 340 líneas. |
| `js/secretary.js` | `08a81266957b4c18cc25f8ba6749eac30a8f2c2c` | Carga, métricas, filtrado, renderizado, transiciones, conversión, documentos, entrevistas, evaluaciones, capacidad, lista de espera, tutores, notificaciones, auditoría y duplicados. |
| `backend/academic-service/Code.gs` | `daf1883ec0b8d4f0ff2bc673af8a4e8c5bbd03fc` | RBAC 165-235; `validateContextualAccess` 465-523; `getAdmissionRequests` 1113-1159; `updateAdmissionStatus` 1928-2059; `convertAdmissionToStudent` 2156-2392. |
| `js/api.js` | `6b24f666db30a811a8e9b38d466fc6001cf6dfa9` | `fetchApi` 11-181; enriquecimiento de payload y ausencia de token. |
| `js/auth.js` | `8444dd085a3186106d2db7005b61ef934d3c22d8` | `currentUser` construido tras login, líneas 138-159. |
| `js/ui-common.js` | `986938b8a311a41ed4cb3d135b66b6aaea4bed67` | `setupAdvancedTableFilters` 2129; `renderUIProgressSkeleton` 5147. |
| `dashboard-direccion.html` | `fefaa3bf7884288aef563cfb8aaf244e6cea8b7c` | Enlace a consola de Secretaría. |
| `teacher-dashboard.html` | `cbb9e6a272a7d8ad33f99727303305d950533e71` | Sin integración de la consola de admisiones. |
| `tests/regression/academic-grading-suite.js` | `3433b707edd4a2f35c68368a3172932adc2a3b32` | Sin pruebas específicas de getAdmissionRequests, updateAdmissionStatus o conversión desde la consola. |
| `tests/regression/modular-dashboard-suite.js` | `0495e1d526a872c33310935a003a83d924d34683` | Sin pruebas específicas de la consola de admisiones. |
| `completadas.md` | `f57f1aef832e81e44fc4f7ec36a852d50e464676` | Requisitos y criterios de F5-005, líneas 1952-1980. |
| `ChangesLogs.txt` | `d57cf4bd861b5c3720e60cf83241ed804ff645d9` | Declaración histórica de implementación, líneas 1793-1803. |
| `AUDITORIAS/Auditoria.txt` | `e1f3daa81693abfb3b4ee497032168836996d772` | Reconciliación de hallazgos previos. |
| `AUDITORIAS/MapaDependencias.md` | `e46da18a183c38204937d93087bcfed06ad0d319` | Dependencias de token, ámbito, transición, XSS y UX. |
| `METODOLOGIA_DESARROLLO.md` | `cf796728bb384a32537392df2f9c72a339fa03ee` | Método de auditoría, tareas y cierre. |

## 3. Hallazgos

### H1. La consola no puede autenticar sus llamadas protegidas porque el cliente no transmite sessionToken
**Clasificación: CRÍTICO / P0 — AUD-NG-001 existente**

`dashboard-secretaria.html` carga `js/api.js` y `js/secretary.js`; la carga inicial invoca `loadAdmissionRequestsList` (script DOMContentLoaded al final del HTML). Esa función llama `fetchApi('ACADEMIC', 'getAdmissionRequests', {})` (secretary.js 1-25). Las acciones del modal llaman de la misma manera a `updateAdmissionStatus`, `convertAdmissionToStudent`, documentos, entrevistas, evaluaciones y capacidad.

`js/auth.js` construye `currentUser` con userId, nombre, email, rol y metadatos, pero no copia `result.data.sessionToken` (138-159). `js/api.js` solo añade `requesterUserId` y `requesterRole` (47-50) y serializa `{action,payload}`; no agrega `sessionToken`, `authToken` ni `token`. En el backend, `validateRolePermission` requiere la identidad validada por token para las acciones protegidas (524-583). `getAdmissionRequests`, `updateAdmissionStatus` y `convertAdmissionToStudent` no están en `PUBLIC_ACTIONS`.

Por tanto, el flujo estático de la consola no satisface el contrato de autenticación y las llamadas protegidas se rechazan por falta de credencial. Esto ya está registrado en **AUD-NG-001**; no se crea un ID duplicado. No se ejecutó HTTP real, por lo que el resultado de runtime no se declara probado.

### H2. La consulta de solicitudes no aplica ABAC por departamento o ámbito asignado
**Clasificación: CRÍTICO / P0 — ampliación de TAREA-AD-03**

`getAdmissionRequests` (1113-1159) filtra por solicitudId, estado, año y grado, pero no por departamento, área o ámbito asignado. Devuelve todos los campos de cada fila, incluidos identificación, fecha de nacimiento, teléfono y email del responsable.

`validateContextualAccess` (465-523) solo consulta `AsignacionesAmbitosRoles` si el payload contiene simultáneamente `scopeType` y `requestedValue`. La consola invoca `getAdmissionRequests` con payload vacío (secretary.js 13), y las mutaciones envían solicitudId/estado/justificación sin ámbito. Por tanto, no se ejecuta la restricción contextual. Además, la función captura errores de lectura de asignaciones y puede continuar sin denegar.

TAREA-AD-03 está marcada históricamente como completada, pero el contrato de admisiones no suministra ni exige ámbito server-side. Cualquier rol con permiso de `getAdmissionRequests` puede recibir solicitudes de todos los departamentos, no solo las asignadas. Se debe reabrir/extender TAREA-AD-03; no se crea otro ID.

### H3. La carga de datos no usa el token y la paginación del backend no está conectada a la interfaz
**Clasificación: CRÍTICO / P0 para acceso; ALTO / P1 para rendimiento**

`getAdmissionRequests` admite `page`, `pageSize` y `fetchAll` (1113-1142). Sin `page`, devuelve el conjunto completo; la consola no envía page/pageSize y guarda todos los registros en `window.allAdmissionRequests` (secretary.js 13-16). El filtrado se hace completamente en cliente (secretary.js 58-91).

Los filtros visibles son año, grado, estado y texto libre por nombre/DNI/código/responsable (dashboard-secretaria.html 103-142; secretary.js 58-91). No hay filtro por fecha de recepción ni por presencia de requisitos pendientes. `setupAdvancedTableFilters` existe en ui-common.js (2129), pero no se invoca desde la consola; `renderUIProgressSkeleton` existe (5147), pero la tabla utiliza una fila estática con spinner (dashboard-secretaria.html 148-158; secretary.js 5-8). No hay controles de paginación ni estado de página en el cliente.

### H4. La asignación de responsable revisor y las notas internas confidenciales no están implementadas
**Clasificación: ALTO / P1**

No se encontró campo ni acción para asignar un responsable de revisión a la solicitud. `promptScheduleInterview` solicita un `evaluadorUserId` para una entrevista (secretary.js 402-428), lo que no equivale a asignar un revisor del expediente.

La consola muestra un único campo `adm-justificacion-text` rotulado “Justificación / Observación Obligatoria” (dashboard-secretaria.html, sección inferior del modal). `updateAdmissionStatus` añade ese texto a la columna `observaciones` de `SolicitudesAdmision` (Code.gs 2014-2024) y también lo incorpora al mensaje enviado al responsable/aspirante (Code.gs 2030-2044). No existe un canal separado de notas internas confidenciales. Un comentario interno podría terminar en el correo/notificación a la familia.

### H5. La interfaz representa transiciones por estado, pero no por rol; la reapertura usa la ruta ordinaria
**Clasificación: ALTO / P1 — ampliación de AUD-NG-234/TASK-514**

`openAdmissionDetailModal` mantiene un mapa de transiciones local basado únicamente en el estado actual (secretary.js 197-226). No consulta el rol del usuario para decidir qué botones mostrar. La matriz de `ROLE_PERMISSIONS` concede permisos por acción, no por arista de transición. La ruta de conversión se muestra para cualquier solicitud Admitida; usuarios con acceso al dashboard pero sin permiso de conversión verían el botón aunque el backend lo rechace.

La transición `Reabierta` se genera como un botón normal y llama a `updateAdmissionStatusAction`, que invoca `updateAdmissionStatus`; no llama a `reopenAdmissionRequest` (secretary.js 197-226, 248-275). Esto elude el flujo privilegiado de reapertura y coincide con el hallazgo AUD-NG-234/TASK-514 de F5-002.

La justificación se exige en cliente/backend para Rechazada y Retirada, pero no para todas las demás transiciones críticas. La autorización debe validarse en el backend por rol, transición y contexto, no confiar en la visibilidad del botón.

### H6. La concurrencia se serializa parcialmente, pero no se compara la versión/estado que vio el usuario
**Clasificación: ALTO / P1 — ampliación de AUD-NG-234/TASK-514**

`updateAdmissionStatus` adquiere `ScriptLock` y vuelve a leer el estado actual antes de validar la arista (Code.gs 1934-1978), lo que reduce carreras ordinarias. Sin embargo, el payload no incluye `expectedState`, versión de fila ni `updatedAt` que el servidor compare con la vista del usuario. No hay un conflicto explícito “la solicitud cambió desde que abrió el modal”; si la transición solicitada sigue siendo válida desde el estado nuevo, se puede aplicar sin que el usuario revise el cambio concurrente.

Además, el parámetro `skipLock` puede omitir el lock (Code.gs 1941-1949), hallazgo ya registrado en AUD-NG-234/TASK-514. No se acredita una prueba de dos usuarios concurrentes.

### H7. La conversión confirma IDs, pero no navega al expediente creado
**Clasificación: MEDIO / P1**

`convertAdmissionToStudentAction` (secretary.js 277-296) confirma la acción, llama a `convertAdmissionToStudent` y, ante éxito, muestra `expedienteId` y `matriculaId` en un alert, cierra el modal y recarga la lista. No navega al expediente resultante ni abre su vista de detalle. El botón de conversión existe desde el estado Admitida, por lo que la acción está parcialmente implementada, pero no cumple el requisito de navegación directa.

### H8. El renderizado del panel administrativo inserta datos de aspirantes/documentos en innerHTML sin escape
**Clasificación: CRÍTICO / P0 — ampliación de AUD-NG-235**

`filterAdmissionRequestsLocal` (secretary.js 94-137) genera filas con `innerHTML` interpolando nombres, identificación, grado, responsable, teléfono, email y solicitudId. `openAdmissionDetailModal` (secretary.js 137-196) hace lo mismo con nombres, DNI, fecha de nacimiento, grado, observaciones y otros campos.

Los renderizadores de documentos (secretary.js 297-330), entrevistas (365-395) y evaluaciones (1459-1490) insertan nombres de archivo, observaciones, lugar/enlace, evaluador y datos de evaluación dentro de HTML sin escape contextual uniforme. Estos valores pueden contener datos aportados por solicitantes o almacenados en hojas. Un valor malicioso puede ejecutar HTML/script en la sesión de un operador autorizado al abrir la tabla o modal.

La bitácora de auditoría escapa `accion` y `valoresNuevos` si existe `escapeHtml`, pero no escapa `ejecutadoPor` (secretary.js 1202-1214). El riesgo amplía el AUD-NG-235 creado en F5-004; no se crea un ID duplicado.

### H9. La consola sí contiene varios componentes de inspección, pero su disponibilidad real depende de los endpoints protegidos
**Clasificación: CUMPLE PARCIALMENTE**

El modal invoca cargadores para documentos, entrevistas, evaluaciones, lista de espera, tutores, capacidad, notificaciones, bitácora y duplicados (secretary.js 174-194). La vista muestra capacidad, documentos y estados de entrevistas/evaluaciones. Esto cubre parte del requisito de detalle integral y advertencias.

No obstante, todas estas llamadas usan `fetchApi` sin token, por lo que están afectadas por AUD-NG-001. Tampoco se encuentra asignación de revisor ni nota interna confidencial (H4), y el filtrado no detecta requisitos pendientes.

### H10. El control local de roles no coincide con la matriz RBAC del backend
**Clasificación: MEDIO / P1**

El script final de `dashboard-secretaria.html` permite los roles Secretaría, Secretaria, Director, Administrador y Desarrollador; redirige cualquier otro rol a login. El backend concede `getAdmissionRequests` y `updateAdmissionStatus` a Subdirector, pero la página no lo permite. A la inversa, el dashboard permite Desarrollador, cuyo `ROLE_PERMISSIONS` no incluye las acciones de admisión. La decisión final debe provenir de una matriz compartida y coherente; el control cliente no sustituye RBAC server-side.

### H11. No hay pruebas conductuales específicas de la consola de admisiones
**Clasificación: ALTO / P1 — ampliación de AUD-NG-161**

Las suites `academic-grading-suite.js` y `modular-dashboard-suite.js` no contienen referencias a `getAdmissionRequests`, `updateAdmissionStatus`, `convertAdmissionToStudent` ni a los controladores de `js/secretary.js`. No se acreditan pruebas de acceso por rol/ámbito, paginación, filtros, botones por transición, cambios concurrentes, notas confidenciales, conversión con navegación o XSS almacenado en la consola.

## 4. Reconciliación de tareas existentes

No se crea un AUD-NG nuevo. Se amplían/reabren tareas existentes:
- **AUD-NG-001:** propagar y verificar sessionToken entre loginUser, currentUser y fetchApi. Es el bloqueo primario para las llamadas protegidas de la consola.
- **TAREA-AD-03:** aplicar ABAC obligatorio a lectura y escritura de admisiones, con ámbito derivado de identidad verificada y no de campos opcionales del cliente.
- **AUD-NG-234 / TASK-514:** máquina de estados, permisos por transición, reapertura privilegiada, lock no eludible y control de concurrencia.
- **AUD-NG-235:** ampliar la salida HTML segura al dashboard administrativo y a sus renderizadores de tabla/modal/documentos/entrevistas/evaluaciones.
- **AUD-NG-145:** separar observaciones internas de mensajes/notificaciones a familias y proteger datos personales.
- **AUD-NG-006:** idempotencia de cambios de estado y conversión, coordinada con el wrapper global.
- **AUD-NG-161:** pruebas conductuales de acceso, filtros, concurrencia, transiciones, conversión y XSS.
- **T-UX-19:** semántica accesible del modal, tabla, controles y mensajes.
- **AUD-NG-233 / TASK-513:** guardas fail-closed para documentos/evaluaciones/capacidad, coordinadas con advertencias de la consola.
- **AUD-NG-232 / TASK-512:** recuperación de conversión multi-etapa, sin duplicar su alcance.

## 5. Tareas ejecutables derivadas

### Ampliación — AUD-NG-001: restablecer el contrato de sesión de la consola
- **Hallazgo:** H1.
- **Severidad:** CRÍTICO / P0.
- **Acciones:** conservar `sessionToken` devuelto por loginUser en la sesión activa; transmitirlo en fetchApi; validar rechazo/expiración sin fallback de identidad no verificada; probar listados, detalle, mutaciones y conversión con sesión real.
- **Criterios:** un usuario autorizado carga solicitudes y ejecuta acciones; sin token o con token inválido se rechaza; no se aceptan requesterUserId/requesterRole como sustitutos del token.
- **Estado:** Pendiente.

### Ampliación — TAREA-AD-03: ABAC obligatorio por departamento/ámbito en admisiones
- **Hallazgo:** H2.
- **Severidad:** CRÍTICO / P0.
- **Acciones:** derivar ámbito del usuario autenticado; filtrar getAdmissionRequests por departamentos/áreas asignadas; exigir ámbito para updateAdmissionStatus y convertAdmissionToStudent; denegar si falta asignación, si la hoja no está disponible o si la consulta falla; no aceptar scopeType/requestedValue arbitrarios como única prueba.
- **Criterios:** usuarios de un departamento no leen ni modifican solicitudes de otro; Director/Admin mantienen alcance global conforme a política; pruebas directas de endpoint demuestran aislamiento.
- **Estado:** Pendiente / reabrir criterio marcado completado.

### Ampliación — AUD-NG-234 / TASK-514: permisos de transición y concurrencia
- **Hallazgos:** H5 y H6.
- **Acciones:** una única matriz server-side por rol/estado/transición; usar reopenAdmissionRequest para reaperturas privilegiadas; enviar expectedState/version y devolver conflicto si el registro cambió; eliminar skipLock de payload; exigir justificación para todas las decisiones críticas; auditar actor y correlationId.
- **Criterios:** botones y backend coinciden; transición no autorizada falla sin mutación; cambio concurrente produce conflicto explícito; reapertura solo por rol autorizado; timeout de lock aborta.
- **Estado:** Pendiente.

### Ampliación — AUD-NG-235: salida HTML segura en la consola administrativa
- **Hallazgo:** H8.
- **Acciones:** sustituir interpolación de datos en innerHTML por textContent/nodos DOM; aplicar escape contextual a todos los campos de aspirantes, documentos, entrevistas, evaluaciones y bitácora; validar URLs antes de construir enlaces; eliminar handlers inline con datos no escapados.
- **Criterios:** payloads con etiquetas/event handlers se muestran como texto; no se ejecuta script al abrir tabla, detalle o subpaneles.
- **Estado:** Pendiente.

### Ampliación — AUD-NG-145: observaciones internas confidenciales
- **Hallazgo:** H4.
- **Acciones:** crear campo/entidad de notas internas con acceso limitado; mantener justificación comunicable separada; impedir que notas internas se incluyan en notificaciones a familias; registrar autor, fecha, motivo y permisos.
- **Criterios:** una nota interna nunca aparece en email/portal público; solo roles autorizados pueden verla; el registro de auditoría identifica actor.
- **Estado:** Pendiente.

### Ampliación — TAREA-F5-005: filtros, paginación, asignación y navegación
- **Hallazgos:** H3, H4 y H7.
- **Acciones:** conectar `setupAdvancedTableFilters`; añadir filtros por fecha y requisitos pendientes; enviar page/pageSize al backend y controles de página; usar `renderUIProgressSkeleton`; asignar revisor; separar notas internas; después de convertir, navegar al expediente creado.
- **Criterios:** filtros ejecutados en servidor y coherentes con persistencia; navegación sin duplicados/omisiones; revisor visible; conversión abre el expediente exacto.
- **Estado:** Pendiente.

### Ampliación — AUD-NG-161: regresión conductual de la consola
- **Hallazgo:** H11.
- **Acciones:** pruebas de roles/token, ABAC, paginación, filtros por fecha/documentos, transición por rol, reapertura, conflictos concurrentes, notas privadas, conversión/navegación y XSS en cada panel.
- **Criterios:** suites ejecutadas con datos aislados y evidencia de resultados; no basta con comprobar presencia de funciones.
- **Estado:** Pendiente.

## 6. Pruebas y límites

**Ejecutado:** inspección estática/manual de dashboard-secretaria, secretary.js, api.js, auth.js, ui-common y ACADEMIC Code.gs; cotejo de roles, scopes, filtros, paginación, transiciones, conversiones y renderizado; búsqueda de funciones de asignación y notas internas; revisión de suites y antecedentes.

**No ejecutado:** login HTTP real, navegador, llamadas a Apps Script, consultas a Sheets, acceso con usuarios de distintos departamentos, dos operadores concurrentes, conversión real, XSS dinámico, lector de pantalla ni suites automatizadas.

**Archivos documentales de esta iteración:** este informe, Auditoria.txt, MapaDependencias.md, AUDITORIA_COMPLETADAS_PLAN.md y Contexto_personal.txt. No se modifica código, pruebas, completadas.md, ChangesLogs.txt, Pendientes.md, metodología ni rama base.

## 7. Dictamen y continuidad

**TAREA-F5-005: NO CUMPLE.** Existe una consola con tabla, métricas, filtros básicos, modal integral y acciones de estado/conversión. Sin embargo, el contrato de sesión impide que las llamadas protegidas funcionen; no hay ABAC departamental, paginación conectada ni filtros por fecha/documentos; faltan asignación de revisor y notas internas confidenciales; los botones no se filtran por rol; la conversión no navega al expediente; existe XSS en renderizadores y no hay pruebas específicas.

No se crean identificadores nuevos. Se amplían AUD-NG-001, TAREA-AD-03, AUD-NG-234/TASK-514, AUD-NG-235, AUD-NG-145, AUD-NG-006, AUD-NG-161 y T-UX-19.

**Progreso histórico:** 91/183 identificadores del conjunto original auditados; 92 restantes. No se crea ID nuevo.

**Siguiente tarea oficial:** TAREA-F5-006 — implementar la gestión documental de aspirantes antes de la matrícula. Verificar primero si existe informe e historial.
