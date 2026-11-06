# Auditoría de tareas completadas - T-UX-12

**Fecha:** 2026-11-05  
**Repositorio:** i-miss-cocaine/IMA  
**Rama de trabajo:** NG_beta_0.0.0.1_work  
**Rama base protegida:** NG_beta_0.0.0.1  
**HEAD de partida:** 05eb016f4ba1e149111091b47ed72ad97520e37d  
**Árbol de partida:** 7511da6a2db0efc225f3cd9c3b680f6c7fa6616d  
**Tarea:** T-UX-12 - Consolidar los paneles de control por rol y departamento  
**Estado histórico:** [X] Completada en completadas.md.  
**Progreso de auditoría:** 53/183 identificadores auditados; 130 pendientes.

## Dictamen

**NO CUMPLE.** La implementación actual no demuestra que cada rol disponga de un panel funcional, alimentado por datos reales y contextualizados, con indicadores distintos de las listas operativas y accesos directos efectivos. Los módulos Estudiante, Docente y Contabilidad contienen helpers de resumen que no están conectados a los paneles; el resumen contable sigue siendo un placeholder estático. Dirección y Coordinación presentan indicadores que permanecen en cero o declaran ausencia de pendientes sin consultar los datos requeridos. Recursos Humanos consume una estructura de respuesta incompatible con la que devuelve el backend, por lo que la lista y el contador de vacaciones no se actualizan. Además, los endpoints de expedientes y solicitudes laborales permiten que un empleado autenticado consulte datos de otros empleados mediante consultas sin aislamiento en servidor.

La tarea está marcada [X], pero los criterios de aceptación sobre panel por rol, indicadores válidos, diferenciación entre cero y no disponible, accesos reales y permisos efectivos no se cumplen.

## Reconciliación histórica y tareas posteriores

- El checkpoint C1.51 identifica T-UX-12 como la siguiente tarea. No se encontró una auditoría previa específica de T-UX-12 en Auditoria.txt, MapaDependencias.md ni en los resultados anteriores del plan.
- completadas.md contiene la tarea T-UX-12 en la secuencia principal (líneas 679-695) y vuelve a referenciarla en el índice/listado histórico. No se encontró una modificación posterior de sus criterios originales.
- **T-UX-16** amplía el centro de notificaciones, tareas pendientes y aprobaciones. Su alcance es relacionado, pero no sustituye los indicadores consolidados por panel ni corrige los contratos de datos aquí observados.
- **T-UX-13 / TASK-483** cubre menú y navegación por rol; no demuestra que el contenido del panel, los indicadores o los accesos de cada rol sean funcionales.
- **T-UX-17 / TASK-479** trata la protección de cambios no guardados; no afecta los defectos de resumen identificados.
- **T-UX-20** cubre adaptación móvil, no la integridad de las métricas.
- **F8-Task12** (antes TAREA-AD-07, completadas.md alrededor de la línea 5049) añade una consola administrativa de roles y responsabilidades. La implementación dinámica asociada no sustituye T-UX-12: el backend usa un mapa fijo de seis roles y un fallback docente para cualquier rol no listado; el frontend representa “Acceder” como un span sin navegación real.
- TAREA-04 y T-UX-16 son dependencias relacionadas; se conservan sus alcances sin duplicarlos.
- No se modificó completadas.md ni se cambió el estado histórico [X] de T-UX-12.

## Evidencia por panel y módulo

### 1. Estudiante, Docente y Contabilidad

**Estudiante**
- Archivo: `js/student.js`, SHA `e2888cea60322e49a40b89adadb8010489605dcc`.
- Líneas 5-19: `consolidateStudentDashboardSummary` solo está declarado; no se encontró una llamada en el propio módulo ni en `student-dashboard.html`.
- El helper calcula pendientes con `!a.entregado`, pero el flujo de actividades maneja las entregas mediante el objeto `actividad.entrega` y sus estados. El helper no refleja el modelo que el módulo utiliza realmente.
- `student-dashboard.html`, SHA `6379ea0ed39d71b89747a0280bb925fdf12202c1`, organiza actividades, progreso, finanzas y guías, pero no integra ese resumen consolidado en un componente visible.
- Calidad: además de no estar integrado, el helper puede contar incorrectamente las actividades entregadas si se conecta sin adaptar el contrato; también mezcla el total de actividades con un campo llamado totalTasks sin distinguir exámenes.

