# Migración histórica de tareas: Docente

> Fuente íntegra: `RECUPERACION/Pendientes_RECUPERADO.md`  
> Blob de origen: `ef47d232db3ed46317dc14f22b1cdf8f938e8405` (1.443.391 bytes; 17.884 líneas).  
> Registros asignados a este departamento: **30**.  
> Los bloques se reproducen sin reescritura; cada uno conserva encabezado, identificador, estado, descripción y criterios originales. Los comentarios indican su rango de origen.

**Criterio de asignación:** responsabilidad funcional principal. Si el alcance funcional es compartido, se aplica la jerarquía Dirección → Secretaria → Contabilidad → Docente → Estudiante → Otros. La infraestructura técnica transversal y las pruebas compartidas se asignan a Otros.

**Alcance:** archivo histórico de migración. Las tareas `AUD-NG` derivadas de auditoría no se duplican aquí; permanecen en sus informes conforme a `METODOLOGIA_DESARROLLO.md`, sección 3.4.

## Histórico completado F10/F11

<!-- Fuente: RECUPERACION/Pendientes_RECUPERADO.md, líneas 159-173; clave F11-Task08; asignación única: Docente -->
### [X] [F11-Task08] Desarrollar el sistema de alertas tempranas de rendimiento académico y deserción escolar
- **Origen del Hallazgo:** `AUDITORIA-FASE-11-COMUNICACION-BIENESTAR-SUPERVISION-FINANZAS.md` / Área II (P1)
- **Prioridad:** P1
- **Severidad/Clasificación:** Alta (Prevención de reprobación y deserción)
- **Archivos Involucrados:**
  - `backend/academic-service/Code.gs`
- **Dependencias Expuestas:** AlertasTempranas
- **Descripción del Alcance:**
  Evaluar métricas combinadas de ausentismo, reprobación parcial e incumplimiento de tareas para disparar alertas preventivas a coordinadores y orientadores.
- **Criterios de Aceptación:**
  - Las alertas de riesgo se generan según umbrales institucionales sin duplicar notificaciones activas.
- **Estado:** [X] Completado

---
---

<!-- Fuente: RECUPERACION/Pendientes_RECUPERADO.md, líneas 174-188; clave F11-Task09; asignación única: Docente -->
### [X] [F11-Task09] Completar la gestión de planificación pedagógica, jornalizaciones y guiones docentes
- **Origen del Hallazgo:** `AUDITORIA-FASE-11-COMUNICACION-BIENESTAR-SUPERVISION-FINANZAS.md` / Área III (P1)
- **Prioridad:** P1
- **Severidad/Clasificación:** Alta (Gestión pedagógica)
- **Archivos Involucrados:**
  - `backend/academic-service/Code.gs`
- **Dependencias Expuestas:** PlanificacionesPedagogicas
- **Descripción del Alcance:**
  Permitir el registro y estructuración de planes de clase, jornalizaciones y sílabos vinculados con grado, seccion, asignatura y período académico.
- **Criterios de Aceptación:**
  - Las planificaciones conservan versión, docente titular y competencias asociadas.
- **Estado:** [X] Completado

---
---

<!-- Fuente: RECUPERACION/Pendientes_RECUPERADO.md, líneas 300-315; clave F10-Task03; asignación única: Docente -->
### [X] [F10-Task03] Fortalecer el modelo de asistencia y su configuración institucional
- **Origen del Hallazgo:** `AUDITORIA_FASE_10_ASISTENCIA_DISCIPLINA_CONVIVENCIA.md` / Tarea 10.1 (P1)
- **Prioridad:** P1
- **Severidad/Clasificación:** Alta (Configuración institucional de asistencia)
- **Archivos Involucrados:**
  - `backend/academic-service/Code.gs`
  - `js/config.js`
- **Dependencias Expuestas:** RegistrosAsistencia, SesionesAsistencia y reglas de cómputo
- **Descripción del Alcance:**
  Incorporar o completar una configuración institucional de asistencia que permita definir modalidades de registro (diaria, por clase, por período), estados, códigos, categorías y reglas de cómputo de minutos/horas sin modificar el código fuente.
- **Criterios de Aceptación:**
  - La institución puede configurar códigos y reglas de cómputo de asistencia dinámicamente.
- **Estado:** [X] Completado

---
---

<!-- Fuente: RECUPERACION/Pendientes_RECUPERADO.md, líneas 316-331; clave F10-Task04; asignación única: Docente -->
### [X] [F10-Task04] Optimizar el registro masivo de asistencia y la gestión de sesiones
- **Origen del Hallazgo:** `AUDITORIA_FASE_10_ASISTENCIA_DISCIPLINA_CONVIVENCIA.md` / Tarea 10.2 (P1)
- **Prioridad:** P1
- **Severidad/Clasificación:** Alta (Optimización y registro masivo)
- **Archivos Involucrados:**
  - `backend/academic-service/Code.gs`
  - `js/teacher.js`
- **Dependencias Expuestas:** SesionesAsistencia, RegistrosAsistencia
- **Descripción del Alcance:**
  Permitir registrar la asistencia de un grupo completo en una sola vista, aplicar estados masivos, manejar guardado parcial, control de concurrencia y recuperación de sesiones interrumpidas.
- **Criterios de Aceptación:**
  - El registro de grupos numerosos es eficiente, no produce duplicados y permite reintentos seguros.
- **Estado:** [X] Completado

---
---

<!-- Fuente: RECUPERACION/Pendientes_RECUPERADO.md, líneas 348-363; clave F10-Task06; asignación única: Docente -->
### [X] [F10-Task06] Desarrollar un sistema avanzado de alertas de asistencia y seguimiento preventivo
- **Origen del Hallazgo:** `AUDITORIA_FASE_10_ASISTENCIA_DISCIPLINA_CONVIVENCIA.md` / Tarea F10-Task02 (P1) y Tarea 10.4
- **Prioridad:** P1
- **Severidad/Clasificación:** Alta (Comunicaciones, alertas y prevención de deserción)
- **Archivos Involucrados:**
  - `backend/academic-service/Code.gs`
  - `backend/user-service/Code.gs`
- **Dependencias Expuestas:** BandejaNotificaciones, CasosSeguimiento, RelacionesFamiliares
- **Descripción del Alcance:**
  Permitir configurar reglas de alerta por ausencias acumuladas, tardanzas repetidas y porcentajes de asistencia, notificar a tutores autorizados de forma configurable y evitar notificaciones duplicadas por reintentos.
- **Criterios de Aceptación:**
  - Las alertas de inasistencia se generan según umbrales configurados y se notifican a los tutores legales registrados.
- **Estado:** [X] Completado

---
---

<!-- Fuente: RECUPERACION/Pendientes_RECUPERADO.md, líneas 410-425; clave F10-Task10; asignación única: Docente -->
### [X] [F10-Task10] Completar el modelo funcional de orientación académica y vocacional
- **Origen del Hallazgo:** `AUDITORIA_FASE_10_ASISTENCIA_DISCIPLINA_CONVIVENCIA.md` / Tarea 10.9 (P1)
- **Prioridad:** P1
- **Severidad/Clasificación:** Alta (Orientación vocacional y proyectos de aprendizaje)
- **Archivos Involucrados:**
  - `backend/academic-service/Code.gs`
  - `backend/user-service/Code.gs`
- **Dependencias Expuestas:** ExpedientesEstudiantes, CasosSeguimiento
- **Descripción del Alcance:**
  Permitir a los orientadores diseñar planes de seguimiento académico, fijar metas de aprendizaje y registrar recomendaciones vocacionales sin alterar las notas oficiales ni matrículas.
- **Criterios de Aceptación:**
  - Los orientadores registran metas académicas e informes sin permisos de alteración de calificaciones oficiales.
- **Estado:** [X] Completado

---
---

## Backlog histórico TASK

<!-- Fuente: RECUPERACION/Pendientes_RECUPERADO.md, líneas 1596-1626; clave TASK-023; asignación única: Docente -->
### [TASK-023] [X] [F20-Task01] Implementación de funciones backend faltantes para biblioteca
- **Origen del Hallazgo:** `AUDITORIA_FASE_20_BIBLIOTECA_RECURSOS_EDUCATIVOS.md` / Sección E (Defecto 1), Sección G y Plan de Trabajo P0
- **Prioridad:** P0
- **Severidad/Clasificación:** Crítica (Funciones cableadas en enrutador doPost y ROLE_PERMISSIONS pero no declaradas, originando errores fatales de ejecución ReferenceError)
- **Archivos Involucrados:**
  - `backend/accounting-service/Code.gs` (nuevas funciones `reserveLibraryBook`, `getLibraryReservations`, `recordLibraryIncident`, `getLibraryIncidents`, `manageDigitalResource`, `getDigitalResources`)
  - `BibliotecaReservas`
  - `BibliotecaIncidencias`
  - `RecursosDigitalesBiblioteca`
- **Dependencias Expuestas:** `BibliotecaReservas`, `BibliotecaIncidencias`, `RecursosDigitalesBiblioteca`, `ROLE_PERMISSIONS`
- **Descripción del Alcance:**
  Los endpoints `reserveLibraryBook`, `getLibraryReservations`, `recordLibraryIncident`, `getLibraryIncidents`, `manageDigitalResource` y `getDigitalResources` están registrados en `ROLE_PERMISSIONS` y en el despachador `doPost` de `Code.gs`, pero no tienen ninguna implementación JavaScript en el backend. Cuando el frontend invoca cualquiera de estas acciones, el servidor arroja un error crítico de función no declarada.
  Requerimientos Funcionales Detallados:
  1. Implementación de Reservas y Listas de Espera:
     - `reserveLibraryBook`: registrar solicitudes de reserva en `BibliotecaReservas` (`ReservaID`, `EjemplarID`, `UserId`, `FechaSolicitud`, `FechaExpiracion`, `EstadoReserva`, `Observaciones`). Validar que el ejemplar se encuentre actualmente en préstamo y que el usuario no tenga ya una reserva activa para la misma obra.
     - `getLibraryReservations`: consultar y filtrar reservas por `userId`, `ejemplarId` o `estadoReserva` (`Pendiente`, `Asignada`, `Completada`, `Cancelada`, `Expirada`).
  2. Implementación de Incidencias y Daños Bibliotecarios:
     - `recordLibraryIncident`: registrar reportes de deterioro, pérdida o páginas rotas en `BibliotecaIncidencias` (`IncidenciaID`, `PrestamoID`, `EjemplarID`, `UserId`, `TipoIncidencia`, `Descripcion`, `Estado`, `Resolucion`, `Observaciones`). Si la incidencia es grave o pérdida, actualizar el estado del ejemplar a `damaged` o `lost` en `BibliotecaEjemplares`.
     - `getLibraryIncidents`: consultar y filtrar incidencias por ejemplar, usuario o estado.
  3. Implementación de Recursos Educativos Digitales:
     - `manageDigitalResource`: registrar o actualizar materiales en `RecursosDigitalesBiblioteca` (`RecursoID`, `Titulo`, `AutorColaboradores`, `Categoria`, `FormatoUrl`, `NivelPermisosJSON`, `Estado`, `Observaciones`). Validar formato y URL autorizada.
     - `getDigitalResources`: consultar recursos filtrando por categoría y nivel de permisos del usuario.
