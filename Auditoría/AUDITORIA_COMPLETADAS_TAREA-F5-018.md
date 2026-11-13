# AUDITORÍA TÉCNICA - TAREA-F5-018: experiencia multiestudiante y resumen familiar consolidado

- **Repositorio:** i-miss-cocaine/IMA
- **Rama auditada:** NG_beta_0.0.0.1_work
- **Rama base protegida:** NG_beta_0.0.0.1
- **Checkpoint válido de inicio:** C1.214, HEAD `d8919e1dd48b7cb4ab9997db9b26d1d52885cc54`, árbol `7404a6d3ad0d7da3c42220f46bd3c8f99dd590ae`.
- **HEAD de la rama base verificado:** 44d9891132332e692dbe2ba8602b41f50a508a59.
- **Divergencia previa:** 282 commits adelante y 0 detrás.
- **Checkpoint de cierre preparado:** C1.215.
- **Sesión operativa:** IMA-AUDIT-20261107-1821Z (identificador operativo, no ID nativo de ChatGPT).
- **Fecha:** 2026-11-07.
- **Dictamen técnico:** **NO CUMPLE**.

## 1. Continuidad, fuentes y antecedentes

El árbol y el historial de `NG_beta_0.0.0.1_work` no contienen `AUDITORIAS/AUDITORIA_COMPLETADAS_TAREA-F5-018.md`. La consulta de historial por esa ruta tampoco devuelve commits. Se crea este informe desde cero, sin asumir como evidencia los comentarios de implementación de `ChangesLogs.txt`.

**Requisitos administrativos:** `completadas.md`, SHA `f57f1aef832e81e44fc4f7ec36a852d50e464676`, líneas 2383-2412. La tarea contiene nueve requisitos y cinco criterios de aceptación marcados [x], con estado [X] Completada. Ese estado administrativo se conserva, pero no demuestra cumplimiento técnico.

**Registro de cambios declarado:** `ChangesLogs.txt`, SHA `5b5cff1926b73a05d1b92087a7bf4b2db75326ff`, líneas 1916-1924. Declara actualización de `getGuardianStudents`, resumen financiero, selector multiestudiante, refresco de paneles, aislamiento de caché y renderizado de solvencia. La inspección confirma que existen fragmentos con esos nombres, pero no se conectan de forma ejecutable ni satisfacen los contratos requeridos.

**Origen citado por la tarea:** `Auditoria.txt` / HALLAZGOS F5-P1-01 y `AUDITORIA_FASE_5_ADMISIONES_PORTAL_FAMILIAS.md`. El informe de fase citado no existe en el árbol consultado. La ausencia de esa fuente histórica impide verificar su redacción original; no impide contrastar los nueve requisitos actuales contra el código.

**Pendientes.md:** se recuperó y consultó el blob histórico SHA `631b4c2dbf0e86d5704b63625382d73ccb8ceb3c` (1.782.094 caracteres, 20.182 líneas, sin U+FFFD). No contiene una entrada directa TAREA-F5-018. Sí contiene dependencias existentes relevantes: AUD-NG-036, AUD-NG-222/TASK-502 (autorización contextual), AUD-NG-133 (integridad/idempotencia de pagos) y AUD-NG-161 (pruebas de concurrencia). No se crean IDs globales duplicados.

**Informes anteriores que cubren causas relacionadas:** F5-009 (A03/A04/A05/A08), F5-012 (A01/A06/A07/A08) y F5-013 (A01/A03/A04/A08/A09/A10). Sus tareas siguen siendo las referencias de implementación compartida; las subtareas F5-018 de este informe delimitan únicamente la integración específica de multiestudiante y resumen familiar.

## 2. Evidencia técnica y respaldos

