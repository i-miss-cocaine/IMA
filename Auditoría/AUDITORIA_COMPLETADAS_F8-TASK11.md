# Auditoría F8-Task11 / TAREA-AD-05 — Integración de dashboards dinámicos con módulos y servicios

- **Fecha:** 2026-11-08.
- **ID de sesión operativo:** IMA-AUDIT-20261108-2226Z-01 (identificador documental; no es ID nativo de ChatGPT).
- **Checkpoint inicial:** C1.270.
- **Checkpoint de cierre:** C1.271.
- **Repositorio:** i-miss-cocaine/IMA.
- **Rama de trabajo:** NG_beta_0.0.0.1_work.
- **HEAD de partida verificado:** 2cb78e71ec1f1f4281e4402bf28abfcfb288cbc7; árbol Git e36c564325b147c2ad00af0fe0de1ae719213c05.
- **Rama base protegida:** NG_beta_0.0.1 @ 44d9891132332e692dbe2ba8602b41f50a508a59; comparación: 339 commits adelante, 0 detrás.
- **Tarea auditada:** F8-Task11 / TAREA-AD-05, marcada [X] en completadas.md, líneas 5021–5042.
- **Informe individual previo:** no existe AUDITORIAS/AUDITORIA_COMPLETADAS_F8-TASK11.md en el árbol de la rama; se ejecutó la auditoría directamente.
- **Dictamen global:** **NO CUMPLE**.
- **CA-AD-112:** NO CUMPLE. Las funciones backend existen en su mayoría, pero los contratos declarados no se ejecutan desde el dashboard ni se convierten en adaptadores funcionales.
- **CA-AD-113:** NO CUMPLE. No existe aislamiento de carga por módulo; el fallback de fetchApi convierte fallos de consultas en respuestas exitosas vacías y la carga inicial depende de una única consulta global.

## 1. Objetivo y criterios de aceptación

Verificar que los dashboards dinámicos reutilicen las operaciones existentes de USER, ACADEMIC, TASK, EXAM y ACCOUNTING mediante adaptadores/contratos estables, sin duplicar fuentes de datos; que cada módulo pueda fallar sin bloquear los demás; y que los errores de integración se registren con contexto técnico.

- **CA-AD-112:** módulos dinámicos reutilizan operaciones backend existentes sin fuentes de datos duplicadas.
- **CA-AD-113:** errores en módulos individuales quedan aislados sin impedir navegación en otros componentes.

## 2. Fuentes, continuidad e integridad documental

| Fuente | SHA | Inspección |
|---|---|---|
| completadas.md | f57f1aef832e81e44fc4f7ec36a852d50e464676 | F8-Task11 [X], líneas 5021–5042 |
| Pendientes.md actual | 676a3f798715f0cdd7d4bc75768472545b8465ee | blob actual recuperado directamente; lectura convencional 0 caracteres |
| js/api.js | 6b24f666db30a811a8e9b38d466fc6001cf6dfa9 | fetchApi, fallback, health checks y logging |
| js/config.js | 49ef90807e5b9dfe1379f76d66efdb4ccd2b6cdc | catálogos, endpoints, registro de servicios y contratos |
| js/ui-common.js | 986938b8a311a41ed4cb3d135b66b6aaea4bed67 | loadDynamicDashboard y renderizado |
| app/html/dashboards/dynamic-dashboard.html | 765a45e5666c24c430e841cb70c3d71d03cf9074 | dependencias cargadas y estructura de módulos |
| backend/user-service/Code.gs | 12079dd410aa6d8afbce55a4bc62a79dea605f9f | autenticación, dispatcher y getUserDynamicDashboardConfig |
| backend/academic-service/Code.gs | df87a2eea9f0ef79d0b966d03fd5bbe432003df5 | dispatcher y operaciones ACADEMIC |
| backend/task-service/Code.gs | 1437756a3c3d3d97e06bc1ff21c8e2ca2b2dccbe | dispatcher y operaciones TASK |
| backend/exam-service/Code.gs | 1d93296628fae31f680004f637897e2b1314a64c | dispatcher y operaciones EXAM |
| backend/accounting-service/Code.gs | 38b979d41596b85e888b4a7060b37bbac0840a28 | dispatcher y operaciones ACCOUNTING |
| backend/developer-service/Code.gs | 8aa4bac67cfe5c8c54da51a0784a56fef633e412 | suite REG-01..05 y catálogo de contratos |
| tests/regression/modular-dashboard-suite.js | 0495e1d526a872c33310935a003a83d924d34683 | pruebas estáticas de estructura/configuración |
| AUDITORIAS/Auditoria.txt | ab30ff9b5ab8a5be2dcf81f10984b36eed766c4b | reconciliación de hallazgos previos; máximo AUD-NG-319 |
| AUDITORIAS/MapaDependencias.md | 43ca2f9950c88951c5069ea935f04c193cdc7ee1 | dependencias F8-Task07..10 |
| AUDITORIAS/AUDITORIA_COMPLETADAS_PLAN.md | 485a78d14a78e6dd606ba45e6d64763f99e0664f | continuidad hasta F8-Task10 |
| AUDITORIAS/Contexto_personal.txt | aa6f63b8726dfd01485554e0a497450771823ea7 | reglas prioritarias y C1.270 |
| METODOLOGIA_DESARROLLO.md | cf796728bb384a32537392df2f9c72a339fa03ee | proceso de auditoría y tareas derivadas |