- **Criterios de Aceptación:**
  - Invocar desde el frontend o mediante API cualquiera de las 6 funciones y recibir una respuesta exitosa (`status: "success"`) con persistencia en su respectiva hoja.
  - Al reservar un libro prestado, se genera la reserva con fecha de expiración y orden de lista de espera.
  - Al reportar una incidencia de extravío, el libro deja de figurar como disponible en el catálogo.
  - La consulta de recursos digitales devuelve los materiales activos respetando los permisos del rol.
- **Estado:** [X] Completado

---
---

<!-- Fuente: RECUPERACION/Pendientes_RECUPERADO.md, líneas 1627-1652; clave TASK-024; asignación única: Docente -->
### [TASK-024] [X] [F20-Task02] Conexión y activación del módulo de Biblioteca en la interfaz institucional
- **Origen del Hallazgo:** `AUDITORIA_FASE_20_BIBLIOTECA_RECURSOS_EDUCATIVOS.md` / Sección E (Defecto 2), Sección G y Plan de Trabajo P0
- **Prioridad:** P0
- **Severidad/Clasificación:** Crítica (Código de frontend huérfano, falta de navegación en dashboards y operatividad de la interfaz)
- **Archivos Involucrados:**
  - `dashboard-contabilidad.html`
  - `dashboard-director.html`
  - `js/accounting.js` (`switchTab`, `renderBibliotecaModule`)
- **Dependencias Expuestas:** `js/accounting.js`, `dashboard-contabilidad.html`, `F20-Task01`
- **Descripción del Alcance:**
  La función `renderBibliotecaModule` está completamente codificada en `js/accounting.js` (con 5 subpestañas: Catálogo & Ejemplares, Préstamos, Reservas, Incidencias, Recursos Digitales), pero no existe el caso `else if (tab === 'biblioteca')` en la función `switchTab` de navegación ni existe un botón en `dashboard-contabilidad.html` para acceder a ella, dejando el módulo inaccesible para los operadores escolares.
  Requerimientos Funcionales Detallados:
  1. Habilitación de la pestaña en `dashboard-contabilidad.html`:
     - Agregar el botón de acceso visual "Biblioteca" con icono representativo (`fas fa-book-reader`) en la barra de navegación de módulos de contabilidad/administración.
  2. Enrutamiento en `switchTab`:
     - Incorporar en `window.switchTab` el bloque para ejecutar `renderBibliotecaModule(container)` cuando `tab === 'biblioteca'`.
  3. Conexión de subpestañas operativas:
     - Asegurar la interacción fluida entre las subpestañas (`libros`, `prestamos`, `reservas`, `incidencias`, `digitales`) con carga reactiva de datos del backend.
- **Criterios de Aceptación:**
  - Al hacer clic en el botón "Biblioteca" del dashboard, se despliega la interfaz del módulo sin errores de consola.
  - Se puede navegar entre las 5 subpestañas y cada una carga sus datos correspondientes desde Google Sheets.
  - Los formularios de registro y modales de préstamo operan de forma interactiva y notifican al usuario.
- **Estado:** [X] Completado

---
---

<!-- Fuente: RECUPERACION/Pendientes_RECUPERADO.md, líneas 1653-1679; clave TASK-025; asignación única: Docente -->
### [TASK-025] [X] [F20-Task03] Normalización relacional del catálogo: separación entre Obras y Ejemplares
- **Origen del Hallazgo:** `AUDITORIA_FASE_20_BIBLIOTECA_RECURSOS_EDUCATIVOS.md` / Sección E (Defecto 3), Sección C y Plan de Trabajo P0
- **Prioridad:** P0
- **Severidad/Clasificación:** Crítica (Normalización de datos bibliográficos, modelo FRBR/RDA y prevención de duplicidad de obras)
- **Archivos Involucrados:**
  - `backend/accounting-service/Code.gs` (`manageLibraryBook`, `getLibraryBooks`, nuevas funciones `manageBibliographicWork`, `getBibliographicWorks`)
  - Hoja `BibliotecaCatalogoObras`
  - `BibliotecaEjemplares`
  - `js/accounting.js`
- **Dependencias Expuestas:** `BibliotecaEjemplares`, `BibliotecaPrestamos`, `F20-Task01`
- **Descripción del Alcance:**
  La hoja `BibliotecaEjemplares` almacena en una sola fila el título, autor, ISBN y categoría junto con el identificador del ejemplar físico (`EjemplarID`). Si la biblioteca adquiere 10 copias de un mismo libro, se deben duplicar 10 veces todos los metadatos bibliográficos, provocando inconsistencias ante correcciones editoriales.
  Requerimientos Funcionales Detallados:
  1. Hoja maestra `BibliotecaCatalogoObras`:
     - Almacenar los metadatos bibliográficos de la obra: `ObraID`, `IsbnCodigo`, `Titulo`, `Subtitulo`, `AutoresJSON`, `Editorial`, `EdicionAno`, `Idioma`, `Categoria`, `MateriaAcademica`, `NivelEducativo`, `PortadaUrl`, `Descripcion`, `PalabrasClave`, `EstadoObra`.
  2. Reestructuración de `BibliotecaEjemplares`:
     - Almacenar las copias físicas individuales vinculadas a la obra: `EjemplarID`, `ObraID`, `CodigoBarrasQR`, `UbicacionFisica` (Edificio/Estante/Nivel), `CondicionFisica` (`Nuevo`, `Bueno`, `Deteriorado`), `EstadoDisponibilidad` (`available`, `on_loan`, `reserved`, `maintenance`, `lost`, `disposed`), `Observaciones`.
  3. Consultas consolidadas:
     - Al consultar una obra, mostrar la ficha bibliográfica única con el desglose de cuántos ejemplares existen en total, cuántos están disponibles en estantería y cuántos están prestados o en mantenimiento.
- **Criterios de Aceptación:**
  - Se puede registrar una obra bibliográfica una sola vez y asociarle múltiples ejemplares físicos independientes.
  - Modificar los datos de la obra (ej. corregir nombre de la editorial) actualiza la ficha global sin tocar los registros de préstamos de sus ejemplares.
  - Cada ejemplar físico mantiene su propio estado de disponibilidad y ubicación física aislada.
- **Estado:** [X] Completada

---
---

<!-- Fuente: RECUPERACION/Pendientes_RECUPERADO.md, líneas 1680-1708; clave TASK-026; asignación única: Docente -->
### [TASK-026] [X] [F20-Task04] Control de políticas de circulación, límites de préstamo y bloqueo por mora
- **Origen del Hallazgo:** `AUDITORIA_FASE_20_BIBLIOTECA_RECURSOS_EDUCATIVOS.md` / Sección E (Defecto 4), Sección C y Plan de Trabajo P0
- **Prioridad:** P0
- **Severidad/Clasificación:** Crítica (Políticas institucionales de circulación, límites por rol escolar y prevención de retención indebida de libros)
- **Archivos Involucrados:**
  - `backend/accounting-service/Code.gs` (`processLibraryLoan`, `getLibraryLoans`)
  - `BibliotecaPrestamos`
  - Hoja `BibliotecaPoliticasCirculacion`
- **Dependencias Expuestas:** `BibliotecaPrestamos`, `BibliotecaEjemplares`, `ROLE_PERMISSIONS`
- **Descripción del Alcance:**
  `processLibraryLoan` aplica una fecha fija de devolución a 7 días sin importar el perfil del usuario, y no valida cuántos libros tiene prestados actualmente, permitiendo que un alumno retire cantidades excesivas de material sin devolver los anteriores.
  Requerimientos Funcionales Detallados:
  1. Políticas de circulación configurables por rol:
     - Estudiante: máximo 2 libros simultáneos, período de préstamo de 7 días calendario.
     - Docente / Profesor: máximo 5 libros simultáneos, período de préstamo de 15 días calendario.
     - Personal Administrativo / Dirección: máximo 3 libros simultáneos, período de 15 días.
     - Obras de Referencia / Consulta en Sala (Diccionarios, enciclopedias): no prestables a domicilio (préstamo interno de 1 día).
  2. Validación y bloqueo preventivo:
     - Antes de conceder un nuevo préstamo, verificar cuántos préstamos activos (`on_loan`) mantiene el `userId`.
     - Si ha alcanzado el límite configurado para su rol, rechazar el préstamo informando el tope máximo permitido.
     - Si el usuario mantiene algún préstamo con fecha de devolución vencida no devuelto (`mora activa`), bloquear la emisión de nuevos préstamos hasta que regularice su situación.
- **Criterios de Aceptación:**
  - Un estudiante con 2 libros en préstamo intenta solicitar un 3º y el sistema rechaza la operación por límite de cupo alcanzado.
  - Un usuario con un libro vencido no puede recibir nuevos préstamos hasta devolver el material atrasado.
  - Un docente puede recibir hasta 5 libros con fecha de retorno configurada a 15 días.
- **Estado:** [X] Completada

---
---

<!-- Fuente: RECUPERACION/Pendientes_RECUPERADO.md, líneas 1709-1733; clave TASK-027; asignación única: Docente -->
### [TASK-027] [X] [F20-Task05] Control de concurrencia e idempotencia en circulación bibliotecaria
- **Origen del Hallazgo:** `AUDITORIA_FASE_20_BIBLIOTECA_RECURSOS_EDUCATIVOS.md` / Sección E, Sección F (PT-20-24, PT-20-25) y Plan de Trabajo P0
- **Prioridad:** P0
- **Severidad/Clasificación:** Crítica (Integridad transaccional, prevención de doble asignación de ejemplares y protección de reintentos)
- **Archivos Involucrados:**
  - `backend/accounting-service/Code.gs` (`processLibraryLoan`, `reserveLibraryBook`)
  - `BibliotecaPrestamos`
  - `BibliotecaEjemplares`