**Docente**
- Archivo: `js/teacher.js`, SHA `c475fce5afcd28fca23e7b64398ad32b17773746`.
- Líneas 117-134: `consolidateTeacherDashboardSummary` solo está declarado; no se encontró consumidor en el módulo ni en `teacher-dashboard.html`.
- `teacher-dashboard.html`, SHA `cbb9e6a272a7d8ad33f99727303305d950533e71`, presenta como sección principal un control operativo de entregas con filtros y tabla (aprox. líneas 127-172). No se encontró un bloque de indicadores consolidados que muestre clases activas, entregas pendientes y estudiantes.
- El flujo de reportes obtiene estudiantes, tareas, exámenes y entregas para grado/sección seleccionados, pero ese resultado no se entrega al helper de resumen. No se demuestra que el resumen esté acotado a todas las asignaciones vigentes del docente autenticado ni que se integre a su panel principal.

**Contabilidad**
- Archivo: `js/accounting.js`, SHA `a79ead4a54ad6fdb2f1e9df4775491ff7191a0c7`.
- Líneas 10-24: `consolidateAccountingDashboardSummary` solo está declarado y no se encontró consumidor.
- Líneas 1802-1811: `renderResumenModule` solo inyecta un título y una descripción estática sobre ingresos, egresos, cuentas por cobrar e inventarios; no consulta datos ni muestra indicadores.
- `dashboard-contabilidad.html`, SHA `b7653b3bff71829f0f67cf47cb894413c56a444a`, contiene el contenedor del módulo, pero no define tarjetas de resumen financiero reales.
- El helper devuelve L 0.00 y cero facturas pendientes cuando `accountingData` es nulo o carece de campos. Eso convierte ausencia de datos en cero y contradice directamente el criterio de aceptación.

**Resultado conjunto:** los tres consolidadores no se integran a la experiencia real; el de Estudiante tiene un contrato de datos incoherente y el de Contabilidad además presenta valores cero ante datos ausentes. Se registra AUD-NG-190 / TASK-487.

### 2. Dirección, Coordinación y dashboard dinámico

**Dirección**
- Archivo: `dashboard-direccion.html`, SHA `fefaa3bf7884288aef563cfb8aaf244e6cea8b7c`.
- Líneas 62-73: `pending-approvals-count` inicia en cero y `approvals-list-container` contiene un mensaje estático de que no hay solicitudes.
- No se encontraron referencias a esos dos IDs en `js/secretary.js` ni `js/teacher.js`; tampoco se encontró llamada frontend a `getDiscountScholarshipRequests` desde los módulos cargados por este dashboard.
- El backend sí tiene `getDiscountScholarshipRequests` en `backend/accounting-service/Code.gs`, SHA `38b979d41596b85e888b4a7060b37bbac0840a28`, alrededor de las líneas 999-1027, y la matriz de permisos contempla acciones de solicitudes de becas/descuentos para Dirección. La existencia del endpoint no equivale a su integración en el panel.
- La ventana de analítica de admisiones no sustituye la bandeja de aprobaciones de Dirección.

**Coordinación**
- Archivo: `js/secretary.js`, SHA `08a81266957b4c18cc25f8ba6749eac30a8f2c2c`.
- Líneas 522-570: `loadCoordinatorDashboardData` obtiene `getCoordinatorOverview`, calcula docentes, ofertas y vacantes sin asignar, pero fija `metric-pending-syllabi` a `0 Pendientes` y muestra “Todas las jornalizaciones y sílabos están al día”.
- `backend/academic-service/Code.gs`, SHA `daf1883ec0b8d4f0ff2bc673af8a4e8c5bbd03fc`, líneas 6200-6224: `getCoordinatorOverview` devuelve ofertas, asignaciones y horarios; no devuelve el estado de sílabos/jornalizaciones que la interfaz declara haber verificado.
- `dashboard-coordinacion.html`, SHA `08de8e4eb150ee9f6aad536ca08e8f76f2e0e896`, presenta esos indicadores como métricas del panel.

