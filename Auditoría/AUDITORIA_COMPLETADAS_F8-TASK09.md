# Auditoría F8-Task09 / TAREA-AD-03 — Gestión del ámbito de actuación de los roles

- **Fecha:** 2026-11-08.
- **ID de sesión operativo:** IMA-AUDIT-20261108-2212Z-01 (identificador documental; no es ID nativo de ChatGPT).
- **Checkpoint inicial:** C1.268.
- **Checkpoint de cierre:** C1.269.
- **Repositorio:** i-miss-cocaine/IMA.
- **Rama de trabajo:** NG_beta_0.0.0.1_work.
- **HEAD de partida verificado:** e5dc3f6eafd3a723072ed75373f82bc411e791e6; árbol Git 9313c34141767c79a3f79c711a1d9230dca51959.
- **Rama base protegida:** NG_beta_0.0.0.1 @ 44d9891132332e692dbe2ba8602b41f50a508a59; comparación inicial: 337 commits adelante, 0 detrás.
- **Tarea auditada:** F8-Task09 / TAREA-AD-03, marcada [X] en completadas.md, líneas 4970–4990.
- **Informe individual previo:** no existe AUDITORIAS/AUDITORIA_COMPLETADAS_F8-TASK09.md en el árbol de la rama; se ejecutó la auditoría directamente.
- **Dictamen:** **NO CUMPLE**. CA-AD-107 y CA-AD-108 NO CUMPLEN. La marca histórica [X] se conserva; no constituye evidencia de cumplimiento funcional.

## 1. Objetivo y criterios

Comprobar que cada responsabilidad de usuario tenga ámbitos explícitos y vigentes (nivel educativo, departamento, carrera, asignatura, grado, sección y período); que las consultas, filtros, listas, búsquedas y mutaciones se limiten a esos ámbitos; que las coordinaciones por departamento/carrera se apliquen correctamente; y que la ausencia de contexto, asignación o datos válidos no conceda acceso.

- **CA-AD-107:** los filtros, listas y búsquedas respetan estrictamente los ámbitos asignados al usuario.
- **CA-AD-108:** los intentos de consultar o modificar registros fuera del ámbito autorizado son rechazados por el backend.

## 2. Fuentes, ramas y recuperación de Pendientes.md

| Fuente | SHA / evidencia | Inspección |
|---|---|---|
| completadas.md | f57f1aef832e81e44fc4f7ec36a852d50e464676 | F8-Task09, líneas 4970–4990; alcance y criterios completos |
| Pendientes.md actual | blob 676a3f798715f0cdd7d4bc75768472545b8465ee | Recuperado desde blob; versión más reciente de la rama |
| Pendientes.md histórico solicitado | blob 631b4c2dbf0e86d5704b63625382d73ccb8ceb3c | Recuperado desde historial de la misma rama |
| USER Code.gs | 12079dd410aa6d8afbce55a4bc62a79dea605f9f | Autenticación, RBAC, asignaciones y validación de ámbitos |
| ACADEMIC Code.gs | df87a2eea9f0ef79d0b966d03fd5bbe432003df5 | RBAC contextual, jerarquía académica y validador de responsabilidades |
| ui-common.js | 986938b8a311a41ed4cb3d135b66b6aaea4bed67 | Filtros y validadores frontend de ámbito |
| api.js | 6b24f666db30a811a8e9b38d466fc6001cf6dfa9 | Enriquecimiento de solicitudes y propagación de credenciales |
| modular-dashboard-suite.js | 0495e1d526a872c33310935a003a83d924d34683 | Alcance real de pruebas de regresión |
| Auditoria.txt | bd0183064315bf3bb01900e9cceb927142f7ddc2 | Hallazgos previos y reconciliación |
| Auditoría F8-Task08 | 0a12442575591b54fba59c67962aa64b682d9f80 | Dependencias TASK-661..665 y relaciones rol/ámbito |
| METODOLOGIA_DESARROLLO.md | cf796728bb384a32537392df2f9c72a339fa03ee | Procedimiento manual, trazabilidad y tareas derivadas |
| Contexto_personal.txt | 55a4cb351d31a52e04733a4f7828c73127106d54 | Gate prioritario, recuperación histórica y C1.268 |

### Recuperación e inventario de Pendientes.md