- **Dependencias Expuestas:** `LockService`, `BibliotecaPrestamos`, `BibliotecaEjemplares`
- **Descripción del Alcance:**
  Las operaciones de préstamo y reserva no utilizan candados de concurrencia. Si dos bibliotecarios intentan prestar el mismo ejemplar simultáneamente, o si un usuario reintenta la solicitud por lentitud de red, se pueden generar préstamos dobles sobre el mismo libro físico.
  Requerimientos Funcionales Detallados:
  1. Bloqueo transaccional atómico:
     - Adquirir candado de script (`LockService.getScriptLock()`) al inicio de `processLibraryLoan` y `reserveLibraryBook`.
     - Re-leer el estado más reciente del ejemplar en `BibliotecaEjemplares` para asegurar que continúa en estado `available`.
     - Si ya fue prestado por otra transacción milisegundos antes, liberar el candado y responder con error controlado.
  2. Claves de idempotencia:
     - Evitar que una doble pulsación de botón registre dos préstamos idénticos mediante clave única de operación (`ejemplarId + userId + fechaActual`).
- **Criterios de Aceptación:**
  - Dos solicitudes simultáneas sobre el mismo ejemplar resultan en un préstamo exitoso y un rechazo controlado.
  - Los reintentos de red no duplican las filas de préstamo en `BibliotecaPrestamos`.
- **Estado:** [X] Completada

---


<!-- Fuente: RECUPERACION/Pendientes_RECUPERADO.md, líneas 3568-3600; clave TASK-071; asignación única: Docente -->
### [TASK-071] [F29-Task05] [P0] Protección de Historiales Académicos y Conservación de Calificaciones Históricas
- **Orden de Ejecución:** 5
- **Prioridad:** P0 (Crítica)
- **Componentes Afectados:**
  - `backend/academic-service/Code.gs` (`calculateUnifiedAcademicGrade`, `generateStudentReportCard`, `importHistoricGradesBatch`)
  - Hojas: `CalificacionesEstudiantes`, `RecuperacionesEstudiante`, `HistorialAcademicoMigrado`
- **Subcapacidades Relacionadas:** F29-04, F29-06, F29-12.
- **Estado de Partida:** Requiere mejoras.
- **Dependencias Principales:** [F29-Task01], [F29-Task02], [F29-Task03].
- **Problema Detectado y Riesgos:**
  Las calificaciones históricas pueden importarse desde estructuras diferentes a las utilizadas actualmente (semestres, trimestres, notas finales anuales sin desglose). Si posteriormente se ejecutan los motores vigentes de cálculo académico, las notas podrían recalcularse con ponderaciones o reglas de 2024 que no corresponden al ciclo en que fueron generadas, alterando promedios y estados de aprobación pasados.
- **Requisitos Funcionales y Técnicos Convergentes:**
  1. *Marcado de procedencia histórica e inalterabilidad:*
     - Incorporar bandera obligatoria `esRegistroHistoricoMigrado: true`, `esquemaEvaluativoOrigen: string`, `formulaEquivalencia: string`.
  2. *Protección en motores de cálculo:*
     - Modificar `calculateUnifiedAcademicGrade` y `generateStudentReportCard` para que los registros con `esRegistroHistoricoMigrado === true` no sufran recálculo automático ni re-ponderación.
     - Conservar y desplegar la nota final original, promedios y estados de aprobación históricos (`Aprobado`, `Reprobado`, `Recuperación`).
  3. *Advisión de estructuras de evaluación heterogéneas:*
     - Permitir importar notas organizadas por semestres, trimestres, unidades o consolidadas anuales en `HistorialAcademicoMigrado`.
     - Conservar calificaciones finales cuando no exista desglose de parciales.
     - Prohibición de conversión automática de escalas sin regla explícita aprobada.
  4. *Protocolo de rectificaciones excepcionales:*
     - Exigir procedimiento autorizado para rectificaciones de notas históricas, registrando valor previo, nuevo valor, usuario autorizador y justificante formal.
- **Criterios de Aceptación:**
  - [ ] Una nota histórica migrada no cambia al modificar las ponderaciones del ciclo actual.
  - [ ] Se importan historiales semestrales y estructuras diferentes a las 4 parciales vigentes.
  - [ ] Los boletines reproducen exactamente los resultados y promedios históricos originales.
  - [ ] Las escalas diferentes se conservan o convierten únicamente mediante reglas explícitas aprobadas.
  - [ ] Las rectificaciones históricas quedan registradas y auditables.
- **Estado:** [ ] Pendiente

---
---

<!-- Fuente: RECUPERACION/Pendientes_RECUPERADO.md, líneas 4717-4778; clave TASK-105; asignación única: Docente -->
### [TASK-105] [F34-Task01] [P0] Unificación del ciclo de vida de las justificaciones de asistencia y sincronización con los registros académicos
- **Prioridad:** P0 (Crítica)
- **Orden de Ejecución:** 1 (Dependencia base para sincronización académica)
- **Componentes Afectados:**
  - `backend/user-service/Code.gs` (`submitStudentAbsenceJustification`, `reviewAbsenceJustification`, `updateRequestStatus`)
  - `backend/academic-service/Code.gs` (`submitAttendanceJustification`, `reviewAttendanceJustification`, `RegistrosAsistencia`, `SesionesAsistencia`, `JustificacionesAsistencia`)
  - Hojas de Cálculo: `SolicitudesTramites`, `JustificacionesAsistencia`, `RegistrosAsistencia`, `SesionesAsistencia`
- **Subcapacidades Relacionadas:** F34-01, F34-07, F34-12.
- **Origen del Hallazgo:** `AUDITORIA_FASE_34_BANDEJAS_REVISION_FIRMAS.md` / Sección C (F34-12), Matriz CAR-F34-03 y Especificación Técnica ChatGPT/Jules.
- **Problema Detectado y Riesgos:**
  Existen dos implementaciones independientes para presentar y revisar excusas estudiantiles:
  1. El servicio de usuarios registra solicitudes en `SolicitudesTramites`.
  2. El servicio académico registra justificaciones en `JustificacionesAsistencia` y es el único que actualiza `RegistrosAsistencia` (`Justificada = true`).
  Como consecuencia directa, una excusa aprobada desde el flujo administrativo en Secretaría puede no reflejarse en la asistencia académica, produciendo inconsistencias críticas entre la resolución administrativa y los registros que consultan los docentes, derivando en inasistencias injustificadas erróneas y sanciones académicas indebidas para el estudiante.
- **Requerimientos Funcionales y Técnicos Convergentes:**
  1. *Ciclo de vida unificado e inequívoco:*
     - Establecer un único ciclo de vida institucional para las justificaciones de asistencia, independientemente de la interfaz o departamento desde el que se presenten.
     - Mantener una relación relacional inequívoca entre:
       * Solicitud original (`solicitudId` / `justificacionId`).
       * Estudiante (`estudianteId` / `userId`).
       * Representante legal o tutor que la presentó.
       * Fechas y sesiones de asistencia afectadas (`fechaAusencia`, `periodo`).
       * Evidencias adjuntas (`adjuntoUrl`, hash criptográfico).
       * Revisiones y decisiones (`revisadoPor`, `observacionesAdmin`).
       * Resolución final (`EstadoRevision`).
       * Registros académicos actualizados (`RegistrosAsistencia`).
  2. *Sincronización académica atómica sin re-captura manual:*
     - La aprobación administrativa en `reviewAbsenceJustification` (o mediante `processWorkflowDecision`) debe producir automáticamente la actualización académica correspondiente en `RegistrosAsistencia` sin requerir que Secretaría vuelva a registrar manualmente la justificación en otro módulo.
     - La actualización debe afectar exclusivamente las fechas y sesiones comprendidas en la justificación aprobada.
     - En solicitudes que cubran varios días o períodos extendidos, identificar con precisión las sesiones de clase afectadas (`SesionesAsistencia`) y aplicar la justificación únicamente a las que correspondan.
  3. *Segregación estricta de estados y justificaciones parciales:*
     - Una solicitud en estado pendiente, observada o rechazada bajo ninguna circunstancia debe modificar los registros de asistencia como si estuviera aprobada.
     - Conservar en el modelo la distinción entre:
       * Justificación recibida.
       * Justificación en revisión.
       * Justificación aprobada.
       * Inasistencia justificada.
       * Inasistencia todavía pendiente de justificar.
     - Permitir resoluciones administrativas con *justificación parcial*, cuando solo algunas fechas o sesiones del rango solicitado hayan sido aceptadas y validadas por Secretaría.
  4. *Idempotencia, prevención de duplicados y reversibilidad:*
     - Evitar que una misma aprobación repetida actualice dos veces los mismos registros de asistencia.
     - Asegurar que la anulación, revocación o rechazo posterior de una justificación revierta coherentemente el estado de la asistencia a su condición original previa (`Inasistencia Injustificada`) sin borrar la evidencia histórica.
     - Registrar los resultados de la sincronización y registrar en log estructurado los fallos que impidan actualizar la asistencia.
     - Permitir reintentar una sincronización fallida sin duplicar registros ni alterar decisiones anteriores.
  5. *Parametrización configurable en plataforma:*
     - En caso de discrepancias entre políticas institucionales, incorporar en `ConfiguracionInstitucional`:
       * `JUSTIFICACION_IMPACTO_AUTOMATICO_ASISTENCIA`: Valores `INMEDIATO_AL_APROBAR_SECRETARIA` (por defecto) vs. `REQUIERE_CONFORMIDAD_PREVIA_DOCENTE`.
       * `PERMITIR_JUSTIFICACION_PARCIAL_DIAS`: Valores `HABILITADO` (permite aprobar días seleccionados del rango) vs. `TODO_O_NADA` (exige aprobar o rechazar el bloque completo).
