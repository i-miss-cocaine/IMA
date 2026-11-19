# AUDITORÍA TÉCNICA - TAREA-F5-020: optimización de consultas, sincronización y capacidad de respuesta del proceso de admisión

- Repositorio: i-miss-cocaine/IMA
- Rama auditada: NG_beta_0.0.0.1_work
- Rama base protegida: NG_beta_0.0.0.1
- Checkpoint válido de inicio: C1.216; HEAD a858781cb4e2ee2e32e7e2d294a9c49473b68f28; árbol e94ffec04ed7743dc515498e5d8adefdf3fa407c.
- HEAD de rama base verificado: 44d9891132332e692dbe2ba8602b41f50a508a59.
- Divergencia previa: 284 commits adelante y 0 detrás.
- Checkpoint de cierre preparado: C1.217.
- Sesión operativa: IMA-AUDIT-20261107-1900Z (identificador operativo, no ID nativo de ChatGPT).
- Fecha: 2026-11-07.
- Dictamen técnico: **NO CUMPLE**.

## 1. Continuidad, fuentes y plan de auditoría

El checkpoint C1.216 deja como siguiente tarea TAREA-F5-020. La rama de trabajo inicia en a858781cb4e2ee2e32e7e2d294a9c49473b68f28, commit de cierre de F5-019. La rama base NG_beta_0.0.0.1 permanece en 44d9891132332e692dbe2ba8602b41f50a508a59; comparación GitHub: 284 commits adelante y 0 detrás.

No existe AUDITORIAS/AUDITORIA_COMPLETADAS_TAREA-F5-020.md en el árbol de la rama ni en el historial de commits de esa ruta. Se crea este informe desde cero.

**Requisito administrativo:** completadas.md, SHA f57f1aef832e81e44fc4f7ec36a852d50e464676, líneas 2438-2465. TAREA-F5-020 aparece marcada [X] Completada y sus cinco criterios están [x]. La marca administrativa no prueba que la implementación satisfaga los criterios.

**Registro de implementación declarado:** ChangesLogs.txt, SHA 5b5cff1926b73a05d1b92087a7bf4b2db75326ff, líneas 1934-1941. Declara paginación y medición de latencia en getAdmissionRequests; caché de 600 segundos en getAcademicOffers; invalidación en createAcademicOffer y purga desde purgeSecurityCaches. No declara limitación de tamaño, rate limiting ni pruebas de estrés.

**Origen del hallazgo:** la tarea cita Auditoria.txt (HALLAZGOS F5: HALLAZGOS-F5-P3-01) y AUDITORIA_FASE_5_ADMISIONES_PORTAL_FAMILIAS.md (Subcapacidad 5.15, Brecha P3-01). El informe de fase no aparece en el árbol actual. En Auditoria.txt no se localizó el bloque fuente original HALLAZGOS-F5-P3-01; la única aparición literal encontrada está dentro de una nota posterior que indica que no se localizó el marcador original. El contenido primario de la brecha no está disponible para contrastar su redacción completa; se auditan los siete requisitos y cinco criterios conservados en completadas.md.

**Reglas de fuente de verdad:** se consultaron completadas.md, ChangesLogs.txt, metodología, README y checkpoint. La metodología vigente y AUDITORIAS/README.md excluyen expresamente Pendientes.md del flujo operativo; por tanto, no se recuperó ni utilizó para administrar esta tarea.

**Plan formal de revisión:**
1. Control de continuidad, rama, HEAD, árbol, base y existencia/historial del informe.
2. Backend académico: getAdmissionRequests, getAcademicOffers, createAcademicOffer, updateAdmissionStatus, purgeSecurityCaches, doPost y control de cupos.
3. Backend de usuario: manageInstitutionalDataCache, revokeFamilyLink, getGuardianStudents, getGuardianApplicants y doPost.
4. Cliente: fetchApi, loadAdmissionRequestsList y Promise.all en el portal familiar.
5. Pruebas: inspección de las suites de regresión disponibles.
6. Contrastar los siete requisitos y cinco criterios, documentar hallazgos y tareas derivadas; no modificar código durante la auditoría.

## 2. Evidencia técnica y respaldos

