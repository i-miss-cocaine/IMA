# AUDITORÍA DE CUMPLIMIENTO — TAREA-F4-P2-03

**Checkpoint:** C1.87  
**Fecha:** 2026-11-06  
**Repositorio:** i-miss-cocaine/IMA  
**Rama:** `NG_beta_0.0.0.1_work`  
**HEAD de partida:** `21688b71856c5acaeddcdde713b72fff4a44ad5b`  
**Tree SHA de partida:** `68d914a4285b4270af88fa7d92d1599951786fdf`  
**Rama base:** `NG_beta_0.0.0.1`  
**HEAD de rama base:** `44d9891132332e692dbe2ba8602b41f50a508a59`  
**Diferencia:** 149 commits adelante, 0 detrás.  
**ID operativo de sesión/chat:** `IMA-AUDIT-20261106-1644Z` (inicio C1.86; C1.87 intermedio; sesión abierta; identificador operativo, no ID nativo de ChatGPT).

**Dictamen: NO CUMPLE.** La tarea aparece como completada, pero el modal administrativo no está disponible en la carga normal, sus llamadas al backend invierten el contrato de `fetchApi`, el endpoint de directorio no devuelve los campos ni aplica los filtros que la interfaz espera, y no existen flujos de permisos/delegaciones en el modal.

## 1. Alcance y fuente

`completadas.md` (SHA `f57f1aef832e81e44fc4f7ec36a852d50e464676`, líneas 1779-1783) marca TAREA-F4-P2-03 como [X], severidad Medio, Interfaz/Usabilidad, archivos `js/ui-common.js` y dashboards HTML. No conserva criterios de aceptación detallados. La fuente original `AUDITORIA_FASE4_IDENTIDAD_PERMISOS_GOBIERNO.md` no está en el árbol.

`ChangesLogs.txt` (SHA `d57cf4bd861b5c3720e60cf83241ed804ff645d9`, líneas 1753-1757) declara un modal con directorio, búsqueda multi-campo, filtro por estado y confirmación de acciones sensibles, además de un botón en dashboard-direccion.html. Se contrasta esa declaración con la implementación actual.

## 2. Evidencia inspeccionada

| Archivo | SHA | Bloques |
|---|---|---|
| `js/ui-common.js` | `986938b8a311a41ed4cb3d135b66b6aaea4bed67` | renderDataFreshnessBadge 5438-5789; openUserManagementAdministrationModal 5468-5614; carga de usuarios 5550-5582; acción de estado 5583-5608; UX-04 1879-1885. |
| `js/api.js` | `6b24f666db30a811a8e9b38d466fc6001cf6dfa9` | firma fetchApi 11; lookup de URL 18-23; enriquecimiento/body 40-57. |
| `js/config.js` | `49ef90807e5b9dfe1379f76d66efdb4ccd2b6cdc` | SERVICE_URLS 224-238. |
| `backend/user-service/Code.gs` | `12079dd410aa6d8afbce55a4bc62a79dea605f9f` | ROLE_PERMISSIONS 940-968; validateRolePermission 1253-1305; getStudents 2556-2558; manageAccountState 2342-2386; endpoints de delegación 1746-1859 y 2276-2314. |
| `dashboard-direccion.html` | `fefaa3bf7884288aef563cfb8aaf244e6cea8b7c` | botón 39; listener 185-190; scripts 65-80. |
| `dashboard-secretaria.html` | `fa0d8c23aace24a6acab2d4956398a7f5e1309b8` | botón 35; listener 327-332. |
| `tests/regression/academic-grading-suite.js` | `3433b707edd4a2f35c68368a3172932adc2a3b32` | búsqueda dirigida de modal/API/estado. |
| `tests/regression/modular-dashboard-suite.js` | `0495e1d526a872c33310935a003a83d924d34683` | búsqueda dirigida de modal/API/estado. |

## 3. Hallazgos

### 3.1. El modal no se registra globalmente en la carga normal (TASK-480 / AUD-NG-183)

`window.renderDataFreshnessBadge` inicia en ui-common.js:5438 y no se cierra hasta 5789. La asignación de `window.openUserManagementAdministrationModal` (5468-5614) queda dentro del cuerpo de esa función. No se localizaron llamadas a `renderDataFreshnessBadge` en dashboard-direccion.html ni dashboard-secretaria.html. Ambos botones comprueban `typeof window.openUserManagementAdministrationModal === "function"` y, si no existe, omiten la acción.