La lectura convencional de Pendientes.md devolvió 0 caracteres aunque Git identifica el blob. Se recuperó el contenido directamente mediante el blob SHA del árbol de la rama.

**Versión actual de la rama**
- Blob: 676a3f798715f0cdd7d4bc75768472545b8465ee.
- Tamaño Git: 1.807.629 bytes.
- Contenido recuperado: 1.786.011 caracteres; 20.224 líneas; 0 caracteres U+FFFD.
- Inventario textual: 515 identificadores TASK-NNN únicos; máximo identificado TASK-636.
- Último commit que modificó el archivo: a9de4074fcc83241516633526201e288509265b5, alcanzable desde la rama de trabajo.
- El árbol del HEAD actual e5dc3f6eafd3a723072ed75373f82bc411e791e6 conserva exactamente ese blob.

**Versión histórica indicada por el usuario**
- Blob: 631b4c2dbf0e86d5704b63625382d73ccb8ceb3c.
- Commit de la misma rama que la contiene: 6ee8aa685011b86ce92e425c335cbc8500c1326e (recovery: restore complete Pendientes.md from C1.92).
- Tamaño Git: 1.803.672 bytes.
- Contenido recuperado: 1.782.094 caracteres; 20.182 líneas; 0 caracteres U+FFFD.
- Inventario textual: 511 identificadores TASK-NNN únicos; máximo identificado TASK-511.

**Decisión de integridad:** no se restauró el blob histórico 631 sobre la versión actual. Ambos blobs se recuperaron íntegramente desde commits alcanzables de la rama de trabajo; el blob 676 es posterior, está presente en el HEAD actual y conserva 42 líneas y cuatro identificadores únicos más que el histórico indicado. Restaurar 631 supondría retroceder el registro y perder contenido posterior. Se preservan ambos SHAs como respaldo. Los estados completados/pendientes no se contabilizan porque el documento mezcla registros, referencias y estados en formatos heterogéneos y no se obtuvo un conteo fiable por encabezados de tarea.

La metodología contiene una regla anterior que excluye Pendientes.md del flujo operativo; para esta iteración prevalece la instrucción expresa del usuario de consultarlo y verificar su recuperación. No se modificó el registro.

## 3. Evidencia técnica por componente

### 3.1 USER Code.gs — autorización contextual central

En líneas 1213–1251, validateContextualAccess protege principalmente aislamiento de estudiantes y relaciones tutor-estudiante. Tras esas ramas retorna authorized: true para los demás roles; no consulta AsignacionesAmbitosRoles ni valida departamento, carrera, asignatura, grado, sección, nivel o período.

En líneas 1253–1290, validateRolePermission llama a validateContextualAccess para las acciones protegidas. Por tanto, la ausencia de validación de ámbito en esa función se propaga a los endpoints USER que dependen del dispatcher. La autorización por acción/rol no equivale a autorización contextual por registro.

### 3.2 USER Code.gs — persistencia de asignaciones

En líneas 9116–9181, assignRoleScope presenta los siguientes defectos:

1. La hoja se inicializa con ocho encabezados: AsignacionAmbitoID, UserID, RoleID, ScopeType, ScopeValues, Estado, CreadoPor y FechaCreacion.
2. La inserción posterior escribe doce valores, añadiendo fechaInicio, fechaFin, esSuplente y suplenteDeUserId sin crear los encabezados correspondientes.
3. La búsqueda de una asignación existente usa únicamente userId y scopeType. No incluye roleId ni responsabilidad. Dos roles del mismo usuario con el mismo tipo de ámbito pueden colisionar y sobrescribirse.
4. En la rama de actualización solo se modifican las columnas ScopeValues y Estado. No se actualizan RoleID, fechaInicio, fechaFin ni los datos de suplencia.
5. No se valida que userId exista, que roleId/responsabilidad estén activos, que scopeType pertenezca a un catálogo permitido, que scopeValues tenga el tipo/estructura esperados ni que las fechas sean válidas.
6. El actor se acepta desde payload.actor y el estado desde payload.estado. El log no conserva todos los campos anteriores/nuevos ni las fechas y relación de rol completas.

La función genera una respuesta success después de la escritura sin comprobar que la fila resultante conserve todos los campos de la asignación solicitada.