| Archivo | SHA | Secciones/rangos inspeccionados |
|---|---|---|
| completadas.md | f57f1aef832e81e44fc4f7ec36a852d50e464676 | TAREA-F5-020, líneas 2438-2465; siete requisitos/cinco criterios. |
| ChangesLogs.txt | 5b5cff1926b73a05d1b92087a7bf4b2db75326ff | Registro TAREA-F5-020, líneas 1934-1941. |
| backend/academic-service/Code.gs | df87a2eea9f0ef79d0b966d03fd5bbe432003df5 | PUBLIC_ACTIONS (260+); checkAndRegisterIdempotencyKey (278+); doPost (671-700); updateAdmissionStatus (1928-2050); purgeSecurityCaches (3702-3745); getAcademicOffers/createAcademicOffer (6132-6218); getAdmissionRequests (1113-1175); checkEnrollmentCapacity (11147-11220). |
| backend/user-service/Code.gs | 12079dd410aa6d8afbce55a4bc62a79dea605f9f | manageInstitutionalDataCache/invalidateUserRoleCache (146-185); verifySessionToken y cachés de sesión (aprox. 1040-1180); doPost (1351-1375, 1405-1432); revokeFamilyLink (3442-3462); getGuardianStudents (3480-3580); getGuardianApplicants (3583-3627). |
| js/api.js | 6b24f666db30a811a8e9b38d466fc6001cf6dfa9 | fetchApi (11-190); timeout, enriquecimiento de payload, POST, reintentos y fallback; checkMicroserviceHealth (200+). |
| js/secretary.js | 08a81266957b4c18cc25f8ba6749eac30a8f2c2c | loadAdmissionRequestsList (aprox. 8-25), filtros locales (27+). |
| js/student.js | e2888cea60322e49a40b89adadb8010489605dcc | initFamilyStudentSwitcher (184-215); Promise.all para getGuardianStudents/getGuardianApplicants; otra Promise.all en fetchAllActivities (1227+). |
| tests/regression/academic-grading-suite.js | a22cb3ef376fe09e65c1b17c2f4f5125290bfba6 | Archivo completo, 412 líneas; asserts de texto sobre caché de ofertas, sin pruebas conductuales F5-020. |
| tests/regression/modular-dashboard-suite.js | 0495e1d526a872c33310935a003a83d924d34683 | Archivo completo, 61 líneas; sin casos F5-020. |
| AUDITORIAS/Auditoria.txt | c341e1f5eea34b9759790ade29b1b27a662a5bc1 | Hallazgos y checkpoints anteriores; no contiene el bloque fuente original citado. |
| AUDITORIAS/MapaDependencias.md | b4059ef13918e59a21a33b70bc8dc293de9fc041 | Dependencias actuales de F5-019 y flujo familiar; se agrega C1.217. |
| AUDITORIAS/AUDITORIA_COMPLETADAS_PLAN.md | ab563052e11d32dd1df6a6398b94667de24d9bca | Último registro C1.216; se agrega C1.217. |
| AUDITORIAS/Contexto_personal.txt | 6cd99ac1a61d21b6f5590b5f8a473ec0ad9206f7 | Checkpoint C1.216 y reglas acumulativas; se agrega C1.217. |
| METODOLOGIA_DESARROLLO.md | cf796728bb384a32537392df2f9c72a339fa03ee | Inicio/commit/checkpoint (11-18); auditoría manual (50-51, 372-410); plan (311-372); tareas derivadas (545-570); cierre (789-813). |
| AUDITORIAS/README.md | 2f649c6ffc39ec7cdd242e85cb71b4344fd69e34 | Ubicación de informes, tareas derivadas y exclusión de Pendientes.md. |

## 3. Matriz de requisitos y criterios