### Recuperación e inventario de Pendientes.md

La lectura ordinaria de Pendientes.md devolvió 0 caracteres. Se verificó el árbol del HEAD actual y se recuperó el blob de la misma rama mediante Git:

- **HEAD consultado:** 2cb78e71ec1f1f4281e4402bf28abfcfb288cbc7; árbol e36c564325b147c2ad00af0fe0de1ae719213c05.
- **Commit histórico alcanzable de la rama que contiene el mismo blob:** a9de4074fcc83241516633526201e288509265b5.
- **Blob actual e histórico:** 676a3f798715f0cdd7d4bc75768472545b8465ee.
- **Tamaño:** 1.807.629 bytes (Git).
- **Contenido:** 1.786.011 caracteres; 20.224 líneas; 0 caracteres U+FFFD.
- **Inventario:** 515 identificadores TASK-NNN únicos; máximo TASK-636. El blob contiene 801 apariciones de IDs TASK y 523 encabezados que coinciden con el patrón amplio de tarea; no se toma ese conteo de encabezados como total de tareas distintas. El conteo de estados completados/pendientes no se declara porque el formato de estados no es uniforme y no puede inferirse con fiabilidad mediante una única expresión.
- **F8-Task11** no aparece en Pendientes.md porque está en completadas.md. TASK-670, creado en el informe F8-Task10, tampoco aparece en el blob; se conserva su trazabilidad en los informes de auditoría.
- **Decisión:** no restaurar ni modificar Pendientes.md. La fuente actual íntegra tiene prioridad y la metodología vigente conserva las tareas derivadas en los informes de auditoría.

## 3. Evidencia técnica

### 3.1 js/api.js — fetchApi no propaga la credencial de sesión

**Líneas 11–24, 39–60**
- fetchApi resuelve el endpoint desde SERVICE_URLS.
- Lee currentUser desde localStorage/sessionStorage y añade requesterUserId y requesterRole al payload.
- No extrae ni envía sessionToken, authToken o token. El body contiene únicamente action y payload; el header es Content-Type: text/plain.
- requesterUserId/requesterRole son datos del cliente y no sustituyen una credencial firmada.

**Contraste backend USER**
- PUBLIC_ACTIONS, líneas 922 aprox., no incluye getUserDynamicDashboardConfig.
- getUserVerifiedRole, líneas 1145–1158, exige sessionToken/authToken/token y devuelve NO_ACCESS si falta.
- validateRolePermission, líneas 1253–1295, deniega cuando getUserVerifiedRole devuelve NO_ACCESS.
- doPost enruta getUserDynamicDashboardConfig en la línea 1553 aprox.; el dispatcher no elimina la validación anterior.
- loadDynamicDashboard llama precisamente fetchApi('USER','getUserDynamicDashboardConfig',{userId:user.userId}) sin añadir token.

**Conclusión:** el flujo frontend/backend inspeccionado no proporciona al endpoint la credencial que el propio backend requiere. La carga del dashboard no puede considerarse integrada funcionalmente. Además, getUserDynamicDashboardConfig toma userId del payload y lo usa para consultar la hoja Usuarios sin demostrar dentro del handler que coincide con _verifiedUserId. Esta segunda brecha amplía TASK-636 y TASK-501/TASK-666; no se crea una tarea de autorización duplicada.