| Archivo | SHA | Secciones/rangos inspeccionados |
|---|---|---|
| `completadas.md` | `f57f1aef832e81e44fc4f7ec36a852d50e464676` | TAREA-F5-018, líneas 2383-2412; nueve requisitos/cinco criterios. |
| `ChangesLogs.txt` | `5b5cff1926b73a05d1b92087a7bf4b2db75326ff` | Declaración F5-018, líneas 1916-1924. |
| `backend/user-service/Code.gs` | `12079dd410aa6d8afbce55a4bc62a79dea605f9f` | Esquema RelacionesFamiliares (874); ROLE_PERMISSIONS (926-982); getUserVerifiedRole (1146-1161); validateContextualAccess (1213-1248); validateRolePermission (1253-1295); doPost/dispatcher (1351-1435); getDynamicPermissionsForRole (1863-1895); revokeFamilyLink (3442-3461); updateFamilyLinkPermissions (3463-3478); getGuardianStudents (3480-3578); getFamilyConsolidatedSummary (3629-3704); submitJointFamilyPayment (3705-3757). |
| `backend/accounting-service/Code.gs` | `38b979d41596b85e888b4a7060b37bbac0840a28` | Esquemas CargosEstudiante/ComprobantesPago (131-134); getStudentAccountStatement (aprox. 3891-3930); recordStudentPayment (3891-3970); reviewPaymentVoucher (4183-4210). |
| `js/student.js` | `e2888cea60322e49a40b89adadb8010489605dcc` | Guard de rol (25-31); selector (184-250); resumen familiar (408-510); pago conjunto (512-657); invocación del selector (745); fetchAllActivities (1165-1352); caché de perfil (2671-2700). |
| `js/persistence.js` | `94ac26feb4f7f31f1f3f2a238e164d23be565d94` | Lista fija STORES (10-12); firma/implementación de get (77-93). |
| `js/api.js` | `6b24f666db30a811a8e9b38d466fc6001cf6dfa9` | fetchApi y construcción de payload/POST (11-65). |
| `student-dashboard.html` | `6379ea0ed39d71b89747a0280bb925fdf12202c1` | Estructura principal (117+), carga de scripts (392+); no contiene los cuatro IDs del portal familiar. |
| `tests/regression/academic-grading-suite.js` | `a22cb3ef376fe09e65c1b17c2f4f5125290bfba6` | Archivo completo; no contiene F5-018 ni pruebas de resumen/pagos familiares. |
| `tests/regression/modular-dashboard-suite.js` | `0495e1d526a872c33310935a003a83d924d34683` | Archivo completo; no contiene F5-018 ni pruebas de resumen/pagos familiares. |
| `AUDITORIAS/AUDITORIA_COMPLETADAS_TAREA-F5-009.md` | `72752fe9b127edf445f6d4fafa82ac11b88c3044` | Tareas A03/A04/A05/A08 de autorización, permisos granulares, administración de vínculos y pruebas. |
| `AUDITORIAS/AUDITORIA_COMPLETADAS_TAREA-F5-012.md` | `1edc05b589fb4a921d80c492e37c9533ebf7046b` | Tareas A01/A06/A07/A08 de entrada/DOM, estados/XSS, separación financiera y pruebas familiares. |
| `AUDITORIAS/AUDITORIA_COMPLETADAS_TAREA-F5-013.md` | `b30e2049a57065ca0c1e171be464e045ba70993a` | Tareas A01/A03/A04/A08/A09/A10 de seguridad, atomicidad, comprobantes, resumen, contabilidad y pruebas. |
| `AUDITORIAS/MapaDependencias.md` | `77a2bc8cb9bbdfccc7b86b256ae94791a0f5edb0` | Relaciones familiares, USER/ACCOUNTING, separación de admisión y matrícula, y dependencias previas. |
| `METODOLOGIA_DESARROLLO.md` | `cf796728bb384a32537392df2f9c72a339fa03ee` | Auditoría manual, trazabilidad, tareas derivadas, commit único y checkpoint acumulativo. |
| `AUDITORIAS/README.md` | `2f649c6ffc39ec7cdd242e85cb71b4344fd69e34` | Sección obligatoria de tareas ejecutables dentro del informe individual. |

## 3. Matriz de requisitos

