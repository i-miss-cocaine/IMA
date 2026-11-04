# REGISTRO MAESTRO DE TAREAS PENDIENTES DE AUDITORÍA Y CORRECCIÓN
**Repositorio:** i-miss-cocaine/IMA
**Rama de trabajo:** NG_beta
**Fecha de incorporación:** 2026-11-04
**Origen:** Auditoría inicial de `completadas.md`, contraste manual con código y revisión de trazabilidad.

> Las tareas siguientes se derivan de hallazgos registrados en `Auditoria.txt`. Su inclusión no significa que la corrección haya sido implementada. Los riesgos que requieren pruebas de despliegue se mantienen como pendientes de verificación.

## Tareas Pendientes

### [AUD-NG-001] Restablecer el flujo íntegro de credenciales de sesión entre login, almacenamiento local y microservicios
- **Origen del Hallazgo:** `Auditoria.txt` — AUD-NG-001.
- **Severidad/Clasificación:** Crítico.
- **Archivos Involucrados:** `backend/user-service/Code.gs`, `js/auth.js`, `js/api.js`, `backend/task-service/Code.gs`, `backend/exam-service/Code.gs` y validadores equivalentes en los demás servicios.
- **Dependencias Expuestas:** `loginUser`, `generateSessionToken`, `currentUser`, `fetchApi`, `verifySessionToken`, `validateRolePermission`.
- **Descripción del Alcance:** Trazar el token emitido por el backend desde la respuesta de login hasta su almacenamiento seguro y transmisión en cada solicitud protegida. No usar `requesterUserId` ni `requesterRole` como prueba de identidad. Definir una única propiedad/cabecera de credencial, evitar duplicar tokens en objetos de perfil innecesarios y asegurar que logout, expiración y cambio de cuenta eliminen la credencial correspondiente. Confirmar la compatibilidad de los cinco servicios y de las operaciones interservicio.
- **Criterios de Aceptación:**
  1. El login válido entrega una credencial verificable y el frontend la conserva conforme a la política de sesión.
  2. `fetchApi` transmite la credencial a cada endpoint protegido sin confiar en el rol enviado por el navegador.
  3. Una llamada directa sin token o con token alterado es rechazada.
  4. Las llamadas autorizadas siguen funcionando con el rol y alcance correctos.
  5. Logout y cambio de usuario invalidan/eliminan la credencial anterior.
  6. Existen pruebas de integración para USER, ACADEMIC, ACCOUNTING, TASK y EXAM.
- **Estado:** [ ] Pendiente | [ ] En Ejecución | [ ] Completada

### [AUD-NG-002] Eliminar bypasses de autenticación en acciones públicas y aplicar aislamiento de datos por actor
- **Origen del Hallazgo:** `Auditoria.txt` — AUD-NG-002.
- **Severidad/Clasificación:** Crítico.
- **Archivos Involucrados:** `backend/task-service/Code.gs`, `backend/exam-service/Code.gs`, `backend/user-service/Code.gs`, `backend/academic-service/Code.gs`, `backend/accounting-service/Code.gs`.
- **Dependencias Expuestas:** `PUBLIC_ACTIONS`, `ROLE_PERMISSIONS`, `validateRolePermission`, `doPost`, `getStudentTasks`, `getAllTasks`, `getAllStudentProjects`, `getDriveStorageQuotaMetricsReport`, `getStudentExams`, `getAllExams`.
- **Descripción del Alcance:** Revisar individualmente todas las acciones incluidas en listas públicas. Retirar de acceso anónimo cualquier acción que entregue datos personales, académicos, documentos, proyectos, métricas internas o información institucional. Para las lecturas que deban ser públicas, limitar expresamente los campos y datos expuestos. Obtener la identidad del token verificado y aplicar filtros de propiedad, curso, grado, sección, departamento y relación familiar en el servidor; ignorar identificadores y filtros de alcance no verificados enviados por el cliente.
- **Criterios de Aceptación:**
  1. Toda acción privada rechaza solicitudes sin sesión válida.
  2. Un estudiante no puede consultar tareas, entregas, proyectos ni exámenes de otro estudiante manipulando `userId`, `grado` o `seccion`.
  3. Un docente solo consulta los cursos y grupos que tiene asignados.
  4. Las acciones de listado global y métricas administrativas requieren rol y permiso explícitos.
  5. Cada acción pública restante tiene justificación documentada, campos permitidos y prueba de no exposición.
  6. Las pruebas directas contra `doPost` cubren acceso anónimo, IDOR, cambio de rol y acceso entre departamentos.
- **Estado:** [ ] Pendiente | [ ] En Ejecución | [ ] Completada