**Dashboard dinámico / F8-Task12**
- `js/ui-common.js`, SHA `986938b8a311a41ed4cb3d135b66b6aaea4bed67`, líneas 5819-5863: `loadDynamicDashboard` presenta módulos autorizados como tarjetas, pero el texto “Acceder” es un `span` visual sin href, listener ni navegación.
- `backend/user-service/Code.gs`, SHA `12079dd410aa6d8afbce55a4bc62a79dea605f9f`, líneas 9254-9293: `getUserDynamicDashboardConfig` define un mapa estático de seis roles y utiliza `mod_mis_clases`/`mod_mis_horarios` como fallback genérico para roles no incluidos.
- `app/html/dashboards/dynamic-dashboard.html`, SHA `765a45e5666c24c430e841cb70c3d71d03cf9074`, carga el controlador dinámico, pero la configuración devuelta no prueba que los módulos configurados por responsabilidad se traduzcan en accesos funcionales.
- Esto deja sin cobertura dinámica específica a roles que no aparecen en el mapa y no acredita el acceso directo a operaciones reales.

Se registra AUD-NG-191 / TASK-488 para los paneles de Dirección, Coordinación y la cobertura dinámica por rol.

### 3. Recursos Humanos: contrato de datos

- Archivo: `dashboard-recursos-humanos.html`, SHA `406bedbae5a5bb3b5c03e4ea7aaa95ed68aea8ee`, líneas 2360-2415.
- `loadHRDashboardData` llama `getLeaveVacationRequests`, pero solo procesa la respuesta si existe `resLeaves.data`.
- Archivo: `backend/accounting-service/Code.gs`, SHA `38b979d41596b85e888b4a7060b37bbac0840a28`, líneas 8578-8606: `getVacationRequests` devuelve `{status:"success", solicitudes:[...]}`, no `data`.
- El backend entrega campos `tipo` y `expedienteId`; el HTML intenta leer `tipoSolicitud` y `userId`.
- `submitLeaveVacationRequest` crea solicitudes con estado `PendienteAprobacion`, mientras el contador del frontend compara solo con `Pendiente`.
- Por tanto, la lista y el contador de solicitudes no se actualizan con la respuesta del servicio; aun corrigiendo únicamente el nombre del arreglo, el estado y los campos seguirían sin coincidir.
- Se registra AUD-NG-192 / TASK-489.

### 4. Recursos Humanos: aislamiento de datos en servidor

- Archivo: `backend/accounting-service/Code.gs`, SHA `38b979d41596b85e888b4a7060b37bbac0840a28`.
- La matriz `ROLE_PERMISSIONS` concede a `Empleado` las acciones `getEmployeeRecords` y `getLeaveVacationRequests` (aprox. líneas 198-205).
- Líneas 420-432: `validateContextualAccess` aplica una comprobación contextual explícita para Estudiante/Alumno, pero no establece aislamiento equivalente para Empleado.
- Líneas 8152-8189: `getEmployeeRecords` aplica filtros opcionales por `userId`, `expedienteId` y estado laboral. Si no se proporciona filtro, devuelve todos los expedientes. Tampoco fuerza que `userId` coincida con `_verifiedUserId`.
- Líneas 8578-8606: `getVacationRequests` filtra solo si el cliente envía `expedienteId` o estado; si no hay filtro, devuelve todas las solicitudes. No resuelve el expediente del usuario autenticado.
- Un empleado con permiso para esas acciones puede omitir filtros o manipular IDs para consultar expedientes/solicitudes de otros empleados. La autorización por acción no reemplaza el aislamiento de registros.
- Se registra AUD-NG-193 / TASK-490. Clasificación Alto/P1 por exposición de información laboral entre usuarios autenticados.

## Hallazgos y tareas derivadas

- **AUD-NG-190 (ALTO/P1):** los resúmenes de Estudiante, Docente y Contabilidad no están integrados; el helper estudiantil usa un campo incompatible con el modelo real y el resumen contable es estático/convierte ausencia en cero. **TASK-487:** integrar indicadores operativos reales y sus accesos.
- **AUD-NG-191 (ALTO/P1):** Dirección y Coordinación muestran indicadores estáticos/falsos y el dashboard dinámico no proporciona cobertura ni navegación real para todos los roles. **TASK-488:** completar paneles e indicadores por rol.
- **AUD-NG-192 (ALTO/P1):** el panel de RR. HH. espera `data`, pero el backend devuelve `solicitudes`, además de discrepancias de campos y estados. **TASK-489:** corregir contrato de datos y representación.
- **AUD-NG-193 (ALTO/P1):** endpoints permitidos a Empleado devuelven expedientes y solicitudes sin aislamiento de identidad en servidor. **TASK-490:** restringir consultas al titular y mantener acceso global solo para roles administrativos autorizados.