| Requisito | Resultado | Evaluación |
|---|---|---|
| Selector multiestudiante y resumen consolidado utilizables por Padre/Tutor/Responsable. | **NO CUMPLE** | El dashboard redirige a login a cualquier rol distinto de Estudiante/Alumno; además, el HTML no incluye los contenedores que el selector y el resumen necesitan. |
| Cambio de estudiante refresca el panel sin mezclar contexto. | **NO CUMPLE** | El controlador sustituye currentUser y la identidad persistida por el DTO del estudiante, que no contiene token de sesión; las llamadas posteriores no propagan el token. El refresco queda además afectado por la caché con nombre de store inválido. |
| Estado financiero distingue cero confirmado, datos pendientes, error y falta de permiso. | **NO CUMPLE** | El resumen puede producir ceros por índices de columnas erróneos; los errores RBAC se presentan como ausencia de estudiantes; no existe estado de datos pendientes/no cargados por docente. |
| Suma de cargos y pagos en revisión sin duplicidad. | **NO CUMPLE** | La lectura de CargosEstudiante usa columnas equivocadas y omite cargos Parcial; los pagos conjuntos no se leen desde su tabla de distribución. |
| Separación de cargos de admisión y cargos ordinarios. | **NO CUMPLE** | El agregador no usa discriminador de tipo/solicitud; la clasificación de entidad y transferencia financiera siguen dependiendo de tareas F5-012/F5-013 pendientes. |
| Matriz de permisos individuales por relación. | **NO CUMPLE** | El esquema creado no declara la columna de permisos; la lectura cae a permisos positivos por defecto y el control contextual depende de una bandera no declarada. |
| Pago conjunto multihijo con comprobante único y desglose real por estudiante. | **NO CUMPLE** | Se registra un comprobante a nombre del responsable y filas de distribución aisladas; no se validan relaciones/cargos/permisos ni se aplica la distribución al libro de pagos de cada hijo. |
| Un fallo de red de un estudiante no altera los datos de los demás. | **NO CUMPLE** | Los errores iniciales se convierten en listas vacías y no existe control de respuestas obsoletas al conmutar rápidamente; algunos paneles conservan contenido previo si la nueva consulta falla. |
| Revocación retira inmediatamente al estudiante del selector y de los totales. | **NO CUMPLE** | La revocación cambia el estado en la hoja, pero el selector solo consulta una vez al inicializar y no refresca ni invalida la lista en uso. |

## 4. Hallazgos técnicos

### H1 - CRÍTICO/P0: la experiencia familiar no tiene una ruta de ejecución accesible

En `js/student.js` (25-31), el guard de `student-dashboard.html` solo permite los roles Estudiante y Alumno; Padre, Tutor y Responsable son redirigidos a `login.html`. El mismo archivo busca `family-student-switcher-container`, `family-student-switcher`, `family-consolidated-summary-container` y `family-applicant-tracking-container`, pero ninguno existe en `student-dashboard.html`. Por tanto, `initFamilyStudentSwitcher` retorna antes de cargar los vínculos y los controladores del resumen no tienen contenedor donde renderizar.

**Impacto:** el módulo descrito por F5-018 no es accesible por los roles objetivo ni está montado en el DOM. Reconciliar con F5-012-A01; no relajar el guard del dashboard estudiantil.

### H2 - CRÍTICO/P0: llamadas familiares sin token y acciones ausentes de los permisos estáticos

`getUserVerifiedRole` (USER:1146-1161) exige `sessionToken`, `authToken` o `token`. `fetchApi` (API:11-65) solo enriquece `requesterUserId/requesterRole` y serializa el payload recibido; no inyecta token. El selector llama `getGuardianStudents` y `getGuardianApplicants` con solo `userId` (student:184-250), y el resumen llama `getFamilyConsolidatedSummary` con solo `userIdResponsable` (student:408-420). Las promesas del selector convierten el fallo en `{data: []}`, ocultando la denegación. Además, ROLE_PERMISSIONS de Padre/Tutor/Responsable (USER:926-982) no incluye `getFamilyConsolidatedSummary` ni `submitJointFamilyPayment`; la matriz dinámica cae a esa lista cuando no existe una regla explícita.

La función `getFamilyConsolidatedSummary` vuelve a llamar `getGuardianStudents({userIdResponsable: uid})` (USER:3642-3648), también sin token. Aun autorizando la acción exterior, la llamada anidada falla porque `getGuardianStudents` verifica la sesión por sí misma.

**Impacto:** el flujo no puede recuperar estudiantes ni generar el resumen con las llamadas actuales. Reconciliar con F5-009-A03 y F5-012-A01.

### H3 - CRÍTICO/P0: el selector reemplaza la identidad autenticada por el estudiante seleccionado

En `js/student.js` (242-243), al seleccionar un hijo se asigna el DTO de `getGuardianStudents` a `currentUser` y se sobrescribe `localStorage.currentUser`. Ese DTO contiene datos del estudiante, no la sesión firmada del tutor. Se pierde así la identidad autenticada del responsable y las llamadas posteriores se ejecutan con un objeto sin token. No existe un contexto separado `authenticatedUser/selectedStudent` ni restauración de la identidad del tutor al volver a cambiar de estudiante.