- **Criterios de Aceptación:**
  - [ ] Presentar una excusa desde el portal del representante y comprobar que se conserva su identificador único durante todo el proceso.
  - [ ] Aprobarla desde el flujo administrativo y verificar que las sesiones afectadas se actualizan en `RegistrosAsistencia` (`Justificada = true` y `EstadoAsistencia = "Justificada"`).
  - [ ] Comprobar que una excusa rechazada, observada o pendiente no modifica la asistencia en ningún aula.
  - [ ] Aprobar una excusa que cubra varias fechas y verificar que solo se actualizan las sesiones comprendidas en el período autorizado.
  - [ ] Ejecutar dos veces la misma operación de aprobación y comprobar que no se duplican cambios ni registros.
  - [ ] Simular un fallo durante la sincronización y comprobar que el sistema conserva la resolución y permite completar la actualización sin duplicarla.
  - [ ] Verificar que la asistencia y el expediente muestran exactamente la misma resolución.
  - [ ] Comprobar que las modificaciones quedan registradas con fecha, responsable y solicitud de origen.
- **Dependencias:** F34-Task03 (acceso contextual docente a justificaciones resultantes), F34-Task04 (integridad criptográfica de evidencias adjuntas).
- **Estado:** [ ] Pendiente

---
---

<!-- Fuente: RECUPERACION/Pendientes_RECUPERADO.md, líneas 4832-4881; clave TASK-107; asignación única: Docente -->
### [TASK-107] [F34-Task03] [P0] Consulta contextual de justificaciones de asistencia para docentes mediante permisos ABAC
- **Prioridad:** P0 (Crítica)
- **Orden de Ejecución:** 3 (Control de acceso basado en atributos y privacidad docente)
- **Componentes Afectados:**
  - `backend/academic-service/Code.gs` (`getTeacherStudentJustifications`)
  - `backend/user-service/Code.gs`
  - `js/teacher.js`
  - `teacher-dashboard.html`
- **Subcapacidades Relacionadas:** F34-01, F34-04, F34-11.
- **Origen del Hallazgo:** `AUDITORIA_FASE_34_BANDEJAS_REVISION_FIRMAS.md` / Sección C (F34-11), Matriz CAR-F34-04 y Especificación Técnica ChatGPT/Jules.
- **Problema Detectado y Riesgos:**
  Los docentes no disponen de una consulta específica que les permita visualizar las justificaciones de inasistencia de los estudiantes matriculados en sus asignaturas. La protección contextual para padres ya está implementada, pero falta extender el acceso a los docentes según sus asignaciones académicas efectivas. Si se les concediera acceso global verían expedientes de otros grupos y notas privadas, y si no se les concede quedan desinformados del motivo de la inasistencia.
- **Requerimientos Funcionales y Técnicos Convergentes:**
  1. *Control de acceso basado en atributos (ABAC):*
     - Incorporar la consulta `getTeacherStudentJustifications(payload)` validando en backend la relación entre:
       * Docente autenticado (`_verifiedUserId`).
       * Asignaturas que imparte (`AsignacionesDocentes`).
       * Secciones o grupos asignados activamente.
       * Estudiantes matriculados en sus listas (`MatriculasEstudiantes`).
       * Fechas y sesiones de clase afectadas (`SesionesAsistencia`).
     - La consulta debe limitarse estrictamente a los estudiantes asignados en el período lectivo correspondiente.
     - Cuando una justificación afecte varias asignaturas impartidas por distintos docentes, cada docente debe consultar únicamente las sesiones que le corresponden en su horario.
  2. *Segregación de confidencialidad y datos sensibles:*
     - Mostrar únicamente la información indispensable para la función docente:
       * Nombre del estudiante y grado/sección.
       * Fecha o período justificado.
       * Estado de la solicitud (`Aprobada`, `Pendiente`, `Rechazada`).
       * Resultado de la revisión administrativa.
       * Observaciones públicas de Secretaría.
       * Evidencias autorizadas para conocimiento docente.
     - Ocultar estrictamente notas administrativas internas, detalles clínicos reservados, información médica innecesaria o disputas de custodia legal familiar.
  3. *Constancia de conocimiento docente:*
     - Permitir que el docente registre una constancia digital de conocimiento o conformidad sobre la inasistencia justificada sin alterar la resolución emitida por Secretaría.
     - Mantener el acceso contextual histórico cuando el docente cambie de sección o finalice el período académico según las directrices institucionales.
  4. *Parametrización configurable en plataforma:*
     - Parámetro en `ConfiguracionInstitucional`: `DOCENTE_VISIBILIDAD_EVIDENCIAS_MEDICAS` (Valores: `SOLO_DICTAMEN_SECRETARIA` [recomendado por privacidad] vs. `PERMITIR_VER_CONSTANCIA_MEDICA_COMPLETA`).
- **Criterios de Aceptación:**
  - [ ] Un docente consulta exclusivamente las justificaciones de estudiantes matriculados en sus secciones y asignaturas activas.
  - [ ] Un docente no puede consultar justificaciones de alumnos que no pertenecen a su asignación académica (rechazo con error 403).
  - [ ] Si una excusa cubre varias asignaturas, cada docente visualiza únicamente las sesiones correspondientes a su carga horaria.
  - [ ] Alterar manualmente identificadores en la solicitud no permite eludir los filtros ABAC ni acceder a expedientes ajenos.
  - [ ] La consulta docente no expone observaciones administrativas privadas ni información sensible no pertinente.
  - [ ] El docente puede registrar constancia de conocimiento sin modificar la decisión tomada por Secretaría.
  - [ ] Todos los intentos de acceso no autorizado son auditados en `RegistroEventos`.
  - [ ] La consulta se integra en la interfaz docente sin interferir con la bandeja de tareas y entregas de aula virtual.
- **Dependencias:** F34-Task01 (unificación de justificaciones), sistema de asignaciones docentes y matrícula.
- **Estado:** [ ] Pendiente

---
---

<!-- Fuente: RECUPERACION/Pendientes_RECUPERADO.md, líneas 5756-5787; clave TASK-131; asignación única: Docente -->
### [TASK-131] [F38-Task05] [P0] Persistencia server-side de preferencias y progreso de aprendizaje por usuario
- **Prioridad:** P0 (Bloqueante / Esencial)
- **Orden de Ejecución:** 4 (Sincronización multi-dispositivo y aislamiento de usuario)
- **Componentes Afectados:**
  - `backend/user-service/Code.gs` (`getUserHelpPreferences`, `saveUserHelpPreference`, `resetUserHelpPreferences`)
  - `js/ui-common.js`
  - Hoja de Cálculo: `PreferenciasUsuario`, `PreferenciasAyudaUsuario`
- **Subcapacidades Relacionadas:** F38-08, F38-09, F38-10.
- **Origen del Hallazgo:** `AUDITORIA_FASE_38_AYUDA_CONTEXTUAL_METADATOS_APRENDIZAJE.md` / Sección C (F38-09), Matriz CAR-F38-09 y Especificación Técnica ChatGPT/Jules.
- **Problema Detectado y Riesgos:**
  El progreso de las guías se guarda exclusivamente mediante `localStorage` (`guide_progress_` + tourKey). Si el usuario cambia de computadora, ingresa desde un teléfono o limpia la caché, los tours se reinician indiscriminadamente, mientras que dos cuentas que compartan un mismo navegador heredan o sobreescriben indebidamente sus estados de aprendizaje.
- **Requerimientos Funcionales y Técnicos Convergentes:**
  1. *Persistencia server-side asociada a la cuenta:*
     - Incorporar persistencia de preferencias en el backend del servicio de usuarios, utilizando la hoja `PreferenciasUsuario` (o `PreferenciasAyudaUsuario`).
     - Almacenar por registro: `UserId`, `ModuloOFuncionId`, `TourOConsejoId`, `EstadoVisualizacion`, `PasoAlcanzado`, `VersionContenidoConsultada`, `FechaUltimaActualizacion`, `FechaSincronizacion`.
     - Distinguir los estados: `Pendiente`, `Presentado`, `EnCurso`, `Finalizado`, `Descartado`, `Restablecido`.
     - Vincular estrictamente cada registro al `_verifiedUserId` autenticado en la sesión activa.
  2. *Sincronización resiliente con soporte offline y migración:*
     - Al iniciar sesión, recuperar las preferencias del servidor y mantener caché local para una respuesta ágil.
     - Al descartar o completar una guía, actualizar el servidor de forma asíncrona e idempotente; si la red falla, encolar el cambio para la siguiente reconexión sin bloquear al usuario.
     - Migración segura: recuperar los estados de `localStorage` cuando el usuario autenticado pueda asociarse inequívocamente con ellos, evitando mezclar cuentas en equipos compartidos.
- **Criterios de Aceptación:**
  - [ ] Descartar un consejo o tour en un dispositivo se refleja de inmediato en otro dispositivo al iniciar sesión con la misma cuenta.
  - [ ] Limpiar los datos locales o caché del navegador no reinicia los tours ya completados en el servidor.
  - [ ] Dos cuentas distintas que inicien sesión en el mismo equipo mantienen estados de ayuda totalmente independientes.
  - [ ] Un usuario no puede consultar ni modificar preferencias de ayuda de otra cuenta.
  - [ ] Una interrupción de conexión conserva los cambios pendientes de forma recuperable.
- **Dependencias:** Sistema de autenticación en `user-service`.
- **Estado:** [ ] Pendiente

---
---

<!-- Fuente: RECUPERACION/Pendientes_RECUPERADO.md, líneas 7920-7948; clave TASK-191; asignación única: Docente -->
### [TASK-191] [ ] [F20-Task06] Flujo de devolución con inspección física y derivación a incidencias
- **Origen del Hallazgo:** `AUDITORIA_FASE_20_BIBLIOTECA_RECURSOS_EDUCATIVOS.md` / Sección E, Sección F (PT-20-21) y Plan de Trabajo P1
- **Prioridad:** P1
- **Severidad/Clasificación:** Alta (Preservación del fondo bibliográfico, control de deterioro y reporte inmediato de averías)
- **Archivos Involucrados:**
  - `backend/accounting-service/Code.gs` (`processLibraryLoan`, `recordLibraryIncident`)
  - `BibliotecaPrestamos`
  - `BibliotecaEjemplares`
  - `BibliotecaIncidencias`
  - `js/accounting.js`