## Calidad y límites de la inspección

- Se verificó que la Secretaría dispone de un flujo de métricas de admisiones conectado a `getAdmissionRequests` y `updateAdmissionMetricsCards`; no se registró un hallazgo por ese flujo específico.
- El panel de Coordinación calcula docentes, ofertas y vacantes desde el resumen disponible; el hallazgo se limita al indicador de sílabos/jornalizaciones que se fija manualmente en cero.
- No se presume que una tarjeta o endpoint existente demuestre un flujo funcional; se siguió cada referencia hasta el consumidor y la estructura de respuesta.
- Inspección estática/manual de funciones, contratos, permisos y dashboards. No se ejecutaron navegador, DOM real, llamadas API, Apps Script, Google Sheets, servicios externos ni operaciones productivas.
- No se modificó código fuente ni completadas.md. Los hallazgos se convirtieron en tareas en Pendientes.md.

## SHAs de respaldo

- `js/student.js`: e2888cea60322e49a40b89adadb8010489605dcc.
- `js/teacher.js`: c475fce5afcd28fca23e7b64398ad32b17773746.
- `js/accounting.js`: a79ead4a54ad6fdb2f1e9df4775491ff7191a0c7.
- `js/secretary.js`: 08a81266957b4c18cc25f8ba6749eac30a8f2c2c.
- `js/ui-common.js`: 986938b8a311a41ed4cb3d135b66b6aaea4bed67.
- `backend/accounting-service/Code.gs`: 38b979d41596b85e888b4a7060b37bbac0840a28.
- `backend/academic-service/Code.gs`: daf1883ec0b8d4f0ff2bc673af8a4e8c5bbd03fc.
- `backend/user-service/Code.gs`: 12079dd410aa6d8afbce55a4bc62a79dea605f9f.
- `dashboard-direccion.html`: fefaa3bf7884288aef563cfb8aaf244e6cea8b7c.
- `dashboard-recursos-humanos.html`: 406bedbae5a5bb3b5c03e4ea7aaa95ed68aea8ee.
- `dashboard-contabilidad.html`: b7653b3bff71829f0f67cf47cb894413c56a444a.
- `student-dashboard.html`: 6379ea0ed39d71b89747a0280bb925fdf12202c1.
- `teacher-dashboard.html`: cbb9e6a272a7d8ad33f99727303305d950533e71.
- `dashboard-coordinacion.html`: 08de8e4eb150ee9f6aad536ca08e8f76f2e0e896.
- `dashboard-secretaria.html`: fa0d8c23aace24a6acab2d4956398a7f5e1309b8.
- `app/html/dashboards/dynamic-dashboard.html`: 765a45e5666c24c430e841cb70c3d71d03cf9074.
- `completadas.md`: f57f1aef832e81e44fc4f7ec36a852d50e464676.
- `METODOLOGIA_DESARROLLO.md`: 214e8221bd076c4e89012636c105bffd5ca36467.
- `Pendientes.md` blob antes de registrar hallazgos: 4d4f07655166ebd44bb51e564cdefa3cc73112e2.
- `Pendientes.md` blob después de registrar hallazgos: 42999b169766bbfd10a2d3de02fc40fc937fc620.
- Commit que registró TASK-487..TASK-490: bcf8facf7e15bd2c512b8d1ec715aeb9d69f832e.

## Pruebas ejecutadas y no ejecutadas

- Ejecutado: inspección manual/estática de funciones, referencias, estructuras de respuesta, roles y dashboards.
- No ejecutado: navegador, DOM real, pruebas de interacción, APIs, Apps Script, consultas reales a Google Sheets, pruebas de permisos en entorno activo o suites automatizadas.
- Resultado: auditoría documental y estática; no se afirma verificación runtime.

