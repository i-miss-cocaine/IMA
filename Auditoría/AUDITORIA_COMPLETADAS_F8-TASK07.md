# Auditoría F8-Task07 / TAREA-AD-01 — Arquitectura de dashboards dinámicos para roles configurables

- **Fecha:** 2026-11-08.
- **ID de sesión operativo:** IMA-AUDIT-20261108-2201Z-01 (identificador documental; no es un ID nativo de ChatGPT).
- **Checkpoint inicial:** C1.266.
- **Checkpoint de cierre:** C1.267.
- **Repositorio:** i-miss-cocaine/IMA.
- **Rama de trabajo:** NG_beta_0.0.0.1_work.
- **HEAD de partida verificado:** 212d346f059f51e187cf75794e8bfd873c4f75c5; árbol Git `af398dd0d15d44531837ada86f5d196d4101c22b`.
- **Rama base protegida:** NG_beta_0.0.0.1 @ `44d9891132332e692dbe2ba8602b41f50a508a59`; comparación inicial: 335 commits adelante, 0 detrás.
- **Tarea auditada:** F8-Task07 / TAREA-AD-01, marcada [X] en `completadas.md`, líneas 4915–4943.
- **Informe individual previo:** no existe `AUDITORIAS/AUDITORIA_COMPLETADAS_F8-TASK07.md` en el árbol de la rama; se ejecutó la auditoría directamente.
- **Dictamen:** **NO CUMPLE**. CA-AD-101, CA-AD-102 y CA-AD-103 NO CUMPLEN. La marca histórica [X] se conserva, pero no certifica el cumplimiento funcional.

## 1. Objetivo y criterios

Comprobar que la plataforma permite incorporar roles institucionales desde una interfaz administrativa, componer dashboards con los módulos realmente autorizados según responsabilidades y ámbitos, soportar múltiples responsabilidades por usuario y denegar el acceso por defecto a roles desconocidos o sin permisos.

- **CA-AD-101:** se puede crear un rol nuevo desde la interfaz administrativa autorizada.
- **CA-AD-102:** el dashboard presenta únicamente los módulos correspondientes a la configuración efectiva del usuario.
- **CA-AD-103:** los roles desconocidos o sin permisos no obtienen acceso por defecto.

## 2. Fuentes y respaldos

| Archivo | SHA Git | Inspección |
|---|---|---|
| `completadas.md` | `f57f1aef832e81e44fc4f7ec36a852d50e464676` | F8-Task07, líneas 4915–4943; requisitos y criterios completos |
| `Pendientes.md` | `676a3f798715f0cdd7d4bc75768472545b8465ee` | Blob íntegro recuperado; TASK-488, TASK-501, TASK-505 y TASK-636 |
| `app/html/dashboards/dynamic-dashboard.html` | `765a45e5666c24c430e841cb70c3d71d03cf9074` | 50 líneas; estructura y carga de scripts |
| `js/ui-common.js` | `986938b8a311a41ed4cb3d135b66b6aaea4bed67` | 5.872 líneas; validateUserScopeContext y loadDynamicDashboard, líneas 5810–5872 |
| `backend/user-service/Code.gs` | `12079dd410aa6d8afbce55a4bc62a79dea605f9f` | PUBLIC_ACTIONS/ROLE_PERMISSIONS, autenticación, RBAC, matriz dinámica, dispatcher, catálogo de responsabilidades, asignaciones y getUserDynamicDashboardConfig |
| `js/config.js` | `49ef90807e5b9dfe1379f76d66efdb4ccd2b6cdc` | Catálogos estáticos de capacidades, módulos y responsabilidades; contratos y rutas |
| `js/api.js` | `6b24f666db30a811a8e9b38d466fc6001cf6dfa9` | Enriquecimiento del payload y propagación de credenciales |
| `tests/regression/modular-dashboard-suite.js` | `0495e1d526a872c33310935a003a83d924d34683` | 61 líneas; alcance real de la suite |
| `js/developer.js` | `6fa4c4bd9be580c974b1fbede4f0cf79485dc331` | Búsqueda de consumidores de gestión de roles/responsabilidades |
| `dashboard-recursos-humanos.html` | `406bedbae5a5bb3b5c03e4ea7aaa95ed68aea8ee` | Búsqueda de consola de gestión de responsabilidades y asignaciones |
| `AUDITORIAS/Auditoria.txt` | `d6a0fd9e43623436d5ffb6ecbe1f25ded0d99717` | Reconciliación de AUD-NG-191, AUD-NG-221 y AUD-NG-225 |
| `METODOLOGIA_DESARROLLO.md` | `cf796728bb384a32537392df2f9c72a339fa03ee` | Procedimiento de auditoría manual, tareas derivadas y checkpoint |
| `AUDITORIAS/Contexto_personal.txt` | `8a021bbb3f8dcd4e1057977a84045b9832c41931` | Reglas prioritarias y checkpoint C1.266 |
| `AUDITORIAS/AUDITORIA_COMPLETADAS_PLAN.md` | `c34aaa254d488f8b1a68c1fb6c34e0cff7a5ac43` | Continuidad de la secuencia C1 |