### 3.2 js/ui-common.js y dynamic-dashboard.html — tarjetas sin adaptador ejecutable

**dynamic-dashboard.html, líneas 42–58**
- Carga config.js, persistence.js, api.js y ui-common.js.
- Invoca window.loadDynamicDashboard al DOMContentLoaded.
- No carga un adaptador específico de módulos ni un ejecutor de contratos.

**ui-common.js, líneas 5818–5871**
- loadDynamicDashboard lee currentUser de almacenamiento local.
- Ejecuta una sola consulta de configuración USER.
- Usa res.modulosAutorizados para generar tarjetas HTML genéricas.
- La tarjeta solo muestra el nombre, «Estado: Activo» y un span «Acceder».
- El span no tiene href, listener, botón ni acción asociada.
- No consulta DYNAMIC_DASHBOARD_MODULE_CONTRACTS, no llama readAction/writeAction, no comprueba requiredCapabilities y no resuelve targetService.
- No existe en este controlador un executor ni una carga independiente por módulo.
- Si la consulta global falla, el dashboard muestra un error global. Si recibe módulos vacíos, muestra que no hay módulos asignados.

### 3.3 js/config.js — contratos incompletos y no consumidos

**Líneas 13–27:** MODULES_CATALOG declara 13 módulos.  
**Líneas 747–803:** DYNAMIC_DASHBOARD_MODULE_CONTRACTS declara solo 6 contratos.

Los módulos declarados en MODULES_CATALOG que no tienen contrato son, entre otros, mod_supervision_silabos, mod_horarios_area, mod_asistencia_docente, mod_expedientes_estudiantiles, mod_mis_horarios, mod_finanzas y mod_auditoria_sistema. El backend getUserDynamicDashboardConfig también devuelve IDs adicionales por rol (por ejemplo mod_resumen_institucional, mod_reportes, mod_matriculas y mod_mis_tareas_entregas) que no tienen contrato en el catálogo de seis entradas.

**Validación de operaciones del contrato contra dispatchers actuales:**

| Módulo | Servicio/acción | Resultado |
|---|---|---|
| mod_gestion_usuarios | USER/getStudents | Existe en dispatcher y función |
| mod_gestion_usuarios | USER/updateUserProfile | Existe en dispatcher y función |
| mod_planificacion_horarios | ACADEMIC/getClassSchedules | Existe en dispatcher y función |
| mod_planificacion_horarios | ACADEMIC/createClassSchedule | Existe en dispatcher y función |
| mod_coordinacion_academica | ACADEMIC/getCoordinatorOverview | Existe en dispatcher y función |
| mod_coordinacion_academica | ACADEMIC/assignTeacherToSection | Existe en dispatcher y función |
| mod_mis_clases | ACADEMIC/getTeacherAssignments | Existe en dispatcher y función |
| mod_mis_clases | ACADEMIC/assignTeacherToClass | Existe en dispatcher y función |
| mod_aula_virtual_tareas | TASK/getStudentTasks | Existe en dispatcher y función |
| mod_aula_virtual_tareas | TASK/submitAssignment | Existe en dispatcher y función |
| mod_libro_calificaciones | EXAM/getStudentExams | Existe en dispatcher y función |
| mod_libro_calificaciones | EXAM/gradeSubmission | **No existe** en dispatcher ni función EXAM; gradeSubmission está en TASK |

La mayoría de las operaciones nombradas existen, pero el contrato no las ejecuta y al menos una apunta al servicio equivocado. No se acredita validación automática de contratos, parámetros, permisos ni compatibilidad.

### 3.4 USER — configuración de dashboard calculada por rol fijo, no por contratos

**getUserDynamicDashboardConfig, líneas 9254–9300**
- Recibe userId desde payload y consulta la hoja Usuarios para obtener el rol.
- Construye modulosMap como un mapa hardcodeado por rol.
- Devuelve modulosAutorizados y configuración visual.
- No consume DYNAMIC_DASHBOARD_MODULE_CONTRACTS ni el registro de módulos del frontend.
- No devuelve operaciones, parámetros, servicio, capacidades ni resultado de validación de contrato.
- El catálogo de responsabilidades/asignaciones no se transforma aquí en una lista de módulos con operaciones ejecutables.

Esto se relaciona con AUD-NG-307/308/309 y las tareas TASK-661/662/663; se amplía la evidencia, sin duplicar esas tareas.