- **Dependencias Expuestas:** `BibliotecaPrestamos`, `BibliotecaEjemplares`, `F20-Task01`
- **Descripción del Alcance:**
  Al procesar una devolución con `accion: "Devolucion"`, el sistema cambia incondicionalmente el libro a `available` sin permitir evaluar el estado físico en que se entrega. Si el libro fue devuelto roto, rayado o sin páginas, vuelve a estar disponible para préstamo erróneamente.
  Requerimientos Funcionales Detallados:
  1. Inspección física obligatoria al devolver:
     - Permitir registrar en la devolución la condición física del material: `Excelente`, `Bueno`, `DeterioradoNormal`, `DañadoGrave`, `Incompleto/FaltanPaginas`.
     - Si la condición es `Excelente` o `Bueno`, cerrar el préstamo y marcar el ejemplar como `available`.
     - Si la condición es `DañadoGrave` o `Incompleto`, cambiar el estado del ejemplar a `maintenance` (en reparación) o `damaged` (dañado fuera de servicio).
     - Generar automáticamente la incidencia en `BibliotecaIncidencias` vinculada al préstamo y al usuario que entregó el material dañado.
  2. Cálculo de días de mora:
     - Calcular automáticamente si hubo retraso respecto a la `FechaDevolucionPrevista` y registrar los días de mora acumulados.
- **Criterios de Aceptación:**
  - Devolver un libro en buen estado lo restituye a disponibilidad para préstamo.
  - Devolver un libro dañado lo coloca en estado de reparación y registra la incidencia asociada al estudiante responsable.
  - Se calculan de forma exacta los días de retraso si el libro fue entregado después de la fecha límite.
- **Estado:** [ ] Pendiente

---
---

<!-- Fuente: RECUPERACION/Pendientes_RECUPERADO.md, líneas 7949-7974; clave TASK-192; asignación única: Docente -->
### [TASK-192] [ ] [F20-Task07] Renovaciones de préstamo con bloqueo automático por reservas en lista de espera
- **Origen del Hallazgo:** `AUDITORIA_FASE_20_BIBLIOTECA_RECURSOS_EDUCATIVOS.md` / Sección E, Sección C y Plan de Trabajo P1
- **Prioridad:** P1
- **Severidad/Clasificación:** Alta (Equidad en el acceso a recursos bibliográficos, control de lista de espera y límites de renovación)
- **Archivos Involucrados:**
  - `backend/accounting-service/Code.gs` (nueva función `renewLibraryLoan`, `processLibraryLoan`)
  - `BibliotecaPrestamos`
  - `BibliotecaReservas`
- **Dependencias Expuestas:** `BibliotecaPrestamos`, `BibliotecaReservas`, `F20-Task01`
- **Descripción del Alcance:**
  No existe la capacidad de renovar préstamos. Los usuarios deben devolver el libro físicamente y solicitarlo de nuevo, y no se comprueba si otros estudiantes están esperando la obra mediante una reserva activa.
  Requerimientos Funcionales Detallados:
  1. Función `renewLibraryLoan`:
     - Permitir solicitar la renovación de un préstamo activo antes de su vencimiento.
     - Validar que el usuario no haya excedido el número máximo de renovaciones permitidas por obra (predeterminado: máximo 1 renovación).
  2. Bloqueo por reservas pendientes:
     - Antes de conceder la renovación, verificar si existen solicitudes activas en `BibliotecaReservas` para la misma obra.
     - Si existen reservas en lista de espera de otros usuarios, bloquear la renovación obligando a entregar el libro en su fecha para atender a los estudiantes en espera.
- **Criterios de Aceptación:**
  - Un usuario puede renovar su préstamo extendiendo la fecha de vencimiento según las reglas de su rol.
  - Si la obra cuenta con una reserva pendiente de otro estudiante, el sistema rechaza la renovación informando de la lista de espera.
  - Se impide renovar un préstamo más de las veces autorizadas por la política de circulación.
- **Estado:** [ ] Pendiente

---
---

<!-- Fuente: RECUPERACION/Pendientes_RECUPERADO.md, líneas 8004-8030; clave TASK-194; asignación única: Docente -->
### [TASK-194] [ ] [F20-Task09] Notificaciones multicanal de vencimientos y disponibilidad de reservas
- **Origen del Hallazgo:** `AUDITORIA_FASE_20_BIBLIOTECA_RECURSOS_EDUCATIVOS.md` / Sección E, Sección C (2.6, 2.10) y Plan de Trabajo P1
- **Prioridad:** P1
- **Severidad/Clasificación:** Alta (Reducción de morosidad en biblioteca, aviso oportuno de reservas disponibles y comunicación familiar)
- **Archivos Involucrados:**
  - `backend/accounting-service/Code.gs` (nueva función `checkAndDispatchLibraryAlerts`)
  - `backend/user-service/Code.gs` (`sendMultiChannelNotification`)
  - `BibliotecaPrestamos`
  - `BibliotecaReservas`
- **Dependencias Expuestas:** `sendMultiChannelNotification`, `BibliotecaPrestamos`, `BibliotecaReservas`
- **Descripción del Alcance:**
  No se emiten recordatorios previos al vencimiento de un préstamo bibliotecario ni se notifica automáticamente a un estudiante cuando el libro que reservó ha sido devuelto y está listo para ser retirado en el mostrador.
  Requerimientos Funcionales Detallados:
  1. Recordatorios preventivos de devolución:
     - Evaluación diaria de préstamos próximos a vencer: despachar aviso institucional 24 horas antes de la fecha límite de entrega.
     - Aviso de mora al día siguiente del vencimiento con instrucciones para la devolución inmediata.
  2. Notificación de reserva disponible:
     - Al procesar la devolución de un ejemplar que posee reservas pendientes en `BibliotecaReservas`, asignar el ejemplar a la primera reserva en cola y enviar notificación inmediata al estudiante beneficiario indicando el plazo límite para retirarlo (ej. 48 horas).
     - Si expira el plazo sin que el alumno retire el libro, liberar la reserva y notificar al siguiente en la lista de espera.
- **Criterios de Aceptación:**
  - El sistema envía notificación previa antes de que venza el plazo de entrega del libro.
  - Al devolver un libro reservado, el solicitante en lista de espera recibe el aviso de disponibilidad.
  - Las alertas utilizan claves de deduplicación diaria para evitar mensajes repetitivos.
- **Estado:** [ ] Pendiente

---
---

<!-- Fuente: RECUPERACION/Pendientes_RECUPERADO.md, líneas 8031-8055; clave TASK-195; asignación única: Docente -->
### [TASK-195] [ ] [F20-Task10] Asociación curricular de obras bibliográficas con asignaturas y niveles
- **Origen del Hallazgo:** `AUDITORIA_FASE_20_BIBLIOTECA_RECURSOS_EDUCATIVOS.md` / Sección E, Sección C (2.8) y Plan de Trabajo P1
- **Prioridad:** P1
- **Severidad/Clasificación:** Alta (Apoyo pedagógico, bibliografía recomendada por materia y pertinencia académica)
- **Archivos Involucrados:**
  - `backend/accounting-service/Code.gs` (nuevas funciones `linkBookToSubject`, `getBooksBySubject`)
  - Hoja `BibliotecaAsociacionesCurriculares`
  - `BibliotecaCatalogoObras`
  - `js/teacher.js`
- **Dependencias Expuestas:** `BibliotecaCatalogoObras`, Malla curricular académica
- **Descripción del Alcance:**
  Los libros del catálogo no están asociados con las asignaturas ni con los planes de estudio de la institución. Los docentes no pueden publicar listas de lecturas obligatorias o sugeridas para su clase directamente desde la biblioteca.
  Requerimientos Funcionales Detallados:
  1. Vínculo curricular de obras:
     - Asociar obras del catálogo a combinaciones de: Grado/Nivel educativo, Asignatura y Parcial/Período.
     - Clasificación pedagógica: `LecturaObligatoria`, `LecturaSugerida`, `MaterialConsultaTecnica`.
  2. Consulta de bibliografía de curso:
     - Permitir a los estudiantes de una clase consultar en un solo clic la bibliografía recomendada para sus materias activas y verificar en tiempo real si hay copias disponibles en la biblioteca física o enlaces en la biblioteca digital.
- **Criterios de Aceptación:**
  - Un docente puede vincular títulos del catálogo como lecturas recomendadas para su clase.
  - Los alumnos inscritos en la materia visualizan la lista bibliográfica con la disponibilidad de ejemplares.
- **Estado:** [ ] Pendiente

---


<!-- Fuente: RECUPERACION/Pendientes_RECUPERADO.md, líneas 8252-8275; clave TASK-203; asignación única: Docente -->
### [TASK-203] [ ] [F21-Task16] Control de asistencia y participación en servicios complementarios
- **Origen del Hallazgo:** `AUDITORIA_FASE_21_TRANSPORTE_SERVICIOS_COMPLEMENTARIOS.md` / Sección E (PT-21-42), Sección C (1.17) y Plan de Implementación TAREA 15
- **Prioridad:** P1
- **Severidad/Clasificación:** Alta (Asistencia a actividades extracurriculares, talleres, clubes y raciones de cafetería)
- **Archivos Involucrados:**
  - `backend/academic-service/Code.gs` (nueva función `recordActivityAttendance`)
  - Hoja `ServiciosAsistencia`
  - `ActividadesExtracurriculares`
- **Dependencias Expuestas:** `ActividadesExtracurriculares`, `F21-Task15`
- **Descripción del Alcance:**
  Las actividades extracurriculares carecen de un mecanismo interactivo para que los monitores o docentes pasen lista por sesión y los padres consulten la asistencia.
  Requerimientos Funcionales Detallados:
  1. Registro de asistencia por sesión:
     - Identificar alumnos inscritos en la actividad.
     - Registrar: presente, ausente, tardanza, ausencia justificada y retiro anticipado con fecha, hora y responsable.
     - Evitar asistencias duplicadas y permitir consulta de historial individual desde el portal de padres.
- **Criterios de Aceptación:**
  - Los encargados de club o taller registran asistencia por sesión.
  - Solo se pueden registrar estudiantes formalmente inscritos.
  - Los padres pueden consultar el récord de asistencia de sus hijos.
- **Estado:** [ ] Pendiente

---
---

<!-- Fuente: RECUPERACION/Pendientes_RECUPERADO.md, líneas 8451-8476; clave TASK-211; asignación única: Docente -->
### [TASK-211] [ ] [F21-Task32] Ampliación del sistema de actividades extracurriculares y sus servicios asociados
- **Origen del Hallazgo:** `AUDITORIA_FASE_21_TRANSPORTE_SERVICIOS_COMPLEMENTARIOS.md` / Sección E, Sección C (1.14) y Plan de Implementación TAREA 31
- **Prioridad:** P1
- **Severidad/Clasificación:** Alta (Gestión integral de clubes, deportes, tutorías, cupos y cobros asociados)
- **Archivos Involucrados:**
  - `backend/academic-service/Code.gs` (`saveExtracurricularActivity`, `getExtracurricularActivities`)
  - `backend/accounting-service/Code.gs`
  - `ActividadesExtracurriculares`
  - `ServiciosInscripciones`