Este defecto ya está registrado en TASK-480/AUD-NG-183, que exige cerrar el renderer antes de declarar helpers y probar que los modales estén disponibles al cargar. Se revalida sin crear duplicado.

### 3.2. El modal invierte los parámetros de fetchApi (nuevo AUD-NG-228 / TASK-508)

La firma de js/api.js es `fetchApi(service, action, payload, retryCount, options)` (línea 11). La función busca la URL con `urls[service]` y retorna error de configuración si la clave no existe (18-23). `SERVICE_URLS` contiene claves de microservicio como USER, ACADEMIC, TASK y EXAM (config.js 224-238).

Sin embargo, el modal llama:
- `fetchApi("getStudents", { search: query, estadoFilter: state }, "USER")` (ui-common.js 5555).
- `fetchApi("manageAccountState", { userId: uid, newState: newSt, motivo: ... }, "USER")` (ui-common.js 5590).

El primer argumento se interpreta como servicio. Por tanto, se busca `SERVICE_URLS.getStudents` o `SERVICE_URLS.manageAccountState`, que no son claves de servicio. La petición termina antes de llegar a USER. En la carga, la respuesta de fallback contiene data vacía y la UI puede presentar “No se encontraron usuarios”; al cambiar estado, devuelve error de configuración.

### 3.3. El contrato de getStudents no coincide con el directorio (AUD-NG-228 / TASK-508)

USER/getStudents (2556-2558) ignora el payload y devuelve solo `userId`, `nombre` y `numeroLista` de cuentas cuyo rol es Estudiante y estado no Desactivada. No devuelve `email`, `rol` ni `estadoCuenta`; tampoco aplica búsqueda, filtro de estado ni paginación.

La interfaz espera esos campos (ui-common.js 5568-5580), muestra fallback “Estudiante” y “Activa” cuando faltan y anuncia búsqueda por nombre/email/ID. Como resultado, aun corrigiendo el orden de fetchApi, no se obtiene un directorio completo de cuentas, no se muestran estados reales y los filtros no funcionan. Las cuentas desactivadas y los usuarios que no sean estudiantes quedan fuera del listado.

### 3.4. El modal no gestiona permisos ni delegaciones (AUD-NG-219 / AUD-NG-221)

El modal solo muestra una tabla y una acción para cambiar el estado. No hay llamadas a `createSecurityDelegation`, `getSecurityDelegations` o `revokeSecurityDelegation`, ni flujos para crear/listar/revocar delegaciones. Tampoco consulta la matriz ni muestra/edita permisos efectivos, aunque el subtítulo promete esa consulta.

Se reconcilia con AUD-NG-219/TASK-498 (ciclo de vida y UI de delegaciones) y AUD-NG-221/TASK-501 (matriz, dimensiones y UI). No se crean IDs duplicados.

### 3.5. Riesgo de renderizado de datos no confiables

El modal concatena `u.userId` y `u.nombre` dentro de una cadena asignada a `tbody.innerHTML` (ui-common.js 5568-5581). `getStudents` obtiene `nombre` de la hoja Usuarios. Si el flujo se vuelve alcanzable y el campo contiene marcado malicioso, el navegador podría interpretarlo como HTML. No se ejecutó una prueba XSS en navegador; se registra como requisito de salida segura dentro de AUD-NG-228, sin afirmar explotación confirmada.

## 4. Reconciliación

- **TASK-480/AUD-NG-183:** conserva el anidamiento del modal dentro de renderDataFreshnessBadge y su registro global.
- **AUD-NG-001:** conserva la falta de persistencia/transmisión de sessionToken; incluso con el orden de argumentos corregido, las llamadas protegidas seguirán dependiendo de resolver ese hallazgo.
- **AUD-NG-219/TASK-498:** conserva autoridad, ámbito y UI de creación/consulta/revocación de delegaciones.
- **AUD-NG-221/TASK-501:** conserva matriz dinámica y UI de permisos efectivos.
- **Nuevo AUD-NG-228/TASK-508:** contrato de llamada fetchApi y DTO/filtros del directorio administrativo. No duplica los anteriores.

## 5. Pruebas y límites