### 3.3 USER Code.gs — lectura y validación de ámbitos

En líneas 9183–9220, getUserScopeConfig filtra por userId y Estado=Activo, pero no:
- limita la consulta al roleId/responsabilidad solicitados;
- valida fechaInicio y fechaFin;
- descarta asignaciones futuras o vencidas;
- comprueba jerarquía o existencia del valor dentro de los catálogos académicos;
- vincula el userId solicitado con _verifiedUserId cuando ambos están presentes.

En líneas 9222–9252, validateRoleScopeAccess selecciona el primer ámbito coincidente por scopeType, sin filtrar por roleId/responsabilidad ni combinar asignaciones válidas de forma definida. El userId del payload tiene prioridad sobre _verifiedUserId. El validador devuelve una decisión aislada, pero no se invoca desde validateContextualAccess ni se integra automáticamente a cada endpoint de lectura o mutación.

El dispatcher expone assignRoleScope, getUserScopeConfig y validateRoleScopeAccess en líneas 1565–1572; su exposición no demuestra enforcement transversal en las operaciones de negocio.

### 3.4 ACADEMIC Code.gs — validación contextual del dispatcher

En líneas 465–522, validateContextualAccess aplica el control de AsignacionesAmbitosRoles solo cuando el cliente proporciona simultáneamente payload.scopeType y payload.requestedValue. Las solicitudes ordinarias que envían grado, sección, asignaturaId o periodoId no activan por sí mismas ese control.

Además:
- si la hoja no existe o no tiene filas de datos, no se produce rechazo;
- si la lectura o el parseo falla, el catch vacío permite continuar;
- la búsqueda se realiza por verifiedUserId y scopeType, sin roleId/responsabilidad;
- el control de coordinación solo se ejecuta cuando llega areaId; si falta, no exige ámbito;
- el control de coordinación también absorbe excepciones sin denegar.

El dispatcher ejecuta validateRolePermission antes de despachar, pero la validación contextual opcional no convierte automáticamente los parámetros académicos reales de cada acción en restricciones de ámbito.

### 3.5 ACADEMIC Code.gs — validador de responsabilidad académica

validateAcademicResponsibilityAndScopeAccess está expuesto en el dispatcher (línea 723) y definido en líneas 13244–13420. No se encontró integración de esta función como guard obligatorio de las demás operaciones de lectura/escritura; su disponibilidad como acción independiente no protege por sí misma los endpoints de negocio.

La función recibe userId y role desde el payload, en vez de derivarlos internamente de claims verificados. Considera que Administrador, Director, Secretaría y Coordinador tienen acceso completo sin resolver ámbitos particulares. Para Docente/Profesor, si no se envía asignaturaId, grado o sección, retorna autorizado; si no existe la hoja de asignaciones docentes, establece docenteAsignado=true. No valida vigencia temporal de la asignación docente.

El resultado de esta función no es un mecanismo de autorización contextual transversal ni satisface CA-AD-108.

### 3.6 ui-common.js — filtrado frontend

En líneas 5790–5810, filterDataByScope devuelve [] si no existen allowedValues, pero para cada registro devuelve true cuando el atributo de ámbito no existe o es falsy. Por ello, los registros sin el campo que debía restringirlos atraviesan el filtro.

validateUserScopeContext (líneas 5812–5820) compara contra userScopeConfig entregado al cliente. Es una ayuda de interfaz, no una fuente autoritativa: el navegador puede manipular su almacenamiento y los argumentos. La decisión final debe repetirse en backend sobre la identidad verificada y el registro consultado/modificado.

### 3.7 api.js y pruebas

api.js, líneas 45–59, agrega requesterUserId y requesterRole desde currentUser, pero no propaga sessionToken, authToken ni token. La propagación de credenciales ya está cubierta por TASK-636; se amplía como dependencia para las consultas de ámbitos, sin crear otro ID.

tests/regression/modular-dashboard-suite.js, líneas 1–61, verifica existencia de archivos y presencia de cadenas. No prueba aislamiento por ámbito, fechas, múltiples roles, filtros con atributos ausentes, llamadas directas a endpoints, ni rechazo de lecturas/escrituras fuera del ámbito. No se ejecutó la suite.

## 4. Hallazgos