**Impacto:** el cambio de hijo destruye el contexto de autenticación que debe autorizar las consultas; además puede contaminar el estado de sesión persistido. Reconciliar con F5-012-A01 y F5-009-A03.

### H4 - ALTO/P1: las claves de caché dinámicas se utilizan como nombres de stores inexistentes

`PersistenceManager.STORES` (persistence:10-12) declara stores fijos, entre ellos `cache_estudiante_dashboard` y `cache_estudiante_profile`. Su método `get(store, key)` (persistence:77-93) recibe el nombre del store como primer argumento. Sin embargo, `fetchAllActivities` construye `cache_estudiante_dashboard_<userId>` y lo pasa como primer argumento a `PersistenceManager.get` (student:1173-1176) y `set` (student:1286). `fetchAndRenderLearningProfile` repite el patrón con `cache_estudiante_profile_<userId>` (student:2671-2680), incluso enviando ese nombre dinámico como `options.store` a `fetchApi`.

Ninguno de esos nombres dinámicos existe en STORES. Además, la primera lectura de `fetchAllActivities` ocurre antes de su bloque try/finally; el error de IndexedDB deja `isFetchingActivities` en true y las llamadas siguientes retornan inmediatamente.

**Impacto:** la estrategia de aislamiento de caché declarada en ChangesLogs no corresponde al contrato real de IndexedDB y puede bloquear la carga de actividades. La separación debe implementarse como store fijo + key por userId, con manejo de error dentro del try/finally.

### H5 - CRÍTICO/P0: el resumen financiero consulta columnas equivocadas y declara solvencia falsa

El esquema de `CargosEstudiante` (ACCOUNTING:131) es: CargoID[0], Fecha[1], UserId[2], Concepto[3], MontoBase[4], Descuento[5], MontoFinal[6], Estado[7], FechaVencimiento[8], etc. `getFamilyConsolidatedSummary` (USER:3664-3668) compara `c[1]` con el userId del estudiante, evalúa `c[6]` como si fuera Estado y suma `c[4]` como monto. Por tanto compara Fecha con UserId, MontoFinal con los literales Pendiente/Vencido y suma MontoBase. La consulta no detecta los cargos reales y puede devolver saldo cero y `esSolvente: true` sin que el estudiante esté solvente.

Incluso corregidos los índices, la función solo considera estados Pendiente/Vencido y omite Parcial, aunque `recordStudentPayment` (ACCOUNTING:3891+) cambia un cargo parcialmente abonado a estado Parcial. Tampoco calcula el saldo desde cargos menos pagos confirmados como hace `getStudentAccountStatement`.

**Impacto:** información financiera materialmente incorrecta, con riesgo de presentar como solvente a un estudiante con deuda.

### H6 - ALTO/P1: el resumen no representa el estado académico ni distingue todos los estados de datos

`getFamilyConsolidatedSummary` solo agrega conteo de estudiantes, cargos y comprobantes en revisión; `tareasPendientesCount` se devuelve siempre como 0. No consulta calificaciones, tareas, asistencia ni avisos para el resumen familiar. En UI (student:408-510), los errores devueltos como `status: error` se muestran como “No se encontraron estudiantes vinculados”, porque `fetchApi` devuelve el JSON de error y no rechaza la promesa. Los totales usan `parseFloat(...) || 0`, de modo que ausencia de dato o valor inválido se representa como cero. No hay un estado para información docente pendiente/no cargada.

**Impacto:** no se distinguen saldo cero confirmado, dato faltante, denegación RBAC y error del servidor; tampoco se entrega el resumen académico que exige la tarea. Reconciliar con F5-012-A06 y F5-012-A07.

### H7 - CRÍTICO/P0: los permisos financieros por relación fallan abiertos

El esquema inicial de `RelacionesFamiliares` (USER:874) crea ocho columnas y no declara una columna PermisosJSON. `updateFamilyLinkPermissions` escribe en la columna 9 (USER:3463-3478), mientras `getGuardianStudents` intenta leer `r[8]` (USER:3533+). Cuando el valor falta o el JSON es inválido, el código conserva `permisos` con todos los permisos en true. `getFamilyConsolidatedSummary` también interpreta ausencia de objeto de permisos como autorización financiera (`!s.permisos || permisoFinanciero !== false`). La condición contextual depende de `GRANULAR_FAMILY_PERMISSIONS_ENABLED`, que no tiene declaración en el archivo; solo aparece en el comentario/condición.