| Requisito/criterio | Resultado | Evaluación |
|---|---|---|
| Optimizar lecturas y llamadas a Sheets en admisiones y portal familiar | **NO CUMPLE** | getAdmissionRequests lee el rango completo; getGuardianStudents y getGuardianApplicants leen hojas completas y filtran en memoria. |
| Caché selectiva de grados, requisitos documentales y ofertas, TTL 10 min | **PARCIAL** | getAcademicOffers cachea ofertas 600 s. No se acredita caché equivalente para catálogos de grados/requisitos. manageInstitutionalDataCache solo informa una política de 12 h para catálogos. |
| Paginación servidor page/pageSize que evite miles de filas por petición | **PARCIAL** | Existe slicing por página, pero la UI de Secretaría no envía page/pageSize; por defecto devuelve todas las solicitudes. El backend también lee y filtra toda la hoja antes del slicing. |
| Invalidación inmediata al cambiar estado, cupos o revocar vínculo familiar | **NO CUMPLE** | updateAdmissionStatus y revokeFamilyLink no invocan invalidación. createAcademicOffer solo elimina algunas claves; purgeSecurityCaches solo purga claves de seguridad, no el catálogo offers_v2. |
| Promise.all para llamadas paralelas del portal familiar | **CUMPLE ESTÁTICAMENTE** | initFamilyStudentSwitcher llama getGuardianStudents y getGuardianApplicants mediante Promise.all. No se midió su latencia real. |
| Límites de tamaño de petición y rate limiting en endpoints públicos | **NO CUMPLE** | Los doPost revisados parsean e interpretan el cuerpo sin límite de tamaño de aplicación ni control de frecuencia por actor/IP/acción. |
| Advertencias si endpoint de admisión supera 2.000 ms | **PARCIAL** | getAdmissionRequests registra LATENCY_THRESHOLD_EXCEEDED; no se instrumentan de igual forma las consultas familiares ni otros endpoints relevantes. |
| Criterio: lista de solicitudes paginada sin retraso visual | **NO CUMPLE** | loadAdmissionRequestsList solicita {} y conserva toda la respuesta en allAdmissionRequests; filtros posteriores son locales. |
| Criterio: catálogos desde caché y menos lecturas | **PARCIAL** | Se demuestra caché de ofertas; no hay evidencia suficiente de caché de grados y requisitos. |
| Criterio: invalidación en tiempo real al actualizar admisión | **NO CUMPLE** | updateAdmissionStatus actualiza hoja e historial, pero no invalida caché. |
| Criterio: portal familiar menor de 1,5 s | **NO VERIFICADO** | Promise.all está presente, pero no existe benchmark o medición reproducible; ambos endpoints leen múltiples rangos completos. |
| Criterio: pruebas de estrés sin corrupción de datos | **NO CUMPLE** | No hay suite F5-020 ni pruebas conductuales de estrés/concurrencia/integridad. |

## 4. Hallazgos técnicos

### H1 - ALTO/P1: el consumidor de Secretaría no activa la paginación

getAdmissionRequests (ACADEMIC:1113-1175) desestructura page, pageSize y fetchAll. Solo aplica slicing cuando fetchAll no es true y page !== undefined. loadAdmissionRequestsList (js/secretary.js: aprox. 8-25) invoca fetchApi('ACADEMIC', 'getAdmissionRequests', {}) sin page ni pageSize. Por tanto, el backend deja paginatedRows igual a todas las filas, fija limit al totalRecords y devuelve la colección completa. La UI almacena toda la respuesta en window.allAdmissionRequests y filtra localmente.

**Impacto:** la paginación implementada no protege el flujo real de Secretaría; la respuesta sigue creciendo con el volumen de solicitudes y contradice el criterio de no traer miles de filas en una petición.

### H2 - ALTO/P1: la paginación lee la hoja completa y no valida límites de página

Antes de filtrar o paginar, getAdmissionRequests ejecuta getOrCreateSheet(...).getDataRange().getValues().slice(1). Después aplica filtros sobre el arreglo completo y solo entonces utiliza slice. El trabajo de lectura y memoria sigue siendo O(N) por llamada. pageNum y limit proceden de parseInt sin límites superiores ni validación de enteros positivos; pageSize negativo puede producir totalPages/slice incoherentes y un tamaño arbitrariamente grande puede anular el beneficio. No se establece un pageSize máximo ni orden estable explícito.

**Impacto:** la paginación limita únicamente el tamaño de respuesta cuando el cliente la solicita; no limita lecturas de Sheets, memoria ni coste de filtrado. Los parámetros extremos pueden degradar el servicio.

### H3 - MEDIO/P2: la caché de catálogos está incompleta y el gestor de caché no implementa la política declarada

getAcademicOffers (ACADEMIC:6132-6177) usa CacheService y TTL 600 segundos para ofertas. No se encontró aplicación equivalente de esta política a catálogos de grados o requisitos documentales dentro del alcance inspeccionado. manageInstitutionalDataCache (USER:156-185) solo invalida caché de rol cuando recibe INVALIDATE_USER; FLUSH_GLOBAL únicamente registra un evento y devuelve éxito sin limpiar cachés globales. El objeto cachePolicies informa CATALOGS_TTL como 43200 segundos (12 horas), no 600 segundos.