### AUD-NG-312 — El enforcement de ámbito no es obligatorio ni fail-closed en las operaciones backend
- **Severidad/Prioridad:** CRÍTICO/P0.
- **Criterios:** CA-AD-108 y requisito funcional 3.
- **Evidencia:** USER Code.gs:1213–1251 y 1253–1290; ACADEMIC Code.gs:465–522; ACADEMIC dispatcher: validateRolePermission y acción validateAcademicResponsibilityAndScopeAccess.
- **Descripción:** USER no aplica ámbitos a los roles institucionales fuera de estudiantes/tutores. ACADEMIC condiciona la comprobación a dos campos opcionales enviados por el cliente y absorbe fallos de consulta. La ausencia de hoja/asignación o de parámetros no provoca rechazo. El validador académico independiente no es invocado como guard transversal y confía en userId/role del payload.
- **Impacto:** una petición directa a un endpoint que no incluya los campos esperados puede acceder a datos fuera del ámbito configurado; una indisponibilidad de la fuente de ámbitos puede convertirse en autorización implícita.
- **Estado:** confirmado en código; no se ejecutaron ataques runtime.

### AUD-NG-313 — Las asignaciones de ámbito colisionan entre roles y tienen un esquema inconsistente
- **Severidad/Prioridad:** CRÍTICO/P0.
- **Criterios:** CA-AD-107 y CA-AD-108.
- **Evidencia:** USER Code.gs:9116–9181.
- **Descripción:** la cabecera declara ocho columnas y la inserción escribe doce. La clave de actualización es userId+scopeType, omitiendo roleId/responsabilidad. La actualización solo persiste ScopeValues y Estado, dejando sin actualizar rol, fechas y suplencia.
- **Impacto:** dos responsabilidades del mismo usuario pueden sobrescribirse; la información de vigencia puede perderse o quedar desalineada; el backend no puede reconstruir de forma fiable el ámbito efectivo de cada rol.
- **Estado:** confirmado en código.

### AUD-NG-314 — La resolución de ámbitos ignora rol, vigencia y relaciones jerárquicas
- **Severidad/Prioridad:** ALTO/P1.
- **Criterios:** CA-AD-107 y CA-AD-108.
- **Evidencia:** USER Code.gs:9183–9252; ACADEMIC Code.gs:465–522 y 13244–13420.
- **Descripción:** getUserScopeConfig solo consulta userId+estado activo; no filtra fechas ni responsabilidad. validateRoleScopeAccess selecciona el primer registro por scopeType y prioriza userId de payload sobre la identidad verificada. No se valida que departamento, carrera, asignatura, grado, sección o período pertenezcan a una jerarquía/relación institucional válida. El validador académico docente omite vigencia y admite ausencia de hoja como autorización.
- **Impacto:** asignaciones vencidas/futuras o de otra responsabilidad pueden afectar el acceso; los valores no relacionados pueden interpretarse como válidos; el resultado puede ser inconsistente entre roles del mismo usuario.
- **Estado:** confirmado en código.

### AUD-NG-315 — El filtro frontend permite registros sin atributo de ámbito
- **Severidad/Prioridad:** ALTO/P1.
- **Criterios:** CA-AD-107.
- **Evidencia:** ui-common.js:5790–5820.
- **Descripción:** filterDataByScope devuelve true cuando el atributo esperado no está presente. validateUserScopeContext utiliza una configuración suministrada al cliente y no constituye enforcement de seguridad.
- **Impacto:** un listado puede incluir registros no clasificables por el ámbito esperado; el usuario puede manipular el estado local y el backend no debe confiar en el resultado del filtro.
- **Estado:** confirmado en código.

## 5. Matriz de aceptación

| Criterio | Dictamen | Justificación |
|---|---|---|
| CA-AD-107 | **NO CUMPLE** | El filtro frontend admite registros sin atributo de ámbito; la resolución backend no aplica vigencia/rol/jerarquía y no está conectada transversalmente a consultas y búsquedas. |
| CA-AD-108 | **NO CUMPLE** | USER no aplica ámbitos a los roles generales; ACADEMIC permite omitir parámetros de ámbito y absorbe errores; no se garantiza rechazo de lecturas y mutaciones fuera del ámbito. |

## 6. Tareas ejecutables derivadas de los hallazgos de la auditoría