**Impacto:** una relación sin configuración o con JSON corrupto puede conceder acceso financiero. El resumen puede sumar y mostrar saldos a un tutor que debía quedar restringido. Reconciliar con F5-009-A04/A05 y AUD-NG-222/TASK-502.

### H8 - CRÍTICO/P0: el endpoint de pago conjunto no valida actor, vínculo, permiso ni distribución

`submitJointFamilyPayment` (USER:3705-3757) acepta `userIdResponsable`, estudiantes, cargos y montos del payload sin compararlos con `_verifiedUserId`, verificar que cada hijo tenga relación activa o comprobar `permisoFinanciero`. Tampoco valida que `cargoId` pertenezca al estudiante, que los montos sean finitos y positivos o que el comprobante/referencia sea válido. Un monto no numérico puede superar la condición de igualdad porque la comparación con NaN no es verdadera. El endpoint no tiene permiso estático para Padre/Tutor/Responsable; si se concede dinámicamente, el handler sigue sin validación contextual de cada distribución.

La UI (student:512-657) presenta todos los estudiantes de `familyLinkedStudents` sin filtrar por permiso financiero y envía las distribuciones al endpoint.

**Impacto:** el control de permisos de interfaz no protege el backend y el handler permite construir distribuciones arbitrarias cuando una regla externa concede acceso. Reconciliar con F5-009-A03/A04 y F5-013-A01/A04.

### H9 - CRÍTICO/P0: el pago conjunto no aplica las distribuciones al libro contable de cada estudiante

El endpoint escribe un comprobante general en `ComprobantesPago` con `userIdResponsable` como UserId y luego filas en `DistribucionPagosConjuntos`. El resumen familiar no consulta esta última hoja; filtra comprobantes por el UserId del hijo, por lo que no encuentra el comprobante del responsable. Al aprobar el comprobante, `reviewPaymentVoucher` (ACCOUNTING:4183-4210) llama a `recordStudentPayment` con `row[2]` (responsable), `row[4]` (`CARGO-CONJUNTO`) y el monto total; no registra los abonos por estudiante ni aplica cada cargo real.

La escritura en dos hojas usa appendRow secuencial, sin LockService, transacción compensatoria ni clave de idempotencia obligatoria. La UI tampoco envía idempotencyKey. Un fallo entre escrituras puede dejar comprobante sin desglose, y un reintento puede duplicar la operación.

**Impacto:** el comprobante puede quedar en revisión/aprobado sin reducir las deudas de los hijos; el libro de pagos registra el total en el responsable, no en las cuentas individuales. Reconciliar con F5-013-A03/A04/A08/A09, AUD-NG-133 y AUD-NG-161.

### H10 - ALTO/P1: la revocación no actualiza el selector ni los totales en tiempo real

`revokeFamilyLink` (USER:3442-3461) cambia el estado de la relación a Revocada. `getGuardianStudents` filtra estados activos al consultar, pero `initFamilyStudentSwitcher` solo se ejecuta una vez al cargar el documento (student:745). No existe refresco periódico, suscripción a eventos, invalidación del estado familiar ni llamada de actualización al cambiar una relación. La lista y el resumen ya renderizados pueden conservar al estudiante revocado hasta una recarga manual.

**Impacto:** un vínculo revocado sigue visible en la interfaz y en totales ya cargados. Reconciliar con F5-009-A05 y F5-012-A06.

### H11 - ALTO/P1: datos de estudiantes se interpolan sin escape contextual en HTML

El selector construye `optionsHtml` con `st.userId`, `st.nombre`, grado y sección y lo asigna a `switcherSelect.innerHTML` (student:184-230). El resumen familiar interpola `st.nombre`, `st.estadoMatricula` y `st.userId` dentro de HTML y atributos onclick (student:408-510); el modal de pago repite nombres/IDs en HTML y atributos de datos (student:512+). No hay escape contextual en esos campos.

**Impacto:** valores almacenados que contengan marcado o atributos pueden convertirse en HTML/handlers ejecutables cuando la interfaz familiar sea montada. Reconciliar con F5-012-A06 y AUD-NG-145.