### Recuperación de Pendientes.md

La lectura convencional de `Pendientes.md` devolvió 0 caracteres. Se recuperó el blob actual de la rama con SHA `676a3f798715f0cdd7d4bc75768472545b8465ee`: 1.786.011 caracteres, 20.224 líneas y 0 caracteres U+FFFD. Se verificaron las entradas TASK-488, TASK-501, TASK-505 y TASK-636. El blob coincide con el archivo del HEAD de la rama; no se restauró una versión histórica ni se modificó el archivo.

No se crean identificadores duplicados: los hallazgos se reconcilian con tareas existentes y se documentan sus ampliaciones en el bloque de tareas derivadas de esta auditoría.

## 3. Evidencia por componente

### 3.1 Interfaz HTML

`app/html/dashboards/dynamic-dashboard.html` contiene 50 líneas. Define el encabezado, el badge de rol, una cuadrícula vacía de módulos y carga `config.js`, `persistence.js`, `api.js` y `ui-common.js`. Al DOMContentLoaded invoca `window.loadDynamicDashboard()`.

La página no contiene un editor de roles, un formulario de creación de responsabilidades, selección de capacidades/ámbitos, ni controles de administración de asignaciones. Tampoco contiene destinos de navegación por módulo: únicamente ofrece el contenedor donde el script inyecta tarjetas.

### 3.2 Renderizado del dashboard

En `js/ui-common.js`, líneas 5834–5872:

1. Lee `currentUser` desde localStorage/sessionStorage y obtiene `user.userId`.
2. Si no encuentra userId, muestra un mensaje y redirige a login.
3. Invoca `fetchApi('USER', 'getUserDynamicDashboardConfig', { userId: user.userId })`.
4. Si la respuesta es success, presenta `rolPrincipal` y consume `modulosAutorizados`.
5. Si no hay módulos, muestra un mensaje de vacío.
6. Si hay módulos, genera tarjetas con `innerHTML`. El texto “Acceder” es un `span` sin href, sin listener y sin destino de módulo.

El cliente no consulta responsabilidades activas, asignaciones múltiples, capacidades, permisos efectivos ni rutas autorizadas para componer las tarjetas. Solo representa el arreglo recibido.

### 3.3 Resolución de roles y módulos en backend

En `backend/user-service/Code.gs`, líneas 9253–9304, `getUserDynamicDashboardConfig`:

- Busca el usuario por `payload.userId` en la hoja `Usuarios`.
- Inicializa `userRole = "Profesor"`; si no encuentra coincidencia o el dato de rol está vacío, conserva ese rol predeterminado.
- Define un objeto local `modulosMap` con seis roles fijos: Administrador, Director, Secretaría, Coordinador, Profesor y Estudiante.
- Si el rol no existe en el mapa, asigna `["mod_mis_clases", "mod_mis_horarios"]`.
- Devuelve `status: "success"`, el rol y módulos, sin consultar las responsabilidades institucionales ni las asignaciones de ámbitos del usuario.

No existe composición dinámica basada en múltiples responsabilidades por usuario. La función tampoco utiliza `getUserScopeConfig`, `getInternalRoleAssignments` ni `getInstitutionalResponsibilitiesCatalog` para decidir qué módulos mostrar. La salida no representa la configuración efectiva individual, sino un mapa fijo con un fallback genérico.

### 3.4 Catálogos y administración

En `js/config.js`, líneas 1–72, los catálogos de capacidades, módulos y responsabilidades se declaran como arreglos estáticos en el cliente. Estos catálogos permiten describir capacidades y módulos, pero no constituyen por sí solos un flujo administrativo de alta y asignación de roles.

En `backend/user-service/Code.gs`:

- `getInstitutionalResponsibilitiesCatalog`, líneas 8968–9032, lee `ResponsabilidadesInstitucionales`; si no encuentra registros activos, devuelve tres responsabilidades codificadas en el backend.
- `saveInstitutionalResponsibility`, líneas 9034–9114, permite persistir nombre, descripción, módulos, capacidades y estado. La existencia de este endpoint no demuestra que exista una interfaz administrativa conectada.
- `assignRoleScope`, líneas 9116–9180, permite registrar ámbitos; no valida referencialmente que roleId exista y esté activo, y busca la asignación existente por userId+scopeType, sin incluir roleId en la clave de actualización.
- `manageInternalRoleCatalog`, líneas 9631–9728, administra responsabilidades organizativas (nombre, departamento, área, tipo y vigencia), pero no integra por sí mismo las capacidades y módulos que necesita el dashboard.
- `getInternalRoleCatalog` y `getInternalRoleAssignments`, líneas 9730–9808, permiten consultar catálogo y asignaciones; no se encontró un consumidor de estas acciones en los frontends revisados.

La búsqueda de consumidores en `js/ui-common.js`, `js/developer.js` y `dashboard-recursos-humanos.html` no encontró llamadas a `saveInstitutionalResponsibility`, `manageInternalRoleCatalog`, `getInternalRoleCatalog` ni `getInternalRoleAssignments`. Por tanto, hay endpoints y almacenamiento nominales, pero no evidencia de la consola administrativa funcional requerida por CA-AD-101.

### 3.5 Permisos efectivos y ámbitos

`getDynamicPermissionsForRole`, USER Code.gs:1863–1898, consulta `MatrizPermisosRoles` y evalúa únicamente rol+acción. No aplica las columnas módulo y ámbito. `validateRolePermission`, líneas 1253–1295, usa esa consulta y luego la lista ROLE_PERMISSIONS; la matriz dinámica no es un motor completo de autorización por módulo/ámbito.

Este defecto ya está registrado en AUD-NG-221/TASK-501 y AUD-NG-222/TASK-502. Se amplía el alcance de TASK-501 para que el dashboard no confunda visibilidad de módulo con permiso efectivo. La asignación de responsabilidades tampoco debe conceder privilegios globales por sí misma.

### 3.6 Contrato de autenticación de la consulta

`js/api.js`, líneas 45–59, agrega `requesterUserId` y `requesterRole` desde el usuario local, pero no propaga `sessionToken`, `authToken` ni `token`.

En USER Code.gs:1146–1162, `getUserVerifiedRole` exige uno de esos tokens y devuelve NO_ACCESS si falta. En USER Code.gs:1351–1359, `doPost` ejecuta `validateRolePermission` antes de despachar la acción. `getUserDynamicDashboardConfig` no está en PUBLIC_ACTIONS y no figura en la lista estática de permisos de los roles ordinarios. Por tanto, la llamada actual del dashboard carece del token que el backend exige y, además, no existe una concesión estática para la mayoría de los roles. Esto impide acreditar que el flujo de carga funcione para usuarios normales.

La propagación de token e identidad desde claims ya forma parte de TASK-636 y se amplía allí; no se crea una tarea duplicada.

### 3.7 Pruebas existentes

`tests/regression/modular-dashboard-suite.js` (61 líneas) verifica existencia de archivos y presencia de cadenas/símbolos en `js/config.js` y `backend/developer-service/Code.gs`. No prueba la creación administrativa de roles, la composición de módulos por usuario, múltiples responsabilidades, scopes, roles desconocidos, permisos denegados, navegación de tarjetas ni el contrato de autenticación de `getUserDynamicDashboardConfig`.

No se ejecutó Node ni Apps Script. La inspección de la suite es estática y no se interpreta como ejecución de pruebas.

## 4. Hallazgos reconciliados

### AUD-NG-191 — Dashboard dinámico y paneles por rol con fallback genérico y accesos no funcionales
- **Severidad:** ALTO/P1.
- **Estado de auditoría:** confirmado y ampliado para F8-Task07.
- **Evidencia nueva:** USER Code.gs:9253–9304 fija seis roles, asigna módulos de Profesor ante cualquier rol desconocido y no lee responsabilidades/ámbitos; ui-common.js:5834–5872 muestra tarjetas sin destino navegable.
- **Tarea existente:** TASK-488.
- **Ampliación:** además de corregir el fallback y los accesos decorativos, TASK-488 debe exigir que los módulos mostrados provengan de asignaciones activas, capacidades y permisos efectivos; contemplar todos los roles configurables y respuestas desconocidas/inactivas con denegación.