- **Dependencias Expuestas:** `ActividadesExtracurriculares`, `ServiciosInscripciones`, `CargosEstudiante`
- **Descripción del Alcance:**
  Las actividades extracurriculares registran metadatos pero carecen de gestión de inscripciones formales, cupos, listas de espera y vinculación con cobros de mensualidad.
  Requerimientos Funcionales Detallados:
  1. Ciclo completo de actividades extracurriculares:
     - Configurar sesiones, horarios, docentes responsables, cupos máximos y tarifas de inscripción.
     - Gestionar inscripciones desde el portal familiar con autorización de los padres.
     - Vincular con `CargosEstudiante` para generar el cargo por membresía de taller o club deportivo.
     - Permitir asociar actividades con transporte extraordinario para partidos o presentaciones fuera de sede.
- **Criterios de Aceptación:**
  - Las actividades controlan cupos máximos de inscripción.
  - Las inscripciones pagadas generan el cargo en el estado de cuenta del estudiante.
  - Los padres pueden consultar y gestionar las actividades de sus hijos.
- **Estado:** [ ] Pendiente

---
---

<!-- Fuente: RECUPERACION/Pendientes_RECUPERADO.md, líneas 8633-8681; clave TASK-216; asignación única: Docente -->
### [TASK-216] [ ] [F22-Task09] Compatibilidad con las plantillas oficiales de cuadros de calificaciones de SACE
- **Origen del Hallazgo:** `AUDITORIA_FASE_22_GESTION_DOCUMENTAL_FORMULARIOS_FIRMA_ELECTRONICA.md` / Sección E, Sección G y Plan de Trabajo TAREA 22-09
- **Prioridad:** P1
- **Severidad/Clasificación:** Alta (Compatibilidad con el sistema educativo oficial SACE de Honduras, llenado exacto de calificaciones y preservación de formato)
- **Archivos Involucrados:**
  - `backend/accounting-service/Code.gs` (`fillAndExportSACETemplate`, `validateSACETemplateFile`, `verifySACETemplateCompatibility`)
  - `js/teacher.js` (Cuadro de Calificaciones)
  - Archivos Excel oficiales SACE en repositorio
- **Dependencias Expuestas:** Cuadro de calificaciones docente, registros académicos, matrícula, asignaturas, grados y secciones, repositorio de plantillas SACE y mecanismo de procesamiento de archivos Excel.
- **Descripción del Alcance:**
  La plataforma administra calificaciones académicas, pero necesita exportar los resultados al formato oficial de cuadros de calificaciones de SACE completando correctamente el archivo oficial que el docente utiliza y entrega, sin reconstruirlo desde cero ni alterar su estructura original.
  Requerimientos Funcionales Detallados:
  1. Análisis y mapeo de las plantillas oficiales de SACE:
     - Localizar y examinar los archivos de cuadros de SACE disponibles en el repositorio.
     - Analizar cada archivo para determinar: hojas de cálculo incluidas, nombres y distribución, filas y columnas utilizadas, celdas combinadas, encabezados institucionales, centro educativo, año lectivo, grado, sección, jornada, asignatura, identificación del docente, lista de alumnos, columnas de calificaciones por parcial, totales/promedios, fórmulas preexistentes, validaciones de datos, formatos numéricos y áreas protegidas.
     - Determinar exactamente qué dato de la plataforma corresponde a cada celda del archivo oficial.
     - Reconocer las fórmulas que ya incorpora SACE y conservarlas intactas sin sustituirlas por valores estáticos calculados, salvo exigencia expresa de la plantilla.
  2. Reconocimiento y validación del archivo seleccionado:
     - Al seleccionar «Llenar cuadro de SACE» en el menú del cuadro de notas del docente, abrir el selector para elegir el archivo Excel oficial.
     - Analizar el archivo y comprobar: que corresponde a una plantilla SACE reconocida, que el grado coincide con el que califica el docente, que la sección coincide, que la asignatura corresponde, que el año lectivo es correcto y que la lista de alumnos coincide.
     - Si existe incompatibilidad, detener el proceso y explicar exactamente qué dato no coincide.
  3. Correspondencia estricta de alumnos y calificaciones:
     - Leer la lista de alumnos incluida en el archivo oficial y establecer correspondencia con la plataforma mediante identidad oficial (DNI) o comparación robusta de nombres (manejando mayúsculas, acentos, espacios y orden de apellidos).
     - Nunca asignar una calificación basándose en una coincidencia dudosa de nombres; si no es confiable, solicitar revisión.
     - Detectar alumnos ausentes en SACE o en la plataforma e informar discrepancias.
     - Colocar cada calificación en la celda correspondiente al alumno y parcial.
     - Respetar la escala de calificación; no convertir calificaciones vacías en ceros ni sustituir valores sin advertirlo.
  4. Conservación absoluta del formato del archivo oficial:
     - Modificar exclusivamente las celdas de calificaciones y datos autorizados del mapeo.
     - Conservar: nombre original del archivo, estructura y orden de hojas, celdas combinadas, fuentes, tamaños, bordes, colores, anchos de columna, fórmulas, configuración de impresión y áreas de impresión.
     - Prohibido convertir a CSV/PDF para reconstruir como Excel ni generar archivos nuevos con apariencia aproximada.
  5. Descarga automática del archivo completado:
     - Al terminar, iniciar automáticamente la descarga del archivo completado conservando el nombre original exacto, formato y extensión.
     - Mostrar confirmación con resumen de alumnos identificados y notas colocadas, advirtiendo si quedaron elementos sin correspondencia.
- **Criterios de Aceptación:**
  - [ ] Se identifican y analizan las plantillas SACE existentes en el repositorio documentando el mapeo.
  - [ ] La opción «Llenar cuadro de SACE» aparece en el menú de acciones del cuadro de calificaciones.
  - [ ] El sistema identifica asignatura, grado, sección y año lectivo del archivo seleccionado.
  - [ ] Se rechaza un archivo correspondiente a otra asignatura, grado o sección.
  - [ ] Se reconoce correctamente la lista de alumnos que ya contiene el archivo SACE.
  - [ ] Las calificaciones se asignan a los alumnos correctos sin que las vacías se conviertan en cero.
  - [ ] Las fórmulas originales y celdas ajenas al mapeo permanecen intactas.
  - [ ] El archivo conserva su nombre original, formato Excel, hojas, estilos y configuración de impresión.
  - [ ] La descarga comienza automáticamente y el archivo abre en Excel sin advertencias de reparación.
  - [ ] El sistema informa cualquier alumno o calificación que no haya podido procesarse.
- **Estado:** [ ] Pendiente

---
---

<!-- Fuente: RECUPERACION/Pendientes_RECUPERADO.md, líneas 8682-8710; clave TASK-217; asignación única: Docente -->
### [TASK-217] [ ] [F22-Task10] Administración de versiones y compatibilidad de plantillas SACE
- **Origen del Hallazgo:** `AUDITORIA_FASE_22_GESTION_DOCUMENTAL_FORMULARIOS_FIRMA_ELECTRONICA.md` / Sección E, Sección G y Plan de Trabajo TAREA 22-10
- **Prioridad:** P1
- **Severidad/Clasificación:** Alta (Gestión de cambios de formato oficial SACE, retrocompatibilidad y mapeo versionado)
- **Archivos Involucrados:**
  - `backend/accounting-service/Code.gs`
  - Hoja `PlantillasSACEVerificadas`
- **Dependencias Expuestas:** `F22-Task09`, repositorio de archivos SACE y mecanismo de procesamiento Excel.
- **Descripción del Alcance:**
  Las plantillas oficiales de SACE pueden cambiar entre períodos o años lectivos. Si el sistema utiliza posiciones fijas, una actualización del formato ministerial podría provocar que las notas se escriban en columnas erróneas.
  Requerimientos Funcionales Detallados:
  1. Catálogo versionado de plantillas SACE:
     - Separar el reconocimiento de plantillas de la escritura de calificaciones.
     - Registrar en `PlantillasSACEVerificadas`: Identificador, Versión, Año lectivo/vigencia, Tipo de cuadro, Grado o nivel aplicable, Asignatura aplicable, Estructura de hojas, Mapeo de celdas (`ColumnasMapJSON`), Reglas de identificación de alumnos y Reglas de conservación.
  2. Validación estructural previa:
     - Detectar cambios en encabezados, posiciones, nombres de hojas y celdas combinadas.
     - Identificar plantillas desconocidas o modificadas; evitar utilizar un mapeo antiguo cuando la estructura no coincida.
     - Permitir probar una plantilla nueva con archivos de ejemplo antes de habilitarla.
     - Mantener disponibles las versiones anteriores para procesar cuadros históricos.
- **Criterios de Aceptación:**
  - [ ] Se pueden registrar y administrar distintas versiones de plantillas SACE.
  - [ ] El sistema identifica la versión de la plantilla del archivo seleccionado.
  - [ ] Un archivo modificado de forma incompatible es rechazado con explicación clara.
  - [ ] Una nueva plantilla puede configurarse y probarse sin alterar las existentes.
  - [ ] Cada procesamiento registra la versión del mapeo utilizado.
- **Estado:** [ ] Pendiente

---


<!-- Fuente: RECUPERACION/Pendientes_RECUPERADO.md, líneas 10306-10335; clave TASK-263; asignación única: Docente -->
### [TASK-263] [F29-Task09] [P1] Migración de Asistencia y Registros Operativos Históricos Consolidados
- **Orden de Ejecución:** 9
- **Prioridad:** P1 (Alta)
- **Componentes Afectados:**
  - `backend/academic-service/Code.gs` (`importAttendanceHistoricalSummary`, `getAsistenciaEstudiante`)
  - Hojas: `AsistenciasDiarias`, `AsistenciasHistoricasConsolidadas`
- **Subcapacidades Relacionadas:** F29-10.
- **Estado de Partida:** Requiere mejoras.
- **Dependencias Principales:** [F29-Task01], [F29-Task02], [F29-Task03].
- **Problema Detectado y Riesgos:**
  La plataforma admite asistencia diaria detallada, pero muchas fuentes legadas solo conservan acumulados anuales o porcentajes de asistencia por ciclo. Forzar la creación de fechas ficticias o no admitir consolidados impide migrar el historial de conducta y asistencia.