### H12 - ALTO/P1: no existe cobertura de regresión específica para F5-018

Las dos suites presentes en `tests/regression/` (academic-grading-suite.js y modular-dashboard-suite.js) no contienen F5-018 ni llamadas a `getFamilyConsolidatedSummary`/`submitJointFamilyPayment`. No hay suite familiar dedicada en el árbol. No se ejecutaron pruebas HTTP, Apps Script, Sheets productivo, navegador, concurrencia ni flujos multiusuario en esta auditoría.

**Impacto:** los cinco criterios marcados [x] no tienen evidencia conductual en las suites inspeccionadas. Reconciliar con F5-012-A08, F5-013-A10 y AUD-NG-161.

## 5. Dictamen

**TAREA-F5-018: NO CUMPLE.** Los componentes parciales existen, pero la experiencia familiar no es accesible por los roles previstos; las llamadas carecen de token y permisos; el cambio de estudiante sustituye la identidad autenticada; la caché dinámica no respeta el contrato de IndexedDB; el resumen financiero usa columnas incompatibles y puede informar solvencia falsa; los permisos individuales fallan abiertos; el pago conjunto no valida ni aplica distribuciones al libro de cada estudiante; la revocación no refresca el estado visible; y no hay pruebas de regresión específicas.

La marca [X] de `completadas.md` se conserva sin modificación. Este dictamen no cambia el estado administrativo ni implementa correcciones.

## 6. Pruebas y limitaciones

- **Ejecutado:** inspección estática/manual focalizada de requisitos, RBAC, tokens, dispatcher, relaciones familiares, resumen, pagos, esquema contable, selector, persistencia, llamadas API, HTML, historial Git, SHAs, árbol, suites y dependencias existentes; consulta del blob histórico de Pendientes.md.
- **No ejecutado:** Apps Script runtime, HTTP, Google Sheets/Drive productivo, pruebas con cuentas reales, navegador/XSS dinámico, concurrencia, inyección de fallos, ni suites automatizadas.
- **Alcance:** se revisaron las rutas y funciones directamente conectadas con F5-018 y sus dependencias inmediatas. No se afirma una auditoría integral de todos los módulos USER/ACCOUNTING/estudiante.
- **Código fuente y pruebas:** sin modificaciones; la iteración corresponde exclusivamente a Auditoría y documentación.

## 7. Tareas ejecutables derivadas de los hallazgos

Las siguientes tareas son locales a TAREA-F5-018. Las dependencias globales y tareas de F5-009/F5-012/F5-013 se amplían por referencia; no se crean IDs globales duplicados. Todas quedan Pendientes.

### F5-018-A01 - Aislar identidad autenticada y contexto multiestudiante

- **Hallazgos de origen:** H1, H2, H3 y H4.
- **Severidad:** Crítico/P0.
- **Objetivo/acción:** completar el flujo de selección sin reemplazar la identidad ni el token del responsable; mantener separado el estudiante seleccionado; propagar el contexto firmado en las llamadas autorizadas; corregir el uso de IndexedDB a store fijo + clave por userId; proteger las respuestas asíncronas frente a cambios de estudiante y refrescar los paneles académicos/administrativos/financieros.
- **Archivos/módulos:** `js/student.js`, `js/api.js`, `js/persistence.js`, `student-dashboard.html` o ruta familiar dedicada, USER endpoints.
- **Dependencias/riesgos:** ampliar F5-012-A01/A06; F5-009-A03; getGuardianStudents/getGuardianApplicants; getFamilyConsolidatedSummary; fetchApi; PersistenceManager.
- **Alcance:** no convertir al tutor en una sesión de estudiante, no guardar el DTO de un hijo como currentUser autenticado, no relajar el guard de Estudiante/Alumno; la ruta familiar debe autorizarse por separado.
- **Criterios verificables:** Padre/Tutor/Responsable accede a una ruta familiar autorizada; los cuatro nodos DOM existen; las llamadas contienen token válido; el actor autenticado permanece inmutable al seleccionar varios hijos; todas las vistas muestran el hijo seleccionado; los errores de un hijo no borran los datos de otro; la caché usa stores declarados y claves separadas; una respuesta tardía no sobrescribe la selección más reciente.
- **Prioridad:** P0.
- **Estado:** Pendiente.
- **Evidencia de cierre:** pendiente.