### AUD-NG-225 — Catálogo de roles internos sin integración completa con asignaciones y dashboard
- **Severidad:** ALTO/P1.
- **Estado de auditoría:** confirmado y ampliado para F8-Task07.
- **Evidencia nueva:** no se encontró UI consumidora de los endpoints de catálogo/roles en los frontends revisados; el dashboard ignora las responsabilidades y asignaciones existentes.
- **Tarea existente:** TASK-505.
- **Ampliación:** conectar consola administrativa autenticada para crear/editar/desactivar responsabilidades y asignarlas a usuarios; vincular roleId a catálogo existente y activo; corregir la resolución del rol y la integración del dashboard. Mantener separadas responsabilidad organizativa y autorización RBAC.

### AUD-NG-221 — Matriz dinámica de permisos no aplica módulo ni ámbito
- **Severidad:** ALTO/P1.
- **Estado de auditoría:** confirmado como dependencia de CA-AD-102.
- **Evidencia nueva:** USER Code.gs:1863–1898 consulta solo role+action aunque la hoja incluye módulo y ámbito.
- **Tarea existente:** TASK-501.
- **Ampliación:** el filtrado y acceso a cada módulo del dashboard debe comprobar capacidades, módulo y ámbito de la asignación vigente; no basta con ocultar/mostrar tarjetas en el cliente.

### AUD-NG-003 / TASK-636 — Token y autorización efectiva
- **Estado:** ampliación de alcance, sin crear un hallazgo/tarea duplicados.
- **Evidencia nueva:** api.js:45–59 no propaga token; USER Code.gs:1146–1162 lo exige; el dashboard llama el endpoint solo con userId.
- **Ampliación:** incluir la ruta dinámica en pruebas de contrato; propagar credenciales válidas desde la sesión y derivar identidad/rol del token verificado; rechazar userId ajeno o payload manipulado.

No se asignan nuevos IDs AUD-NG ni TASK porque las causas principales ya están registradas y tienen tareas abiertas. Esta auditoría agrega evidencia específica de F8-Task07 y precisa los criterios pendientes.

## 5. Matriz de aceptación

| Criterio | Dictamen | Justificación |
|---|---|---|
| CA-AD-101 | NO CUMPLE | Hay endpoints para guardar responsabilidades y roles internos, pero no se encontró una interfaz administrativa conectada que permita crear roles configurables con módulos, capacidades y ámbitos. |
| CA-AD-102 | NO CUMPLE | El backend usa un mapa fijo de seis roles; no compone módulos desde asignaciones múltiples, responsabilidades activas, ámbitos y permisos efectivos. El cliente solo representa la lista recibida. |
| CA-AD-103 | NO CUMPLE | Los roles desconocidos reciben dos módulos docentes por fallback; los usuarios no encontrados se tratan como Profesor. La salida no deniega por defecto. |

## 6. Tareas ejecutables derivadas de los hallazgos de la auditoría

### Ampliar TASK-488 — Dashboard dinámico y módulos operativos por rol
- **Origen:** AUD-NG-191, confirmado en F8-Task07.
- **Componentes:** `app/html/dashboards/dynamic-dashboard.html`, `js/ui-common.js`, `backend/user-service/Code.gs`, contratos de rutas y pruebas.
- **Acciones:** eliminar el mapa rígido y el fallback docente; resolver todas las responsabilidades activas y ámbitos vigentes del usuario autenticado; filtrar módulos mediante capacidades/permisos efectivos; convertir cada tarjeta en enlace/acción real con ruta validada; no mostrar módulos si la consulta de permisos falla.
- **Aceptación adicional:** un rol desconocido/inactivo o sin módulos devuelve acceso denegado/estado vacío explícito; ningún rol recibe módulos docentes por defecto; cada tarjeta conduce a un destino real y autorizado; pruebas cubren roles configurables, múltiples responsabilidades, ámbitos, permisos insuficientes y errores de servicio.
- **Estado:** TASK-488 permanece [ ] Pendiente.