- **Requisitos Funcionales y Técnicos Convergentes:**
  1. *Soporte para detalle diario y acumulados consolidados:*
     - Importar registros diarios cuando existan.
     - Crear tabla `AsistenciasHistoricasConsolidadas` para fuentes con totales por ciclo/parcial.
     - Diferenciar: asistencias, inasistencias justificadas, inasistencias injustificadas, retardos y porcentajes consolidados.
  2. *Preservación de fidelidad y reglas de integridad:*
     - Prohibición estricta: No inventar fechas individuales cuando el origen solo contiene totales acumulados.
     - Conservar ciclo, grado, sección, período y método de cálculo del porcentaje.
     - No mezclar acumulados históricos con la asistencia diaria del ciclo activo.
     - Detección de inconsistencias (ej. inasistencias superiores a los días lectivos oficiales).
- **Criterios de Aceptación:**
  - [ ] Se importan históricos de asistencia tanto en detalle diario como en consolidados anuales.
  - [ ] Los acumulados se muestran en los expedientes sin generar fechas ficticias.
  - [ ] Los registros históricos de asistencia no alteran los porcentajes del ciclo activo actual.
  - [ ] Los reportes diferencian claramente el nivel de detalle disponible.
- **Estado:** [ ] Pendiente

---
---

<!-- Fuente: RECUPERACION/Pendientes_RECUPERADO.md, líneas 10423-10449; clave TASK-269; asignación única: Docente -->
### [TASK-269] [F29-Task16] [P1] Importación y Exportación Integral de Información SACE
- **Orden de Ejecución:** 16
- **Prioridad:** P1 (Alta)
- **Componentes Afectados:**
  - `backend/accounting-service/Code.gs` (`importSACEDataFile`, `exportSACETemplateData`)
  - Módulos de compatibilidad SACE en `developer-service`
- **Subcapacidades Relacionadas:** F29-01, F29-03, F29-16.
- **Estado de Partida:** Implementada parcialmente.
- **Dependencias Principales:** [F29-Task01] a [F29-Task04], [F29-Task10].
- **Problema Detectado y Riesgos:**
  Existe validación de plantillas SACE, pero falta el flujo completo de importación masiva de calificaciones y matrículas desde los archivos oficiales ministeriales y la exportación verificada con perfiles versionados.
- **Requisitos Funcionales y Técnicos Convergentes:**
  1. *Importador de archivos oficiales SACE:*
     - Reconocer automáticamente plantilla, ciclo, grado, sección y centro educativo.
     - Validar RNE (13 dígitos) y mapear con identidades institucionales existentes.
     - Importar calificaciones y matrículas con vista previa obligatoria.
  2. *Exportación y revalidación:*
     - Exportar datos al formato ministerial oficial exacto y comparar contra los registros de origen.
     - Conservar perfiles versionados ante cambios futuros en las plantillas de la Secretaría de Educación.
- **Criterios de Aceptación:**
  - [ ] Importa plantillas SACE oficiales asociando los registros a los expedientes institucionales correspondientes.
  - [ ] Exporta datos en el formato ministerial exacto pasando la validación estructural.
  - [ ] Se conserva la versión de plantilla utilizada.
- **Estado:** [ ] Pendiente

---
---

<!-- Fuente: RECUPERACION/Pendientes_RECUPERADO.md, líneas 13047-13061; clave TASK-357; asignación única: Docente -->
### [TASK-357] [ ] [F11-Task17] Ampliar los indicadores de calidad educativa y cumplimiento pedagógico
- **Origen del Hallazgo:** `AUDITORIA-FASE-11-COMUNICACION-BIENESTAR-SUPERVISION-FINANZAS.md` / Área III (P2)
- **Prioridad:** P2
- **Severidad/Clasificación:** Media (Métricas institucionales)
- **Archivos Involucrados:**
  - `backend/academic-service/Code.gs`
- **Dependencias Expuestas:** IndicadoresCalidad
- **Descripción del Alcance:**
  Consolidar métricas agregadas de cumplimiento de planificaciones, cobertura de contenidos por asignatura y avance del calendario académico.
- **Criterios de Aceptación:**
  - Los indicadores muestran estadísticas globales por nivel/departamento sin exponer datos confidenciales individuales.
- **Estado:** [ ] Pendiente

---
---

<!-- Fuente: RECUPERACION/Pendientes_RECUPERADO.md, líneas 13835-13857; clave TASK-382; asignación única: Docente -->
### [TASK-382] [ ] [F20-Task12] Identificación y escaneo de ejemplares mediante códigos QR y códigos de barras
- **Origen del Hallazgo:** `AUDITORIA_FASE_20_BIBLIOTECA_RECURSOS_EDUCATIVOS.md` / Sección E, Sección C (2.2) y Plan de Trabajo P2
- **Prioridad:** P2
- **Severidad/Clasificación:** Media (Agilidad en mostrador de préstamo, reducción de errores de digitación y etiquetado físico)
- **Archivos Involucrados:**
  - `backend/accounting-service/Code.gs`
  - `BibliotecaEjemplares`
  - `dashboard-contabilidad.html`
  - `js/accounting.js`
- **Dependencias Expuestas:** `BibliotecaEjemplares`, `F20-Task01`
- **Descripción del Alcance:**
  Los préstamos y devoluciones requieren teclear manualmente los identificadores de los libros (`LIB-...`), lo que retrasa la atención en horas punta de recreo y propicia errores de captura.
  Requerimientos Funcionales Detallados:
  1. Generación e impresión de etiquetas con código de barras/QR:
     - Generar dinámicamente etiquetas para lomo o portada con el código del ejemplar, título resumido, signatura de estantería y código QR/barra legible.
     - Permitir utilizar lectores ópticos USB o cámaras móviles en el mostrador para escanear el libro y el carné del estudiante, completando el préstamo en menos de 5 segundos.
- **Criterios de Aceptación:**
  - Se pueden imprimir etiquetas adhesivas individuales o por pliego para los ejemplares físicos.
  - El escaneo del código QR en el formulario de préstamo rellena automáticamente el ejemplar y abre la ficha del libro.
- **Estado:** [ ] Pendiente

---
---

<!-- Fuente: RECUPERACION/Pendientes_RECUPERADO.md, líneas 14583-14631; clave TASK-406; asignación única: Docente -->
### [TASK-406] [F24-Task16] [P2] [Analítica Académica Avanzada - Análisis de Cohortes y Seguimiento Longitudinal de Estudiantes]
- **Componentes Afectados:**
  - `backend/academic-service/Code.gs`
- **Dependencias Expuestas:** Protección histórica existente, DataMart (`F24-Task05`), series históricas (`F24-Task07`), filtros (`F24-Task03`).
- **Capacidades Relacionadas:** F24-A03, F24-005.
- **Problema Detectado:**
  No existe un mecanismo para analizar grupos de estudiantes a lo largo de varios ciclos académicos, lo que limita el estudio de permanencia, rendimiento y evolución institucional.
- **Requisitos Funcionales:**
  1. Incorporar capacidades de agrupación de estudiantes por cohortes históricas.
  2. Permitir definir cohortes según:
     - Año de ingreso a la institución.
     - Ciclo académico de inicio.
     - Nivel educativo de matrícula inicial.
     - Grado inicial.
     - Programa o modalidad académica, cuando corresponda.
  3. Seguir longitudinalmente la evolución de cada cohorte a través de los sucesivos años lectivos.
  4. Consultar y graficar para cada cohorte:
     - Matrícula inicial de la cohorte.
     - Estudiantes que permanecen activos ciclo a ciclo.
     - Traslados de grado o sección.
     - Retiros definitivos registrados.
     - Estudiantes egresados o graduados.
     - Tasa de permanencia porcentual.
     - Evolución del rendimiento académico promedio de la cohorte.
     - Tasa de reprobación acumulada.
  5. Permitir comparar visual y numéricamente dos o más cohortes diferentes.
  6. Diferenciar con precisión estudiantes que se trasladan internamente de aquellos que desertan o abandonan la institución.
  7. Mantener identificadores históricos estables que vinculen al alumno a través de los ciclos.
  8. Respetar estrictamente los permisos RBAC/ABAC sobre la consulta de información individual y anonimizar datos cuando se presenten métricas agregadas.
- **Cambios Necesarios:**
  - Incorporar mecanismos de identificación y etiquetado de cohortes en el modelo de datos.
  - Integrar los registros históricos de matrículas y movimientos de expedientes estudiantiles.
  - Incorporar endpoints de consulta longitudinal (`getStudentCohortLongitudinalAnalytics`).
  - Integrar los resultados analíticos con el DataMart y las vistas de series históricas.
  - Crear componentes visuales de seguimiento matricial de cohortes en la interfaz.
- **Comportamiento Esperado:**
  La institución podrá seleccionar una cohorte de ingreso y seguir su evolución durante diferentes años lectivos, identificando permanencia, rendimiento y movimientos.
- **Criterios de Aceptación:**
  - [ ] Cada estudiante se vincula de manera unívoca con la cohorte correspondiente a su ingreso.
  - [ ] Las promociones o cambios de grado ordinarios no alteran la pertenencia a la cohorte original.
  - [ ] Los traslados internos de sección no se contabilizan erróneamente como deserción.
  - [ ] Los retiros definitivos se contabilizan fidedignamente según su estado y fecha efectiva.
  - [ ] Las cifras agregadas de la cohorte coinciden con los registros históricos individuales de matrícula.
  - [ ] La comparación entre diferentes cohortes utiliza períodos y métricas equivalentes.
  - [ ] Los resultados analíticos históricos permanecen estables ante cambios en la configuración académica actual.
- **Estado:** [ ] Pendiente

---
---

<!-- Fuente: RECUPERACION/Pendientes_RECUPERADO.md, líneas 15119-15175; clave TASK-417; asignación única: Docente -->
### [TASK-417] [F25-Task12] [P2] [SACE - Fortalecimiento de la Generación y Validación de Archivos SACE Oficiales]
- **Componentes Afectados:**
  - `backend/accounting-service/Code.gs`
  - Hojas `PlantillasSACEVerificadas`, `CalificacionesEstudiantes`