**Impacto:** solo una parte de los catálogos solicitados reduce lecturas; la política reportada no coincide con el TTL requerido y la acción FLUSH_GLOBAL comunica una purga que no ejecuta.

### H4 - ALTO/P1: invalidación incompleta y desconectada de los cambios de admisión y vínculos

createAcademicOffer elimina la clave exacta offers_v2_{ano}_{grado}_{seccion} y la clave global offers_v2_ALL_ALL_ALL, además de claves legacy. No invalida claves agregadas intermedias (por ejemplo, año+grado sin sección, año sin grado o grado sin año), que pueden seguir sirviendo datos antiguos. updateAdmissionStatus (ACADEMIC:1928-2050) cambia estado y registra historial, pero no invoca purga de caché. revokeFamilyLink (USER:3442-3462) marca el vínculo como Revocada y registra evento, pero no invoca purgeSecurityCaches ni invalida caché relacionada. purgeSecurityCaches (ACADEMIC:3702-3745) elimina user_role, acct_state, delegations, perm_matrix, dynamic_perms y revoked_session; no elimina offers_v2 ni cachés de catálogos de admisión. El enrutamiento del endpoint no demuestra que la invalidación se ejecute automáticamente desde las mutaciones.

**Impacto:** vistas de ofertas pueden quedar obsoletas según la combinación de filtros; los cambios de estado y revocaciones no disponen de un mecanismo de invalidación inmediata demostrado. La acción genérica de purga no cubre las claves de datos de F5-020.

### H5 - MEDIO/P2: las consultas del portal familiar siguen leyendo conjuntos completos

getGuardianStudents (USER:3480-3580) lee completos ExpedientesEstudiantes, Usuarios y RelacionesFamiliares y después filtra/mapea en memoria. getGuardianApplicants (USER:3583-3627) lee Usuarios y toda SolicitudesAdmision antes de filtrar por responsable. No se observa paginación ni caché de resultados/catálogos en estos handlers. initFamilyStudentSwitcher (student.js:184-215) sí utiliza Promise.all para iniciar ambas llamadas en paralelo, por lo que se considera cumplido el requisito de paralelismo a nivel de cliente; esto no reduce la cantidad de filas leídas por cada endpoint.

**Impacto:** el paralelismo puede reducir el tiempo total frente a llamadas secuenciales, pero el coste de Sheets continúa escalando con el tamaño de las hojas. No existe evidencia de que la consulta familiar cumpla el objetivo de 1,5 segundos.

### H6 - ALTO/P1: no hay límites de tamaño de petición ni rate limiting en los puntos de entrada revisados

Los doPost de ACADEMIC (671-700) y USER (1351-1375) verifican que exista e.postData.contents y ejecutan JSON.parse directamente. Antes de parsear y despachar no se observa comprobación de longitud/tamaño del cuerpo, límite de elementos/campos, cuota por usuario/acción ni control de frecuencia. js/api.js (11-190) serializa el payload directamente en el body y no aplica límite de tamaño. La idempotencia y protección anti-replay existentes no equivalen a rate limiting: impiden duplicación/replay bajo determinadas condiciones, pero no limitan la frecuencia de solicitudes distintas.

**Impacto:** endpoints públicos pueden recibir cuerpos excesivos o ráfagas de solicitudes; se incrementa el riesgo de consumo de cuota, memoria y tiempo de ejecución.

### H7 - MEDIO/P2: monitoreo de latencia parcial y timeout configurable ignorado por fetchApi

getAdmissionRequests mide duración y registra LATENCY_THRESHOLD_EXCEEDED si supera 2.000 ms. No se observa la misma instrumentación en getGuardianStudents/getGuardianApplicants, pese al criterio de 1,5 segundos del portal familiar. fetchApi establece un timeout fijo de 60.000 ms y no utiliza options.timeout; sin embargo, checkMicroserviceHealth invoca fetchApi con options.timeout:6000. El límite específico esperado por el consumidor se ignora.