### F5-018-A02 - Corregir el cálculo y los estados del resumen familiar consolidado

- **Hallazgos de origen:** H5 y H6.
- **Severidad:** Crítico/P0.
- **Objetivo/acción:** alinear consultas con los encabezados canónicos de CargosEstudiante/ComprobantesPago; calcular saldo con cargos, pagos confirmados y abonos parciales; integrar la distribución de pagos conjuntos por estudiante; separar cargos de admisión de matrícula/colegiatura; obtener métricas académicas reales y distinguir saldo cero confirmado, dato docente pendiente, dato no cargado, error de servidor y falta de permiso.
- **Archivos/módulos:** USER `getFamilyConsolidatedSummary`; ACCOUNTING `getStudentAccountStatement` y contrato de pagos; modelo CargosEstudiante/ComprobantesPago/DistribucionPagosConjuntos; `js/student.js`.
- **Dependencias/riesgos:** ampliar F5-012-A07 y F5-013-A02/A08; TASK-001/F15-Task01; TASK-002/F15-Task02; AUD-NG-145 para trazabilidad de datos.
- **Alcance:** no inferir solvencia por ausencia de filas ni convertir valores faltantes en cero; no mezclar SolicitudID y UserId; no duplicar comprobantes en el saldo de los hijos.
- **Criterios verificables:** fixtures con cargo Pendiente, Vencido, Parcial y Pagado calculan el saldo correcto; pagos en revisión aparecen separados y una sola vez; distribución de pago se atribuye a cada hijo; cargos de admisión y matrícula aparecen en categorías separadas; el resumen académico no devuelve contadores simulados; cada estado visual coincide con el estado del servidor.
- **Prioridad:** P0.
- **Estado:** Pendiente.
- **Evidencia de cierre:** pendiente.

### F5-018-A03 - Aplicar permisos financieros fail-closed y sincronizar revocaciones

- **Hallazgos de origen:** H7 y H10.
- **Severidad:** Crítico/P0 para permisos; Alto/P1 para refresco.
- **Objetivo/acción:** definir el esquema canónico de permisos de relación; validar JSON y denegar ante columna ausente, dato inválido o error; activar la matriz granular de manera explícita; validar cada acción sobre el vínculo/estudiante concreto; retirar al estudiante revocado del selector, resumen y cachés sin esperar recarga manual.
- **Archivos/módulos:** USER `getOrCreateSheet`, `getGuardianStudents`, `updateFamilyLinkPermissions`, `revokeFamilyLink`, `validateContextualAccess`; UI familiar; matriz de permisos.
- **Dependencias/riesgos:** ampliar F5-009-A03/A04/A05; AUD-NG-036; AUD-NG-222/TASK-502; F5-012-A06.
- **Alcance:** no asumir permiso true si falta la columna o falla el parseo; la autorización se verifica en servidor, no solo ocultando tarjetas o botones.
- **Criterios verificables:** una relación sin permiso explícito no ve ni opera finanzas; JSON inválido/columna ausente produce denegación; Tutor Académico no recibe saldos; Tutor Financiero solo ve los hijos autorizados; toda revocación elimina al hijo del selector/totales en la misma sesión; solicitudes con IDs ajenos son rechazadas.
- **Prioridad:** P0.
- **Estado:** Pendiente.
- **Evidencia de cierre:** pendiente.

### F5-018-A04 - Hacer seguro, atómico e integrado el pago conjunto multihijo

- **Hallazgos de origen:** H8 y H9.
- **Severidad:** Crítico/P0.
- **Objetivo/acción:** derivar responsable desde claims; validar relación activa y permiso financiero por cada hijo; validar cargo real, propiedad, saldo y montos finitos/positivos; exigir clave idempotente; serializar y hacer recuperable la escritura; registrar el comprobante único y cada distribución en el libro de pagos del estudiante correspondiente; conciliar aprobación/rechazo sin dejar estados parciales.
- **Archivos/módulos:** USER `submitJointFamilyPayment`; ACCOUNTING `reviewPaymentVoucher`/`recordStudentPayment`; ComprobantesPago, DistribucionPagosConjuntos, PagosAbonos, CargosEstudiante; `js/student.js`.
- **Dependencias/riesgos:** ampliar F5-013-A01/A03/A04/A08/A09; AUD-NG-133; AUD-NG-161; F5-009-A03/A04.
- **Alcance:** no aceptar userIdResponsable/estudianteId/cargoId como prueba de propiedad; no registrar el total en la cuenta del tutor; no aprobar un comprobante antes de completar o asegurar la aplicación contable.
- **Criterios verificables:** tutor A no puede distribuir a hijos de tutor B; un hijo sin permiso financiero no aparece como destino; cada cargo pertenece al estudiante indicado; la suma distribuida coincide con el total y todos los montos son válidos; aprobación reduce los saldos individuales correctos; reintento/concurrencia no duplica comprobante ni abonos; un fallo intermedio es recuperable y no deja aprobado un pago no aplicado.
- **Prioridad:** P0.
- **Estado:** Pendiente.
- **Evidencia de cierre:** pendiente.