### [AUD-NG-003] Exigir claims temporales válidos y expiración obligatoria en todos los tokens de sesión
- **Origen del Hallazgo:** `Auditoria.txt` — AUD-NG-003.
- **Severidad/Clasificación:** Crítico.
- **Archivos Involucrados:** `backend/user-service/Code.gs`, `backend/academic-service/Code.gs`, `backend/accounting-service/Code.gs`, `backend/task-service/Code.gs`, `backend/exam-service/Code.gs`.
- **Dependencias Expuestas:** `generateSessionToken`, `verifySessionToken`, relojes del servidor y política de sesiones.
- **Descripción del Alcance:** Definir el contrato obligatorio de claims de sesión (incluyendo identificador de usuario, rol derivado del servidor, fecha de emisión y expiración numérica). Rechazar tokens sin expiración, con expiración no numérica, ya vencidos o con claims obligatorios ausentes. Aplicar tolerancia de reloj explícita y consistente entre servicios.
- **Criterios de Aceptación:**
  1. Un token sin `exp` es rechazado.
  2. Un token con `exp` malformado o no numérico es rechazado.
  3. Un token expirado es rechazado en todos los servicios.
  4. Un token válido dentro de su vigencia se acepta solo para el usuario y rol autenticados.
  5. Pruebas unitarias y de integración cubren límites temporales y reloj.
- **Estado:** [ ] Pendiente | [ ] En Ejecución | [ ] Completada

### [AUD-NG-004] Sustituir la derivación predecible del secreto HMAC por gestión de secretos aleatorios y rotables
- **Origen del Hallazgo:** `Auditoria.txt` — AUD-NG-004.
- **Severidad/Clasificación:** Crítico.
- **Archivos Involucrados:** `backend/user-service/Code.gs`, `backend/academic-service/Code.gs`, `backend/accounting-service/Code.gs`, `backend/task-service/Code.gs`, `backend/exam-service/Code.gs`.
- **Dependencias Expuestas:** `AUTH_TOKEN_SECRET`, Script Properties, `SPREADSHEET_ID`, `computeHmacSignature`, `generateSessionToken`, `verifySessionToken`.
- **Descripción del Alcance:** Eliminar la derivación del secreto a partir de `SPREADSHEET_ID` y una cadena fija. La ausencia de `AUTH_TOKEN_SECRET` debe provocar un fallo de configuración seguro, no generar una credencial predecible. Definir generación criptográficamente segura, instalación en todos los servicios, rotación, versión de clave, transición de tokens y procedimiento de recuperación.
- **Criterios de Aceptación:**
  1. Ningún servicio deriva secretos de IDs de recursos o cadenas constantes.
  2. La falta de secreto configurado impide emitir y validar tokens y genera un error operativo controlado.
  3. Todos los servicios utilizan la política y versión de secreto aprobadas.
  4. Existe procedimiento probado de rotación sin aceptar tokens falsificados ni mantener claves antiguas indefinidamente.
  5. No se registran secretos ni tokens completos en logs.
- **Estado:** [ ] Pendiente | [ ] En Ejecución | [ ] Completada

### [AUD-NG-005] Garantizar revocación coherente de sesiones y cuentas en todos los microservicios
- **Origen del Hallazgo:** `Auditoria.txt` — AUD-NG-005.
- **Severidad/Clasificación:** Alto.
- **Archivos Involucrados:** `backend/user-service/Code.gs`, `backend/academic-service/Code.gs`, `backend/accounting-service/Code.gs`, `backend/task-service/Code.gs`, `backend/exam-service/Code.gs`.
- **Dependencias Expuestas:** `CacheService`, `acct_state_<userId>`, `revoked_user_<userId>`, `revoked_session_<sessionId>`, `invalidateUserRoleCache`, flujos de suspensión y desactivación.
- **Descripción del Alcance:** Documentar y unificar la política de revocación. Asegurar que cambios de estado, suspensión, cambio de rol, cierre de sesión y revocación invaliden las cachés pertinentes de todos los servicios. Definir el tiempo máximo de propagación y resolver fallos de invalidación sin conceder acceso por defecto.
- **Criterios de Aceptación:**
  1. Una cuenta desactivada pierde acceso dentro del plazo máximo documentado.
  2. El logout/revocación de una sesión invalida su identificador en todos los servicios.
  3. Las cachés no reutilizan estado o permisos de otro usuario.
  4. Una indisponibilidad del mecanismo de revocación no concede acceso implícito.
  5. Pruebas de integración verifican la propagación de revocación y la expiración de caché.
- **Estado:** [ ] Pendiente | [ ] En Ejecución | [ ] Completada