**Impacto:** la observabilidad no cubre los endpoints familiares y el cliente puede permanecer esperando hasta 60 segundos aunque el llamador solicite 6 segundos. No hay distribución de latencias ni medición de percentiles que sustente las metas de rendimiento.

### H8 - ALTO/P1: no existe evidencia de pruebas de estrés o integridad específicas para F5-020

Las suites existentes inspeccionadas son academic-grading-suite.js (412 líneas) y modular-dashboard-suite.js (61 líneas). No contienen casos de paginación de admisiones, límites de pageSize, invalidación por transición de estado/revocación, rate limiting, límites de payload, consultas paralelas familiares, umbrales de latencia ni pruebas de estrés/concurrencia sobre solicitudes. academic-grading-suite.js contiene una aserción textual sobre la presencia de offers_v2_ y cache.remove; esto verifica cadenas de código, no el comportamiento de expiración/invalidez. No se encontró una suite dedicada F5-020.

**Impacto:** los criterios de estrés e integridad marcados [x] carecen de respaldo conductual reproducible. No se puede afirmar que la optimización no corrompa datos bajo concurrencia.

## 5. Dictamen

**TAREA-F5-020 NO CUMPLE.**

Hay implementación parcial: getAdmissionRequests tiene paginación por slicing y advertencia de 2.000 ms; getAcademicOffers usa caché de 600 segundos; createAcademicOffer intenta invalidar claves; el portal familiar usa Promise.all. No obstante, el consumidor real de Secretaría no solicita páginas, el backend lee la hoja completa antes de paginar, la caché no cubre todos los catálogos, el gestor de caché declara 12 horas y no ejecuta FLUSH_GLOBAL, la invalidación no se integra con cambios de estado ni revocaciones, las consultas familiares leen hojas completas, faltan límites de payload y rate limiting, el monitoreo es parcial y no hay pruebas de estrés.

La tarea aparece [X] completada en completadas.md, pero el estado administrativo no está respaldado por la implementación observada.

## 6. Pruebas ejecutadas y limitaciones

**Ejecutadas:**
- Verificación de checkpoint C1.216, HEAD de rama de trabajo/base y comparación Git.
- Verificación de ausencia del informe individual F5-020 en árbol e historial.
- Inspección de requisitos y criterios en completadas.md y registro declarado en ChangesLogs.txt.
- Inspección manual de getAdmissionRequests, getAcademicOffers, createAcademicOffer, updateAdmissionStatus, checkEnrollmentCapacity, purgeSecurityCaches y doPost.
- Inspección manual de manageInstitutionalDataCache, revokeFamilyLink, getGuardianStudents, getGuardianApplicants y doPost.
- Inspección manual de fetchApi, loadAdmissionRequestsList y Promise.all del portal familiar.
- Inspección de las dos suites de regresión disponibles.
- Verificación de SHA de respaldo de código y documentos.

**No ejecutadas:**
- No se ejecutó Apps Script ni llamadas HTTP a despliegues.
- No se consultaron hojas productivas ni volúmenes reales.
- No se midió latencia real, p50/p95/p99 ni se verificó el objetivo familiar de 1,5 s.
- No se ejecutaron pruebas de estrés, concurrencia, rate limiting o integridad de datos.
- No se generaron payloads de gran tamaño ni ráfagas de solicitudes.
- No se ejecutaron las suites automatizadas; no existe suite F5-020 dedicada.
- No se validó el comportamiento de CacheService en producción ni expiración real.
- No se modificó código, pruebas ni datos.

## 7. Tareas ejecutables derivadas de los hallazgos

Todas las tareas siguientes son locales a TAREA-F5-020. Las causas transversales existentes deben ampliarse por referencia cuando corresponda; no se crean IDs globales duplicados.

### F5-020-A01 - Conectar la paginación del backend con la interfaz de Secretaría

