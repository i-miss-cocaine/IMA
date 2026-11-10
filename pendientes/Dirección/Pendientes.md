# Backlog consolidado — Dirección

**Estado operativo del Plan Maestro (reinicio global):** todas las tareas de este backlog quedan en estado `Pendiente` al inicio de la ejecución. Ninguna tarea se considera `Completada`; marcas, etiquetas o declaraciones históricas de cierre son únicamente antecedentes y no acreditan estado vigente. Una tarea solo podrá cambiar de estado tras su implementación y verificación conforme al Plan Maestro.

**Fuentes integradas:** informes de auditoría de `AUDITORIAS/`, `Pendientes.md`, `completadas.md` y los archivos departamentales preexistentes. Los registros con el mismo identificador se reúnen en una sola tarea.

**Integridad:** se conservan los requisitos originales sin resumen ni paráfrasis. Se eliminan líneas exactamente repetidas tras normalizar espacios/capitalización. Los títulos alternativos se conservan como referencia. Las fuentes originales se mantienen sin alteración para trazabilidad.

---

<!-- ID: F16-TASK01 | Fuentes: AUDITORIAS/AUDITORIA_FASE_16_RECURSOS_HUMANOS.md -->
### [ ] [F16-TASK01] Implementar el catálogo de roles internos organizativos y asignación de responsabilidades
- **Severidad:** Crítica (Gobernanza institucional y separación estricta de permisos vs responsabilidades)
- **Componentes Afectados:** `backend/user-service/Code.gs`, `backend/accounting-service/Code.gs`, `dashboard-recursos-humanos.html`, hoja `CatalogoRolesInternos`.
- **Descripción:** Crear la entidad `CatalogoRolesInternos` que permita parametrizar responsabilidades organizativas (Coordinador de Área, Encargado de Laboratorio, Jefe de Nivel, Orientador) con nombre, departamento, vigencia y suplentes, sin conceder permisos de acceso administrativo por defecto.
- **Criterios de Aceptación:** Se pueden crear roles internos desde el dashboard; el rol se asigna a empleados existentes con fechas de vigencia; un empleado puede tener múltiples responsabilidades; revocar un rol interno no borra el historial y no altera los permisos del rol de acceso en la plataforma.
- **Hallazgo de origen:** C.2, F.1, G.1, tabla E/F16-03, backlog H.1 y continuidad J.
- **Severidad:** Crítica. **Objetivo:** formalizar responsabilidades organizativas sin confundirlas con privilegios RBAC.
- **Acción ejecutable:** crear `CatalogoRolesInternos` con nombre, descripción, departamento, vigencia, suplencias y estado; habilitar alta/edición/asignación desde RR. HH.; permitir varias responsabilidades por empleado y revocación con historial; impedir que asignar un rol funcional otorgue permisos administrativos.
- **Archivos/módulos:** `backend/user-service/Code.gs`, `backend/accounting-service/Code.gs`, `dashboard-recursos-humanos.html`, `AsignacionesAmbitosRoles`, nueva hoja `CatalogoRolesInternos`.
- **Dependencias/riesgos:** identidad de empleados, catálogo de departamentos/cargos, fechas de vigencia y autorización; riesgo de elevación accidental de privilegios o asignaciones huérfanas.
- **Alcance:** catálogo y ciclo de vida de responsabilidades internas; no sustituir `ROLE_PERMISSIONS` ni la matriz ABAC.
- **Criterios de aceptación:** roles configurables desde UI; asignaciones a empleados existentes con inicio/fin; responsabilidades múltiples; revocación conserva historial; ninguna asignación funcional cambia privilegios RBAC.
- **Prioridad:** P0. **Estado:** Pendiente.
- **Reconciliación:** C1.82 vincula esta causa con AUD-NG-225/TASK-505; TASK-004 figura históricamente completada, pero su prueba solo comprobó presencia de símbolos. Mantener F16-Task01 como trazabilidad de origen y ampliar/verificar TASK-505; no implementar en paralelo.
- **Evidencia de cierre:** pendiente; no se declara ejecución ni verificación.

---

<!-- ID: F17-TASK01 | Fuentes: AUDITORIAS/AUDITORIA_FASE_17_PLANILLAS_COMPENSACIONES.md -->
### [ ] [F17-TASK01] Dinamizar el salario base desde los contratos laborales vigentes
- **Severidad:** Crítica (Integridad financiera y cálculo salarial exacto)
- **Componentes Afectados:** `backend/accounting-service/Code.gs` (`calculatePayrollPeriod`), `ContratosLaborales`.
- **Problema:** `calculatePayrollPeriod` utiliza una constante hardcodeada `const salarioBase = 22000;`, provocando que todos los colaboradores reciban el mismo salario en la nómina calculada.
- **Solución Propuesta:** Consultar la hoja `ContratosLaborales` filtrando por `expedienteId` y estado `active`/`Vigente` para tomar el `salarioBase` individual estipulado en el contrato laboral del empleado.
- **Criterios de Aceptación:** Cada empleado es procesado con su salario contractual real; si no tiene contrato vigente, se registra una advertencia y se excluye de la generación.
- **Hallazgo de origen:** secciones B.1, E.1, F.1 y G (P0); subcapacidad F17-01 de D.
- **Severidad:** Crítica. **Objetivo:** calcular cada planilla con las condiciones salariales contractuales reales de cada empleado.
- **Acción ejecutable:** consultar contratos vigentes por expediente y período; calcular proporcionalmente los intervalos cuando existan cambios de salario, ingresos o salidas dentro del mes; bloquear empleados sin contrato vigente y generar incidencias; resolver contratos sucesivos no superpuestos sin excluir erróneamente al empleado.
- **Archivos/módulos:** `backend/accounting-service/Code.gs`, `calculatePayrollPeriod`, `ContratosLaborales`, `ExpedientesLaborales`, `PlanillasNomenclatura`, `IncidenciasNomina`.
- **Dependencias/riesgos:** vigencia contractual, jornada, períodos de pago, historial de salarios y cálculo proporcional; riesgo de pagar salarios arbitrarios o excluir empleados válidos.
- **Alcance:** salario base ordinario de planilla; no modificar contratos ni recalcular períodos cerrados sin un proceso de rectificación.
- **Criterios de aceptación:** salario obtenido del contrato vigente para cada intervalo; prorrateo correcto ante altas, bajas y cambios contractuales; ausencia/solapamiento de contrato genera incidencia y no salario de respaldo; resultados reproducibles y auditables.
- **Prioridad:** P0. **Estado:** Pendiente (reapertura/ampliación).
- **Reconciliación:** TASK-007/F17-Task01 fue declarada completada el 2026-11-02, pero AUD-NG-019 identifica que contratos sucesivos no superpuestos dentro de un mismo período todavía excluyen al empleado. Ampliar TASK-007 con AUD-NG-019; no duplicar la implementación dinámica ya realizada.
- **Evidencia de cierre:** pendiente para AUD-NG-019; la implementación histórica de TASK-007 no acredita el requisito ampliado.

---

<!-- ID: F17-TASK02 | Fuentes: AUDITORIAS/AUDITORIA_FASE_17_PLANILLAS_COMPENSACIONES.md -->
### [ ] [F17-TASK02] Integrar novedades de asistencia, horas extras aprobadas y permisos sin goce en el cálculo de nómina
- **Severidad:** Crítica (Remuneración justa y cumplimiento de jornada)
- **Componentes Afectados:** `backend/accounting-service/Code.gs`, `AprobacionHorasExtras`, `DeduccionesAsistencia`.
- **Problema:** Las horas extras aprobadas en `AprobacionHorasExtras` y las ausencias/tardanzas en `DeduccionesAsistencia` no impactan automáticamente el total devengado ni deducido de la planilla del mes.
- **Solución Propuesta:** Sumarizar las horas extras aprobadas para el período e incorporarlas en `horasExtras` y `montoHorasExtras` aplicando los recargos legales del Art. 330 del Código del Trabajo (25% diurna, 50% nocturna). Deducir los días de permisos sin goce de sueldo en proporción a la jornada.
- **Hallazgo de origen:** secciones B.3, B.4, C (Art. 330), E.2, F.2 escenarios B/C y G (P0); subcapacidades F17-08, F17-09 y F17-10 de D.
- **Severidad:** Crítica. **Objetivo:** reflejar en la planilla todas las novedades laborales aprobadas y aplicables al período.
- **Acción ejecutable:** incorporar horas extras aprobadas, tardanzas/ausencias y permisos sin goce; aplicar recargos diferenciados según tipo de jornada (incluida la distinción 25%, 50% y 75% descrita en C); aplicar el tratamiento remunerativo/subsidio correcto a incapacidades médicas aceptadas por IHSS; mantener marca de procesamiento e idempotencia asociada al planillaId.
- **Archivos/módulos:** `backend/accounting-service/Code.gs`, `calculatePayrollPeriod`, `calculateOvertime`, `reviewOvertimeRequest`, `AprobacionHorasExtras`, `DeduccionesAsistencia`, `SolicitudesVacaciones`, `IncapacidadesMedicas`, `PlanillasNomenclatura`.
- **Dependencias/riesgos:** jornada y tarifa ordinaria, calendario, estados de aprobación, incapacidad IHSS, deducciones y recálculo; riesgo de pagos omitidos, descuentos indebidos o novedades consumidas sin importe.
- **Alcance:** novedades ordinarias del período; la amortización mensual de préstamos permanece en F17-Task06 y no debe duplicarse aquí.
- **Criterios de aceptación:** solo novedades aprobadas/vigentes se procesan; cada novedad se aplica una vez; horas extras usan recargo legal según categoría; permisos sin goce se prorratean; incapacidad aprobada no se trata como ausencia injustificada y registra importe/subsidio; se conserva trazabilidad del planillaId.
- **Prioridad:** P0. **Estado:** Pendiente (reapertura/ampliación).
- **Reconciliación:** TASK-008/F17-Task02 fue declarada completada el 2026-11-02. AUD-NG-020 detecta que incapacidades aprobadas pueden marcarse procesadas sin cálculo de subsidio ni tratamiento remunerativo. Además, el informe C distingue recargos 25/50/75 mientras el registro de TASK-008 describe un factor estándar 1.25. Ampliar TASK-008 con AUD-NG-020 y cerrar la discrepancia de recargos; no duplicar la integración inicial.
- **Evidencia de cierre:** pendiente para AUD-NG-020 y la cobertura completa de recargos/incapacidades.

---

<!-- ID: F25-TASK03 | Fuentes: AUDITORIAS/AUDITORIA_FASE_25_INTEGRACIONES_EXTERNAS.md -->
### [ ] [F25-TASK03] Detectar duplicados avanzados y validar integridad referencial antes de importar
- **Hallazgo de origen:** F25-004, sección F y G.3.
- **Severidad:** Crítica. **Objetivo:** evitar duplicados de personas y relaciones huérfanas en importaciones masivas.
- **Acción ejecutable:** ampliar `importDataWithColumnMapping` con búsqueda previa de DNI, correo y claves naturales según entidad; clasificar coincidencias exactas/posibles; validar referencias a grado, sección, departamento y expediente; ofrecer política explícita rechazar/actualizar/vincular.
- **Archivos/módulos:** `backend/accounting-service/Code.gs`, `importDataWithColumnMapping`, `validateImportPreview`, catálogos maestros y hojas destino.
- **Dependencias/riesgos:** F25-Task02, identificadores canónicos y políticas de merge; riesgo de fusionar personas distintas o duplicar expedientes.
- **Alcance:** detección y decisión previa; no fusionar registros automáticamente solo por nombre.
- **Criterios de aceptación:** DNI/correo normalizados y comparados; duplicados se muestran antes de escribir; referencias foráneas existen/están activas; política de conflicto seleccionada y auditada; importación repetida es idempotente; errores no dejan escritura parcial.
- **Prioridad:** P0. **Estado:** Pendiente.
- **Evidencia de cierre:** pendiente; el informe solo acredita validación de identificador obligatorio y solicita detección avanzada.

---

<!-- ID: F26-TASK01 | Fuentes: AUDITORIAS/AUDITORIA_FASE_26_CONFIGURACION_INSTITUCIONAL_PERSONALIZACION.md -->
### [ ] [F26-TASK01] Implementar motor central de precedencia y configuración jerárquica
- **Hallazgo de origen:** F26-002 y F26-010; secciones C.2/C.9, F.1 y G.1.
- **Severidad:** Alta / P0. **Objetivo:** resolver configuraciones de manera determinista respetando la precedencia Global → Institucional → Departamental → Personal.
- **Acción ejecutable:** definir un contrato único de configuración por clave, ámbito, institución, departamento y usuario; implementar resolución por capas, herencia, overrides permitidos y detección de conflictos; validar actor y ámbito en servidor; impedir que una configuración de menor alcance sobrescriba una de mayor alcance; proporcionar valores predeterminados seguros y explicar el origen efectivo de cada valor.
- **Archivos/módulos:** `backend/user-service/Code.gs` (`saveSystemConfiguration`, `getSharedConfigurationsCatalog`); `backend/developer-service/Code.gs` (`getCentralConfigAndContractCatalog`, `validateServiceConfigDependencies`); `ConfiguracionSistema`, nueva estructura de ámbitos/departamentos y consumidores de configuración.
- **Dependencias/riesgos:** jerarquía institucional y departamental canónica, RBAC/ABAC y contratos entre servicios; riesgo de fuga de configuración entre departamentos o escalamiento de privilegios.
- **Alcance:** resolución y persistencia de ámbitos; no permitir que el cliente determine su rol, institución o departamento mediante valores arbitrarios del payload.
- **Criterios de aceptación:** las cuatro capas se resuelven con precedencia documentada; claves admiten ámbitos explícitos; cada override registra actor/ámbito/versión; acceso se verifica server-side; conflictos se rechazan o resuelven con política determinista; pruebas cubren herencia, ausencia de valor, conflicto, aislamiento entre departamentos y usuario no autorizado.
- **Prioridad:** P0. **Estado:** Pendiente.
- **Evidencia de cierre:** pendiente; el informe solo identifica ámbitos GLOBAL y personal, sin una capa departamental formal ni herencia de cuatro niveles.

---

<!-- ID: F29-TASK17 | Fuentes: AUDITORIAS/AUDITORIA_FASE_29_MIGRACION_Y_TRANSICION.md -->
### [ ] [F29-TASK17] Migrar roles y permisos con aislamiento y privacidad verificables
- **Hallazgo de origen:** F29-09/F29-21; secciones C.9/C.21 y H.
- **Severidad:** Crítica / P0. **Objetivo:** trasladar cuentas y asignaciones de acceso sin conceder privilegios por defecto ni exponer datos entre instituciones/departamentos.
- **Acción ejecutable:** mapear roles legados a roles canónicos; validar relaciones de usuario, institución, departamento, familia y asignación docente; migrar permisos mínimos; suspender cuentas ambiguas hasta revisión; auditar accesos y revocar privilegios obsoletos.
- **Archivos/módulos:** `backend/user-service/Code.gs`, `ROLE_PERMISSIONS`, `Usuarios`, servicios Academic/Accounting y `AuditoriaMigraciones`.
- **Dependencias/riesgos:** F29-Task05/13, AUD-NG-001, AUD-NG-002, AUD-NG-036, AUD-NG-105/106/108/128/130/136/158; riesgo de escalamiento, IDOR y acceso cruzado.
- **Alcance:** migración de identidad/roles/relaciones; no confiar en rol del origen sin equivalencia revisada ni en userId/departamento del cliente.
- **Criterios de aceptación:** mapa de roles aprobado; permisos mínimos; relaciones contextuales verificadas; cuentas ambiguas bloqueadas; tokens/credenciales no se migran en claro; pruebas multiinstitución, familia, docente, usuario suspendido y privilegios heredados.
- **Prioridad:** P0. **Estado:** Pendiente.
- **Evidencia de cierre:** pendiente; la matriz H indica que usuarios/perfiles están parcialmente migrados y falta activación segura y verificación integral de permisos.

---

<!-- ID: F34-TASK02 | Fuentes: AUDITORIAS/AUDITORIA_FASE_34_BANDEJAS_REVISION_FIRMAS.md -->
### [ ] [F34-TASK02] Crear bandeja de salida departamental y acuses de entrega/lectura
- **Hallazgo de origen:** F34-02 y CAR-F34-02; PT-F34-05 no aprobado.
- **Severidad:** Crítica / P0. **Objetivo:** rastrear documentos enviados por Secretaría/Dirección y distinguir solicitud de envío, entrega, apertura y recepción formal.
- **Acción ejecutable:** crear `EntregasDocumentales` y `getDepartmentalOutbox` con documento, destinatario, emisor, departamento, canal, fecha, estado, acuse, hash y correlación; registrar entrega/apertura solo con evidencia verificable.
- **Archivos/módulos:** `backend/user-service/Code.gs`, `DocumentosEscolaresEmitidos`, `EntregasDocumentales`, bandejas de Secretaría/Dirección y notificaciones.
- **Dependencias/riesgos:** TASK-221/TASK-318 (bandejas), TASK-227 (eventos workflow), TASK-316 (canales); riesgo de afirmar lectura por simple apertura de enlace o exponer documentos a destinatarios equivocados.
- **Alcance:** bandeja de salida y acuses; no confundir entrega técnica con lectura humana ni con aceptación legal.
- **Criterios de aceptación:** estados diferenciados; destinatario/actor verificados; acuse con timestamp y hash del documento exacto; reintentos idempotentes; revocación/expiración de enlaces; filtros por departamento y documento; pruebas de entrega fallida, apertura, destinatario incorrecto y duplicados.
- **Prioridad:** P0. **Estado:** Pendiente.
- **Evidencia de cierre:** pendiente; no existe endpoint formal de salida ni registro de acuses.

---

<!-- ID: F39-TASK01 | Fuentes: AUDITORIAS/AUDITORIA_FASE_39_DIGITALIZACION_TRANSICION.md -->
### [ ] [F39-TASK01] Crear inventario documental legado y clasificación por departamento
- **Hallazgo de origen:** 3.1 y CAR-F39-01; ausencia de inventario físico/digital previo a la migración.
- **Severidad:** Crítica / P0. **Objetivo:** conocer qué documentos existen, dónde están, quién es responsable y cuál es su estado de digitalización.
- **Acción ejecutable:** crear `InventarioDocumentalLegado` con institución/departamento, tipo documental, origen físico/digital, ubicación, propietario, rango temporal, volumen, sensibilidad, estado, responsable y lote; permitir inventario manual y carga asistida.
- **Archivos/módulos:** `backend/developer-service/Code.gs`, `backend/user-service/Code.gs`, `InventarioDocumentalLegado`, dashboards de Secretaría/Dirección y `AuditoriaMigraciones`.
- **Dependencias/riesgos:** F29-Task13 (inventario/extracción), F37-Task06 (catálogo destinos), F35-ID-Task02 (ámbitos); riesgo de duplicar inventarios por departamento o incluir archivos sin autorización.
- **Alcance:** catálogo de documentos legados; no mover ni borrar originales durante la fase de inventario.
- **Criterios de aceptación:** identificador estable por documento/lote; departamento/propietario y ubicación registrados; clasificación y sensibilidad; estado inventariado/en revisión/migrado/rechazado; auditoría de cambios; pruebas de duplicados, ubicaciones faltantes y múltiples departamentos.
- **Prioridad:** P0. **Estado:** Pendiente.
- **Evidencia de cierre:** pendiente; el informe confirma que no existe una tabla consolidada de documentos tradicionales.

---

<!-- ID: TASK-004 | Fuentes: Pendientes.md ; pendientes/Dirección/Pendientes.md -->
### [ ] [TASK-004] Crear un catálogo dinámico de roles internos organizativos y administrar sus asignaciones
- **Origen del Hallazgo:** `AUDITORIA_FASE_16_RECURSOS_HUMANOS.md` / Sección F (Brecha F.1) y Sección H (P0)
- **Prioridad:** P0
- **Severidad/Clasificación:** Crítica (Gobernanza institucional, responsabilidades organizativas y separación estricta de permisos vs funciones)
- **Archivos Involucrados:**
  - `backend/user-service/Code.gs`
  - `backend/accounting-service/Code.gs`
  - `dashboard-recursos-humanos.html`
  - `AsignacionesAmbitosRoles`
  - Nuevo catálogo lógico `CatalogoRolesInternos`
- **Dependencias Expuestas:** `AsignacionesAmbitosRoles`, `CatalogoDepartamentos`, `AreasCurricularesExtensiones`, `ROLE_PERMISSIONS`
- **Descripción del Alcance:**
  La plataforma permite asignar ámbitos y responsabilidades mediante `assignRoleScope`, pero utiliza valores de `ScopeType` sin un catálogo formal que normalice las responsabilidades organizativas. No existe una interfaz completa para administrar estos roles internos, sus características, departamentos relacionados y vigencias. Esto puede provocar nombres duplicados, responsabilidades inconsistentes y dificultad para conocer qué personas ocupan cada función institucional.
  Requerimientos Funcionales Detallados:
  1. Catálogo administrable de responsabilidades internas:
     - Crear un catálogo formal para registrar: nombre de la responsabilidad, código interno único, descripción, departamento asociado (si aplica), área académica asociada (si aplica), tipo de responsabilidad (administrativa, académica, operativa o de supervisión), vigencia predeterminada, estado (activo o inactivo), responsable principal y posibilidad de suplencia.
     - Permitir crear responsabilidades personalizadas (ej. «Coordinador del Área de Informática», «Encargado de Laboratorio de Ciencias», «Responsable de Pastoral») sin modificar código duro.
     - Permitir editar la descripción y configuración de una responsabilidad sin alterar las asignaciones históricas.
  2. Asignación y ciclo de vida de responsabilidades:
     - Permitir asignar una responsabilidad a uno o varios empleados simultáneamente.
     - Permitir que un empleado ejerza varias responsabilidades institucionales a la vez sin duplicar su expediente laboral.
     - Establecer fechas de inicio y finalización para cada asignación con validación estricta de vigencia.
     - Registrar quién creó, autorizó, modificó o revocó cada asignación inmutablemente.
     - Permitir consultar las responsabilidades vigentes e históricas por empleado, departamento o área académica.
     - Detectar asignaciones incompatibles o duplicadas por errores tipográficos.
     - Permitir designar un suplente temporal con fechas de vigencia acotadas.
     - Permitir desactivar una responsabilidad sin borrar las asignaciones históricas.
  3. Separación obligatoria entre responsabilidad organizativa y permisos de acceso:
     - El catálogo no debe modificar ni sustituir `ROLE_PERMISSIONS`. Una responsabilidad como «Coordinador de Matemáticas» identifica una función institucional; no debe conceder automáticamente acceso administrativo global en la plataforma.
     - Si una responsabilidad necesita permisos específicos, la relación debe configurarse mediante una asociación explícita y verificable con los permisos existentes, limitada exclusivamente al ámbito asignado.
     - La plataforma debe distinguir nítidamente entre: persona con una responsabilidad, persona con autorización para realizar una operación, persona que supervisa una unidad, y persona que sustituye temporalmente a otra.
  4. Interfaz y adaptaciones técnicas:
     - Adaptar `assignRoleScope` para referenciar responsabilidades del catálogo formal en lugar de cadenas libres, conservando compatibilidad con las asignaciones previas.
     - Incorporar consola administrativa en `dashboard-recursos-humanos.html` con filtros por departamento, área, empleado, responsabilidad y vigencia.
- **Criterios de Aceptación:**
  - Se puede crear una responsabilidad nueva desde la interfaz sin alterar el código fuente.
  - El sistema genera o valida un identificador único persistente para cada responsabilidad.
  - No se permiten responsabilidades duplicadas por diferencias de mayúsculas, espacios o acentos normalizados.
  - Se puede asignar la misma responsabilidad a distintas personas cuando la configuración lo permita.
  - Se puede asignar más de una responsabilidad al mismo empleado conservando su expediente único.
  - Las fechas de vigencia se aplican correctamente y una asignación vencida deja de mostrarse como activa.
  - Un suplente temporal solo ejerce facultades durante el período expresamente autorizado.
  - Revocar una responsabilidad no elimina su historial ni destruye evidencias previas.
  - Crear o asignar una responsabilidad no concede permisos administrativos automáticamente en `ROLE_PERMISSIONS`.
  - Todas las operaciones quedan registradas con autor, fecha y justificación.
  - Las asignaciones existentes continúan funcionando tras la incorporación del catálogo.
- **Estado:** Pendiente

<!-- Fuente: RECUPERACION/Pendientes_RECUPERADO.md, líneas 808-856; clave TASK-005; asignación única: Dirección -->

---

<!-- ID: TASK-005 | Fuentes: Pendientes.md ; pendientes/Dirección/Pendientes.md -->
### [ ] [TASK-005] Implementar la asignación institucional de docentes a áreas académicas, independiente de la carga lectiva
- **Origen del Hallazgo:** `AUDITORIA_FASE_16_RECURSOS_HUMANOS.md` / Sección F (Brecha F.2) y Sección H (P0)
- **Prioridad:** P0
- **Severidad/Clasificación:** Crítica (Estructura académica institucional, comités pedagógicos y desacoplamiento de asignaturas)
- **Archivos Involucrados:**
  - `backend/academic-service/Code.gs`
  - `backend/accounting-service/Code.gs`
  - `AreasCurricularesExtensiones`
  - `CoordinacionesArea`
  - `AsignacionesDocentes`
  - Nueva entidad lógica `DocentesAreasAcademicas`
  - `dashboard-recursos-humanos.html`
- **Dependencias Expuestas:** `AreasCurricularesExtensiones`, `CoordinacionesArea`, `AsignacionesDocentes`, `ExpedientesLaborales`, `F16-Task01`
- **Descripción del Alcance:**
  Las áreas curriculares existen en `AreasCurricularesExtensiones`, y las coordinaciones se administran mediante `CoordinacionesArea`. Sin embargo, no existe una relación institucional independiente que permita registrar que un docente pertenece formalmente a una o varias áreas académicas sin requerir una asignación de asignaturas en el período lectivo vigente. Actualmente, una asignación vinculada a cursos o materias no sustituye la pertenencia a una academia docente o área de conocimiento.
  Requerimientos Funcionales Detallados:
  1. Relación independiente docente - área académica:
     - Crear la entidad y hoja `DocentesAreasAcademicas` vinculando docentes y áreas de forma independiente de la carga horaria.
     - Permitir asignar un docente a una o varias áreas académicas (ej. pertenecer simultáneamente a Matemáticas y a Informática).
     - Permitir que un área tenga múltiples docentes adscritos.
     - Permitir que un docente pertenezca a un área aunque no tenga clases o secciones asignadas en el período activo (ej. docentes en investigación, en suplencia o con carga de coordinación pura).
     - Definir el tipo de vinculación: Docente integrante, Docente titular o especialista, Coordinador de área, Responsable auxiliar o Colaborador temporal.
     - Establecer fechas de inicio y finalización de la pertenencia al área con motivo de la asignación.
  2. Consultas y articulación curricular:
     - Consultar integrantes por área académica e historial de pertenencia.
     - Consultar todas las áreas asignadas a un docente.
     - Relacionar las áreas con las asignaturas correspondientes sin duplicar la definición en el catálogo de asignaturas.
     - Permitir emitir convocatorias y circulares dirigidas exclusivamente a los integrantes de un área.
     - Permitir conformar comités pedagógicos por área y nivel educativo.
  3. Gestión unificada de coordinadores de área:
     - Aprovechar `CoordinacionesArea` sin crear estructuras paralelas duplicadas, manteniendo coherencia con el catálogo de roles internos (`F16-Task01`).
     - Distinguir nítidamente entre: docentes integrantes, coordinador titular, coordinador suplente, coordinador anterior y responsable temporal.
     - Garantizar que los coordinadores solo puedan consultar y supervisar datos dentro del ámbito exacto de su área autorizada.
- **Criterios de Aceptación:**
  - Se puede asignar un docente a varias áreas académicas desde la interfaz.
  - Se pueden asignar varios docentes a una misma área sin crear expedientes laborales duplicados.
  - La pertenencia formal a un área no exige una asignación lectiva de clases activa en el período.
  - Se pueden listar todos los docentes adscritos a un área académica en tiempo real.
  - Se pueden listar todas las áreas a las que pertenece un docente.
  - Se puede designar un coordinador titular y suplente por área.
  - Las asignaciones históricas permanecen inmutables al rotar de área o coordinador.
  - Un docente desvinculado no puede figurar como asignado activo en ningún área.
  - La desactivación de un área no elimina el historial académico ni las asignaciones anteriores.
  - Las asignaciones de clases en `AsignacionesDocentes` no se alteran ni duplican.
  - Los permisos de supervisión del coordinador se mantienen limitados a las asignaturas y docentes de su área.
- **Estado:** Pendiente

<!-- Fuente: RECUPERACION/Pendientes_RECUPERADO.md, líneas 857-910; clave TASK-006; asignación única: Dirección -->

---

<!-- ID: TASK-006 | Fuentes: Pendientes.md ; pendientes/Dirección/Pendientes.md -->
### [ ] [TASK-006] Implementar el flujo de desvinculación laboral con revocación coordinada de accesos y asignaciones
- **Origen del Hallazgo:** `AUDITORIA_FASE_16_RECURSOS_HUMANOS.md` / Sección F (Brecha F.3) y Sección H (P0)
- **Prioridad:** P0
- **Severidad/Clasificación:** Crítica (Seguridad de la información, prevención de accesos residuales e integridad en el cese laboral)
- **Archivos Involucrados:**
  - `backend/accounting-service/Code.gs`
  - `backend/user-service/Code.gs`
  - `backend/academic-service/Code.gs`
  - `ExpedientesLaborales`
  - `HistorialAdscripciones`
  - `Usuarios`
  - `AsignacionesDocentes`
  - `CoordinacionesArea`
  - `AsignacionesAmbitosRoles`
  - Registros de turnos y sustituciones
- **Dependencias Expuestas:** `ExpedientesLaborales`, `HistorialAdscripciones`, `Usuarios`, `AsignacionesDocentes`, `CoordinacionesArea`, `AsignacionesAmbitosRoles`, `F16-Task01`, `F16-Task02`
- **Descripción del Alcance:**
  `updateEmployeeLaborStatus` cambia el estado laboral y registra la fecha de salida, pero no ejecuta de forma coordinada todas las operaciones necesarias para cerrar la relación laboral. La auditoría identificó que pueden quedar adscripciones activas en `HistorialAdscripciones`, cuentas de usuario activas en `Usuarios`, sesiones/tokens vigentes, asignaciones docentes activas o responsabilidades institucionales abiertas, permitiendo que una persona desvinculada conserve accesos.
  Requerimientos Funcionales Detallados:
  1. Flujo integral de desvinculación (Offboarding):
     - Registrar la solicitud de desvinculación validando que el empleado exista y su estado permita la operación.
     - Registrar fecha efectiva de salida, motivo estructurado, usuario autorizador y documentación de respaldo adjunta.
     - Actualizar el estado laboral en `ExpedientesLaborales` a `Retirado` o `Desvinculado`.
     - Cerrar todas las adscripciones vigentes en `HistorialAdscripciones` marcándolas como `Inactiva` con timestamp de salida.
     - Finalizar las responsabilidades y ámbitos institucionales en `AsignacionesAmbitosRoles`.
     - Finalizar o reasignar coordinaciones en `CoordinacionesArea` y suplencias activas.
     - Cerrar las asignaciones docentes en `AsignacionesDocentes` a partir de la fecha efectiva para evitar clases huérfanas.
     - Desactivar la cuenta en `Usuarios` e invalidar tokens, credenciales y sesiones en tiempo real.
     - Impedir nuevas operaciones del empleado a partir de la fecha efectiva de salida.
     - Conservar permanentemente el expediente laboral, contratos, asistencias y calificaciones históricas (prohibición de borrado físico).
     - Identificar y listar tareas pendientes (ej. entrega de equipos, traspaso de expedientes, reasignación de cursos).
  2. Coordinación y resiliencia entre microservicios:
     - No asumir transacciones atómicas distribuidas en Google Sheets. Implementar una operación coordinada, registrada paso a paso de forma idempotente con registro de estados de ejecución.
     - Si alguna etapa secundaria falla (ej. cierre de sustitución), el proceso debe quedar identificado como incompleto y permitir reanudación sin duplicar operaciones.
     - La revocación de accesos en `Usuarios` debe ejecutarse con prioridad inmediata; un fallo posterior en el cierre académico no debe reactivar el acceso del usuario desvinculado.
  3. Cierre documental y liquidación:
     - Registrar período trabajado, salarios pendientes, vacaciones acumuladas no gozadas (conforme al Art. 348 del Código de Trabajo), deducciones, indemnizaciones y prestaciones que correspondan.
     - No emitir cálculos definitivos sin validación previa y autorización de Dirección/Contabilidad.
     - Emitir registro de auditoría `EMPLOYEE_OFFBOARDED_CASCADED` conservando el autor real y, si intervino un asistente delegado, también el titular delegante.
- **Criterios de Aceptación:**
  - Una desvinculación confirmada bloquea de inmediato el inicio de sesión y las llamadas a la API desde la fecha efectiva.
  - Se invalidan tokens de sesión activos del empleado desvinculado.
  - No se eliminan físicamente expedientes, contratos, registros de asistencia ni evaluaciones de notas históricas.
  - Las adscripciones en `HistorialAdscripciones` pasan a estado inactivo.
  - Las asignaciones de clases posteriores a la fecha efectiva se cierran o marcan para reasignación.
  - Las responsabilidades organizativas y coordinaciones quedan finalizadas.
  - Una re-ejecución del proceso no duplica registros ni corrompe el historial.
  - Si una etapa falla, el sistema identifica las tareas pendientes sin reactivar las cuentas.
  - Se emite el log estructurado `EMPLOYEE_OFFBOARDED_CASCADED` con trazabilidad completa.
  - La liquidación laboral permanece en estado preliminar hasta su aprobación formal.
- **Estado:** Pendiente

<!-- Fuente: RECUPERACION/Pendientes_RECUPERADO.md, líneas 2284-2318; clave TASK-044; asignación única: Dirección -->

---

<!-- ID: TASK-068 | Fuentes: Pendientes.md ; pendientes/Dirección/Pendientes.md -->
### [X] [TASK-068] [P0] Sistema Centralizado de Correspondencia de Identificadores y Resolución de Identidades
- **Orden de Ejecución:** 1
- **Prioridad:** P0 (Crítica)
- **Componentes Afectados:**
  - `backend/accounting-service/Code.gs` (`importDataWithColumnMapping`, `resolveCrossReferenceIdentifier`)
  - `backend/user-service/Code.gs` (`resolveUserByLegacyId`, `auditAndReconcileIdentityInconsistencies`)
  - Hoja de cálculo maestra: Nueva hoja `CorrespondenciaIdentificadores`
  - Base de datos en IndexedDB / Caché de identidades
- **Subcapacidades Relacionadas:** F29-01, F29-05, F29-09, F29-11.
- **Estado de Partida:** Defectuosa.
- **Dependencias Principales:** Ninguna (Base para las demás tareas).
- **Problema Detectado y Riesgos:**
  La plataforma importa identificadores de manera plana y no conserva una relación persistente entre los identificadores originales de los sistemas anteriores y los identificadores internos actuales. Esto permite que una misma persona o entidad termine registrada varias veces cuando se importa desde fuentes diferentes o se repite una migración. También existe riesgo de colisión cuando dos estudiantes comparten nombre completo, cuando una fuente no contiene RNE o cuando los sistemas anteriores utilizan códigos internos distintos.
- **Requisitos Funcionales y Técnicos Convergentes:**
  1. *Estructura persistente `CorrespondenciaIdentificadores`:*
     - Columnas mínimas obligatorias:
       `[idMapeo, sistemaOrigen, tipoEntidad, idOriginalLegado, idNuevoPlataforma, institucionId, hashRegistroOrigen, fechaMigracion, versionMapeo, estadoCorrespondencia, metodoCoincidencia, nivelConfianza, migradoPor]`
     - Tipo de entidad admitido: estudiante, responsable, empleado, usuario, curso, asignatura, matrícula, cuenta, documento u otra entidad admitida.
     - Restricción única compuesta: `(sistemaOrigen, tipoEntidad, idOriginalLegado, institucionId)`.
  2. *Resolución bidireccional y referencias múltiples:*
     - Permitir que un mismo registro interno tenga varias referencias externas cuando proceda (ej. un alumno con código interno de secretaría `ALU-2018-045` y RNE de SACE `0801200512345`), sin crear registros duplicados.
     - Funciones: `resolveInternalIdFromLegacy` y `resolveLegacyIdFromInternal`.
     - Permitir búsquedas por identificador original, identificador actual, sistema de origen y entidad.
  3. *Motor de detección de coincidencias y homologación:*
     - Reconocer coincidencias exactas mediante identificadores confiables (RNE, identidad nacional o códigos únicos de origen).
     - Incorporar mecanismo de detección de posibles coincidencias cuando no existan identificadores confiables (nombres normalizados, fecha de nacimiento, responsables, historial de matrícula).
     - Clasificación rigurosa de coincidencias:
       a) Coincidencia confirmada.
       b) Coincidencia probable pendiente de revisión.
       c) Coincidencia insuficiente.
       d) Posible duplicado.
  4. *Políticas de homónimos y revisión humana obligatoria:*
     - Prohibición estricta: No fusionar automáticamente personas únicamente por compartir nombre, apellido u otros datos no exclusivos. Dos estudiantes homónimos con RNE o fecha de nacimiento diferentes permanecen como personas independientes.
     - Interfaz accesible para Secretaría o Administrador autorizado para revisar, confirmar, descartar o vincular coincidencias ambiguas.
     - Conservar el historial completo de decisiones de vinculación y las identidades originales.
  5. *Idempotencia en reimportaciones:*
     - Al reimportar, reconocer correspondencias existentes y actualizar o completar el registro relacionado sin duplicarlo.
- **Criterios de Aceptación:**
  - [x] Una reimportación del mismo archivo o registro no genera duplicados.
  - [x] Un registro institucional puede conservar múltiples identificadores de origen vinculados.
  - [x] Dos estudiantes homónimos con RNE diferentes permanecen como personas independientes.
  - [x] Los registros sin identificador confiable pueden someterse a revisión de coincidencias.
  - [x] Las coincidencias ambiguas no se fusionan automáticamente.
  - [x] Las decisiones de vinculación pueden consultarse y auditarse en bitácora.
  - [x] Las relaciones académicas, familiares y administrativas permanecen asociadas al identificador interno correcto.
  - [x] Se demuestra la resolución de identidades provenientes de, al menos, dos fuentes diferentes.
- **Estado:** [X] Completada localmente (C1.383; CI 42732686635 y 42732686509 exitosos).

<!-- Fuente: RECUPERACION/Pendientes_RECUPERADO.md, líneas 3638-3673; clave TASK-073; asignación única: Dirección -->

- **Revalidación C1.383:** resolvers USER/ACCOUNTING rechazan correspondencias CONFIRMADA incompletas; búsqueda clasifica COINCIDENCIA_INSUFICIENTE; pruebas directas de ambos resolvers aprobadas por CI 42732686635. BETA-FUNC-008 queda pendiente no bloqueante por §21.5.
---

<!-- ID: TASK-073 | Fuentes: Pendientes.md ; pendientes/Dirección/Pendientes.md -->

### [ ] [TASK-073] [P0] Migración Segura de Usuarios, Roles y Flujo de Activación Masiva de Cuentas
- **Orden de Ejecución:** 8
- **Prioridad:** P0 (Crítica)
- **Componentes Afectados:**
  - `backend/user-service/Code.gs` (`createMigratedUserAccountsBatch`, `generateAccountActivationToken`, `activateMigratedAccount`)
  - `js/auth.js`, plantillas de notificación institucional (`MailApp`)
  - Hoja: `Usuarios`, `RolesPermisos`
- **Subcapacidades Relacionadas:** F29-09, F29-21.
- **Estado de Partida:** Implementada parcialmente.
- **Dependencias Principales:** [F29-Task01], [F29-Task02], [F29-Task25].
- **Problema Detectado y Riesgos:**
  Las cuentas migradas necesitan activación inicial segura. Las contraseñas de sistemas anteriores no deben trasladarse en texto plano ni deben asignarse contraseñas genéricas compartidas para toda la institución, lo cual expondría las cuentas a secuestro o acceso no autorizado.
- **Requisitos Funcionales y Técnicos Convergentes:**
  1. *Importación segura de cuentas:*
     - Importar usuarios, roles, perfiles y estados sin almacenar contraseñas en texto plano.
     - Asignar estado inicial: `estadoCuenta: 'PendienteActivacion'`.
     - Evitar duplicación reconociendo usuarios existentes a través de `CorrespondenciaIdentificadores`.
  2. *Tokens criptográficos de activación:*
     - Generar tokens de un solo uso con vencimiento configurable (ej. 72 horas), vinculados a la cuenta.
     - Invalidar tokens al utilizarlos, expirar o revocarse.
  3. *Flujo de primer inicio de sesión y cambio obligatorio de clave:*
     - Exigir verificación de identidad y establecimiento de contraseña segura que cumpla las políticas institucionales.
     - Transición a estado `'Activa'` tras el establecimiento exitoso.
  4. *Asignación rigurosa de roles RBAC:*
     - Mapear permisos según el modelo de roles actual sin otorgar privilegios por equivalencias ambiguas.
     - Revisión obligatoria previa para cuentas con roles elevados (Administrador, Contabilidad, Dirección).
- **Criterios de Aceptación:**
  - [ ] Ninguna contraseña original se almacena ni transmite en texto plano.
  - [ ] Los tokens de activación no pueden reutilizarse y vencen según la política definida.
  - [ ] No se asignan contraseñas genéricas masivas.
  - [ ] Los usuarios existentes no se duplican.
  - [ ] Ninguna cuenta hereda privilegios superiores a su perfil autorizado.
- **Estado:** [ ] Pendiente

<!-- Fuente: RECUPERACION/Pendientes_RECUPERADO.md, líneas 3764-3796; clave TASK-077; asignación única: Dirección -->

---

<!-- ID: TASK-077 | Fuentes: Pendientes.md ; pendientes/Dirección/Pendientes.md -->
### [ ] [TASK-077] [P0] Protocolo Técnico de Corte Temporal y Transición Operativa (Cutover)
- **Orden de Ejecución:** 21
- **Prioridad:** P0 (Crítica)
- **Componentes Afectados:**
  - `backend/developer-service/Code.gs` (`manageSystemOperationalState`, `executeCutoverSequence`)
  - `js/ui-common.js` (banner institucional de transición)
  - Hoja: `BitacoraTransicionOperativa`
- **Subcapacidades Relacionadas:** F29-15, F29-18.
- **Estado de Partida:** Ausente.
- **Dependencias Principales:** [F29-Task06], [F29-Task10], [F29-Task11], [F29-Task13], [F29-Task14], [F29-Task22].
- **Problema Detectado y Riesgos:**
  Falta de un protocolo formal para congelar escrituras en sistemas legados, sincronizar la brecha final (*delta sync*) y activar la nueva plataforma en un punto de corte controlado.
- **Requisitos Funcionales y Técnicos Convergentes:**
  1. *Fases de la secuencia de corte:*
     - **Preparación:** Verificación de fuentes, aprobación de simulaciones, respaldo completo con hash.
     - **Congelamiento:** Establecer fecha y hora de corte ($T_0$), detener escrituras en sistemas anteriores.
     - **Sincronización Delta:** Extraer e importar exclusivamente el diferencial de cambios posterior a la última simulación.
     - **Validación de Corte:** Conciliación integral origen-destino y pruebas automáticas de humo.
     - **Go-Live:** Habilitación de accesos en la nueva plataforma, bloqueo de escrituras paralelas en el legado.
     - **Estabilización:** Monitoreo intensivo de errores y conciliaciones de control.
  2. *Reglas Go / No-Go automáticas:*
     - Discrepancia no justificada en saldos iniciales (diferencia > L 0.00) bloquea el Go-Live.
     - Falta de correspondencia en un expediente activo bloquea la transición del lote.
     - Fallo en pruebas de humo post-migración bloquea el Go-Live.
- **Criterios de Aceptación:**
  - [ ] Se registra y ejecuta el corte con fecha y hora verificables.
  - [ ] Se congela el sistema anterior y se extrae la brecha delta final.
  - [ ] Los criterios No-Go impiden la activación ante discrepancias críticas.
  - [ ] El Go-Live queda documentado con firmas y autorizaciones formales.
- **Estado:** [ ] Pendiente

<!-- Fuente: RECUPERACION/Pendientes_RECUPERADO.md, líneas 3856-3887; clave TASK-080; asignación única: Dirección -->

---

<!-- ID: TASK-080 | Fuentes: Pendientes.md ; pendientes/Dirección/Pendientes.md -->
### [ ] [TASK-080] [P0] Protocolo de Retiro Formal (Decommissioning) y Archivo Histórico de Sistemas Legados
- **Orden de Ejecución:** 24
- **Prioridad:** P0 (Crítica)
- **Componentes Afectados:**
  - `backend/developer-service/Code.gs` (`archiveLegacySystemSource`)
  - Documentación de arquitectura institucional
  - Hoja: `CatalogoFuentesMigracion`
- **Subcapacidades Relacionadas:** F29-18, F29-19.
- **Estado de Partida:** Ausente.
- **Dependencias Principales:** [F29-Task07], [F29-Task13], [F29-Task21], [F29-Task22], [F29-Task23].
- **Problema Detectado y Riesgos:**
  No existe un procedimiento formal para retirar sistemas anteriores ni para mantenerlos disponibles exclusivamente en modo de consulta histórica protegida, exponiendo a la institución a infracciones legales de retención documental.
- **Requisitos Funcionales y Técnicos Convergentes:**
  1. *Checklist de retiro institucional:*
     - Verificar migración completa de entidades y documentos.
     - Aprobación unánime de conciliaciones por Secretaría, Contabilidad y Dirección.
     - Garantizar período de estabilización operativa mínimo (30 a 60 días) en la nueva plataforma.
  2. *Modo archivo y solo lectura:*
     - Poner sistemas legados en solo lectura inhabilitando credenciales de escritura.
     - Conservar copias frías inmutables en dos ubicaciones separadas.
     - Definir plazos de retención según legislación hondureña (Código de la Niñez, SAR: 5 a 10 años según tipo documental).
  3. *Expediente de cierre:*
     - Emitir certificado de retiro con firmas de Dirección y Secretaría General.
- **Criterios de Aceptación:**
  - [ ] Cada sistema retirado dispone de su expediente formal de cierre.
  - [ ] Se conserva copia inmutable verificable de datos y documentos.
  - [ ] Se impide cualquier escritura en fuentes declaradas de solo lectura.
  - [ ] No se autoriza el retiro mientras existan discrepancias críticas sin resolver.
- **Estado:** [ ] Pendiente

<!-- Fuente: RECUPERACION/Pendientes_RECUPERADO.md, líneas 3888-3913; clave TASK-081; asignación única: Dirección -->

---

<!-- ID: TASK-081 | Fuentes: Pendientes.md ; pendientes/Dirección/Pendientes.md -->
### [ ] [TASK-081] [P0] Protección de Datos Personales, Anonimización y Enmascaramiento en Pruebas
- **Orden de Ejecución:** 25
- **Prioridad:** P0 (Crítica)
- **Componentes Afectados:**
  - `backend/accounting-service/Code.gs` (`anonymizeStagedDatasetForTesting`)
  - `backend/user-service/Code.gs`
- **Subcapacidades Relacionadas:** F29-21.
- **Estado de Partida:** Implementada parcialmente.
- **Dependencias Principales:** [F29-Task04], [F29-Task08], [F29-Task10].
- **Problema Detectado y Riesgos:**
  Las simulaciones y pruebas de migración pueden exponer información personal sensible de menores de edad, tutores o personal (RNE, teléfonos, fichas médicas, salarios) en entornos compartidos o logs técnicos.
- **Requisitos Funcionales y Técnicos Convergentes:**
  1. *Políticas de anonimización y enmascaramiento:*
     - Enmascarar RNE/Identidad, teléfonos, correos, domicilios, fichas médicas y salarios en ejecuciones de prueba.
     - Mantener consistencia referencial: si un estudiante ficticio se enmascara, sus notas y pagos deben permanecer asociados al mismo identificador ficticio.
  2. *Protección en bitácoras y diagnóstico:*
     - Suprimir volcado de datos personales en logs de depuración o reportes de incidencias técnicos.
     - Destrucción segura de conjuntos de prueba temporales al finalizar los ensayos.
- **Criterios de Aceptación:**
  - [ ] Los datos sensibles aparecen enmascarados en entornos de prueba configurados.
  - [ ] La consistencia relacional se mantiene intacta durante la anonimización.
  - [ ] Los logs no exponen datos personales sensibles.
- **Estado:** [ ] Pendiente

<!-- Fuente: RECUPERACION/Pendientes_RECUPERADO.md, líneas 3975-4021; clave TASK-084; asignación única: Dirección -->

---

<!-- ID: TASK-084 | Fuentes: Pendientes.md ; pendientes/Dirección/Pendientes.md -->
### [ ] [TASK-084] [P0] Versionado Histórico de Políticas, Aranceles y Parámetros de Cálculo
- **Orden de Ejecución:** 2
- **Prioridad:** P0 (Crítica)
- **Componentes Afectados:**
  - `backend/accounting-service/Code.gs` (`getHistoricalBillingPolicy`, `freezeChargeFinancialTerms`, `compareBillingPolicyVersions`)
  - Hoja: `PoliticasTarifariasHistoricas`, `ParametrosInstitucionales`
- **Subcapacidades Relacionadas:** F30-03.
- **Origen del Hallazgo:** `AUDITORIA_FASE_30_CONSOLIDACION_CERTIFICACION_MEJORA_CONTINUA.md` / Sección C (F30-03).
- **Problema Detectado y Riesgos:**
  Los cálculos financieros dependen de parámetros institucionales que cambian entre períodos. Si se modifica una tarifa, descuento, recargo o regla de cálculo, una consulta o recálculo histórico podría utilizar erróneamente los valores actuales en lugar de los vigentes cuando se generó el cargo original, alterando facturas emitidas, estados de cuenta históricos y reportes contables.
- **Requisitos Funcionales y Técnicos Convergentes:**
  1. *Versionado formal de parámetros de cálculo financiero:*
     - Aranceles de matrícula ordinaria y extraordinaria.
     - Mensualidades y colegiaturas por nivel/grado.
     - Cuotas extraordinarias y aranceles de graduación.
     - Recargos por mora y tasas punitivas.
     - Descuentos institucionales (pronto pago, hermanos).
     - Becas y convenios de cooperación.
     - Políticas de redondeo y precisión monetaria.
     - Reglas de imputación y distribución de pagos parciales.
     - Impuestos y parámetros fiscales aplicables (exenciones ISV Art. 15).
  2. *Estructura del registro inmutable de versión:*
     - Identificador de política (`politicaId`), institución/sede aplicable, ciclo lectivo o intervalo de vigencia (`fechaInicio`, `fechaFin`).
     - Fecha de creación, fecha de entrada en vigor, usuario responsable.
     - Valores anteriores y nuevos, motivo justificado del cambio, estado de aprobación directiva.
  3. *Enlace inmutable y conservación de cobros:*
     - Al generar un cargo en `CargosEstudiante`, factura fiscal SAR o comprobante, almacenar una referencia a la versión de política (`politicaId`) y una copia inmutable (snapshot JSON) de los valores aplicados.
     - Prohibir que una actualización de parámetros modifique automáticamente cargos o documentos ya emitidos.
  4. *Diferenciación estricta de modalidades de cálculo:*
     - Recalcular una operación con sus parámetros originales históricos.
     - Simular un escenario con parámetros actuales (modo sandbox sin alterar base viva).
     - Rectificar formalmente una operación mediante autorización directiva y registro de contrasiento.
     - En caso de disputa entre recálculo automático o inmutabilidad absoluta, implementar parámetro configurable (`INMUTABILIDAD_ESTRICTA_CONGELADA` vs `RECALCULO_DINAMICO_VERSIONADO`).
  5. *Herramientas de auditoría y comparación:*
     - Comparador interactivo entre versiones para identificar variaciones de conceptos, montos o reglas.
     - Los cambios retroactivos exigen autorización mancomunada de Dirección y Contabilidad con justificación obligatoria.
- **Criterios de Aceptación:**
  - [ ] Un estado de cuenta histórico conserva sus importes intactos tras modificar los aranceles actuales.
  - [ ] Es posible consultar qué versión de parámetros generó cada cargo específico.
  - [ ] Se puede reproducir un cálculo histórico con fidelidad idéntica utilizando su versión original.
  - [ ] Los cambios retroactivos quedan identificados y exigen autorización formal.
  - [ ] Las simulaciones con parámetros nuevos no modifican registros contables existentes.
  - [ ] Los reportes históricos y actuales mantienen consistencia y cuadre matemático entre sí.
- **Estado:** [ ] Pendiente

<!-- Fuente: RECUPERACION/Pendientes_RECUPERADO.md, líneas 4057-4096; clave TASK-086; asignación única: Dirección -->

---

<!-- ID: TASK-086 | Fuentes: Pendientes.md ; pendientes/Dirección/Pendientes.md -->
### [ ] [TASK-086] [P0] Orquestador de Transacciones Interdepartamentales y Compensación Automática
- **Orden de Ejecución:** 4
- **Prioridad:** P0 (Crítica)
- **Componentes Afectados:**
  - `backend/academic-service/Code.gs` (`executeInterdepartmentalTransactionSaga`, `rollbackTransactionSagaStep`, `resumeInterdepartmentalTransaction`)
  - `backend/accounting-service/Code.gs`, `backend/user-service/Code.gs`
  - Hoja: `TransaccionesInterdepartamentales`, `IncidenciasTransaccionales`
- **Subcapacidades Relacionadas:** F30-01, F30-08.
- **Origen del Hallazgo:** `AUDITORIA_FASE_30_CONSOLIDACION_CERTIFICACION_MEJORA_CONTINUA.md` / Sección C (F30-01) y Sección G.
- **Problema Detectado y Riesgos:**
  Las operaciones que atraviesan varios microservicios carecen de un mecanismo uniforme de coordinación distribuida (patrón Saga). Una falla en una etapa intermedia o tardía (ej. error al generar aranceles contables tras haber creado el expediente y la matrícula) deja registros huérfanos o inconsistentes sin compensación automática, requiriendo conciliación manual propensa a errores.
- **Requisitos Funcionales y Técnicos Convergentes:**
  1. *Coordinador de transacciones distribuidas por etapas:*
     - Metadatos por transacción: identificador único de transacción (`sagaId`), identificador de correlación interservicios (`correlationId`), proceso de negocio, estado general, etapas ejecutadas, resultado individual por paso, marcas de tiempo, microservicio responsable y payload mínimo para recuperación o compensación.
     - Estados explícitos de ciclo de vida: `Pendiente`, `En_Ejecucion`, `Completada`, `Fallida`, `Pendiente_Compensacion`, `Compensada`, `Requiere_Intervencion_Manual`.
     - Si surge disputa sobre la estrategia ante fallos, permitir configurar el comportamiento (`COMPENSACION_AUTOMATICA_INVERSA` vs `PAUSA_PARA_REANUDACION_ASISTIDA`).
  2. *Procesos interdepartamentales cubiertos:*
     - Admisión $\rightarrow$ Expediente $\rightarrow$ Matrícula $\rightarrow$ Asignación Académica $\rightarrow$ Cargo Arancelario Inicial.
     - Contratación $\rightarrow$ Expediente Laboral $\rightarrow$ Usuario $\rightarrow$ Permisos $\rightarrow$ Registro en Planilla Salarial.
     - Compra $\rightarrow$ Aprobación Jerárquica $\rightarrow$ Orden $\rightarrow$ Recepción $\rightarrow$ Kardex Inventario $\rightarrow$ Cuenta por Pagar.
     - Pago $\rightarrow$ Actualización de Cargo $\rightarrow$ Comprobante $\rightarrow$ Asiento Contable por Partida Doble.
     - Multas o consumos de servicios complementarios $\rightarrow$ Cargo Financiero en Cuenta Estudiantil.
     - Anulación de operaciones $\rightarrow$ Reversión simétrica de efectos colaterales.
  3. *Idempotencia, compensación y reanudación:*
     - Idempotencia estricta mediante claves hash que impidan duplicar expedientes, matrículas, cobros o asientos contables.
     - Acciones compensatorias preservando trazabilidad: prohibido borrar registros; registrar marcas de anulación/compensación.
     - Generar ticket de incidencia automática con contexto técnico cuando una compensación automática falle.
     - Capacidad de reanudar una transacción interrumpida desde la última etapa válida sin duplicar pasos previos.
     - Aislamiento de responsabilidades: el orquestador interactúa únicamente a través de las APIs autorizadas de cada microservicio.
- **Criterios de Aceptación:**
  - [ ] Una falla inducida en cualquier etapa no produce duplicados ni registros inconsistentes en otros servicios.
  - [ ] Los pasos completados quedan identificados y son auditables con su `sagaId` y `correlationId`.
  - [ ] Las compensaciones generan trazabilidad y conservan los registros originales con estado compensado.
  - [ ] Las solicitudes repetidas con el mismo identificador no duplican efectos secundarios.
  - [ ] Las transacciones que requieren intervención manual aparecen en una bandeja de incidencias para resolución.
  - [ ] Se verifica la recuperación exitosa de una matrícula interrumpida antes de generar el cargo financiero.
- **Estado:** [ ] Pendiente

<!-- Fuente: RECUPERACION/Pendientes_RECUPERADO.md, líneas 5544-5576; clave TASK-125; asignación única: Dirección -->

---

<!-- ID: TASK-125 | Fuentes: Pendientes.md ; pendientes/Dirección/Pendientes.md -->
### [ ] [TASK-125] [P0] Catálogo de proyecciones de campos y compartición mínima de información entre departamentos
- **Prioridad:** P0 (Bloqueante / Esencial)
- **Orden de Ejecución:** 3 (Privacidad, principio de menor privilegio y máscaras de atributos)
- **Componentes Afectados:**
  - `backend/accounting-service/Code.gs` (`getStudentMinimalFinancialContext`)
  - `backend/academic-service/Code.gs`, `backend/user-service/Code.gs`
  - Hoja de Cálculo: `CatalogoProyeccionesCompartidas`
- **Subcapacidades Relacionadas:** F37-02, F37-05, F37-08.
- **Origen del Hallazgo:** `AUDITORIA_FASE_37_AISLAMIENTO_DATOS_ASIGNACION_DEPARTAMENTOS.md` / Sección C (F37-08), Matriz CAR-F37-08 y Especificación Técnica ChatGPT/Jules.
- **Problema Detectado y Riesgos:**
  Las consultas interdepartamentales devuelven filas completas u objetos completos de entidades, incluso cuando el departamento receptor solo necesita unos cuantos atributos. Consultas financieras que necesitan validar a un estudiante reciben el expediente completo (teléfonos de emergencia, tutores secundarios, notas disciplinarias, orientaciones psicológicas), exponiendo datos confidenciales innecesarios.
- **Requerimientos Funcionales y Técnicos Convergentes:**
  1. *Mecanismo declarativo de proyección de atributos (Lista Blanca):*
     - Crear un catálogo central de proyecciones por entidad de origen, departamento solicitante, módulo, operación y rol del usuario.
     - La respuesta del backend debe construirse mediante una lista permitida de campos (proyección estricta), excluyendo por defecto cualquier atributo no autorizado.
     - Prohibir el uso de listas negras que eliminen atributos a posteriori; la construcción debe ser aditiva solo con los campos autorizados.
     - Aplicar la máscara en consultas individuales, listados, búsquedas, exportaciones y objetos anidados.
  2. *Proyección específica para Contabilidad:*
     - Una consulta financiera sobre un estudiante solo puede retornar: `estudianteId`, `nombreCompleto`, `codigoEstudiante`, `matriculaId`, `grado`, `seccion`, `estadoMatricula`, `periodoAcademico` y `responsablePagoId`.
     - Excluir estrictamente: teléfonos de emergencia, observaciones disciplinarias, notas académicas, informes psicológicos y documentos personales.
  3. *Acceso estrictamente de solo lectura:*
     - Las referencias compartidas entre departamentos deben ser de solo lectura para el departamento receptor sin permitir mutaciones cruzadas.
- **Criterios de Aceptación:**
  - [ ] Consultar un estudiante desde Contabilidad devuelve únicamente los campos autorizados en la proyección.
  - [ ] Los campos restringidos (notas, disciplina, psicología) no aparecen en JSON, objetos anidados ni búsquedas.
  - [ ] Un usuario con permiso financiero no adquiere acceso a expedientes académicos completos.
  - [ ] Las consultas conservan los identificadores estables necesarios para relacionar pagos y matrículas.
  - [ ] Las respuestas de error o depuración no filtran información confidencial.
- **Dependencias:** F37-Task01.
- **Estado:** [ ] Pendiente

<!-- Fuente: RECUPERACION/Pendientes_RECUPERADO.md, líneas 6273-6305; clave TASK-146; asignación única: Dirección -->

---

<!-- ID: TASK-146 | Fuentes: Pendientes.md ; pendientes/Dirección/Pendientes.md -->
### [ ] [TASK-146] [P0] Implementar bitácora forense de consultas, accesos y descargas (F40-05)
- **Prioridad:** P0 (Prioridad crítica / Bloqueante)
- **Orden de Ejecución:** 8 (Auditoría forense y trazabilidad de eventos)
- **Componentes Afectados:**
  - `backend/academic-service/Code.gs` (`getSecureDocumentStream`, `getStudentDocuments`)
  - `backend/accounting-service/Code.gs` (`getEmployeeDocuments`, `getIssuedSchoolDocuments`)
  - `backend/user-service/Code.gs` (`logStructuredEvent`)
  - Hoja de Cálculo: `LogsSistema`
- **Subcapacidades Relacionadas:** F40-05, F40-14.
- **Origen del Hallazgo:** `AUDITORIA_FASE_40_SEGURIDAD_DOCUMENTAL_TRAZABILIDAD_Y_CONSERVACION.md` / Secciones C (F40-14), D (E2E-02) y Especificación Técnica ChatGPT/Jules.
- **Problema Detectado y Riesgos:**
  El historial registra sustituciones pero carece de trazabilidad de consultas, vistas previas, descargas e intentos de acceso denegados. Las descargas directas quedan fuera del radar de seguridad institucional.
- **Requerimientos Funcionales y Técnicos Convergentes:**
  1. *Esquema estructurado de eventos forenses:*
     - Campos obligatorios: ID de evento, Usuario y rol, Documento y versión, Tipo de operación, Fecha y hora ISO, Resultado (SUCCESS/FAILED), Motivo de denegación, Canal de acceso, IP del cliente, ID de sesión/correlación (sin almacenar credenciales ni tokens).
  2. *Catálogo de eventos estandarizados:*
     - Registrar: `DOCUMENT_VIEWED`, `DOCUMENT_DOWNLOADED`, `DOCUMENT_PREVIEWED`, `DOCUMENT_VERSION_RESTORED`, `DOCUMENT_ACCESS_DENIED`, `DOCUMENT_PERMISSION_CHANGED`, `DOCUMENT_SIGNATURE_REGISTERED`, `DOCUMENT_INTEGRITY_FAILED`.
     - Registrar intentos denegados, incluidos aquellos realizados mediante manipulación de IDs.
     - Permitir búsquedas por usuario, documento, categoría, operación, resultado y fecha.
     - Proteger la bitácora contra modificaciones desde perfiles operativos ordinarios.
     - Excluir contraseñas, secretos o contenido completo de archivos en los registros.
- **Criterios de Aceptación:**
  - [ ] Visualizar un documento genera el evento `DOCUMENT_VIEWED`.
  - [ ] Descargar un documento genera el evento `DOCUMENT_DOWNLOADED`.
  - [ ] Accesos denegados por falta de permisos o manipulación de IDs generan `DOCUMENT_ACCESS_DENIED` con severidad `WARN`.
  - [ ] Restaurar versiones registra usuario, versión de origen y resultado.
  - [ ] Los eventos son ordenados y filtrables sin exponer datos sensibles.
  - [ ] Usuarios operativos no pueden alterar ni borrar eventos de la bitácora.
- **Dependencias:** F40-Task04, F40-Task03, F40-Task07.
- **Estado:** [ ] Pendiente

<!-- Fuente: RECUPERACION/Pendientes_RECUPERADO.md, líneas 6306-6338; clave TASK-147; asignación única: Dirección -->

---

<!-- ID: TASK-147 | Fuentes: Pendientes.md ; pendientes/Dirección/Pendientes.md -->
### [ ] [TASK-147] [P0] Incorporar un rol independiente de auditoría de solo lectura (F40-03)
- **Prioridad:** P0 (Prioridad crítica / Bloqueante)
- **Orden de Ejecución:** 9 (Segregación de funciones y fiscalización institucional)
- **Componentes Afectados:**
  - `backend/academic-service/Code.gs` (`ROLE_PERMISSIONS`)
  - `backend/accounting-service/Code.gs` (`ROLE_PERMISSIONS`)
  - `backend/user-service/Code.gs` (`ROLE_PERMISSIONS`, `getAuditReport`)
  - `backend/developer-service/Code.gs` (`ROLE_PERMISSIONS`)
- **Subcapacidades Relacionadas:** F40-01, F40-17.
- **Origen del Hallazgo:** `AUDITORIA_FASE_40_SEGURIDAD_DOCUMENTAL_TRAZABILIDAD_Y_CONSERVACION.md` / Secciones C (F40-17), D (E2E-06) y Especificación Técnica ChatGPT/Jules.
- **Problema Detectado y Riesgos:**
  No existe un rol de auditoría aislado. Consultar bitácoras exige roles con facultades administrativas, de edición o aprobación, violando la separación de funciones y permitiendo que quien audita pueda modificar los registros que examina.
- **Requerimientos Funcionales y Técnicos Convergentes:**
  1. *Definición de rol formal en microservicios:*
     - Incorporar el rol `Auditor` en `ROLE_PERMISSIONS` de todos los microservicios.
     - Facultades autorizadas: Metadatos documentales, Historial de versiones, Historial de operaciones, Registros de accesos y descargas, Estado de integridad, Relaciones entre documentos, Políticas de conservación, Firmas y aprobaciones, Reportes de auditoría.
  2. *Separación estricta y prohibición de modificaciones:*
     - Separar consulta de metadatos de la descarga de binarios.
     - Denegar terminantemente: Subir o sustituir documentos, Editar metadatos, Aprobar o rechazar documentos, Firmar documentos, Eliminar o restaurar archivos, Cambiar permisos, Modificar políticas, Alterar registros de auditoría.
     - Alcance configurable: Institucional, Por departamento, Por expediente, Por periodo, Por categoría documental.
     - Registrar consultas y exportaciones de auditores. La revocación del rol no altera los registros históricos generados.
- **Criterios de Aceptación:**
  - [ ] El rol `Auditor` consulta registros y metadatos dentro de su departamento asignado.
  - [ ] Consultas fuera de su departamento son denegadas.
  - [ ] Intentar editar, aprobar, firmar, sustituir o eliminar documentos con rol `Auditor` devuelve denegación de acceso.
  - [ ] Intentar cambiar permisos o invocar mutaciones backend resulta en rechazo inmediato.
  - [ ] El rol `Auditor` no hereda facultades de Administrador o Director.
  - [ ] Las exportaciones realizadas quedan registradas en la bitácora.
- **Dependencias:** F40-Task01, F40-Task08.
- **Estado:** [ ] Pendiente

<!-- Fuente: RECUPERACION/Pendientes_RECUPERADO.md, líneas 6506-6551; clave TASK-153; asignación única: Dirección -->

---

<!-- ID: TASK-153 | Fuentes: Pendientes.md ; pendientes/Dirección/Pendientes.md -->
### [ ] [TASK-153] [P0] Aislamiento departamental estricto y autorización por ámbito institucional
- **Prioridad:** P0 (Prioridad crítica / Bloqueante)
- **Orden de Ejecución:** 1 (Aislamiento perimetral y autorización basada en atributos - ABAC)
- **Componentes Afectados:**
  - `backend/academic-service/Code.gs` (`validateAcademicResponsibilityAndScopeAccess`)
  - `backend/accounting-service/Code.gs` (`validateRolePermission`)
  - `backend/user-service/Code.gs` (`assignRoleScope`, `getUserContextScope`)
  - `ROLE_PERMISSIONS` en todos los servicios backend
  - Estructuras: `ExpedientesInstitucionales`, `DocumentosEstudiante`, `DocumentosLaborales`, `SolicitudesFirmas`
- **Subcapacidades Relacionadas:** F41-08.
- **Origen del Hallazgo:** `AUDITORIA_FASE_41_PRUEBAS_INTEGRALES_DIGITALIZACION.md` / Secciones B (F41-08), E (E2E-41-09) y Especificación Técnica ChatGPT/Jules.
- **Problema Detectado y Riesgos:**
  Los servicios aplican permisos generales mediante `ROLE_PERMISSIONS`, pero no siempre comprueban que el documento o expediente solicitado pertenezca al departamento autorizado para el usuario. Modificar el identificador enviado en una petición directa puede permitir obtener datos generales de otro ámbito o expediente ajeno.
- **Requerimientos Funcionales y Técnicos Convergentes:**
  1. *Validación perimetral del ámbito del usuario:*
     - Obtener el departamento y los ámbitos autorizados a partir de la identidad autenticada (`payload._verifiedUserId` / `claims`).
     - No confiar en el departamento ni en el identificador de expediente enviado por el cliente.
     - Comprobar que el usuario mantiene una relación activa con el departamento asignado.
     - Considerar los permisos especiales de Dirección, Administración y otros roles con alcance institucional transversal formalmente autorizados.
  2. *Validación de propiedad del recurso:*
     - Determinar el departamento propietario del documento, expediente o registro antes de devolver datos o aplicar mutaciones.
     - Verificar que el recurso pertenece al ámbito autorizado del solicitante.
     - Repetir la comprobación en operaciones de consulta, modificación, eliminación, descarga, firma y restauración.
  3. *Control granular por operación:*
     - Separar estrictamente permisos para: Consultar metadatos, Consultar contenido, Descargar, Crear, Editar, Eliminar, Aprobar, Firmar, Compartir, Revocar acceso, Exportar y Consultar historial.
  4. *Referencias compartidas autorizadas:*
     - Permitir compartir referencias específicas entre departamentos bajo autorización explícita sin exponer el expediente completo.
     - Definir qué campos y documentos quedan disponibles, registrar quién autorizó el acceso, establecer alcance/vigencia y permitir revocarlo.
     - Verificar nuevamente la vigencia de los permisos al utilizar una referencia compartida.
  5. *Aislamiento en consultas, búsquedas e importaciones:*
     - Aplicar filtros departamentales en el backend; evitar que la búsqueda global o autocompletados revelen registros de otros departamentos.
     - Validar el departamento de destino antes de importar registros; rechazar asignaciones a departamentos no autorizados o archivos que mezclen registros de ámbitos diferentes sin rol institucional global.
  6. *Parametrización configurable en plataforma:*
     - Parámetro en `ConfiguracionInstitucional`: `POLITICA_ESTRICTA_AISLAMIENTO_DEPARTAMENTAL`: `BLOQUEO_TOTAL_CROSS_DEPARTAMENTO` (por defecto) vs. `PERMITIR_REFERENCIA_SOLO_LECTURA_INTERDEPARTAMENTAL`.
- **Criterios de Aceptación:**
  - [ ] Un usuario de un departamento no puede consultar registros de otro mediante manipulación de IDs en peticiones backend.
  - [ ] Las consultas directas a los endpoints aplican las mismas restricciones que la interfaz de usuario.
  - [ ] Las búsquedas y listados no revelan información de departamentos no autorizados ni mediante mensajes de error.
  - [ ] Las referencias compartidas permiten acceder exclusivamente al contenido autorizado y su revocación es inmediata.
  - [ ] Las operaciones de descarga, firma y exportación respetan el ámbito departamental asignado.
  - [ ] Los roles institucionales con acceso global funcionan conforme a sus permisos explícitos sin falsos bloqueos.
- **Dependencias:** Sistema de usuarios, departamentos, roles y estructura de propiedad documental.
- **Aclaración arquitectónica C1.427:** la ausencia de organigrama, catálogo departamental real o fuente institucional aprobada no bloquea el desarrollo del motor genérico. T153-S01 queda limitada a la futura selección/migración de datos de propiedad de cada institución; no condiciona esquema, lógica ni pruebas sintéticas.
- **Avance C1.427:** USER incorpora el registro genérico `ResourceOwnership`, `registerResourceOwnership` autorizado exclusivamente por permiso dinámico `MatrizPermisosRoles`, y `assertRecordOwnership` con denegación segura ante propiedad ausente, duplicada, fuera de departamento o de otra institución. No hay nombres de departamentos ni cargos codificados.
- **Avance C1.428:** USER rechaza registros activos con DepartmentID vacío incluso para alcance institucional global. ACADEMIC y ACCOUNTING incorporan validación contra `ResourceOwnership` para expedientes estudiantiles, documentos/solicitudes vinculadas, expedientes laborales y comprobantes de pago; el acceso propio y las relaciones verificadas de tutores se conservan. Se protege `restoreDocumentVersion` contra restauración sin autorización, suplantación de actor y uso de una versión perteneciente a otro documento.
- **Avance C1.429:** CI confirma éxito de Department Scope (run 42839462181) e Identity Mapping (run 42839462098). Task-Service Security falló por una aserción estática obsoleta que exigía la lista de administradores literal dentro de `getAutomationRules`, aunque el código usa correctamente `TICKET_ADMIN_ROLES_` y `getUserVerifiedRole(payload)`; el mismo fallo ya existía en HEAD anteriores. Se corrige el contrato para verificar la constante centralizada y la identidad verificada; la repetición de CI queda pendiente.
- **Límites pendientes:** integración en TASK/EXAM y auditoría de aplicabilidad en DEVELOPER; recursos institucionales y solicitudes de firma aún sin integración; normalización de errores/listados para no revelar existencia; control de operación granular, referencias compartidas con allowlist/vigencia/revocación, filtros/importaciones y pruebas E2E por servicio.
- **Avance C1.430:** el commit d0d01c8d permite que el alcance institutionWide asigne ResourceOwnership a un DepartmentID de la misma institución, manteniendo DepartmentID obligatorio y permiso dinámico. CI Task-Service security local contracts SUCCESS (42846982461) y backup/restore SUCCESS (42846982439). No implica integración completa ni cierre de TASK-153.
- **Avance C1.436:** EXAM elimina `getAllExams` y `getStudentExams` de `PUBLIC_ACTIONS`; se incorpora contrato para sesión ausente/inválida, claims firmados y suplantación de identidad, con workflow CI dedicado; GitHub Actions run 42859343859 PASS (aserciones de autenticación e identidad). Mitigación parcial AUD-NG-386; ResourceOwnership y protección de las demás operaciones EXAM siguen pendientes. La ejecución local del contrato quedó NOT RUN en esta sesión; CI no la sustituye.
- **Avance C1.437:** `getAllExams` exige identidad verificada y limita el listado de Profesor a exámenes cuyo `profesorId` coincide con el usuario autenticado; el filtro de payload se ignora. Contrato ampliado con casos de propiedad docente y suplantación. Commit 8f1063028c6b4d53cdbb62038b100bb9d651d609; GitHub Actions run 42859943846 PASS (autenticación, identidad y propiedad docente); prueba local NOT RUN y no sustituida por CI.
- **Avance C1.438:** EXAM incorpora resolución de identidad firmada, lectura de ámbitos activos y adaptador ResourceOwnership. `getAllExams` y `getTeacherExamActivity` aplican propiedad institucional/departamental; payload `profesorId` no autoriza. Contratos de autenticación y aislamiento PASS en GitHub Actions run 42863062888.
- **Avance C1.439:** `getStudentExams`, `getExamQuestions` y `getExamResult` derivan identidad/perfil del estudiante desde cuenta verificada y validan ámbito/propiedad; tutores requieren vínculo familiar vigente y ámbito del estudiante relacionado. Contratos locales y GitHub Actions PASS.
- **Avance C1.440:** `submitExam` usa identidad firmada, comprueba examen activo, asignación académica, propiedad/ámbito, pertenencia de preguntas y límite de intentos. El contrato local de envío y parseo PASS; GitHub Actions run 42867761346 PASS en ambos contratos. Beta NOT RUN.
- **Avance C1.443:** TASK Service filtra `getStudentTasks` por ResourceOwnership del estudiante/tutor y, para consultas de personal, exige intersección con el ámbito propio. `assertTaskServiceStudentCanAccessTask` y `getSubmissionDocumentPreviewUrl` verifican propiedad antes de acceso directo a entregas/archivos; la vista delega al guard compartido `READ_CONTENT` y rechaza vínculos ambiguos. Contratos Task-Service CI run 42874101082 PASS. DEVELOPER se clasifica como plano de control sin ABAC departamental; su fallback `authRole` permanece en AUD-NG-082/TASK-645, sin duplicar el hallazgo.
- **Avance C1.445:** las aulas usan ResourceOwnership `AULA_VIRTUAL`; publicaciones/materiales por aula heredan su propiedad. Las mutaciones administrativas de contenido también pasan por el guard del aula o por alcance institucional de General. `readLegacyDocument` exige metadatos activos/únicos, tarea padre única y ownership; `getMultiPartFolderFiles` queda deshabilitado para impedir enumeración por folderId arbitrario. BETA-FUNC-021 ampliada.
- **Pruebas C1.445:** 14 aserciones estáticas PASS; contratos dinámicos añadidos, Node local NOT RUN y CI sin checks visibles para el HEAD consultado; no se declara PASS dinámico/CI.
- **Avance C1.446:** ACADEMIC exige ResourceOwnership y ámbito del estudiante tanto para acceso propio como para tutores; la relación activa no sustituye ownership. getStudentGuardians/saveStudentGuardian/unlinkStudentGuardian validan el expediente antes de exponer o cambiar relaciones. Department Scope Contract runs 42876302825 y 42876368270 PASS; Task-Service run 42876334741 PASS.
- **Avance C1.447:** además de SELF/GUARDIAN y relaciones, `findDuplicateStudents` y `getStudentFileAdministrativeReports` filtran por ResourceOwnership; se corrige PersonaID→UserID y fecha de nacimiento. `getAdmissionRequests`/`updateAdmissionStatus` aplican scope y ownership; solicitudes públicas no asignadas quedan limitadas a ámbito institucional explícito. BETA-FUNC-023/024 añadidas.
- **Estado:** [ ] En ejecución (C1.471; USER/ACADEMIC/ACCOUNTING y TASK/EXAM parcialmente integrados; TASK protege aulas, contenido, entregas y archivos; ACADEMIC protege expedientes SELF/GUARDIAN, relaciones, informes PII, duplicados, cola de admisiones, evaluaciones y entrevistas. Siguen recursos institucionales, solicitudes de firma, permisos granulares, referencias compartidas, filtros/importaciones y E2E; T153-S01 no bloquea el motor genérico).

- **Avance C1.470:** se incorporó un contrato conductual de `convertAdmissionToStudent` con hojas y servicios aislados. Verifica conversión completa con ownership para solicitud y expediente, vínculo documental, matrícula/cargo y movimiento; rollback integral ante fallo tardío al marcar Convertida; compensación si falla el segundo registro de ownership; señalización `ADMISSION_CONVERSION_COMPENSATION_REQUIRED` si una reversión de ownership falla, sin omitir las demás compensaciones; lock ocupado y reentrada concurrente sin lecturas adicionales. Contrato local aislado PASS (5 escenarios) y CI Department Scope run 42903670806 SUCCESS, incluido `academic-admission-ownership.test.js` y syntax-check de ACADEMIC. No se modificó la lógica productiva; la implementación de conversión ya existente queda cubierta conductualmente.

- **Avance C1.471:** ACADEMIC revalida ownership de la solicitud dentro de ScriptLock al guardar evaluaciones y programar entrevistas; al asignar otro evaluador, un gestor también revalida identidad y ámbito departamental dentro del lock. Contratos de lectura confirman que evaluaciones/entrevistas de solicitudes ajenas no se devuelven y que una consulta denegada no abre hojas privadas. El contrato de recordInterviewOutcome conserva ownership antes de leer detalles y actor autorizado antes de cambiar el resultado. V8 local y parseo JavaScript PASS; Department Scope CI run 42905094147 SUCCESS. Sin Apps Script/Sheets real ni despliegue. TASK-153 sigue En ejecución; AUD-NG-386 abierto.

- **Avance C1.469:** `createAdvancedSignatureRequest` valida `firmanteId` contra una única cuenta activa de `Usuarios`; ignora nombre/correo del payload y persiste el perfil canónico. El destinatario interno requiere asignación activa y vigente al departamento del documento o alcance institucional de la misma institución; estudiantes y tutores requieren coincidencia de PersonaID con el expediente o relación familiar activa con acceso al portal. Rechaza identidad ausente/duplicada/inactiva, asignación fuera de ámbito/vencida y relación familiar no vigente antes de leer transacciones o archivos. Contratos USER y sintaxis PASS en CI run 42902550008; workflows de identidad y Task-Service también PASS. Sin PSC real ni despliegue.

- **Corrección C1.467:** el fixture de archivo ausente conserva `documentoId=DOC-1` y elimina únicamente `DriveFileID`; CI run 42901121407 confirmó el rechazo correcto por archivo fuente ausente.

- **Avance C1.466:** `createAdvancedSignatureRequest` deja de fabricar hashes a partir de IDs o confiar en un hash de cliente: resuelve el DriveFileID desde el documento autorizado, calcula SHA-256 de los bytes reales después de validar ownership y rechaza archivo ausente/vacío/ilegible, formato inválido o hash discordante. Contrato aislado local PASS; CI Department Scope run 42901121407 PASS, incluido el contrato USER y sintaxis de servicios. No cubre autenticación de callback ni validación criptográfica del proveedor.

- **Avance C1.465:** `generateSignatureAuditCertificate` ahora exige permiso explícito e identidad verificada; serializa la lectura con ScriptLock; resuelve un único par solicitud/documento, valida ownership departamental con `assertAdvancedSignatureDocumentScope_` en operación READ antes de leer el detalle de firmas y evita mezclar registros. El certificado solo refleja campos presentes, omite tokens de verificación y no inventa IP, fecha, hashes, rol, mecanismo, entidad emisora, marco legal ni estado final. Registra la consulta con actor verificado. Contratos locales focalizados y parseo PASS; no implica validez criptográfica ni cierre de TASK-153.

<!-- Fuente: RECUPERACION/Pendientes_RECUPERADO.md, líneas 7086-7126; clave TASK-169; asignación única: Dirección -->

- **Avance C1.385:** User Service incorpora `getUserContextScope` desde sesión firmada; filtra ámbitos activos por usuario y rol verificados, vigencia temporal y alcance institucional explícito. `validateRoleScopeAccess` usa ese contexto y `assignRoleScope` deja de confiar en `payload.authRole`. La integración de `assertRecordOwnership` en Academic/Accounting, propiedad documental, referencias compartidas, filtros/importaciones y pruebas interservicio sigue pendiente.

- **Avance C1.386–C1.388:** Academic aplica identidad firmada y control de ámbito a validateAcademicResponsibilityAndScopeAccess, expedientes, documentos, reportes y mutaciones; estudiante y tutor quedan limitados a sus relaciones verificadas. Accounting filtra DocumentosLaborales por departamento, exige ámbito para las acciones de documentos y crea nuevas cargas privadas. CI local final: 42737873813, 42737873883 y 42737665503 — success.
- **Limitaciones C1.388:** los esquemas actuales de ExpedientesEstudiantes y DocumentosEstudiante carecen de DepartamentoID; el acceso departamental falla cerrado hasta incorporar/migrar esa propiedad. ExpedientesInstitucionales y SolicitudesFirmas no se encontraron; CatalogoDepartamentos tampoco, aunque existe DepartamentosAcademicos. uploadPaymentVoucher conserva enlace público y payload.userId; archivos laborales antiguos requieren revisión de permisos. Referencias compartidas, operaciones granulares y filtros/importaciones siguen pendientes.
- **Avance C1.390–C1.391:** Accounting protege uploadPaymentVoucher, getPaymentVouchers y reviewPaymentVoucher con identidad firmada y propietario/ámbito; estudiantes solo gestionan sus comprobantes, tutores requieren relación activa y personal requiere ámbito. Los nuevos archivos se guardan privados. CI identity mapping 42738762937 y Department Scope 42738862173: success.
- **Limitación C1.391:** los comprobantes privados todavía no tienen endpoint de preview/stream autorizado; los archivos históricos pueden conservar enlaces públicos. El DepartamentoID sigue ausente en ExpedientesEstudiantes/DocumentosEstudiante; TASK-153 no se cierra.
- **Avance C1.393:** ACCOUNTING añade getPaymentVoucherFile, derivando el archivo desde ComprobantesPago y validando sesión, propietario/relación y ámbito antes de devolver Base64; se validan existencia, papelera, tamaño (10 MiB) y MIME/extensión. CI runs 42739904392 y 42739904420 — success.
- **Limitaciones C1.393:** falta integración UI para preview/descarga; no se han revocado permisos públicos históricos ni probado Drive/Apps Script real. TASK-153 continúa En ejecución.
- **Avance C1.395:** el portal estudiantil integra la pestaña Matrícula y Finanzas, lista comprobantes autenticados y solicita la vista/descarga mediante getPaymentVoucherFile; Base64 se transforma en Blob y se revoca el object URL al cerrar. CI 42740584865 — success (contratos y node --check).
- **Limitaciones C1.395:** sin prueba de navegador ni Apps Script/Drive real; la UI solo cubre estudiante/alumno y los enlaces públicos históricos siguen pendientes de revocación.
- **Avance C1.397–C1.398:** getPaymentVouchers ya no expone URLs de Drive (comprobanteUrl vacío; tieneComprobante booleano); getPaymentVoucherFile responde RESOURCE_NOT_FOUND tanto para IDs inexistentes como no autorizados. Se prueban IDOR, archivos en papelera, vacíos y MIME/extensión no permitidos. CI final 42741228237 — success.
- **Limitaciones C1.398:** no se ha revocado el permiso real de los archivos históricos; falta deployment de prueba/Drive fixture para E2E real. TASK-153 sigue En ejecución.
- **Seguimiento C1.403:** T153-S01 inspeccionó las estructuras y consumidores de ambos catálogos. USER crea CatalogoDepartamentos sin relación ni lector observado; ACADEMIC usa DepartamentosAcademicos para planificación; ACCOUNTING lo consulta solo al resolver expedientes laborales. No se acredita fuente institucional ni propietario estudiantil. Se reutilizan AUD-NG-226/TASK-506 (PM-02/P1) y FASE2-T04; no se crea tarea duplicada. T153-S01 queda bloqueada hasta una decisión institucional aprobada; no se migran ni modifican datos.
---

<!-- ID: AUD-NG-164 | Fuentes: Pendientes.md -->
### [ ] [AUD-NG-164] Completar catálogo curricular maestro y relaciones de asignaturas/planes/ofertas
- Severidad: Alto (P1).
- Alcance: consolidar áreas y departamentos; definir asignaturas con ID/código único, área, departamento, programa, grado, idioma, carga horaria, créditos, prerrequisitos y obligatoriedad; versionar planes y validar ofertas; conservar historia y propagar cambios a formularios/reportes.
- Criterios: fuente única sincronizada cliente/backend; departamentos sin catálogos paralelos; referencias válidas; soporte de modelos hondureños/bilingües; desactivación sin pérdida histórica; pruebas de integridad y múltiples grados.
- Relacionadas: TASK-005, AUD-NG-011, AUD-NG-018, AUD-NG-093, AUD-NG-108, AUD-NG-111, AUD-NG-113, AUD-NG-115, AUD-NG-117 y TASK-153.
- Estado: [ ] Pendiente

---

<!-- ID: AUD-NG-226 | Fuentes: Pendientes.md -->
### [ ] [AUD-NG-226] [P1] Integridad referencial y atomicidad en departamentos, cargos y adscripciones
- **Origen del Hallazgo:** Auditoria.txt / AUD-NG-226; auditoría TAREA-F4-P1-07 (C1.82).
- **Severidad/Clasificación:** Alto (P1) - Integridad estructural, persistencia y consistencia de asignaciones.
- **Archivos Involucrados:** backend/user-service/Code.gs; backend/academic-service/Code.gs; dashboard-recursos-humanos.html; tests/regression/academic-grading-suite.js.
- **Dependencias Expuestas:** CatalogoDepartamentos, CatalogoCargos, HistorialAdscripciones, DepartamentosAcademicos, Usuarios, manageDepartmentPositions, getUserInstitutionalAffiliations, assignDepartmentHead, generateInstitutionalId, TASK-171, TASK-365, TASK-006, AUD-NG-017, AUD-NG-145, AUD-NG-221, AUD-NG-222, AUD-NG-224.
- **Descripción del Alcance:** Asegurar unicidad de IDs y códigos, validación de jefaturas/usuarios/departamentos/cargos existentes y activos, y consistencia entre catálogos administrativos y académicos mediante una relación explícita o separación documentada. Rediseñar ASSIGN_USER para validar todo antes de cerrar la adscripción vigente y ejecutar cierre/alta bajo un mecanismo de concurrencia que impida estados parciales o múltiples adscripciones activas. Incorporar operaciones controladas de edición/desactivación conservando historial y consultas paginadas. Conectar la administración con la consola HR autenticada.
- **Criterios de Aceptación:** No se aceptan IDs duplicados ni referencias a entidades inexistentes/inactivas; IDs del cliente se validan; la generación no usa timestamps como sustituto de unicidad; fallos dejan activa la adscripción anterior; concurrencia no crea más de una activa; consultas aplican permisos/ámbito/paginación; la relación de catálogos se define; consola HR usa datos de catálogo; pruebas cubren FK, duplicados, cuenta inactiva, falla de generación, concurrencia y recuperación. TASK-171 conserva prevención de ciclos y TASK-365 el organigrama visual.
- **Estado:** [ ] Pendiente

---

<!-- ID: F8-TASK10 | Fuentes: AUDITORIAS/AUDITORIA_COMPLETADAS_PLAN.md ; completadas.md -->
### [ ] [F8-TASK10] / TAREA-AD-04 — Dashboard de coordinador académico (C1.270)
- **Dictamen:** NO CUMPLE; se conserva [ ] histórica en completadas.md.
- **Criterios:** CA-AD-109 NO CUMPLE; CA-AD-110 NO CUMPLE; CA-AD-111 NO CUMPLE (trazabilidad parcial).
- **Hallazgos:** AUD-NG-316 overview global sin filtro de ámbito; AUD-NG-317 métricas placeholder y módulos/filtros incompletos; AUD-NG-318 modelo de coordinación basado en areaId sin dimensiones tipadas para nivel/departamento/carrera; AUD-NG-319 trazabilidad parcial y revisión no integrada al dashboard.
- **Tarea nueva:** TASK-670 completar dashboard de coordinación con datos reales, filtros, módulos y flujo de revisión.
- **Tareas existentes ampliadas:** TASK-488, TASK-505, TASK-501, TASK-636, TASK-663, TASK-664, TASK-665, TASK-666, TASK-667 y TASK-668. No se duplican RBAC, tokens, relaciones, vigencia, trazabilidad ni pruebas.
- **Evidencia:** completadas.md f57f1aef832e81e44fc4f7ec36a852d50e464676 líneas 4995–5017; dashboard-coordinacion.html 08de8e4eb150ee9f6aad536ca08e8f76f2e0e896; secretary.js 08a81266957b4c18cc25f8ba6749eac30a8f2c2c; teacher.js c475fce5afcd28fca23e7b64398ad32b17773746; ACADEMIC Code.gs df87a2eea9f0ef79d0b966d03fd5bbe432003df5.
- **Pendientes.md:** blob actual 676a3f798715f0cdd7d4bc75768472545b8465ee recuperado: 1.786.011 caracteres, 20.224 líneas, 0 U+FFFD, 515 IDs únicos hasta TASK-636. No contiene TASK-670 ni F8-Task10. Se conserva sin cambios.
- **Pruebas:** inspección manual de UI, controlador, RBAC, dispatcher, overview, asignaciones, revisión e historial; no ejecutados Node, Apps Script, HTTP, navegador, hojas productivas, pruebas dinámicas de permisos ni E2E.
- **Código fuente:** sin modificaciones; rama base intacta.
- **Siguiente tarea exacta:** F8-Task11 — integrar dashboards dinámicos con los módulos y servicios existentes.
- **Próxima acción:** verificar si existe AUDITORIAS/AUDITORIA_COMPLETADAS_F8-TASK11.md; si falta, auditar js/api.js, js/config.js y los servicios USER/ACADEMIC/TASK/EXAM/ACCOUNTING contra CA-AD-112/113.

- **ID Anterior:** `[TAREA-AD-04]`
- **Origen del Hallazgo:** Anexo de Tareas: Dashboards dinámicos / Tarea AD-04 (P1 · Referencia Coordinación)
- **Prioridad:** P1
- **Severidad/Clasificación:** Alta (Caso de referencia funcional)
- **Archivos Involucrados:**
  - `dashboard-coordinacion.html`
  - `js/secretary.js` / `js/teacher.js`
  - `backend/academic-service/Code.gs`
- **Dependencias Expuestas:** Asignaciones docentes, jornalizaciones, sílabos, eventos, horarios y reportes
- **Descripción del Alcance:**
  Construir el dashboard de coordinación académica como primer caso de referencia completo para verificar roles con múltiples responsabilidades, herramientas compartidas y ámbitos variables.

  Requisitos Funcionales:
  1. Panel de resumen académico con indicadores reales de docentes coordinados, jornalizaciones, sílabos, eventos y tareas pendientes.
  2. Supervisión de docentes, cargas académicas y detección de asignaturas sin docente asignado.
  3. Supervisión, observaciones, solicitudes de corrección, aprobación y rechazo de jornalizaciones y sílabos reutilizando flujos existentes.
  4. Supervisión de documentación académica, calendario de eventos, revisión de horarios y generación de reportes de cumplimiento.
- **Criterios de Aceptación:**
  - CA-AD-109: El dashboard se adapta dinámicamente a las responsabilidades y ámbitos configurados para el coordinador.
  - CA-AD-110: Es posible crear coordinadores por nivel, departamento o carrera sin duplicar código.
  - CA-AD-111: Todas las aprobaciones y revisiones conservan trazabilidad institucional.
- **Estado:** Pendiente

---

<!-- ID: F10-TASK11 | Fuentes: Pendientes.md ; pendientes/Dirección/Pendientes.md -->
### [ ] [F10-TASK11] Completar la delegación de responsabilidades para asistentes administrativos y académicos
- **Origen del Hallazgo:** `AUDITORIA_FASE_10_ASISTENCIA_DISCIPLINA_CONVIVENCIA.md` / Tarea F10-Task03 (P1) y Tarea 10.10
- **Prioridad:** P1
- **Severidad/Clasificación:** Alta (Delegación de funciones, roles y auditoría de asistentes)
- **Archivos Involucrados:**
  - `backend/user-service/Code.gs`
  - `backend/academic-service/Code.gs`
- **Dependencias Expuestas:** AsignacionesAmbitosRoles, log de eventos de auditoría
- **Descripción del Alcance:**
  Consolidar el modelo de delegación para asistentes administrativos y académicos, definiendo responsabilidades granulares por cargo (Dirección, Secretaría, Coordinación) con registro de doble identidad (ejecutor y titular delegado) y posibilidad de revocar delegaciones sin alterar historial.
- **Criterios de Aceptación:**
  - Las operaciones de los asistentes identifican al autor real y al titular delegado, bloqueando autorizaciones restringidas.
- **Estado:** Pendiente

<!-- Fuente: RECUPERACION/Pendientes_RECUPERADO.md, líneas 509-523; clave F10-Task16; asignación única: Dirección -->

---

<!-- ID: F11-TASK10 | Fuentes: AUDITORIAS/AUDITORIA-FASE-11-COMUNICACION-BIENESTAR-SUPERVISION-FINANZAS.md ; Pendientes.md ; pendientes/Dirección/Pendientes.md -->
### [ ] [F11-TASK10] Formalizar el flujo de entrega, observaciones y aprobación de planes docentes

**Otros títulos originales:**
- Implementar el flujo de entrega, observaciones y aprobación de documentación docente
- **Hallazgo de origen:** sección 3.C.2; la revisión es básica y carece de estados con solicitudes de corrección.
- **Severidad:** Alta. **Objetivo:** hacer trazable el ciclo de revisión y subsanación de documentos docentes.
- **Acción ejecutable:** definir estados de borrador, enviado, en revisión, requiere corrección, reenviado y aprobado; registrar observaciones, responsable, plazos y versiones.
- **Archivos/módulos:** `backend/academic-service/Code.gs`, `PlanificacionesPedagogicas`, flujo de revisión documental.
- **Dependencias/riesgos:** F11-Task09, roles de docente/coordinación y versionado; riesgo de aprobar una versión distinta de la revisada.
- **Alcance:** estados y solicitudes de corrección de planes; no duplicar el repositorio documental.
- **Criterios de aceptación:** cada transición valida rol y estado previo; una corrección conserva observación y versión; aprobación identifica exactamente la versión aprobada; el historial no se sobrescribe.
- **Prioridad:** P1. **Estado:** Pendiente.
- **Evidencia de cierre:** pendiente; el informe identifica revisión básica sin flujo de corrección.
- **Origen del Hallazgo:** `AUDITORIA-FASE-11-COMUNICACION-BIENESTAR-SUPERVISION-FINANZAS.md` / Área III (P1)
- **Prioridad:** P1
- **Severidad/Clasificación:** Alta (Supervisión académica)
- **Archivos Involucrados:**
  - `backend/academic-service/Code.gs`
- **Dependencias Expuestas:** RevisionesPlanificacion
- **Descripción del Alcance:**
  Gestionar el ciclo de revisión de documentos docentes (Pendiente, EnRevision, RequiereCorrecciones, Aprobado) permitiendo a coordinadores registrar observaciones y evaluar reenvíos.
- **Criterios de Aceptación:**
  - Las aprobaciones quedan ligadas a la versión exacta del documento y al coordinador aprobador.
- **Estado:** Pendiente

<!-- Fuente: RECUPERACION/Pendientes_RECUPERADO.md, líneas 204-218; clave F11-Task11; asignación única: Dirección -->

---

<!-- ID: F11-TASK11 | Fuentes: AUDITORIAS/AUDITORIA-FASE-11-COMUNICACION-BIENESTAR-SUPERVISION-FINANZAS.md ; Pendientes.md ; pendientes/Dirección/Pendientes.md -->
### [ ] [F11-TASK11] Incorporar rúbricas configurables para observación y evaluación docente

**Otros títulos originales:**
- Desarrollar el sistema de observaciones, rúbricas de supervisión y evaluaciones pedagógicas
- **Hallazgo de origen:** sección 3.C.3; existen observaciones y planes de mejora, pero faltan pautas/rúbricas configurables por nivel.
- **Severidad:** Alta. **Objetivo:** estandarizar la evaluación pedagógica con criterios explícitos por nivel.
- **Acción ejecutable:** permitir configurar rúbricas por nivel/área, criterios, escala, ponderación y versión; asociarlas a observaciones y planes de mejora.
- **Archivos/módulos:** `backend/academic-service/Code.gs`, `getTeacherSupervisions`, `getSupervisionObservation`, `getTeacherImprovementPlans`, `SupervisionPedagógica`.
- **Dependencias/riesgos:** catálogo académico, permisos de coordinación y trazabilidad de versiones; riesgo de comparar evaluaciones con escalas incompatibles.
- **Alcance:** rúbricas y asociación a observaciones; no alterar retroactivamente evaluaciones históricas.
- **Criterios de aceptación:** rúbricas se configuran por nivel y periodo; cada evaluación conserva la versión aplicada; ponderaciones y escalas se validan; los resultados pueden auditarse.
- **Prioridad:** P1. **Estado:** Pendiente.
- **Evidencia de cierre:** pendiente; el informe declara la falta de rúbricas configurables.
- **Origen del Hallazgo:** `AUDITORIA-FASE-11-COMUNICACION-BIENESTAR-SUPERVISION-FINANZAS.md` / Área III (P1)
- **Prioridad:** P1
- **Severidad/Clasificación:** Alta (Calidad docente)
- **Archivos Involucrados:**
  - `backend/academic-service/Code.gs`
- **Dependencias Expuestas:** SupervisiónPedagógica
- **Descripción del Alcance:**
  Configurar rúbricas y pautas de observación en aula, registrar evaluaciones pedagógicas a docentes y definir compromisos de desarrollo profesional.
- **Criterios de Aceptación:**
  - El docente puede consultar la retroalimentación sin alterar la pauta de evaluación registrada por la dirección.
- **Estado:** Pendiente

<!-- Fuente: RECUPERACION/Pendientes_RECUPERADO.md, líneas 219-233; clave F11-Task12; asignación única: Dirección -->

---

<!-- ID: F11-TASK12 | Fuentes: AUDITORIAS/AUDITORIA-FASE-11-COMUNICACION-BIENESTAR-SUPERVISION-FINANZAS.md ; Pendientes.md ; pendientes/Dirección/Pendientes.md -->
### [ ] [F11-TASK12] Reconciliar y consolidar el registro de suplencias temporales docentes

**Otros títulos originales:**
- Implementar el sistema de suplencias temporales y relevos docentes con alcance acotado
- **Hallazgo de origen:** sección 3.C.4 declara las sustituciones completas y verificadas; sección 16 conserva F11-Task12 como pendiente.
- **Severidad:** Alta (prioridad histórica P1). **Objetivo:** asegurar que las suplencias mantengan titularidad, periodo y alcance temporal sin duplicar asignaciones.
- **Acción ejecutable:** contrastar `createTeacherSubstitution` y `getTeacherSubstitutions` con todos los criterios del backlog; verificar solapamientos, vigencia, docente titular, sustituto y reversión al terminar; documentar brechas si aparecen.
- **Archivos/módulos:** `backend/academic-service/Code.gs`, `SustitucionesDocentes`.
- **Dependencias/riesgos:** asignaciones docentes, calendario y concurrencia; riesgo de sustituciones simultáneas o permanentes por error.
- **Alcance:** verificación de cobertura y brechas del registro de suplencias; no reimplementar lo que ya esté probado.
- **Criterios de aceptación:** evidencia demuestra titular preservado, sustituto autorizado, fechas/alcance acotados, rechazo de solapamientos incompatibles y cierre/reversión temporal; no se altera el estado histórico sin aprobación.
- **Prioridad:** P1. **Estado:** Pendiente (estado original del backlog).
- **Evidencia de cierre:** pendiente. **Discrepancia:** la sección 3.C.4 la declara completa y verificada, pero la tabla consolidada la conserva pendiente; se requiere reconciliación basada en evidencia.
- **Origen del Hallazgo:** `AUDITORIA-FASE-11-COMUNICACION-BIENESTAR-SUPERVISION-FINANZAS.md` / Área III (P1)
- **Prioridad:** P1
- **Severidad/Clasificación:** Alta (Continuidad académica)
- **Archivos Involucrados:**
  - `backend/academic-service/Code.gs`
- **Dependencias Expuestas:** SustitucionesDocentes
- **Descripción del Alcance:**
  Asignar suplentes temporales ante ausencias docentes, otorgando acceso acotado a las secciones del titular sin alterar el nombramiento original ni conceder acceso a otros grupos.
- **Criterios de Aceptación:**
  - Al concluir el período de suplencia, los accesos temporales son revocados automáticamente.
- **Estado:** Pendiente

<!-- Fuente: RECUPERACION/Pendientes_RECUPERADO.md, líneas 426-441; clave F10-Task11; asignación única: Dirección -->

---

<!-- ID: F16-TASK04 | Fuentes: AUDITORIAS/AUDITORIA_FASE_16_RECURSOS_HUMANOS.md -->
### [ ] [F16-TASK04] Implementar el checklist y proceso de incorporación de nuevos empleados
- **Severidad:** Alta (Cumplimiento de requisitos de contratación)
- **Componentes Afectados:** `backend/accounting-service/Code.gs`, `dashboard-recursos-humanos.html`, hoja `ChecklistIncorporacion`.
- **Descripción:** Administrar el proceso previo y posterior a la contratación: lista de verificación de requisitos (contrato firmado, título cotejado, antecedentes penales, carnet IHSS, examen médico, asignación de horario, inducción), impidiendo que el empleado pase a estado `Activo` pleno hasta completar los requisitos obligatorios configurados.
- **Hallazgo de origen:** B/F16-06, F.4, H.2 y continuidad J.
- **Severidad:** Alta. **Objetivo:** asegurar que requisitos documentales y operativos se completen antes de activar plenamente al empleado.
- **Acción ejecutable:** implementar `ChecklistIncorporacion` con requisitos configurables, estados, fechas, responsables y evidencias para contrato firmado, títulos cotejados, antecedentes, carnet IHSS, examen médico, horario, inducción y equipo; bloquear el estado Activo pleno si faltan requisitos obligatorios.
- **Archivos/módulos:** `backend/accounting-service/Code.gs`, `dashboard-recursos-humanos.html`, hoja `ChecklistIncorporacion`.
- **Dependencias/riesgos:** expediente, contratos, almacenamiento, roles RR. HH. y protección de datos médicos; riesgo de activar sin requisitos o bloquear indebidamente.
- **Alcance:** incorporación previa/posterior al alta; no automatizar decisiones de contratación ni exponer documentación sensible.
- **Criterios de aceptación:** checklist por empleado con responsable, vencimiento y evidencia; requisitos obligatorios configurables; transición a Activo validada en backend; excepciones autorizadas justificadas y auditadas.
- **Prioridad:** P1. **Estado:** Pendiente (estado operativo de migración; el informe no declara estado histórico explícito).
- **Evidencia de cierre:** pendiente; no se declara ejecución ni verificación.

---

<!-- ID: F16-TASK05 | Fuentes: AUDITORIAS/AUDITORIA_FASE_16_RECURSOS_HUMANOS.md -->
### [ ] [F16-TASK05] Proyectar saldos de vacaciones futuras y gestionar ausencias fraccionadas
- **Severidad:** Alta (Experiencia de usuario y cumplimiento del Código de Trabajo)
- **Componentes Afectados:** `backend/accounting-service/Code.gs`, `dashboard-recursos-humanos.html`.
- **Descripción:** Permitir solicitar vacaciones para fechas futuras proyectando los días que se devengarán a la fecha de disfrute (cuando la política institucional lo autorice), permitiendo además la solicitud de permisos por fracciones de jornada (medio día / horas) e impidiendo el solapamiento de solicitudes.
- **Hallazgo de origen:** backlog H.2, tabla E/F16-11 y continuidad J; B/C declaran completo el cálculo actual.
- **Severidad:** Alta. **Objetivo:** permitir solicitudes futuras con proyección de días devengados y gestionar permisos fraccionados sin sobreasignar saldos.
- **Acción ejecutable:** proyectar saldo a fecha de disfrute cuando la política lo permita; admitir medio día/horas; detectar solapamientos y recalcular disponibilidad al aprobar/rechazar.
- **Archivos/módulos:** accounting-service, dashboard RR. HH., `calculateVacationBalances`, `submitLeaveVacationRequest`, `reviewVacationRequest`, `SolicitudesVacaciones`.
- **Dependencias/riesgos:** antigüedad, Art. 348, solicitudes aprobadas, jornada y reglas institucionales; riesgo de proyectar días no devengados o descontar dos veces.
- **Alcance:** proyección y fraccionamiento; no alterar escala legal ni saldos históricos consumidos.
- **Criterios de aceptación:** proyección reproducible; solicitud fraccionada conserva unidad/duración; solapamientos rechazados; saldo real y proyectado diferenciados; aprobación actualiza saldo una sola vez.
- **Prioridad:** P1 en H.2; tabla E marca P0 (discrepancia).
- **Estado:** Pendiente (estado operativo de migración; el informe no declara estado histórico explícito).
- **Evidencia de cierre:** pendiente; no se declara ejecución ni verificación.

---

<!-- ID: F16-TASK06 | Fuentes: AUDITORIAS/AUDITORIA_FASE_16_RECURSOS_HUMANOS.md -->
### [ ] [F16-TASK06] Impedir jerarquías circulares y validar la estructura de departamentos
- **Severidad:** Alta (Integridad de la estructura organizativa)
- **Componentes Afectados:** `backend/user-service/Code.gs` (`manageDepartmentPositions`).
- **Descripción:** Incorporar un algoritmo de detección de ciclos en las dependencias jerárquicas de departamentos y cargos, impidiendo que una unidad sea asignada como subordinada de sí misma o de sus unidades dependientes.

- **Hallazgo de origen:** G.1, J, tabla E/F16-02 y backlog H.2. B declara F16-02 completa, pero G.1 identifica cumplimiento parcial por falta de validación de ciclos.
- **Severidad:** Alta. **Objetivo:** preservar una estructura organizativa acíclica y consistente.
- **Acción ejecutable:** validar cada alta/cambio de dependencia mediante detección de ciclos; rechazar auto-referencias, ciclos indirectos y referencias a unidades inexistentes.
- **Archivos/módulos:** `backend/user-service/Code.gs`, `manageDepartmentPositions`, catálogos de departamentos y cargos.
- **Dependencias/riesgos:** integridad referencial, concurrencia y jerarquías existentes; riesgo de romper consultas, organigrama y autorización por ámbito.
- **Alcance:** validación de relaciones jerárquicas; no rediseñar catálogos ni borrar estructuras históricas.
- **Criterios de aceptación:** altas/actualizaciones que generen ciclos rechazadas; relaciones válidas persisten; pruebas cubren ciclo directo/indirecto, referencia inexistente y concurrencia.
- **Prioridad:** P1. **Estado:** Pendiente.
- **Reconciliación:** C1.82 vincula esta causa con TASK-171; verificar cobertura y ampliar esa tarea, sin implementar otro detector.
- **Evidencia de cierre:** pendiente; no se declara ejecución ni verificación.

---

<!-- ID: F17-TASK06 | Fuentes: AUDITORIAS/AUDITORIA_FASE_17_PLANILLAS_COMPENSACIONES.md -->
### [ ] [F17-TASK06] Vincular y amortizar automáticamente préstamos y anticipos en el ciclo mensual de planilla
- **Severidad:** Alta (Recuperación de cuentas por cobrar a empleados)
- **Componentes Afectados:** `backend/accounting-service/Code.gs`, `AnticiposPrestamosEmpleado`.
- **Solución Propuesta:** Deducir automáticamente la cuota mensual pactada en `otrasDeducciones` y, al cerrar la planilla, descontar la cuota del `SaldoPendiente` en `AnticiposPrestamosEmpleado`.
- **Hallazgo de origen:** secciones B.5, E.2, D/F17-05 y backlog G.2.
- **Severidad:** Alta. **Objetivo:** descontar cuotas pactadas y mantener el saldo de deuda actualizado al cerrar cada planilla.
- **Acción ejecutable:** incluir cuotas mensuales aprobadas en `otrasDeducciones`; al cierre de planilla actualizar saldo pendiente y cuotas pagadas de forma atómica/idempotente; distinguir préstamos ordinarios de anticipos de aguinaldo/14º mes.
- **Archivos/módulos:** `backend/accounting-service/Code.gs`, `calculatePayrollPeriod`, `updatePayrollPeriodStatus`, `AnticiposPrestamosEmpleado`, `PlanillasNomenclatura`.
- **Dependencias/riesgos:** autorización del préstamo, calendario de cuotas, cierre/rectificación de planilla e idempotencia; riesgo de doble descuento o saldo incorrecto.
- **Alcance:** amortización de préstamos/anticipos ordinarios en planilla mensual; los anticipos específicos de beneficios extraordinarios se mantienen coordinados con F17-Task05.
- **Criterios de aceptación:** solo cuotas vigentes/aprobadas se descuentan; cada cuota se aplica una vez por planilla; saldo y cuotas pagadas se actualizan al cierre; rectificación/reapertura no duplica movimientos; recibo refleja la deducción.
- **Prioridad:** P1. **Estado:** Pendiente.
- **Evidencia de cierre:** pendiente; los registros cotejados acreditan deducción de anticipos de 13º/14º, pero no la amortización mensual general descrita por esta tarea.

---

<!-- ID: F17-TASK08 | Fuentes: AUDITORIAS/AUDITORIA_FASE_17_PLANILLAS_COMPENSACIONES.md -->
### [ ] [F17-TASK08] Generar y enviar masivamente boletas de pago firmadas por correo
- **Severidad:** Alta (Entrega de comprobantes a colaboradores)
- **Componentes Afectados:** `backend/accounting-service/Code.gs`, `backend/user-service/Code.gs`.
- **Solución Propuesta:** Permitir a RRHH enviar en lote las boletas de pago por correo electrónico a todos los empleados de la planilla cerrada con registro de recepción.

- **Hallazgo de origen:** backlog G.2; la sección B.6 solo acredita generación/consulta individual de boletas PDF.
- **Severidad:** Alta. **Objetivo:** distribuir comprobantes de planilla cerrada a cada colaborador con constancia de entrega.
- **Acción ejecutable:** generar/recuperar boletas individuales vinculadas a la planilla y empleado correctos; permitir envío por lote a correos institucionales validados; registrar destinatario, fecha, estado de entrega y reintentos sin duplicar envíos.
- **Archivos/módulos:** `backend/accounting-service/Code.gs`, `backend/user-service/Code.gs`, `generatePayrollReceiptPDF`, `getStaffPayrollReceipt`, `BoletasPago`, `PlanillasNomenclatura`.
- **Dependencias/riesgos:** correo institucional, firma/aprobación de planilla, privacidad salarial y trazabilidad; riesgo de enviar boletas a destinatarios incorrectos.
- **Alcance:** distribución masiva de boletas ya autorizadas; no exponer salarios en mensajes ni permitir envío antes del cierre.
- **Criterios de aceptación:** cada boleta corresponde a empleado/planilla; solo planillas cerradas se envían; correo validado por expediente; registro de recepción/estado y reintento idempotente; controles ABAC preservados.
- **Prioridad:** P1. **Estado:** Pendiente.
- **Evidencia de cierre:** pendiente; el informe solo acredita descarga/consulta individual, no envío masivo ni registro de recepción.

---

<!-- ID: F19-TASK07 | Fuentes: AUDITORIAS/AUDITORIA_FASE_19_INVENTARIO_ACTIVOS_MANTENIMIENTO.md -->
### [ ] [F19-TASK07] Contabilizar automáticamente el consumo de materiales por departamento
- **Hallazgo de origen:** secciones C.2.17, D, E/F19-17 y H P1; ampliación relacionada con AUD-NG-142.
- **Severidad:** Alta. **Objetivo:** reflejar el gasto de materiales en el centro de costo que recibe el suministro.
- **Acción ejecutable:** al entregar una requisición aprobada, registrar salida del almacén físico correcto y generar asiento de gasto por departamento/centro de costo con referencia a la requisición y movimiento de Kardex.
- **Archivos/módulos:** `backend/accounting-service/Code.gs`, `deliverMaterialRequisition`, `recordInventoryMovement`, `MaterialesSolicitudes`, `InventariosKardex`, `AsientosContables`.
- **Dependencias/riesgos:** aprobación de requisición, almacén responsable, centro de costo y partida doble; riesgo de consumo no autorizado o doble contabilización.
- **Alcance:** contabilización de salidas por entrega; no contabilizar solicitudes rechazadas ni duplicar asientos en reintentos.
- **Criterios de aceptación:** solo requisiciones aprobadas pueden entregarse; descuento del almacén físico de origen; salida y asiento atómicos/idempotentes; centro de costo correcto; débito/crédito balanceado; entrega queda auditada.
- **Prioridad:** P1. **Estado:** Pendiente.
- **Reconciliación:** AUD-NG-142 añade que `deliverMaterialRequisition` no valida aprobación, no usa lock y descuenta desde departamento como ubicación. Estas validaciones se incorporan al alcance; no se declara resuelto por el asiento contable propuesto.
- **Evidencia de cierre:** pendiente; el informe indica que las salidas no generan asiento automático.

---

<!-- ID: F21-TASK10 | Fuentes: AUDITORIAS/AUDITORIA_FASE_21_TRANSPORTE_SERVICIOS_COMPLEMENTARIOS.md -->
### [ ] [F21-TASK10] Registrar y escalar incidencias y emergencias de transporte
- **Hallazgo de origen:** secciones A.1.8, C.1.12, D/F21-16..F21-18 y H P1.
- **Severidad:** Alta. **Objetivo:** documentar averías, accidentes y emergencias y notificar a los responsables.
- **Acción ejecutable:** crear flujo de incidencias con viaje, vehículo, estudiantes afectados, categoría, gravedad, ubicación, evidencia, responsable y estados; escalar a Dirección y familias según severidad.
- **Archivos/módulos:** `backend/accounting-service/Code.gs`, nueva entidad `TransporteIncidencias`, `TransporteViajes`, servicio multicanal y dashboards.
- **Dependencias/riesgos:** identidad, viaje activo, contactos de emergencia y F21-Task02; riesgo de retraso de respuesta o divulgación excesiva.
- **Alcance:** registro/escalamiento; no sustituir protocolos externos de emergencia ni prometer atención automática.
- **Criterios de aceptación:** incidencia ligada a viaje/vehículo; gravedad y responsable obligatorios; notificación según matriz; seguimiento/cierre auditado; información visible solo a roles autorizados.
- **Prioridad:** P1. **Estado:** Pendiente.
- **Evidencia de cierre:** pendiente; el informe declara inexistente el módulo de incidencias.

---

<!-- ID: F22-TASK05 | Fuentes: AUDITORIAS/AUDITORIA_FASE_22_GESTION_DOCUMENTAL_FORMULARIOS_FIRMA_ELECTRONICA.md -->
### [ ] [F22-TASK05] Crear explorador documental institucional unificado
- **Hallazgo de origen:** secciones C.1, D/F22-01..F22-03, E y H P1.
- **Severidad:** Alta. **Objetivo:** consultar documentos de estudiantes y empleados desde una vista centralizada.
- **Acción ejecutable:** crear explorador con búsqueda/filtros por titular, expediente, categoría, departamento, fecha, tipo y estado; recuperar metadatos de documentos emitidos, laborales y trámites desde sus fuentes sin duplicar archivos.
- **Archivos/módulos:** dashboard de Dirección/Secretaría, `js/teacher.js`, `js/accounting.js`, `DocumentosEscolaresEmitidos`, `DocumentosLaborales`, `SolicitudesTramites`, Google Drive.
- **Dependencias/riesgos:** F22-Task01, permisos RBAC/ABAC, enlaces privados y paginación; riesgo de exposición entre expedientes.
- **Alcance:** índice y visualización unificados; no copiar documentos ni abrir enlaces públicos.
- **Criterios de aceptación:** búsqueda transversal con paginación; acceso por titular/rol/departamento; descarga privada; filtros reproducibles; metadatos consistentes; eventos de consulta/descarga auditados.
- **Prioridad:** P1. **Estado:** Pendiente.
- **Evidencia de cierre:** pendiente; el informe identifica repositorio disperso y ausencia de explorador.

---

<!-- ID: F22-TASK08 | Fuentes: AUDITORIAS/AUDITORIA_FASE_22_GESTION_DOCUMENTAL_FORMULARIOS_FIRMA_ELECTRONICA.md -->
### [ ] [F22-TASK08] Generar documentos oficiales por lotes con CUV y correlativos independientes
- **Hallazgo de origen:** secciones D/F22-37 y H P1.
- **Severidad:** Alta. **Objetivo:** emitir constancias/diplomas masivamente sin colisiones ni mezcla de expedientes.
- **Acción ejecutable:** permitir selección autorizada por grado/sección/grupo; generar cada documento con datos del titular, plantilla/version, correlativo anual y CUV único; aislar errores por registro y ofrecer reporte de lote.
- **Archivos/módulos:** `backend/accounting-service/Code.gs`, `generateSchoolDocument`, `PlantillasEscolares`, `DocumentosEscolaresEmitidos`, `dashboard-director.html`.
- **Dependencias/riesgos:** F22-Task02, plantillas, identidad y correlativos; riesgo de documentos cruzados o CUV duplicados.
- **Alcance:** emisión batch; no firmar automáticamente ni omitir revisión/autoridad.
- **Criterios de aceptación:** lote conserva trazabilidad individual; cada documento tiene CUV/correlativo único; errores no contaminan otros registros; permisos restringen lotes; reporte de éxito/fallo descargable.
- **Prioridad:** P1. **Estado:** Pendiente.
- **Evidencia de cierre:** pendiente; la matriz identifica generación por lotes como ausente.

---

<!-- ID: F23-TASK03 | Fuentes: AUDITORIAS/AUDITORIA_FASE_23_MOTOR_INSTITUCIONAL_FLUJOS_TRABAJO.md -->
### [ ] [F23-TASK03] Crear bandeja unificada de trabajo con asignación por rol/departamento
- **Hallazgo de origen:** F23-004 y F23-022; H (getUnifiedWorkInbox); AUD-NG-205.
- **Severidad:** Alta. **Objetivo:** reunir trámites, autorizaciones, compras y justificaciones asignadas en una vista segura.
- **Acción ejecutable:** implementar `getUnifiedWorkInbox` con esquema canónico de origen, responsable, rol/departamento, estado, vencimiento, SLA y enlaces; conectar frontend; incluir asignación round-robin/carga cuando la política lo permita.
- **Archivos/módulos:** `backend/user-service/Code.gs`, `js/api.js`, dashboards por rol, `SolicitudesTramites`, `SolicitudesAutorizacion` y bandeja unificada.
- **Dependencias/riesgos:** F23-Task01/F23-Task10, RBAC/ABAC y contratos de productores; riesgo de tareas omitidas, duplicadas o visibles a departamentos ajenos.
- **Alcance:** agregación y asignación; no duplicar bandejas existentes.
- **Criterios de aceptación:** esquema estable/versionado; productores definidos agregados; responsable/departamento verificados; filtros/paginación; contadores conciliados; lectura/acciones persistentes; round-robin respeta carga y turno.
- **Prioridad:** P1. **Estado:** Pendiente.
- **Reconciliación:** AUD-NG-205 indica helper frontend desconectado y ausencia de `getUserWorkInbox`. TASK-221/TASK-318 son relacionados; reutilizar si cubren el contrato, sin declarar cobertura completa sin agregador real.
- **Evidencia de cierre:** pendiente; no se declara ejecución ni verificación en esta migración.

---

<!-- ID: F23-TASK04 | Fuentes: AUDITORIAS/AUDITORIA_FASE_23_MOTOR_INSTITUCIONAL_FLUJOS_TRABAJO.md -->
### [ ] [F23-TASK04] Implementar motor de reglas condicionales y compuertas AND/OR
- **Hallazgo de origen:** F23-005 y F23-021; sección C y H.
- **Severidad:** Alta. **Objetivo:** enrutar trámites según reglas institucionales sin permitir que el cliente elija la siguiente etapa.
- **Acción ejecutable:** definir lenguaje de expresiones seguro; evaluar monto, categoría, urgencia y departamento; soportar compuertas AND/OR y fork/join; versionar reglas junto al flujo.
- **Archivos/módulos:** `backend/user-service/Code.gs`, `saveApprovalWorkflow`, `processWorkflowDecision`, `FlujosAprobacion`, `PasosEtapasJSON`.
- **Dependencias/riesgos:** F23-Task01 y esquema/versionado; riesgo de ejecución arbitraria o saltos de aprobación.
- **Alcance:** reglas definidas por Administrador; no evaluar JavaScript libre.
- **Criterios de aceptación:** expresiones validan sintaxis/tipos; variables permitidas por lista; reglas reproducibles; fork/join correcto; rutas no elegibles rechazadas; cambios versionados y auditados.
- **Prioridad:** P1. **Estado:** Pendiente.
- **Evidencia de cierre:** pendiente; el informe describe transición lineal/manual y ausencia del motor.

---

<!-- ID: F24-TASK06 | Fuentes: AUDITORIAS/AUDITORIA_FASE_24_INFORMES_INDICADORES_ANALISIS_INSTITUCIONAL.md -->
### [ ] [F24-TASK06] Validar filtros temporales, fiscales y estructura institucional en todos los informes
- **Hallazgo de origen:** F24-003/F24-004, E y G; relación con TASK-052.
- **Severidad:** Alta. **Objetivo:** asegurar que períodos y dimensiones institucionales aplican de forma consistente en backend y UI.
- **Acción ejecutable:** validar rangos invertidos, límites y cruce de ejercicios fiscales; implementar cascada grado-sección y filtros de departamento/área; unificar contrato de filtros entre catálogo, generador, exportador y DataMart.
- **Archivos/módulos:** `generateInstitutionalReport`, `getCurricularAnalyticsReport`, `getComparativeFinancialSummary`, `js/ui-common.js`, formularios de filtros.
- **Dependencias/riesgos:** F24-Task01/02/03/04 y calendarios académicos/fiscales; riesgo de reportes con muestras parciales o períodos inconsistentes.
- **Alcance:** validación y aplicación real de filtros; no mostrar controles que el generador ignora.
- **Criterios de aceptación:** fechas inicio/fin válidas; cruce fiscal explícito; grado limita secciones; dimensiones y filtros se aplican a la fuente antes del cálculo; mismo filtro produce mismo resultado en UI/CSV/XLSX; filtros no autorizados se rechazan.
- **Prioridad:** P1. **Estado:** Pendiente.
- **Reconciliación:** TASK-052 es referencia posterior para filtros/dimensiones; no se considera cerrada sin pruebas por informe y conciliación de resultados.
- **Evidencia de cierre:** pendiente; no se declara ejecución ni verificación en esta migración.

---

<!-- ID: F24-TASK07 | Fuentes: AUDITORIAS/AUDITORIA_FASE_24_INFORMES_INDICADORES_ANALISIS_INSTITUCIONAL.md -->
### [ ] [F24-TASK07] Unificar dashboards por rol e informes personalizados
- **Hallazgo de origen:** F24-007/F24-009/F24-020/F24-A06/F24-A07 y J.
- **Severidad:** Alta. **Objetivo:** presentar indicadores relevantes por responsabilidad institucional y permitir configuraciones personales autorizadas.
- **Acción ejecutable:** consolidar dashboards globales para Dirección, Coordinación, Contabilidad, Secretaría y Docentes; agregar constructor de informes personalizados con selección de columnas/agrupaciones; validar cada métrica y columna contra catálogo y permisos.
- **Archivos/módulos:** `dynamic-dashboard.html`, `js/ui-common.js`, `js/accounting.js`, `js/teacher.js`, servicios analíticos.
- **Dependencias/riesgos:** F24-Task01/02/06 y RBAC/ABAC; riesgo de mostrar indicadores fuera del ámbito del usuario.
- **Alcance:** paneles y personalización; no permitir fórmulas libres ni acceso transversal no autorizado.
- **Criterios de aceptación:** dashboard por rol con fuentes verificadas; Docente solo ve sus grupos/asignaturas; widgets configurables con lista permitida; filtros conservan ámbito; diseño responsivo; configuración versionada.
- **Prioridad:** P1. **Estado:** Pendiente.
- **Evidencia de cierre:** pendiente; el informe describe endpoints y UI parcial, pero no unificación global ni constructor personalizado.

---

<!-- ID: F26-TASK06 | Fuentes: AUDITORIAS/AUDITORIA_FASE_26_CONFIGURACION_INSTITUCIONAL_PERSONALIZACION.md -->
### [ ] [F26-TASK06] Persistir y recuperar vistas personalizadas de informes por usuario y ámbito
- **Hallazgo de origen:** F26-008; sección C.7 e I (próximo paso: vistas guardadas).
- **Severidad:** Media / P1. **Objetivo:** permitir guardar configuraciones de informes y dashboards para reutilizarlas con permisos y filtros consistentes.
- **Acción ejecutable:** ampliar `F24-Task07` (dashboards e informes personalizados) con persistencia de vistas: propietario, institución/departamento, informe, columnas, agrupaciones, filtros, orden, versión y fecha; permitir guardar, duplicar, editar, activar y eliminar; validar permisos al guardar y al recuperar.
- **Archivos/módulos:** `js/ui-common.js` (`modal-dashboard-settings`); `dynamic-dashboard.html`; servicios User/Academic/Accounting y catálogo de informes; nueva estructura `VistasInformesUsuario`.
- **Dependencias/riesgos:** F26-Task01, F24-Task07, F24-Task01 (catálogo/permisos) y F24-Task06 (filtros); riesgo de compartir vistas entre cuentas o persistir filtros que concedan acceso adicional.
- **Alcance:** ampliación de F24-Task07, no crear un segundo constructor de informes; la vista guardada nunca sustituye autorización del generador ni ámbito del usuario actual.
- **Criterios de aceptación:** vistas persistidas por usuario/ámbito; recuperación respeta permisos vigentes; filtros se revalidan en backend; compartir requiere permiso explícito; versiones y propietario trazables; pruebas de aislamiento multiusuario, filtros, borrado y compatibilidad de informes.
- **Prioridad:** P1. **Estado:** Pendiente (ampliación de F24-Task07).
- **Evidencia de cierre:** pendiente; el informe identifica reportes configurables parcialmente implementados y ausencia de persistencia de vistas personalizadas.

---

<!-- ID: F30-TASK10 | Fuentes: AUDITORIAS/AUDITORIA_FASE_30_CONSOLIDACION_CERTIFICACION_MEJORA_CONTINUA.md -->
### [ ] [F30-TASK10] Clasificar tickets automáticamente y calcular SLA de soporte
- **Hallazgo de origen:** F30-13; tickets sin severidad automática ni tiempos límite.
- **Severidad:** Alta / P1. **Objetivo:** priorizar incidencias y hacer visible el tiempo de respuesta comprometido.
- **Acción ejecutable:** ampliar `TASK-279` y `TASK-318` con clasificación P0-P3 basada en reglas explicables, categoría, impacto, urgencia, SLA por severidad/horario, pausas justificadas, escalamiento y notificación de vencimiento.
- **Archivos/módulos:** `backend/user-service/Code.gs`, `submitProblemTicket`, `getProblemTickets`, `replyProblemTicket`, `TicketsReporteProblemas`, bandeja personal/departamental.
- **Dependencias/riesgos:** TASK-279 (clasificación/SLA), TASK-318 (bandeja personal/SLA), TASK-316 (notificaciones); riesgo de falsos positivos o cambios de severidad sin auditoría.
- **Alcance:** soporte institucional; no convertir clasificación automática en cierre automático ni alterar el historial de tickets.
- **Criterios de aceptación:** severidad/categoría calculadas con reglas versionadas; usuario puede solicitar revisión; SLA medido con calendario institucional; pausas/escalamiento auditados; bandeja muestra vencimiento y responsable; pruebas de prioridades, horarios no laborables y reapertura.
- **Prioridad:** P1. **Estado:** Pendiente (ampliación de TASK-279/TASK-318).
- **Evidencia de cierre:** pendiente; F30-13 señala que el módulo de tickets carece de clasificación automática y cálculo de SLA.

---

<!-- ID: F31-TASK08 | Fuentes: AUDITORIAS/AUDITORIA_FASE_31_DISENADOR_UNIVERSAL_DOCUMENTOS_PLANTILLAS.md -->
### [ ] [F31-TASK08] Gestionar estilos corporativos globales y encabezados diferenciados
- **Hallazgo de origen:** F31-03; plan G.8.
- **Severidad:** Alta / P1. **Objetivo:** mantener identidad visual consistente con encabezados/pies por página y estilos reutilizables.
- **Acción ejecutable:** ampliar `configFormatoJSON` con bibliotecas versionadas de estilos, logotipo, tipografía, márgenes, encabezado primera página y páginas pares/impares; permitir herencia por institución/departamento y previsualización.
- **Archivos/módulos:** `backend/user-service/Code.gs`, `PlantillasEscolares`, `configFormatoJSON`, editor WYSIWYG y generador PDF.
- **Dependencias/riesgos:** F26-Task01 (ámbitos), F26-Task02 (formatos regionales), F31-Task01; riesgo de sobrescribir estilos locales o generar diferencias entre vista previa y PDF.
- **Alcance:** estilos de presentación y herencia; no alterar contenido legal ni permitir recursos externos inseguros.
- **Criterios de aceptación:** estilos versionados por ámbito; precedencia definida; primera página/par/impar configurables; render consistente; previsualización; cambios auditados; pruebas de múltiples plantillas, departamentos y exportación.
- **Prioridad:** P1. **Estado:** Pendiente.
- **Evidencia de cierre:** pendiente; la matriz B identifica formato básico, pero falta biblioteca corporativa y encabezados diferenciados.

---

<!-- ID: F33-TASK04 | Fuentes: AUDITORIAS/AUDITORIA_FASE_33_FORMULARIOS_INSTITUCIONALES_TRAMITES_DIGITALES.md -->
### [ ] [F33-TASK04] Crear consola unificada de trámites y bandejas operativas por SLA
- **Hallazgo de origen:** Fase 33-16 y riesgo G.3.
- **Severidad:** Alta / P1. **Objetivo:** permitir a Secretaría y Dirección supervisar trámites por estado, prioridad, departamento, responsable y vencimiento.
- **Acción ejecutable:** implementar bandeja central con filtros, búsqueda, paginación, semáforos de SLA, asignación, historial y acciones permitidas por rol; obtener contadores desde backend y no desde arreglos locales.
- **Archivos/módulos:** dashboards de Secretaría/Dirección, `js/ui-common.js`, `backend/user-service/Code.gs`, `getAdministrativeRequests`, `SolicitudesTramites`.
- **Dependencias/riesgos:** TASK-221/TASK-318 (bandejas personales/departamentales y SLA), TASK-279 (clasificación de tickets, solo como patrón de SLA); riesgo de exponer trámites de otros departamentos o mostrar estados desactualizados.
- **Alcance:** bandeja de trámites; no duplicar la bandeja general de trabajo ni reutilizar sin adaptación el SLA de tickets.
- **Criterios de aceptación:** filtros aplicados server-side; autorización por rol/departamento; SLA con calendario y prioridad; asignación/acciones auditadas; paginación estable; estados de carga/error; pruebas multirol, vencimiento, reasignación y acceso cruzado.
- **Prioridad:** P1. **Estado:** Pendiente.
- **Evidencia de cierre:** pendiente; el portal familiar lista solicitudes, pero falta consola centralizada para Secretaría y Dirección.

---

<!-- ID: F33-TASK05 | Fuentes: AUDITORIAS/AUDITORIA_FASE_33_FORMULARIOS_INSTITUCIONALES_TRAMITES_DIGITALES.md -->
### [ ] [F33-TASK05] Implementar distribución dinámica y delegación temporal de responsables
- **Hallazgo de origen:** Fase 33-08 y plan H.5.
- **Severidad:** Alta / P1. **Objetivo:** asignar automáticamente trámites al responsable correcto según departamento/grado y cubrir ausencias sin transferir privilegios permanentes.
- **Acción ejecutable:** definir reglas de enrutamiento por tipo de trámite, institución, departamento y grado; permitir delegación temporal con inicio/fin, acciones permitidas, sustituto, revocación y registro de ambos actores.
- **Archivos/módulos:** `backend/user-service/Code.gs`, `saveApprovalWorkflow`, `processWorkflowDecision`, `FlujosAprobacion`, `ROLE_PERMISSIONS`.
- **Dependencias/riesgos:** F30-Task08 (delegación temporal), F23-Task12 (delegación en motor de workflows), AUD-NG-024 (identidad del revisor); riesgo de delegación circular, fuera de ámbito o autoaprobación.
- **Alcance:** asignación/delegación de trámites; no modificar rol base ni delegar acciones no permitidas.
- **Criterios de aceptación:** reglas versionadas; asignación server-side; delegación con vigencia y revocación; actor original y sustituto trazables; restricciones de autoaprobación; pruebas de expiración, ausencia, departamento y conflictos.
- **Prioridad:** P1. **Estado:** Pendiente.
- **Evidencia de cierre:** pendiente; existen flujos secuenciales, pero el plan identifica falta de distribución dinámica y sustitución temporal.

---

<!-- ID: F34-TASK05 | Fuentes: AUDITORIAS/AUDITORIA_FASE_34_BANDEJAS_REVISION_FIRMAS.md -->
### [ ] [F34-TASK05] Registrar historial de asignaciones, reasignaciones y traspasos
- **Hallazgo de origen:** F34-04 y CAR-F34-07.
- **Severidad:** Alta / P1. **Objetivo:** conocer quién asignó o reasignó cada expediente, a quién, cuándo y por qué motivo.
- **Acción ejecutable:** crear bitácora append-only de asignaciones con solicitud, actor, responsable anterior/nuevo, departamento, motivo, timestamp, estado y origen de la regla; validar que el responsable esté activo y pertenezca al ámbito; permitir revisión colegiada cuando corresponda.
- **Archivos/módulos:** `backend/user-service/Code.gs`, `processWorkflowDecision`, `updateRequestStatus`, `FlujosAprobacion`, `SolicitudesTramites` y nueva hoja `HistorialAsignacionesTramites`.
- **Dependencias/riesgos:** F30-Task08 (delegación temporal), F33-Task05 (distribución dinámica), AUD-NG-024 (identidad del revisor); riesgo de asignar a usuarios inactivos o perder trazabilidad.
- **Alcance:** historial y validación de asignaciones; no sustituir el motor de workflow ni permitir que el cliente asigne responsables arbitrarios.
- **Criterios de aceptación:** cada traspaso append-only; actor derivado de sesión; responsable activo/ámbito validado; motivo obligatorio; asignación múltiple/collegiada con reglas explícitas; pruebas de usuario inactivo, departamento ajeno, delegación vencida y reasignación concurrente.
- **Prioridad:** P1. **Estado:** Pendiente.
- **Evidencia de cierre:** pendiente; el backend permite reasignar, pero no conserva historial ni valida todos los casos de pertenencia/actividad.

---

<!-- ID: F37-TASK05 | Fuentes: AUDITORIAS/AUDITORIA_FASE_37_AISLAMIENTO_DATOS_ASIGNACION_DEPARTAMENTOS.md -->
### [ ] [F37-TASK05] Diagnosticar registros huérfanos y desalineados entre departamentos
- **Hallazgo de origen:** F37-12; PT-F37-31; CAR-F37-12.
- **Severidad:** Alta / P1 según el plan I. **Objetivo:** identificar registros almacenados en un destino distinto del propietario esperado y relaciones huérfanas.
- **Acción ejecutable:** implementar escaneo de integridad que compare entidad, ámbito, catálogo de destino y relaciones; generar informe con ubicación real/esperada, origen de escritura, impacto y prioridad; permitir exportar hallazgos.
- **Archivos/módulos:** `backend/developer-service/Code.gs`, `CatalogoSpreadsheets`, `RegistroEventos`, `AuditoriaMigraciones` y servicios Academic/Accounting.
- **Dependencias/riesgos:** F37-Task01/02/03, F30-Task02, F29-Task18; riesgo de marcar como error un registro histórico válido o reparar sin preservar relaciones.
- **Alcance:** diagnóstico y reporte; la reparación se ejecuta solo mediante F37-Task09 y aprobación.
- **Criterios de aceptación:** escaneo de todas las áreas; destino esperado/real; referencias huérfanas y duplicados diferenciados; evidencia/correlationId; exportación de resultados; pruebas de hoja incorrecta, referencia rota y registro histórico legítimo.
- **Prioridad:** P1 en el plan I; la bitácora histórica asigna P0 a Task05. **Estado:** Pendiente.
- **Evidencia de cierre:** pendiente; PT-F37-31 confirma que no existe diagnóstico de registros mal asignados.

---

<!-- ID: F37-TASK10 | Fuentes: AUDITORIAS/AUDITORIA_FASE_37_AISLAMIENTO_DATOS_ASIGNACION_DEPARTAMENTOS.md -->
### [ ] [F37-TASK10] Automatizar pruebas de aislamiento y enrutamiento interdepartamental
- **Hallazgo de origen:** PT-F37-01..PT-F37-32; fallos de destino, proyección, referencias, idempotencia y diagnóstico.
- **Severidad:** Alta / P1. **Objetivo:** prevenir regresiones en límites entre departamentos y servicios.
- **Acción ejecutable:** ampliar AUD-NG-161 con fixtures multiinstitución/departamento, roles, esquemas, destinos, referencias y concurrencia; verificar que los endpoints devuelvan solo campos permitidos y que escrituras fuera de ámbito se rechacen.
- **Archivos/módulos:** `tests/regression/academic-grading-suite.js`, servicios User/Academic/Accounting/Developer, entorno de pruebas aislado.
- **Dependencias/riesgos:** F37-Task01..Task09, AUD-NG-161; riesgo de contaminar datos reales o de aprobar pruebas estructurales sin validar efectos.
- **Alcance:** pruebas conductuales aisladas; no usar hojas productivas ni enviar notificaciones reales.
- **Criterios de aceptación:** 32 escenarios reproducibles; fixtures con dos sedes/departamentos; pruebas positivas/negativas; no fuga de campos; escrituras idempotentes; limpieza/rollback; evidencia por escenario y versión.
- **Prioridad:** P1. **Estado:** Pendiente.
- **Evidencia de cierre:** pendiente; la matriz de 32 pruebas contiene fallos funcionales que deben convertirse en regresiones automatizadas.

---

<!-- ID: F39-TASK07 | Fuentes: AUDITORIAS/AUDITORIA_FASE_39_DIGITALIZACION_TRANSICION.md -->
### [ ] [F39-TASK07] Crear tablero directivo de avance de digitalización por departamento
- **Hallazgo de origen:** 3.11 y CAR-F39-11; P21 no aprobado.
- **Severidad:** Alta / P1. **Objetivo:** supervisar volumen inventariado, migrado, pendiente, duplicado y con errores por área.
- **Acción ejecutable:** construir dashboard con métricas derivadas de `InventarioDocumentalLegado`, lotes y manifiestos; segmentar por departamento, tipo, periodo y estado; mostrar frescura, responsable y tendencia.
- **Archivos/módulos:** dashboard Dirección, `backend/developer-service/Code.gs`, `InventarioDocumentalLegado`, reportes institucionales.
- **Dependencias/riesgos:** F39-Task01/02/05/08, F24-Task03/07 y F30-Task12; riesgo de porcentajes engañosos si los denominadores no están completos.
- **Alcance:** métricas de progreso; no inferir digitalización completa a partir de archivos cargados sin verificación.
- **Criterios de aceptación:** conteos por estado/departamento; denominador y fecha de actualización visibles; conciliación con inventario; permisos por rol; filtros y exportación; pruebas con lotes parciales y documentos rechazados.
- **Prioridad:** P1. **Estado:** Pendiente.
- **Evidencia de cierre:** pendiente; no existe dashboard de avance de digitalización por departamento.

---

<!-- ID: F39-TASK19 | Fuentes: AUDITORIAS/AUDITORIA_FASE_39_DIGITALIZACION_TRANSICION.md -->
### [ ] [F39-TASK19] Implementar búsqueda documental por metadatos y contenido
- **Hallazgo de origen:** CAR-F39-14; búsqueda cruzada insuficiente por expediente, fecha y tipo.
- **Severidad:** Media / P1. **Objetivo:** localizar documentos digitales e históricos por atributos y contenido extraído autorizado.
- **Acción ejecutable:** indexar tipo, fecha, departamento, expediente, CUV, hash, origen y estado; incorporar texto extraído de DOCX/PDF/OCR cuando exista; aplicar permisos/ámbitos a cada resultado y permitir filtros cruzados.
- **Archivos/módulos:** servicios Academic/User/Developer, `DocumentosEstudiante`, `DocumentosEscolaresEmitidos`, índice de búsqueda y portal documental.
- **Dependencias/riesgos:** F39-Task01/04/05, F32-Task10 (OCR), F37-Task02 (proyección mínima); riesgo de indexar texto sensible y devolver resultados de otro departamento.
- **Alcance:** búsqueda por metadatos y texto autorizado; no indexar contenido sin política de privacidad/retención.
- **Criterios de aceptación:** metadatos normalizados; filtros por expediente/fecha/tipo/departamento; texto indexado solo con permiso; resultados respetan ABAC; reindexación y eliminación controladas; pruebas multiárea, documento revocado y texto confidencial.
- **Prioridad:** P1. **Estado:** Pendiente.
- **Evidencia de cierre:** pendiente; CAR-F39-14 requiere búsqueda cruzada por metadatos y contenido.

---

<!-- ID: TASK-169 | Fuentes: Pendientes.md ; pendientes/Dirección/Pendientes.md -->
### [ ] [TASK-169] Implementar el checklist configurable de incorporación de empleados (Onboarding)
- **Origen del Hallazgo:** `AUDITORIA_FASE_16_RECURSOS_HUMANOS.md` / Sección F (Brecha F.4) y Sección H (P1)
- **Prioridad:** P1
- **Severidad/Clasificación:** Alta (Calidad en la contratación, control de requisitos legales y onboarding estructurado)
- **Archivos Involucrados:**
  - `backend/accounting-service/Code.gs`
  - `dashboard-recursos-humanos.html`
  - `ExpedientesLaborales`
  - `ContratosLaborales`
  - `uploadEmployeeDocument`
  - Nueva entidad lógica `ChecklistIncorporacion`
- **Dependencias Expuestas:** `ExpedientesLaborales`, `ContratosLaborales`, `CandidatosVacantes`, Google Drive
- **Descripción del Alcance:**
  La creación de un expediente permite registrar a un empleado, pero no existe un proceso estructurado que controle las tareas y requisitos necesarios para completar su incorporación (onboarding). Actualmente no hay una lista formal que permita verificar si se firmó el contrato, se cotejaron títulos, se entregaron antecedentes, se realizó la inducción y se completaron las asignaciones de herramientas y cuentas.
  Requerimientos Funcionales Detallados:
  1. Plantillas de incorporación configurables:
     - Diseñar plantillas diferenciadas según el cargo, departamento, tipo de contrato (docente vs administrativo) y políticas institucionales.
     - Tareas parametrizables: firma de contrato laboral, recepción y validación de DNI/RTN, cotejo presencial de títulos académicos, antecedentes penales/policiales, carnet IHSS, examen médico de ingreso, asignación de cargo y departamento, asignación de área académica, horario laboral asignado, creación de correo institucional, entrega de equipo de cómputo, inducción institucional y aceptación firmada de políticas de privacidad y financieras.
     - Clasificar cada tarea como obligatoria u opcional, estableciendo responsables y fechas límite de cumplimiento.
  2. Seguimiento y ejecución del proceso:
     - Generar automáticamente el checklist individual al crear un empleado o formalizar una contratación.
     - Permitir registrar fecha de finalización, responsable que validó la tarea y adjuntar documentos probatorios a Google Drive.
     - Estados de tarea: `Pendiente`, `EnRevision`, `Completada`, `Rechazada`, `Exenta` (exigiendo motivo obligatorio de al menos 10 caracteres si es exenta o rechazada).
     - Mostrar porcentaje de avance del proceso en el dashboard de Recursos Humanos.
     - Permitir que el empleado consulte y cargue documentos desde su portal de autoservicio (`getEmployeeSelfServicePortal`), mientras que RRHH valida y aprueba.
  3. Estados del ciclo de incorporación:
     - Transiciones: `ExpedienteCreado` -> `IncorporacionPendiente` -> `IncorporacionEnRevision` -> `IncorporacionCompletada` -> `Activo`.
     - La activación plena del empleado debe depender del cumplimiento estricto de las tareas obligatorias configuradas.
     - Reutilizar la información existente si el empleado proviene de la selección en `CandidatosVacantes` sin duplicar registros.
- **Criterios de Aceptación:**
  - Se pueden crear y editar plantillas de onboarding desde el dashboard de Recursos Humanos.
  - El sistema crea la lista de tareas individualizada al iniciar la incorporación de un empleado.
  - Cada tarea registra estado, responsable, fecha de validación y archivo adjunto en Drive.
  - La falta de cumplimiento de tareas obligatorias impide el cambio a estado laboral `Activo`.
  - Las tareas opcionales no bloquean la activación del empleado.
  - Una tarea rechazada permite al colaborador corregir y volver a cargar la evidencia.
  - La formalización de un candidato seleccionado reutiliza sus datos sin crear expedientes duplicados.
- **Estado:** [ ] Pendiente

<!-- Fuente: RECUPERACION/Pendientes_RECUPERADO.md, líneas 7127-7169; clave TASK-170; asignación única: Dirección -->

---

<!-- ID: TASK-170 | Fuentes: Pendientes.md ; pendientes/Dirección/Pendientes.md -->
### [ ] [TASK-170] Incorporar proyección de vacaciones futuras y mejorar la gestión de permisos por horas y fracciones de jornada
- **Origen del Hallazgo:** `AUDITORIA_FASE_16_RECURSOS_HUMANOS.md` / Sección C (C.3), Sección F y Sección H (P1)
- **Prioridad:** P1
- **Severidad/Clasificación:** Alta (Experiencia de usuario, planificación del descanso y cumplimiento del Código del Trabajo)
- **Archivos Involucrados:**
  - `backend/accounting-service/Code.gs`
  - `calculateVacationBalances`
  - `submitLeaveVacationRequest`
  - `reviewVacationRequest`
  - `SolicitudesVacaciones`
  - `IncapacidadesMedicas`
  - `HorariosLaborales`
  - `dashboard-recursos-humanos.html`
- **Dependencias Expuestas:** `SolicitudesVacaciones`, `calculateVacationBalances`, `HorariosLaborales`, Portal de Autoservicio
- **Descripción del Alcance:**
  El cálculo actual de vacaciones en `calculateVacationBalances` aplica la escala legal hondureña del Artículo 348 (10, 12, 15 y 20 días según antigüedad). Sin embargo, la auditoría identificó que no se proyecta adecuadamente el saldo disponible a una fecha futura, lo que dificulta solicitar vacaciones que se disfrutarán cuando el empleado ya haya alcanzado la antigüedad necesaria. Además, se requiere ampliar la gestión de permisos por fracciones de jornada y evitar solapamientos.
  Requerimientos Funcionales Detallados:
  1. Proyección de saldos futuros de vacaciones:
     - Diferenciar con total claridad: días ya devengados y disponibles actualmente, días gozados, días en solicitudes aprobadas pendientes de disfrute, días que se proyecta generar hasta la fecha solicitada y saldo neto proyectado a la fecha de disfrute.
     - Calcular la proyección según la fecha de aniversario laboral y antigüedad legal conforme al Artículo 348.
     - Permitir seleccionar fechas futuras comprobando si el empleado tendrá saldo suficiente al momento del goce.
     - Mostrar advertencias claras cuando la solicitud dependa de días aún no devengados.
     - Parametrizar en la plataforma si la institución autoriza o no solicitudes basadas en saldo proyectado.
     - La proyección es un cálculo estimativo y no debe acreditar anticipadamente días en el saldo devengado actual.
  2. Gestión de permisos por horas y fracciones de jornada:
     - Permitir solicitudes por jornada completa, media jornada o por cantidad de horas específicas.
     - Calcular la equivalencia en días o deducir horas según el horario asignado al empleado en `HorariosLaborales`.
     - Excluir días feriados, descansos semanales y días no laborables institucionales del cómputo.
  3. Control de solapamientos y concurrencia:
     - Detectar solapamientos entre solicitudes de vacaciones, permisos personales e incapacidades médicas en `IncapacidadesMedicas`.
     - Evitar que dos solicitudes simultáneas consuman el mismo saldo disponible mediante candados de script.
     - Reflejar inmediatamente las vacaciones y permisos aprobados en los reportes de asistencia laboral (`DeduccionesAsistencia`).
- **Criterios de Aceptación:**
  - El saldo actual coincide exactamente con la escala del Art. 348 del Código del Trabajo.
  - La proyección a fechas futuras calcula los días que se devengarán sin inflar el saldo legal actual.
  - Los días aprobados se descuentan una sola vez; las solicitudes rechazadas o canceladas no descuentan saldo.
  - Se pueden gestionar permisos por fracciones de jornada calculando la duración según el horario asignado.
  - Se detectan y bloquean solicitudes con fechas solapadas para el mismo empleado.
  - Los resultados se presentan con idéntica consistencia matemática en RRHH y en el autoservicio del empleado.
- **Estado:** [ ] Pendiente

<!-- Fuente: RECUPERACION/Pendientes_RECUPERADO.md, líneas 7170-7204; clave TASK-171; asignación única: Dirección -->

---

<!-- ID: TASK-171 | Fuentes: Pendientes.md ; pendientes/Dirección/Pendientes.md -->
### [ ] [TASK-171] Implementar validación de jerarquías organizativas y prevención de ciclos
- **Origen del Hallazgo:** `AUDITORIA_FASE_16_RECURSOS_HUMANOS.md` / Sección F (Brecha en F16-02) y Sección H (P1)
- **Prioridad:** P1
- **Severidad/Clasificación:** Alta (Integridad de la estructura organizativa y prevención de recurrencia infinita)
- **Archivos Involucrados:**
  - `backend/user-service/Code.gs`
  - `manageDepartmentPositions`
  - `CatalogoDepartamentos`
  - `CatalogoCargos`
  - `HistorialAdscripciones`
  - `dashboard-recursos-humanos.html`
- **Dependencias Expuestas:** `manageDepartmentPositions`, `CatalogoDepartamentos`, `CatalogoCargos`
- **Descripción del Alcance:**
  La plataforma permite administrar departamentos y cargos, pero la auditoría identificó que no existe una validación algorítmica para impedir dependencias jerárquicas circulares (ej. Departamento A depende de B y B depende de A). Esto puede provocar bucles infinitos y errores al consultar organigramas, líneas de mando y aprobaciones.
  Requerimientos Funcionales Detallados:
  1. Algoritmo de detección de ciclos en grafos jerárquicos:
     - Validar la jerarquía en backend antes de persistir cualquier creación o modificación de departamento o cargo.
     - Impedir que una unidad dependa de sí misma (ciclo directo).
     - Impedir que una unidad dependa de cualquiera de sus unidades subordinadas o descendientes (ciclos indirectos de N niveles).
     - Permitir múltiples departamentos raíz de nivel superior (sin padre).
     - Diferenciar claramente las jerarquías administrativas de las líneas de coordinación académica.
  2. Integridad referencial y mensajes de error:
     - Rechazar asignaciones de superiores que apunten a departamentos inexistentes o inactivos.
     - Proporcionar mensajes explicativos claros identificando la cadena de dependencias conflictiva en caso de rechazo.
     - Incorporar pruebas unitarias para grafos de árbol válidos y grafos con ciclos simulados.
- **Criterios de Aceptación:**
  - Se rechaza inmediatamente cualquier intento de asignar una unidad como dependiente de sí misma.
  - Se detectan y rechazan ciclos indirectos de dos o más niveles de profundidad.
  - Se permiten estructuras jerárquicas válidas de múltiples niveles sin restricciones indebidas.
  - Las operaciones rechazadas no alteran los registros de departamentos ni causan estados huérfanos.
  - La consulta de líneas de mando maneja estructuras extensas sin generar desbordamiento de pila o bucles infinitos.
- **Estado:** [ ] Pendiente

<!-- Fuente: RECUPERACION/Pendientes_RECUPERADO.md, líneas 7205-7238; clave TASK-172; asignación única: Dirección -->

---

<!-- ID: TASK-172 | Fuentes: Pendientes.md ; pendientes/Dirección/Pendientes.md -->
### [ ] [TASK-172] Integrar alertas de vencimiento documental y contractual en el panel de Recursos Humanos
- **Origen del Hallazgo:** `AUDITORIA_FASE_16_RECURSOS_HUMANOS.md` / Sección B (F16-08, F16-18) y Sección H (P1)
- **Prioridad:** P1
- **Severidad/Clasificación:** Alta (Continuidad contractual, cumplimiento legal y experiencia del administrador)
- **Archivos Involucrados:**
  - `backend/accounting-service/Code.gs`
  - `getEmployeeContractAlerts`
  - `uploadEmployeeDocument`
  - `getEmployeeDocuments`
  - `ContratosLaborales`
  - `ExpedientesLaborales`
  - `dashboard-recursos-humanos.html`
- **Dependencias Expuestas:** `getEmployeeContractAlerts`, `ContratosLaborales`, `DocumentosLaborales`, Notificaciones
- **Descripción del Alcance:**
  La plataforma dispone de endpoints backend para consultar alertas de contratos (`getEmployeeContractAlerts`), pero parte de esta información no está integrada en una vista de semáforo centralizada en la consola de Recursos Humanos, obligando a revisiones manuales aisladas.
  Requerimientos Funcionales Detallados:
  1. Vista centralizada de alertas laborales y documentales:
     - Visualizar en `dashboard-recursos-humanos.html` un panel consolidado de vencimientos: contratos por vencer, contratos vencidos, documentos laborales expirados (certificaciones, constancias de antecedentes), credenciales por renovar y requisitos obligatorios faltantes.
     - Filtros interactivos por departamento, cargo, empleado, tipo de documento y nivel de urgencia.
     - Configuración de anticipación de alertas (30, 60, 90 días) configurable desde la plataforma.
  2. Gestión de renovaciones y trazabilidad:
     - Permitir registrar la renovación contractual o actualización de documentos directamente desde el panel de alerta.
     - Conservar las versiones documentales anteriores asociadas al historial del empleado sin destruirlas.
     - Despachar notificaciones automáticas preventivas al responsable de RRHH y al colaborador involucrado.
- **Criterios de Aceptación:**
  - El panel de RRHH muestra los contratos próximos a vencer con alertas diferenciadas por color según su urgencia.
  - Los documentos laborales vencidos se identifican y listan automáticamente.
  - La renovación de un contrato archiva la versión anterior y actualiza la vigencia activa.
  - Las alertas resueltas se retiran de la bandeja de pendientes conservando su registro histórico.
  - El módulo de alertas respeta los permisos RBAC impidiendo el acceso a personal no autorizado.
- **Estado:** [ ] Pendiente

<!-- Fuente: RECUPERACION/Pendientes_RECUPERADO.md, líneas 7239-7271; clave TASK-173; asignación única: Dirección -->

---

<!-- ID: TASK-173 | Fuentes: Pendientes.md ; pendientes/Dirección/Pendientes.md -->
### [ ] [TASK-173] Validar colisiones entre horarios laborales, asignaciones docentes y sustituciones
- **Origen del Hallazgo:** `AUDITORIA_FASE_16_RECURSOS_HUMANOS.md` / Sección F (Brecha en F16-09) y Sección H (P1)
- **Prioridad:** P1
- **Severidad/Clasificación:** Alta (Coherencia en la planificación, disponibilidad docente y prevención de solapamientos)
- **Archivos Involucrados:**
  - `backend/accounting-service/Code.gs`
  - `backend/academic-service/Code.gs`
  - `HorariosLaborales`
  - `AsignacionesTurnosLaborales`
  - `AsignacionesDocentes`
  - `createTeacherSubstitution`
  - `manageWorkShiftAndSubstitution`
- **Dependencias Expuestas:** `HorariosLaborales`, `AsignacionesDocentes`, `createTeacherSubstitution`, `HorariosClase`
- **Descripción del Alcance:**
  La planificación laboral y académica está implementada, pero algunas validaciones de horarios docentes se realizan en memoria. Se requiere garantizar la detección rigurosa de incompatibilidades en backend entre la jornada laboral del contrato, los turnos asignados, las clases impartidas y las sustituciones temporales.
  Requerimientos Funcionales Detallados:
  1. Motor de validación de disponibilidad y solapamiento:
     - Contrastar asignaciones laborales y académicas activas al programar o modificar turnos, clases o sustituciones.
     - Validar que un docente no reciba una clase o sustitución fuera de su jornada laboral contratada, ni durante turnos de almuerzo o descansos asignados.
     - Detectar colisiones entre: jornada laboral, horario de clases en aula, turnos de apoyo, sustituciones activas y permisos/vacaciones aprobados en `SolicitudesVacaciones`.
  2. Manejo de excepciones autorizadas:
     - Permitir registrar excepciones justificadas (ej. horas extras autorizadas, eventos institucionales de fin de semana) exigiendo usuario autorizador y motivo formal.
     - Mostrar advertencias visuales descriptivas antes de confirmar cualquier asignación con conflicto de horario.
- **Criterios de Aceptación:**
  - El sistema detecta y bloquea solapamientos entre clases y turnos laborales en backend.
  - No se pueden asignar sustituciones docentes en fechas u horas con permisos de ausencia o vacaciones aprobadas.
  - Se consideran estrictamente las fechas de inicio y fin de vigencia de cada compromiso.
  - Las asignaciones históricas ya vencidas no generan falsos positivos de colisión.
  - Las excepciones autorizadas quedan registradas con trazabilidad del responsable directivo.
- **Estado:** [ ] Pendiente

<!-- Fuente: RECUPERACION/Pendientes_RECUPERADO.md, líneas 7351-7383; clave TASK-176; asignación única: Dirección -->

---

<!-- ID: TASK-176 | Fuentes: Pendientes.md ; pendientes/Dirección/Pendientes.md -->
### [ ] [TASK-176] Incorporar una interfaz completa de administración de políticas fiscales, laborales y parámetros de cálculo
- **Origen del Hallazgo:** `AUDITORIA_FASE_17_PLANILLAS_COMPENSACIONES.md` / Sección B (B.7), Sección G y Sección H (P1)
- **Prioridad:** P1
- **Severidad/Clasificación:** Alta (Parametrización contable, gobernanza tributaria y actualización normativa)
- **Archivos Involucrados:**
  - `backend/accounting-service/Code.gs` (`configureFiscalPolicy`, `getFiscalPolicies`)
  - `PoliticasFiscales`
  - `dashboard-recursos-humanos.html`
  - `dashboard-contabilidad.html`
- **Dependencias Expuestas:** `PoliticasFiscales`, `configureFiscalPolicy`, `F17-Task03`, `F17-Task04`, `F17-Task07`
- **Descripción del Alcance:**
  Existen funciones básicas en backend (`configureFiscalPolicy` y `getFiscalPolicies`), pero carecen de una interfaz gráfica completa y amigable para gestionar, auditar y actualizar los parámetros laborales y tributarios de Honduras utilizados en los cálculos.
  Requerimientos Funcionales Detallados:
  1. Consola administrativa de políticas y techos:
     - Visualizar y administrar parámetros por tipo de obligación: ISR (tabla progresiva anual del SAR), IHSS (techos de Salud y Maternidad / IVM y tasas obrero-patronales), RAP (techo y porcentajes), INFOP (1.0% patronal), salario mínimo por actividad económica y recargos de horas extras del Art. 330.
     - Consultar valores activos, versiones y fechas de vigencia.
     - Crear y modificar parámetros sin tocar directamente Google Sheets, exigiendo fuente normativa oficial (acuerdo ejecutivo, ley o decreto) y justificación.
  2. Trazabilidad y control de vigencias:
     - Almacenar historial de versiones de cada parámetro con usuario que autorizó el cambio y timestamp.
     - Identificar parámetros próximos a vencer o sin vigencia definida.
     - Modo borrador/revisión: permitir preparar actualizaciones normativas (ej. cambio anual de techos del IHSS o tramos del ISR) y someterlas a validación antes de su activación.
     - Advertir visualmente si una planilla se va a procesar con parámetros legales vencidos o desactualizados.
     - Evitar que una actualización se aplique retroactivamente sobre planillas de períodos cerrados.
- **Criterios de Aceptación:**
  - El contador o administrador puede actualizar los techos del IHSS y tramos del ISR desde la interfaz.
  - Toda modificación de un parámetro exige registrar la fuente normativa de respaldo.
  - Un usuario sin permisos de rol financiero no puede modificar los parámetros legales.
  - Los parámetros con vigencia futura no afectan los cálculos de nóminas del período corriente.
  - Al consultar una planilla histórica se visualizan con exactitud los parámetros legales vigentes al momento de su cierre.
- **Estado:** [ ] Pendiente

<!-- Fuente: RECUPERACION/Pendientes_RECUPERADO.md, líneas 8718-8759; clave TASK-219; asignación única: Dirección -->

---

<!-- ID: TASK-275 | Fuentes: Pendientes.md ; pendientes/Dirección/Pendientes.md -->
### [ ] [TASK-275] [P1] Panel de Control y Seguimiento Integral de Migraciones
- **Orden de Ejecución:** 27
- **Prioridad:** P1 (Alta)
- **Componentes Afectados:**
  - `dashboards/dashboard-desarrollador.html`, `js/ui-common.js`
  - `backend/accounting-service/Code.gs` (`getComprehensiveMigrationDashboardData`)
- **Subcapacidades Relacionadas:** F29-19.
- **Estado de Partida:** Requiere mejoras.
- **Dependencias Principales:** [F29-Task12], [F29-Task13], [F29-Task14], [F29-Task15], [F29-Task20], [F29-Task21].
- **Problema Detectado y Riesgos:**
  No existe una interfaz centralizada para supervisar en tiempo real el avance de las fuentes, lotes de datos, estado de simulaciones, incidencias pendientes, estado de pilotos y transición operativa.
- **Requisitos Funcionales y Técnicos Convergentes:**
  1. *Vista ejecutiva y operativa de migraciones:*
     - Mostrar por ejecución: fuente, entidad, archivo, responsable, fecha, estado, registros procesados, válidos, rechazados, porcentaje de avance, errores y resultado de conciliación.
     - Filtros multicriterio por fuente, entidad, fecha, estado y prioridad.
  2. *Monitoreo de etapas y pruebas posteriores:*
     - Estado de pruebas de humo post-migración, alertas financieras y de notas.
     - Estado de activaciones de usuarios y avances de pilotos.
     - Vistas diferenciadas por perfil: Dirección (consulta ejecutiva de indicadores) vs Administrador (control operativo).
- **Criterios de Aceptación:**
  - [ ] El panel presenta en tiempo real el estado verídico de todas las migraciones.
  - [ ] Permite identificar inmediatamente ejecuciones detenidas o con fallas críticas.
  - [ ] Los perfiles de consulta no pueden alterar ejecuciones ni forzar aprobaciones.
- **Estado:** [ ] Pendiente

<!-- Fuente: RECUPERACION/Pendientes_RECUPERADO.md, líneas 10539-10574; clave TASK-276; asignación única: Dirección -->

---

<!-- ID: TASK-276 | Fuentes: Pendientes.md ; pendientes/Dirección/Pendientes.md -->
### [ ] [TASK-276] [P1] Gestión Formal de Aprobaciones, Excepciones y Actas de Aceptación Institucional
- **Orden de Ejecución:** 28
- **Prioridad:** P1 (Alta)
- **Componentes Afectados:**
  - `backend/user-service/Code.gs` (`submitMigrationApprovalDecision`, `getMigrationApprovals`)
  - `backend/accounting-service/Code.gs`
  - Hoja: `AprobacionesMigracion`
- **Subcapacidades Relacionadas:** F29-12, F29-15, F29-18.
- **Estado de Partida:** Ausente.
- **Dependencias Principales:** [F29-Task13], [F29-Task14], [F29-Task21], [F29-Task27].
- **Problema Detectado y Riesgos:**
  Falta de separación entre la ejecución técnica y la aprobación institucional formal. Una importación completada por un técnico podría pasarse a producción sin la revisión y firma formal del Director o del Contador General.
- **Requisitos Funcionales y Técnicos Convergentes:**
  1. *Flujo de aprobación colegiado por departamento:*
     - Secretaría: Aprobación de expedientes, matrículas e historiales de notas.
     - Contabilidad: Aprobación de saldos de corte, facturas y pagos.
     - Dirección: Autorización final de Go-Live y retiro de sistemas legados.
     - Administración Técnica: Certificación de respaldos, seguridad y pruebas de humo.
  2. *Registro formal de decisiones y excepciones:*
     - Opciones: `APROBADO`, `RECHAZADO`, `DEVUELTO_CON_OBSERVACIONES`.
     - Documentar justificante para cualquier excepción aceptada.
     - Emisión de Acta de Aceptación Institucional en PDF descargable con firmas formales.
     - Cualquier cambio posterior en el archivo de datos o reglas invalida automáticamente la aprobación previa.
- **Criterios de Aceptación:**
  - [ ] Una migración requiere aprobación formal de los responsables departamentales competentes.
  - [ ] Las excepciones críticas quedan documentadas con justificante y firma.
  - [ ] Se bloquea la transición a producción si existen incidencias bloqueantes sin resolver o sin acta aprobada.
  - [ ] Una modificación posterior en los datos invalida la aprobación otorgada.
- **Estado:** [ ] Pendiente

---

<!-- ID: TASK-279 | Fuentes: AUDITORIAS/AUDITORIA_COMPLETADAS_T-UX-23.md ; Pendientes.md ; pendientes/Dirección/Pendientes.md -->
### [ ] [TASK-279] [P1] Clasificación Automática de Incidencias y Gestión Paramétrica de SLA
- **Tipo:** tarea existente ya cubierta.
- **Hallazgo:** TASK-279 cubre clasificación/SLA, no autenticación ni autorización.
- **Objetivo/acción:** verificar reglas por tipo/prioridad y tiempos, sin usar esta tarea como sustituto de seguridad.
- **Archivos:** módulo de tickets y reglas de clasificación/SLA.
- **Dependencias:** modelo de tickets y permisos validados.
- **Alcance:** clasificación y SLA únicamente.
- **Criterios:** reglas y tiempos verificables; esta lógica no concede acceso ni cambia identidad del solicitante.
- **Prioridad/estado:** conservar valores oficiales de TASK-279.
- **Evidencia:** pendiente según registro oficial.
- **Orden de Ejecución:** 9
- **Prioridad:** P1 (Alta)
- **Componentes Afectados:**
  - `backend/user-service/Code.gs` (`submitProblemTicket`, `getProblemTicketsWithSLA`, `updateTicketSLAStatus`, `calculateTicketSLAThresholds`)
  - Hoja: `TicketsSoporte`, `ConfiguracionSLA`
- **Subcapacidades Relacionadas:** F30-13.
- **Origen del Hallazgo:** `AUDITORIA_FASE_30_CONSOLIDACION_CERTIFICACION_MEJORA_CONTINUA.md` / Sección C (F30-13).
- **Problema Detectado y Riesgos:**
  El módulo de tickets de soporte institucional no categoriza automáticamente la severidad ni gestiona acuerdos de nivel de servicio (SLA) para primera respuesta y solución, provocando demoras en la atención de fallos críticos que afectan la operación diaria.
- **Requisitos Funcionales y Técnicos Convergentes:**
  1. *Clasificación por severidad institucional:*
     - P0 (Crítica): Interrupción grave para la integridad, seguridad o continuidad de la plataforma.
     - P1 (Alta): Afectación importante de un proceso institucional o de múltiples usuarios.
     - P2 (Media): Fallo funcional limitado con alternativa operativa viable disponible.
     - P3 (Baja): Solicitud de mejora, duda funcional o inconveniente menor no urgente.
  2. *Evaluación automática y confirmación autorizada:*
     - Evaluar automáticamente severidad según: tipo de problema, módulo, usuarios impactados y riesgo de datos.
     - Permitir a un responsable de soporte confirmar o modificar la prioridad, registrando motivo formal en bitácora.
  3. *Gestión paramétrica de SLA y estados de ticket:*
     - Parámetros configurables de SLA por severidad (tiempos objetivo para primera respuesta, diagnóstico y solución).
     - Soporte para calendarios laborales y horarios hábiles institucionales excluyendo feriados.
     - Ciclo de vida: `Nuevo`, `Clasificado`, `Asignado`, `En_Diagnostico`, `En_Desarrollo`, `En_Validacion`, `Resuelto`, `Cerrado`, `Reabierto`, `Bloqueado`.
     - Alertas antes del vencimiento y escalamiento jerárquico ante incumplimiento.
     - Vinculación con incidencias relacionadas, tareas técnicas del backlog, versiones y capturas de evidencia.
- **Criterios de Aceptación:**
  - [ ] Cada nuevo ticket recibe una clasificación de severidad coherente y fecha límite de SLA calculada.
  - [ ] Las modificaciones de severidad quedan auditadas con usuario y justificación.
  - [ ] Se emiten alertas preventivas antes de que un ticket alcance su tiempo límite de atención.
  - [ ] Los reportes estadísticos reflejan métricas reales de cumplimiento y tiempos promedio de resolución.
- **Estado:** [ ] Pendiente

<!-- Fuente: RECUPERACION/Pendientes_RECUPERADO.md, líneas 10732-10760; clave TASK-282; asignación única: Dirección -->

---

<!-- ID: TASK-282 | Fuentes: Pendientes.md ; pendientes/Dirección/Pendientes.md -->
### [ ] [TASK-282] [P1] Delegación Temporal de Responsabilidades y Sustituciones Administrativas
- **Orden de Ejecución:** 12
- **Prioridad:** P1 (Alta)
- **Componentes Afectados:**
  - `backend/user-service/Code.gs` (`createTemporaryRoleDelegation`, `getActiveRoleDelegations`, `revokeRoleDelegation`, `verifyActionDelegationPermission`)
  - Hoja: `DelegacionesResponsabilidad`
- **Subcapacidades Relacionadas:** F30-07.
- **Origen del Hallazgo:** `AUDITORIA_FASE_30_CONSOLIDACION_CERTIFICACION_MEJORA_CONTINUA.md` / Sección C (F30-07).
- **Problema Detectado y Riesgos:**
  Las ausencias o vacaciones de directores, administradores y coordinadores paralizan autorizaciones clave (compras mayores a L 50,000, revisión de actas de notas, planificaciones pedagógicas). No existe un mecanismo formal para delegar temporalmente atribuciones específicas sin otorgar cuentas compartidas o privilegios permanentes.
- **Requisitos Funcionales y Técnicos Convergentes:**
  1. *Estructura formal de la delegación temporal:*
     - Parámetros: usuario delegante (`titularUserId`), usuario receptor (`delegadoUserId`), conjunto explícito de facultades delegadas, área institucional, fecha/hora inicio, fecha/hora fin, motivo formal y autorizador jerárquico.
     - Delegar facultades puntuales sin conceder la totalidad de privilegios del delegante.
     - Bloquear delegaciones circulares o cadenas no autorizadas de delegación.
  2. *Vigencia automática y trazabilidad de doble identidad:*
     - Revocación automática inmediata al cumplirse la fecha/hora de término.
     - Opción de revocación anticipada bajo demanda por el titular o Dirección.
     - Registro explícito en auditoría de la doble identidad: quién ejecutó la acción en representación de qué titular.
     - Respetar reglas de aprobación mancomunada existentes en transacciones financieras de alto impacto.
- **Criterios de Aceptación:**
  - [ ] El usuario delegado puede ejecutar exclusivamente las facultades autorizadas durante la ventana de vigencia.
  - [ ] Una delegación vencida o revocada es rechazada de forma inmediata por el backend.
  - [ ] Los eventos de auditoría registran con claridad al delegante y al ejecutor delegado.
  - [ ] No es posible delegar permisos superiores a los que ostenta legítimamente el delegante.
- **Estado:** [ ] Pendiente

<!-- Fuente: RECUPERACION/Pendientes_RECUPERADO.md, líneas 10820-10848; clave TASK-285; asignación única: Dirección -->

---

<!-- ID: TASK-285 | Fuentes: Pendientes.md ; pendientes/Dirección/Pendientes.md -->
### [ ] [TASK-285] [P1] Actualización Controlada de Dashboards Ejecutivos e Indicadores Institucionales
- **Orden de Ejecución:** 15
- **Prioridad:** P1 (Alta)
- **Componentes Afectados:**
  - `dashboards/dashboard-direccion.html`, `js/ui-common.js`
  - `backend/user-service/Code.gs`, `backend/developer-service/Code.gs`
- **Subcapacidades Relacionadas:** F30-10, F30-09.
- **Origen del Hallazgo:** `AUDITORIA_FASE_30_CONSOLIDACION_CERTIFICACION_MEJORA_CONTINUA.md` / Sección C (F30-10).
- **Problema Detectado y Riesgos:**
  Los tableros ejecutivos directivos dependen de refrescos bajo demanda manuales, arriesgando la toma de decisiones basada en información obsoleta. Asimismo, existe el riesgo de que distintos paneles calculen indicadores equivalentes con fórmulas o criterios dispares.
- **Requisitos Funcionales y Técnicos Convergentes:**
  1. *Gobernanza y cálculo unificado de indicadores:*
     - Definir por indicador: fuente oficial única, fórmula matemática estandarizada, frecuencia de corte, responsable y grado de precisión.
     - Prohibir terminantemente que vistas cliente realicen cálculos matemáticos dispares sobre métricas compartidas.
  2. *Actualización y visualización contextual:*
     - Diferenciar claramente datos en tiempo real de agregaciones periódicas o saldos históricos cerrados.
     - Mostrar en la interfaz: fecha y hora de corte del dato (`FechaCorte`), estado de actualización y alertas visuales si la información se encuentra desfasada.
     - Filtros multicriterio: período lectivo, nivel educativo, grado, sección, departamento y centro de costo.
     - Desglose jerárquico (drill-down) desde la cifra consolidada hacia los registros individuales respetando los permisos RBAC.
     - Exportación de reportes asegurando que los archivos generados coincidan exactamente con las cifras en pantalla.
- **Criterios de Aceptación:**
  - [ ] Los indicadores institucionales provienen de fuentes oficiales estandarizadas.
  - [ ] Los paneles de control de distintos roles muestran valores idénticos bajo los mismos criterios y fecha de corte.
  - [ ] Se indica con total claridad la antigüedad y momento de última sincronización de los datos.
  - [ ] Las exportaciones reflejan fielmente las cifras visualizadas en la interfaz directiva.
- **Estado:** [ ] Pendiente

<!-- Fuente: RECUPERACION/Pendientes_RECUPERADO.md, líneas 10849-10882; clave TASK-286; asignación única: Dirección -->

---

<!-- ID: TASK-286 | Fuentes: Pendientes.md ; pendientes/Dirección/Pendientes.md -->
### [ ] [TASK-286] [P1] Reconciliación Automatizada de Operaciones y Resultados entre Módulos
- **Orden de Ejecución:** 16
- **Prioridad:** P1 (Alta)
- **Componentes Afectados:**
  - `backend/accounting-service/Code.gs` (`reconcileCrossModuleTransactions`, `resolveTransactionDiscrepancy`)
  - `backend/academic-service/Code.gs`
  - Hoja: `ConciliacionesIntermodulares`, `DiscrepanciasDetectadas`
- **Subcapacidades Relacionadas:** F30-01, F30-02, F30-03.
- **Origen del Hallazgo:** `AUDITORIA_FASE_30_CONSOLIDACION_CERTIFICACION_MEJORA_CONTINUA.md` / Sección C (F30-01) y Sección G.
- **Problema Detectado y Riesgos:**
  A pesar de las validaciones relacionales, pueden suscitarse operaciones incompletas que no generaron un error fatal visible en su momento (ej. matrícula creada sin cargo inicial por interrupción de red, o pago asentado sin póliza contable asociada), requiriendo un motor periódico de reconciliación cruzada.
- **Requisitos Funcionales y Técnicos Convergentes:**
  1. *Rutina de reconciliación automatizada intermodular:*
     - Matrículas vs Expedientes y Cargos Arancelarios Iniciales.
     - Pagos vs Cargos Estudiantiles, Comprobantes Fiscales y Asientos de Caja/Bancos.
     - Anulaciones de Pago vs Contrasientos y Saldos en Estado de Cuenta.
     - Compras vs Órdenes, Recepciones, Kardex de Inventario y Cuentas por Pagar.
     - Planillas Salariales vs Marcajes de Asistencia, Deducciones Laborales y Pólizas Contables.
     - Calificaciones Publicadas vs Actas de Notas Cerradas y Boletines Oficiales.
     - Multas/Consumos de Servicios Complementarios vs Cargos Financieros Efectivos.
  2. *Clasificación de discrepancias y resolución asistida:*
     - Detectar: efectos no generados, efectos duplicados, importes divergentes, estados contradictorios o ausencia de documentos de respaldo.
     - Clasificar entre: discrepancia en tránsito normal vs error confirmado de inconsistencia.
     - Asignar discrepancias a responsables departamentales para corrección controlada a través de las interfaces oficiales.
     - Prohibir modificaciones destructivas automáticas sobre datos históricos cuya causa no haya sido certificada.
- **Criterios de Aceptación:**
  - [ ] El motor de conciliación detecta operaciones incompletas o asientos duplicados entre módulos.
  - [ ] Se emite informe de discrepancias con punteros directos a los registros involucrados.
  - [ ] Las acciones correctivas quedan debidamente auditadas y verificadas en la siguiente pasada del motor.
  - [ ] Se generan indicadores cuantitativos de operaciones conciliadas vs discrepantes.
- **Estado:** [ ] Pendiente

<!-- Fuente: RECUPERACION/Pendientes_RECUPERADO.md, líneas 11127-11160; clave TASK-295; asignación única: Dirección -->

---

<!-- ID: TASK-295 | Fuentes: Pendientes.md ; pendientes/Dirección/Pendientes.md -->
### [ ] [TASK-295] [F31-T14] [P1] Administración Granular de Permisos y Flujos de Aprobación Documental
- **Orden de Ejecución:** 14
- **Prioridad:** P1 (Alta)
- **Componentes Afectados:**
  - `backend/accounting-service/Code.gs` (`manageDocumentPermissions`, `processDocumentApprovalStep`)
  - `backend/user-service/Code.gs`
  - Hoja: `PermisosDocumentales`, `FlujosAprobacionDocumentos`
- **Subcapacidades Relacionadas:** F31-14.
- **Origen del Hallazgo:** `AUDITORIA_FASE_31_DISENADOR_UNIVERSAL_DOCUMENTOS_PLANTILLAS.md` / Sección B (F31-14) y Backlog de Implementación F31-T14.
- **Problema o Carencia:**
  La plataforma cuenta con permisos por roles generales, pero el sistema documental requiere una granularidad precisa para definir quién puede crear, editar, emitir, aprobar, archivar, descargar o compartir plantillas y documentos específicos según su departamento o confidencialidad.
- **Requisitos Funcionales y Técnicos Convergentes:**
  1. *Matriz granular de permisos documentales:*
     - Operaciones: Crear plantillas, Editar plantillas asignadas, Duplicar, Consultar catálogo, Emitir documentos individuales/masivos, Diseñar formularios, Revisar y aprobar, Publicar versiones, Archivar y Descargar/Imprimir.
     - Alcance de autorización: Por rol, usuario individual, departamento, categoría documental, plantilla específica o expediente institucional.
  2. *Flujos de aprobación multinivel:*
     - Configurar etapas secuenciales de aprobación con responsables asignados.
     - Decisiones: `Aprobar`, `Rechazar` o `Solicitar_Correcciones` con comentarios obligatorios.
     - Notificación automática a los participantes de la siguiente etapa.
     - Impedir la autoaprobación de plantillas cuando la política institucional exija separación de responsabilidades.
     - Delegación temporal de aprobación autorizada vinculada a [F30-Task08].
  3. *Seguridad y aplicación estricta en servidor:*
     - Validación obligatoria en el backend (no limitarse a ocultar botones en el frontend).
     - Bloquear consultas directas o manipulación de parámetros de URL para acceder a documentos fuera de alcance.
     - Revocación inmediata: al retirar un permiso, las peticiones subsiguientes son denegadas automáticamente.
- **Criterios de Aceptación:**
  - [ ] Los permisos se configuran y aplican de forma granular por operación, departamento y plantilla.
  - [ ] Los endpoints del backend rechazan cualquier operación no autorizada mediante validación estricta de sesión.
  - [ ] Las aprobaciones quedan firmadas digitalmente y asociadas a una versión inmutable.
  - [ ] La revocación de permisos surte efecto inmediato en la siguiente llamada a la API.
- **Estado:** [ ] Pendiente

<!-- Fuente: RECUPERACION/Pendientes_RECUPERADO.md, líneas 11574-11603; clave TASK-311; asignación única: Dirección -->

---

<!-- ID: TASK-311 | Fuentes: Pendientes.md ; pendientes/Dirección/Pendientes.md -->
### [ ] [TASK-311] [P1] Motor de Distribución Dinámica, Asignación Automática y Delegación Temporal
- **Orden de Ejecución:** 6
- **Prioridad:** P1 (Alta)
- **Componentes Afectados:**
  - `backend/user-service/Code.gs` (`assignRequestToResponsible`, `reassignDepartmentalRequest`, `evaluateRequestRoutingRules`)
  - Hoja: `FlujosAprobacion`, `SolicitudesTramites`, `DelegacionesResponsabilidad`
- **Subcapacidades Relacionadas:** F33-08, F33-09.
- **Origen del Hallazgo:** `AUDITORIA_FASE_33_FORMULARIOS_INSTITUCIONALES_TRAMITES_DIGITALES.md` / Sección C (F33-08, F33-09) y Plan de Implementación F33-Task05.
- **Problema Detectado y Riesgos:**
  Los flujos actuales asignan responsables de forma estática. No existe distribución automática según características del expediente (ej. enrutar solicitudes al coordinador del nivel Primaria o Secundaria) ni delegación automática de atribuciones ante ausencias o vacaciones de funcionarios.
- **Requisitos Funcionales y Técnicos Convergentes:**
  1. *Reglas de distribución y balanceo automático:*
     - Criterios de enrutamiento: departamento competente, grado académico, nivel, jornada, sede o categoría del trámite.
     - Métodos de asignación: a una persona específica, a un grupo de trabajo, a una cola departamental o por distribución equitativa de carga de trabajo (round-robin balanceado).
  2. *Delegaciones temporales por ausencia:*
     - Configurar usuario titular, delegado, período de vigencia (inicio y fin), tipos de trámites cubiertos y facultades delegadas.
     - Durante la vigencia, redirigir automáticamente nuevas asignaciones al sustituto y permitirle despachar la bandeja del titular.
     - Registro de doble identidad: asentar en auditoría que la decisión fue tomada por el delegado en representación del titular.
     - Prevención de delegaciones circulares o a usuarios inactivos sin permisos.
  3. *Reglas de escalamiento por vencimiento de SLA:*
     - Si una solicitud permanece desatendida al alcanzar el 80% del tiempo límite, notificar al supervisor o elevar su prioridad automáticamente.
- **Criterios de Aceptación:**
  - [ ] Las solicitudes se dirigen automáticamente al departamento o coordinador correspondiente según el grado del estudiante.
  - [ ] Las delegaciones programadas se activan y expiran en las fechas estipuladas sin intervención manual.
  - [ ] El sustituto solo puede actuar dentro del alcance expresamente delegado.
  - [ ] El escalamiento ante vencimiento de plazos notifica a los supervisores correspondientes.
- **Estado:** [ ] Pendiente

<!-- Fuente: RECUPERACION/Pendientes_RECUPERADO.md, líneas 11662-11709; clave TASK-314; asignación única: Dirección -->

---

<!-- ID: TASK-314 | Fuentes: Pendientes.md ; pendientes/Dirección/Pendientes.md -->
### [ ] [TASK-314] [P1] Historial de asignaciones, reasignaciones y revisión individual o colegiada
- **Prioridad:** P1 (Alta)
- **Orden de Ejecución:** 5 (Coordinación administrativa multidepartamental)
- **Componentes Afectados:**
  - `backend/user-service/Code.gs` (`reassignAdministrativeRequest`, `getWorkflowHistory`, `saveApprovalWorkflow`, `processWorkflowDecision`)
  - Hoja de Cálculo: `HistorialAsignacionesTramites`, `FlujosAprobacion`
- **Subcapacidades Relacionadas:** F34-04, F34-07, F34-09.
- **Origen del Hallazgo:** `AUDITORIA_FASE_34_BANDEJAS_REVISION_FIRMAS.md` / Sección C (F34-04), Matriz CAR-F34-07 y Especificación Técnica ChatGPT/Jules.
- **Problema Detectado y Riesgos:**
  El sistema permite modificar el responsable mediante `siguienteAsignadoA` y `updateRequestStatus`, pero no conserva un historial estructurado de los traspasos (se sobrescribe el responsable actual). Tampoco existe soporte para asignar un trámite a varios responsables que deban revisar o aprobar de forma concurrente o colegiada (ej. Secretaría + Orientación + Dirección), arriesgando aprobaciones unilaterales en trámites que requieren consenso.
- **Requisitos Funcionales y Técnicos Convergentes:**
  1. *Bitácora estructurada de asignaciones y traspasos:*
     - Registrar en la hoja `HistorialAsignacionesTramites`:
       * Identificador de asignación (`asignacionId`).
       * Documento o solicitud (`solicitudId`).
       * Departamento de origen y departamento de destino.
       * Responsable anterior y nuevo responsable (`userId`).
       * Usuario que ordenó la asignación o traspaso.
       * Fecha y hora ISO exacta.
       * Motivo fundamentado del cambio.
       * Tipo de asignación: inicial, reasignación, delegación temporal o transferencia departamental.
     - Validar que el usuario destinatario esté activo en el sistema y pertenezca al departamento correspondiente antes de procesar el traspaso.
  2. *Revisión colegiada y reglas de aprobación configurables:*
     - Permitir asignar un trámite a múltiples responsables concurrentes o secuenciales.
     - Implementar motor de resolución según reglas configurables en el flujo:
       * `TODOS_DEBEN_APROBAR` (unanimidad obligatoria).
       * `BASTA_UNO` (primer responsable que apruebe libera el trámite).
       * `MAYORIA_SIMPLE` (más del 50% de las decisiones emitidas deben ser favorables).
       * `NUMERO_FIJO` (requiere un mínimo de N aprobaciones).
     - Mostrar qué responsables ya completaron su intervención y cuáles siguen pendientes en la bandeja de trabajo.
     - Evitar que una decisión individual cierre o apruebe definitivamente un proceso que requiere múltiples aprobaciones colegiadas.
     - Registrar delegaciones temporales de funciones con fecha de inicio y caducidad automática.
  3. *Parametrización configurable en plataforma:*
     - Ajuste por tipo de trámite en `FlujosAprobacion`: `REGLA_APROBACION_COLEGIADA` (`TODOS`, `UNO`, `MAYORIA`) y `PERMITIR_REASIGNACION_POR_REVISOR` (Valores: `SOLO_SUPERVISOR_O_ADMIN`, `CUALQUIER_INTEGRANTE_DEPARTAMENTO`).
- **Criterios de Aceptación:**
  - [ ] Asignar una solicitud y comprobar que se registra autor, destinatario, fecha y departamento en la bitácora.
  - [ ] Reasignar la solicitud y verificar que se conservan el responsable anterior y el motivo sin sobrescribir la historia.
  - [ ] Intentar asignar a un usuario inactivo o ajeno al departamento y comprobar que la operación es rechazada.
  - [ ] Asignar un documento a varios responsables colegiados y verificar que cada uno registra su decisión independiente.
  - [ ] Comprobar que una aprobación individual no finaliza un trámite configurado como unánime o colegiado.
  - [ ] Verificar que una regla de mayoría simple se resuelve de forma matemáticamente exacta al registrar las decisiones.
  - [ ] Comprobar que las delegaciones temporales expiran automáticamente pasada la fecha límite autorizada.
  - [ ] Consultar el historial y comprobar la secuencia cronológica completa de traspasos y decisiones colegiadas.
- **Dependencias:** Motor de flujos de aprobación, sistema de usuarios y departamentos, F34-Task08.
- **Estado:** [ ] Pendiente

<!-- Fuente: RECUPERACION/Pendientes_RECUPERADO.md, líneas 11792-11830; clave TASK-317; asignación única: Dirección -->

---

<!-- ID: TASK-317 | Fuentes: Pendientes.md ; pendientes/Dirección/Pendientes.md -->
### [ ] [TASK-317] [P1] Delimitación del alcance de las firmas institucionales y requisitos para mecanismos de firma legal
- **Prioridad:** P1 (Alta)
- **Orden de Ejecución:** 8 (Seguridad jurídica y cumplimiento del Decreto 149-2013)
- **Componentes Afectados:**
  - `backend/user-service/Code.gs` (`registerDocumentSignature`, `getWorkflowHistory`, `verifyDocumentSignature`)
  - `docs/architecture/`
  - Certificados digitales emitidos y visualizadores de firmas
  - Hoja de Cálculo: `FirmasConformidades`
- **Subcapacidades Relacionadas:** F34-06, F34-10.
- **Origen del Hallazgo:** `AUDITORIA_FASE_34_BANDEJAS_REVISION_FIRMAS.md` / Sección C (F34-06), Matriz CAR-F34-06 y Especificación Técnica ChatGPT/Jules.
- **Problema Detectado y Riesgos:**
  El sistema registra conformidades autenticadas mediante `registerDocumentSignature` con tokens pseudo-aleatorios `VERIF-XXXXXXXX`. Sin embargo, estos mecanismos son aprobaciones internas basadas en sesión y no equivalen a una Firma Electrónica Avanzada bajo la Ley sobre Firmas Electrónicas de Honduras (Decreto 149-2013 y Acuerdo 041-2014). Presentarlos erróneamente como "firmas digitales certificadas" expone a la institución a impugnaciones legales de nulidad en contratos laborales, títulos oficiales o actos disciplinarios graves.
- **Requerimientos Funcionales y Técnicos Convergentes:**
  1. *Diferenciación conceptual y advertencia legal expresa:*
     - Diferenciar inequívocamente en la base de datos, en la interfaz y en los documentos generados:
       * `Aprobación Administrativa`: Aprobación operativa de paso en el flujo.
       * `Conformidad Digital Institucional`: Consentimiento autenticado en plataforma mediante sesión y token interno `VERIF-`.
       * `Constancia de Conocimiento`: Toma de razón (ej. docente enterado de inasistencia).
       * `Firma Electrónica Avanzada / Certificada`: Firma criptográfica con certificado digital emitido por prestador acreditado.
     - Mostrar una advertencia legal clara en el visor, constancias y documentos generados indicando que la conformidad registrada tiene valor institucional interno conforme al reglamento escolar.
     - Prohibir terminantemente el uso de expresiones engañosas como "Certificado por Autoridad Certificadora" en sellos internos.
  2. *Requisitos de firma según nivel de riesgo y preparación para integración externa:*
     - Catalogar por tipo documental el nivel de firma exigido.
     - Cuando se vincule un mecanismo de firma avanzada externa, registrar: identidad del firmante, documento y versión firmada, evidencia de autenticación PKI, referencia del certificado, resultado de validación CRL/OCSP y hash del documento firmado.
     - Asegurar que la introducción de firmas externas no invalide ni borre el historial de conformidades institucionales previas.
  3. *Parametrización configurable en plataforma:*
     - Configuración institucional en `ConfiguracionInstitucional`: `NIVEL_FIRMA_REQUERIDO_POR_TIPO_TRAMITE`: Mapeo JSON de trámites a niveles (`CONFORMIDAD_SESION`, `CONFORMIDAD_TOKEN_VERIF`, `FIRMA_AVANZADA_CERTIFICADA`).
- **Criterios de Aceptación:**
  - [ ] Registrar una conformidad y verificar que los comprobantes la identifican explícitamente como aprobación interna institucional.
  - [ ] Comprobar que los tokens `VERIF-` no se presenten como certificados digitales emitidos por una autoridad de certificación acreditada.
  - [ ] Modificar el documento con posterioridad y comprobar que la firma previa no se traslada a la nueva versión.
  - [ ] Comprobar que un trámite configurado para requerir firma externa no pueda completarse únicamente con una conformidad simple de sesión.
  - [ ] Consultar el historial de firmas y verificar la conservación inalterable de los registros previos.
  - [ ] Revisar la advertencia legal en comprobantes y validar que describe con precisión técnica su alcance jurídico.
- **Dependencias:** F34-Task04 (integridad criptográfica de documentos), generación de documentos y CUV.
- **Estado:** [ ] Pendiente

<!-- Fuente: RECUPERACION/Pendientes_RECUPERADO.md, líneas 12058-12090; clave TASK-325; asignación única: Dirección -->

---

<!-- ID: TASK-325 | Fuentes: Pendientes.md ; pendientes/Dirección/Pendientes.md -->
### [ ] [TASK-325] [F35-ID-Task07] [P1] Consola administrativa de gestión de series, versionado y control de permisos
- **Prioridad:** P1 (Alta / Importante)
- **Orden de Ejecución:** 7 (Gobernanza administrativa y control de acceso)
- **Componentes Afectados:**
  - `backend/user-service/Code.gs` (`getSequenceDefinitions`, `updateSequenceDefinition`)
  - `teacher-dashboard.html`, `dashboard-direccion.html`, `js/config.js`
  - Hoja de Cálculo: `DefinicionesNumeracion`, `AuditoriaSecuencias`
- **Subcapacidades Relacionadas:** F35-ID-11, F35-ID-13, F35-ID-14, F35-ID-18.
- **Origen del Hallazgo:** `AUDITORIA_FASE_35_REGISTRO_CENTRAL_IDENTIFICADORES_NUMERACION.md` / Sección E, G y Matriz CAR-ID-13, CAR-ID-15, CAR-ID-18.
- **Problema Detectado y Riesgos:**
  La administración de secuencias se realiza mediante edición directa de celdas en Google Sheets por parte de técnicos. No existe una interfaz con permisos segregados donde Dirección o Secretaría puedan consultar el último número emitido, ver el estado de las series o solicitar un cambio de prefijo con aprobación auditada.
- **Requerimientos Funcionales y Técnicos Convergentes:**
  1. *Consola de supervisión y control de series:*
     - Proveer interfaz en el panel de Dirección y Configuración para visualizar:
       * Tipo de entidad y ámbito institucional.
       * Formato oficial activo y patrón generado.
       * Último número emitido y siguiente código previsto.
       * Total de registros que utilizan la definición.
       * Historial de cambios con usuario, fecha y justificación.
  2. *Segregación de permisos y versionado:*
     - Exigir roles `Director` o `Administrador` para modificar o crear definiciones de numeración.
     - Prohibir eliminar definiciones que ya cuenten con registros asociados; permitir únicamente marcar como `Inactiva` o `Sustituida`.
     - Exigir confirmación reforzada (con ingreso de contraseña o token) si se intenta adelantar o modificar manualmente un contador.
- **Criterios de Aceptación:**
  - [ ] Solo usuarios autorizados pueden consultar y administrar la configuración de numeración.
  - [ ] Los usuarios ordinarios no tienen acceso a modificar contadores ni formatos.
  - [ ] Todo cambio en una definición queda asentado en bitácora con trazabilidad completa.
  - [ ] No es posible eliminar una serie que tenga identificadores emitidos en uso.
- **Dependencias:** F35-ID-Task02, F35-ID-Task06.
- **Estado:** [ ] Pendiente

<!-- Fuente: RECUPERACION/Pendientes_RECUPERADO.md, líneas 12095-12129; clave TASK-326; asignación única: Dirección -->

---

<!-- ID: TASK-326 | Fuentes: Pendientes.md ; pendientes/Dirección/Pendientes.md -->
### [ ] [TASK-326] [P1] Diagnóstico de coherencia departamental y detección de registros desalineados
- **Prioridad:** P1 (Alta / Importante)
- **Orden de Ejecución:** 6 (Supervisión proactiva e integridad interdepartamental)
- **Componentes Afectados:**
  - `backend/accounting-service/Code.gs` (`diagnoseCrossDepartmentalCoherence`)
  - `backend/developer-service/Code.gs`
  - Hoja de Cálculo: `AuditoriaCoherenciaDepartamental`
- **Subcapacidades Relacionadas:** F37-11, F37-12.
- **Origen del Hallazgo:** `AUDITORIA_FASE_37_AISLAMIENTO_DATOS_ASIGNACION_DEPARTAMENTOS.md` / Sección C (F37-12), Matriz CAR-F37-12 y Especificación Técnica ChatGPT/Jules.
- **Problema Detectado y Riesgos:**
  No existe una herramienta que permita detectar sistemáticamente registros guardados en destinos incorrectos, relaciones huérfanas o inconsistencias entre el departamento propietario de una entidad y su ubicación real. La detección depende de hallazgos manuales fortuitos.
- **Requerimientos Funcionales y Técnicos Convergentes:**
  1. *Motor automatizado de diagnóstico de coherencia:*
     - Implementar `diagnoseCrossDepartmentalCoherence(payload)` que compare las asignaciones declaradas con la ubicación real de los registros:
       * Registros ubicados en un departamento o módulo diferente al propietario.
       * Registros almacenados en destinos no registrados o inactivos.
       * Entidades duplicadas entre fuentes supuestamente independientes.
       * Registros sin identificadores institucionales válidos.
       * Referencias foráneas a entidades inexistentes o en ámbitos institucionales incorrectos.
       * Operaciones de importación cuyo estado no coincida con los datos persistidos.
     - Ejecutar filtros por departamento, módulo, entidad, sede y año lectivo.
  2. *Reporte estructurado y no destructivo:*
     - El diagnóstico debe ser estrictamente no destructivo (solo lectura); encontrar anomalías no debe modificar ni borrar registros automáticamente.
     - Diferenciar errores confirmados de posibles inconsistencias sujetas a revisión.
     - Mostrar totales por categoría, nivel de gravedad y detalle del registro afectado.
- **Criterios de Aceptación:**
  - [ ] Un registro de prueba en un destino incompatible es identificado de inmediato por el diagnóstico.
  - [ ] Referencias huérfanas a matrículas o estudiantes inexistentes se detectan y catalogan.
  - [ ] Ejecutar el diagnóstico no modifica ninguna celda de negocio ni expone datos confidenciales ajenos al rol.
  - [ ] Las excepciones autorizadas e identificadores históricos no se marcan falsamente como errores.
- **Dependencias:** F37-Task01, F37-Task04, F37-Task05.
- **Estado:** [ ] Pendiente

<!-- Fuente: RECUPERACION/Pendientes_RECUPERADO.md, líneas 12130-12162; clave TASK-327; asignación única: Dirección -->

---

<!-- ID: TASK-327 | Fuentes: Pendientes.md ; pendientes/Dirección/Pendientes.md -->
### [ ] [TASK-327] [P1] Consola administrativa de destinos, fuentes y relaciones interdepartamentales
- **Prioridad:** P1 (Alta / Importante)
- **Orden de Ejecución:** 7 (Gobernanza y administración de fuentes en panel de control)
- **Componentes Afectados:**
  - `dashboard-direccion.html`, `js/config.js`
  - `backend/accounting-service/Code.gs` (`getSpreadsheetCatalog`, `registerSpreadsheetSource`, `saveDepartmentalRelationship`)
  - Hoja de Cálculo: `CatalogoSpreadsheets`, `CatalogoRelacionesInterdepartamentales`, `CatalogoProyeccionesCompartidas`
- **Subcapacidades Relacionadas:** F37-11.
- **Origen del Hallazgo:** `AUDITORIA_FASE_37_AISLAMIENTO_DATOS_ASIGNACION_DEPARTAMENTOS.md` / Sección C (F37-11), Matriz CAR-F37-11 y Especificación Técnica ChatGPT/Jules.
- **Problema Detectado y Riesgos:**
  La plataforma dispone de `CatalogoSpreadsheets`, pero no de una consola unificada para administrar qué departamentos pueden utilizar qué entidades, qué campos pueden compartir y qué relaciones están autorizadas. La gestión se realiza mediante llamadas directas o edición manual de celdas por personal técnico.
- **Requerimientos Funcionales y Técnicos Convergentes:**
  1. *Consola de administración integral en panel directivo:*
     - Proveer interfaz en el dashboard de Dirección y Configuración para:
       * *Departamentos y Módulos:* Visualizar áreas registradas, estado y entidades propietarias.
       * *Destinos y Fuentes:* Supervisar hojas registradas en `CatalogoSpreadsheets`, año lectivo, sede y estado activo/inactivo.
       * *Relaciones Interdepartamentales:* Consultar y configurar qué departamentos pueden relacionar entidades ajenas y con qué propósito.
       * *Proyecciones de Datos:* Seleccionar los campos autorizados que puede recibir cada departamento consumidor.
  2. *Gobernanza y seguridad de configuración:*
     - Restringir la administración exclusivamente a roles directivos autorizados.
     - Advertir sobre dependencias operativas activas antes de desactivar una fuente o relación utilizada.
     - Registrar en bitácora cada modificación con usuario, fecha, valor anterior y nuevo.
- **Criterios de Aceptación:**
  - [ ] La consola muestra con claridad las fuentes, relaciones y proyecciones configuradas.
  - [ ] Registrar un nuevo destino válido lo deja disponible de inmediato sin alterar los existentes.
  - [ ] Desactivar un destino bloquea nuevas escrituras sin borrar los registros históricos.
  - [ ] Modificar una proyección aplica de inmediato la nueva máscara de atributos en consultas posteriores.
  - [ ] Los usuarios sin permisos administrativos no pueden acceder ni modificar las configuraciones.
- **Dependencias:** F37-Task01, F37-Task03, F37-Task04.
- **Estado:** [ ] Pendiente

<!-- Fuente: RECUPERACION/Pendientes_RECUPERADO.md, líneas 12163-12194; clave TASK-328; asignación única: Dirección -->

---

<!-- ID: TASK-328 | Fuentes: Pendientes.md ; pendientes/Dirección/Pendientes.md -->
### [ ] [TASK-328] [P1] Reasignación asistida y recuperación de registros almacenados en destinos incorrectos
- **Prioridad:** P1 (Alta / Importante)
- **Orden de Ejecución:** 8 (Saneamiento asistido y reconciliación de datos mal ubicados)
- **Componentes Afectados:**
  - `backend/accounting-service/Code.gs` (`reconcileMisalignedRecord`, `executeAssistedReassignment`)
  - `backend/developer-service/Code.gs`
  - Hoja de Cálculo: `RegistroEventos`, `AuditoriaCoherenciaDepartamental`
- **Subcapacidades Relacionadas:** F37-12.
- **Origen del Hallazgo:** `AUDITORIA_FASE_37_AISLAMIENTO_DATOS_ASIGNACION_DEPARTAMENTOS.md` / Sección C (F37-12), Matriz CAR-F37-12 y Especificación Técnica ChatGPT/Jules.
- **Problema Detectado y Riesgos:**
  No existe una herramienta para corregir de forma controlada registros que hayan terminado en una hoja o fuente incorrecta. Aunque el diagnóstico detecte el problema, se carece de un procedimiento seguro para transferir esos registros sin perder identificadores, relaciones financieras o referencias académicas.
- **Requerimientos Funcionales y Técnicos Convergentes:**
  1. *Procedimiento de reasignación asistida:*
     - A partir de los hallazgos del diagnóstico (F37-Task06), permitir seleccionar registros mal ubicados y mostrar: ubicación actual, departamento propietario, destino correcto, ID institucional y relaciones dependientes.
     - Validar el destino mediante el mecanismo de enrutamiento central y verificar que el usuario tenga autorización.
     - Comprobar que el registro no exista ya en el destino receptor (evitar fusiones arbitrarias en caso de conflicto).
     - Conservar exactamente el identificador institucional inmutable y las relaciones con matrículas y pagos.
  2. *Previsualización y atomicidad:*
     - Exigir previsualización antes de confirmar la reasignación, permitiendo cancelar sin efectos.
     - Operación idempotente: si se interrumpe, permitir reanudación sin duplicar registros.
     - Auditar en `RegistroEventos` el movimiento con ubicación previa, nueva, responsable y justificación.
- **Criterios de Aceptación:**
  - [ ] Seleccionar un registro mal ubicado muestra su destino actual y el esperado con sus dependencias.
  - [ ] La reasignación traslada el registro a la hoja correcta conservando intacto su identificador institucional.
  - [ ] Las relaciones con pagos o matrículas permanecen válidas y consultables tras el traslado.
  - [ ] Si existe colisión o duplicado en el destino, la operación se detiene y solicita resolución explícita.
  - [ ] Toda reasignación asistida queda registrada con trazabilidad completa en la bitácora central.
- **Dependencias:** F37-Task01, F37-Task04, F37-Task05, F37-Task06.
- **Estado:** [ ] Pendiente

<!-- Fuente: RECUPERACION/Pendientes_RECUPERADO.md, líneas 12547-12574; clave TASK-341; asignación única: Dirección -->

---

<!-- ID: TASK-341 | Fuentes: Pendientes.md ; pendientes/Dirección/Pendientes.md -->
### [ ] [TASK-341] [P1] Implementación del tablero directivo de avance de digitalización por departamento
- **Prioridad:** P1 (Alta / Importante)
- **Orden de Ejecución:** 14 (Supervisión institucional y gobernanza del proceso de transición)
- **Componentes Afectados:**
  - `backend/accounting-service/Code.gs` (`getDigitizationProgressReport`)
  - `dashboard-direccion.html`, `js/config.js`
  - Hoja de Cálculo: `InventarioDocumentalLegado`, `RegistroEventos`
- **Subcapacidades Relacionadas:** 3.11, 3.12.
- **Origen del Hallazgo:** `AUDITORIA_FASE_39_DIGITALIZACION_TRANSICION.md` / Sección C (3.11) y Matriz CAR-F39-11.
- **Problema Detectado y Riesgos:**
  La Dirección institucional no dispone de indicadores consolidados para medir el avance del plan de digitalización. Se desconoce qué porcentaje de documentos históricos han sido migrados en Secretaría frente a Contabilidad o RRHH, impidiendo detectar retrasos en la transición.
- **Requerimientos Funcionales y Técnicos Convergentes:**
  1. *Panel de control e indicadores en tiempo real:*
     - Implementar `getDigitizationProgressReport(payload)` que compute sobre `InventarioDocumentalLegado`: total inventariado, documentos pendientes, en proceso, digitalizados, validados, rechazados y duplicados resueltos.
     - Métricas independientes por departamento (Secretaría, Contabilidad, Recursos Humanos, Dirección).
     - Fórmulas de avance diferenciadas: cobertura de inventario, progreso de importación y progreso de validación.
  2. *Seguimiento temporal e incidencias:*
     - Evolución temporal del avance y acceso directo a incidencias pendientes (archivos corruptos, duplicados sin resolver, documentos sin expediente asignado).
     - Exportación de informes en Excel y PDF para rendición de cuentas institucional.
- **Criterios de Aceptación:**
  - [ ] El panel directivo muestra métricas consolidadas y desglosadas por departamento en tiempo real.
  - [ ] Diferencia claramente entre documentos simplemente cargados y documentos formalmente validados.
  - [ ] Permite identificar cuellos de botella e incidencias pendientes con acceso directo a su resolución.
- **Dependencias:** F39-Task01, F39-Task02, F39-Task03, F39-Task04, F39-Task07, F39-Task08.
- **Estado:** [ ] Pendiente

<!-- Fuente: RECUPERACION/Pendientes_RECUPERADO.md, líneas 12575-12601; clave TASK-342; asignación única: Dirección -->

---

<!-- ID: TASK-342 | Fuentes: Pendientes.md ; pendientes/Dirección/Pendientes.md -->
### [ ] [TASK-342] [P1] Implementación de seguimiento operativo y gestión de tareas de digitalización
- **Prioridad:** P1 (Alta / Importante)
- **Orden de Ejecución:** 15 (Asignación y workflow de trabajo operativo de digitalización)
- **Componentes Afectados:**
  - `backend/user-service/Code.gs` (`assignDigitizationTask`, `getDigitizationTasks`, `updateDigitizationTaskStatus`)
  - Hoja de Cálculo: `TareasDigitalizacion`
- **Subcapacidades Relacionadas:** 3.1, 3.11.
- **Origen del Hallazgo:** `AUDITORIA_FASE_39_DIGITALIZACION_TRANSICION.md` / Sección 3.11, 3.12 y Especificación Técnica ChatGPT/Jules.
- **Problema Detectado y Riesgos:**
  La digitalización involucra múltiples actores (digitalizadores, revisores, secretarios, archivistas) sin un flujo estructurado de tareas. Las actividades se gestionan verbalmente, provocando tareas abandonadas, demoras sin responsable identificado y falta de rendición de cuentas operativa.
- **Requerimientos Funcionales y Técnicos Convergentes:**
  1. *Asignación y estados de actividades de digitalización:*
     - Auto-crear la hoja `TareasDigitalizacion` (`TareaId`, `DocumentoId`, `Departamento`, `ResponsableUserId`, `TipoActividad`, `Estado`, `FechaAsignacion`, `FechaInicio`, `FechaFinalizacion`, `Observaciones`).
     - Tipos de actividad: clasificar archivos, escanear físicos, validar datos, resolver duplicados, vincular expedientes, aprobar plantillas.
     - Estados de flujo: `Pendiente`, `Asignada`, `En_Proceso`, `En_Revision`, `Observada`, `Completada`, `Cancelada`.
  2. *Colaboración y notificaciones:*
     - Permitir transferir tareas entre responsables conservando trazabilidad.
     - Notificaciones automáticas al asignar tareas o detectar inconsistencias que requieran revisión.
- **Criterios de Aceptación:**
  - [ ] Permite asignar actividades de digitalización a responsables específicos vinculadas a documentos del inventario.
  - [ ] Registra el ciclo de vida completo de cada tarea con fechas de inicio y finalización.
  - [ ] Notifica al responsable asignado y muestra tareas pendientes en su bandeja de trabajo.
- **Dependencias:** F39-Task01, F39-Task14.
- **Estado:** [ ] Pendiente

<!-- Fuente: RECUPERACION/Pendientes_RECUPERADO.md, líneas 12721-12750; clave TASK-347; asignación única: Dirección -->

---

<!-- ID: TASK-347 | Fuentes: Pendientes.md ; pendientes/Dirección/Pendientes.md -->
### [ ] [TASK-347] [P1] Incorporar detección de actividad documental anómala y alertas de seguridad (F40-15)
- **Prioridad:** P1 (Alta / Importante)
- **Orden de Ejecución:** 17 (Monitoreo de seguridad y detección de exfiltración)
- **Componentes Afectados:**
  - `backend/user-service/Code.gs` (`detectAnomalousDocumentActivity`, `dispatchSecurityAlerts`)
  - `backend/academic-service/Code.gs`
  - Hoja de Cálculo: `AlertasSeguridadDocumental`
- **Subcapacidades Relacionadas:** F40-19.
- **Origen del Hallazgo:** `AUDITORIA_FASE_40_SEGURIDAD_DOCUMENTAL_TRAZABILIDAD_Y_CONSERVACION.md` / Secciones C (F40-19) y Especificación Técnica ChatGPT/Jules.
- **Problema Detectado y Riesgos:**
  No se generan alertas ante ráfagas de descargas masivas, consultas reiteradas a expedientes no asignados o intentos continuos de acceso denegado, dificultando la detección oportuna de incidentes de seguridad.
- **Requerimientos Funcionales y Técnicos Convergentes:**
  1. *Evaluación heurística de patrones sobre la bitácora:*
     - Analizar `LogsSistema` y evaluar umbrales configurables por rol y periodo.
     - Detectar: Ráfagas de descargas masivas, Consultas repetitivas a expedientes de terceros, Intentos reiterados de acceso denegado, Descarga concentrada de categorías sensibles, Actividad fuera de horarios o ubicaciones habituales, Uso reiterado de enlaces vencidos/revocados.
  2. *Gestión de alertas e incidentes:*
     - Clasificar alertas por severidad (`INFO`, `WARN`, `CRITICAL`) con lista de eventos vinculados.
     - Asignar alerta a un oficial de seguridad o directivo para su investigación.
     - Opciones: Revisar, Cerrar, Escalar o Confirmar como actividad legítima justificada.
     - Medidas preventivas configurables: exigir reautenticación o suspender token temporalmente ante riesgos extremos.
- **Criterios de Aceptación:**
  - [ ] Superar el umbral configurado de descargas por minuto genera alerta de seguridad.
  - [ ] Intentos reiterados de acceso denegado disparan alerta con eventos relacionados.
  - [ ] Operaciones normales dentro de los umbrales no producen falsos positivos.
  - [ ] La investigación de la alerta conserva la resolución, responsable y fecha de cierre.
- **Dependencias:** F40-Task08.
- **Estado:** [ ] Pendiente

<!-- Fuente: RECUPERACION/Pendientes_RECUPERADO.md, líneas 12781-12809; clave TASK-349; asignación única: Dirección -->

---

<!-- ID: TASK-349 | Fuentes: Pendientes.md ; pendientes/Dirección/Pendientes.md -->
### [ ] [TASK-349] [P1] Crear un panel de integridad, seguridad y salud documental (F40-17)
- **Prioridad:** P1 (Alta / Importante)
- **Orden de Ejecución:** 19 (Tablero directivo de monitoreo de seguridad documental)
- **Componentes Afectados:**
  - `backend/academic-service/Code.gs` (`getDocumentSecurityDashboardData`)
  - `dashboard-direccion.html`, `js/config.js`
- **Subcapacidades Relacionadas:** F40-22.
- **Origen del Hallazgo:** `AUDITORIA_FASE_40_SEGURIDAD_DOCUMENTAL_TRAZABILIDAD_Y_CONSERVACION.md` / Secciones C (F40-22) y Especificación Técnica ChatGPT/Jules.
- **Problema Detectado y Riesgos:**
  No existe un panel visual para que la Dirección identifique discrepancias de hash, archivos huérfanos, accesos inseguros o fallos de respaldo, forzando auditorías manuales complejas sobre múltiples hojas.
- **Requerimientos Funcionales y Técnicos Convergentes:**
  1. *Métricas e indicadores consolidados de salud documental:*
     - Indicadores en tiempo real: Total de documentos registrados, Archivos físicos localizados en Drive, Archivos huérfanos, Registros sin archivo físico, Discrepancias de hash SHA-256, Documentos sin clasificación de sensibilidad, Permisos/enlaces públicos inseguros, Documentos bajo Legal Hold, Documentos próximos a vencer, Documentos pendientes de disposición, Respaldos exitosos/fallidos, Restauraciones ejecutadas.
  2. *Navegación y filtros operativos:*
     - Filtros por departamento, categoría, periodo y estado.
     - Mostrar fecha de última conciliación y respaldo.
     - Navegación directa hacia el detalle de cada incidencia según el rol del usuario.
     - Exportación de métricas e incidencias autorizadas.
     - Prohibir la exposición de enlaces directos o URLs públicas en el panel.
- **Criterios de Aceptación:**
  - [ ] El panel refleja inmediatamente los resultados de las conciliaciones de integridad.
  - [ ] Documentos alterados aparecen clasificados como incidencias de integridad.
  - [ ] Filtrar por departamento restringe la información a las atribuciones del usuario.
  - [ ] El panel no expone URLs directas a archivos privados ni contenidos sensibles sin autorización.
- **Dependencias:** F40-Task06, F40-Task08, F40-Task15, F40-Task13.
- **Estado:** [ ] Pendiente

<!-- Fuente: RECUPERACION/Pendientes_RECUPERADO.md, líneas 12810-12842; clave TASK-350; asignación única: Dirección -->

---

<!-- ID: TASK-350 | Fuentes: Pendientes.md ; pendientes/Dirección/Pendientes.md -->
### [ ] [TASK-350] [P1] Generar reportes de auditoría exportables, verificables y protegidos (F40-18)
- **Prioridad:** P1 (Alta / Importante)
- **Orden de Ejecución:** 20 (Evidencias de fiscalización externa e interna)
- **Componentes Afectados:**
  - `backend/user-service/Code.gs` (`exportVerifiableAuditReport`)
  - `backend/academic-service/Code.gs`
  - Hoja de Cálculo: `ReportesAuditoriaEmitidos`
- **Subcapacidades Relacionadas:** F40-24.
- **Origen del Hallazgo:** `AUDITORIA_FASE_40_SEGURIDAD_DOCUMENTAL_TRAZABILIDAD_Y_CONSERVACION.md` / Secciones C (F40-24) y Especificación Técnica ChatGPT/Jules.
- **Problema Detectado y Riesgos:**
  `getAuditReport` entrega datos JSON crudos en pantalla, pero no genera reportes documentales firmados e inmutables que sirvan como evidencia formal para comités de fiscalización o revisiones externas.
- **Requerimientos Funcionales y Técnicos Convergentes:**
  1. *Generación de reportes multicriterio:*
     - Filtros por: Usuario, Documento, Expediente, Departamento, Categoría, Periodo, Operación, Incidente de seguridad.
     - Contenido: Eventos, resultados, responsables, versiones y referencias.
     - Diferenciar hechos registrados de alertas u observaciones del auditor.
     - Incluir fecha/hora de emisión, solicitante, filtros aplicados y alcance.
  2. *Sellado e inmutabilidad del reporte:*
     - Salidas en formatos legibles (PDF) y estructurados (CSV/JSON).
     - Incorporar hash SHA-256 del reporte exportado y manifiesto autenticado con HMAC institucional.
     - Respetar permisos del solicitante: no incluir datos que el auditor no esté autorizado a ver.
     - Registrar la emisión y descarga del reporte en la bitácora.
     - Permitir verificar retrospectivamente que el reporte exportado no ha sido adulterado.
- **Criterios de Aceptación:**
  - [ ] Generar un reporte por documento o periodo produce un archivo sellado con hash SHA-256.
  - [ ] Intentos de incluir documentos fuera del alcance del auditor son excluidos.
  - [ ] Modificar el PDF o CSV exportado hace fallar la verificación de autenticidad del reporte.
  - [ ] La emisión del reporte queda registrada en `ReportesAuditoriaEmitidos` con su firma.
- **Dependencias:** F40-Task06, F40-Task09, F40-Task08.
- **Estado:** [ ] Pendiente

<!-- Fuente: RECUPERACION/Pendientes_RECUPERADO.md, líneas 13268-13305; clave TASK-365; asignación única: Dirección -->

---

<!-- ID: TASK-404 | Fuentes: AUDITORIAS/AUDITORIA_COMPLETADAS_FASE2-T07.md ; Pendientes.md ; pendientes/Dirección/Pendientes.md -->
### [ ] [TASK-404] [P2] [Alertas y Monitoreo - Ampliación de Alertas Tempranas a Indicadores Financieros y Operativos]
- **Hallazgo de origen:** FASE2-T07, sección de alertas financieras.
- **Severidad:** Alto.
- **Objetivo:** convertir el cálculo de mora en una alerta operativa verificable.
- **Acción ejecutable:** persistir alerta/evento cuando una cuenta cumpla reglas; asociar responsables autorizados; despachar notificación y conservar estado/fecha/resultado; deduplicar por cuenta, período y regla.
- **Archivos/módulos afectados:** backend/accounting-service/Code.gs; reglas de mora, eventos y notificaciones.
- **Dependencias y riesgos:** TASK-474 y TASK-422.
- **Alcance:** alertas financieras/operativas; no modificar aquí la fórmula de recargos.
- **Criterios de aceptación:** cálculo genera alerta persistente con clave única; destinatarios y entrega son verificables; consulta no altera cargos; repetición no duplica alertas.
- **Prioridad:** P1.
- **Estado:** Pendiente.
- **Evidencia de cierre:** pruebas de mora, deduplicación y despacho.
- **Componentes Afectados:**
  - `backend/accounting-service/Code.gs`
  - `backend/user-service/Code.gs`
- **Dependencias Expuestas:** Diccionario de indicadores (`F24-Task02`), metas (`F24-Task12`), paneles (`F24-Task13`).
- **Capacidades Relacionadas:** F24-022, F24-006, F24-007.
- **Problema Detectado:**
  Existe un mecanismo de alertas tempranas para riesgo académico, pero no se dispone de una cobertura equivalente para detectar situaciones relevantes en morosidad, gastos y otros indicadores financieros u operativos.
- **Requisitos Funcionales:**
  1. Ampliar el evaluador de alertas tempranas para procesar condiciones sobre indicadores institucionales financieros y operativos.
  2. Incorporar reglas configurables para:
     - Incremento anormal de la morosidad institucional (ej. mora > 15% de cartera activa).
     - Disminución crítica en la recuperación de cobros mensuales.
     - Sobrecostos en órdenes de compra y requisiciones de almacén.
     - Desviaciones presupuestarias superiores a umbrales configurados por partida.
     - Incrementos inusuales de gastos imprevistos en caja chica o cuentas por pagar.
     - Caídas abruptas en la proyección de ingresos por mensualidades.
     - Acumulación excesiva de trámites administrativos pendientes en secretaría u orientación.
     - Aumento injustificado en los tiempos promedio de resolución de trámites.
  3. Permitir configurar umbrales de activación por período y área responsable.
  4. Definir usuarios y roles destinatarios de las alertas según el departamento afectado.
  5. Incorporar niveles de severidad (`Baja`, `Media`, `Alta`, `Crítica`).
  6. Evitar el despacho repetitivo de alertas ante una misma condición persistente.
  7. Mantener un historial completo de alertas emitidas en hoja `AlertasInstitucionalesLogs`.
  8. Permitir reconocer, documentar revisión y cerrar formalmente una alerta activa.
  9. Identificar con precisión el indicador, período y condición cuantitativa que originaron la alerta.
  10. Mantener estricta separación de acceso entre alertas académicas, financieras y operativas.
  11. Restringir la visualización y gestión de alertas según el perfil y permisos del usuario.
- **Cambios Necesarios:**
  - Extender el evaluador de alertas existente en el backend (`evaluateAndDispatchInstitutionalAlerts`).
  - Integrar las reglas de evaluación con el diccionario centralizado de indicadores.
  - Incorporar interfaz de configuración de umbrales para administradores.
  - Integrar las alertas en los paneles de control y en el centro de notificaciones multicanal.
  - Incorporar máquina de estados para el seguimiento de alertas (`Activa`, `EnRevision`, `Mitigada`, `Cerrada`).
- **Comportamiento Esperado:**
  Cuando un indicador alcance una condición configurada, el sistema generará una alerta para los responsables correspondientes.
  Las alertas deben ser señales de revisión, no conclusiones automáticas de fraude, negligencia o incumplimiento.
- **Criterios de Aceptación:**
  - [ ] Una condición que supera el umbral configurado genera una alerta institucional estructurada.
  - [ ] Una condición que permanece dentro de los rangos normales no genera alertas espurias.
  - [ ] La alerta identifica claramente el indicador, período, valor observado y umbral límite.
  - [ ] Los destinatarios de la notificación corresponden exclusivamente a los roles autorizados para el área.
  - [ ] Una misma condición no resuelta no produce notificaciones duplicadas ilimitadas.
  - [ ] Los responsables autorizados pueden reconocer y cerrar formalmente la alerta.
  - [ ] El historial de alertas conserva todos los cambios de estado y notas de revisión.
  - [ ] Las alertas académicas preexistentes siguen funcionando correctamente sin regresiones.
- **Ampliación de evidencia (C1.42 / FASE2-T07, 2026-11-05):** `calculateLateFeesForAccount` (backend/accounting-service/Code.gs:1223-1278) calcula recargos a partir de `RecargosMoras` y devuelve un resumen en la respuesta; no persiste una alerta, no crea evento y no registra entrega a responsables. La automatización de alertas financieras por mora debe integrarse con el alcance de esta tarea, sin confundir el cálculo de recargo con el despacho de una alerta.
- **Estado:** [ ] Pendiente

<!-- Fuente: RECUPERACION/Pendientes_RECUPERADO.md, líneas 14537-14582; clave TASK-405; asignación única: Dirección -->

---

<!-- ID: TASK-488 | Fuentes: AUDITORIAS/AUDITORIA_COMPLETADAS_F8-TASK07.md ; AUDITORIAS/AUDITORIA_COMPLETADAS_T-UX-12.md ; Pendientes.md -->
### [ ] [TASK-488] Completar los indicadores y accesos operativos de Dirección, Coordinación y dashboards dinámicos por rol
- **Origen:** AUD-NG-191, confirmado en F8-Task07.
- **Componentes:** `app/html/dashboards/dynamic-dashboard.html`, `js/ui-common.js`, `backend/user-service/Code.gs`, contratos de rutas y pruebas.
- **Acciones:** eliminar el mapa rígido y el fallback docente; resolver todas las responsabilidades activas y ámbitos vigentes del usuario autenticado; filtrar módulos mediante capacidades/permisos efectivos; convertir cada tarjeta en enlace/acción real con ruta validada; no mostrar módulos si la consulta de permisos falla.
- **Aceptación adicional:** un rol desconocido/inactivo o sin módulos devuelve acceso denegado/estado vacío explícito; ningún rol recibe módulos docentes por defecto; cada tarjeta conduce a un destino real y autorizado; pruebas cubren roles configurables, múltiples responsabilidades, ámbitos, permisos insuficientes y errores de servicio.
- **Estado:** TASK-488 permanece [ ] Pendiente.
- **Hallazgo de origen:** AUD-NG-191; T-UX-12.
- **Severidad:** Alto.
- **Objetivo:** eliminar indicadores estáticos/falsos y asegurar cobertura de paneles por rol.
- **Acción ejecutable:** conectar indicadores a fuentes reales; corregir los valores que se fijan manualmente en cero o declaran ausencia sin consultar datos; completar navegación y contenido del dashboard dinámico para todos los roles admitidos.
- **Archivos/módulos afectados:** dashboard-direccion.html, dashboard-coordinacion.html, dashboard dinámico y servicios de métricas.
- **Dependencias y riesgos:** TASK-483; autorización contextual por rol.
- **Alcance:** Dirección, Coordinación y dashboards dinámicos.
- **Criterios de aceptación:** cada indicador tiene fuente y cálculo trazable; ningún KPI muestra cero por ausencia de consulta; cada rol autorizado tiene panel funcional y accesos efectivos; pruebas por rol/estado de datos.
- **Prioridad:** P1.
- **Estado:** Pendiente.
- **Evidencia de cierre:** pruebas de integración y matriz de cobertura por rol.
- **Origen del Hallazgo:** AUD-NG-191 en Auditoria.txt (T-UX-12; paneles departamentales y configuración dinámica de responsabilidades).
- **Severidad/Clasificación:** Alto / P1.
- **Archivos Involucrados:** `dashboard-direccion.html`, `dashboard-coordinacion.html`, `js/secretary.js`, `js/ui-common.js`, `app/html/dashboards/dynamic-dashboard.html`, `backend/accounting-service/Code.gs`, `backend/academic-service/Code.gs` y `backend/user-service/Code.gs`.
- **Dependencias Expuestas:** `#pending-approvals-count`, `#approvals-list-container`, `getDiscountScholarshipRequests`, `initCoordinatorDashboard`, `loadCoordinatorDashboardData`, `getCoordinatorOverview`, estados de jornalizaciones/sílabos, `loadDynamicDashboard`, `getUserDynamicDashboardConfig`, catálogo de roles, responsabilidades, módulos y rutas autorizadas.
- **Descripción del Alcance:**
  1. Dirección: conectar el contador y la bandeja de aprobaciones con las solicitudes reales de becas/descuentos y sus estados. El HTML conserva el valor inicial cero y el mensaje estático de ausencia de solicitudes; no se encontró consumidor frontend para esos dos elementos. Existe el servicio `getDiscountScholarshipRequests`, que devuelve `solicitudes`, y debe evaluarse/reutilizarse con el contrato y permisos efectivos.
  2. Coordinación: reemplazar el valor fijo `0 Pendientes` y el mensaje `Todas las jornalizaciones y sílabos están al día` por un cálculo respaldado por estados reales. `getCoordinatorOverview` actualmente devuelve ofertas, asignaciones y horarios, pero no incluye estados de sílabos/jornalizaciones.
  3. Dashboard dinámico: hacer que la configuración presentada corresponda a las responsabilidades y módulos realmente configurados para el rol. La implementación actual utiliza un mapa fijo de seis roles y asigna `mod_mis_clases`/`mod_mis_horarios` como fallback genérico para cualquier rol no incluido.
  4. Convertir cada acceso `Acceder` del dashboard dinámico en un control navegable y autorizado hacia una ruta/módulo real. Actualmente se representa como un `span` visual sin enlace ni manejador de navegación.
  5. Reconciliar los identificadores y alias de roles con los valores realmente persistidos; no asumir que roles con/sin tildes, alias o nombres históricos son equivalentes sin normalización explícita.
  6. Diferenciar cero real, ausencia de datos, carga y error en todos los indicadores; no declarar que no existen pendientes cuando la fuente no se consulta o no contiene el dato.
  7. Mantener los accesos y datos limitados por rol, responsabilidad, ámbito departamental y permisos de servidor; la previsualización administrativa no debe conceder permisos ni mostrar datos reales ajenos.
- **Criterios de Aceptación:**
  - Dirección muestra el número y detalle de aprobaciones reales; el contador coincide con la bandeja y los cambios de estado se reflejan tras actualizar.
  - La bandeja no presenta un mensaje estático de ausencia de solicitudes cuando existen registros pendientes, ni confunde error de consulta con una lista vacía.
  - Coordinación calcula pendientes de sílabos/jornalizaciones a partir de estados consultados; no fija el contador en cero ni declara cumplimiento total sin evidencia.
  - El dashboard dinámico contempla todos los roles que deban utilizarlo y no asigna módulos docentes por defecto a roles no reconocidos.
  - Cada módulo mostrado dispone de una ruta real y un acceso funcional autorizado; no quedan tarjetas meramente decorativas.
  - Los módulos y datos visibles coinciden con las responsabilidades activas del usuario y con la configuración vigente del servidor.
  - Pruebas reproducibles cubren cada rol soportado, rol desconocido/inactivo, permisos insuficientes, cero registros, pendientes existentes y errores de servicio.
- **Relaciones y límites:** F8-Task12 (antes TAREA-AD-07) es una ampliación administrativa relacionada, pero su consola de roles no sustituye la implementación de los paneles ni demuestra que los módulos configurados se conviertan en accesos reales. T-UX-13/TASK-483 trata la navegación lateral; T-UX-16 trata notificaciones y aprobaciones. No duplicar sus alcances.
- **Estado:** [ ] Pendiente.

---

<!-- ID: TASK-489 | Fuentes: AUDITORIAS/AUDITORIA_COMPLETADAS_T-UX-12.md ; Pendientes.md -->
### [ ] [TASK-489] Corregir el contrato de datos entre el panel de Recursos Humanos y las solicitudes de vacaciones
- **Hallazgo de origen:** AUD-NG-192; T-UX-12.
- **Severidad:** Alto.
- **Objetivo:** alinear el panel de RR. HH. con la respuesta real del backend.
- **Acción ejecutable:** normalizar el DTO entre backend y frontend; alinear solicitudes/data, nombres de campos y estados; validar contadores y listas de vacaciones; manejar estados vacío/error.
- **Archivos/módulos afectados:** backend/user-service/Code.gs, módulo UI de Recursos Humanos y dashboard correspondiente.
- **Dependencias y riesgos:** contrato API versionado de AUD-NG-174; no traducir fallos a lista vacía.
- **Alcance:** consulta y renderizado de solicitudes laborales/vacaciones.
- **Criterios de aceptación:** esquema documentado coincide en ambos lados; lista/contador muestran los mismos registros; estados se traducen explícitamente; pruebas de éxito, vacío y error.
- **Prioridad:** P1.
- **Estado:** Pendiente.
- **Evidencia de cierre:** pruebas de contrato y renderizado.
- **Origen del Hallazgo:** AUD-NG-192 en Auditoria.txt (T-UX-12; integridad de indicadores y listas de RR. HH.).
- **Severidad/Clasificación:** Alto / P1.
- **Archivos Involucrados:** `dashboard-recursos-humanos.html`, `backend/accounting-service/Code.gs` y, si se centraliza el contrato, `js/api.js` o el adaptador de datos correspondiente.
- **Dependencias Expuestas:** `loadHRDashboardData`, acción `getLeaveVacationRequests`, wrapper `getVacationRequests`, campos `solicitudes`, `data`, `tipo`, `tipoSolicitud`, `expedienteId`, `userId` y estados de solicitud.
- **Descripción del Alcance:**
  1. Unificar el contrato de respuesta de `getLeaveVacationRequests` y su consumidor. El backend devuelve `{status, solicitudes}`, mientras el dashboard valida `resLeaves.data`; por ello la lista y el contador no se actualizan con la respuesta real.
  2. Alinear los campos representados: el backend entrega `tipo` y `expedienteId`, mientras el HTML intenta leer `tipoSolicitud` y `userId`. No mostrar identificadores o textos genéricos como si fueran el nombre del empleado.
  3. Alinear los estados de negocio. La creación registra `PendienteAprobacion`, pero el contador compara únicamente con `Pendiente`; normalizar o mapear estados de forma explícita y conservar el estado original para trazabilidad.
  4. Representar estados vacíos, error, carga y respuesta incompleta por separado; no dejar el cero inicial como si fuera un recuento confirmado.
  5. Mantener la consulta de RR. HH. y la vista de autoservicio de empleados con contratos distintos y permisos adecuados; no solucionar el problema ampliando exposición de solicitudes de terceros.
- **Criterios de Aceptación:**
  - La lista de vacaciones procesa el arreglo que realmente devuelve el backend y muestra los campos correctos.
  - Las solicitudes en estado pendiente de aprobación se cuentan correctamente, independientemente de la etiqueta interna usada por el backend, mediante un mapeo documentado.
  - Solicitudes aprobadas/rechazadas no se cuentan como pendientes y se presentan con su estado correcto.
  - Una respuesta vacía válida muestra cero; un error, ausencia de campo o respuesta malformada muestra un estado de error/no disponible.
  - Pruebas reproducibles cubren solicitudes pendientes, aprobadas, rechazadas, arreglo vacío, campos incompletos y fallo de servicio.
- **Relaciones y límites:** T-UX-12 requiere que los indicadores reflejen datos reales y distingan valores no disponibles de cero. TASK-489 corrige exclusivamente el contrato del panel de RR. HH.; la autorización y aislamiento entre empleados se registra por separado en TASK-490.
- **Estado:** [ ] Pendiente.

---

<!-- ID: TASK-490 | Fuentes: AUDITORIAS/AUDITORIA_COMPLETADAS_T-UX-12.md ; Pendientes.md -->
### [ ] [TASK-490] Aislar en servidor los expedientes y solicitudes laborales de cada empleado
- **Hallazgo de origen:** AUD-NG-193; T-UX-12.
- **Severidad:** Alto.
- **Objetivo:** impedir que un empleado autenticado consulte datos laborales de otros empleados.
- **Acción ejecutable:** derivar identidad del token verificado; filtrar en servidor por titular para rol Empleado; permitir consultas globales solo a roles administrativos explícitamente autorizados; eliminar confianza en targetUserId del payload.
- **Archivos/módulos afectados:** backend/user-service/Code.gs; endpoints de expedientes y solicitudes laborales.
- **Dependencias y riesgos:** controles RBAC/ABAC existentes y auditoría de accesos.
- **Alcance:** lectura de datos laborales y expedientes.
- **Criterios de aceptación:** empleado no puede leer otro UserId manipulando payload; roles administrativos autorizados mantienen su alcance; accesos denegados se registran; pruebas IDOR por rol.
- **Prioridad:** P1.
- **Estado:** Pendiente.
- **Evidencia de cierre:** pruebas de aislamiento y autorización servidor.
- **Origen del Hallazgo:** AUD-NG-193 en Auditoria.txt (T-UX-12; permisos efectivos y confidencialidad del panel de RR. HH.).
- **Severidad/Clasificación:** Alto / P1 (exposición de información laboral entre usuarios autenticados).
- **Archivos Involucrados:** `backend/accounting-service/Code.gs` y pruebas de regresión del servicio de Contabilidad/RR. HH.
- **Dependencias Expuestas:** `ROLE_PERMISSIONS.Empleado`, `validateRolePermission`, `validateContextualAccess`, `_verifiedUserId`, `getEmployeeRecords`, `getLeaveVacationRequests`, `getVacationRequests`, `ExpedientesLaborales` y `SolicitudesVacaciones`.
- **Descripción del Alcance:**
  1. Aplicar aislamiento ABAC en servidor para las consultas de autoservicio laboral. Actualmente el rol `Empleado` tiene permiso para `getEmployeeRecords` y `getLeaveVacationRequests`, pero `validateContextualAccess` solo aplica aislamiento contextual específico a Estudiante/Alumno.
  2. En `getEmployeeRecords`, vincular la consulta del empleado autenticado con `_verifiedUserId` y resolver su propio expediente en servidor. No permitir que el cliente obtenga todos los expedientes omitiendo filtros ni que consulte otro `userId` o `expedienteId`.
  3. En `getVacationRequests` (invocado por `getLeaveVacationRequests`), limitar al empleado autenticado a sus propias solicitudes. No confiar en `expedienteId` aportado por el cliente como prueba de titularidad.
  4. Mantener la consulta global únicamente para los roles administrativos autorizados (por ejemplo, RecursosHumanos) y validar explícitamente la capacidad requerida antes de devolver información de terceros.
  5. Revisar los campos de salida para no exponer observaciones, motivos u otros datos laborales ajenos a quien consulta; devolver únicamente los datos necesarios para cada vista.
  6. Registrar y rechazar intentos de manipular IDs de otros empleados sin revelar si el expediente o solicitud existe.
- **Criterios de Aceptación:**
  - Un empleado autenticado sin filtros solo obtiene su expediente y sus propias solicitudes; nunca recibe la colección completa.
  - Cambiar `userId`, `expedienteId` o identificadores de solicitud en el payload no permite leer datos de otro empleado.
  - Recursos Humanos conserva el acceso global que corresponda a su función y los demás roles solo acceden mediante permisos explícitos.
  - Las comprobaciones se realizan en el backend con identidad verificada; ocultar controles en el frontend no cuenta como autorización.
  - Pruebas de regresión cubren empleado A consultando empleado B, filtros ausentes, IDs manipulados, usuario sin expediente, rol RR. HH. autorizado y rol no autorizado.
  - Las pruebas no utilizan ni exponen datos personales productivos.
- **Relaciones y límites:** T-UX-12 exige que los servicios respeten los permisos efectivos. TASK-489 corrige el contrato de presentación de solicitudes; TASK-490 corrige la autorización y el aislamiento de datos. No ampliar permisos de RR. HH. ni duplicar las tareas generales de RBAC ya registradas.
- **Estado:** [ ] Pendiente.

---

<!-- ID: TASK-506 | Fuentes: AUDITORIAS/AUDITORIA_COMPLETADAS_TAREA-F4-P1-07.md ; Pendientes.md -->
### [ ] [TASK-506] Garantizar integridad referencial y atomicidad en departamentos, cargos y adscripciones institucionales
- **Hallazgo de origen:** AUD-NG-226, sección 3 de este informe. CREATE_DEPT/CREATE_CARGO aceptan identificadores y referencias sin validación suficiente; ASSIGN_USER no valida el estado ni las referencias completas y cierra la adscripción anterior antes de garantizar la nueva; la operación no es atómica bajo fallos o concurrencia; las consultas carecen de paginación y filtro de ámbito; la interfaz no utiliza los catálogos.
- **Severidad:** Alto.
- **Objetivo:** mantener catálogos institucionales consistentes y adscripciones laborales válidas, evitando filas huérfanas, duplicados, pérdida parcial de la adscripción vigente y divergencias entre los modelos administrativo y académico.
- **Acción ejecutable:**
  1. Formalizar los contratos y relaciones de CatalogoDepartamentos, CatalogoCargos e HistorialAdscripciones, incluidos estado, jerarquía, departamento asociado, jefatura, fechas de vigencia y referencias de usuario.
  2. Validar en servidor la unicidad de deptId/cargoId, la existencia y estado de departamentos/cargos, la existencia y estado de jefaturas y usuarios, y la compatibilidad de cada cargo con su departamento. Rechazar referencias inexistentes o inactivas.
  3. Revisar el modelo de departamentos académicos: documentar si DepartamentosAcademicos es una entidad independiente o si debe vincularse con CatalogoDepartamentos; establecer una relación explícita y validable sin fusionar ambos catálogos por suposición.
  4. Rediseñar ASSIGN_USER como operación transaccional lógica: validar todos los datos, reservar/generar el identificador y preparar la nueva adscripción antes de cerrar la anterior; ejecutar el cambio bajo bloqueo que cubra la operación completa; si la escritura falla, conservar o restaurar la adscripción previa y dejar evidencia recuperable.
  5. Impedir más de una adscripción activa incompatible por usuario según las reglas institucionales, incluyendo protección frente a solicitudes concurrentes y reintentos idempotentes.
  6. Completar los tipos de operación de gestión que realmente requiera el modelo (consulta, actualización, desactivación y reasignación), documentando sus transiciones y evitando que un endpoint acepte acciones no implementadas.
  7. Incorporar paginación estable, límites máximos y filtros por departamento/ámbito a getUserInstitutionalAffiliations; aplicar autorización contextual para impedir consultas fuera del ámbito permitido.
  8. Conectar la UI de RRHH con los catálogos y operaciones institucionales; reemplazar texto libre por selectores validados donde corresponda y presentar errores, historial y estado de la adscripción.
  9. Añadir pruebas para integridad referencial, identificadores duplicados, usuario/jefatura inactivos, cargo-departamento incompatible, fallos en cada etapa de reasignación, rollback/recuperación, reintentos, concurrencia, paginación, autorización y UI.
- **Archivos/módulos afectados:** backend/user-service/Code.gs (manageDepartmentPositions, generateInstitutionalId, getUserInstitutionalAffiliations); backend/academic-service/Code.gs (assignDepartmentHead y consultas relacionadas); dashboard-recursos-humanos.html; tests/regression/academic-grading-suite.js y pruebas específicas de USER/ACADEMIC/UI; contratos y documentación de CatalogoDepartamentos, CatalogoCargos, DepartamentosAcademicos e HistorialAdscripciones.
- **Dependencias y riesgos:** TASK-171 (ciclos y referencias jerárquicas), TASK-365 (organigrama visual), TASK-006/AUD-NG-017 (offboarding), AUD-NG-018/TASK-005 (asignaciones docentes a áreas académicas), AUD-NG-221/TASK-501 y AUD-NG-222/TASK-502 (permisos y autorización contextual), AUD-NG-145/AUD-NG-224 (bitácoras/versionado). AUD-NG-161/TASK-118 puede aportar controles de generación de identificadores, sin trasladar aquí su alcance de UserId. Riesgos: migración de registros huérfanos, reglas de unicidad no acordes con suplencias o adscripciones históricas, bloqueos concurrentes, rollback incompleto y confusión entre departamento laboral y académico.
- **Alcance:** CRUD/validación de catálogos administrativos, jefaturas, cargos y adscripciones laborales; consistencia de la reasignación y consulta histórica; relación explícita con el modelo académico cuando proceda. No incluye la asignación de docentes a áreas curriculares (TASK-005/AUD-NG-018), la visualización del organigrama (TASK-365), prevención de ciclos jerárquicos ya cubierta por TASK-171 ni procesos de baja/offboarding de TASK-006.
- **Criterios de aceptación:**
  1. No pueden crearse departamentos o cargos con IDs duplicados ni referencias inexistentes/inactivas.
  2. Las jefaturas y usuarios asignados existen, están activos y cumplen las reglas de ámbito.
  3. La relación entre departamentos administrativos y académicos está documentada y validada; no se mezclan modelos sin una decisión explícita.
  4. Una reasignación exitosa deja exactamente el estado activo permitido y conserva el historial; un fallo no cierra ni pierde la adscripción previa.
  5. Las operaciones concurrentes y los reintentos no producen adscripciones activas duplicadas ni resultados parciales; el mecanismo de bloqueo cubre el flujo completo.
  6. Las consultas de adscripciones están paginadas, limitadas y filtradas por ámbito con autorización contextual efectiva.
  7. La UI de RRHH utiliza catálogos institucionales y muestra resultados/errores reales, sin depender de texto libre para referencias controladas.
  8. Las pruebas automatizadas cubren integridad, fallos, recuperación, concurrencia, paginación, permisos y regresión de USER/ACADEMIC/UI.
- **Prioridad:** P1.
- **Estado:** Pendiente.
- **Evidencia de cierre:** pendiente. Registrar SHA de implementación, pruebas de integridad/atomicidad y concurrencia, validación de migración y evidencia de UI antes de cambiar el estado.
- **Origen del Hallazgo:** AUD-NG-226.
- **Severidad/Clasificación:** Alto (P1).
- **Archivos Involucrados:** backend/user-service/Code.gs; backend/academic-service/Code.gs; dashboard-recursos-humanos.html; tests/regression/academic-grading-suite.js.
- **Dependencias Expuestas:** CatalogoDepartamentos, CatalogoCargos, HistorialAdscripciones, DepartamentosAcademicos, Usuarios, manageDepartmentPositions, assignDepartmentHead, generateInstitutionalId.
- **Descripción del Alcance:** Cerrar validaciones referenciales, unicidad, consistencia intercatálogo y atomicidad de las operaciones de departamento, cargo y adscripción; conectar flujos a la consola HR con consultas paginadas y auditoría.
- **Criterios de Aceptación:** Se cumplen los criterios de AUD-NG-226; ningún fallo parcial cierra la asignación anterior; no se generan IDs duplicados ni referencias huérfanas; UI y pruebas verifican comportamiento real.
- **Estado:** [ ] Pendiente

---

<!-- ID: TASK-668 | Fuentes: AUDITORIAS/AUDITORIA_COMPLETADAS_F8-TASK09.md -->
### [ ] [TASK-668] Resolver jerarquías y vigencia temporal de ámbitos
- **Hallazgo:** AUD-NG-314.
- **Severidad/Prioridad:** ALTO/P1.
- **Objetivo:** validar que cada valor asignado exista, esté activo y sea coherente con sus entidades padre y con el período de vigencia.
- **Archivos/componentes:** backend/user-service/Code.gs; backend/academic-service/Code.gs; catálogos académicos e institucionales.
- **Dependencias:** TASK-661, TASK-662, TASK-663 y TASK-667.
- **Alcance:** enumerar tipos de ámbito permitidos; validar referencias a nivel, departamento, carrera, asignatura, grado, sección y período; comprobar relaciones padre-hijo; aplicar fechaInicio/fechaFin y estados; definir resolución de varias asignaciones y conflictos de roles sin usar el primer registro arbitrario.
- **Criterios de aceptación:** no se aceptan valores inexistentes/inactivos ni relaciones incompatibles; asignaciones futuras/vencidas no conceden acceso; el resultado para múltiples responsabilidades es determinista y auditable; no hay inferencia de ámbito por ausencia de datos.

---

<!-- ID: TASK-670 | Fuentes: AUDITORIAS/AUDITORIA_COMPLETADAS_F8-TASK10.md -->
### [ ] [TASK-670] Completar el dashboard de coordinación académica como referencia funcional
- **Hallazgos de origen:** AUD-NG-316, AUD-NG-317 y AUD-NG-319.
- **Severidad:** Alto.
- **Objetivo:** entregar un dashboard operativo con datos reales, filtros funcionales, módulos de supervisión y flujos de revisión conectados a servicios existentes.
- **Acción ejecutable:** implementar contrato de overview que reciba identidad/ámbito derivados del backend; calcular indicadores reales de docentes, cargas, vacantes, jornalizaciones, sílabos, eventos y pendientes; aplicar filtros de nivel/departamento/carrera/período; incorporar revisión, observaciones, solicitud de corrección, aprobación/rechazo e historial; añadir estados de error/vacío y navegación a documentación, horarios y reportes.
- **Archivos/módulos afectados:** dashboard-coordinacion.html; js/secretary.js; js/teacher.js solo si se justifica reutilización explícita; backend/academic-service/Code.gs; pruebas de regresión del módulo académico.
- **Dependencias y riesgos:** TASK-488, TASK-501, TASK-505, TASK-636, TASK-666, TASK-668, TASK-664 y TASK-665. Riesgo de exposición interdepartamental si el endpoint entrega registros globales o el cliente controla el ámbito.
- **Alcance:** no duplicar servicios de planificación, calendario, horarios o reportes existentes; reutilizar sus contratos, normalizar adaptadores y no introducir datos ficticios ni indicadores hardcodeados.
- **Criterios de aceptación:** todos los indicadores se derivan de fuentes reales y documentadas; filtros cambian los resultados y el backend aplica el mismo ámbito; un coordinador solo consulta/revisa registros autorizados; los módulos requeridos son accesibles; el estado de revisión corresponde a los datos reales; se cubren errores y resultados vacíos; pruebas verifican los escenarios de nivel/departamento/carrera y roles múltiples.
- **Prioridad:** P1.
- **Estado:** Pendiente.
- **Evidencia de cierre:** pendiente de implementación, pruebas y revisión externa.

---

<!-- ID: F10-TASK16 | Fuentes: Pendientes.md ; pendientes/Dirección/Pendientes.md -->
### [ ] [F10-TASK16] Ampliar los informes de asistencia, convivencia y seguimiento
- **Origen del Hallazgo:** `AUDITORIA_FASE_10_ASISTENCIA_DISCIPLINA_CONVIVENCIA.md` / Tarea 10.12 (P2)
- **Prioridad:** P2
- **Severidad/Clasificación:** Media (Informes, reportes y estadísticas)
- **Archivos Involucrados:**
  - `backend/academic-service/Code.gs`
- **Dependencias Expuestas:** RegistrosAsistencia, CasosSeguimiento
- **Descripción del Alcance:**
  Incorporar informes consolidados de asistencia por clase/día, tardanzas acumuladas, incidencias por estado y resumen de compromisos respetando los permisos de rol.
- **Criterios de Aceptación:**
  - Los reportes aplican los filtros seleccionados y excluyen información confidencial de consejería.
- **Estado:** Pendiente

<!-- Fuente: RECUPERACION/Pendientes_RECUPERADO.md, líneas 524-538; clave F10-Task17; asignación única: Dirección -->

---

<!-- ID: F10-TASK17 | Fuentes: Pendientes.md ; pendientes/Dirección/Pendientes.md -->
### [ ] [F10-TASK17] Optimizar el registro de asistencia laboral del personal
- **Origen del Hallazgo:** `AUDITORIA_FASE_10_ASISTENCIA_DISCIPLINA_CONVIVENCIA.md` / Tarea 10.13 (P2)
- **Prioridad:** P2
- **Severidad/Clasificación:** Media (Asistencia de personal laboral)
- **Archivos Involucrados:**
  - `backend/accounting-service/Code.gs`
- **Dependencias Expuestas:** AsistenciaPersonal
- **Descripción del Alcance:**
  Optimizar el registro de entrada/salida laboral de empleados, gestión de marcas incompletas y correcciones con trazabilidad sin mezclar datos con la asistencia estudiantil.
- **Criterios de Aceptación:**
  - El registro de asistencia laboral se mantiene aislado e íntegro respecto a los registros académicos.
- **Estado:** Pendiente

---

<!-- ID: F16-TASK07 | Fuentes: AUDITORIAS/AUDITORIA_FASE_16_RECURSOS_HUMANOS.md -->
### [ ] [F16-TASK07] Desarrollar el organigrama interactivo y directorio jerárquico
- **Severidad:** Media (Visualización institucional)
- **Componentes Afectados:** `dashboard-recursos-humanos.html`, `js/accounting.js`.
- **Descripción:** Renderizar un organigrama dinámico basado en SVG o nodos HTML que ilustre la jerarquía de departamentos, coordinaciones, jefaturas y colaboradores asignados con filtros por área y departamento.
- **Hallazgo de origen:** F.5, tabla E/F16-22, H.3 y J.
- **Severidad:** Media. **Objetivo:** permitir a Dirección consultar visualmente la cadena de mando y dependencias institucionales.
- **Acción ejecutable:** renderizar organigrama SVG/HTML con departamentos, coordinaciones, jefaturas y colaboradores; añadir filtros por área/departamento y estados vigentes.
- **Archivos/módulos:** `dashboard-recursos-humanos.html`, `js/accounting.js`, endpoints de estructura y directorio.
- **Dependencias/riesgos:** catálogo de cargos/departamentos, relaciones acíclicas, permisos y vigencia; riesgo de mostrar relaciones obsoletas o datos personales sin autorización.
- **Alcance:** visualización/consulta; no sustituir el mantenimiento de la estructura.
- **Criterios de aceptación:** organigrama representa relaciones persistidas; filtros/navegación funcionan; nodos sin jefatura se muestran; datos respetan permisos y se actualizan tras cambios.
- **Prioridad:** P2. **Estado:** Pendiente.
- **Reconciliación:** C1.82 vincula organigrama con TASK-365. Mantener F16-Task07 como origen y ampliar/verificar TASK-365; no duplicar componente.
- **Evidencia de cierre:** pendiente; no se declara ejecución ni verificación.

---

<!-- ID: F16-TASK08 | Fuentes: AUDITORIAS/AUDITORIA_FASE_16_RECURSOS_HUMANOS.md -->
### [ ] [F16-TASK08] Exportar expedientes laborales y boletas de liquidación con filtros avanzados
- **Severidad:** Media (Gestión documental)
- **Componentes Afectados:** `backend/accounting-service/Code.gs`, `js/accounting.js`.
- **Descripción:** Permitir descargar el expediente laboral completo en PDF membretado y exportar nóminas consolidadas a Excel con desglose de retenciones IHSS, RAP e ISR.
- **Hallazgo de origen:** backlog H.3. La tabla E/F16-19 agrega filtros cruzados en exportaciones; se integra como ampliación sin crear otro ID.
- **Severidad:** Media. **Objetivo:** facilitar descarga controlada de expedientes y reportes de personal con información financiera desglosada.
- **Acción ejecutable:** exportar expediente laboral completo a PDF membretado y nóminas/boletas a Excel con desglose IHSS, RAP e ISR; incorporar filtros cruzados.
- **Archivos/módulos:** accounting-service, `js/accounting.js`, dashboard RR. HH. y módulos de reportes/exportación.
- **Dependencias/riesgos:** permisos RR. HH./contabilidad, datos laborales/financieros, plantillas y filtros; riesgo de fuga de salarios o exportaciones inconsistentes.
- **Alcance:** exportación documental y reportes; no ampliar accesos ni alterar cálculos de nómina.
- **Criterios de aceptación:** PDF identifica empleado; Excel concilia con fuentes y desglosa retenciones; filtros aplican antes de exportar; usuarios no autorizados reciben denegación; exportaciones auditadas.
- **Prioridad:** P2. **Estado:** Pendiente (estado operativo de migración; el informe no declara estado histórico explícito).
- **Procedencia adicional:** F16-19 figura en tabla E, pero no tiene tarea propia en H/J; se integra aquí para evitar duplicación.
- **Evidencia de cierre:** pendiente; no se declara ejecución ni verificación.

---

<!-- ID: F16-TASK10 | Fuentes: AUDITORIAS/AUDITORIA_FASE_16_RECURSOS_HUMANOS.md -->
### [ ] [F16-TASK10] Automatizar la conversión de candidatos seleccionados a empleados
- **Hallazgo de origen:** tabla E/F16-05: reclutamiento completo, pero conversión de candidato a empleado manual; omitida de H/J.
- **Severidad:** Media (P2 en tabla E). **Objetivo:** enlazar selección aprobada con creación del expediente laboral.
- **Acción ejecutable:** crear transición candidato-seleccionado a empleado que valide aprobación, evite duplicados, transfiera datos autorizados y conserve vínculo al proceso de reclutamiento.
- **Archivos/módulos:** accounting-service, `VacantesLaborales`, `CandidatosVacantes`, `ExpedientesLaborales` e interfaz RR. HH.
- **Dependencias/riesgos:** identidad, expediente, contrato y onboarding; riesgo de duplicar empleados o convertir candidatos no aprobados.
- **Alcance:** conversión de candidatos seleccionados; no automatizar decisión de contratación ni sustituir F16-Task04.
- **Criterios de aceptación:** solo candidatos aprobados se convierten; operación idempotente; expediente conserva vínculo; datos se transfieren con permisos; duplicados rechazados.
- **Prioridad:** P2. **Estado:** Pendiente. **Tipo:** nueva tarea derivada de la tabla E.
- **Evidencia de cierre:** pendiente; no se declara ejecución ni verificación.

---

<!-- ID: F29-TASK10 | Fuentes: AUDITORIAS/AUDITORIA_FASE_29_MIGRACION_Y_TRANSICION.md -->
### [ ] [F29-TASK10] Habilitar pilotos controlados por departamento
- **Hallazgo de origen:** F29-14; secciones C.14, I y J.
- **Severidad:** Media / P2. **Objetivo:** validar procesos y datos en departamentos seleccionados antes de ampliar el Go-Live.
- **Acción ejecutable:** definir feature flags por institución/departamento, cohortes piloto, métricas, criterios de salida y procedimiento de reversión; habilitar operación paralela sin permitir doble escritura no conciliada.
- **Archivos/módulos:** `backend/developer-service/Code.gs`, `ConfiguracionSistema`, controles de acceso, dashboards y procedimientos operativos.
- **Dependencias/riesgos:** F29-Task06/07/08/16/17; riesgo de que piloto modifique datos oficiales o mezcle resultados de cohortes.
- **Alcance:** piloto limitado y reversible; no desplegar en toda la institución ni usar feature flags como sustituto de permisos.
- **Criterios de aceptación:** departamentos/cohortes definidos; bandera evaluada server-side; datos aislados y etiquetados; métricas de calidad/uso/incidencias; rollback ensayado; criterios de expansión aprobados por responsables.
- **Prioridad:** P2. **Estado:** Pendiente.
- **Evidencia de cierre:** pendiente; la matriz H declara ausente la capacidad de piloto departamental.

---

<!-- ID: F32-TASK11 | Fuentes: AUDITORIAS/AUDITORIA_FASE_32_EDITOR_VISUAL_PDF_CAMPOS_SUPERPUESTOS.md -->
### [ ] [F32-TASK11] Crear suite de fidelidad PDF y detección de desplazamientos
- **Hallazgo de origen:** CAR-13/CAR-15 y plan H.11.
- **Severidad:** Media / P2. **Objetivo:** detectar desplazamientos geométricos entre preview, archivo emitido e impresión en diferentes visores.
- **Acción ejecutable:** crear fixtures PDF con coordenadas conocidas, textos de longitud variable y rotaciones; comparar posiciones/rasterizados del resultado en navegadores/visores; verificar CUV/hash y regresiones de exportación.
- **Archivos/módulos:** `tests/regression`, PDF Overlay, `generateSchoolDocument`, `DocumentosEscolaresEmitidos`.
- **Dependencias/riesgos:** F32-Task01/02/03/07 y AUD-NG-161; riesgo de pruebas que solo inspeccionen existencia de funciones.
- **Alcance:** pruebas geométricas y de salida PDF; no usar documentos personales productivos.
- **Criterios de aceptación:** fixtures versionados; tolerancia geométrica definida; pruebas multipágina/tamaño/rotación; preview y PDF final comparados; regresión detecta offsets; resultados reproducibles.
- **Prioridad:** P2. **Estado:** Pendiente.
- **Evidencia de cierre:** pendiente; la matriz DOC/PDF no acredita suite dedicada de fidelidad y desplazamiento en distintos visores.

---

<!-- ID: TASK-365 | Fuentes: Pendientes.md ; pendientes/Dirección/Pendientes.md -->
### [ ] [TASK-365] Desarrollar un organigrama institucional interactivo y directorio de personal
- **Origen del Hallazgo:** `AUDITORIA_FASE_16_RECURSOS_HUMANOS.md` / Sección F (Brecha F.5) y Sección H (P2)
- **Prioridad:** P2
- **Severidad/Clasificación:** Media (Supervisión directiva, claridad organizativa y experiencia de usuario)
- **Archivos Involucrados:**
  - `dashboard-recursos-humanos.html`
  - `js/ui-common.js`
  - `js/accounting.js`
  - `backend/user-service/Code.gs`
  - `backend/academic-service/Code.gs`
  - `CatalogoDepartamentos`
  - `CatalogoCargos`
  - `HistorialAdscripciones`
  - `AsignacionesAmbitosRoles`
  - `CoordinacionesArea`
  - `AreasCurricularesExtensiones`
- **Dependencias Expuestas:** `CatalogoDepartamentos`, `CatalogoCargos`, `HistorialAdscripciones`, `CoordinacionesArea`, `F16-Task01`, `F16-Task06`
- **Descripción del Alcance:**
  El panel de Recursos Humanos presenta información organizativa mediante tablas, pero carece de una representación gráfica dinámica de la estructura institucional que permita a la Dirección y Coordinación visualizar la cadena de mando y las academias docentes.
  Requerimientos Funcionales Detallados:
  1. Componente visual interactivo:
     - Renderizar un organigrama basado en nodos DOM / SVG que muestre departamentos, subdepartamentos, jefaturas, coordinaciones de área y colaboradores adscritos.
     - Controles interactivos: expandir/contraer ramas, zoom, paneo, búsqueda rápida de empleados por nombre/cargo y filtros por departamento y área académica.
     - Diferenciación visual clara entre líneas jerárquicas administrativas y coordinaciones académicas funcionales.
  2. Directorio institucional y privacidad:
     - Permitir alternar entre vista de organigrama jerárquico y vista de directorio telefónico/correo institucional.
     - Si un empleado tiene múltiples responsabilidades (ej. docente y coordinador), mostrarlo como un único colaborador con sus diferentes atribuciones vinculadas.
     - Carga progresiva y optimizada para no saturar memoria ni transferir datos confidenciales de nómina o expedientes médicos.
- **Criterios de Aceptación:**
  - El organigrama se genera dinámicamente desde los datos reales de departamentos y adscripciones.
  - Los cambios en jefaturas o adscripciones se reflejan de inmediato en la visualización.
  - No se producen bucles visuales en la representación de la estructura.
  - Un colaborador con múltiples asignaciones mantiene su identidad única sin duplicar fichas.
  - El visor opera de manera fluida y responsiva en dispositivos de escritorio y móviles.
- **Estado:** [ ] Pendiente

<!-- Fuente: RECUPERACION/Pendientes_RECUPERADO.md, líneas 13306-13339; clave TASK-366; asignación única: Dirección -->

---

<!-- ID: TASK-366 | Fuentes: Pendientes.md ; pendientes/Dirección/Pendientes.md -->
### [ ] [TASK-366] Implementar exportación avanzada de expedientes laborales, reportes y documentos de liquidación
- **Origen del Hallazgo:** `AUDITORIA_FASE_16_RECURSOS_HUMANOS.md` / Sección B (F16-19) y Sección H (P2)
- **Prioridad:** P2
- **Severidad/Clasificación:** Media (Gestión documental, archivo institucional y exportación para auditorías)
- **Archivos Involucrados:**
  - `backend/accounting-service/Code.gs`
  - `dashboard-recursos-humanos.html`
  - `js/accounting.js`
  - `ExpedientesLaborales`
  - `ContratosLaborales`
  - `SolicitudesVacaciones`
  - `EvaluacionesDesempenoRegistros`
  - `CapacitacionesCursos`
- **Dependencias Expuestas:** Generadores de documentos, Google Drive, `ExpedientesLaborales`, `ContratosLaborales`
- **Descripción del Alcance:**
  La plataforma cuenta con reportes en pantalla, pero necesita ampliar las opciones de exportación estructurada en PDF y Excel para trámites oficiales, auditorías laborales y archivo físico institucional.
  Requerimientos Funcionales Detallados:
  1. Expediente individual en PDF con membrete institucional:
     - Generar PDF completo o modular permitiendo seleccionar secciones: datos personales, historial de puestos y departamentos, contratos y renovaciones, asistencias consolidadas, vacaciones, capacitaciones, evaluaciones de desempeño y medidas disciplinarias (solo para roles autorizados).
  2. Reportes de personal en Excel:
     - Exportaciones tabulares de personal activo/inactivo, docentes por área académica, contratos por vencer, ausencias e incapacidades con filtros aplicados.
  3. Cierre y liquidación laboral:
     - Generar hojas de cálculo y reportes de finiquito laboral desglosando bases de cálculo, deducciones de ley (IHSS, RAP, ISR) y saldos de vacaciones pendientes con campos para firmas de conformidad.
  4. Seguridad y protección documental:
     - Excluir diagnósticos médicos confidenciales de reportes generales; registrar en auditoría qué usuario generó y descargó cada expediente sensible.
- **Criterios de Aceptación:**
  - El PDF descargado refleja fielmente el historial del expediente seleccionado con formato formal institucional.
  - Los archivos de Excel generados mantienen los formatos de fecha, números y fórmulas consistentes.
  - Los datos médicos confidenciales y salariales están estrictamente aislados según el rol del solicitante.
  - Se registra la bitácora de descarga de expedientes con usuario, fecha y motivo.
- **Estado:** [ ] Pendiente

<!-- Fuente: RECUPERACION/Pendientes_RECUPERADO.md, líneas 13340-13373; clave TASK-367; asignación única: Dirección -->

---

<!-- ID: TASK-367 | Fuentes: Pendientes.md ; pendientes/Dirección/Pendientes.md -->
### [ ] [TASK-367] Automatizar la conversión de candidatos seleccionados en expedientes de empleados
- **Origen del Hallazgo:** `AUDITORIA_FASE_16_RECURSOS_HUMANOS.md` / Sección B (F16-05) y Sección H (P2)
- **Prioridad:** P2
- **Severidad/Clasificación:** Media (Eficiencia administrativa en reclutamiento y continuidad del ciclo laboral)
- **Archivos Involucrados:**
  - `backend/accounting-service/Code.gs`
  - `manageJobVacancy`
  - `submitJobCandidate`
  - `createEmployeeRecord`
  - `VacantesLaborales`
  - `CandidatosVacantes`
  - `ExpedientesLaborales`
  - `ContratosLaborales`
  - `F16-Task04`
- **Dependencias Expuestas:** `CandidatosVacantes`, `ExpedientesLaborales`, `ContratosLaborales`, `ChecklistIncorporacion`
- **Descripción del Alcance:**
  El sistema cuenta con gestión de vacantes y postulantes mediante `manageJobVacancy` y `submitJobCandidate`, pero la formalización de un candidato contratado requiere capturar nuevamente sus datos de forma manual, propiciando errores tipográficos o duplicidades.
  Requerimientos Funcionales Detallados:
  1. Conversión fluida de postulante a colaborador:
     - Acción en interfaz para formalizar la contratación de un candidato con estado `Seleccionado`.
     - Precargar automáticamente los datos personales, teléfono, correo electrónico y CV previamente registrados en `CandidatosVacantes`.
     - Validar que la persona no tenga ya un expediente laboral activo previo (detección por DNI/identificación).
     - Crear o vincular el expediente laboral en `ExpedientesLaborales` y registrar el primer contrato en `ContratosLaborales`.
     - Disparar automáticamente la plantilla de checklist de incorporación (`F16-Task04`).
     - Actualizar el estado de la vacante restando las plazas disponibles y marcando la candidatura como `Contratado`.
- **Criterios de Aceptación:**
  - Un candidato seleccionado se convierte en empleado con un solo flujo guiado reutilizando sus datos.
  - Se detectan y alertan posibles expedientes duplicados antes de formalizar la contratación.
  - Se crea el expediente y el contrato inicial quedando enlazados a la lista de onboarding correspondiente.
  - El historial del proceso de selección y entrevistas permanece archivado y consultable.
- **Estado:** [ ] Pendiente

<!-- Fuente: RECUPERACION/Pendientes_RECUPERADO.md, líneas 14054-14078; clave TASK-391; asignación única: Dirección -->

---

<!-- ID: TASK-391 | Fuentes: Pendientes.md ; pendientes/Dirección/Pendientes.md -->
### [ ] [TASK-391] Indicadores de eficiencia operativa y análisis de demanda de transporte
- **Origen del Hallazgo:** `AUDITORIA_FASE_21_TRANSPORTE_SERVICIOS_COMPLEMENTARIOS.md` / Sección C (3.12) y Plan de Implementación TAREA 29
- **Prioridad:** P2
- **Severidad/Clasificación:** Media (Analítica gerencial, toma de decisiones de rutas y costos por alumno)
- **Archivos Involucrados:**
  - `backend/accounting-service/Code.gs` (nueva función `getTransportEfficiencyMetrics`)
  - `TransporteRutas`
  - `TransporteAsignaciones`
  - `TransporteViajes`
- **Dependencias Expuestas:** `TransporteRutas`, `TransporteViajes`, `F21-Task27`
- **Descripción del Alcance:**
  Dirección no cuenta con indicadores para evaluar si una ruta es rentable, si está sobreocupada o si existen zonas residenciales con demanda insatisfecha.
  Requerimientos Funcionales Detallados:
  1. Indicadores de eficiencia:
     - Tasa de ocupación promedio de la flota por ruta y jornada.
     - Índice de puntualidad y duración promedio de recorridos.
     - Costo operativo promedio por estudiante transportado.
     - Identificación de zonas geográficas con alta demanda de transporte sin cobertura.
- **Criterios de Aceptación:**
  - Se calculan métricas fundamentadas en datos reales de viajes y asignaciones.
  - Dirección visualiza gráficos de rendimiento de la flota vehicular.
- **Estado:** [ ] Pendiente

<!-- Fuente: RECUPERACION/Pendientes_RECUPERADO.md, líneas 14079-14099; clave TASK-392; asignación única: Dirección -->

---

<!-- ID: TASK-430 | Fuentes: AUDITORIAS/AUDITORIA_COMPLETADAS_T-UX-24.md ; Pendientes.md ; pendientes/Dirección/Pendientes.md -->
### [ ] [TASK-430] [F28-T10] [P2] Profesionalización de la Identidad Visual y Unificación del Sistema de Diseño Institucional
- **Tipo:** tarea existente ampliada; no crear tarea paralela.
- **Hallazgo/severidad:** AUD-NG-215, MEDIO/P2; variantes compartidas no se adoptan transversalmente y renderizadores difieren en estados equivalentes.
- **Objetivo:** establecer sistema de diseño consistente entre departamentos.
- **Acción:** migrar botones a variantes comunes; definir patrones para éxito, error, advertencia, carga, información y vacío; unificar “Información recibida” y “Se necesita información” entre renderizadores; retirar estilos locales divergentes tras migración.
- **Archivos:** css/style.css, js/ui-common.js y 12 vistas principales inspeccionadas.
- **Dependencias:** TASK-492 (campos), TASK-493 (modal), TASK-494 (overlays), TASK-495 (conectividad).
- **Alcance:** botones, alertas, badges, carga/vacío y renderizadores; no sustituye accesibilidad ni contrato de campos.
- **Criterios:** controles equivalentes usan variantes compartidas; jerarquía primaria/secundaria/destructiva coherente; estados semánticos iguales tienen reglas equivalentes; patrones comunes disponibles; excepciones documentadas; revisión visual y de contraste/foco.
- **Prioridad:** P2. **Estado:** conservar el de TASK-430.
- **Evidencia:** pendiente; sin pruebas visuales/runtime.
- **Tipo:** Profesionalización Visual y Calidad de Presentación.
- **Componentes Afectados:**
  - Sistema global de estilos (Tailwind CSS, variables CSS institucionales)
  - Vistas y plantillas de todos los departamentos (`app/html/`, `dashboards/`)
  - Componentes compartidos de cabecera, navegación lateral, modales, botones y tarjetas
- **Subcapacidades Relacionadas:** M04, P01, P04, A01, A05.
- **Estado de Partida:** Requiere mejoras.
- **Dependencias:** [F28-T05], Tailwind CSS, sistema de componentes compartidos.
- **Problema Detectado y Riesgos:**
  Aunque los paneles son funcionales, la plataforma presenta disparidad de estilos entre departamentos (algunos módulos lucen con colores brillantes, bordes excesivamente redondeados o apariencias semejantes a plantillas genéricas o de juguete). Un sistema de gestión educativa de nivel empresarial requiere una identidad visual sobria, madura y profesional, orientada a la productividad académica y administrativa.
- **Requisitos Funcionales y Visuales Convergentes:**
  1. *Línea Gráfica de Referencia Institucional:*
     - Adoptar la madurez, sobriedad y balance visual de plataformas consolidadas de gestión educativa como **PowerSchool SIS** y **Moodle Institucional**:
       - Paleta cromática corporativa: Azul marino institucional (`#1e3a8a`, `#1e40af`), pizarra neutro (`#0f172a`, `#334155`), fondos en gris suave (`#f8fafc`, `#f1f5f9`) y acentos funcionales controlados (verde esmeralda para éxito, rojo carmesí para alertas críticas, ámbar para advertencias).
       - Supresión de estridencias: Eliminar gradientes decorativos innecesarios, sombras excesivas y bordes redondeados infantiles. Usar radios sutiles (`rounded-md`, `rounded-lg`).
  2. *Escala Tipográfica y Jerarquía Clara:*
     - Tipografía institucional legible (Inter / Roboto / System UI).
     - Escala tipográfica estricta: Encabezados H1 (1.5rem, semibold), H2 (1.25rem, semibold), H3 (1.125rem, medium), cuerpo de texto (0.875rem / 14px), etiquetas y pies (0.75rem / 12px).
     - Espaciados y ritmos visuales consistentes (múltiplos de 4px / 8px).
  3. *Consistencia Interdepartamental:*
     - Unificar la estructura de cabecera (*topbar*), menú lateral (*sidebar*), barra de herramientas y pie de página en todos los dashboards (Docente, Estudiante, Contabilidad, Dirección, Secretaría).
     - Ningún módulo debe parecer una aplicación desconectada o creada por otro equipo.
  4. *Coherencia en Modos Claro y Oscuro:*
     - Definir tokens de color semánticos (`--bg-surface`, `--text-primary`, `--border-subtle`).
     - Garantizar que en modo oscuro las tablas, formularios y modales conserven contraste suficiente y descansen la vista sin perder legibilidad.
- **Criterios de Aceptación:**
  - [ ] Todos los módulos y dashboards comparten un lenguaje visual homogéneo, sobrio y profesional comparable a PowerSchool SIS.
  - [ ] Se eliminan elementos visuales estridentes o de apariencia infantil en favor de una interfaz ejecutiva y académica.
  - [ ] Los contrastes de color cumplen estrictamente las pautas WCAG 2.2 AA en temas claro y oscuro.
  - [ ] La navegación móvil mantiene la misma seriedad y pulcritud institucional que la versión de escritorio.
- **Estado:** [ ] Pendiente

- **Ampliación C1.67 / T-UX-24 (2026-11-06):**
  - **AUD-NG-215 (MEDIO/P2):** concretar el contrato visual de acciones y estados. La hoja css/style.css define .btn-ima, .btn-ima-primary, .btn-ima-cancel, .btn-ima-danger y .btn-ima-ghost, pero una muestra de 12 vistas encuentra uso de btn-ima-* solo en Estudiante y Docente; los demás paneles construyen botones principalmente con clases Tailwind locales. No se garantiza jerarquía equivalente entre acciones principales/secundarias/destructivas.
  - En css/style.css existen tokens semánticos --color-success, --color-warning, --color-danger y --color-info, pero no se encontraron componentes/clases reutilizables de alertas/estados de éxito, error, advertencia, carga o ausencia de datos (por ejemplo .alert-ima, .status-badge, .btn-loading, .empty-state). js/ui-common.js mezcla alert(), Swal.fire() y HTML/Tailwind construido localmente.
  - En renderMyTicketsList (js/ui-common.js, 3918-3923) y renderAdminTicketsUI (4121-4126), el mismo estado “Información recibida” usa variantes distintas (purple-50/text-purple-700/border-purple-200 frente a purple-100/text-purple-800/border-purple-300/font-bold); “Se necesita información” también difiere por animate-pulse. Extraer un mapa semántico compartido de estados, sin cambiar las transiciones de negocio.
  - **Criterios adicionales:** (1) definir variantes compartidas primary, secondary, destructive y quiet, incluidos disabled/loading; (2) definir patrones compartidos para success/error/warning/info/loading/empty con texto, icono y semántica accesible, no solo color; (3) migrar botones equivalentes de las vistas principales al contrato común; (4) unificar el mapa de estados de tickets y otros consumidores; (5) probar consistencia visual y contraste en temas institucionales claro/oscuro; (6) coordinar TASK-492 (estados de campos), TASK-493 (modal detalle), TASK-494 (overlays) y TASK-495 (indicador de conectividad), sin absorber sus alcances.
  - **Límites:** TASK-430 mantiene el sistema visual institucional general; TASK-492 mantiene el contrato de campos de formulario; TASK-493 el modal compartido; TASK-494 capas responsivas; TASK-495 significado de estados de conectividad. Esta ampliación concreta acciones/estados transversales de T-UX-24 y no crea una tarea duplicada.

<!-- Fuente: RECUPERACION/Pendientes_RECUPERADO.md, líneas 15688-15713; clave TASK-433; asignación única: Dirección -->

---

<!-- ID: TASK-433 | Fuentes: Pendientes.md ; pendientes/Dirección/Pendientes.md -->
### [ ] [TASK-433] [P2] Gestión de Pruebas Piloto por Departamento y Grupo de Usuarios
- **Orden de Ejecución:** 20
- **Prioridad:** P2 (Media)
- **Componentes Afectados:**
  - `backend/user-service/Code.gs` (`setDepartmentPilotStatus`, `isDepartmentInPilotMode`)
  - `js/ui-common.js`
  - Hoja: `PilotosDepartamentales`
- **Subcapacidades Relacionadas:** F29-14.
- **Estado de Partida:** Ausente.
- **Dependencias Principales:** [F29-Task08], [F29-Task13], [F29-Task14], [F29-Task25].
- **Problema Detectado y Riesgos:**
  No se dispone de un mecanismo para habilitar la plataforma de forma controlada a departamentos seleccionados (ej. Secretaría o Preescolar) mientras el resto sigue en el sistema legado.
- **Requisitos Funcionales y Técnicos Convergentes:**
  1. *Administrador de pilotos y feature flags:*
     - Definir departamento, nivel educativo, grado, sección y usuarios participantes.
     - Habilitar operaciones de consulta previas a operaciones de escritura.
  2. *Aislamiento y registro de incidencias del piloto:*
     - Evitar que un proceso se ejecute simultáneamente en ambos sistemas sin sincronización explícita.
     - Formulario accesible para registrar discrepancias y retroalimentación de los usuarios piloto.
- **Criterios de Aceptación:**
  - [ ] Se habilita la operación piloto para un grupo sin afectar a los usuarios del sistema anterior.
  - [ ] Se registran y categorizan las incidencias del piloto para su resolución previa al Go-Live.
- **Estado:** [ ] Pendiente

<!-- Fuente: RECUPERACION/Pendientes_RECUPERADO.md, líneas 15784-15813; clave TASK-437; asignación única: Dirección -->

---

<!-- ID: TASK-437 | Fuentes: Pendientes.md ; pendientes/Dirección/Pendientes.md -->
### [ ] [TASK-437] [P2] Módulo de Inducción, Capacitación y Certificación de Competencias del Personal
- **Orden de Ejecución:** 19
- **Prioridad:** P2 (Media)
- **Componentes Afectados:**
  - `js/games-adapter.js`, `dashboard-direccion.html`, `dashboard-recursos-humanos.html`
  - Hoja: `CapacitacionesPersonal`, `CursosInduccion`
- **Subcapacidades Relacionadas:** F30-12.
- **Origen del Hallazgo:** `AUDITORIA_FASE_30_CONSOLIDACION_CERTIFICACION_MEJORA_CONTINUA.md` / Sección C (F30-12).
- **Problema Detectado y Riesgos:**
  La habilitación de funciones operativas críticas a nuevos empleados carece de un mecanismo formal para verificar y certificar que han comprendido las políticas institucionales de seguridad, evaluación de notas y manejo de datos confidenciales, originando errores humanos evitables.
- **Requisitos Funcionales y Técnicos Convergentes:**
  1. *Entorno institucional de capacitación guiada:*
     - Rutas formativas asignadas según departamento, cargo y permisos: lecciones, guías paso a paso, videos explicativos, simuladores interactivos de operaciones rutinarias (sin alterar datos de producción) y cuestionarios de evaluación.
     - Escenarios prácticos de errores comunes para asegurar que el personal comprende cómo actuar ante situaciones imprevistas.
  2. *Evaluaciones y umbrales de aprobación paramétricos:*
     - Evaluaciones prácticas con casos de estudio y validación de decisiones.
     - Puntaje mínimo de aprobación configurable según la criticidad del rol (`PUNTAJE_MINIMO_CERTIFICACION_ROL`).
     - Parámetro para definir si la certificación es obligatoria antes de habilitar permisos sensibles (`REQUERIR_CERTIFICACION_PREVIA_OPERACIONES_SENSIBLES`), garantizando que no se bloqueen funciones básicas de consulta.
  3. *Registro institucional de competencias:*
     - Asentar en `CapacitacionesPersonal`: usuario, curso/ruta, versión del material, fechas de inicio y término, intentos, puntaje obtenido, competencias aprobadas y capacitador responsable.
     - Emisión de constancias de certificación interna con fecha de caducidad y recertificación obligatoria ante reformas importantes de software o normativa.
- **Criterios de Aceptación:**
  - [ ] Las rutas de capacitación se asignan automáticamente según el rol del usuario creado o modificado.
  - [ ] Las simulaciones interactivas se ejecutan sin interactuar con la base de datos de producción.
  - [ ] Las certificaciones alcanzadas son consultables por Dirección y Recursos Humanos.
  - [ ] El sistema respeta la política configurable de bloqueo o advertencia ante falta de certificación previa.
- **Estado:** [ ] Pendiente

<!-- Fuente: RECUPERACION/Pendientes_RECUPERADO.md, líneas 15814-15852; clave TASK-438; asignación única: Dirección -->

---

<!-- ID: TASK-438 | Fuentes: Pendientes.md ; pendientes/Dirección/Pendientes.md -->
### [ ] [TASK-438] [P2] Protocolo Formal de Autorización de Go-Live y Certificación Departamental
- **Orden de Ejecución:** 20
- **Prioridad:** P2 (Media)
- **Componentes Afectados:**
  - `backend/user-service/Code.gs` (`submitDepartmentalCertificationApproval`, `getDepartmentalCertifications`, `generateGoLiveAcceptanceCertificate`)
  - `dashboard-direccion.html`
  - Hoja: `CertificacionesInstitucionales`, `ActasGoLive`
- **Subcapacidades Relacionadas:** F30-14, F30-15.
- **Origen del Hallazgo:** `AUDITORIA_FASE_30_CONSOLIDACION_CERTIFICACION_MEJORA_CONTINUA.md` / Sección E (CERT-01 a CERT-13) y Sección H.
- **Problema Detectado y Riesgos:**
  El paso a producción de nuevas versiones en Google Apps Script depende de despliegues manuales sin un protocolo colegiado formal que valide y documente el visto bueno de los responsables departamentales (Dirección, Secretaría, Contabilidad, Docencia, TI), arriesgando publicaciones sin consenso institucional.
- **Requisitos Funcionales y Técnicos Convergentes:**
  1. *Ficha formal y estados del despliegue:*
     - Estados: `En_Preparacion`, `En_Validacion_Tecnica`, `Pendiente_Aprobacion`, `Aprobado`, `Rechazado`, `En_Despliegue`, `En_Observacion`, `Completado`, `Revertido`.
     - Ficha de despliegue obligatoria: versión, cambios incluidos, módulos involucrados, migraciones requeridas, análisis de riesgos, resultados de pruebas automatizadas, respaldo previo verificado y estrategia de reversión.
  2. *Checklist automatizado y criterios de reversión:*
     - Validaciones previas de integridad: contratos interservicios, compatibilidad de esquemas, ejecución de suites de regresión al 100% y salud operativa.
     - Bloqueo estricto de aprobación ante fallos críticos pendientes sin excepción formal justificada y autorizada.
     - Criterios objetivos de rollback ante fallos de integridad, degradación severa de rendimiento o interrupción de autenticación.
     - Distinguir entre rollback de código, reversión de configuración y restauración de datos.
  3. *Certificación colegiada por departamento:*
     - Evaluación de las 13 áreas clave: CERT-01 a CERT-13.
     - Registro por departamento: responsable que valida, dictamen (`APROBADA`, `APROBADA_CON_OBSERVACIONES`, `RECHAZADA`), fecha, versión evaluada y pendientes menores aceptados.
     - Generación del Acta Institucional de Certificación y Autorización de Go-Live en PDF descargable con firmas formales.
     - Período de observación post-despliegue con telemetría activa.
- **Criterios de Aceptación:**
  - [ ] Cada despliegue cuenta con su ficha técnica completa y validaciones previas aprobadas.
  - [ ] No es posible autorizar un pase a producción si existen incidencias críticas bloqueantes sin excepción justificada.
  - [ ] Los líderes departamentales emiten y firman digitalmente sus certificaciones de área.
  - [ ] El procedimiento de reversión se encuentra probado y listo para actuar ante contingencias.
  - [ ] Se emite el Acta Oficial de Go-Live y se documentan los resultados del período de observación posterior.
- **Estado:** [ ] Pendiente

---

<!-- ID: TASK-445 | Fuentes: Pendientes.md ; pendientes/Dirección/Pendientes.md -->
### [ ] [TASK-445] [F31-T22] [P2] Auditoría Documental Ampliada, Trazabilidad y Métricas Operativas
- **Orden de Ejecución:** 24
- **Prioridad:** P2 (Media)
- **Componentes Afectados:**
  - `backend/user-service/Code.gs` (`getDocumentLifecycleAuditTrail`, `getDocumentOperationalMetrics`)
  - `backend/accounting-service/Code.gs`
  - Hoja: `RegistroEventosDocumentales`, `LogsSistema`
- **Subcapacidades Relacionadas:** F31-20.
- **Origen del Hallazgo:** `AUDITORIA_FASE_31_DISENADOR_UNIVERSAL_DOCUMENTOS_PLANTILLAS.md` / Sección B (F31-20) y Backlog de Implementación F31-T22.
- **Problema o Carencia:**
  La plataforma registra eventos en bitácoras generales, pero se requiere un seguimiento especializado del ciclo de vida documental que permita a los directivos reconstruir la historia completa de una plantilla, formulario o certificado desde su creación hasta su archivo.
- **Requisitos Funcionales y Técnicos Convergentes:**
  1. *Eventos del ciclo de vida registrados:*
     - Creación, modificación, duplicación, cambio de versión, envío a revisión, aprobación/rechazo, publicación, emisión individual o por lotes, descargas, impresiones, firmas registradas, consultas CUV, asociación a expedientes y archivado.
     - Metadatos: identificador del evento, usuario responsable, rol activo, fecha/hora, entidad afectada, acción, resultado, motivo y tiempo de procesamiento.
  2. *Consultas directivas e indicadores operativos:*
     - Consultar la línea de tiempo completa del ciclo de vida de un documento o plantilla.
     - Métricas operativas: total de documentos emitidos por departamento, tasa de errores en generación, documentos más solicitados y tiempos promedio de aprobación.
     - Protección inmutable de los registros contra edición manual y sanitización de datos personales en los logs técnicos.
- **Criterios de Aceptación:**
  - [ ] Cualquier acción relevante sobre una plantilla o documento genera un evento trazable en la bitácora.
  - [ ] Es posible reconstruir la secuencia histórica completa de cualquier documento mediante su identificador o CUV.
  - [ ] Los registros de auditoría no pueden ser alterados ni eliminados por usuarios ordinarios.
  - [ ] Los tableros directivos reflejan métricas verídicas de emisión y uso documental.
- **Estado:** [ ] Pendiente

---

<!-- ID: TASK-456 | Fuentes: Pendientes.md ; pendientes/Dirección/Pendientes.md -->
### [ ] [TASK-456] [P2] Implementación de políticas institucionales de conservación y disposición documental
- **Prioridad:** P2 (Media / Complementaria)
- **Orden de Ejecución:** 18 (Gobernanza de archivo, retención y disposición final)
- **Componentes Afectados:**
  - `backend/academic-service/Code.gs` (`applyDocumentRetentionPolicies`, `archiveExpiredDocuments`)
  - `backend/accounting-service/Code.gs`
  - Hoja de Cálculo: `PoliticasRetencionDocumental`, `InventarioDocumentalLegado`
- **Subcapacidades Relacionadas:** 3.10.
- **Origen del Hallazgo:** `AUDITORIA_FASE_39_DIGITALIZACION_TRANSICION.md` / Sección 4 (4.4), Matriz CAR-F39-10 y Especificación Técnica ChatGPT/Jules.
- **Problema Detectado y Riesgos:**
  Los documentos se acumulan indefinidamente en Drive sin políticas de retención, archivo pasivo o disposición final, dificultando búsquedas históricas y arriesgando incumplimientos de plazos legales de conservación de expedientes escolares.
- **Requerimientos Funcionales y Técnicos Convergentes:**
  1. *Políticas de retención y ciclo de vida documental:*
     - Auto-crear la hoja `PoliticasRetencionDocumental` (`PoliticaId`, `Departamento`, `TipoDocumental`, `Categoria`, `PlazoConservacionAnos`, `RequiereOriginalPermanente`, `NivelConfidencialidad`, `ProcedimientoDisposicion`).
     - Estados del ciclo de vida: `Activo`, `Historico`, `En_Conservacion`, `Restringido`, `Pendiente_Disposicion`, `Archivado_Permanente`.
     - Establecer cuáles documentos deben conservarse permanentemente en su formato original y cuáles pueden pasar a archivo pasivo.
  2. *Disposición controlada y auditoría:*
     - Identificar documentos que han cumplido su periodo de retención legal sin eliminarlos automáticamente; exigir autorización formal de Dirección antes de cualquier disposición o archivado definitivo.
- **Criterios de Aceptación:**
  - [ ] Permite configurar periodos de retención legal según departamento y tipo documental.
  - [ ] Identifica documentos que han alcanzado su plazo de retención para revisión directiva.
  - [ ] Bloquea eliminaciones no autorizadas de documentos bajo custodia histórica obligatoria.
  - [ ] Registra en bitácora toda acción de cambio de estado de conservación o disposición final.
- **Dependencias:** F39-Task01, F39-Task05, F39-Task10.
- **Estado:** [ ] Pendiente

<!-- Fuente: RECUPERACION/Pendientes_RECUPERADO.md, líneas 16781-16806; clave TASK-471; asignación única: Dirección -->

---

<!-- ID: TASK-492 | Fuentes: AUDITORIAS/AUDITORIA_COMPLETADAS_T-UX-18.md -->
### [ ] [TASK-492] Normalizar contrato visual y semántico de campos de formulario
- **Hallazgo de origen:** AUD-NG-208 (MEDIO/P2); coordinación con AUD-NG-211 de T-UX-19.
- **Severidad:** Media. **Objetivo:** mantener coherencia de etiquetas, controles, ayudas, validación y mensajes entre formularios de todos los dashboards.
- **Acción ejecutable:** definir clases y/o helper común para campo, label, control, ayuda, error, éxito, disabled y required; normalizar espaciado, tipografía y estados visuales; asociar cada control con label e instrucciones/errores mediante IDs, `for`, `aria-describedby` y `aria-invalid`; migrar formularios representativos sin duplicar validaciones de negocio.
- **Archivos/módulos:** `js/ui-common.js`; `css/style.css`; formularios en `student-dashboard.html`, `teacher-dashboard.html`, `dashboard-recursos-humanos.html`, `dashboard-secretaria.html` y vistas adicionales verificadas.
- **Dependencias/riesgos:** TASK-307 (validaciones de negocio), TASK-130 (ayudas), TASK-258 (accesibilidad) y TASK-430 (sistema de diseño); riesgo de romper estilos locales y duplicar mensajes.
- **Alcance:** contrato de presentación y semántica de campos; no sustituye reglas de validación de dominio ni sistema de diseño general.
- **Criterios de aceptación:** controles equivalentes comparten patrón visual; labels se asocian al control; errores y ayudas se anuncian y vinculan semánticamente; estados inválido/deshabilitado/éxito son consistentes; pruebas en formularios de varios roles, teclado y lector de pantalla.
- **Prioridad:** P2 (hallazgo AUD-NG-208). **Estado:** Pendiente de ejecución/revalidación.
- **Evidencia de cierre:** pendiente; no se encontró contrato común de campos y se observaron patrones divergentes entre vistas.

---

<!-- ID: TASK-631 | Fuentes: AUDITORIAS/AUDITORIA_COMPLETADAS_TAREA-F7-IMP-24.md -->
### [ ] [TASK-631] Aislar preferencias por usuario y proteger eventos críticos
- **Hallazgos:** AUD-NG-275 y AUD-NG-276.
- **Severidad/Prioridad:** MEDIO/P2 y ALTO/P1.
- **Objetivo:** mantener preferencias personales sin contaminación entre cuentas ni ocultación de alertas esenciales.
- **Acción:** asociar preferencias a identidad autenticada; restaurarlas al cargar y tras cada render; exponer reset; definir categorías permitidas; mantener cancelaciones y cambios críticos identificables.
- **Archivos:** teacher-dashboard.html, student-dashboard.html, js/teacher.js, js/student.js y módulo de preferencias si se separa.
- **Dependencias:** TASK-630, AUD-NG-252 y AUD-NG-161.
- **Criterios:** dos cuentas en el mismo navegador conservan estados independientes; preferencias sobreviven a recarga/refresh; reset restaura valores iniciales; eventos críticos permanecen visibles/identificables; ningún toggle modifica registros académicos.
- **Estado:** Pendiente.

---

<!-- ID: AUD-NG-015 | Fuentes: Pendientes.md -->
### [ ] [AUD-NG-015] Corregir tarifas faltantes y deduplicación de generación masiva de cargos
- **Origen del Hallazgo:** Auditoria.txt / AUD-NG-015
- **Severidad/Clasificación:** Crítico
- **Archivos Involucrados:** backend/accounting-service/Code.gs
- **Dependencias Expuestas:** previewBatchMonthlyCharges, generateBatchMonthlyCharges, TarifasPlanPago, ConceptosCobro, CargosEstudiante, applyApprovedScholarshipsToCharges
- **Descripción del Alcance:** Eliminar la tarifa fallback fija de L 1,200 y bloquear o excluir con incidencia los estudiantes sin tarifa autorizada. La clave de deduplicación debe incluir estudiante, concepto, período y año lectivo; registrar fallos de aplicación de becas y no informar éxito total si hubo errores.
- **Criterios de Aceptación:** Estudiantes sin tarifa no generan cargos; dos conceptos distintos del mismo estudiante/período se procesan independientemente; reintentos no duplican el mismo concepto; descuentos aprobados quedan reflejados o el lote reporta fallo explícito.
- **Estado:** [ ] Pendiente

---

<!-- ID: AUD-NG-018 | Fuentes: Pendientes.md -->
### [ ] [AUD-NG-018] Preservar historial inmutable de asignaciones docentes a áreas académicas
- **Origen del Hallazgo:** Auditoria.txt / AUD-NG-018
- **Severidad/Clasificación:** Alto
- **Archivos Involucrados:** backend/academic-service/Code.gs
- **Dependencias Expuestas:** assignTeacherToAcademicArea, DocentesAreasAcademicas, CoordinacionesArea
- **Descripción del Alcance:** Cuando cambien fechas, tipo de vinculación o coordinación, cerrar la asignación anterior y crear una nueva versión vinculada, sin sobrescribir los datos históricos.
- **Criterios de Aceptación:** Las rotaciones conservan registros anteriores inmutables; consultas históricas reconstruyen titularidad y vigencias; no existen asignaciones activas duplicadas.
- **Estado:** [ ] Pendiente

---

<!-- ID: AUD-NG-019 | Fuentes: Pendientes.md -->
### [ ] [AUD-NG-019] Calcular nómina por intervalos cuando cambian contratos dentro del período
- **Origen del Hallazgo:** Auditoria.txt / AUD-NG-019
- **Severidad/Clasificación:** Alto
- **Archivos Involucrados:** backend/accounting-service/Code.gs
- **Dependencias Expuestas:** calculatePayrollPeriod, ContratosLaborales, ExpedientesLaborales, PlanillasNomenclatura
- **Descripción del Alcance:** Diferenciar contratos realmente superpuestos de contratos sucesivos no superpuestos. Calcular cada intervalo del período con su salario, jornada y condiciones vigentes y sumar los importes proporcionales.
- **Criterios de Aceptación:** Un cambio salarial a mitad de mes aplica ambos salarios por sus días; contratos superpuestos siguen generando incidencia; no se excluyen contratos sucesivos válidos.
- **Estado:** [ ] Pendiente

---

<!-- ID: AUD-NG-020 | Fuentes: Pendientes.md -->
### [ ] [AUD-NG-020] Integrar el tratamiento remunerativo de incapacidades médicas en nómina
- **Origen del Hallazgo:** Auditoria.txt / AUD-NG-020
- **Severidad/Clasificación:** Alto
- **Archivos Involucrados:** backend/accounting-service/Code.gs
- **Dependencias Expuestas:** calculatePayrollPeriod, IncapacidadesMedicas, PlanillasNomenclatura, incUpdates
- **Descripción del Alcance:** Calcular y registrar el tratamiento salarial/subsidio aplicable a incapacidades aprobadas por IHSS. No marcar una incapacidad como procesada si no se ha aplicado el importe o tratamiento correspondiente.
- **Criterios de Aceptación:** Las incapacidades no se descuentan como ausencias injustificadas; los importes se calculan con reglas vigentes; cada registro se procesa una sola vez y conserva su referencia de origen.
- **Estado:** [ ] Pendiente

---

<!-- ID: AUD-NG-075 | Fuentes: Pendientes.md -->
### [ ] [AUD-NG-075] Incorporar todas las dimensiones de partición en el catálogo y en su clave de resolución
- **Origen del Hallazgo:** Auditoria.txt / AUD-NG-075 (TASK-046 / F23-Task03)
- **Severidad/Clasificación:** Alto
- **Archivos Involucrados:** backend/user-service/Code.gs; backend/academic-service/Code.gs; backend/accounting-service/Code.gs; esquema CatalogoSpreadsheets
- **Dependencias Expuestas:** dominioArea, anoLectivo, departamento, servicio, cuenta propietaria, tipo de información y área de responsabilidad.
- **Descripción del Alcance:** Ampliar el modelo y la clave de búsqueda para resolver particiones por dominio, ciclo lectivo, departamento, área, servicio, tipo de información y cuenta propietaria, con reglas explícitas de precedencia y unicidad.
- **Criterios de Aceptación:** Dos fuentes con mismo dominio/año y diferente departamento/servicio se resuelven por contexto sin colisión; las claves únicas y reglas de fallback están documentadas; el catálogo conserva propietario y servicio responsable.
- **Estado:** [ ] Pendiente

---

<!-- ID: AUD-NG-129 | Fuentes: Pendientes.md -->
### [ ] [AUD-NG-129] Unificar matrícula y rematrícula con cargos financieros por periodo
- **Origen del Hallazgo:** Auditoria.txt / AUD-NG-129 (REQ-EXP-009).
- **Severidad/Clasificación:** Alto
- **Archivos Involucrados:** `backend/academic-service/Code.gs`; `backend/accounting-service/Code.gs`; `js/secretary.js`.
- **Dependencias Expuestas:** `convertAdmissionToStudent`, `registerStudentEnrollment`, `createStudentEnrollment`, `renewStudentEnrollment`, `Matriculas`, `CargosEstudiante`.
- **Descripción del Alcance:** Existen dos flujos distintos: la conversión de admisión llama a `registerStudentEnrollment` y genera cargos, mientras `createStudentEnrollment`/`renewStudentEnrollment` crea la matrícula con bloqueo e idempotencia pero no genera ni vincula el cargo del periodo. El control de duplicados del flujo antiguo usa estudiante+concepto, sin periodo como clave explícita. Unificar los flujos y asociar cada matrícula con sus cargos del mismo periodo lectivo.
- **Criterios de Aceptación:** Matrícula inicial y rematrícula generan una sola matrícula por estudiante/periodo y los cargos correspondientes; clave única por estudiante+periodo+concepto; las operaciones repetidas son idempotentes; becas, descuentos y exoneraciones se aplican según vigencia; historial por periodo permanece consultable; pruebas de reintento y concurrencia.

- **Ampliación C1.33 / FASE2-05 (2026-11-05):** `registerStudentEnrollment` (Academic, 12670) no adquiere LockService ni reserva una clave idempotente. Primero actualiza/añade la fila de `Matriculas` y después añade cargos a `CargosEstudiante` mediante escrituras separadas, sin rollback ni estado recuperable si falla una escritura intermedia. `existingCargos` se lee una sola vez antes del bucle y no se actualiza tras cada alta, por lo que conceptos repetidos en el mismo payload pueden superar la deduplicación local. La ruta nueva `createStudentEnrollment` sí bloquea, pero admite `skipLock`; doPost solo lo elimina cuando `isInternalCall` es falso y no acredita que esa bandera provenga de una llamada interna autenticada.
- **Criterios adicionales:** unificar ambas rutas en una operación atómica o con saga/reanudación explícita; bloquear la lectura-verificación-escritura de matrícula y cargos; reservar clave idempotente por estudiante+periodo+concepto; evitar duplicados dentro del mismo lote; no aceptar banderas de omisión de lock desde payload externo; reconciliar fallos parciales sin duplicar matrícula ni cargos.

- **Estado:** [ ] Pendiente

---

<!-- ID: AUD-NG-132 | Fuentes: Pendientes.md -->
### [ ] [AUD-NG-132] Corregir el motor de cargos mensuales y su deduplicación por periodo
- **Origen del Hallazgo:** Auditoria.txt / AUD-NG-132 (REQ-EXP-010).
- **Severidad/Clasificación:** Crítico
- **Archivos Involucrados:** `backend/accounting-service/Code.gs`; pruebas de generación de cargos.
- **Dependencias Expuestas:** `previewBatchMonthlyCharges`, `generateBatchMonthlyCharges`, `Matriculas`, `CargosEstudiante`, tarifas y conceptos.
- **Descripción del Alcance:** El preview interpreta columnas de `Matriculas` con índices que no corresponden al esquema escrito por `registerStudentEnrollment`/`createStudentEnrollment` (grado, sección, periodo, tipo, estado, beca y observaciones). Además, la deduplicación añade claves genéricas estudiante+concepto y estudiante+mes+año, bloqueando periodos futuros o conceptos distintos del mismo mes. Cuando no encuentra tarifa, aplica un monto fijo de 1200 en vez de reportar falta de configuración. Corregir el mapeo por encabezados y usar una única clave estudiante+concepto+mes+año; no inventar tarifas.
- **Criterios de Aceptación:** El preview usa campos correctos; puede generar el mismo concepto para meses distintos y varios conceptos para un mismo mes; no duplica el mismo concepto/periodo; tarifa faltante produce error/pendiente sin cargo; pruebas con varios grados, secciones, años y conceptos.
- **Estado:** [ ] Pendiente

---

<!-- ID: AUD-NG-140 | Fuentes: Pendientes.md -->
### [ ] [AUD-NG-140] Vincular autoservicio, asistencia y recibos de nómina a la identidad verificada
- **Origen del Hallazgo:** Auditoria.txt / AUD-NG-140 (REQ-EXP-014).
- **Severidad/Clasificación:** Crítico
- **Archivos Involucrados:** `backend/accounting-service/Code.gs`.
- **Dependencias Expuestas:** `getEmployeeSelfServicePortal`, `recordStaffCheckIn`, `getStaffAttendanceLogs`, `generatePayrollReceiptPDF`, `_verifiedUserId`, `_verifiedRole`.
- **Descripción del Alcance:** El autoservicio confía en `authRole` y `authUserId` del cliente; el registro de asistencia acepta `empleadoId` y horario esperado desde payload; el empleado puede consultar logs sin indicar empleadoId y obtener registros globales; la generación de recibo acepta empleadoId arbitrario y devuelve una URL de PDF no generada.
- **Criterios de Aceptación:** Empleado usa siempre `_verifiedUserId`; el horario esperado proviene de contrato/horario autorizado; solo RRHH/roles autorizados registran asistencia de terceros; el empleado solo consulta su asistencia/boleta; PDF real y privado; pruebas IDOR y suplantación.
- **Estado:** [ ] Pendiente

---

<!-- ID: T-UX-12 | Fuentes: completadas.md -->
### [ ] [T-UX-12] Consolidar los paneles de control por rol y departamento
- **Origen del Hallazgo:** Auditoría de la Fase 3, octubre de 2026 (AUDITORIA_FASE3_EXPERIENCIA_USUARIO_NAVEGACION.md - Área 2)
- **Severidad/Clasificación:** Alto
- **Archivos Involucrados:** `js/student.js`, `js/teacher.js`, `js/accounting.js`
- **Dependencias Expuestas:** Paneles de estudiantes, docentes, dirección, recursos humanos y contabilidad; servicios de datos y permisos asociados.
- **Descripción del Alcance:**
  1. Definir el contenido funcional de cada panel según las responsabilidades reales del rol.
  2. Mostrar información prioritaria, tareas pendientes, avisos y accesos frecuentes.
  3. Diferenciar los indicadores de resumen de las listas operativas.
  4. Evitar mostrar datos irrelevantes, duplicados o desactualizados como si fueran actuales.
  5. Permitir acceso directo a las tareas que requieren atención.
  6. Respetar permisos tanto en la interfaz como en los servicios.
- **Criterios de Aceptación:**
  - Cada rol existente tiene un panel definido y comprobado.
  - Los indicadores corresponden al contexto, período y usuario correctos.
  - Los datos no disponibles se distinguen de los valores cero.
  - Los accesos conducen a operaciones reales.
  - Las acciones visibles respetan los permisos efectivos.
- **Estado:** Pendiente

---

<!-- ID: T-UX-15 | Fuentes: completadas.md -->
### [ ] [T-UX-15] Implementar filtros avanzados, vistas guardadas y paginación coherente
- **Origen del Hallazgo:** Auditoría de la Fase 3, octubre de 2026 (AUDITORIA_FASE3_EXPERIENCIA_USUARIO_NAVEGACION.md - Área 5)
- **Severidad/Clasificación:** Alto
- **Archivos Involucrados:** `js/ui-common.js`
- **Dependencias Expuestas:** Tablas, listas, filtros, ordenamiento, paginación y preferencias de usuario.
- **Descripción del Alcance:**
  1. Permitir filtrar registros mediante campos pertinentes a cada módulo.
  2. Combinar varios filtros con resultados predecibles.
  3. Mostrar los filtros activos y permitir eliminarlos.
  4. Mantener los filtros durante la paginación y la navegación al detalle.
  5. Guardar vistas reutilizables cuando exista una necesidad real.
  6. Diferenciar vistas personales de vistas compartidas.
- **Criterios de Aceptación:**
  - La combinación de filtros produce resultados correctos.
  - El usuario puede eliminar filtros individualmente y restablecer la consulta.
  - La paginación conserva los criterios activos.
  - El ordenamiento es coherente con los datos mostrados.
- **Estado:** Pendiente

---

<!-- ID: T-UX-25 | Fuentes: completadas.md -->
### [ ] [T-UX-25] Incorporar preferencias de usuario y personalización controlada de vistas
- **Origen del Hallazgo:** Auditoría de la Fase 3, octubre de 2026 (AUDITORIA_FASE3_EXPERIENCIA_USUARIO_NAVEGACION.md - Área 20)
- **Severidad/Clasificación:** Medio
- **Archivos Involucrados:** `js/ui-common.js`, `backend/user-service/Code.gs`
- **Dependencias Expuestas:** Paneles de control, vistas guardadas, menús, preferencias y almacenamiento de configuración por usuario.
- **Descripción del Alcance:**
  1. Permitir guardar preferencias útiles de visualización y consulta.
  2. Mantener los valores predeterminados definidos por la institución.
  3. Permitir restablecer preferencias.
- **Criterios de Aceptación:**
  - Las preferencias se guardan en el ámbito anunciado.
  - Las vistas personalizadas se restauran correctamente.
- **Estado:** Pendiente

---

<!-- ID: TAREA-F4-P1-07 | Fuentes: completadas.md -->
### [ ] [TAREA-F4-P1-07] Implementar gestión institucional de roles, cargos, departamentos y asignaciones
- **Origen del Hallazgo:** Auditoría de la Fase 4 (AUDITORIA_FASE4_IDENTIDAD_PERMISOS_GOBIERNO.md)
- **Severidad/Clasificación:** Alto · Identidad · Backend
- **Archivos Involucrados:** `backend/user-service/Code.gs`, `backend/academic-service/Code.gs`
- **Estado:** Pendiente

---

<!-- ID: TASK-044 | Fuentes: Pendientes.md ; pendientes/Dirección/Pendientes.md -->
### [ ] [TASK-044] TAREAS DERIVADAS DE AUDITORÍA — TASK-044 Y TASK-045 / FASE 23 (2026-11-04)

**Otros títulos originales:**
- [P0] [Motor de Workflows - Integridad Transaccional, Candados Atómicos y Autorización de Decisiones]
- **Componentes Afectados:**
  - `backend/user-service/Code.gs`
  - `js/api.js`
- **Dependencias Expuestas:** `SolicitudesTramites`, `RevisionesDecisionesTramite`, `FlujosAprobacion`, `LockService`.
- **Capacidades Relacionadas:** F23-002, F23-013, F23-014.
- **Problema Detectado:**
  El procesamiento de decisiones de aprobación presenta riesgos de concurrencia y validación insuficiente de las transiciones. Dos revisores podrían intentar resolver simultáneamente una misma etapa. Además, la secuencia de aprobación no debe depender de información proporcionada por el cliente, como `siguienteAsignadoA` o `nuevoEstadoSolicitud`.
- **Requisitos Funcionales:**
  1. Proteger las decisiones mediante mecanismos de exclusión mutua adecuados (`LockService.getScriptLock()`) para evitar que dos operaciones modifiquen simultáneamente el mismo trámite.
  2. Antes de aceptar una decisión, recuperar el estado actual de la solicitud y comprobar que coincide con el estado esperado.
  3. Identificar la etapa activa a partir de la definición y el estado persistido del workflow.
  4. Validar que el usuario autenticado sea el responsable autorizado de esa etapa o pertenezca al grupo de aprobadores habilitados.
  5. Comprobar que la operación solicitada esté permitida para el estado actual.
  6. Impedir que el cliente determine libremente el siguiente responsable, la siguiente etapa o el estado final.
  7. Calcular las transiciones en el servidor utilizando la definición vigente del flujo.
  8. Impedir que una decisión se aplique dos veces.
  9. Registrar la decisión y actualizar el estado de la solicitud de manera consistente.
  10. Registrar quién realizó la operación, cuándo, sobre qué etapa y cuál fue su resultado.
  11. Diferenciar los errores de autorización, conflicto de estado, duplicación y fallo de almacenamiento.
- **Comportamiento Esperado:**
  Cuando dos revisores intenten resolver la misma solicitud simultáneamente, solamente una operación válida podrá completar la transición. La segunda deberá recibir un resultado de conflicto o de etapa ya resuelta, sin sobrescribir la decisión anterior.
  Una solicitud no podrá avanzar si el usuario no tiene autorización, si la etapa no está activa o si no se cumplen sus precondiciones.
- **Criterios de Aceptación:**
  - [ ] Ejecutar dos decisiones simultáneas sobre una misma etapa y comprobar que solamente una se registra como decisión efectiva.
  - [ ] Intentar aprobar una etapa desde una cuenta sin autorización y verificar su rechazo.
  - [ ] Manipular los parámetros de siguiente responsable y siguiente estado desde el cliente y comprobar que son ignorados o rechazados en favor de la definición del servidor.
  - [ ] Intentar aprobar una etapa que ya fue resuelta y comprobar detección de conflicto.
  - [ ] Intentar avanzar una solicitud desde un estado anterior inválido.
  - [ ] Simular un error durante el almacenamiento y comprobar que no se produce una transición inconsistente.
  - [ ] Verificar que las decisiones válidas conservan su historial inalterado.
- **Estado:** Pendiente

### [AUD-NG-066] Autorizar cada decisión según identidad autenticada y etapa activa
- **Origen del Hallazgo:** Auditoria.txt / AUD-NG-066 (TASK-044 / F23-Task01)
- **Severidad/Clasificación:** Crítico
- **Archivos Involucrados:** backend/user-service/Code.gs; modelo de workflows; SolicitudesTramites; FlujosAprobacion
- **Dependencias Expuestas:** processWorkflowDecision, validateRolePermission, _verifiedUserId, _verifiedRole, revisorId, etapaNombre y pasosEtapas.
- **Descripción del Alcance:** Derivar el actor exclusivamente de la sesión verificada; ignorar/rechazar revisorId enviado por cliente cuando no coincida con _verifiedUserId. Resolver en servidor la etapa activa desde la solicitud y la definición vigente del flujo; comprobar que el actor o su grupo tiene asignación y permiso para esa etapa antes de aceptar la decisión.
- **Criterios de Aceptación:** Manipular revisorId no altera al actor registrado; un usuario con rol general pero no asignado a la etapa es rechazado; una etapa arbitraria enviada por cliente se ignora/rechaza; delegaciones válidas quedan trazadas con titular y ejecutor.
- **Estado:** [ ] Pendiente

### [AUD-NG-067] Aplicar una máquina de estados estricta basada en la definición persistida del workflow
- **Origen del Hallazgo:** Auditoria.txt / AUD-NG-067 (TASK-044 / F23-Task01)
- **Archivos Involucrados:** backend/user-service/Code.gs; FlujosAprobacion; SolicitudesTramites; RevisionesDecisionesTramite
- **Dependencias Expuestas:** processWorkflowDecision, FlujosAprobacion.pasosEtapas, estado actual, accionDecision y siguiente etapa.
- **Descripción del Alcance:** Cargar la definición publicada del workflow y calcular la etapa activa, acciones permitidas, grupos autorizados y siguiente responsable en servidor. Validar estado de origen y transición permitida con lista cerrada; rechazar acciones desconocidas y duplicidades de todas las decisiones que afecten una etapa, no solo APROBADO/RECHAZADO.
- **Criterios de Aceptación:** Una acción no definida se rechaza sin escritura; cada transición coincide con el flujo publicado; una etapa no activa no puede resolverse; se bloquean duplicados de aprobación, rechazo, devolución y derivación conforme a política.

### [AUD-NG-068] Hacer consistente la escritura del historial y el estado de cada trámite
- **Origen del Hallazgo:** Auditoria.txt / AUD-NG-068 (TASK-044 / F23-Task01)
- **Archivos Involucrados:** backend/user-service/Code.gs; SolicitudesTramites; RevisionesDecisionesTramite
- **Dependencias Expuestas:** processWorkflowDecision, LockService, appendRow, setValue y getWorkflowHistory.
- **Descripción del Alcance:** Diseñar persistencia recuperable para que la decisión y el nuevo estado del trámite se confirmen como una sola operación lógica. Incorporar identificador de operación y estado de procesamiento, validar las escrituras y permitir recuperación segura ante fallo parcial sin duplicar ni perder el historial.
- **Criterios de Aceptación:** Fallos inducidos después de cada escritura no dejan estado contradictorio; cada decisión confirmada tiene exactamente una actualización de estado; la recuperación puede completarse de forma idempotente; el historial conserva las decisiones anteriores.

### [AUD-NG-069] Propagar claves idempotentes en fetchApi y controlar los reintentos de POST
- **Origen del Hallazgo:** Auditoria.txt / AUD-NG-069 (TASK-045 / F23-Task02)
- **Archivos Involucrados:** js/api.js; backend/user-service/Code.gs; servicios consumidores de fetchApi
- **Dependencias Expuestas:** fetchApi, MAX_RETRIES, idempotencyToken, idempotencyKey, checkAndRegisterIdempotencyKey y saveIdempotentResult.
- **Descripción del Alcance:** Generar y conservar una clave de operación por solicitud lógica, propagarla en todos los intentos y exigirla para operaciones mutables/reintentables. Desactivar reintentos automáticos para acciones no idempotentes que no tengan clave o protocolo seguro de repetición. Mantener la misma clave en reintentos y una clave nueva para una operación legítima diferente.
- **Criterios de Aceptación:** Una respuesta perdida después de una escritura no crea un segundo registro; todos los reintentos de una operación usan la misma clave; una nueva acción del usuario usa otra clave; las mutaciones sin protección no se reintentan automáticamente.

### [AUD-NG-070] Persistir resultados idempotentes más allá del caché temporal
- **Origen del Hallazgo:** Auditoria.txt / AUD-NG-070 (TASK-045 / F23-Task02)
- **Severidad/Clasificación:** Alto
- **Archivos Involucrados:** backend/user-service/Code.gs; almacenamiento persistente de operaciones
- **Dependencias Expuestas:** CacheService, checkAndRegisterIdempotencyKey, saveIdempotentResult y doPost.
- **Descripción del Alcance:** Crear un registro durable de claves, usuario, acción, firma del payload, estado de operación, resultado y fecha de expiración/retención. Mantener CacheService solo como optimización, no como fuente de verdad. Definir política de retención, recuperación y manejo de resultados grandes o fallos de almacenamiento.
- **Criterios de Aceptación:** La misma clave recupera el resultado tras expirar/evictar caché y tras reinicio del servicio; claves con payload distinto se rechazan; los errores al guardar la clave no permiten reportar una operación como protegida; la retención se aplica según política auditable.
- **Ampliación C1.26 / FASE2-T19:** La ruta `createInstitutionalServiceRequest` utiliza `COMM_REQ_<idempotencyKey>` durante 600 segundos y devuelve el resultado cacheado sin comparar el usuario verificado, la acción ni una firma del payload. La clave no contiene identidad y `CacheService.getScriptCache()` es compartida por el proyecto; reutilizar la misma clave desde otra cuenta puede devolver la solicitud y los datos del primer solicitante. El registro durable y la protección idempotente deben abarcar esta ruta, no solo `IDEM_USER_<action>_<token>`.
- **Criterios adicionales:** Reutilizar una clave desde otro usuario nunca devuelve el resultado ajeno; misma identidad y payload idéntico devuelve el resultado idempotente; payload o identidad distintos se rechazan. Las claves, firmas y registros persistentes deben incluir la identidad verificada y conservar el aislamiento entre servicios/acciones.

### [AUD-NG-071] Reservar claves idempotentes de forma atómica antes de ejecutar operaciones
- **Origen del Hallazgo:** Auditoria.txt / AUD-NG-071 (TASK-045 / F23-Task02)
- **Dependencias Expuestas:** checkAndRegisterIdempotencyKey, saveIdempotentResult, LockService y doPost.
- **Descripción del Alcance:** Implementar reserva atómica por clave con estados EnProceso/Completada/Fallida y exclusión mutua o restricción única persistente. Si otra petición llega mientras la primera está en proceso, devolver estado recuperable o esperar el resultado, sin ejecutar la operación otra vez.
- **Criterios de Aceptación:** Dos solicitudes simultáneas con la misma clave producen un único efecto; una clave reservada no se puede ejecutar por segunda vez; fallos permiten recuperación controlada; la clave queda vinculada al resultado definitivo.

### [AUD-NG-072] Implementar pruebas funcionales de concurrencia, autorización e idempotencia
- **Origen del Hallazgo:** Auditoria.txt / AUD-NG-072 (TASK-044 y TASK-045 / F23-Task01 y F23-Task02)
- **Archivos Involucrados:** tests/regression/academic-grading-suite.js; backend/user-service/Code.gs; js/api.js; entorno de pruebas aislado
- **Dependencias Expuestas:** processWorkflowDecision, fetchApi, checkAndRegisterIdempotencyKey, saveIdempotentResult, SolicitudesTramites y RevisionesDecisionesTramite.
- **Descripción del Alcance:** Sustituir las aserciones de presencia textual por pruebas reales con persistencia aislada. Cubrir revisor manipulado, etapa incorrecta, transición inválida, dos decisiones simultáneas, fallo entre escrituras, POST repetido tras pérdida de respuesta, clave con payload diferente, expiración de caché y solicitudes interservicio.
- **Criterios de Aceptación:** Las pruebas invocan las operaciones reales y verifican filas/resultados; una sola decisión gana la concurrencia; no hay efectos duplicados en reintentos; las operaciones no autorizadas se rechazan; cada criterio produce evidencia reproducible.

<!-- Fuente: RECUPERACION/Pendientes_RECUPERADO.md, líneas 2319-2352; clave TASK-045; asignación única: Dirección -->

---

<!-- ID: TASK-045 | Fuentes: Pendientes.md ; pendientes/Dirección/Pendientes.md -->
### [ ] [TASK-045] [P0] [Motor de Workflows - Idempotencia de Solicitudes, Decisiones y Operaciones Institucionales]
- **Componentes Afectados:**
  - `backend/user-service/Code.gs`
  - `js/api.js`
- **Dependencias Expuestas:** `SolicitudesTramites`, `RevisionesDecisionesTramite`, `F23-Task01`.
- **Capacidades Relacionadas:** F23-002, F23-015, F23-025, F23-026.
- **Problema Detectado:**
  El envío repetido de formularios y las llamadas interservicio pueden generar registros, tareas, decisiones o acciones duplicadas cuando el usuario vuelve a pulsar un botón, pierde la conexión o el servicio no responde a tiempo.
- **Requisitos Funcionales:**
  1. Incorporar identificadores únicos de operación para las solicitudes que puedan repetirse.
  2. Admitir una clave de idempotencia (`Idempotency-Key`) en los envíos de trámites y operaciones sensibles.
  3. Asociar cada clave con el usuario, tipo de operación y resultado correspondiente.
  4. Guardar la relación entre la clave y el registro generado.
  5. Si se recibe nuevamente la misma operación, devolver el resultado previamente registrado cuando corresponda.
  6. Rechazar la reutilización de una misma clave con un contenido diferente.
  7. Controlar la duplicación en las decisiones de aprobación.
  8. Extender la protección a las acciones interservicio y a las tareas generadas por eventos.
  9. Evitar que un reintento genere varias notificaciones o ejecute dos veces una operación externa.
  10. Definir una política de conservación de las claves procesadas.
- **Comportamiento Esperado:**
  Una operación debe poder repetirse técnicamente sin que sus efectos se dupliquen.
  Si una solicitud se registra correctamente, pero la respuesta no llega al navegador, el siguiente intento debe recuperar el resultado original y no crear otro trámite.
- **Criterios de Aceptación:**
  - [ ] Enviar dos veces el mismo formulario con idéntica clave y verificar que se devuelve el mismo resultado sin duplicar registros.
  - [ ] Repetir una solicitud después de una interrupción de conexión y recuperar el trámite original.
  - [ ] Reutilizar una clave con contenido diferente y verificar el rechazo de la solicitud.
  - [ ] Repetir una decisión de aprobación y comprobar que no se duplica la transición.
  - [ ] Repetir una solicitud interservicio y verificar la idempotencia.
  - [ ] Comprobar que no se generan registros ni acciones duplicadas.
  - [ ] Verificar que dos solicitudes legítimas diferentes puedan procesarse independientemente.
- **Estado:** Pendiente

<!-- Fuente: RECUPERACION/Pendientes_RECUPERADO.md, líneas 2397-2443; clave TASK-047; asignación única: Dirección -->

---

<!-- ID: TASK-047 | Fuentes: Pendientes.md ; pendientes/Dirección/Pendientes.md -->
### [ ] [TASK-047] TAREAS DERIVADAS DE AUDITORÍA — TASK-047 (HALLAZGO ADICIONAL), TASK-048 Y TASK-049 / FASE 23 (2026-11-04)

**Otros títulos originales:**
- [P0] [Arquitectura Distribuida - Catálogo Institucional de Cuentas, Servicios y Permisos Distribuidos]
- **Componentes Afectados:**
  - `backend/developer-service/Code.gs`
  - `backend/accounting-service/Code.gs`
  - `backend/user-service/Code.gs`
- **Dependencias Expuestas:** `CatalogoServicios`, `CatalogoSpreadsheets`, `F23-Task03`.
- **Capacidades Relacionadas:** F23-023, F23-024, F23-008, F23-009.
- **Problema Detectado:**
  El catálogo actual de Spreadsheets y el registro de microservicios no proporcionan todavía una administración suficientemente completa de los servicios distribuidos y sus cuentas propietarias. La plataforma debe admitir que diferentes roles o departamentos administren sus propios proyectos Apps Script y sus propios archivos de almacenamiento, sin que la división de cuentas impida la comunicación institucional.
- **Requisitos Funcionales:**
  1. Ampliar el catálogo central para registrar cada servicio distribuido.
  2. Asociar cada servicio con:
     - Identificador único.
     - Departamento o rol responsable.
     - Cuenta propietaria.
     - Proyecto Apps Script.
     - Endpoint desplegado.
     - Spreadsheet asociado.
     - Dominio de datos.
     - Estado de disponibilidad.
     - Versión del contrato de comunicación.
     - Permisos concedidos.
  3. Permitir que un responsable registre un servicio bajo su cuenta de Google.
  4. Permitir que un responsable registre o asocie su Spreadsheet.
  5. Establecer relaciones entre los servicios y los recursos que administran.
  6. Permitir registrar varios servicios para un mismo departamento cuando sea necesario.
  7. Permitir que un servicio atienda más de un dominio de información si sus permisos lo autorizan.
  8. Incorporar estados de servicio: registrado, activo, degradado, desconectado, suspendido y retirado.
  9. Permitir habilitar y revocar relaciones de comunicación.
  10. Conservar el historial de cambios de propietario, responsables, endpoints y recursos.
  11. Detectar servicios duplicados y registros huérfanos.
- **Comportamiento Esperado:**
  El servicio central debe conocer qué servicios existen, quién los administra, qué datos gestionan y qué operaciones están autorizados a realizar.
  La incorporación de un nuevo departamento no debe requerir reconstruir manualmente la arquitectura de comunicación.
- **Criterios de Aceptación:**
  - [ ] Registrar servicios de al menos dos cuentas de Google diferentes.
  - [ ] Asociar a cada servicio su propio Spreadsheet.
  - [ ] Consultar los servicios registrados desde el servicio central.
  - [ ] Revocar un servicio sin eliminar su historial ni romper auditorías.
  - [ ] Cambiar el responsable y verificar las autorizaciones actualizadas.
  - [ ] Intentar registrar un servicio duplicado y verificar su rechazo.
  - [ ] Consultar un servicio suspendido y comprobar que se bloquean peticiones.
  - [ ] Comprobar que los permisos de almacenamiento y los privilegios institucionales se administran por separado.
- **Estado:** Pendiente

### [AUD-NG-082] Exigir sesión autenticada en el plano de control y rechazar roles declarados por el cliente
- **Origen del Hallazgo:** Auditoria.txt / AUD-NG-082 (TASK-047 / F23-Task04)
- **Severidad/Clasificación:** Crítico
- **Archivos Involucrados:** backend/developer-service/Code.gs
- **Dependencias Expuestas:** doPost, ROLE_PERMISSIONS, authRole, verifySessionToken, registerServiceInstance y updateServiceStatus.
- **Descripción del Alcance:** Eliminar el fallback que utiliza payload.authRole cuando no existe token. Resolver el rol exclusivamente a partir de una sesión firmada y vigente, y rechazar solicitudes sin credenciales verificables. Aplicar el mismo principio a todas las acciones del plano de control y registrar el actor autenticado.
- **Criterios de Aceptación:** Un payload sin token se rechaza aunque declare Administrador; un token inválido/expirado se rechaza; el rol efectivo proviene de claims verificados; las acciones administrativas quedan cubiertas por pruebas RBAC negativas y positivas.
- **Ampliación C1.293:** confirmado en DEVELOPER:145–180; si no llega token, doPost toma payload.authRole. ROLE_PERMISSIONS[Administrador] es ["*"], por lo que authRole=Administrador elude la sesión. No se verificó deployment activo.
- **Estado:** [ ] Pendiente

### [AUD-NG-083] Integrar la verificación HMAC en el tráfico real de todos los microservicios
- **Origen del Hallazgo:** Auditoria.txt / AUD-NG-083 (TASK-048 / F23-Task05)
- **Archivos Involucrados:** backend/user-service/Code.gs; backend/academic-service/Code.gs; backend/accounting-service/Code.gs; backend/developer-service/Code.gs
- **Dependencias Expuestas:** createInterServiceEnvelope, verifyInterServiceEnvelope, doPost, UrlFetchApp/fetch y endpoints interservicio.
- **Descripción del Alcance:** Definir un punto único de creación y verificación de sobres e integrarlo en todas las llamadas entre servicios. Los endpoints que admitan tráfico interservicio deben exigir el sobre validado antes del despacho; las llamadas de salida deben firmar el payload y enviar el sobre completo.
- **Criterios de Aceptación:** Toda llamada entre servicios pasa por el protocolo; los endpoints rechazan sobres ausentes o inválidos; las llamadas internas existentes quedan migradas; la prueba de integración acredita comunicación entre despliegues separados.
- **Ampliación C1.29 / FASE2-01:** En USER, ACCOUNTING, ACADEMIC y DEVELOPER, `createInterServiceEnvelope` y `verifyInterServiceEnvelope` solo aparecen como definiciones, sin consumidores. Los doPost de USER, ACCOUNTING, ACADEMIC, TASK, EXAM y DEVELOPER no llaman a `verifyInterServiceEnvelope` antes del despacho. La única salida server-to-server observada, `delegateToTaskService`, envía `{action,payload}` JSON plano por UrlFetchApp.fetch, sin sobre firmado.
- **Criterios adicionales:** Migrar la ruta USER→TASK y todas las llamadas interservicio a un helper común; exigir sobre válido en el receptor antes del despacho; comprobar con dos deployments/proyectos reales que una llamada sin firma, con firma alterada o destino incorrecto se rechaza.

### [AUD-NG-084] Implementar gestión segura de secretos por servicio con rotación y revocación
- **Origen del Hallazgo:** Auditoria.txt / AUD-NG-084 (TASK-048 / F23-Task05)
- **Archivos Involucrados:** backend/user-service/Code.gs; backend/academic-service/Code.gs; backend/accounting-service/Code.gs; backend/developer-service/Code.gs; PropertiesService/gestor de secretos
- **Dependencias Expuestas:** getAuthTokenSecret, AUTH_TOKEN_SECRET, SPREADSHEET_ID, customSecret y catálogo de credenciales.
- **Descripción del Alcance:** Eliminar secretos derivados de identificadores públicos/configurables. Generar secretos aleatorios de alta entropía y gestionar claves por emisor/receptor con versión, vigencia, rotación solapada, revocación individual y auditoría de uso. No exponer secretos al frontend ni registrarlos en logs.
- **Criterios de Aceptación:** La ausencia de una clave configurada produce error seguro, no un fallback predecible; cada par de servicios utiliza credenciales administrables; la rotación permite transición controlada; revocar un servicio no invalida a los demás.
- **Ampliación C1.29 / FASE2-01:** `getAuthTokenSecret` cae a SHA-256 de `SPREADSHEET_ID + "_MASTER_AUTH_HMAC_SECRET"` cuando falta `AUTH_TOKEN_SECRET`. El mismo `SPREADSHEET_ID` está hardcodeado en USER, ACCOUNTING, ACADEMIC, TASK y EXAM; por tanto el fallback es predecible desde un identificador presente en el código y no separa servicios. No se acredita rotación/versión de claves ni revocación selectiva en el tráfico real.
- **Criterios adicionales:** Eliminar fallback determinista; requerir secretos aleatorios provisionados por servicio/emisor-receptor en PropertiesService, con versión, rotación solapada y revocación. La ausencia de secreto debe fallar de forma cerrada; probar que revocar una relación no invalida otras.

- **Ampliación C1.293 de AUD-NG-084:** el mismo fallback getAuthTokenSecret aparece también en DEVELOPER: se deriva del SPREADSHEET_ID placeholder y del literal _MASTER_AUTH_HMAC_SECRET cuando falta AUTH_TOKEN_SECRET. La presencia real de Script Properties no es observable desde esta auditoría; exigir fail-closed en los seis servicios.

### [AUD-NG-085] Corregir el orden y la atomicidad de la protección anti-replay
- **Origen del Hallazgo:** Auditoria.txt / AUD-NG-085 (TASK-048 / F23-Task05)
- **Severidad/Clasificación:** Alto
- **Dependencias Expuestas:** verifyInterServiceEnvelope, CacheService, requestId y registro persistente de solicitudes.
- **Descripción del Alcance:** Validar primero estructura, destinatario, vigencia y firma HMAC; solo después reservar el requestId mediante operación atómica y persistente o un mecanismo equivalente. Rechazar replays concurrentes y mantener la deduplicación por un período coherente con la ventana de validez y retención definida.
- **Criterios de Aceptación:** Una firma inválida no consume requestId; dos solicitudes concurrentes con igual requestId producen una sola aceptación; un replay dentro de la ventana se rechaza incluso ante evicción de caché; el registro permite auditoría posterior.

### [AUD-NG-086] Aplicar autorización por emisor, receptor, acción y versión de contrato
- **Origen del Hallazgo:** Auditoria.txt / AUD-NG-086 (TASK-048 / F23-Task05)
- **Archivos Involucrados:** backend/user-service/Code.gs; backend/academic-service/Code.gs; backend/accounting-service/Code.gs; backend/developer-service/Code.gs; CatalogoServicios
- **Dependencias Expuestas:** verifyInterServiceEnvelope, CatalogoServicios, permisosConcedidos, sourceService, targetService, action y versión del protocolo.
- **Descripción del Alcance:** Separar autenticación de autorización. Comprobar que el emisor está registrado, activo y posee permiso explícito para la acción solicitada sobre el receptor; validar contrato y esquema por versión, con respuestas y errores normalizados.
- **Criterios de Aceptación:** Un servicio desconocido/inactivo es rechazado; una acción no autorizada se bloquea aunque el HMAC sea correcto; los payloads incompatibles se rechazan; se puede revocar un permiso por acción sin afectar otras relaciones.
- **Ampliación C1.29 / FASE2-01:** `verifyInterServiceEnvelope` solo comprueba campos, target, ventana temporal, anti-replay y HMAC; no valida que `sourceService` esté registrado/activo, ni permiso explícito por emisor-receptor-acción, ni versión/esquema de contrato. Además registra `requestId` en CacheService antes de verificar la firma, permitiendo que un paquete no autenticado consuma una clave de replay. `auditInterServiceCalls` devuelve siempre `auditLogs: []`; `auditServiceBackendIsolationAndDriveSecurity` devuelve flags hardcodeadas; la suite de arquitectura ejecuta funciones locales/mock y no prueba llamadas entre servicios.
- **Criterios adicionales:** Validar emisor, receptor, acción y versión/esquema contra catálogo confiable antes de ejecutar; verificar HMAC antes de reservar el nonce anti-replay; auditar tráfico real con correlationId. Las pruebas deben incluir emisor desconocido/inactivo, acción no autorizada, contrato incompatible, firma válida pero permiso insuficiente, replay y dos proyectos separados.

### [AUD-NG-087] Verificar la continuidad real de la cadena y rechazar hashes ausentes
- **Origen del Hallazgo:** Auditoria.txt / AUD-NG-087 (TASK-049 / F23-Task06)
- **Archivos Involucrados:** backend/user-service/Code.gs; RevisionesDecisionesTramite; servicio de auditoría
- **Dependencias Expuestas:** verifyWorkflowDecisionAuditChain, hashPrevio, hashActual, hash génesis y checkpoints.
- **Descripción del Alcance:** Validar cada hash y además comprobar que hashPrevio coincida exactamente con hashActual del evento inmediatamente anterior, comenzando por el valor génesis. Marcar como inconsistencia cualquier hash vacío, enlace roto, evento eliminado o secuencia incompleta; al filtrar por solicitud, verificar el tramo global correspondiente sin perder continuidad.
- **Criterios de Aceptación:** Cambiar un dato, quitar un hash, alterar un enlace o eliminar una fila de prueba produce cadena inválida; una cadena completa se verifica de forma determinista; el último hash se compara con un checkpoint confiable.

### [AUD-NG-088] Incluir todos los datos probatorios y relaciones en el hash de cada evento
- **Origen del Hallazgo:** Auditoria.txt / AUD-NG-088 (TASK-049 / F23-Task06)
- **Archivos Involucrados:** backend/user-service/Code.gs; RevisionesDecisionesTramite
- **Dependencias Expuestas:** processWorkflowDecision, recordWorkflowDecisionCorrection, verifyWorkflowDecisionAuditChain, observaciones, ipOrigen, motivoCorreccion y decisionIdOriginal.
- **Descripción del Alcance:** Definir un esquema canónico del evento que incluya identificadores, proceso, actor verificado, acción, fecha, IP/fuente confiable, observaciones, motivo, referencia a evento original y hash previo. Serializar de forma determinista y someter todos los campos probatorios a la función criptográfica.
- **Criterios de Aceptación:** Modificar cualquier campo probatorio provoca fallo de integridad; una corrección queda vinculada estructuralmente al evento original; los hashes se recalculan sobre el mismo esquema canónico en escritura y verificación.

### [AUD-NG-089] Autorizar y serializar las correcciones de decisiones históricas
- **Origen del Hallazgo:** Auditoria.txt / AUD-NG-089 (TASK-049 / F23-Task06)
- **Dependencias Expuestas:** recordWorkflowDecisionCorrection, validateRolePermission, _verifiedUserId, decisionIdOriginal, solicitudId, nuevaAccionDecision y LockService.
- **Descripción del Alcance:** Derivar actor de la sesión verificada y exigir permiso específico de corrección. Comprobar que la solicitud corresponde al evento original, validar el tipo de corrección y conservar una relación estructurada. Proteger lectura del último hash y append mediante exclusión mutua; impedir correcciones duplicadas o bifurcaciones.
- **Criterios de Aceptación:** Un actor sin permiso no corrige; revisorId manipulado no cambia al autor; una solicitud distinta del evento original es rechazada; acciones no permitidas se rechazan; dos correcciones simultáneas no crean ramas ni eventos duplicados.

### [AUD-NG-090] Implementar pruebas funcionales de HMAC, anti-replay y auditoría histórica
- **Origen del Hallazgo:** Auditoria.txt / AUD-NG-090 (TASK-048 y TASK-049 / F23-Task05 y F23-Task06)
- **Archivos Involucrados:** tests/regression/academic-grading-suite.js; cuatro microservicios; entorno de integración aislado
- **Dependencias Expuestas:** createInterServiceEnvelope, verifyInterServiceEnvelope, getAuthTokenSecret, verifyWorkflowDecisionAuditChain y recordWorkflowDecisionCorrection.
- **Descripción del Alcance:** Sustituir aserciones de presencia por pruebas reales entre despliegues aislados. Cubrir secretos ausentes/rotados/revocados, firma inválida, expiración, replay simple y concurrente, autorización por acción, manipulación/eliminación de eventos, hash previo roto, campos probatorios y correcciones cruzadas.
- **Criterios de Aceptación:** Las pruebas envían sobres reales entre servicios; verifican autenticación y autorización por separado; cada alteración del historial se detecta; las correcciones válidas quedan encadenadas; los escenarios negativos no producen efectos persistentes.

<!-- Fuente: RECUPERACION/Pendientes_RECUPERADO.md, líneas 2486-2652; clave TASK-049; asignación única: Dirección -->

---

<!-- ID: TASK-049 | Fuentes: Pendientes.md ; pendientes/Dirección/Pendientes.md -->
### [ ] [TASK-049] [P0] [Auditoría Criptográfica - Protección de Decisiones Históricas y Auditoría Anti-Manipulación]
- **Componentes Afectados:**
  - `backend/user-service/Code.gs`
- **Dependencias Expuestas:** `RevisionesDecisionesTramite`, `F23-Task01`, `F23-Task13`.
- **Capacidades Relacionadas:** F23-003, F23-012, F23-028.
- **Problema Detectado:**
  El historial de decisiones está implementado y verificado funcionalmente, pero los registros no disponen de garantías suficientes frente a modificaciones posteriores no autorizadas.
- **Requisitos Funcionales:**
  1. Conservar los registros históricos de decisiones.
  2. Evitar modificaciones y eliminaciones silenciosas de eventos anteriores.
  3. Incorporar un mecanismo de integridad criptográfica.
  4. Evaluar el encadenamiento de hashes entre eventos consecutivos (`hashPrevio`, `hashActual`).
  5. Registrar identificador del evento, proceso, actor, operación, fecha y datos relevantes.
  6. Permitir verificar la integridad de una secuencia histórica mediante una función de auditoría.
  7. Registrar intentos de modificación o eliminación no autorizada.
  8. Mantener separados los registros de auditoría y los datos operativos modificables.
  9. Permitir registrar correcciones mediante nuevos eventos vinculados, sin reescribir silenciosamente el historial.
  10. Restringir las operaciones administrativas sobre los registros históricos.
- **Comportamiento Esperado:**
  Si una decisión histórica cambia de manera no autorizada, la verificación de integridad debe detectar la alteración.
  Las correcciones legítimas deben quedar documentadas como nuevos eventos vinculados al registro original.
- **Criterios de Aceptación:**
  - [ ] Crear una secuencia de decisiones encadenadas por hash.
  - [ ] Verificar la integridad matemática de la secuencia histórica.
  - [ ] Modificar un registro histórico de prueba y comprobar que la auditoría detecta la alteración.
  - [ ] Registrar una corrección autorizada como nuevo evento vinculado.
  - [ ] Comprobar que la secuencia histórica conserva todos los eventos originales.
  - [ ] Intentar eliminar registros mediante una cuenta sin privilegios y verificar su bloqueo.
- **Estado:** Pendiente

---

<!-- ID: TASK-050 | Fuentes: AUDITORIAS/AUDITORIA_COMPLETADAS_TAREA-17.md ; Pendientes.md ; pendientes/Dirección/Pendientes.md -->
### [ ] [TASK-050] TAREAS DERIVADAS DE AUDITORÍA — TASK-050 / F24-Task01 (2026-11-04)

**Otros títulos originales:**
- [P0] [Catálogo de Informes - Catálogo Centralizado de Informes Institucionales con Permisos por Perfil]
- Incorporar los informes analíticos académicos requeridos para Dirección y Coordinación con metadatos explícitos: dimensiones, filtros obligatorios, fuente, periodicidad, formato, alcance y roles autorizados.
- Mantener una definición única de cada informe entre user-service y academic-service; no declarar un informe disponible si carece de generador funcional o de permisos consistentes.
- Definir REP-ACAD-01 y REP-ACAD-02 con generadores y contratos específicos, evitando que REP-ACAD-02 caiga silenciosamente en una rama genérica de categoría académica.
- Alinear el catálogo visible con la funcionalidad real y los parámetros aceptados por cada endpoint.
- **Componentes Afectados:**
  - `backend/user-service/Code.gs`
  - `backend/academic-service/Code.gs`
  - `backend/accounting-service/Code.gs`
  - `js/ui-common.js`
- **Dependencias Expuestas:** Diccionario de indicadores (`F24-Task02`), control de permisos existente y servicios de generación actuales.
- **Capacidades Relacionadas:** F24-001, F24-002, F24-010.
- **Problema Detectado:**
  Los informes institucionales están implementados mediante funciones independientes. No existe un catálogo centralizado que permita conocer qué informes están disponibles, qué información contienen, qué parámetros aceptan y qué perfiles pueden consultarlos.
- **Requisitos Funcionales:**
  1. Crear un catálogo institucional único que consolide los informes existentes de las áreas académica, financiera, administrativa y operativa.
  2. Registrar para cada informe:
     - Identificador único.
     - Nombre visible.
     - Descripción funcional.
     - Categoría y área responsable.
     - Fuente o servicio de datos.
     - Parámetros y filtros disponibles.
     - Indicadores incluidos.
     - Formatos de exportación admitidos.
     - Perfiles y permisos requeridos.
     - Estado de disponibilidad.
  3. Incorporar los informes existentes, incluidos:
     - Informe financiero y cobranza (`REP-CONT-01`).
     - Rendimiento académico por grado y sección (`REP-ACAD-01`).
     - Informes administrativos de expedientes y movimientos (`getStudentFileAdministrativeReports`).
     - Informe consolidado de asistencia y convivencia (`generateConsolidatedAttendanceAndCoexistenceReport`).
     - Informe de capacidad y ocupación de secciones (`getSectionCapacityAnalyticsReport`).
     - Comparativo financiero multianual (`getComparativeFinancialSummary`).
  4. Permitir que el catálogo se amplíe cuando se incorporen nuevos informes, sin tener que reconstruir la interfaz global.
  5. Diferenciar informes institucionales predeterminados, informes personalizados y aquellos disponibles únicamente para determinados departamentos.
  6. Incorporar búsqueda por nombre, categoría, descripción y área.
  7. Evitar registros duplicados y permitir desactivar informes obsoletos sin eliminar su historial de utilización.
  8. Proporcionar a la interfaz únicamente los informes que el usuario tenga autorización para consultar.
- **Cambios Necesarios:**
  - Incorporar un servicio centralizado de consulta del catálogo (`getInstitutionalReportsCatalog`).
  - Integrar las definiciones de los informes actualmente dispersos.
  - Incorporar metadatos y permisos por informe en matriz central.
  - Adaptar el acceso desde la interfaz global para que utilice el catálogo en lugar de mantener listas independientes.
  - Conservar los servicios de generación existentes y conectarlos mediante sus identificadores y parámetros correspondientes.
- **Comportamiento Esperado:**
  Al ingresar al apartado de informes, cada usuario encontrará un catálogo organizado según sus permisos y responsabilidades. Al seleccionar un informe, la interfaz conocerá qué filtros debe presentar, qué servicio debe consultar y qué formatos están disponibles.
  La incorporación de un nuevo informe no deberá requerir duplicar la lógica de navegación, autorización y presentación.
- **Criterios de Aceptación:**
  - [ ] El catálogo incluye todos los informes existentes identificados en la auditoría.
  - [ ] Los informes aparecen clasificados en las categorías correspondientes.
  - [ ] Cada informe devuelve sus metadatos completos y permisos requeridos.
  - [ ] Los usuarios sin autorización no reciben ni visualizan informes restringidos.
  - [ ] Un acceso directo a un informe no autorizado es rechazado también en el servidor (403 Forbidden).
  - [ ] Desactivar un informe impide nuevas consultas, pero conserva sus registros históricos de utilización.
  - [ ] Agregar un informe nuevo al catálogo permite visualizarlo sin modificar manualmente cada panel.
  - [ ] Los informes existentes siguen generando exactamente los mismos resultados después de integrarse al catálogo.
- **Estado:** [ ] Pendiente

### [AUD-NG-091] Conectar cada identificador del catálogo con su generador, filtros y servicio real
- **Origen del Hallazgo:** Auditoria.txt / AUD-NG-091 (TASK-050 / F24-Task01)
- **Severidad/Clasificación:** Alto
- **Archivos Involucrados:** backend/user-service/Code.gs; backend/academic-service/Code.gs; backend/accounting-service/Code.gs; js/ui-common.js
- **Dependencias Expuestas:** catalogMaster, getInstitutionalReportCatalog, generateInstitutionalReport, reportId, service, filters, supportedFormats, renderReportsCenterUI y triggerReportGeneration.
- **Descripción del Alcance:** Implementar una resolución explícita por identificador de informe. Cada ID debe invocar el generador y fuente de datos declarados en el catálogo, aplicar sus filtros y producir uno de los formatos admitidos. Eliminar el enrutamiento basado únicamente en category y los resultados genéricos de muestra para informes institucionales reales. Rechazar IDs desconocidos o inactivos sin ejecutar un generador alternativo.
- **Criterios de Aceptación:** Cada ID del catálogo produce el informe correspondiente; REP-CONT-02/03/04 no devuelve el contenido de REP-CONT-01; REP-ACAD-02/03/04 no devuelve el contenido de REP-ACAD-01; los informes administrativos, de RRHH, tienda, cafetería y plataforma consultan su fuente correcta; los filtros y formatos declarados se aplican y validan; un ID desconocido/inactivo se rechaza.

### [AUD-NG-092] Implementar el generador académico invocado por el despachador
- **Origen del Hallazgo:** Auditoria.txt / AUD-NG-092 (TASK-050 / F24-Task01)
- **Archivos Involucrados:** backend/academic-service/Code.gs; tests/regression/academic-grading-suite.js
- **Dependencias Expuestas:** doPost, generateInstitutionalReport, getAcademicInstitutionalReportCatalog y reportId.
- **Descripción del Alcance:** Definir e integrar una implementación local de generación académica que corresponda a los informes REP-ACAD-01 a REP-ACAD-04 y a los identificadores académicos/administrativos asignados a este servicio. Mantener la autorización del despachador y evitar referencias a funciones no declaradas.
- **Criterios de Aceptación:** El símbolo invocado por doPost existe en el microservicio; cada ID académico genera el contenido correspondiente; una acción inválida devuelve un error controlado; existen pruebas de integración para los informes académicos sin alterar datos reales.

### [AUD-NG-093] Derivar el rol del catálogo académico exclusivamente de la sesión verificada
- **Origen del Hallazgo:** Auditoria.txt / AUD-NG-093 (TASK-050 / F24-Task01)
- **Dependencias Expuestas:** validateRolePermission, doPost, getAcademicInstitutionalReportCatalog, requesterRole, authRole, _verifiedRole y rolesPermitidos.
- **Descripción del Alcance:** Eliminar la prioridad de requesterRole y authRole enviados por el cliente. Resolver el rol únicamente desde _verifiedRole asignado después de verificar la sesión firmada. Si no existe un rol verificado, denegar la consulta en lugar de asumir Director.
- **Criterios de Aceptación:** Alterar requesterRole/authRole no cambia el catálogo visible; el rol del resultado coincide con los claims de la sesión; una solicitud sin rol verificado se rechaza; las pruebas cubren intentos de suplantación con roles de mayor privilegio.

### [AUD-NG-094] Alinear los permisos de consulta y generación con los perfiles publicados en el catálogo
- **Origen del Hallazgo:** Auditoria.txt / AUD-NG-094 (TASK-050 / F24-Task01)
- **Severidad/Clasificación:** Medio
- **Archivos Involucrados:** backend/user-service/Code.gs; backend/academic-service/Code.gs; configuración MatrizPermisosRoles; tests/regression/academic-grading-suite.js
- **Dependencias Expuestas:** ROLE_PERMISSIONS, validateRolePermission, getDynamicPermissionsForRole, MatrizPermisosRoles, getInstitutionalReportCatalog, generateInstitutionalReport y rolesPermitidos.
- **Descripción del Alcance:** Definir de forma trazable qué perfiles pueden consultar el catálogo y generar cada informe. Alinear ROLE_PERMISSIONS y la matriz dinámica con rolesPermitidos; incorporar validación de permisos por reportId también en el generador, sin confiar exclusivamente en que la interfaz o el catálogo oculten opciones.
- **Criterios de Aceptación:** Cada perfil anunciado tiene una concesión verificable y limitada; perfiles no autorizados reciben 403 en consulta y generación directa; un perfil autorizado para un informe no obtiene otros informes por cambiar reportId; la configuración efectiva queda documentada y cubierta por pruebas positivas y negativas.

### [AUD-NG-095] Sustituir las pruebas de presencia textual por pruebas funcionales del catálogo
- **Origen del Hallazgo:** Auditoria.txt / AUD-NG-095 (TASK-050 / F24-Task01)
- **Archivos Involucrados:** tests/regression/academic-grading-suite.js; backend/user-service/Code.gs; backend/academic-service/Code.gs; js/ui-common.js
- **Dependencias Expuestas:** getInstitutionalReportCatalog, getAcademicInstitutionalReportCatalog, generateInstitutionalReport, validateRolePermission y triggerReportGeneration.
- **Descripción del Alcance:** Incorporar pruebas funcionales aisladas para cada identificador del catálogo, filtrado por rol, categorías, filtros, formatos, servicios de destino, informes inactivos, IDs desconocidos y acceso directo no autorizado. Utilizar datos de prueba aislados y no modificar hojas operativas.
- **Criterios de Aceptación:** La suite verifica resultados propios de cada ID; detecta la suplantación de rol; comprueba 403 para perfiles no autorizados; valida filtros y formatos; detecta despachos a funciones inexistentes; los casos negativos no generan escrituras persistentes.

### [AUD-NG-096] Rectificar de forma aditiva el estado contradictorio de TASK-050
- **Origen del Hallazgo:** Auditoria.txt / AUD-NG-096 (TASK-050 / F24-Task01)
- **Severidad/Clasificación:** Observación
- **Archivos Involucrados:** Pendientes.md; ChangesLogs.txt; Auditoria.txt
- **Dependencias Expuestas:** Encabezado [ ] de TASK-050, campo Estado [ ] Pendiente, criterios de aceptación y registro histórico de ChangesLogs.txt.
- **Descripción del Alcance:** Determinar el estado administrativo de TASK-050 a partir de la verificación funcional y la revisión correspondiente. Documentar la rectificación mediante una anotación aditiva y trazable, sin borrar ni reescribir el registro histórico original. No declarar cumplimiento mientras existan criterios de aceptación no satisfechos.
- **Criterios de Aceptación:** El inventario permite identificar inequívocamente el estado de TASK-050; la rectificación conserva el encabezado y contenido históricos; la decisión se apoya en evidencias y revisión formal; las tareas derivadas permanecen vinculadas a AUD-NG-091 a AUD-NG-096.

### [AUD-NG-098] Eliminar datos ficticios de los resultados institucionales
- **Origen del Hallazgo:** Auditoria.txt / AUD-NG-098 (TASK-050 / F24-Task01)
- **Severidad/Clasificación:** Crítico
- **Archivos Involucrados:** backend/user-service/Code.gs; generadores académicos y financieros
- **Dependencias Expuestas:** generateInstitutionalReport, ComprobantesPago, PagosAbonos, CalificacionesEstudiantes, rows y summary.
- **Descripción del Alcance:** Retirar filas, importes, nombres, promedios y porcentajes codificados como datos de muestra de las respuestas productivas. Cuando no existan datos, devolver colección vacía y métricas con semántica explícita de ausencia; los datos demostrativos deberán permanecer aislados del entorno productivo y claramente etiquetados.
- **Criterios de Aceptación:** Una fuente vacía nunca devuelve transacciones o alumnos ficticios; cada total se calcula exclusivamente con registros reales válidos; no aparecen constantes de muestra como resultados institucionales.

### [AUD-NG-100] Implementar búsqueda y filtros visibles en el centro de informes
- **Origen del Hallazgo:** Auditoria.txt / AUD-NG-100 (TASK-050 / F24-Task01)
- **Archivos Involucrados:** js/ui-common.js; backend/user-service/Code.gs
- **Dependencias Expuestas:** renderReportsCenterUI, sendApiRequest, query, categoria, area y catalogMaster.
- **Descripción del Alcance:** Incorporar controles de búsqueda por nombre/descripción y filtros por categoría/área; transmitir sus valores al endpoint y actualizar las tarjetas sin duplicar definiciones. Incluir el área responsable en la búsqueda textual cuando query sea el criterio usado.
- **Criterios de Aceptación:** La búsqueda encuentra por nombre, descripción, categoría y área; los filtros pueden combinarse; limpiar criterios restaura los resultados autorizados; no se muestran informes fuera de los permisos del usuario.

- Registrar la analítica académica de TAREA-17 como informe propio, con fuente, dimensiones, filtros, formato y roles permitidos. Distinguir distribución de calificaciones, tendencia por parcial, comparativa homogénea y estudiantes en riesgo.
- Verificar que REP-ACAD-01 y REP-ACAD-02 tengan generadores distintos y coherentes con sus definiciones; no enrutar todo informe category=ACADEMICA a un mismo reporte.
- No anunciar formatos/roles/filtros que el generador no implementa.


### Nota de conciliación administrativa C1.417 — AUD-NG-096

La versión histórica de este bloque en commit `40c9e15f85224f716d0ddfa597b72e1142ed0191` (blob `bd6b1e573e3eda36e34af2a8c83f0483673026a0`) tenía encabezado `[X]` y campo interno `[ ] Pendiente`. En el backlog canónico vigente al HEAD previo `b055ecf685ad7a6a2d18bd11323767dd772bbe76` (blob `0f82e33a8c62a4bb31b9b1280d10d0838f213c94`) el encabezado y el estado interno ya coinciden: `[ ]` / `[ ] Pendiente`. Se verificaron ocho criterios de aceptación sin marcar. Por tanto, TASK-050 permanece **Pendiente**; la marca histórica no acredita implementación ni cierre. Esta nota es aditiva, preserva el historial y no modifica requisitos ni estado. AUD-NG-091 a AUD-NG-096 continúan vinculadas.

---

<!-- ID: TASK-051 | Fuentes: AUDITORIAS/AUDITORIA_COMPLETADAS_TAREA-17.md ; Pendientes.md ; pendientes/Dirección/Pendientes.md -->
### [ ] [TASK-051] [P0] [Indicadores Centrales - Diccionario Semántico Centralizado de Indicadores Institucionales]
- Resolver la inconsistencia de estado registrada en el propio artefacto (encabezado [ ] frente a estado interno Pendiente) mediante revisión explícita y evidencia; no cambiar el estado por esta normalización documental.
- Definir para cada indicador fórmula, unidad, población, granularidad, periodicidad, fuente primaria, filtros válidos, tratamiento de pendientes/ausentes y versión de la definición.
- Definir indicadores de rendimiento y acompañamiento sin ambigüedad: promedio, distribución, reprobación, tareas pendientes, asistencia, alertas activas y estudiantes únicos.
- Evitar que dos servicios calculen el mismo indicador con fórmulas o escalas distintas; las consultas y exportaciones deben consumir el diccionario versionado.
- **Componentes Afectados:**
  - `backend/developer-service/Code.gs`
  - `backend/academic-service/Code.gs`
  - `backend/accounting-service/Code.gs`
  - `backend/user-service/Code.gs`
- **Dependencias Expuestas:** Catálogo de informes (`F24-Task01`), servicios académicos, financieros y administrativos existentes.
- **Capacidades Relacionadas:** F24-005, F24-006, F24-007, F24-008.
- **Problema Detectado:**
  Las fórmulas de los indicadores están distribuidas entre distintos servicios. Esto permite que un mismo concepto pueda calcularse de forma diferente en un panel, un informe o una consulta de otro módulo. La plataforma necesita una definición institucional única para cada indicador.
- **Requisitos Funcionales:**
  1. Crear un registro centralizado de indicadores (`DiccionarioIndicadoresInstitucionales`) que permita definir:
     - Identificador único.
     - Nombre y descripción.
     - Área: académica, financiera, administrativa u operativa.
     - Finalidad.
     - Fórmula o regla de cálculo.
     - Unidad de medida.
     - Fuente de datos.
     - Campos requeridos.
     - Estados incluidos y excluidos.
     - Filtros compatibles.
     - Dimensiones de agrupación.
     - Frecuencia de actualización.
     - Responsable funcional.
     - Versión de la definición.
     - Fecha de vigencia.
  2. Incorporar las definiciones de los indicadores existentes, sin alterar sus fórmulas verificadas.
  3. Normalizar los indicadores académicos:
     - Matrícula activa y retirada.
     - Promedios.
     - Aprobación y reprobación.
     - Distribución de calificaciones.
     - Ausentismo.
     - Ocupación de secciones.
     - Riesgo académico.
  4. Normalizar los indicadores financieros:
     - Ingresos confirmados.
     - Egresos devengados.
     - Balance neto.
     - Cartera recuperada.
     - Morosidad.
     - Flujo de caja.
     - Ejecución presupuestaria.
  5. Incorporar los indicadores administrativos y operativos:
     - Personal activo.
     - Asistencia del personal.
     - Solicitudes pendientes.
     - Trámites resueltos.
     - Tiempo de resolución.
  6. Permitir que los indicadores se consulten desde diferentes informes y paneles sin volver a implementar sus fórmulas.
  7. Permitir nuevas versiones de una definición cuando cambien las reglas institucionales.
  8. Conservar la definición histórica aplicada a períodos anteriores.
  9. Distinguir entre indicadores que admiten cálculo en tiempo real y aquellos que utilizan información agregada.
  10. Incorporar descripciones comprensibles para que los usuarios conozcan qué representa cada indicador y cómo se interpreta.
- **Cambios Necesarios:**
  - Crear el registro centralizado de definiciones en tabla o esquema persistente.
  - Identificar y vincular las fórmulas actuales con sus indicadores correspondientes.
  - Sustituir gradualmente los cálculos duplicados por consultas a las definiciones normalizadas.
  - Mantener adaptadores para los servicios que ya generan resultados válidos.
  - Incorporar control de versiones y vigencia de las definiciones.
- **Comportamiento Esperado:**
  Un indicador debe tener una sola definición institucional. Los diferentes módulos podrán consumirlo, pero no deberán implementar versiones independientes de su fórmula.
  Por ejemplo, el porcentaje de aprobación mostrado en el panel de dirección deberá coincidir con el del informe académico cuando ambos utilicen el mismo período, universo de estudiantes y filtros.
- **Criterios de Aceptación:**
  - [ ] Cada indicador tiene un identificador y una definición verificable.
  - [ ] Las fórmulas existentes se documentan y se comparan con sus resultados actuales antes de migrarlas.
  - [ ] Los paneles y los informes que utilizan el mismo indicador producen resultados matemáticamente equivalentes.
  - [ ] Los cambios de fórmula generan una nueva versión secuencial.
  - [ ] Los informes históricos conservan la versión utilizada originalmente.
  - [ ] Las definiciones identifican las exclusiones y reglas de cálculo.
  - [ ] Un indicador no puede publicarse si carece de fuente, fórmula o unidad cuando estas sean necesarias.
  - [ ] Las fórmulas financieras mantienen la exclusión estricta de operaciones pendientes, canceladas o rechazadas.
  - [ ] Los indicadores académicos mantienen las reglas de publicación y evaluación existentes (excluyendo borradores).
- **Estado:** [ ] Pendiente

- La función getCurricularAnalyticsReport no consulta un diccionario semántico ni una definición versionada; sus etiquetas area/asignatura/grado/programa/periodo se devuelven sin filtrar datos.
- Registrar indicadores académicos con fuente y fórmula verificables: promedio publicado, distribución por bandas, aprobación/reprobación y riesgo académico.
- Declarar dimensiones válidas y relaciones de unión: EvaluacionID, UserID, matrícula, oferta/asignatura, área, programa, idioma de enseñanza, grado, sección, año lectivo y período.
- Reconciliar la inconsistencia actual: el encabezado TASK-051 está marcado [ ], pero su campo Estado interno dice [ ] Pendiente. No cambiar el estado automáticamente ni borrar el registro; resolverlo mediante revisión explícita.

<!-- Fuente: RECUPERACION/Pendientes_RECUPERADO.md, líneas 3066-3138; clave TASK-060; asignación única: Dirección -->

---

<!-- ID: TASK-060 | Fuentes: Pendientes.md ; pendientes/Dirección/Pendientes.md -->
### [ ] [TASK-060] [P0] [Gobernanza Jerárquica - Motor Central de Configuración Jerárquica y Herencia Departamental]
- **Componentes Afectados:**
  - `backend/user-service/Code.gs`
  - `backend/academic-service/Code.gs`
  - `backend/accounting-service/Code.gs`
  - Hojas `ConfiguracionSistema`, `ConfiguracionDepartamental`, `ConfiguracionRoles`
  - `js/ui-common.js`
- **Subcapacidades Relacionadas:** F26-002, F26-010.
- **Estado de Partida:** Implementada parcialmente / Requiere mejoras.
- **Dependencias Expuestas:** Estructuras de usuarios, roles, departamentos, `ConfiguracionSistema`, permisos server-side y servicios consumidores de configuración.
- **Problema Detectado:**
  La plataforma permite administrar configuraciones globales y preferencias individuales, pero no dispone de un nivel departamental formal. Las unidades administrativas no pueden establecer parámetros propios de manera segura y existe riesgo de sobrescribir configuraciones globales. La solución actual necesita evolucionar de una estructura binaria a un sistema de configuración jerárquica que permita administrar valores institucionales, excepciones departamentales y preferencias personales sin generar contradicciones.
- **Requisitos Funcionales:**
  1. Jerarquía de resolución de configuración en 4 niveles:
     - Nivel 1. Global: valores predeterminados del sistema.
     - Nivel 2. Institucional: valores definidos para la institución.
     - Nivel 3. Departamental: excepciones o parámetros propios de una unidad/departamento.
     - Nivel 4. Personal: preferencias individuales permitidas.
     - La precedencia debe resolverse según el tipo de parámetro. No todos los valores deben admitir sobrescritura en todos los niveles.
  2. Políticas de alcance declarativas por parámetro:
     - `Global obligatorio`: no admite sobrescritura en ningún nivel inferior.
     - `Institucional`: se establece para toda la institución.
     - `Heredable`: permite excepciones departamentales controladas.
     - `Personalizable`: admite preferencias individuales de usuario.
     - `Restringido`: requiere autorización especial para cualquier modificación.
  3. Herencia y sobrescritura:
     - Si no existe un valor departamental, utilizar el valor institucional.
     - Si existe una excepción departamental autorizada, utilizarla dentro de su ámbito.
     - Si se elimina la excepción, recuperar automáticamente el valor heredado.
     - Si cambia el valor institucional, actualizar los departamentos que lo heredan.
     - Conservar las excepciones explícitas que deban mantenerse.
     - Identificar visualmente si un valor es heredado, sobrescrito o definido localmente.
     - Permitir restablecer un valor heredado sin tener que copiar manualmente el valor institucional.
  4. Catálogo de parámetros y metadatos:
     - Identificador estable (`configId`), clave, tipo de dato, valor predeterminado, ámbitos permitidos, bandera de herencia, bandera de sobrescritura, roles autorizados, restricciones de modificación, dependencias, versión, estado, fecha y responsable de actualización.
     - No crear una segunda fuente de verdad para parámetros que ya estén almacenados en `ConfiguracionSistema`, `ConfiguracionAcademica` u otras estructuras especializadas.
  5. Administración departamental:
     - Permitir que los responsables autorizados consulten y administren las configuraciones de su unidad.
     - Mostrar valor efectivo, valor institucional de origen, estado de herencia, excepciones existentes, responsable y fecha de actualización.
     - Una unidad no debe poder modificar configuraciones de otra unidad ni cambiar parámetros institucionales no habilitados para su ámbito.
  6. Resolución de conflictos:
     - Aplicar la política de precedencia definida para el parámetro.
     - Rechazar sobrescrituras prohibidas.
     - Informar qué valor prevalece y por qué.
     - Evitar que una excepción departamental modifique configuraciones globales.
     - Registrar las modificaciones y los conflictos relevantes en bitácora de auditoría.
- **Cambios Necesarios:**
  - Ampliar el modelo de configuración existente para representar los cuatro ámbitos (`GLOBAL`, `INSTITUCIONAL`, `DEPARTAMENTAL`, `PERSONAL`).
  - Incorporar relaciones entre institución, departamentos y usuarios en hoja `ConfiguracionDepartamental`.
  - Implementar un mecanismo central de lectura y resolución jerárquica de configuraciones (`resolveHierarchicalConfiguration`).
  - Integrar las operaciones de lectura y escritura de `saveSystemConfiguration` con el nuevo mecanismo.
  - Adaptar las configuraciones especializadas que deban admitir herencia.
  - Incorporar controles server-side para verificar ámbito, rol y permisos.
  - Ampliar la interfaz administrativa para visualizar valores heredados y excepciones.
  - Mantener compatibilidad con las configuraciones actuales durante la transición.
- **Comportamiento Esperado:**
  Una configuración institucional se establece una vez y se aplica a todas las unidades que la heredan. Un departamento puede establecer una excepción cuando el parámetro lo permita. Los usuarios pueden personalizar sus preferencias individuales sin alterar la configuración de su departamento ni de la institución.
- **Criterios de Aceptación:**
  - [ ] Crear una configuración institucional y comprobar que se aplica a los departamentos sin excepciones.
  - [ ] Crear una excepción departamental y comprobar que solo afecta a esa unidad específica.
  - [ ] Restablecer la herencia y comprobar que se recupera automáticamente el valor institucional.
  - [ ] Cambiar el valor institucional y comprobar que se actualizan las unidades que heredan.
  - [ ] Comprobar que las excepciones explícitas se conservan cuando corresponda.
  - [ ] Intentar modificar una configuración global con un usuario sin permisos y comprobar que el servidor rechaza la operación (403).
  - [ ] Intentar modificar una unidad ajena y comprobar que la operación se bloquea.
  - [ ] Intentar sobrescribir un parámetro global obligatorio desde un departamento y comprobar que se rechaza.
  - [ ] Comprobar que las preferencias personales no alteran configuraciones compartidas.
  - [ ] Verificar que las configuraciones antiguas siguen resolviéndose correctamente después de la transición.
  - [ ] Comprobar que no existen dos valores efectivos contradictorios para un mismo parámetro y ámbito.
- **Estado:** [ ] Pendiente

<!-- Fuente: RECUPERACION/Pendientes_RECUPERADO.md, líneas 3440-3489; clave TASK-068; asignación única: Dirección -->

---

<!-- ID: TASK-219 | Fuentes: Pendientes.md ; pendientes/Dirección/Pendientes.md -->
### [ ] [TASK-219] [P1] [Motor de Workflows - Reglas Configurables, Condiciones y Enrutamiento de Procesos]
- **Componentes Afectados:**
  - `backend/user-service/Code.gs`
- **Dependencias Expuestas:** `FlujosAprobacion`, `F23-Task01`, `F23-Task10`.
- **Capacidades Relacionadas:** F23-001, F23-005, F23-014.
- **Problema Detectado:**
  Los flujos utilizan estructuras JSON y transiciones predominantemente lineales. La selección de responsables y etapas depende parcialmente de parámetros enviados por el frontend y de lógica de negocio dispersa.
- **Requisitos Funcionales:**
  1. Ampliar la definición de flujos para admitir condiciones evaluables.
  2. Definir reglas mediante operadores controlados:
     - Igualdad y desigualdad.
     - Comparaciones numéricas (mayor, menor, rangos).
     - Comparaciones de fechas.
     - Existencia o ausencia de valores.
     - Condiciones AND y OR compuestas.
     - Combinaciones de condiciones y pertenencia a categorías.
  3. Permitir reglas basadas en datos del trámite, departamento, tipo de operación, monto, ciclo lectivo y rol.
  4. Definir destinos de transición según el resultado de las condiciones.
  5. Permitir establecer aprobadores adicionales según umbrales económicos o de riesgo.
  6. Permitir rutas alternativas por departamento o categoría.
  7. Validar las expresiones antes de guardar el flujo.
  8. Impedir la ejecución de código arbitrario introducido en las condiciones.
  9. Ejecutar la evaluación estrictamente en el servidor.
  10. Registrar qué regla se evaluó y qué resultado produjo en la bitácora.
  11. Definir un comportamiento explícito cuando ninguna condición coincide.
  12. Permitir establecer rutas predeterminadas (fallback routes).
  13. Versionar las reglas junto con la definición del flujo.
- **Comportamiento Esperado:**
  Una operación debe avanzar por la ruta correspondiente a sus datos reales, sin depender de instrucciones manipulables desde el cliente.
  Ejemplo: una requisición que supere un umbral económico deberá incorporar el nivel de aprobación adicional establecido en su configuración.
- **Criterios de Aceptación:**
  - [ ] Crear una regla basada en un monto numérico.
  - [ ] Probar valores inferiores, iguales y superiores al umbral verificando las ramas resultantes.
  - [ ] Crear una regla con compuertas AND y otra con OR.
  - [ ] Comprobar rutas alternativas válidas.
  - [ ] Introducir una condición sintácticamente inválida y verificar su rechazo.
  - [ ] Intentar introducir una expresión ejecutable arbitraria y verificar que es sanitizada.
  - [ ] Modificar los parámetros enviados por el frontend y comprobar que la decisión final depende de las reglas del servidor.
- **Estado:** [ ] Pendiente

<!-- Fuente: RECUPERACION/Pendientes_RECUPERADO.md, líneas 8760-8801; clave TASK-220; asignación única: Dirección -->

---

<!-- ID: TASK-220 | Fuentes: Pendientes.md ; pendientes/Dirección/Pendientes.md -->
### [ ] [TASK-220] [P1] [Motor de Workflows - Diseñador Configurable de Flujos y Validación de Estructuras]
- **Componentes Afectados:**
  - `backend/user-service/Code.gs`
  - `js/api.js`
- **Dependencias Expuestas:** `FlujosAprobacion`, `F23-Task07`, `F23-Task10`.
- **Capacidades Relacionadas:** F23-001, F23-005, F23-021, F23-031.
- **Problema Detectado:**
  Las definiciones de workflow se almacenan como JSON plano en `PasosEtapasJSON`, sin una herramienta visual suficientemente completa para construir y validar procesos complejos.
- **Requisitos Funcionales:**
  1. Proporcionar una interfaz administrativa para configurar procesos sin editar directamente JSON.
  2. Permitir agregar, modificar, eliminar y ordenar etapas.
  3. Definir responsables individuales, roles y departamentos.
  4. Definir estados iniciales, intermedios y terminales.
  5. Configurar transiciones permitidas.
  6. Configurar condiciones y rutas alternativas.
  7. Configurar pasos paralelos.
  8. Configurar tiempos límite y reglas de escalamiento.
  9. Mostrar visualmente el recorrido del proceso.
  10. Validar que todas las rutas tengan un destino válido.
  11. Detectar etapas sin responsables asignados.
  12. Detectar rutas sin salida y ciclos involuntarios.
  13. Detectar estados terminales inaccesibles.
  14. Permitir guardar borradores sin activar inmediatamente el flujo.
  15. Proporcionar una vista previa de ejecución con datos de prueba.
  16. Generar una definición estructurada compatible con el motor de ejecución.
  17. Mantener compatibilidad con los workflows existentes.
  18. Permitir consultar y comparar versiones anteriores.
- **Comportamiento Esperado:**
  El administrador podrá configurar un proceso desde una interfaz visual, validarlo y publicarlo sin tener que modificar código fuente.
  La definición resultante deberá ser interpretada por el mismo motor común, no por un ejecutor independiente.
- **Criterios de Aceptación:**
  - [ ] Crear un flujo completo desde la interfaz.
  - [ ] Agregar y reorganizar etapas secuenciales y condicionales.
  - [ ] Configurar responsables y condiciones evaluables.
  - [ ] Intentar publicar una ruta incompleta y verificar advertencias de validación.
  - [ ] Visualizar el recorrido del diagrama de flujo.
  - [ ] Ejecutar una prueba de simulación con datos de prueba.
  - [ ] Publicar una nueva versión y comprobar que las instancias anteriores conservan su definición original.
- **Estado:** [ ] Pendiente

<!-- Fuente: RECUPERACION/Pendientes_RECUPERADO.md, líneas 8855-8886; clave TASK-222; asignación única: Dirección -->

---

<!-- ID: TASK-222 | Fuentes: Pendientes.md ; pendientes/Dirección/Pendientes.md -->
### [ ] [TASK-222] [P1] [Motor de Workflows - Procesos Paralelos y Compuertas de Convergencia (Fork / Join)]
- **Componentes Afectados:**
  - `backend/user-service/Code.gs`
- **Dependencias Expuestas:** `FlujosAprobacion`, `F23-Task07`, `F23-Task08`.
- **Capacidades Relacionadas:** F23-021, F23-001, F23-005.
- **Problema Detectado:**
  El motor actual utiliza secuencias lineales. No puede representar adecuadamente operaciones que necesitan revisiones simultáneas de varios departamentos.
- **Requisitos Funcionales:**
  1. Permitir dividir un proceso en varias ramas independientes (Fork).
  2. Crear pasos paralelos que puedan ejecutarse simultáneamente por diferentes revisores.
  3. Establecer si se requiere la finalización de todas las ramas o de una cantidad determinada (Join).
  4. Permitir definir reglas AND (todas las ramas aprobadas) y OR (primera rama aprobada).
  5. Registrar el estado individual de cada rama independiente.
  6. Impedir que el proceso principal avance antes de cumplir las condiciones de convergencia.
  7. Permitir que una rama sea rechazada sin perder el historial de las demás.
  8. Definir qué ocurre cuando una rama queda bloqueada o vence.
  9. Permitir que las ramas tengan responsables y departamentos diferentes.
  10. Conservar la relación entre las tareas paralelas y el proceso principal.
- **Comportamiento Esperado:**
  Una solicitud puede enviarse simultáneamente a dos departamentos (ej. Dirección y Administración). El proceso continuará cuando se cumpla la condición configurada.
- **Criterios de Aceptación:**
  - [ ] Crear dos ramas paralelas sobre un mismo trámite.
  - [ ] Completar solamente una rama y comprobar que el proceso no avanza cuando se requiere compuerta AND.
  - [ ] Completar ambas ramas y comprobar la convergencia y avance al siguiente estado.
  - [ ] Probar una condición de convergencia OR.
  - [ ] Rechazar una rama y comprobar la propagación del rechazo según las reglas del flujo.
  - [ ] Simular una rama bloqueada y verificar aislamiento.
  - [ ] Comprobar que no se dupliquen las etapas posteriores a la convergencia.
- **Estado:** [ ] Pendiente

<!-- Fuente: RECUPERACION/Pendientes_RECUPERADO.md, líneas 8887-8921; clave TASK-223; asignación única: Dirección -->

---

<!-- ID: TASK-223 | Fuentes: Pendientes.md ; pendientes/Dirección/Pendientes.md -->
### [ ] [TASK-223] [P1] [Operaciones y SLA - Gestión de SLA, Vencimientos y Escalamiento Automático]
- **Componentes Afectados:**
  - `backend/user-service/Code.gs`
- **Dependencias Expuestas:** `SolicitudesTramites`, `F23-Task09`, `F23-Task15`.
- **Capacidades Relacionadas:** F23-006, F23-012, F23-027, F23-030.
- **Problema Detectado:**
  No existe un mecanismo completo para controlar los tiempos de respuesta de las etapas ni para escalar automáticamente los trámites estancados.
- **Requisitos Funcionales:**
  1. Configurar tiempos máximos por tipo de trámite y etapa (SLA en horas o días hábiles).
  2. Permitir establecer plazos por departamento y nivel de prioridad.
  3. Definir calendarios y horarios laborales cuando sean necesarios.
  4. Establecer anticipación de recordatorios antes del vencimiento.
  5. Configurar escalamiento por incumplimiento hacia el supervisor jerárquico.
  6. Notificar al responsable antes del vencimiento.
  7. Notificar al supervisor cuando se incumpla el SLA.
  8. Permitir reasignación automática cuando exista una regla autorizada.
  9. Registrar el momento en que comienza y termina cada etapa.
  10. Calcular tiempos de espera y tiempos efectivos de atención.
  11. Excluir periodos suspendidos cuando la política lo permita.
  12. Evitar que tareas finalizadas continúen generando alertas.
  13. Controlar la ejecución repetida de los procesos de revisión de vencimientos mediante temporizadores GAS.
- **Comportamiento Esperado:**
  Los procesos deben poder supervisarse mediante plazos configurables. Una tarea vencida debe identificarse y generar las acciones de escalamiento establecidas.
  Los temporizadores deben tolerar retrasos de ejecución propios de los activadores y no asumir que una tarea programada se ejecuta exactamente en el segundo previsto.
- **Criterios de Aceptación:**
  - [ ] Configurar un SLA para una etapa de trámite.
  - [ ] Crear una tarea con vencimiento asignado.
  - [ ] Comprobar emisión de recordatorios preventivos.
  - [ ] Simular vencimiento de plazo y verificar escalamiento automático.
  - [ ] Completar la tarea antes del vencimiento y verificar que no se generen alertas posteriores.
  - [ ] Ejecutar dos veces el proceso de revisión periódica y comprobar que no se duplican los escalamientos.
- **Estado:** [ ] Pendiente

<!-- Fuente: RECUPERACION/Pendientes_RECUPERADO.md, líneas 9072-9103; clave TASK-228; asignación única: Dirección -->

---

<!-- ID: TASK-228 | Fuentes: Pendientes.md ; pendientes/Dirección/Pendientes.md -->
### [ ] [TASK-228] [P1] [Seguridad y Roles - Delegación Temporal de Aprobaciones Integrada con los Workflows]
- **Componentes Afectados:**
  - `backend/user-service/Code.gs`
- **Dependencias Expuestas:** `F23-Task01`, `F23-Task09`.
- **Capacidades Relacionadas:** F23-007.
- **Problema Detectado:**
  Existe una implementación parcial de delegación, pero no se ha integrado de manera completa con las asignaciones y etapas activas de los procesos.
- **Requisitos Funcionales:**
  1. Permitir delegar temporalmente responsabilidades de aprobación por ausencia o vacaciones.
  2. Definir fecha y hora de inicio y finalización de la delegación.
  3. Permitir establecer el alcance por tipo de operación, monto o departamento.
  4. Identificar al responsable titular original y al usuario delegado.
  5. Validar que el delegado tenga los permisos institucionales necesarios para asumir la responsabilidad.
  6. Aplicar la delegación a las etapas pendientes correspondientes en la bandeja unificada.
  7. Registrar las decisiones tomadas por el delegado diferenciando claramente su identidad de la responsabilidad titular.
  8. Permitir revocar anticipadamente una delegación activa.
  9. Impedir que una delegación vencida continúe autorizando decisiones.
  10. Evitar delegaciones circulares o en cascada no autorizadas.
  11. Permitir configurar si la delegación incluye tareas ya asignadas o solamente tareas nuevas.
- **Comportamiento Esperado:**
  Durante una ausencia autorizada, las aprobaciones podrán continuar sin necesidad de modificar manualmente cada proceso configurado.
- **Criterios de Aceptación:**
  - [ ] Crear una delegación temporal con rango de fechas.
  - [ ] Comprobar la transferencia de autorizaciones a la bandeja del delegado.
  - [ ] Intentar delegar a un usuario sin privilegios suficientes y verificar el rechazo.
  - [ ] Revocar anticipadamente la delegación y comprobar el cese inmediato de privilegios.
  - [ ] Verificar que tras expirar la fecha fin, el delegado ya no puede autorizar trámites.
  - [ ] Consultar el historial de decisiones y comprobar que se identifican tanto el titular como el delegado.
- **Estado:** [ ] Pendiente

<!-- Fuente: RECUPERACION/Pendientes_RECUPERADO.md, líneas 9279-9324; clave TASK-235; asignación única: Dirección -->

---

<!-- ID: TASK-235 | Fuentes: AUDITORIAS/AUDITORIA_COMPLETADAS_TAREA-17.md ; Pendientes.md ; pendientes/Dirección/Pendientes.md -->
### [ ] [TASK-235] [P1] [Analítica Histórica - Motor de Tendencias y Series Históricas Académicas y Administrativas]
- Construir series por parcial, periodo y año lectivo desde calificaciones publicadas y atribuidas a dimensiones verificadas.
- Mantener comparabilidad de cohortes, escalas y planes curriculares; registrar cambios de fórmula o catálogo que afecten una serie.
- No rellenar puntos ausentes con cero ni conectar periodos no comparables; indicar huecos y tamaños de muestra.
- Habilitar comparativas por grado/sección/programa/idioma solo cuando el catálogo y las relaciones acrediten equivalencia.
- **Componentes Afectados:**
  - `backend/academic-service/Code.gs`
  - `backend/accounting-service/Code.gs`
  - `js/ui-common.js`
- **Dependencias Expuestas:** Diccionario de indicadores (`F24-Task02`), DataMart (`F24-Task05`), comparación financiera existente.
- **Capacidades Relacionadas:** F24-011, F24-012.
- **Problema Detectado:**
  Existe una proyección financiera semestral, pero faltan mecanismos equivalentes para analizar la evolución histórica de matrícula, calificaciones y otros indicadores institucionales.
- **Requisitos Funcionales:**
  1. Incorporar series temporales para indicadores académicos, financieros, administrativos y operativos.
  2. Permitir consultar:
     - Evolución de matrícula por ciclo lectivo y mes.
     - Evolución de tasas de aprobación y reprobación.
     - Evolución de promedios académicos generales y por área.
     - Evolución de asistencia y ausentismo.
     - Evolución de ingresos y egresos comparativos.
     - Evolución de morosidad institucional.
     - Evolución de volumen de trámites y tiempos promedio de resolución.
  3. Permitir comparar períodos equivalentes (ej. primer trimestre 2024 vs primer trimestre 2025).
  4. Mostrar variaciones absolutas y porcentuales relativas.
  5. Identificar máximos, mínimos y promedios en la serie.
  6. Permitir agrupar por mes, trimestre, semestre y año, cuando corresponda.
  7. Diferenciar períodos completos e incompletos con marcas visibles.
  8. Permitir visualizar valores en gráficos interactivos y tablas numéricas estructuradas.
  9. Mantener la definición histórica del indicador según su versión en la fecha evaluada.
  10. Incorporar acceso al detalle de los datos que componen un punto de la serie cuando los permisos lo permitan.
- **Cambios Necesarios:**
  - Integrar los indicadores analíticos con las estructuras del DataMart.
  - Incorporar endpoints de consulta de series temporales (`getTimeSeriesAnalytics`).
  - Extender la comparación existente para que pueda utilizarse también en indicadores académicos y administrativos.
  - Incorporar visualizaciones gráficas y selectores de período en los paneles de control.
- **Comportamiento Esperado:**
  El usuario podrá seleccionar un indicador y consultar cómo ha evolucionado a través de distintos períodos. Podrá identificar cambios, comparar años lectivos y examinar los valores que componen cada resultado.
- **Criterios de Aceptación:**
  - [ ] Los valores de la serie temporal coinciden con los informes individuales de cada período.
  - [ ] Los períodos aparecen presentados en estricto orden cronológico.
  - [ ] Los períodos sin datos se identifican claramente y no se convierten arbitrariamente en ceros.
  - [ ] Los cambios de fórmula se identifican en la serie histórica.
  - [ ] Los porcentajes de variación utilizan una base matemática válida sin errores por división por cero.
  - [ ] Los valores representados en gráficos coinciden exactamente con los datos tabulares.
  - [ ] La comparación de períodos incompletos presenta una advertencia clara al usuario.
- **Estado:** [ ] Pendiente

- Incluir series académicas por parcial, año lectivo, área, asignatura, grado, sección, programa e idioma cuando la dimensión sea válida.
- Comparar solo períodos equivalentes; marcar períodos incompletos y no convertir ausencia de datos en cero.
- Los promedios por área/programa deben usar la definición y versión del indicador vigente para cada período y coincidir con el informe individual.

<!-- Fuente: RECUPERACION/Pendientes_RECUPERADO.md, líneas 9390-9448; clave TASK-238; asignación única: Dirección -->

---

<!-- ID: TASK-236 | Fuentes: Pendientes.md -->
### [ ] [TASK-236] BLOQUE 3. Informes exportables, personalizados y programados


---

<!-- ID: TASK-238 | Fuentes: Pendientes.md ; pendientes/Dirección/Pendientes.md -->
### [ ] [TASK-238] [P1] [Automatización - Programador Automático de Generación de Informes Calendarizados]
- **Componentes Afectados:**
  - `backend/user-service/Code.gs`
  - `backend/developer-service/Code.gs`
- **Dependencias Expuestas:** Catálogo (`F24-Task01`), permisos, exportador (`F24-Task08`), distribución (`F24-Task11`).
- **Capacidades Relacionadas:** F24-014, F24-018.
- **Problema Detectado:**
  No existe un mecanismo para calendarizar la generación automática de informes mediante procesos programados.
- **Requisitos Funcionales:**
  1. Permitir programar informes periódicos:
     - Diarios.
     - Semanales (día específico de la semana).
     - Mensuales (día del mes o primer/último día).
     - Trimestrales.
     - Semestrales.
     - Anuales (cierre de ciclo lectivo o fiscal).
  2. Configurar en cada programación:
     - Informe seleccionado.
     - Filtros aplicables.
     - Período dinámico de datos (ej. "mes anterior", "ciclo actual").
     - Frecuencia de ejecución.
     - Hora planificada.
     - Zona horaria de la institución.
     - Fecha de inicio de vigencia.
     - Fecha de finalización.
     - Formato de salida (PDF, CSV, XLSX).
     - Destinatarios autorizados.
  3. Permitir pausar, reanudar, modificar y cancelar programaciones activas.
  4. Mantener un historial completo de ejecuciones programadas en hoja `HistorialInformesProgramados`.
  5. Registrar resultados satisfactorios, tiempos y volumen generado.
  6. Incorporar reintentos controlados con retroceso exponencial ante fallos temporales.
  7. Evitar ejecuciones duplicadas mediante marcas de exclusión mutua.
  8. Permitir programaciones institucionales y personales según los permisos asignados.
  9. Revalidar los permisos del destinatario y del creador antes de generar cada informe.
  10. Gestionar cambios en los permisos del creador o de los destinatarios (desactivar si el creador pierde privilegios).
  11. Permitir programaciones de informes personalizados cuando estén formalmente autorizadas.
- **Cambios Necesarios:**
  - Incorporar almacenamiento de programaciones en hoja `ProgramacionInformes`.
  - Implementar un mecanismo de ejecución mediante activadores temporales Apps Script (`Time-driven triggers`).
  - Integrar el programador con los servicios de generación y exportación de informes.
  - Incorporar control de estados de ejecución y política de reintentos.
  - Registrar cada ejecución en las bitácoras de auditoría institucional.
  - Evitar depender de una única ejecución prolongada fraccionando envíos en colas asíncronas.
- **Comportamiento Esperado:**
  Una programación activa generará el informe en la fecha y frecuencia configuradas. Si falla, quedará registrada y podrá reintentarse sin producir duplicaciones.
  Las programaciones deben continuar funcionando de manera controlada aunque el usuario creador deje de tener acceso.
- **Criterios de Aceptación:**
  - [ ] Una programación válida ejecuta y genera el informe en la frecuencia configurada.
  - [ ] La zona horaria institucional se respeta estrictamente en los disparos.
  - [ ] Pausar o cancelar una programación impide inmediatamente nuevas ejecuciones.
  - [ ] Las ejecuciones fallidas quedan registradas con causa detallada y alerta.
  - [ ] Los reintentos automáticos no duplican informes ni envían correos repetidos.
  - [ ] Los permisos de acceso a los datos se comprueban nuevamente en cada ejecución calendarizada.
  - [ ] Una programación no distribuye datos a destinatarios que hayan perdido autorización.
  - [ ] El historial permite identificar cada ejecución histórica, fecha y estado final.
- **Estado:** [ ] Pendiente

<!-- Fuente: RECUPERACION/Pendientes_RECUPERADO.md, líneas 9500-9562; clave TASK-241; asignación única: Dirección -->

---

<!-- ID: TASK-241 | Fuentes: Pendientes.md ; pendientes/Dirección/Pendientes.md -->
### [ ] [TASK-241] [P1] [Cuadros de Mando - Integración y Ampliación de Paneles Institucionales por Rol]
- **Componentes Afectados:**
  - `backend/accounting-service/Code.gs`
  - `backend/academic-service/Code.gs`
  - `backend/user-service/Code.gs`
  - `js/ui-common.js`
  - `app/html/dashboards/dynamic-dashboard.html`
- **Dependencias Expuestas:** Catálogo (`F24-Task01`), diccionario (`F24-Task02`), filtros (`F24-Task03`), series históricas (`F24-Task07`), metas (`F24-Task12`).
- **Capacidades Relacionadas:** F24-009, F24-010, F24-023.
- **Problema Detectado:**
  Existen paneles y servicios analíticos por área, pero falta una integración gráfica global que permita consultar los indicadores de manera coherente desde un espacio institucional unificado.
- **Requisitos Funcionales:**
  1. Integrar los paneles existentes en una experiencia de usuario institucional unificada.
  2. Mantener vistas diferenciadas según el perfil operativo:
     - Dirección y Rectoría.
     - Coordinación Académica.
     - Administración y Contabilidad.
     - Secretaría General.
     - Docentes.
  3. Permitir que cada panel departamental presente:
     - Indicadores principales en tarjetas de resumen (KPI cards).
     - Comparaciones temporales y variaciones.
     - Gráficos de tendencias históricas.
     - Seguimiento de metas institucionales.
     - Alertas tempranas activas.
     - Enlaces directos hacia los informes detallados correspondientes.
  4. Permitir configurar los widgets visibles cuando el usuario tenga autorización administrativa.
  5. Permitir organizar y ordenar los widgets sin alterar las definiciones semánticas de los indicadores.
  6. Conservar las preferencias individuales de visualización por usuario en almacenamiento local.
  7. Permitir filtros globales en el panel (por período, grado, sección) que se apliquen simultáneamente a los widgets compatibles.
  8. Permitir abrir el detalle de cualquier indicador haciendo clic sobre su tarjeta o gráfico.
  9. Mantener los filtros activos al navegar desde un widget hacia su informe detallado correspondiente.
  10. Mostrar visiblemente la fecha y hora de la última actualización de datos en cada indicador.
  11. Gestionar estados de carga, ausencia de datos y errores por widget de forma aislada e independiente.
  12. Mantener un diseño totalmente adaptable a dispositivos móviles y pantallas táctiles (Tailwind CSS responsivo).
- **Requisitos Específicos por Perfil:**
  - **Dirección / Rectoría:** Matrícula total y evolución, retención y permanencia, rendimiento académico general, tasa de asistencia institucional, ingresos y egresos consolidados, ejecución presupuestaria global, cumplimiento de metas institucionales y alertas críticas.
  - **Coordinación Académica:** Tasas de aprobación y reprobación, promedios por grado y sección, ausentismo recurrente, asignaturas con bajo rendimiento relativo, alertas tempranas pedagógicas y avance de planificaciones docentes.
  - **Contabilidad / Administración:** Ingresos confirmados por caja y bancos, egresos devengados, cuentas por cobrar y por pagar, índice de morosidad, antigüedad de saldos, flujo de caja proyectado y ejecución presupuestaria por categoría.
  - **Secretaría:** Matrícula por ciclo lectivo, estado de expedientes de estudiantes, trámites y solicitudes pendientes, trámites resueltos, tiempos promedio de atención y movimientos de matrícula (traslados y reincorporaciones).
  - **Docentes:** Promedios de sus asignaturas asignadas, distribución de calificaciones en sus secciones, asistencia de sus alumnos, estudiantes en riesgo pedagógico y evaluaciones pendientes de calificación.
- **Cambios Necesarios:**
  - Integrar los servicios analíticos existentes en endpoints de dashboards consolidados.
  - Adaptar el motor de dashboard dinámico (`dynamic-dashboard.html`) para consumir el catálogo de indicadores.
  - Incorporar configuración de widgets por perfil en metadatos del sistema.
  - Integrar barra de filtros globales de panel.
  - Implementar navegación contextual desde widgets hacia el visor modal de informes (`displayReportModal`).
  - Conservar y reforzar los controles de ámbito y permisos RBAC/ABAC existentes en el backend.
- **Comportamiento Esperado:**
  Cada usuario accederá a un panel adaptado a sus responsabilidades. Los indicadores serán coherentes con los informes y permitirán profundizar en los resultados sin perder el contexto.
- **Criterios de Aceptación:**
  - [ ] Cada perfil institucional visualiza únicamente los widgets e indicadores correspondientes a sus permisos.
  - [ ] Los valores numéricos de los indicadores en el panel coinciden exactamente con sus informes correspondientes.
  - [ ] Los filtros globales del panel actualizan simultáneamente todos los widgets compatibles.
  - [ ] Los enlaces hacia detalles de indicadores conservan íntegros los filtros aplicados en el panel.
  - [ ] Los widgets que experimenten un error de datos no bloquean ni afectan a los demás widgets independientes.
  - [ ] La fecha y hora de actualización es claramente visible para el usuario en cada tarjeta.
  - [ ] Las preferencias individuales de ordenamiento no modifican las vistas de otros usuarios.
  - [ ] Los usuarios no pueden agregar ni visualizar widgets que expongan información fuera de su ámbito autorizado.
- **Estado:** [ ] Pendiente

<!-- Fuente: RECUPERACION/Pendientes_RECUPERADO.md, líneas 9851-9903; clave TASK-249; asignación única: Dirección -->

---

<!-- ID: TASK-249 | Fuentes: Pendientes.md ; pendientes/Dirección/Pendientes.md -->
### [ ] [TASK-249] [P1] [Reportes Personalizados - Implementar Persistencia de Vistas y Configuraciones Personalizadas de Reportes]
- **Componentes Afectados:**
  - `backend/user-service/Code.gs`
  - `backend/accounting-service/Code.gs`
  - `backend/academic-service/Code.gs`
  - Hoja `VistasPersonalizadasReportes`
  - `js/ui-common.js`
- **Subcapacidad Relacionada:** F26-008.
- **Estado de Partida:** Implementada parcialmente.
- **Dependencias Expuestas:** Reportes institucionales existentes, permisos, catálogos de campos y almacenamiento de preferencias.
- **Problema Detectado:**
  Existen definiciones de reportes institucionales, pero falta persistencia de vistas personalizadas por usuario. Los usuarios necesitan conservar sus configuraciones de consulta sin tener que reconstruir filtros, columnas, ordenamientos y agrupaciones cada vez que acceden a un reporte.
- **Requisitos Funcionales:**
  1. Configuración de vistas analíticas:
     - Permitir personalizar reportes mediante: selección de columnas visibles, orden de columnas, filtros aplicados, ordenamiento ascendente/descendente, agrupaciones por categorías, totales y subtotales, períodos de consulta, criterios de búsqueda y opciones de exportación.
  2. Guardado y reutilización:
     - Guardar vistas personalizadas con nombre descriptivo y notas.
     - Modificar, duplicar, establecer como predeterminada (`defaultView`) o eliminar vistas propias.
     - Recuperar la configuración predeterminada institucional con un clic.
     - Compartir vistas con usuarios o roles autorizados.
     - Diferenciar formalmente: vistas personales, vistas compartidas departamentales y plantillas institucionales oficiales.
  3. Permisos y seguridad estricta:
     - Una vista guardada no debe ampliar jamás los permisos del usuario.
     - El servidor debe validar en cada ejecución: acceso al reporte, acceso a cada campo incluido, ámbito del usuario (grado/sección/departamento) y permisos de exportación.
     - Si un usuario pierde acceso a un campo utilizado en una vista guardada, advertir y omitir el campo sin exponer datos restringidos.
  4. Compatibilidad ante modificaciones de esquema:
     - Si un campo del reporte original cambia o se elimina, no ejecutar consultas fallidas silenciosas; advertir al usuario y permitir adaptar la vista guardada.
  5. Rendimiento y presentación:
     - Aplicar filtros y ordenamientos en servidor; mantener paginación y mostrar estados de carga sin bloquear la interfaz.
- **Cambios Necesarios:**
  - Crear hoja `VistasPersonalizadasReportes` en backend.
  - Implementar endpoints en backend (`saveReportView`, `getReportViews`, `deleteReportView`).
  - Asociar vistas con `userId`, `rol` y ámbito departamental.
  - Integrar validaciones de permisos sobre campos guardados en las consultas de reportes.
  - Adaptar el visor modal de reportes (`modal-report-viewer`) para permitir seleccionar y guardar vistas.
- **Comportamiento Esperado:**
  Un usuario autorizado puede personalizar un reporte, guardar la vista y volver a ejecutarla posteriormente. La configuración permanece disponible sin modificar el reporte institucional original ni ampliar los permisos del usuario.
- **Criterios de Aceptación:**
  - [ ] Crear una vista con columnas, filtros y ordenamientos personalizados.
  - [ ] Guardarla y volver a cargarla posteriormente desde la lista de vistas guardadas.
  - [ ] Ejecutar nuevamente el reporte y comprobar que conserva todos los criterios configurados.
  - [ ] Modificar una vista sin afectar otras vistas guardadas ni el reporte institucional original.
  - [ ] Duplicar y eliminar una vista verificando la correcta actualización del catálogo.
  - [ ] Comprobar que las vistas personales no son visibles para usuarios no autorizados.
  - [ ] Compartir una vista y comprobar que los destinatarios conservan sus propias restricciones de datos (RBAC).
  - [ ] Retirar el permiso de un campo y verificar que una vista que lo utiliza no expone información confidencial.
  - [ ] Modificar el esquema de un reporte y comprobar que las vistas incompatibles muestran una advertencia amigable.
  - [ ] Ejecutar reportes con muchos registros y comprobar que se aplican filtros y paginación correctamente.
  - [ ] Exportar una vista personalizada y comprobar que el resultado coincide exactamente con los filtros y columnas seleccionados.
- **Estado:** [ ] Pendiente

<!-- Fuente: RECUPERACION/Pendientes_RECUPERADO.md, líneas 10512-10538; clave TASK-275; asignación única: Dirección -->

---

<!-- ID: TASK-396 | Fuentes: Pendientes.md ; pendientes/Dirección/Pendientes.md -->
### [ ] [TASK-396] [P2] [Distribución de Carga - Asignación Automática y Reparto Equilibrado de Trabajo]
- **Componentes Afectados:**
  - `backend/user-service/Code.gs`
- **Dependencias Expuestas:** `F23-Task09`, `F23-Task11`.
- **Capacidades Relacionadas:** F23-022, F23-030, F23-004.
- **Problema Detectado:**
  La asignación de responsables depende de mecanismos manuales y no existe un sistema de distribución equilibrada de tareas.
- **Requisitos Funcionales:**
  1. Permitir definir grupos de responsables elegibles por departamento o rol.
  2. Distribuir tareas automáticamente mediante algoritmo Round-Robin.
  3. Incorporar criterios de carga de trabajo basados en tareas activas por usuario.
  4. Considerar tareas pendientes, vencidas y niveles de prioridad al balancear.
  5. Permitir establecer límites de tareas activas concurrentes por responsable.
  6. Excluir automáticamente a usuarios ausentes, con licencias, inactivos o sin permisos vigentes.
  7. Permitir establecer especialidades o áreas de competencia dentro del grupo.
  8. Permitir ponderar la carga según la complejidad del tipo de trámite.
  9. Registrar el criterio y algoritmo que determinó cada asignación en la bitácora.
  10. Permitir reasignaciones autorizadas por supervisores.
  11. Evitar que dos asignaciones simultáneas excedan los límites máximos de carga.
  12. Permitir que un supervisor modifique la asignación cuando exista una causa justificada.
- **Comportamiento Esperado:**
  Las tareas podrán asignarse automáticamente al responsable elegible con menor carga o siguiendo el criterio de distribución configurado.
- **Criterios de Aceptación:**
  - [ ] Distribuir varias tareas consecutivas mediante Round-Robin y verificar rotación equitativa.
  - [ ] Distribuir tareas considerando la carga actual de trabajo de los revisores.
  - [ ] Excluir de la asignación a un usuario marcado con licencia o inactivo.
  - [ ] Comprobar que se respetan los límites máximos de asignación concurrente.
  - [ ] Ejecutar asignaciones concurrentes y verificar que no se produzcan sobrecargas.
  - [ ] Consultar el registro de auditoría de asignación automática.
- **Estado:** [ ] Pendiente

<!-- Fuente: RECUPERACION/Pendientes_RECUPERADO.md, líneas 14206-14242; clave TASK-397; asignación única: Dirección -->

---

<!-- ID: TASK-397 | Fuentes: Pendientes.md ; pendientes/Dirección/Pendientes.md -->
### [ ] [TASK-397] [P2] [Analítica - Métricas, Analítica y Supervisión del Rendimiento de Procesos]
- **Componentes Afectados:**
  - `backend/user-service/Code.gs`
- **Dependencias Expuestas:** `F23-Task11`, `F23-Task13`.
- **Capacidades Relacionadas:** F23-027, F23-030, F23-012.
- **Problema Detectado:**
  No existe una herramienta suficientemente desarrollada para identificar cuellos de botella, medir tiempos de resolución y supervisar el rendimiento de los departamentos.
- **Requisitos Funcionales:**
  1. Calcular tiempo total de resolución de inicio a fin del trámite.
  2. Calcular tiempo promedio de atención por etapa.
  3. Calcular tiempos de espera en cola antes de ser tomado por el revisor.
  4. Calcular tiempos efectivos de atención activa.
  5. Medir porcentajes de cumplimiento de SLA por departamento y trámite.
  6. Identificar etapas y transiciones que concentran los mayores retrasos (cuellos de botella).
  7. Identificar responsables o departamentos con cargas excesivas o demoras recurrentes.
  8. Medir volúmenes de solicitudes recibidas, aprobadas, rechazadas, devueltas y pendientes.
  9. Permitir filtrar métricas por departamento, ciclo lectivo, tipo de operación y revisor.
  10. Mostrar tendencias históricas y evolución de tiempos de respuesta.
  11. Permitir comparar periodos académicos o meses de gestión.
  12. Identificar procesos que permanecen estancados o bloqueados por dependencias externas.
  13. Exportar resultados en formatos estructurados (CSV/JSON/PDF).
  14. Separar las métricas operativas de datos personales innecesarios para privacidad.
  15. Permitir configurar umbrales de alerta temprana por acumulación de trabajo.
- **Comportamiento Esperado:**
  La dirección y los responsables departamentales podrán identificar qué procesos tardan más, dónde se acumulan las tareas y qué áreas necesitan redistribución de responsabilidades.
- **Criterios de Aceptación:**
  - [ ] Generar procesos de prueba con diferentes tiempos de resolución.
  - [ ] Consultar el cuadro de mando de analítica de procesos y verificar la exactitud de los tiempos calculados.
  - [ ] Comparar rendimiento entre departamentos o etapas.
  - [ ] Filtrar indicadores por ciclo lectivo y tipo de trámite.
  - [ ] Identificar correctamente una etapa con cuello de botella simulado.
  - [ ] Exportar las métricas y comprobar su consistencia con los datos reales.
  - [ ] Verificar los controles RBAC sobre la visualización de analíticas departamentales.
- **Estado:** [ ] Pendiente

<!-- Fuente: RECUPERACION/Pendientes_RECUPERADO.md, líneas 14340-14370; clave TASK-401; asignación única: Dirección -->

---

<!-- ID: TASK-401 | Fuentes: Pendientes.md ; pendientes/Dirección/Pendientes.md -->
### [ ] [TASK-401] [P2] [Gobernanza - Mejora del Versionamiento y Compatibilidad de Definiciones de Workflow]
- **Componentes Afectados:**
  - `backend/user-service/Code.gs`
- **Dependencias Expuestas:** `FlujosAprobacion`, `F23-Task08`.
- **Capacidades Relacionadas:** F23-001, F23-031.
- **Problema Detectado:**
  El versionamiento secuencial de definiciones ya está implementado y verificado, pero necesita una administración más completa para soportar modificaciones estructurales y procesos en ejecución.
- **Requisitos Funcionales:**
  1. Conservar todas las versiones históricas publicadas de las definiciones de flujo.
  2. Permitir la comparación visual y estructural entre dos versiones de un mismo flujo (Diff de etapas y reglas).
  3. Identificar claramente adiciones, modificaciones y eliminaciones de etapas, responsables y compuertas.
  4. Permitir crear borradores de trabajo (`Borrador`) sin alterar el flujo activo en producción (`Publicado`).
  5. Ejecutar validaciones estructurales completas antes de autorizar la publicación de una nueva versión.
  6. Definir qué versión rige para las nuevas solicitudes iniciadas.
  7. Mantener vinculadas las instancias de trámites en curso a la versión exacta con la que fueron creadas.
  8. Permitir migraciones controladas de instancias activas hacia la nueva versión mediante procedimiento administrativo explícito.
  9. Registrar autor, fecha, hora y justificación de cada cambio de versión.
  10. Impedir que una actualización de configuración altere silenciosamente las reglas de trámites activos.
- **Comportamiento Esperado:**
  Las definiciones podrán evolucionar sin alterar las reglas que gobiernan las instancias que ya están en ejecución.
- **Criterios de Aceptación:**
  - [ ] Publicar una versión 1.0 de un flujo institucional.
  - [ ] Crear un borrador, modificar etapas y publicar la versión 2.0.
  - [ ] Comparar estructuralmente la versión 1.0 con la 2.0 e identificar diferencias.
  - [ ] Iniciar un trámite en v1.0 y otro en v2.0 y verificar que cada uno sigue su propia definición.
  - [ ] Comprobar que los trámites en curso en v1.0 no se ven afectados por la publicación de v2.0.
  - [ ] Ejecutar una migración controlada de prueba con autorización y verificar la actualización del puntero de versión.
- **Estado:** [ ] Pendiente

<!-- Fuente: RECUPERACION/Pendientes_RECUPERADO.md, líneas 14371-14426; clave TASK-402; asignación única: Dirección -->

---

<!-- ID: TASK-402 | Fuentes: Pendientes.md ; pendientes/Dirección/Pendientes.md -->
### [ ] [TASK-402] [P2] [Informes Personalizados - Constructor de Informes Personalizados y Plantillas Reutilizables]
- **Componentes Afectados:**
  - `backend/user-service/Code.gs`
  - `js/ui-common.js`
- **Dependencias Expuestas:** Catálogo de informes (`F24-Task01`), diccionario semántico (`F24-Task02`), filtros normalizados (`F24-Task03`), exportador (`F24-Task08`).
- **Capacidades Relacionadas:** F24-020, F24-001.
- **Problema Detectado:**
  No existe una interfaz que permita a los usuarios autorizados adaptar informes seleccionando columnas, agrupaciones y criterios de consulta.
- **Requisitos Funcionales:**
  1. Incorporar un constructor visual de informes para usuarios con privilegios analíticos.
  2. Permitir seleccionar:
     - Informe o fuente de datos de origen.
     - Columnas visibles disponibles.
     - Orden de las columnas en la tabla.
     - Filtros aplicables por defecto.
     - Criterios de agrupación (por grado, por departamento, por cuenta).
     - Criterios de ordenamiento ascendente o descendente.
     - Cálculo de totales y subtotales.
     - Campos de resumen e indicadores clave.
     - Formato de visualización tabular o gráfica.
  3. Permitir guardar configuraciones como informes personalizados persistentes.
  4. Permitir duplicar una configuración existente como punto de partida.
  5. Permitir editar, renombrar y eliminar configuraciones propias.
  6. Permitir compartir informes configurados con otros usuarios o roles autorizados.
  7. Diferenciar:
     - Informes personales (visibles solo al creador).
     - Informes compartidos departamentales.
     - Plantillas institucionales oficiales.
  8. Permitir configurar permisos específicos de consulta, edición, exportación y programación.
  9. Restringir los campos disponibles en el constructor según el perfil del usuario autenticado.
  10. Utilizar el diccionario semántico para seleccionar indicadores existentes, evitando duplicar fórmulas.
  11. Incorporar vista previa interactiva antes de guardar la plantilla.
  12. Permitir que una plantilla guardada vuelva a ejecutarse en cualquier momento con datos actualizados.
- **Cambios Necesarios:**
  - Incorporar una estructura persistente para guardar configuraciones de informes en hoja `InformesPersonalizadosConfig`.
  - Crear la interfaz de construcción y edición de informes en el frontend.
  - Implementar validación de campos y combinaciones permitidas en el servidor.
  - Integrar el constructor con el catálogo general y las definiciones de indicadores.
  - Incorporar permisos específicos para administración de informes personalizados.
- **Comportamiento Esperado:**
  Un usuario autorizado podrá adaptar un informe a sus necesidades sin solicitar una modificación del código. Podrá guardar su configuración y volver a utilizarla con nuevos períodos o filtros.
  El constructor no deberá permitir ejecutar consultas arbitrarias ni acceder a campos restringidos.
- **Criterios de Aceptación:**
  - [ ] Un usuario autorizado puede crear y guardar una configuración personalizada de informe.
  - [ ] La configuración se conserva íntegra al cerrar sesión y volver a abrir el informe.
  - [ ] Los filtros y columnas guardados se aplican correctamente en la consulta.
  - [ ] Los usuarios sin permisos de edición no pueden modificar plantillas institucionales oficiales.
  - [ ] Los campos restringidos o confidenciales no aparecen disponibles en el constructor.
  - [ ] Una configuración personalizada utiliza estrictamente las fórmulas centrales de los indicadores.
  - [ ] Duplicar un informe crea una copia independiente sin alterar el original.
  - [ ] Eliminar una configuración personal no afecta los datos fuente ni otros informes institucionales.
  - [ ] Los informes compartidos respetan los permisos de acceso asignados.
- **Estado:** [ ] Pendiente

<!-- Fuente: RECUPERACION/Pendientes_RECUPERADO.md, líneas 14427-14486; clave TASK-403; asignación única: Dirección -->

---

<!-- ID: TASK-403 | Fuentes: Pendientes.md ; pendientes/Dirección/Pendientes.md -->
### [ ] [TASK-403] [P2] [Gobierno Institucional - Sistema Institucional de Metas, Objetivos y Cumplimiento de Indicadores]
- **Componentes Afectados:**
  - `backend/developer-service/Code.gs`
  - `backend/accounting-service/Code.gs`
  - `backend/academic-service/Code.gs`
  - `js/ui-common.js`
- **Dependencias Expuestas:** Diccionario semántico (`F24-Task02`), series históricas (`F24-Task07`), paneles por rol (`F24-Task13`).
- **Capacidades Relacionadas:** F24-021, F24-008.
- **Problema Detectado:**
  No existe una estructura para registrar metas institucionales y comparar los resultados reales con los objetivos establecidos.
- **Requisitos Funcionales:**
  1. Incorporar un registro central de metas institucionales en hoja `MetasIndicadoresInstitucionales`.
  2. Permitir asociar cada meta con un indicador del diccionario semántico centralizado.
  3. Configurar en cada meta:
     - Nombre de la meta.
     - Descripción y justificación estratégica.
     - Indicador asociado (`indicadorId`).
     - Valor objetivo cuantitativo.
     - Unidad de medida correspondiente.
     - Período de evaluación (año lectivo, semestre, mes).
     - Área responsable (Académica, Financiera, Administrativa).
     - Departamento específico.
     - Usuario responsable asignado.
     - Fecha de inicio.
     - Fecha de finalización.
     - Estado (`Planificada`, `EnSeguimiento`, `Cumplida`, `NoCumplida`, `Cancelada`).
  4. Permitir definir metas institucionales globales, departamentales y académicas por grado/sección.
  5. Incorporar metas financieras cuando existan datos presupuestarios compatibles.
  6. Permitir consultar en tiempo real:
     - Valor objetivo planeado.
     - Valor actual alcanzado.
     - Diferencia absoluta y desvío.
     - Porcentaje de cumplimiento alcanzado.
     - Evolución del cumplimiento a lo largo del período.
  7. Mantener historial de modificaciones de metas y reajustes aprobados.
  8. Permitir establecer metas sucesivas por períodos continuos.
  9. Diferenciar formalmente metas alcanzadas, en curso, vencidas y aquellas sin datos suficientes.
  10. Restringir la creación, reajuste y eliminación de metas exclusivamente a perfiles autorizados (Dirección y Administrador).
- **Cambios Necesarios:**
  - Incorporar almacenamiento de metas en base de datos persistente.
  - Integrar las metas con las fórmulas del diccionario de indicadores.
  - Crear interfaz de configuración y seguimiento visual de metas (barras de avance y porcentajes).
  - Integrar resultados de cumplimiento en los paneles de control por rol.
  - Incorporar historial de auditoría para modificaciones de objetivos.
- **Comportamiento Esperado:**
  Dirección podrá definir objetivos institucionales y consultar su cumplimiento. Los responsables de cada área podrán consultar las metas correspondientes a sus departamentos.
  Los resultados se calcularán utilizando el indicador asociado, sin crear fórmulas paralelas.
- **Criterios de Aceptación:**
  - [ ] Una meta tiene un indicador, período y responsable claramente identificables.
  - [ ] El valor actual alcanzado coincide exactamente con el cálculo del indicador correspondiente.
  - [ ] El porcentaje de cumplimiento se calcula correctamente en base al objetivo.
  - [ ] Las metas vencidas se identifican y clasifican automáticamente.
  - [ ] Los cambios en los objetivos de una meta conservan su trazabilidad histórica de modificaciones.
  - [ ] Los usuarios sin permisos no pueden crear, alterar ni eliminar metas institucionales.
  - [ ] Los períodos sin datos operativos no generan porcentajes de cumplimiento ficticios.
  - [ ] Los cuadros de mando muestran de forma clara y fidedigna el progreso de las metas.
- **Estado:** [ ] Pendiente

<!-- Fuente: RECUPERACION/Pendientes_RECUPERADO.md, líneas 14487-14536; clave TASK-404; asignación única: Dirección -->

---

<!-- ID: TASK-405 | Fuentes: Pendientes.md ; pendientes/Dirección/Pendientes.md -->
### [ ] [TASK-405] [P2] [Eficiencia Operativa - Indicadores de Tiempos de Resolución y Eficiencia Administrativa]
- **Componentes Afectados:**
  - `backend/user-service/Code.gs`
- **Dependencias Expuestas:** Diccionario de indicadores (`F24-Task02`), filtros (`F24-Task03`), fuentes administrativas normalizadas (`F24-Task04`).
- **Capacidades Relacionadas:** F24-007, F24-008.
- **Problema Detectado:**
  Los informes administrativos permiten consultar trámites y movimientos, pero faltan métricas de tiempos de resolución y seguimiento de eficiencia operativa.
- **Requisitos Funcionales:**
  1. Incorporar indicadores cuantitativos para trámites y solicitudes institucionales:
     - Cantidad total de solicitudes recibidas en el período.
     - Cantidad de solicitudes actualmente pendientes de resolución.
     - Cantidad de solicitudes resueltas satisfactoriamente.
     - Cantidad de solicitudes que superaron el tiempo límite estipulado (vencidas).
     - Tiempo promedio de resolución (en horas y días hábiles).
     - Tiempo mediano de resolución para eliminar sesgos por valores atípicos.
     - Tiempo máximo registrado en un trámite resuelto.
     - Volumen de solicitudes atendidas por cada responsable individual.
     - Volumen de solicitudes procesadas por departamento institucional.
     - Porcentaje global de cumplimiento de plazos establecidos (SLA operativo).
  2. Diferenciar formalmente en el cálculo las fechas de creación, asignación, inicio de atención, resolución y cierre definitivo.
  3. Permitir filtrar las métricas por tipo de trámite, departamento, responsable y período de tiempo.
  4. Diferenciar solicitudes canceladas voluntariamente, rechazadas con justificación, reabiertas y completadas.
  5. Identificar solicitudes que han sufrido múltiples derivaciones o cambios de responsable.
  6. Permitir comparar tiempos de resolución entre períodos consecutivos.
  7. Integrar los resultados analíticos en los paneles de control de administración y dirección.
- **Cambios Necesarios:**
  - Identificar los registros que almacenan el ciclo de vida de los trámites (`SolicitudesTramites`, `RevisionesDecisionesTramite`).
  - Incorporar funciones de cálculo de duración y métricas de rendimiento en el backend.
  - Normalizar los estados incluidos y excluidos según las reglas semánticas.
  - Integrar los nuevos indicadores con el diccionario semántico centralizado.
  - Adaptar los informes administrativos existentes para presentar métricas de eficiencia.
- **Comportamiento Esperado:**
  La institución podrá conocer cuántos trámites se reciben, cuánto tardan en resolverse y qué departamentos acumulan solicitudes pendientes.
  Los tiempos deben calcularse a partir de eventos reales y no de fechas estimadas.
- **Criterios de Aceptación:**
  - [ ] El tiempo de resolución calculado coincide exactamente con la diferencia entre las fechas de inicio y finalización del trámite.
  - [ ] Los trámites aún no resueltos no se contabilizan erróneamente como resueltos o completados.
  - [ ] Las solicitudes canceladas y rechazadas se clasifican y contabilizan según las reglas documentadas.
  - [ ] Los trámites reabiertos conservan su trazabilidad e historial de tiempos acumulados.
  - [ ] Los promedios y medianas calculados corresponden estrictamente a los registros fuente analizados.
  - [ ] Los filtros por departamento y responsable aplican de forma fidedigna sobre los indicadores.
  - [ ] Los indicadores de eficiencia se presentan de manera coherente en informes y cuadros de mando.
- **Estado:** [ ] Pendiente

<!-- Fuente: RECUPERACION/Pendientes_RECUPERADO.md, líneas 14632-14675; clave TASK-407; asignación única: Dirección -->

---

<!-- ID: TASK-407 | Fuentes: Pendientes.md ; pendientes/Dirección/Pendientes.md -->
### [ ] [TASK-407] [P2] [Analítica de Riesgos - Detección de Anomalías en Indicadores Financieros y Operativos]
- **Componentes Afectados:**
  - `backend/accounting-service/Code.gs`
  - `backend/developer-service/Code.gs`
- **Dependencias Expuestas:** Indicadores centralizados (`F24-Task02`), DataMart (`F24-Task05`), tendencias (`F24-Task07`), alertas (`F24-Task14`).
- **Capacidades Relacionadas:** F24-A02, F24-022.
- **Problema Detectado:**
  La detección de riesgo está presente en el área académica, pero no existe una capacidad equivalente para identificar patrones inusuales en operaciones financieras y administrativas.
- **Requisitos Funcionales:**
  1. Incorporar motor de análisis de anomalías sobre indicadores y transacciones financieras y operativas.
  2. Evaluar y detectar automáticamente:
     - Gastos inusuales que superen en más de 2 desviaciones estándar el promedio histórico de la partida.
     - Variaciones abruptas o caídas imprevistas en los flujos diarios de ingresos.
     - Cambios atípicos en las tasas de morosidad por nivel o grado.
     - Desviaciones presupuestarias no justificadas en centros de costo.
     - Potenciales duplicaciones de pagos o movimientos con referencias o montos idénticos.
     - Incrementos inesperados en el volumen de requisiciones de materiales.
     - Acumulación anormal de solicitudes no atendidas en un área específica.
  3. Permitir configurar umbrales cuantitativos y reglas estadísticas de detección.
  4. Identificar con claridad el período, la partida y los valores de referencia que originaron la anomalía.
  5. Diferenciar formalmente anomalías detectadas por reglas fijas de aquellas basadas en análisis estadístico descriptivo.
  6. Permitir a los responsables revisar, justificar o descartar falsos positivos documentando la razón.
  7. Registrar en bitácora todas las revisiones y acciones correctivas tomadas.
  8. Evitar categorizar automáticamente una anomalía como fraude o irregularidad penal; debe tratarse estrictamente como una señal para revisión humana.
- **Cambios Necesarios:**
  - Extender los mecanismos analíticos del backend con algoritmos de detección de valores atípicos (outliers).
  - Integrar datos históricos del DataMart para calcular medias y varianzas de referencia.
  - Incorporar reglas estadísticas configurables en metadatos del servicio contable.
  - Crear una vista de auditoría y revisión de anomalías operativas en el panel de control.
  - Registrar los estados y dictámenes de revisión de anomalías en hoja de bitácora.
- **Comportamiento Esperado:**
  El sistema identificará variaciones que merecen revisión y ofrecerá información suficiente para que el responsable investigue su origen.
- **Criterios de Aceptación:**
  - [ ] Una variación que cumple con la regla de anomalía genera una bandera de advertencia en el sistema.
  - [ ] La ficha de anomalía presenta con transparencia el valor observado y los valores históricos de referencia.
  - [ ] Los falsos positivos pueden ser marcados como revisados y justificados por los auditores autorizados.
  - [ ] Las anomalías no disparan automáticamente bloqueos o sanciones irreversibles sin intervención humana.
  - [ ] Únicamente los usuarios con roles de supervisión o auditoría pueden consultar las banderas de anomalía.
  - [ ] El historial conserva íntegramente las revisiones, comentarios y resoluciones registradas.
  - [ ] Las reglas y umbrales de detección pueden ajustarse sin modificar el código fuente de los informes.
- **Estado:** [ ] Pendiente

<!-- Fuente: RECUPERACION/Pendientes_RECUPERADO.md, líneas 14676-14729; clave TASK-408; asignación única: Dirección -->

---

<!-- ID: TASK-408 | Fuentes: Pendientes.md ; pendientes/Dirección/Pendientes.md -->
### [ ] [TASK-408] [P2] [Informes Consolidados - Informes Institucionales Consolidados y Análisis Multidimensional]
- **Componentes Afectados:**
  - `backend/user-service/Code.gs`
  - `backend/accounting-service/Code.gs`
  - `backend/academic-service/Code.gs`
  - `js/ui-common.js`
- **Dependencias Expuestas:** Catálogo (`F24-Task01`), diccionario (`F24-Task02`), fuentes normalizadas (`F24-Task04`), DataMart (`F24-Task05`), exportador (`F24-Task08`).
- **Capacidades Relacionadas:** F24-A06, F24-A07, F24-001.
- **Problema Detectado:**
  Existen informes consolidados parciales, pero la integración entre áreas no está suficientemente extendida. La institución necesita informes ejecutivos que reúnan indicadores relacionados sin duplicar cálculos ni perder el origen de los datos.
- **Requisitos Funcionales:**
  1. Ampliar y formalizar los informes ejecutivos consolidados:
     - Resumen Ejecutivo Institucional (Rectoría).
     - Informe Consolidado de Matrícula y Retención.
     - Informe Integrado de Rendimiento Académico y Asistencia.
     - Informe Consolidado de Situación Financiera y Flujo de Fondos.
     - Informe de Ejecución Presupuestaria y Costos Operativos.
     - Informe Consolidado de Gestión de Expedientes y Movimientos.
     - Informe Integrado de Productividad y Trámites Administrativos.
  2. Permitir agrupar y desagregar los resultados consolidados por:
     - Período o ciclo lectivo.
     - Departamento institucional.
     - Nivel educativo.
     - Grado y sección.
     - Categoría financiera.
     - Usuario responsable.
  3. Permitir la comparación analítica entre unidades institucionales utilizando indicadores normalizados.
  4. Permitir visualizar indicadores de distintas áreas en una misma vista correlacionada (ej. asistencia vs rendimiento).
  5. Mantener claramente identificable la fuente de datos que respalda cada sección del informe.
  6. Evitar duplicar registros u operaciones al cruzar información de diferentes microservicios.
  7. Incorporar navegación interactiva hacia el detalle transaccional de cada sección del informe.
  8. Respetar estrictamente las barreras de permisos RBAC de cada área en los bloques consolidados.
  9. Permitir la exportación íntegra del informe consolidado en formatos estructurados y PDF formal.
- **Cambios Necesarios:**
  - Ampliar los servicios de generación de informes para orquestar consultas a múltiples dominios.
  - Integrar las llamadas con el diccionario semántico centralizado.
  - Utilizar las fuentes normalizadas y agregados del DataMart para minimizar el tiempo de respuesta.
  - Incorporar componentes de visualización multidimensional en la interfaz gráfica.
  - Integrar la navegación contextual hacia los informes específicos de cada área.
  - Adaptar el exportador universal para generar documentos consolidados con tablas múltiples.
- **Comportamiento Esperado:**
  Dirección podrá consultar un informe institucional que reúna los indicadores principales de diferentes áreas y profundizar en cada uno sin perder los filtros ni la trazabilidad.
- **Criterios de Aceptación:**
  - [ ] Cada indicador incluido en el informe consolidado conserva su definición institucional original.
  - [ ] Los datos consolidados coinciden exactamente con los informes individuales correspondientes de cada módulo.
  - [ ] No existen duplicaciones de registros ni conteos dobles derivados de la combinación de fuentes.
  - [ ] Las unidades comparadas utilizan criterios y períodos homogéneos.
  - [ ] Las vistas de detalle muestran únicamente la información que el usuario está autorizado a consultar.
  - [ ] Los fallos o retrasos en una fuente secundaria se identifican explícitamente sin enmascarar datos.
  - [ ] La exportación estructurada conserva fielmente la estructura matricial y los valores numéricos del informe.
- **Estado:** [ ] Pendiente

<!-- Fuente: RECUPERACION/Pendientes_RECUPERADO.md, líneas 15003-15068; clave TASK-415; asignación única: Dirección -->

---

<!-- ID: TASK-415 | Fuentes: Pendientes.md ; pendientes/Dirección/Pendientes.md -->
### [ ] [TASK-415] [P2] [Trazabilidad - Ampliación de la Trazabilidad y Consulta del Historial de Operaciones]
- **Componentes Afectados:**
  - `backend/accounting-service/Code.gs`
  - `backend/user-service/Code.gs`
  - Hojas `AuditoriaMigraciones`, `RegistroEventos`, `HistorialOperacionesIntegracion`
- **Estado de Partida:** Capacidad existente; ampliación y optimización.
- **Dependencias Expuestas:** F25-001, F25-004, F25-005, F25-006, F25-011 y F25-014.
- **Capacidades Relacionadas:** F25-018, F25-015, F25-001.
- **Problema que Resuelve:**
  La plataforma ya registra ejecuciones, errores y estados de importación. La mejora consiste en ofrecer trazabilidad más detallada y unificada de todas las operaciones externas, incluidas sincronizaciones, webhooks, exportaciones y conectores.
- **Requisitos Funcionales:**
  1. Registrar cada operación externa en hoja `HistorialOperacionesIntegracion` con:
     - Identificador de ejecución (`ejecucionId`).
     - Integración asociada (`integracionId`).
     - Tipo de operación (Importación, Exportación, Webhook, Sincronización).
     - Usuario o proceso automatizado responsable.
     - Fecha y hora exacta ISO.
     - Fuente de origen y destino.
     - Perfil y versión de mapeo utilizado.
     - Versión de plantilla o contrato aplicable.
     - Cantidad total de registros.
     - Cantidad de registros procesados con éxito.
     - Cantidad de registros fallidos.
     - Estado final de la operación.
     - Duración en milisegundos.
     - Errores y excepciones sanitizadas.
     - Número de reintentos realizados.
     - Referencia a operaciones relacionadas (`correlationId`).
  2. Filtros de consulta en historial:
     - Por integración.
     - Por usuario responsable.
     - Por rango de fechas.
     - Por tipo de operación.
     - Por estado final.
     - Por identificador de ejecución.
     - Por proveedor externo.
     - Por tipo de error.
  3. Detalle de ejecución: qué se intentó ejecutar, qué datos fueron procesados, qué registros fallaron y qué reintentos se realizaron.
  4. Seguridad: no almacenar contraseñas, tokens, números de tarjetas ni información personal sensible innecesaria en los registros de auditoría.
- **Cambios Necesarios:**
  1. Extender el esquema de registro para operaciones externas no cubiertas previamente.
  2. Relacionar todas las operaciones con `CatalogoIntegracionesExternas`.
  3. Incorporar referencias a perfiles de mapeo, plantillas y versiones de contrato.
  4. Unificar la consulta de historial (`getIntegrationOperationLogs`) sin eliminar los registros de `AuditoriaMigraciones`.
  5. Incorporar filtros de búsqueda y vista de detalle en la interfaz gráfica.
  6. Incorporar métricas de duración y tasas de éxito.
  7. Mantener el acceso restringido según rol operativo (RBAC).
- **Comportamiento Esperado:**
  Los administradores y auditores podrán consultar el historial unificado de intercambios de datos, identificar qué operaciones fallaron, por qué fallaron y qué reintentos se ejecutaron.
- **Criterios de Aceptación:**
  - [ ] Consultar una importación anterior y visualizar su detalle de filas y errores.
  - [ ] Consultar una exportación de datos y verificar metadatos registrados.
  - [ ] Consultar un webhook recibido verificando la transacción externa asociada.
  - [ ] Consultar una sincronización de datos con sus diferencias detectadas.
  - [ ] Filtrar operaciones por integración, estado y rango de fechas de forma fluida.
  - [ ] Identificar con precisión el usuario o proceso que inició cada operación.
  - [ ] Consultar los errores específicos de una ejecución sin ambigüedades.
  - [ ] Comprobar que los reintentos quedan debidamente vinculados a la operación original.
  - [ ] Verificar que los registros no exponen credenciales, tokens ni datos personales sensibles.
  - [ ] Comprobar que los registros históricos preexistentes siguen estando disponibles.
  - [ ] Verificar que los permisos RBAC limitan la consulta del historial exclusivamente a usuarios autorizados.
  - [ ] Comprobar que los resultados mostrados en el historial coinciden con las operaciones reales ejecutadas.
- **Estado:** [ ] Pendiente

<!-- Fuente: RECUPERACION/Pendientes_RECUPERADO.md, líneas 15235-15290; clave TASK-419; asignación única: Dirección -->

---

<!-- ID: TASK-419 | Fuentes: Pendientes.md ; pendientes/Dirección/Pendientes.md -->
### [ ] [TASK-419] [P2] [Supervisión - Mejoras de Administración y Supervisión Centralizada de Integraciones]
- **Componentes Afectados:**
  - `backend/developer-service/Code.gs`
  - `backend/accounting-service/Code.gs`
  - `js/ui-common.js`
- **Estado de Partida:** Mejora sobre catálogo y trazabilidad existentes.
- **Dependencias Expuestas:** F25-001, F25-015 y F25-018.
- **Capacidades Relacionadas:** F25-018, F25-001, F25-015.
- **Problema que Resuelve:**
  La plataforma cuenta con registros de migración y eventos, pero necesita una experiencia unificada para supervisar la salud de las conexiones y detectar operaciones que requieren intervención.
- **Requisitos Funcionales:**
  1. Incorporar un panel de control y supervisión de integraciones externas con indicadores clave:
     - Total de integraciones registradas en el catálogo.
     - Cantidad de integraciones activas y en línea.
     - Cantidad de integraciones desconectadas o suspendidas.
     - Cantidad de integraciones con errores recurrentes.
     - Operaciones pendientes de procesamiento en colas.
     - Operaciones completadas satisfactoriamente en el día.
     - Operaciones fallidas que requieren atención.
     - Fecha y hora de la última ejecución global.
     - Fecha y hora de la última ejecución satisfactoria.
     - Errores más frecuentes categorizados.
     - Tiempo promedio de ejecución por conector.
     - Volumen total de registros procesados en el período.
  2. Acceso directo al detalle de cada integración y a sus bitácoras de auditoría.
  3. Alertas operativas estructuradas ante:
     - Credenciales de pasarelas o servicios a punto de vencer.
     - Autorización o token revocado por servicio externo.
     - Fallos repetidos de conexión o timeouts de red.
     - Importaciones masivas interrumpidas sin reanudar.
     - Webhooks de pago recibidos y no procesados.
     - Sincronizaciones con desfase superior al umbral configurado.
     - Plantillas o esquemas detectados como incompatibles.
     - Consumo cercano a límites de cuotas de Apps Script / Google APIs.
     - Operaciones marcadas para revisión manual obligatoria.
  4. Diferenciar alertas críticas de advertencias meramente informativas.
- **Cambios Necesarios:**
  1. Implementar servicio de métricas de integraciones en `developer-service` (`getIntegrationsHealthMetrics`).
  2. Integrar datos de `CatalogoIntegracionesExternas`, `AuditoriaMigraciones` y `RegistroEventos`.
  3. Crear vista de supervisión en el panel de administración institucional.
  4. Incorporar evaluador de alertas de salud de integraciones.
  5. Implementar filtros por conector, severidad y estado operativo.
- **Comportamiento Esperado:**
  Los administradores podrán conocer de un vistazo el estado de salud de todas las conexiones institucionales, anticiparse a caídas de servicio y atender operaciones con fallos sin demoras.
- **Criterios de Aceptación:**
  - [ ] Consultar el estado general de las integraciones en el panel de supervisión.
  - [ ] Verificar que los indicadores de salud proceden de operaciones reales registradas.
  - [ ] Identificar de forma inmediata integraciones con errores o desconectadas mediante alertas visuales.
  - [ ] Consultar el detalle de errores específicos de una conexión con un solo clic.
  - [ ] Verificar que las alertas operativas corresponden a condiciones reales y no espurias.
  - [ ] Comprobar que una integración inactiva no se presenta falsamente como operativa.
  - [ ] Verificar que los usuarios solo consultan información y métricas acordes a su perfil RBAC.
  - [ ] Comprobar que los indicadores de salud se actualizan inmediatamente después de cada ejecución.
- **Estado:** [ ] Pendiente

<!-- Fuente: RECUPERACION/Pendientes_RECUPERADO.md, líneas 15296-15348; clave TASK-421; asignación única: Dirección -->

---

<!-- ID: TASK-421 | Fuentes: Pendientes.md ; pendientes/Dirección/Pendientes.md -->
### [ ] [TASK-421] [P2] [Historial y Recuperación - Centro de Historial, Comparación y Restauración de Configuraciones Críticas]
- **Componentes Afectados:**
  - `backend/user-service/Code.gs`
  - Hojas `ConfiguracionSistema`, `RegistroEventos`, `HistorialVersionesConfiguracion`
  - `js/ui-common.js`
- **Subcapacidades Relacionadas:** F26-011, F26-012.
- **Estado de Partida:** Protección e historial completos y verificados; falta la herramienta de restauración identificada en el backlog.
- **Dependencias Expuestas:** Versionado actual de `ConfiguracionSistema`, `RegistroEventos`, roles y permisos, motor de precedencia (`F26-Task01`) e invalidación reactiva (`F26-Task05`).
- **Problema que Resuelve:**
  La plataforma ya restringe la modificación de configuraciones globales, mantiene versiones y registra eventos. Sin embargo, no dispone de un procedimiento funcional completo para restaurar una versión anterior de un parámetro modificado erróneamente. Se requiere ampliar la trazabilidad existente para ofrecer recuperación controlada, sin sustituir el sistema de auditoría ni eliminar su historial.
- **Requisitos Funcionales:**
  1. Consulta del historial de configuraciones:
     - Vista administrativa filtrable por parámetro, categoría, ámbito, departamento, usuario, fecha y versión.
     - Mostrar valor anterior, valor nuevo, usuario responsable, fecha/hora, motivo de cambio y versión resultante.
  2. Comparación visual y estructural de versiones (Diff):
     - Seleccionar dos versiones históricas y visualizar diferencias: valores anteriores vs nuevos, cambios de tipo, cambios de ámbito, parámetros agregados o desactivados y dependencias afectadas.
     - Proteger y enmascarar valores sensibles (claves API, credenciales).
  3. Restauración controlada de versiones (`rollbackSystemConfiguration`):
     - Restaurar una versión anterior creando una nueva versión secuencial basada en el valor histórico seleccionado.
     - Conservar la versión actual en el historial sin eliminar versiones intermedias ni reescribir la auditoría.
     - Registrar quién solicitó y ejecutó la restauración, valor anterior y restaurado, fecha y justificación.
     - Validar permisos elevados (`Administrador`/`Director`) y dependencias antes de confirmar.
     - Mostrar advertencia de impacto y solicitar confirmación explícita.
  4. Restauración selectiva:
     - Permitir restaurar parámetros individuales o conjuntos relacionados validando compatibilidad entre valores.
  5. Protección de información histórica:
     - La restauración de una configuración no debe modificar retroactivamente registros académicos, financieros o administrativos creados bajo la configuración previa.
  6. Integración con permisos y caché:
     - Invalidar reactivamente cachés tras la restauración (`F26-Task05`) y registrar eventos estructurados en `RegistroEventos`.
- **Cambios Necesarios:**
  - Incorporar almacenamiento de historial detallado en `HistorialVersionesConfiguracion`.
  - Implementar endpoint en backend `rollbackSystemConfiguration`.
  - Crear interfaz de usuario para consulta, comparación visual y botón de restauración con modal de confirmación.
  - Integrar la restauración con el motor de precedencia e invalidación de caché.
- **Comportamiento Esperado:**
  Un administrador autorizado puede consultar versiones anteriores, comparar sus diferencias y restaurar una configuración seleccionada. La restauración genera una nueva versión y deja evidencia completa, sin borrar el historial ni alterar registros académicos o financieros existentes.
- **Criterios de Aceptación:**
  - [ ] Modificar un parámetro y comprobar que se registra la versión anterior y la nueva en el historial.
  - [ ] Consultar el historial y localizar la modificación con sus metadatos completos.
  - [ ] Comparar dos versiones y verificar que se muestran sus diferencias con claridad.
  - [ ] Restaurar una versión anterior y comprobar que el valor efectivo cambia de inmediato.
  - [ ] Verificar que la restauración crea una nueva versión secuencial y no elimina las posteriores.
  - [ ] Intentar restaurar con un usuario sin permisos y comprobar que la operación se rechaza.
  - [ ] Restaurar un parámetro departamental y comprobar que no afecta a otros departamentos.
  - [ ] Restaurar varios parámetros relacionados y comprobar que se validan sus dependencias antes de aplicar.
  - [ ] Simular una restauración incompatible y comprobar que se bloquea sin dejar cambios parciales.
  - [ ] Comprobar que los registros históricos académicos y financieros no se modifican retroactivamente.
  - [ ] Verificar que la restauración invalida las cachés afectadas de forma reactiva.
  - [ ] Comprobar que el historial identifica tanto la versión de origen como la nueva versión restaurada.
- **Estado:** [ ] Pendiente

<!-- Fuente: RECUPERACION/Pendientes_RECUPERADO.md, líneas 15502-15533; clave TASK-427; asignación única: Dirección -->

---

<!-- ID: TASK-427 | Fuentes: Pendientes.md ; pendientes/Dirección/Pendientes.md -->
### [ ] [TASK-427] [F28-T07] [P2] Optimización de Paneles Departamentales, Flujos de Trabajo y Accesos Rápidos Personalizados
- **Tipo:** Optimización Funcional y Productividad Operativa.
- **Componentes Afectados:**
  - `dashboards/` (`dashboard-docente.html`, `dashboard-estudiante.html`, `dashboard-contabilidad.html`, etc.)
  - `js/teacher.js`, `js/accounting.js`, `js/student.js`, `js/ui-common.js`
- **Subcapacidades Relacionadas:** P01, P02, P03, P04, M04.
- **Estado de Partida:** Implementada parcialmente.
- **Dependencias:** Sistema RBAC/ABAC de roles, paneles departamentales existentes.
- **Problema Detectado y Riesgos:**
  Aunque cada rol posee su panel respectivo, los usuarios deben navegar múltiples menús para realizar acciones repetitivas cotidianas (ej. pasar lista de la primera hora, registrar pagos de matrícula o consultar notas). No se trata de crear dashboards separados, sino de enriquecer los existentes con accesos rápidos personalizables y memoria de contexto de navegación.
- **Requisitos Funcionales y Técnicos Convergentes:**
  1. *Barra de Accesos Rápidos y Favoritos por Usuario:*
     - Permitir a cada usuario marcar secciones o formularios frecuentes como "Favorito" (icono de estrella accesible).
     - Presentar widget de accesos rápidos prioritarios en la cabecera del dashboard.
  2. *Priorización Inteligente por Departamento y Rol:*
     - *Docente:* Acceso rápido con un clic a "Pasar Asistencia del Día", "Ingreso Rápido de Calificaciones" y "Alertas de Rendimiento".
     - *Secretaría / Administración:* Acceso rápido a "Nuevo Expediente", "Emisión de Certificados CUV" y "Búsqueda Rápida de Alumnos".
     - *Dirección:* Acceso directo a "Indicadores de Asistencia Global", "Semáforo Financiero" y "Supervisión Docente".
     - *Contabilidad:* Acceso prioritario a "Registro de Cobro Rápido", "Aprobación de Comprobantes" y "Cierre de Caja".
     - *Estudiante / Familia:* Acceso inmediato a "Estado de Cuenta", "Boleta de Calificaciones" y "Tareas Pendientes".
  3. *Conservación de Contexto de Navegación:*
     - Recordar la última sección activa y filtros seleccionados (ej. grado, sección y período evaluativo) para que al recargar o regresar de un formulario, el usuario vuelva exactamente al contexto donde estaba trabajando.
  4. *Seguridad Estricta en Accesos:*
     - Los accesos rápidos o enlaces directos deben revalidar obligatoriamente los permisos y alcances del usuario en el servidor antes de renderizar la información, previniendo accesos indebidos por manipulación de parámetros.
- **Criterios de Aceptación:**
  - [ ] Los usuarios pueden agregar y eliminar accesos favoritos fácilmente.
  - [ ] Los accesos directos respetan en un 100% las restricciones de rol y departamento.
  - [ ] El contexto de búsqueda y filtros seleccionados se preserva durante la sesión de trabajo.
- **Estado:** [ ] Pendiente

<!-- Fuente: RECUPERACION/Pendientes_RECUPERADO.md, líneas 15602-15635; clave TASK-430; asignación única: Dirección -->

---

<!-- ID: TASK-471 | Fuentes: Pendientes.md ; pendientes/Dirección/Pendientes.md -->
### [ ] [TASK-471] [P3] [Consultas y Trazabilidad - Optimización de Consultas y Visualización del Historial de Procesos]
- **Componentes Afectados:**
  - `backend/user-service/Code.gs`
- **Dependencias Expuestas:** `RevisionesDecisionesTramite`, `F23-Task13`.
- **Capacidades Relacionadas:** F23-003, F23-020.
- **Problema Detectado:**
  El historial está completo y verificado, pero necesita optimización para consultas extensas y expedientes con numerosos eventos.
- **Requisitos Funcionales:**
  1. Implementar paginación en la consulta de historial de trámites (`getWorkflowHistory`).
  2. Permitir filtrar el historial por etapa, revisor, rango de fechas y tipo de decisión.
  3. Consultar y reconstruir el historial completo de un trámite distribuido entre múltiples particiones.
  4. Presentar con claridad decisiones, fechas, firmas y observaciones registradas.
  5. Separar observaciones públicas (visibles al solicitante) de observaciones internas reservadas.
  6. Permitir localizar el evento de auditoría original a partir de una tarea en la bandeja unificada.
  7. Mantener estricto orden cronológico en la línea de tiempo.
  8. Evitar consultas innecesarias a hojas de cálculo secundarias si no hay eventos registrados.
- **Criterios de Aceptación:**
  - [ ] Consultar expedientes con historiales extensos (> 50 eventos) y verificar paginación fluida.
  - [ ] Aplicar filtros combinados y verificar exactitud de los eventos devueltos.
  - [ ] Comprobar el orden cronológico estricto de las transiciones.
  - [ ] Verificar que los solicitantes no pueden visualizar observaciones internas marcadas como confidenciales.
  - [ ] Comprobar que la paginación no omite ni duplica eventos históricos.
- **Estado:** [ ] Pendiente


---

<!-- ID: TASK-687 | Fuentes: AUDITORIA_TASK-638_C1.293.md -->
### [ ] [TASK-687] Reparar los contratos API activos sin dispatcher
- **Hallazgo:** AUD-NG-358, MEDIO/P2.
- **Objetivo:** garantizar que las acciones del panel de desarrollador lleguen a un dispatcher y handler reales.
- **Archivos:** js/api.js, js/developer.js, backend/user-service/Code.gs, backend/academic-service/Code.gs.
- **Acción:** implementar o reenrutar USER:getBackupsList, USER:restoreSpreadsheetBackup, USER:runSystemMaintenance y ACADEMIC:exportSchoolYearArchive; revisar wrappers declarados sin consumidores antes de conservarlos.
- **Criterios:** cada llamada activa tiene dispatcher, handler y permiso; la identidad se deriva de la sesión; no se muestra éxito ficticio; errores y respuestas quedan documentados y probados.
- **Estado:** Pendiente.

---

<!-- ID: TASK-688 | Fuentes: AUDITORIA_TASK-638_C1.293.md -->
### [ ] [TASK-688] Completar handlers referenciados por los dispatchers
- **Hallazgo:** AUD-NG-359, ALTO/P1.
- **Objetivo:** eliminar referencias a funciones inexistentes y evitar escrituras con respuesta de error ambigua.
- **Archivos:** backend/user-service/Code.gs, backend/academic-service/Code.gs, backend/task-service/Code.gs.
- **Acción:** implementar o retirar purgeSecurityCaches, dispatchSecurityEvent, processSecurityEventQueue, getSecurityEventsQueue, generateInstitutionalReport y generateAcademicArchiveZip; hacer atómica o reanudable la actualización de manageAccountState y su evento.
- **Criterios:** ningún case llama un handler ausente; cada handler tiene permiso y persistencia definidos; un error no deja una escritura confirmada con respuesta fallida sin correlación; pruebas cubren fallos antes/después de persistir.
- **Estado:** Pendiente.

---

<!-- ID: TASK-690 | Fuentes: AUDITORIA_TASK-638_C1.293.md -->
### [ ] [TASK-690] Eliminar el secreto predecible del restablecimiento de contraseña
- **Hallazgo:** AUD-NG-361, CRÍTICO/P0 condicionado a ausencia de Script Property.
- **Objetivo:** impedir la falsificación de tokens de recuperación.
- **Archivos:** backend/user-service/Code.gs, Script Properties, requestPasswordRecovery/resetPassword.
- **Acción:** eliminar IMA-PORTAL-DEVELOPMENT-KEY-UNSECURE como fallback; requerir secreto aleatorio externo al repositorio y fallar cerrado si falta; rotar clave e invalidar tokens previos; introducir JTI/uso único y revocación.
- **Criterios:** sin secreto no se emiten ni aceptan tokens; token alterado/falsificado/expirado/reutilizado se rechaza; un token válido solo cambia la contraseña una vez; no se filtran secretos en logs/frontend.
- **Estado:** Pendiente.


===============================================================================
TAREAS DERIVADAS — AUDITORÍA TASK-639 / C1.302
===============================================================================

<!-- ID: TASK-691 | Fuentes: AUD-NG-374 / Auditoría/AUDITORIA_TASK-639_C1.302.md -->
### [ ] [TASK-691] Consolidar redefiniciones globales en microservicios
- **Hallazgo:** AUD-NG-374, MEDIO/P2.
- **Fase PM:** PM-02 — Arquitectura, datos, contratos y persistencia.
- **Archivos:** backend/task-service/Code.gs; backend/accounting-service/Code.gs; backend/user-service/Code.gs.
- **Objetivo:** eliminar definiciones globales desplazadas y conservar un único contrato/implementación por símbolo.
- **Acción:** reconciliar normalizeString, uploadChunk, manageTransportRoute, getIdempotencyPayloadSignature, getNews, getInstitutionalAnnouncements, createInstitutionalAnnouncement, submitAnnouncementReceiptConfirmation y getAnnouncementReadReport; conservar los comportamientos y validaciones más completos, y actualizar dispatchers/callers solo si el contrato lo requiere.
- **Dependencias:** verificar previamente los controles de identidad/autorización relacionados con TASK-636 y TASK-685; no retirar validaciones vigentes.
- **Criterios:** una sola definición global por símbolo; consumidores y contrato documentados; pruebas de regresión para cargas segmentadas, rutas, noticias, comunicados e idempotencia.
- **Estado:** Pendiente.

---

<!-- ID: TASK-692 | Fuentes: AUD-NG-375 / Auditoría/AUDITORIA_TASK-639_C1.302.md -->
### [ ] [TASK-692] Establecer propiedad única de handlers globales en dashboards
- **Hallazgo:** AUD-NG-375, MEDIO/P2.
- **Fase PM:** PM-02 — Arquitectura, datos, contratos y persistencia.
- **Archivos:** js/secretary.js; js/teacher.js; js/ui-common.js; dashboard-direccion.html; dashboard-secretaria.html y dashboards consumidores.
- **Objetivo:** eliminar colisiones de símbolos globales y la dependencia accidental del orden de carga.
- **Acción:** asignar propietario por handler; separar funciones compartidas de las específicas por rol; consolidar contrato común y revisar cada consumidor.
- **Criterios:** cada símbolo global tiene propietario único; Secretaría, Docente y Dirección invocan el handler correcto; pruebas por dashboard confirman ausencia de sobrescrituras.
- **Estado:** Pendiente.

---

<!-- ID: TASK-693 | Fuentes: AUD-NG-376 / Auditoría/AUDITORIA_TASK-639_C1.302.md -->
### [ ] [TASK-693] Formalizar contratos de helpers compartidos y guardas estáticas
- **Hallazgo:** AUD-NG-376, MEDIO/P2.
- **Fase PM:** PM-02 — Arquitectura, datos, contratos y persistencia.
- **Archivos:** backend/*/Code.gs; pruebas/reglas de arquitectura.
- **Objetivo:** evitar deriva entre helpers compartidos de servicios independientes y detectar regresiones de estructura.
- **Acción:** versionar contratos para autorización, sesión/HMAC, idempotencia, normalización y persistencia; incorporar análisis estático de redefiniciones globales y ciclos interservicio.
- **Dependencias:** TASK-691 y TASK-692; contratos de identidad/sesión PM-01.
- **Criterios:** propietario y versión contractual por servicio; divergencias intencionales documentadas; guardas distinguen duplicados del mismo ámbito, funciones locales y proyectos aislados; ciclos reales detectados con evidencia.
- **Estado:** Pendiente.


---

<!-- ID: TASK-694 | Origen: Solicitud de producto 2026-11-10; investigación en Auditoría/ARQUITECTURA_UNIVERSAL_MULTIINSTITUCIONAL_INVESTIGACION.md -->
### [X] [TASK-694] [P0] Especificar la arquitectura universal multiinstitucional y el modelo educativo P-20W
- **Objetivo:** definir arquitectura configurable para primera infancia, prebásica, básica, media, técnica, superior y formación continua, sin bifurcar código.
- **Alcance:** investigación SIS/LMS/primera infancia/superior y estándares; modelo tenant/institución/organización; separación de estructuras administrativa, académica, enseñanza y física; trayectoria longitudinal; seguridad/propiedad; configuración; perfiles; interoperabilidad; localización; privacidad; accesibilidad; subplan UNI-S01…UNI-S10.
- **Entregables:** Auditoría/ARQUITECTURA_UNIVERSAL_MULTIINSTITUCIONAL_INVESTIGACION.md; subplan en Plan Maestro; relaciones en MapaDependencias.
- **Tareas existentes reutilizadas:** TASK-153, TASK-060, F26-TASK01, TASK-506, TASK-171, TASK-668, AUD-NG-164, TASK-005, F8-TASK09, FASE2-T04 y F29-TASK17. No duplicar IDs/requisitos.
- **Exclusiones:** sin código, esquemas productivos, migraciones, datos, permisos reales o despliegues; no afirma equivalencia ni cumplimiento legal universal.
- **Criterios de aceptación:** [x] cobertura de niveles/plataformas/estándares; [x] separación tenant/institución/unidad; [x] estructuras separadas; [x] trayectoria longitudinal; [x] ownership y autorización contextual; [x] configuración/perfiles; [x] interoperabilidad/localización/privacidad/accesibilidad; [x] aprovisionamiento/migración/pruebas; [x] UNI-S01…S10 con dependencias/criterios; [x] unicidad verificada en fuentes legibles.
- **Prioridad:** P0. **Fase:** PM-02, diseño documental; no autoriza saltar puertas PM-01.
- **Estado:** [X] Completada — C1.404, solo investigación y diseño. UNI-S01…UNI-S10 no iniciadas.
- **Evidencia:** informe, subplan y commit C1.404.


---

<!-- ID: TASK-695 | Fuentes: solicitud de producto 2026-11-10; TASK-694; PLAN-IMA-001 -->
### [X] [TASK-695] [P0] Descomponer la arquitectura universal en 24 unidades funcionales con requisitos y criterios de aceptación
- **Tipo:** diseño/planificación documental PM-02; no equivale a implementación.
- **Objetivo:** convertir la arquitectura universal multiinstitucional P-20W en un plan ejecutable desde primera infancia hasta educación superior, con servicios administrativos y operativos.
- **Entregable:** Auditoría/PLAN-IMA-001_UNIDADES_FUNCIONALES.md y vínculo en Auditoría/ARQUITECTURA_UNIVERSAL_MULTIINSTITUCIONAL_INVESTIGACION.md.
- **Descomposición local:** UNI-U01…UNI-U24: tenants; organización; admisiones; primera infancia; expediente/trayectoria; calendario; formación técnica/superior; horarios; asistencia; LMS; evaluación; bienestar; familias; comunicación; finanzas estudiantiles; RR. HH.; ERP; biblioteca; transporte; documentos; analítica; integraciones; configuración/localización; gobierno/migración.
- **Requisitos mínimos:** objetivo/alcance; entidades/relaciones; reglas; roles/ámbitos; estados/vigencias; integridad/idempotencia; auditoría; dependencias; riesgos; interoperabilidad/accesibilidad/localización aplicables.
- **Criterios de aceptación:** cada unidad contiene requisitos y criterios observables; dependencias ordenadas; tareas equivalentes vinculadas; brechas marcadas como candidatas; no se crean IDs duplicados; problemas de usuario convertidos en estrategias; PM-00/PM-01 y fail-closed preservados.
- **Tareas existentes reutilizadas/ampliadas:** TASK-153, TASK-060, F26-TASK01, TASK-506, TASK-171, TASK-668, AUD-NG-164, TASK-005, FASE2-T04, F29-TASK17, TAREA-F5-002/005/007/008/010/011/012/013, F9-TASK03…12, F10/F11, TAREA-F7-IMP-01/02/04/06, TASK-023…027, TASK-029…036, TASK-051/071/072/077/084/086/091…108/129/131/153/159/161/167/173/193/195/196…209/212…217/227/235/263/269/275/276/285/286/288…318/344/345/357/367/382/384…391/397/406…408/415/422/424/432/438/488/506/517/521/522/527/533/534/548/552/553/555/605/613/614/617/668 y tareas F16/F18/F19/F20/F21/F22/F23/F24/F25/F29/F30/F31/F33/F34/F35/F37/F40.
- **Brechas candidatas:** U01 runtime tenant; U04 cuidado infantil; U07 créditos/degree audit/credenciales superiores; U10 LMS completo; U22 adaptadores OneRoster/Edu-API/LTI. U13 requiere ampliar relaciones familiares más allá de recogida en transporte. No crear IDs globales adicionales hasta comprobar código/backlogs.
- **Opiniones:** señales cualitativas de navegación lenta, clics excesivos, sincronización SIS/LMS frágil, discrepancias de notas, carga documental de primera infancia, mensajes fuera de horario, rutas inviables y costos de migración; estrategias/fuentes en el subplan.
- **Dependencias/riesgos:** TASK-694; PM-01/TASK-153; TASK-060/F26-TASK01; TASK-506/TASK-171/TASK-668; AUD-NG-164/TASK-005; FASE2-T04; F29-TASK17. Riesgo de duplicación o de generalizar opiniones aisladas; mitigación mediante matriz y validación institucional.
- **Alcance/exclusiones:** diseño y reconciliación documental; no modificar código, datos, esquemas, permisos, configuración, integraciones ni despliegue; no afirmar paridad con proveedores ni cumplimiento legal universal.
- **Prioridad:** P0. **Estado:** completada como entregable documental; UNI-U01…U24 sin iniciar.
- **Evidencia:** subplan, Plan Maestro §10.78, mapa de dependencias y checkpoint C1.405. Sin pruebas de producto.

---

<!-- ID: TASK-696 | Fuentes: AUD-NG-384; TASK-695/PLAN-IMA-001 UNI-U01 -->
### [ ] [TASK-696] [P0] Implementar registro y aislamiento runtime de tenants (UNI-U01)
- **Tipo:** implementación de arquitectura y seguridad, PM-02. No es una ampliación de la migración de roles ni de los ámbitos departamentales.
- **Objetivo:** establecer el tenant como frontera de seguridad verificable, con instituciones y sedes subordinadas, grupos opcionales y contexto explícito de tenant en sesión/API.
- **Requisitos:**
  1. Crear un registro de tenants con estado, país, zona horaria, módulos habilitados y relaciones tenant→instituciones→sedes; grupos/consorcios opcionales sin mezclar fronteras de seguridad.
  2. Resolver la membresía tenant del usuario desde una fuente autoritativa; emitir contexto firmado y revalidarlo en servidor. El tenant enviado por el cliente nunca autoriza por sí solo.
  3. Aplicar un guard transversal en USER, ACADEMIC, ACCOUNTING, TASK, EXAM y servicios adicionales; toda acción pública debe tener política tenant explícita.
  4. Enrutar persistencia por tenant y fallar cerrado ante tenant ausente, suspendido o partición no configurada; prohibido el fallback a un Spreadsheet global compartido.
  5. Aislar cachés, claves de idempotencia, locks, archivos, búsquedas, exports, jobs, colas, notificaciones y webhooks por tenant.
  6. Suspender un tenant bloquea nuevas operaciones sin borrar ni alterar su historia.
- **Criterios de aceptación:**
  - Dos tenants sintéticos con instituciones/sedes separadas pueden operar en el mismo entorno sin lectura, escritura, búsqueda, archivo, export o job cruzado.
  - Toda petición protegida exige contexto tenant derivado de sesión/membresía verificada; IDs/tenantIds/fileIds manipulados se rechazan fail-closed.
  - La pertenencia revocada, tenant suspendido o contexto caducado bloquea la operación; no se confía en requesterUserId/requesterRole ni en tenantId del payload.
  - Ningún resolver usa el Spreadsheet principal como fallback entre tenants; cada ruta devuelve tenant/procedencia y versión de esquema.
  - Cachés, idempotencia, archivos, exports, jobs y webhooks no colisionan ni filtran entre tenants.
  - Pruebas negativas y positivas reproducibles para dos tenants, roles, sedes, IDs directos, archivos, búsquedas, exports, jobs, suspensión y revocación; fixtures/rollback aislados.
- **Dependencias:** TASK-694 (diseño, completada); TASK-153/T153-S01 (PM-01, bloqueada por decisión institucional); F29-TASK17 (P0, Pendiente); F37-TASK10 (P1, Pendiente). Respetar todas las dependencias originales y el orden topológico.
- **Puertas:** no iniciar implementación hasta resolver PM-00/PM-01 y las dependencias anteriores. No inferir ownership ni migrar expedientes mientras TASK-153/T153-S01 siga bloqueada.
- **Alcance/exclusiones:** entorno sandbox y datos sintéticos; no acceder ni modificar datos productivos; no alterar el catálogo departamental ni sustituir tareas F29/F37 existentes.
- **Prioridad:** P0 / crítico. **Estado:** Bloqueada; registrada para PM-02, no elegible para ejecución.
- **Informe principal:** `Auditoría/AUDITORIA_UNI-U01_TENANT_RUNTIME_C1.406.md` (AUD-NG-384).


- **Avance C1.434:** TASK Service protege getSubmissionComments, addSubmissionComment y getSubmissionVersions mediante contexto de entrega/tarea derivado de sesión firmada y ResourceOwnership. Personal requiere propiedad y ámbito; estudiantes quedan limitados a su propia entrega; tutores a relaciones académicas verificadas; comentarios privados no se muestran a usuarios no staff y la autoría no se acepta desde el payload. Contrato sintético añadido; ejecución local y resultado CI pendientes de verificación. TASK-153 permanece En ejecución.


### Avance C1.441 — TASK-153 / AUD-NG-386 / EXAM
- `createExam` ahora exige sesión firmada y ámbito departamental autorizado; deriva el creador de claims y registra ResourceOwnership antes del examen/preguntas.
- Escritura protegida por ScriptLock y rollback compensatorio. Contratos locales y parseo PASS; GitHub Actions run 42870106305 PASS en ambos contratos EXAM. La prueba beta continúa Pendiente beta.
- **Estado:** TASK-153 En ejecución; AUD-NG-386 abierto. Siguiente subalcance: updateExam, updateExamStatus, deleteExam, gradeExamSubmission y deleteExamSubmission.