### 3.5 js/api.js — errores de transporte convertidos en éxito aparente

**Líneas 86–140:** fetchApi parsea respuesta y devuelve parsed; el error de autorización es registrado en console y puede generar un toast.  
**Líneas 142–198:** el catch reintenta algunos errores de red, muestra un toast y para cualquier acción que comience por get devuelve {status:'success', data:[], isFallback:true}.

Impactos:
- Una falla de servicio puede parecer una consulta válida sin resultados.
- El consumidor debe comprobar isFallback, pero loadDynamicDashboard no lo hace.
- La consulta de configuración puede terminar en estado «sin módulos asignados» en vez de informar que el servicio falló.
- El catch no llama a window.logStructuredEvent ni persiste servicio, acción, módulo, correlación o causa; solo escribe console.
- La opción timeout no se utiliza: el límite se fija en 60 segundos aunque el caller envíe options.timeout.
- El timeout se limpia al recibir respuesta HTTP; no se limpia en todos los caminos de rechazo de red.

### 3.6 No existe aislamiento de fallos por módulo

- El controlador hace una consulta global para obtener configuración y genera todas las tarjetas en una sola operación.
- No existe ejecución de cada módulo con Promise.allSettled o un mecanismo equivalente.
- No existe estado individual loading/ready/error por módulo.
- No existe retry/reintento por módulo ni mecanismo para conservar navegación de módulos sanos cuando otro falla.
- El dashboard solo tiene estados globales de carga, configuración fallida o lista vacía.

Por ello, CA-AD-113 no se cumple.

### 3.7 SERVICE_URLS / SERVICE_REGISTRY — ACCOUNTING sin endpoint verificable y monitoreo incompleto

**config.js, líneas 224–242**
- USER, ACADEMIC, TASK y EXAM contienen URLs de despliegue con identificadores de Apps Script.
- ACCOUNTING contiene literalmente https://script.google.com/macros/s/AKfycbzAccountingSvc/exec, valor con apariencia de marcador/placeholder, no una URL de despliegue verificable desde el repositorio.
- SERVICE_REGISTRY, líneas 245–315, lo declara ACTIVE y mantiene IDs de recursos de ejemplo como 1-ACCOUNTING-SPREADSHEET-ID.
- checkAllMicroservicesHealth, api.js líneas 245–250, solo consulta USER, ACADEMIC, TASK y EXAM; omite ACCOUNTING.
- No se ejecutó ping HTTP ni se tuvo acceso a deployment Apps Script, por lo que no se afirma que el endpoint externo esté caído. Sí se registra que la configuración versionada no acredita una URL real y que el servicio no está incluido en el health check agregado.

### 3.8 Pruebas de regresión — validación estructural, no conductual

**tests/regression/modular-dashboard-suite.js**
- Comprueba existencia de archivos y presencia de cadenas en config.js y developer-service.
- No simula fetchApi, no ejecuta loadDynamicDashboard, no comprueba navegación, ejecución de contratos, autenticación ni aislamiento de errores.
- Una aserción busca ../../MapaDependencias.md en la raíz, pero el árbol actual contiene AUDITORIAS/MapaDependencias.md y no MapaDependencias.md en la raíz. Esa aserción fallaría si se ejecuta el archivo tal como está.

**backend/developer-service/Code.gs, líneas 2040–2100 aprox.**
- REG-01 comprueba que getAuthTokenSecret devuelve un valor; no realiza una petición autenticada.
- REG-02 valida que getCentralCapabilitiesCatalog devuelva un catálogo; no valida los contratos del dashboard.
- REG-03 verifica que un token literal inválido sea rechazado; no prueba matriz, ámbito o módulos.
- REG-04 consulta getServiceHealthDiagnostics; no invoca módulos independientes.
- REG-05 solo comprueba que getCentralConfigAndContractCatalog devuelve contracts; no simula un fallo de módulo ni demuestra aislamiento.
- La suite puede reportar REG-05 PASS aunque no exista ningún adaptador ejecutable ni manejo aislado de fallos.

No se ejecutaron las suites porque no se dispuso de un runtime/checkout local seguro dentro de esta auditoría. Los resultados anteriores son inspección estática del código y del árbol Git, no una ejecución reportada como PASS/FAIL.

## 4. Hallazgos