### Ampliar TASK-505 — Ciclo de vida de roles internos y asignaciones
- **Origen:** AUD-NG-225, confirmado en F8-Task07.
- **Componentes:** USER Code.gs, consola administrativa de RR. HH./Administración, `js/ui-common.js`, `dashboard-recursos-humanos.html`, pruebas.
- **Acciones:** implementar UI autenticada para alta/edición/desactivación y asignaciones; vincular asignaciones a roles existentes y activos; validar roleId, módulos/capacidades y ámbitos; conservar historial y vigencias; permitir múltiples responsabilidades por usuario; resolver el rol del dashboard desde la fuente canónica.
- **Aceptación adicional:** las operaciones de UI llegan al backend con token verificado; las asignaciones huérfanas/inactivas se rechazan; no se otorgan permisos globales por pertenecer a una responsabilidad; el dashboard refleja la combinación vigente de asignaciones.
- **Estado:** TASK-505 permanece [ ] Pendiente.

### Ampliar TASK-501 — Matriz de permisos por módulo y ámbito
- **Origen:** AUD-NG-221, dependencia de CA-AD-102.
- **Componentes:** USER Code.gs y motor de autorización compartido.
- **Acciones:** evaluar role+module+action+scope y resolver conflictos/denegaciones explícitas; invalidar caché al cambiar reglas; exponer al dashboard solo capacidades efectivas y no el catálogo completo.
- **Aceptación adicional:** el mismo rol puede acceder a un módulo/ámbito y ser rechazado en otro; falta de regla, módulo desconocido o error de consulta no concede acceso.
- **Estado:** TASK-501 permanece [ ] Pendiente.

### Ampliar TASK-636 — Token y autorización efectiva para la consulta del dashboard
- **Origen:** AUD-NG-003 y F8-Task01/TASK-636.
- **Componentes:** `js/api.js`, `js/ui-common.js`, `backend/user-service/Code.gs`.
- **Acciones:** propagar el token de sesión sin confiar en requesterRole; obtener userId/rol de claims verificados; comprobar que el userId solicitado coincide con la identidad autenticada; autorizar la acción de configuración dinámica por política explícita.
- **Aceptación adicional:** llamadas sin token, con token vencido, rol manipulado o userId ajeno se rechazan; usuarios autorizados pueden cargar su propio dashboard; errores de autenticación no se convierten en una lista genérica de módulos.
- **Estado:** TASK-636 permanece [ ] Pendiente.

## 7. Pruebas, límites y archivos

- **Inspección manual realizada:** alcance y criterios de completadas.md; dashboard HTML; controlador de ui-common.js; catálogo estático de config.js; API común; autenticación/RBAC/dispatcher USER; resolución dinámica de permisos; responsabilidades, catálogo, asignaciones, scopes y función del dashboard; suite de regresión y hallazgos previos.
- **Pruebas ejecutadas:** inspección manual de código/documentación, consulta del árbol Git, recuperación del blob Pendientes.md, verificación de inexistencia del informe individual y comparación de ramas.
- **No ejecutadas:** Node, navegador/DOM, HTTP, Apps Script runtime, lectura de hojas productivas, pruebas con múltiples usuarios/roles, token real, pruebas de permisos por módulo/ámbito ni E2E.
- **Limitaciones:** no se dispone de acceso al despliegue Apps Script ni a los datos operativos de las hojas; por ello no se certifica el contenido real de catálogos/asignaciones en producción. La auditoría evalúa el código versionado y sus contratos.
- **Código fuente:** sin modificaciones.
- **Archivos de tareas históricas:** `completadas.md` y `Pendientes.md` sin modificaciones; se preserva [X] histórica y los estados [ ] existentes.
- **Rama base:** sin modificaciones.
- **Dictamen final:** NO CUMPLE en los tres criterios.

## 8. Continuidad

- **Última tarea auditada:** F8-Task07 / TAREA-AD-01.
- **Checkpoint inicial:** C1.266.
- **Checkpoint de cierre:** C1.267.
- **Siguiente tarea exacta:** F8-Task08 — catálogo central de responsabilidades, capacidades y módulos.
- **Próxima acción:** comprobar si existe `AUDITORIAS/AUDITORIA_COMPLETADAS_F8-TASK08.md`; si falta, auditar directamente F8-Task08 y verificar que el catálogo central sea persistente, consistente y consumido por los módulos y servicios, sin asumir que los catálogos estáticos de config.js equivalen a configuración efectiva.
- **Commit de cierre:** el commit único que contiene este informe, bitácora, mapa, plan y checkpoint; SHA final se confirma consultando HEAD después de publicar.