**Ejecutado:** inspección estática/manual, cotejo de firma de fetchApi con SERVICE_URLS y llamadas del modal, lectura de getStudents y ROLE_PERMISSIONS, inspección de los dos dashboards, búsqueda de llamadas a badge y de endpoints de delegación, búsqueda dirigida en ambos archivos de pruebas.

**No ejecutado:** navegador/DOM, Apps Script runtime, HTTP, datos de Sheets productivos, pruebas de roles reales, cambio de estado, filtros, delegaciones, matriz de permisos, XSS, ni suites automatizadas. Los dos archivos bajo tests/regression no contienen casos específicos coincidentes. No se modificó código ni pruebas.

## 6. Resultado y continuidad

- **Dictamen:** NO CUMPLE.
- **Progreso:** 84/183 identificadores auditados; 99 pendientes.
- **Última tarea auditada:** C1.87 / TAREA-F4-P2-03.
- **Siguiente tarea exacta:** TAREA-F4-P2-04 - Optimizar la concurrencia y la consistencia de las operaciones de identidad.
- **Archivos documentales previstos para C1.87:** Auditoria.txt, Pendientes.md, MapaDependencias.md, AUDITORIA_COMPLETADAS_PLAN.md, Contexto_personal.txt y este informe.
- **Archivos preservados:** código fuente, pruebas, completadas.md, ChangesLogs.txt y METODOLOGIA_DESARROLLO.md.
- **Commit de cierre:** el commit que contiene este checkpoint; SHA final se verifica después de publicar.


## Tareas ejecutables derivadas de los hallazgos

### [AUD-NG-228 / TASK-508] Corregir el contrato de llamadas y el DTO/filtros del directorio administrativo

- **Hallazgo de origen:** secciones 3.2, 3.3 y 3.5; registro preexistente AUD-NG-228/TASK-508 en `AUDITORIAS/Auditoria.txt` y `AUDITORIAS/MapaDependencias.md`. El modal invoca `fetchApi("getStudents", payload, "USER")` y `fetchApi("manageAccountState", payload, "USER")`, aunque la firma real es `fetchApi(service, action, payload)`. El endpoint USER/getStudents ignora el payload y solo devuelve userId, nombre y numeroLista para estudiantes no desactivados; no entrega email, rol ni estadoCuenta y no aplica búsqueda/filtro. La UI espera esos campos y muestra valores por defecto que pueden ocultar el estado real. El renderizado concatena datos del directorio en innerHTML sin escape contextual visible.
- **Clasificación:** la tarea madre TAREA-F4-P2-03 figura con severidad Medio en completadas.md. El registro resumido de AUD-NG-228 no asigna una severidad independiente; no se inventa una clasificación adicional.
- **Objetivo:** hacer que el directorio administrativo invoque correctamente el servicio USER, reciba un contrato de datos consistente para las cuentas que debe administrar, aplique los filtros declarados y renderice datos no confiables de forma segura.
- **Acción ejecutable:**
  1. Corregir las llamadas del modal para respetar la firma existente: `fetchApi("USER", "getStudents", payload)` y `fetchApi("USER", "manageAccountState", payload)`. Mantener la firma pública y el orden de argumentos de fetchApi; no cambiar el helper ni introducir un alias de servicio que oculte el error.
  2. Definir y documentar el DTO de respuesta del directorio. Como mínimo, incluir `userId`, `nombre`, `email`, `rol` y `estadoCuenta`; conservar `numeroLista` solo si existe un consumidor que lo necesite. No devolver contraseñas, tokens ni secretos.
  3. Ajustar USER/getStudents para procesar el payload validado y devolver el universo de cuentas que corresponde al directorio administrativo, sin limitarlo silenciosamente al rol Estudiante ni excluir estados que la interfaz debe poder consultar y gestionar.
  4. Implementar búsqueda por los campos que anuncia la interfaz (identificador, nombre y correo) y filtro por estado real. Un filtro equivalente a “Todos” no debe excluir cuentas; los estados específicos deben aplicarse de forma consistente con el catálogo institucional.
  5. Hacer que la interfaz consuma el DTO canónico y muestre los valores reales. No sustituir un estado ausente por “Activa” ni un rol ausente por “Estudiante”, porque esos defaults pueden representar incorrectamente la cuenta.
  6. Sustituir la interpolación de nombre, correo, identificador, estado y mensajes de error dentro de HTML por creación segura de nodos y asignación mediante textContent/propiedades DOM. No considerar demostrado un XSS hasta ejecutar pruebas de navegador; el criterio es preventivo y verificable.
  7. Mantener la autorización del backend y las validaciones existentes para el cambio de estado. La corrección del contrato no debe convertir los datos requesterUserId/requesterRole en prueba de identidad ni abrir acciones públicas.
  8. Añadir pruebas aisladas del contrato de fetchApi y del endpoint: servicio/acción correctos, búsqueda por ID/nombre/correo, filtro por estado, distintos roles/estados, campos ausentes y renderizado de valores con caracteres HTML. Distinguir PASS, FAIL, SKIP y NOT RUN.