- **Estado de Partida:** Completa y verificada; optimización y ampliación controlada.
- **Dependencias Expuestas:** F25-003, F25-004 y F25-017.
- **Capacidades Relacionadas:** F25-008, F25-017.
- **Problema que Resuelve:**
  La generación de archivos SACE ya valida columnas obligatorias, conserva estados no evaluables y aplica la regla de recuperación identificada en la auditoría. No corresponde reconstruir estas capacidades. La mejora consiste en ampliar la administración de plantillas, la validación de datos y la trazabilidad de los archivos generados, evitando que la compatibilidad dependa de una única estructura fija.
- **Requisitos Funcionales:**
  1. Administración ampliada de plantillas SACE:
     - Mantener plantillas independientes por procedimiento oficial (Matrícula inicial, Calificaciones parciales, Cuadro final de rendimiento).
     - Identificar la versión oficial de cada plantilla.
     - Registrar procedencia institucional y fecha de verificación.
     - Identificar campos obligatorios y opcionales.
     - Identificar tipos de datos y valores admitidos por la Secretaría de Educación de Honduras.
     - Detectar cambios de estructura oficial.
     - Permitir desactivar plantillas obsoletas conservando versiones históricas.
  2. Validación académica estricta:
     - Conservar las reglas existentes verificadas: identificación del estudiante (DNI/código SACE), nombre del alumno, calificación ordinaria, calificación de recuperación, estados no evaluables (`Pendiente`, `Exento`, `Ausente`) y cálculo de nota final (`Math.max(ordinaria, recuperacion)`).
     - No convertir automáticamente valores como `Pendiente`, `Exento` o `Ausente` en cero (0).
     - La regla de cálculo de recuperación no debe modificarse sin verificar que corresponde al procedimiento oficial y a la plantilla vigente.
  3. Validaciones adicionales previas a la generación:
     - Identificar estudiantes matriculados sin correspondencia en el cuadro SACE.
     - Detectar identificadores repetidos en el grupo evaluado.
     - Detectar calificaciones fuera de rango (menores a 0 o mayores a 100).
     - Comprobar campos obligatorios completos.
     - Validar que el período académico coincida con el ciclo evaluado.
     - Identificar asignaturas o secciones incompatibles.
     - Advertir sobre registros incompletos mostrando lista de errores antes de generar el archivo final.
  4. Evidencia y trazabilidad de generación:
     - Relacionar cada archivo con plantilla y versión, período académico, asignatura, sección, docente responsable, fecha y hora de generación, datos incluidos y resultado de validación.
- **Cambios Necesarios:**
  1. Ampliar la administración de plantillas verificadas en `PlantillasSACEVerificadas`.
  2. Relacionar plantillas con procedimientos específicos de Secretaría de Educación.
  3. Integrar validaciones de integridad académica en `fillAndExportSACETemplate`.
  4. Incorporar control de estudiantes duplicados y notas fuera de rango.
  5. Incorporar información de procedencia y versión al historial de descargas.
  6. Mantener el formato de salida requerido por cada plantilla oficial.
  7. Evitar modificar las reglas académicas ya verificadas sin necesidad demostrada.
- **Comportamiento Esperado:**
  El personal docente y de secretaría podrá generar cuadros SACE oficiales con validación previa exhaustiva, garantizando que el archivo cumpla las normativas de la Secretaría de Educación sin alterar calificaciones de los estudiantes.
- **Criterios de Aceptación:**
  - [ ] Generar un archivo utilizando la plantilla actualmente verificada y comprobar que se conserva su estructura oficial.
  - [ ] Verificar que los estados no evaluables (`Pendiente`, `Exento`, `Ausente`) permanecen intactos sin transformarse en cero.
  - [ ] Probar calificaciones ordinarias y de recuperación verificando el cálculo de nota final SACE.
  - [ ] Probar valores fuera de rango (< 0 o > 100) y comprobar que son bloqueados con advertencia clara.
  - [ ] Probar estudiantes duplicados en la lista y verificar detección.
  - [ ] Probar estudiantes sin identificación válida y comprobar reporte de inconsistencia.
  - [ ] Comprobar que una plantilla obsoleta genera una advertencia o bloqueo según su nivel de incompatibilidad.
  - [ ] Verificar que el archivo generado queda vinculado a su plantilla, versión y responsable en auditoría.
  - [ ] Comprobar que las 53 pruebas de la suite académica existente continúan aprobadas al 100%.
  - [ ] Verificar que no se presenta el archivo como aceptado por SACE si no se ha realizado una validación oficial de carga.
- **Estado:** [ ] Pendiente

---
---

<!-- Fuente: RECUPERACION/Pendientes_RECUPERADO.md, líneas 15400-15462; clave TASK-424; asignación única: Docente -->
### [TASK-424] [F27-Task05] [P2] [Continuidad Offline - Continuidad Operativa Fuera de Línea y Sincronización Diferida Académica]
- **Componentes Afectados:**
  - `js/api.js`
  - `js/teacher.js`
  - `backend/academic-service/Code.gs`
  - Hojas `RegistrosAsistencia`, `CalificacionesEstudiantes`
  - Almacenamiento local del navegador (`localStorage` / `IndexedDB`)
- **Subcapacidades Relacionadas:** F27-008, F27-006.
- **Estado de Partida:** Implementada parcialmente.
- **Dependencias Expuestas:** Idempotencia (`getIdempotencyPayloadSignature`), sincronización, validación académica y almacenamiento local.
- **Problema Detectado:**
  La plataforma dispone de fallback local en delegaciones interservicios, pero no cuenta con una estrategia estandarizada de funcionamiento fuera de línea para la captura de información académica crítica en el aula. La pérdida de conectividad durante la jornada de clases impide a los docentes registrar asistencias o capturar borradores de calificaciones, aun cuando los datos podrían guardarse localmente y sincronizarse de forma diferida al restablecerse la red.
- **Requisitos Funcionales:**
  1. Operaciones académicas habilitadas fuera de línea:
     - Asistencia: consultar listas descargadas, registrar presentes, ausencias, tardanzas, justificaciones y observaciones permitidas.
     - Calificaciones: consultar nóminas y asignaturas descargadas, capturar calificaciones como borradores locales (`esBorrador: true`) y editar notas locales no sincronizadas.
     - Bloquear operaciones que exijan validación en vivo del servidor (ej. cierre oficial de actas, promociones).
  2. Preparación y descarga de datos locales con conexión activa:
     - Descargar listas de estudiantes, asignaturas autorizadas, horarios y reglas de evaluación para la sesión de trabajo.
  3. Almacenamiento local persistente y seguro:
     - Guardar en almacenamiento estructurado del navegador (`IndexedDB` / `localStorage` cifrado) con metadatos: `operacionLocalId`, `userId`, tipo operación, timestamp de captura local, versión de datos y estado.
     - No depender de variables volátiles en memoria; resistir el cierre o recarga de la página.
  4. Estados de sincronización transparentes en UI:
     - `Guardado local`, `Pendiente de sincronización`, `En proceso`, `Sincronizado`, `Rechazado`, `En conflicto`.
     - Nunca presentar un dato guardado localmente como registrado oficialmente en el sistema hasta recibir confirmación del backend.
  5. Sincronización automática y manual:
     - Detección de recuperación de conectividad (`navigator.onLine` / eventos de red) y disparo de sincronización por lotes.
     - Botón de sincronización manual con indicador de cantidad de operaciones pendientes.
  6. Idempotencia y protección contra duplicados:
     - Cada operación local conserva su identificador único; reintentos no deben crear filas duplicadas en `RegistrosAsistencia` ni en calificaciones.
  7. Validación estricta en servidor antes de aplicar:
     - Validar permisos docentes, correspondencia de grado/sección, estados de períodos (rechazar si el período se cerró mientras estaba desconectado) y rangos numéricos.
     - Conservar por separado la fecha real de captura en aula y la fecha de recepción en servidor.
  8. Detección y resolución de conflictos:
     - Detectar colisiones si otro usuario o proceso modificó la calificación en el servidor durante la desconexión.
     - No aplicar política ciega de "el último gana"; presentar diferencias y solicitar confirmación al docente autorizado.
  9. Aislamiento y seguridad local:
     - Limpiar datos locales al cerrar sesión formal para evitar que otro usuario del mismo dispositivo acceda a información de alumnos ajenos.
- **Cambios Necesarios:**
  - Implementar módulo `OfflineSyncManager` en `js/api.js`.
  - Adaptar formularios de asistencia en `js/teacher.js` para operar en modo offline-first con indicador visual de conectividad.
  - Implementar endpoint en backend `syncOfflineAttendanceAndGrades` con validaciones de período y candados atómicos.
  - Registrar eventos de sincronización diferida en auditoría.
- **Comportamiento Esperado:**
  Un docente puede preparar sus listas y capturar asistencias o borradores de calificaciones sin conexión a internet. Al restablecerse la red, la plataforma sincroniza las operaciones válidas, detecta conflictos y actualiza los registros oficiales sin duplicaciones.
- **Criterios de Aceptación:**
  - [ ] El docente puede consultar listas de alumnos previamente descargadas estando sin conexión a internet.
  - [ ] Es posible registrar asistencias completas de un grupo en modo fuera de línea.
  - [ ] Es posible capturar calificaciones parciales como borradores locales en modo fuera de línea.
  - [ ] Las operaciones pendientes se conservan íntegras tras cerrar y volver a abrir el navegador.
  - [ ] La interfaz gráfica distingue claramente entre datos guardados localmente y registros confirmados oficialmente por el servidor.
  - [ ] Al detectar conexión, el sistema inicia automáticamente la sincronización de tareas pendientes.
  - [ ] La interfaz proporciona un botón funcional para sincronización manual inmediata.
  - [ ] Una operación sincronizada no se duplica en la base de datos ante reintentos de red.
  - [ ] El servidor valida rigurosamente los permisos docentes y períodos académicos antes de persistir.
  - [ ] Una operación capturada para un período que fue cerrado durante la desconexión es rechazada con aviso claro.
  - [ ] Las modificaciones concurrentes entre local y servidor se detectan y presentan como conflicto para revisión.
  - [ ] Se conservan en auditoría la fecha/hora original de captura en el aula y la fecha de sincronización en el servidor.
  - [ ] Una sincronización interrumpida a la mitad puede reanudarse sin pérdida ni duplicación de registros.
  - [ ] Cerrar sesión limpia de forma segura el almacenamiento local para prevenir exposición de datos a terceros.
- **Estado:** [ ] Pendiente

---