### F5-018-A05 - Crear pruebas de regresión conductuales para F5-018

- **Hallazgos de origen:** H1-H12.
- **Severidad:** Alto/P1 (casos de autorización/contabilidad P0).
- **Objetivo/acción:** añadir pruebas aisladas de acceso por rol, token, selector, cambio rápido entre hijos, caché, estados financieros, permisos por relación, revocación, XSS, distribución de pagos, aprobación, reintentos y fallos parciales.
- **Archivos/módulos:** suite familiar dedicada bajo `tests/regression/`; USER/ACCOUNTING; `js/student.js`; `student-dashboard.html`.
- **Dependencias/riesgos:** ampliar F5-012-A08, F5-013-A10, F5-009-A08 y AUD-NG-161.
- **Alcance:** fixtures aislados; no utilizar cuentas, hojas, comprobantes o documentos productivos; ningún caso se marca PASS sin ejecutar y comprobar el efecto.
- **Criterios verificables:** dos familias aisladas; tres roles familiares; permisos financieros mixtos; revocación con sesión abierta; saldo con cargos parciales/pagos en revisión; XSS en nombres/IDs; dos pagos concurrentes y reintento; fallo entre comprobante y distribución; aprobación que actualiza las cuentas correctas.
- **Prioridad:** P1.
- **Estado:** Pendiente.
- **Evidencia de cierre:** pendiente.

### Reconciliación de tareas existentes (sin crear IDs globales duplicados)

- **F5-012-A01:** entrada familiar, guard de rol, markup/DOM y preservación de identidad autenticada.
- **F5-012-A06:** XSS, estados de error/permisos/datos faltantes y refresco explícito.
- **F5-012-A07:** separación de cargos de admisión y matrícula.
- **F5-012-A08:** pruebas conductuales del portal familiar.
- **F5-009-A03/A04/A05/A08:** ABAC por recurso, permisos granulares, administración/revocación y pruebas.
- **F5-013-A01/A03/A04/A08/A09/A10:** autorización financiera, atomicidad, comprobantes, resumen, libro contable y pruebas.
- **AUD-NG-036 y AUD-NG-222/TASK-502:** relación familiar y autorización contextual fail-closed.
- **AUD-NG-133:** integridad e idempotencia atómica de pagos.
- **AUD-NG-145:** protección de PII/trazabilidad.
- **AUD-NG-161:** concurrencia real y pruebas conductuales.

## 8. Cierre

- **Resultado:** auditoría F5-018 finalizada; dictamen **NO CUMPLE**.
- **Hallazgos:** H1-H12.
- **Tareas locales:** F5-018-A01..A05, todas Pendientes; no se implementaron.
- **Archivos documentales de la iteración:** informe individual F5-018 (nuevo), `AUDITORIAS/Auditoria.txt`, `AUDITORIAS/MapaDependencias.md`, `AUDITORIAS/AUDITORIA_COMPLETADAS_PLAN.md` y `AUDITORIAS/Contexto_personal.txt`.
- **Sin cambios:** backend/*; js/*; HTML; tests/*; `completadas.md`; `Pendientes.md`; `ChangesLogs.txt`; `METODOLOGIA_DESARROLLO.md`; `AUDITORIAS/README.md`; rama base.
- **Siguiente tarea:** TAREA-F5-019 - herramientas de seguimiento operativo y análisis de admisiones. Antes de auditar, comprobar informe individual e historial; después leer requisitos de completadas.md/ChangesLogs y contrastar métricas, filtros, exportaciones, seguridad y pruebas.