- **Hallazgos de origen:** H1.
- **Severidad:** Alto.
- **Objetivo:** hacer que la carga habitual de solicitudes utilice páginas acotadas y no reciba la colección completa.
- **Acción ejecutable:** actualizar loadAdmissionRequestsList y los controles de tabla para enviar page/pageSize, consumir metadatos pagination y solicitar la página siguiente/anterior; conservar filtros y búsqueda sin descargar todo el universo.
- **Archivos/módulos afectados:** js/secretary.js; dashboard-secretaria.html; backend/academic-service/Code.gs.
- **Dependencias y riesgos:** filtros por año/grado/estado/búsqueda; métricas deben provenir de agregados o metadatos y no de la página parcial; compatibilidad con consumidores que necesiten explícitamente fetchAll.
- **Alcance:** no eliminar fetchAll sin migrar consumidores; no presentar métricas globales calculadas únicamente sobre la página visible.
- **Criterios de aceptación:** todas las llamadas de listado normal incluyen page y pageSize; cada respuesta contiene como máximo el tamaño solicitado; navegación y filtros mantienen resultados correctos; el modo completo solo se usa por una operación autorizada y explícita.
- **Prioridad:** P1.
- **Estado:** Pendiente.
- **Evidencia de cierre:** pendiente.

### F5-020-A02 - Hacer eficiente y acotada la consulta paginada de admisiones y portal familiar

- **Hallazgos de origen:** H2 y H5.
- **Severidad:** Alto.
- **Objetivo:** reducir lecturas, memoria y coste de filtrado a medida que crecen las hojas.
- **Acción ejecutable:** validar page/pageSize como enteros positivos, aplicar pageSize máximo, definir orden estable y estrategia de consulta que evite materializar innecesariamente todas las filas; optimizar getGuardianStudents/getGuardianApplicants mediante lecturas por rango/columnas necesarias, índices o agregados y límites de resultados.
- **Archivos/módulos afectados:** backend/academic-service/Code.gs; backend/user-service/Code.gs; js/secretary.js; js/student.js.
- **Dependencias y riesgos:** esquema y encabezados de SolicitudesAdmision, Usuarios, ExpedientesEstudiantes y RelacionesFamiliares; evitar que una optimización omita solicitudes o vínculos válidos.
- **Alcance:** no introducir caché de datos personales o relaciones sin política de aislamiento, invalidación y autorización; no cambiar reglas de acceso.
- **Criterios de aceptación:** pageSize fuera de rango se rechaza o normaliza de forma documentada; las lecturas se limitan al rango/índice necesario; filtros y totales coinciden con fixtures conocidos; consultas familiares devuelven exactamente los vínculos autorizados.
- **Prioridad:** P1.
- **Estado:** Pendiente.
- **Evidencia de cierre:** pendiente.

### F5-020-A03 - Completar la caché de catálogos estáticos y corregir el gestor de políticas

- **Hallazgos de origen:** H3.
- **Severidad:** Medio.
- **Objetivo:** cachear los catálogos estáticos solicitados con TTL uniforme de 600 segundos y políticas reales.
- **Acción ejecutable:** identificar endpoints de grados y requisitos documentales; implementar claves versionadas/segmentadas y CacheService TTL 600; corregir manageInstitutionalDataCache para que INSPECT reporte estado real y FLUSH_GLOBAL invalide las claves de catálogo que administra, o devuelva error si no puede hacerlo; alinear cachePolicies.CATALOGS_TTL a 600s.
- **Archivos/módulos afectados:** backend/academic-service/Code.gs; backend/user-service/Code.gs; endpoints de catálogo de grados, requisitos y ofertas académicas.
- **Dependencias y riesgos:** cambios de catálogos, límites de tamaño de CacheService, serialización JSON y aislamiento por institución/año/grado.
- **Alcance:** no cachear datos personales ni financieros como catálogos; no informar éxito de purga si no se ejecutó.
- **Criterios de aceptación:** cada catálogo elegible tiene TTL comprobable de 600 s; una lectura repetida no consulta Sheets mientras la clave siga vigente; la expiración o purga fuerza lectura nueva; INSPECT/FLUSH_GLOBAL reflejan resultado real.
- **Prioridad:** P2.
- **Estado:** Pendiente.
- **Evidencia de cierre:** pendiente.

### F5-020-A04 - Centralizar y completar la invalidación de caché ante mutaciones