### AUD-NG-320 — fetchApi no propaga el token exigido por los microservicios
- **Severidad/Prioridad:** ALTO/P1.
- **Criterios:** CA-AD-112; dependencia de seguridad.
- **Evidencia:** js/api.js:39–60; USER Code.gs:922 aprox., 1145–1158, 1253–1295, 1351–1360 y dispatcher 1553; ui-common.js:5833–5835.
- **Descripción:** el cliente agrega requesterUserId/requesterRole pero omite sessionToken/authToken/token. USER no incluye getUserDynamicDashboardConfig en PUBLIC_ACTIONS y getUserVerifiedRole exige un token firmado. La llamada de inicialización no satisface el contrato de autenticación.
- **Impacto:** el dashboard dinámico no puede cargar de forma verificable su configuración con el helper inspeccionado. Además, el handler usa userId del payload sin demostrar que esté vinculado a la identidad verificada.
- **Reconciliación:** amplía TASK-636 (propagación de token e identidad verificada) y TASK-501/TASK-666 (autorización contextual). No se crea una tarea genérica de autenticación duplicada.

### AUD-NG-321 — contratos de módulo declarativos, incompletos y sin executor
- **Severidad/Prioridad:** ALTO/P1.
- **Criterios:** CA-AD-112.
- **Evidencia:** config.js:13–27 y 747–803; dynamic-dashboard.html:42–58; ui-common.js:5818–5871; USER Code.gs:9254–9300; EXAM Code.gs dispatcher 345–400 aprox.; TASK Code.gs dispatcher 368–434 aprox.
- **Descripción:** existen 13 módulos y 6 contratos, pero el loader no consume los contratos ni ejecuta readAction/writeAction. Las tarjetas no son navegables. Los módulos financieros y otros módulos del catálogo/roles no tienen contrato. EXAM/gradeSubmission está mal asignado: la acción está en TASK, no en EXAM.
- **Impacto:** la integración se queda en metadatos y representación visual; no se demuestra reutilización de operaciones desde módulos funcionales.
- **Reconciliación:** amplía TASK-488 (composición dinámica), TASK-662 (integridad de contratos), TASK-663 (relación responsabilidades/módulos) y TASK-670 (dashboard de coordinación).

### AUD-NG-322 — no hay aislamiento por módulo y fetchApi enmascara errores como éxito vacío
- **Severidad/Prioridad:** ALTO/P1.
- **Criterios:** CA-AD-113.
- **Evidencia:** api.js:142–198; ui-common.js:5833–5870; developer-service Code.gs:2040–2100 aprox.
- **Descripción:** no se ejecutan módulos independientemente; la carga depende de una única consulta. Los errores de red de acciones get se convierten en status success con data vacía; el loader no comprueba isFallback. No hay estado, retry ni navegación por módulo. El log se limita a console y no se persiste el contexto técnico.
- **Impacto:** fallos parciales no se pueden distinguir de resultados vacíos; el dashboard puede ocultar degradación y no conservar componentes sanos de manera independiente.
- **Reconciliación:** amplía TASK-665 (regresión funcional), TASK-488 y TASK-670; no duplica las tareas generales de trazabilidad TASK-664.

### AUD-NG-323 — ACCOUNTING no tiene endpoint de despliegue verificable ni health check agregado
- **Severidad/Prioridad:** MEDIO/P2.
- **Criterios:** CA-AD-112/113, disponibilidad del módulo financiero.
- **Evidencia:** config.js:224–242 y 292–301; api.js:245–250.
- **Descripción:** SERVICE_URLS.ACCOUNTING contiene un valor con apariencia de placeholder; SERVICE_REGISTRY lo declara ACTIVE sin evidencia de deployment y checkAllMicroservicesHealth excluye ACCOUNTING.
- **Impacto:** no se acredita que el módulo financiero pueda invocar el servicio configurado ni que su degradación sea detectable desde el health check agregado.
- **Límite:** no se hizo ping externo; el dictamen se limita a la configuración versionada.
- **Reconciliación:** ampliar TASK-662 (validación de configuración/contratos) y TASK-665 (pruebas de salud e integración).