Se contrastaron los IDs de tareas de Pendientes.md actual e histórico y los informes de auditoría previos. No se identificó TASK-666, TASK-667, TASK-668 ni TASK-669 en los registros consultados. Se crean esos IDs en este informe. Las tareas existentes se amplían cuando su alcance ya cubre la causa; no se duplican.

### Tareas nuevas

#### TASK-666 — Aplicar enforcement contextual fail-closed a todas las operaciones backend
- **Hallazgo:** AUD-NG-312.
- **Severidad/Prioridad:** CRÍTICO/P0.
- **Objetivo:** garantizar que cada lectura, búsqueda, listado y mutación valide el ámbito contra identidad y rol derivados de credenciales verificadas.
- **Archivos/componentes:** backend/user-service/Code.gs; backend/academic-service/Code.gs; servicios que consultan o modifican recursos académicos.
- **Dependencias:** TASK-501, TASK-636 y TASK-663.
- **Alcance:** definir políticas de ámbito por acción/recurso; resolver identidad desde claims; mapear grado, sección, asignatura, departamento, carrera, nivel y período a la asignación; validar antes de leer o escribir; denegar ante ausencia de asignación, parámetro requerido, hoja, dato, catálogo o error de consulta; impedir que el cliente elija qué control se ejecuta omitiendo scopeType/requestedValue.
- **Criterios de aceptación:** llamadas directas sin contexto requerido son rechazadas; registros fuera del ámbito no aparecen en listas/búsquedas ni pueden leerse o modificarse; errores de fuente de autorización producen denegación; el rol del payload no sustituye el claim verificado; las pruebas cubren lecturas y mutaciones.

#### TASK-667 — Normalizar el esquema y la clave de las asignaciones de ámbito
- **Hallazgo:** AUD-NG-313.
- **Severidad/Prioridad:** CRÍTICO/P0.
- **Objetivo:** persistir cada ámbito de forma independiente por usuario, rol y responsabilidad.
- **Archivos/componentes:** backend/user-service/Code.gs; esquema de AsignacionesAmbitosRoles; migración y validadores.
- **Dependencias:** TASK-663 y TASK-664.
- **Alcance:** definir encabezados completos y estables; migrar las filas existentes sin pérdida; normalizar roleId, responsibilityId, scopeType, scopeValues, estado, fechas y suplencias; usar clave compuesta que no colapse roles/responsabilidades; actualizar todos los campos en operaciones de edición; validar tipos/valores; proteger escrituras concurrentes y verificar persistencia antes de devolver success.
- **Criterios de aceptación:** dos roles del mismo usuario pueden tener el mismo scopeType con valores distintos; actualizar uno no modifica el otro; todas las columnas tienen encabezado y se recuperan sin desplazamiento; fechas y suplencias sobreviven a actualización; escrituras incompletas o inválidas no devuelven éxito.

#### TASK-668 — Resolver jerarquías y vigencia temporal de ámbitos
- **Hallazgo:** AUD-NG-314.
- **Severidad/Prioridad:** ALTO/P1.
- **Objetivo:** validar que cada valor asignado exista, esté activo y sea coherente con sus entidades padre y con el período de vigencia.
- **Archivos/componentes:** backend/user-service/Code.gs; backend/academic-service/Code.gs; catálogos académicos e institucionales.
- **Dependencias:** TASK-661, TASK-662, TASK-663 y TASK-667.
- **Alcance:** enumerar tipos de ámbito permitidos; validar referencias a nivel, departamento, carrera, asignatura, grado, sección y período; comprobar relaciones padre-hijo; aplicar fechaInicio/fechaFin y estados; definir resolución de varias asignaciones y conflictos de roles sin usar el primer registro arbitrario.
- **Criterios de aceptación:** no se aceptan valores inexistentes/inactivos ni relaciones incompatibles; asignaciones futuras/vencidas no conceden acceso; el resultado para múltiples responsabilidades es determinista y auditable; no hay inferencia de ámbito por ausencia de datos.