### [AUD-NG-006] Implementar reintentos seguros e idempotencia uniforme para operaciones con efectos secundarios
- **Origen del Hallazgo:** `Auditoria.txt` — AUD-NG-006.
- **Severidad/Clasificación:** Crítico.
- **Archivos Involucrados:** `js/api.js`, `backend/user-service/Code.gs`, `backend/academic-service/Code.gs`, `backend/accounting-service/Code.gs`, `backend/task-service/Code.gs`, `backend/exam-service/Code.gs`.
- **Dependencias Expuestas:** `fetchApi`, contratos de acciones, `CacheService`/persistencia de idempotencia, pagos, documentos, matrículas, evaluaciones, entregas y procesos masivos.
- **Descripción del Alcance:** Clasificar las acciones en lectura, escritura naturalmente idempotente y escritura no idempotente. Reintentar automáticamente solo operaciones seguras. Para escrituras, generar y propagar una clave idempotente ligada al actor, servicio, acción y payload; persistir el resultado y controlar concurrencia, retención, colisión y reutilización con payload incompatible. Diferenciar fallo anterior a ejecución de respuesta perdida después de una escritura confirmada.
- **Criterios de Aceptación:**
  1. Las lecturas temporales se reintentan con límite y espera progresiva.
  2. Una escritura repetida con la misma clave produce un único efecto.
  3. Dos solicitudes simultáneas con la misma clave no duplican registros.
  4. Reutilizar la clave con payload diferente se rechaza.
  5. Los errores permanentes de validación/autorización no se reintentan.
  6. Se prueban operaciones de pago, matrícula, emisión documental, notas y entregas.
- **Estado:** [ ] Pendiente | [ ] En Ejecución | [ ] Completada

### [AUD-NG-007] Aplicar correctamente el timeout por solicitud y corregir los indicadores de salud de servicios
- **Origen del Hallazgo:** `Auditoria.txt` — AUD-NG-007.
- **Severidad/Clasificación:** Medio.
- **Archivos Involucrados:** `js/api.js` y componentes que consumen `checkMicroserviceHealth` / `checkAllMicroservicesHealth`.
- **Dependencias Expuestas:** `fetchApi`, `AbortController`, `checkMicroserviceHealth`, paneles de monitoreo.
- **Descripción del Alcance:** Hacer que `fetchApi` respete el timeout recibido en options, defina un valor predeterminado y limpie temporizadores en todos los caminos de resolución/rechazo. Asegurar que los health checks utilicen su timeout real y clasifiquen timeout, indisponibilidad y degradación de forma diferenciada.
- **Criterios de Aceptación:**
  1. Una llamada con timeout de 6000 ms aborta dentro del margen de tolerancia documentado.
  2. Las llamadas sin timeout usan el valor predeterminado.
  3. No quedan temporizadores activos tras resolver o rechazar una llamada.
  4. Los paneles reflejan el resultado y latencia reales sin esperar 60 segundos cuando se configuró un límite menor.
- **Estado:** [ ] Pendiente | [ ] En Ejecución | [ ] Completada

### [AUD-NG-008] Diferenciar errores de servicio de consultas exitosas sin registros y controlar los fallbacks
- **Origen del Hallazgo:** `Auditoria.txt` — AUD-NG-008.
- **Severidad/Clasificación:** Alto.
- **Archivos Involucrados:** `js/api.js`, `js/persistence.js` y consumidores de acciones `get*`.
- **Dependencias Expuestas:** `fetchApi`, `PersistenceManager`, dashboards, listados y reportes.
- **Descripción del Alcance:** Evitar que una indisponibilidad de red devuelva `status: success` para consultas. Mantener un estado explícito de error/fallback que los consumidores deban tratar como datos no confirmados. Definir si se permite renderizar caché antigua y etiquetarla como tal, sin confundirla con respuesta actual del servidor. Revisar reconciliación y persistencia de respuestas fallidas.
- **Criterios de Aceptación:**
  1. Un error de red nunca se presenta como consulta exitosa del servidor.
  2. La interfaz distingue lista vacía real, datos cacheados y servicio indisponible.
  3. Los fallbacks no sobrescriben datos válidos persistidos como si fueran una respuesta autoritativa.
  4. Las pruebas cubren cada formato de respuesta fallback y sus consumidores principales.
- **Estado:** [ ] Pendiente | [ ] En Ejecución | [ ] Completada