### AUD-NG-324 — suites de regresión certifican presencia de metadatos, no comportamiento de integración
- **Severidad/Prioridad:** ALTO/P1.
- **Criterios:** CA-AD-112 y CA-AD-113.
- **Evidencia:** tests/regression/modular-dashboard-suite.js completo; developer-service Code.gs:2040–2100 aprox.
- **Descripción:** la suite Node verifica archivos/cadenas; REG-05 solo exige que exista el objeto contracts. No comprueba executor, acción real, permisos, navegación, fallo simulado o aislamiento. La aserción de MapaDependencias.md apunta a una ruta raíz inexistente en el árbol actual.
- **Impacto:** una suite puede aprobar el catálogo aunque no haya integración funcional; además, la prueba de ruta indicada fallaría al ejecutarse.
- **Reconciliación:** amplía TASK-665 y TASK-662; no se crea otra tarea genérica de pruebas.

## 5. Matriz de aceptación

| Criterio | Dictamen | Justificación |
|---|---|---|
| CA-AD-112 | **NO CUMPLE** | Contratos no consumidos; no existe executor/adaptador; las tarjetas son inertes; falta cobertura de módulos y hay una acción asignada al servicio incorrecto; el token no se propaga. |
| CA-AD-113 | **NO CUMPLE** | No hay carga aislada por módulo; una consulta global controla el render; fallback de get oculta fallos como éxito vacío; no hay logging técnico persistente ni pruebas conductuales. |

## 6. Tareas ejecutables derivadas de los hallazgos de la auditoría

Se consultaron completadas.md, Pendientes.md recuperado desde el blob actual de la rama, plan de auditoría, mapa y hallazgos previos. El máximo de IDs TASK-NNN del backlog actual es TASK-636. TASK-670 ya fue creado en el informe F8-Task10 y no se duplica. Se crean dos tareas nuevas consecutivas y se amplían las existentes.

### Tareas nuevas

#### TASK-671 — Implementar adaptadores ejecutables y contratos completos para módulos dinámicos
- **Hallazgo de origen:** AUD-NG-321; dependencias AUD-NG-320 y AUD-NG-323.
- **Prioridad:** P1.
- **Objetivo:** conectar cada módulo autorizado con operaciones backend reales y existentes, mediante contratos validados y sin duplicar repositorios ni fuentes de datos.
- **Acción ejecutable:** implementar executor/adaptadores; validar targetService/readAction/writeAction contra dispatchers y permisos del backend; completar el contrato para todos los moduleId que puedan ser asignados; corregir EXAM/gradeSubmission o el servicio responsable; validar parámetros/capacidades; generar navegación/acciones reales; verificar endpoints de despliegue y el registro de servicios antes de declarar ACTIVE.
- **Archivos/módulos afectados:** js/config.js; js/api.js; js/ui-common.js; app/html/dashboards/dynamic-dashboard.html; backend USER/ACADEMIC/TASK/EXAM/ACCOUNTING; pruebas de regresión.
- **Dependencias:** TASK-488, TASK-501, TASK-636, TASK-662, TASK-663 y TASK-670.
- **Criterios de aceptación:** todos los módulos asignables tienen contrato único y válido; cada operación existe en el dispatcher indicado; el executor invoca la operación existente; las tarjetas tienen navegación/acciones funcionales; las capacidades se verifican en backend; ningún módulo crea una fuente de datos paralela; los endpoints se validan antes de habilitar un servicio.
- **Estado:** Pendiente.

#### TASK-672 — Aislar fallos de módulos y registrar errores de integración con contexto
- **Hallazgo de origen:** AUD-NG-322 y AUD-NG-324.
- **Prioridad:** P1.
- **Objetivo:** asegurar que un módulo degradado no impida usar otros módulos y que un error no se presente como una respuesta exitosa vacía.
- **Acción ejecutable:** implementar estados y cargas independientes por módulo; usar ejecución concurrente con aislamiento de resultados (por ejemplo Promise.allSettled o equivalente); distinguir error, vacío, denegación y fallback; evitar que fetchApi convierta indiscriminadamente errores de get en status success; registrar servicio, módulo, acción, código, correlación y causa sin secretos; incorporar health check ACCOUNTING; añadir pruebas conductuales de fallo individual, varios fallos, recuperación, navegación y contrato.
- **Archivos/módulos afectados:** js/api.js; js/ui-common.js; js/config.js; backend/developer-service/Code.gs; tests/regression/modular-dashboard-suite.js y nuevas pruebas de integración.
- **Dependencias:** TASK-488, TASK-665, TASK-662, TASK-664 y TASK-671.
- **Criterios de aceptación:** fallo de un módulo no bloquea los módulos sanos; el estado de error nunca se representa como éxito vacío; errores se registran con contexto técnico y sanitización; health check incluye los cinco servicios de negocio; pruebas demuestran fallos aislados y navegación disponible.
- **Estado:** Pendiente.