- **Archivos/módulos afectados:** `js/ui-common.js`; `backend/user-service/Code.gs`; pruebas de regresión del directorio. `js/api.js` y `js/config.js` son referencias del contrato vigente y solo deben modificarse si una prueba demuestra un defecto propio del helper o del registro SERVICE_URLS.
- **Dependencias y límites:** TASK-480/AUD-NG-183 conserva el registro global y disponibilidad del modal; AUD-NG-001 conserva el transporte del token de sesión; AUD-NG-219/TASK-498 conserva el motor y ciclo de vida de delegaciones; AUD-NG-221/TASK-501 conserva la matriz y los permisos efectivos. AUD-NG-228/TASK-508 no absorbe ni duplica esos alcances. Tampoco sustituye la auditoría de acciones públicas ni la autorización del logout.
- **Criterios de aceptación:**
  1. Las dos llamadas del modal usan USER como servicio y la acción como segundo argumento; la petición alcanza el endpoint previsto y no retorna el fallback de “servicio no encontrado”.
  2. USER/getStudents devuelve el DTO documentado con identificador, nombre, correo, rol y estado reales para las cuentas incluidas en el directorio.
  3. La búsqueda por identificador, nombre y correo y el filtro de estado producen resultados correctos; la opción “Todos” no omite cuentas por rol o estado.
  4. La interfaz no inventa valores por defecto que alteren la interpretación de rol o estado.
  5. Los datos provenientes de Sheets y los mensajes de error se insertan sin interpretar contenido no confiable como HTML.
  6. El cambio de estado continúa sujeto a autorización de servidor; la corrección no introduce una ruta pública ni confía en identidad declarada por el cliente.
  7. Las pruebas aisladas cubren resultados positivos, negativos, filtros vacíos, estados distintos y datos con caracteres HTML; no se afirma cobertura runtime si no se ejecutó.
- **Prioridad:** no asignada en las fuentes consultadas.
- **Estado:** Pendiente.
- **Evidencia de cierre:** pendiente. Adjuntar commit de implementación, pruebas del contrato UI/API, resultados de búsqueda/filtro y evidencia de renderizado seguro.



## Aclaración documental posterior a C1.187 — contenido real de Pendientes.md

La lectura inicial mediante fetch_file devolvió contenido vacío para Pendientes.md por el tamaño de la respuesta; esa salida no demostraba que el archivo estuviera vacío. La inspección directa de los blobs confirma:
- Versión histórica citada en el informe P2-04, blob SHA `83e885f4b8f860aba200ed5ae739b794c7c02dc8`: 1.764.184 caracteres. Contiene AUD-NG-161, AUD-NG-218, AUD-NG-219 y TASK-118, además de AUD-NG-228/TASK-508.
- Versión actual de la rama, blob SHA `ef47d232db3ed46317dc14f22b1cdf8f938e8405`: 1.425.933 caracteres. Contiene TASK-118, pero no contiene las cadenas AUD-NG-161, AUD-NG-218, AUD-NG-219, AUD-NG-228, TASK-508, AUD-NG-229 ni TASK-509.
- La ausencia de esos IDs en el backlog actual no demuestra su eliminación del repositorio: permanecen documentados en Auditoria.txt, MapaDependencias.md, el plan y/o los informes correspondientes. No se restaura ni modifica Pendientes.md en esta errata.
- Esta aclaración sustituye únicamente la observación de C1.187 que describió Pendientes.md como vacío. No cambia el dictamen NO CUMPLE ni los hallazgos de TAREA-F4-P2-03.