#### TASK-669 — Corregir filtros frontend para fallar cerrados y reflejar ámbitos efectivos
- **Hallazgo:** AUD-NG-315.
- **Severidad/Prioridad:** ALTO/P1.
- **Objetivo:** evitar que listados o filtros presenten registros sin clasificación válida o dependan de configuración manipulable del navegador.
- **Archivos/componentes:** js/ui-common.js; pantallas de listados, filtros, búsquedas y dashboards.
- **Dependencias:** TASK-636, TASK-666 y TASK-668.
- **Alcance:** hacer que un atributo ausente/desconocido no pase el filtro; normalizar identificadores; obtener la configuración desde endpoint autenticado; no usar localStorage como fuente de permisos; mantener la validación backend como autoridad y presentar estados de error sin fallback permisivo.
- **Criterios de aceptación:** registros sin el atributo requerido quedan excluidos; alterar currentUser o userScopeConfig no amplía resultados; filtros por cada tipo de ámbito coinciden con la autorización backend; errores de carga no muestran datos sin filtrar.

### Tareas existentes ampliadas, sin duplicar

- **TASK-501:** ampliar la matriz RBAC para que módulo, acción, responsabilidad y ámbito se evalúen en cada endpoint; la autorización por rol+acción no es suficiente.
- **TASK-636:** incluir propagación de token de sesión en las llamadas a USER/ACADEMIC relacionadas con asignaciones y consultas de ámbito; derivar identidad y rol de claims.
- **TASK-663:** incorporar la relación persistente usuario-rol-responsabilidad-ámbito con clave independiente por asignación, evitando colisiones entre roles.
- **TASK-664:** registrar actor verificado, estado anterior/nuevo, roleId, responsibilityId, tipo/valores de ámbito, fechas y motivo en cada asignación, actualización, revocación y expiración.
- **TASK-665:** ampliar las pruebas para incluir aislamiento por ámbito, vigencia, jerarquía, múltiples roles, campos ausentes, errores de lectura, acceso directo y mutaciones dentro/fuera de alcance.

No se crea una tarea adicional de pruebas porque TASK-665 ya cubre la regresión funcional de catálogo y relaciones; se amplía expresamente para cubrir estos escenarios.

## 7. Pruebas y límites

- **Inspección manual realizada:** completadas.md; blob actual e histórico de Pendientes.md; USER Code.gs:1213–1290, 1351–1415, 9116–9252 y dispatcher 1550–1580; ACADEMIC Code.gs:240–262, 465–565, dispatcher 700–735 y 13244–13420; ui-common.js:5790–5820 y carga de dashboard; api.js:45–59; suite modular-dashboard-suite.js:1–61; informes previos y mapa de dependencias.
- **Pruebas ejecutadas:** lectura de blobs, verificación de SHAs, tamaños, líneas y caracteres de reemplazo; inspección manual de funciones, contratos, dispatcher, filtros y relaciones; comprobación de ausencia del informe individual; revisión de árbol Git, historial de Pendientes.md y comparación de ramas.
- **No ejecutadas:** Node, Apps Script runtime, HTTP, navegador/DOM, llamadas directas a endpoints, pruebas multiusuario/multirrol, pruebas de expiración, escrituras en Sheets productivos, pruebas de IDOR ni E2E.
- **Limitaciones:** no hay acceso al despliegue Apps Script ni a datos reales de Sheets; no se certifican asignaciones productivas ni configuraciones externas. Los hallazgos son defectos verificables en el código versionado.
- **Código fuente:** sin modificaciones.
- **Pendientes.md y completadas.md:** sin modificaciones; se conserva el estado histórico [X] de F8-Task09.
- **Rama base:** sin modificaciones.

## 8. Continuidad

- **Última tarea auditada:** F8-Task09 / TAREA-AD-03.
- **Checkpoint inicial:** C1.268.
- **Checkpoint de cierre:** C1.269.
- **Siguiente tarea exacta:** F8-Task10 — dashboard de coordinador académico como implementación de referencia.
- **Próxima acción:** comprobar si existe AUDITORIAS/AUDITORIA_COMPLETADAS_F8-TASK10.md; si falta, auditar directamente dashboard-coordinacion.html, js/secretary.js, js/teacher.js y backend/academic-service/Code.gs. Verificar adaptación a responsabilidades/ámbitos configurados, coordinadores por nivel/departamento/carrera, supervisión y aprobaciones con trazabilidad.
- **Commit de cierre:** se confirmará consultando HEAD de la rama después de publicar el commit único que contiene este informe y el checkpoint.