- **Hallazgos de origen:** H4.
- **Severidad:** Alto.
- **Objetivo:** evitar datos obsoletos tras cambios de admisión, cupos/ofertas y vínculos familiares.
- **Acción ejecutable:** definir un catálogo central de claves/patrones; invalidar claves relacionadas tras updateAdmissionStatus, mutaciones de capacidad/ofertas y revokeFamilyLink; cubrir variantes parciales de filtros y claves legacy; conectar los eventos interservicio sin convertir una falla de purga en éxito silencioso.
- **Archivos/módulos afectados:** backend/academic-service/Code.gs; backend/user-service/Code.gs; funciones updateAdmissionStatus, createAcademicOffer, operaciones de cupos y revokeFamilyLink; purgeSecurityCaches.
- **Dependencias y riesgos:** CacheService por servicio, contratos interservicio, revocación y privacidad; las purgas deben ser seguras e idempotentes.
- **Alcance:** no purgar arbitrariamente cachés no relacionadas; no depender únicamente de TTL cuando el requisito exige invalidación inmediata.
- **Criterios de aceptación:** pruebas muestran que un cambio de estado, una modificación de cupo/oferta y una revocación hacen que la siguiente lectura refleje los datos nuevos; se cubren filtros exactos y parciales; un fallo de invalidación queda registrado y no se reporta como purga exitosa.
- **Prioridad:** P1.
- **Estado:** Pendiente.
- **Evidencia de cierre:** pendiente.

### F5-020-A05 - Implementar límites de payload y rate limiting en los microservicios

- **Hallazgos de origen:** H6.
- **Severidad:** Alto.
- **Objetivo:** proteger endpoints públicos y recursos Apps Script frente a cuerpos excesivos y ráfagas.
- **Acción ejecutable:** establecer máximo de bytes y estructura/campos por acción antes del parseo o procesamiento pesado; implementar rate limiting por identidad autenticada y clave de origen disponible, con ventanas y límites diferenciados para endpoints públicos; devolver errores controlados (413/429 o códigos equivalentes) y registrar eventos sin almacenar secretos.
- **Archivos/módulos afectados:** backend/academic-service/Code.gs; backend/user-service/Code.gs; js/api.js.
- **Dependencias y riesgos:** limitaciones del entorno Apps Script, CacheService/LockService, acciones públicas, falsificación de cabeceras y llamadas legítimas concurrentes.
- **Alcance:** no confiar exclusivamente en identificadores de usuario suministrados por el cliente; no bloquear operaciones normales por límites globales demasiado estrictos.
- **Criterios de aceptación:** cuerpos por encima del límite se rechazan antes del despacho; límites se aplican por actor/acción y para anónimos con una clave segura disponible; ráfagas excedentes reciben respuesta controlada; peticiones legítimas dentro de cuota siguen funcionando; logs no contienen tokens.
- **Prioridad:** P1.
- **Estado:** Pendiente.
- **Evidencia de cierre:** pendiente.

### F5-020-A06 - Instrumentar latencia de admisiones y portal familiar y respetar timeout configurable

- **Hallazgos de origen:** H7.
- **Severidad:** Medio.
- **Objetivo:** medir el rendimiento de todos los endpoints críticos y aplicar los límites solicitados por el consumidor.
- **Acción ejecutable:** instrumentar getGuardianStudents/getGuardianApplicants y demás endpoints de admisión con duración y umbral de 2.000 ms; medir latencia extremo a extremo del portal familiar y percentiles; hacer que fetchApi utilice options.timeout cuando esté definido y conserve un default documentado.
- **Archivos/módulos afectados:** backend/academic-service/Code.gs; backend/user-service/Code.gs; js/api.js; js/student.js.
- **Dependencias y riesgos:** logStructuredEvent, timeout AbortController, reintentos, llamadas paralelas y condiciones de red.
- **Alcance:** no registrar PII/token en métricas; no confundir latencia del servidor con round-trip de cliente.
- **Criterios de aceptación:** cada endpoint objetivo registra duración; alertas aparecen por encima de 2.000 ms; timeout 6.000 ms del health check se respeta; mediciones reproducibles demuestran portal familiar <1.500 ms bajo la carga normal definida.
- **Prioridad:** P2.
- **Estado:** Pendiente.
- **Evidencia de cierre:** pendiente.

### F5-020-A07 - Crear pruebas conductuales de paginación, caché, límites, concurrencia y estrés