### Tareas existentes ampliadas

- **TASK-636:** propagar credencial firmada en fetchApi a USER/ACADEMIC/TASK/EXAM/ACCOUNTING; no confiar en requesterUserId/requesterRole ni userId del payload como identidad; vincular la consulta de configuración a _verifiedUserId.
- **TASK-501 / TASK-666:** aplicar autorización por módulo, acción, capacidad, rol y ámbito en backend; el frontend no concede acceso por catálogo local.
- **TASK-662:** validar integridad referencial de moduleId, targetService, readAction/writeAction, parámetros, permisos, endpoint y versión; rechazar contratos incompletos o acciones inexistentes.
- **TASK-663:** vincular responsabilidades y módulos mediante relaciones persistentes; eliminar listas hardcodeadas por rol cuando haya asignaciones vigentes.
- **TASK-665:** agregar pruebas conductuales de contrato, dispatcher, autenticación, módulo aislado, fallback, navegación, health check y error logging; corregir la ruta de MapaDependencias.md en el test.
- **TASK-488:** hacer que los dashboards consuman adaptadores reales y que cada tarjeta sea navegable/ejecutable.
- **TASK-670:** aplicar el contrato y aislamiento al dashboard de coordinación como caso de referencia; no duplicar su tarea específica.

### Tareas ya cubiertas; no duplicar

- No se crea otra tarea genérica de autenticación/token: TASK-636.
- No se crea otra tarea genérica de RBAC/ABAC: TASK-501/TASK-666.
- No se crea otra tarea de catálogo/esquema de contratos: TASK-662/TASK-663.
- No se crea otra tarea de auditoría de eventos: TASK-664.
- No se crea otra tarea general de pruebas: TASK-665.
- TASK-670 se conserva como integración específica del dashboard de coordinación.

## 7. Pruebas y límites

- **Inspección manual realizada:** completadas.md:5021–5042; Pendientes.md blob actual; api.js completo; config.js completo; ui-common.js:5818–5871; dynamic-dashboard.html completo; USER dispatcher/auth/getUserDynamicDashboardConfig; ACADEMIC/TASK/EXAM/ACCOUNTING dispatchers y funciones; developer-service suite REG-01..05; tests/regression suite; plan, mapa, auditoría y contexto.
- **Validaciones estáticas realizadas:** inventario de 13 moduleId en MODULES_CATALOG frente a 6 contratos; comparación de las acciones declaradas con dispatchers/funciones; búsqueda de consumidores del objeto DYNAMIC_DASHBOARD_MODULE_CONTRACTS; verificación de ausencia del executor en el loader; comprobación de rutas de archivos de prueba; recuperación y validación del blob Pendientes.md.
- **No ejecutadas:** Node, suite de regresión, Apps Script runtime, HTTP/ping, navegador/DOM, pruebas con tokens/cuentas reales, despliegues Apps Script, hojas productivas ni E2E.
- **Límites:** no se puede confirmar el estado externo del deployment ACCOUNTING ni de las hojas; el análisis de endpoint se limita al valor versionado.
- **Código fuente:** sin modificaciones.
- **Registros maestros:** completadas.md y Pendientes.md sin modificaciones.
- **Rama base:** sin modificaciones.

## 8. Continuidad

- **Última tarea auditada:** F8-Task11 / TAREA-AD-05.
- **Checkpoint inicial:** C1.270.
- **Checkpoint de cierre:** C1.271.
- **Siguiente tarea exacta:** F8-Task12 — crear una interfaz administrativa para configurar los dashboards y las responsabilidades.
- **Próxima acción:** verificar si existe AUDITORIAS/AUDITORIA_COMPLETADAS_F8-TASK12.md; si falta, auditar dashboard-direccion.html, dashboard-secretaria.html, js/secretary.js y backend/user-service/Code.gs contra CA-AD-116/117. Verificar CRUD de roles/responsabilidades/ámbitos, vista previa sin permisos reales, validación server-side antes de activar, conservación histórica y recuperación de configuración válida.
- **Commit de cierre:** se confirmará consultando HEAD después de publicar el único commit que contiene este informe y el checkpoint.