### [AUD-NG-009] Sustituir las pruebas de presencia textual por pruebas funcionales y de seguridad reproducibles
- **Origen del Hallazgo:** `Auditoria.txt` — AUD-NG-009.
- **Severidad/Clasificación:** Alto.
- **Archivos Involucrados:** `tests/regression/academic-grading-suite.js`, `tests/regression/modular-dashboard-suite.js`, `backend/developer-service/Code.gs` y servicios sujetos a pruebas.
- **Dependencias Expuestas:** Contratos API, autenticación, autorización, persistencia, concurrencia, cálculos académicos y dashboards.
- **Descripción del Alcance:** Mantener comprobaciones estructurales solo como pruebas complementarias. Agregar pruebas que ejecuten las funciones/handlers con datos aislados y dobles controlados de SpreadsheetApp, DriveApp, CacheService y LockService; probar resultados, persistencia, autorización, límites de acceso, concurrencia, errores y regresión. Documentar cuáles pruebas son simuladas y cuáles requieren un entorno Apps Script real.
- **Criterios de Aceptación:**
  1. Las pruebas fallan ante lógica incorrecta aunque el nombre de la función exista.
  2. Los criterios de aceptación de cada tarea completada se vinculan a casos de prueba concretos.
  3. Se cubren casos autorizados, no autorizados, límites, datos inconsistentes y concurrencia.
  4. Los reportes distinguen pruebas estructurales, unitarias, integración y validación en despliegue.
  5. Ningún porcentaje de aserciones estáticas se presenta como prueba de cumplimiento funcional.
- **Estado:** [ ] Pendiente | [ ] En Ejecución | [ ] Completada

### [AUD-NG-010] Completar el mapa de dependencias y la trazabilidad entre requisitos, módulos, datos y pruebas
- **Origen del Hallazgo:** `Auditoria.txt` — AUD-NG-010.
- **Severidad/Clasificación:** Medio.
- **Archivos Involucrados:** `MapaDependencias.md`, `README.md`, `completadas.md`, documentación de arquitectura, servicios backend y módulos frontend.
- **Dependencias Expuestas:** Funciones, variables globales, constantes, clases, eventos, rutas, hojas de cálculo, permisos, servicios, pruebas y criterios de aceptación.
- **Descripción del Alcance:** Ampliar el mapa conforme a la estructura obligatoria de METODOLOGIA_DESARROLLO.md. Registrar por archivo las funciones, parámetros, retornos, consumidores, variables, constantes, clases, eventos, dependencias entrantes/salientes y contratos. Relacionar cada requisito/tarea con componente, evidencia y pruebas; mantener fecha y estado de actualización.
- **Criterios de Aceptación:**
  1. Los componentes centrales tienen inventario por archivo y bloques funcionales.
  2. Las dependencias críticas y los consumidores están identificados.
  3. Cada tarea completada puede rastrearse a implementación y prueba verificable.
  4. Los elementos no auditados aparecen explícitamente como pendientes, no como completos.
- **Estado:** [ ] Pendiente | [ ] En Ejecución | [ ] Completada

### [AUD-NG-011] Verificar la arquitectura de servicios curriculares y demostrar el aislamiento operativo por área
- **Origen del Hallazgo:** `Auditoria.txt` — AUD-NG-011.
- **Severidad/Clasificación:** Observación.
- **Archivos Involucrados:** `backend/`, `js/config.js`, documentación de arquitectura y configuración de despliegues Apps Script.
- **Dependencias Expuestas:** Servicios académicos, catálogos curriculares, hojas de cálculo, permisos, cuentas de despliegue y contratos interservicio.
- **Descripción del Alcance:** Contrastar los criterios de TAREA-09 con la arquitectura desplegada. Identificar qué áreas curriculares tienen servicio, fuente de datos, despliegue, identidad de ejecución, permisos y contrato propios; distinguir aislamiento lógico dentro de un servicio compartido de microservicio independiente. Documentar excepciones y brechas.
- **Criterios de Aceptación:**
  1. Cada área curricular incluida en el requisito tiene arquitectura y límites documentados.
  2. Se acredita con configuración real qué despliegues existen y qué identidad ejecuta cada uno.
  3. Los permisos y fuentes de datos están aislados conforme al requisito.
  4. La tarea original solo se declara cumplida si todos sus criterios están demostrados.
- **Estado:** [ ] Pendiente | [ ] En Ejecución | [ ] Completada

---

## Resultado de la revisión de tareas completadas en Pendientes.md
En el momento de la auditoría, `Pendientes.md` estaba vacío. No había tareas marcadas como completadas para contrastar contra el código. Las tareas anteriores se incorporan como pendientes derivadas de hallazgos registrados en `Auditoria.txt`; no se han marcado como completadas.

## Límite de cobertura
La auditoría inicial no certifica las 448 KB aproximadas de `completadas.md` ni todas las fases/tareas descritas allí. Los hallazgos documentados se limitan a los componentes y criterios inspeccionados en este pase. La revisión exhaustiva de cada tarea de `completadas.md`, las pruebas funcionales, el despliegue real y los datos de producción siguen requiriendo auditorías específicas.