- **Hallazgos de origen:** H1-H8.
- **Severidad:** Alto.
- **Objetivo:** demostrar que la optimización mejora tiempos sin pérdida ni corrupción de registros.
- **Acción ejecutable:** crear suite dedicada con fixtures y pruebas de integración que cubran paginación real, filtros, pageSize extremos, invalidación por mutaciones, TTL, purga global, portal familiar paralelo, rate limiting, payload máximo, timeout y carga/concurrencia; medir tiempos y verificar integridad antes/después.
- **Archivos/módulos afectados:** tests/regression/ (nueva suite F5-020); backend/academic-service/Code.gs; backend/user-service/Code.gs; js/api.js; js/secretary.js; js/student.js.
- **Dependencias y riesgos:** entorno de pruebas aislado, mocks fieles de SpreadsheetApp/CacheService/LockService y mediciones de navegador; no ejecutar estrés sobre datos productivos.
- **Alcance:** las pruebas deben verificar resultados y efectos observables, no solo buscar cadenas en el código.
- **Criterios de aceptación:** suite cubre escenarios normales, límites y fallos; no hay solicitudes duplicadas/perdidas en concurrencia; caché nunca devuelve datos revocados/obsoletos después de purga; se documentan latencias y volumen; no hay mutación de datos por consultas.
- **Prioridad:** P1.
- **Estado:** Pendiente.
- **Evidencia de cierre:** pendiente.

## 8. Cierre

- Resultado: auditoría TAREA-F5-020 finalizada; dictamen **NO CUMPLE**.
- Hallazgos: H1-H8.
- Tareas locales: F5-020-A01..A07, todas Pendientes; no se implementaron.
- Reconciliación: los hallazgos son específicos de F5-020; reutilizar el sistema existente de logs/locks/cache, sin crear IDs globales duplicados. Coordinar con F5-019-A06 por lecturas completas y coste de consultas; no duplicar sus tareas de métricas funcionales.
- Archivos documentales modificados: AUDITORIAS/AUDITORIA_COMPLETADAS_TAREA-F5-020.md (nuevo); AUDITORIAS/Auditoria.txt; AUDITORIAS/MapaDependencias.md; AUDITORIAS/AUDITORIA_COMPLETADAS_PLAN.md; AUDITORIAS/Contexto_personal.txt.
- Archivos no modificados: backend/academic-service/Code.gs; backend/user-service/Code.gs; js/api.js; js/secretary.js; js/student.js; tests/*; completadas.md; ChangesLogs.txt; METODOLOGIA_DESARROLLO.md; AUDITORIAS/README.md; rama base.
- Pendientes.md no se consultó ni modificó, conforme a la metodología vigente y AUDITORIAS/README.md.
- Proceso: auditoría/documentación exclusivamente; no se implementó código. Un único commit consolidado contiene los cinco documentos. El SHA de cierre se confirma externamente después de publicar; no se autorreferencia dentro del checkpoint.
- Siguiente tarea exacta: TAREA-F5-021. Antes de auditar, verificar su entrada en completadas.md, buscar informe individual e historial de esa ruta, y consultar ChangesLogs.txt para identificar los componentes declarados. No iniciar desde una suposición sobre su estado o archivos.

## 9. Referencias de implementación inspeccionadas

- ACADEMIC getAdmissionRequests: líneas 1113-1175; lee getDataRange completo, filtra, pagina solo si page está definido y no fetchAll; no valida límites.
- ACADEMIC updateAdmissionStatus: líneas 1928-2050; transición y log, sin invalidación.
- ACADEMIC getAcademicOffers/createAcademicOffer: líneas 6132-6218; TTL 600 y purga parcial de claves.
- ACADEMIC purgeSecurityCaches: líneas 3702-3745; purga claves de seguridad, no offers_v2.
- ACADEMIC doPost: líneas 671-700; parsea cuerpo sin límite de tamaño/rate limiting.
- USER manageInstitutionalDataCache: líneas 146-185; INVALIDATE_USER y FLUSH_GLOBAL de solo log; política declarada CATALOGS_TTL 43200s.
- USER revokeFamilyLink: líneas 3442-3462; actualiza vínculo, sin llamada de purga.
- USER getGuardianStudents/getGuardianApplicants: líneas 3480-3627; lecturas completas de hojas.
- USER doPost: líneas 1351-1375; parseo sin límite de tamaño/rate limiting.
- js/api.js fetchApi: líneas 11-190; timeout fijo 60s; options.timeout no aplicado.
- js/secretary.js loadAdmissionRequestsList: líneas 8-25; fetchApi con {} y filtros locales.
- js/student.js initFamilyStudentSwitcher: líneas 184-215; Promise.all para dos endpoints familiares.
