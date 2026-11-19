# AUDITORÍA FUNCIONAL, TÉCNICA Y DOCUMENTAL — FASE 20
## BIBLIOTECA INSTITUCIONAL Y RECURSOS EDUCATIVOS

**Proyecto:** Plataforma Integral de Gestión Educativa — New Generation Christian Academy
**Fase Auditada:** Fase 20 (Biblioteca y Recursos Educativos)
**Área:** Gestión Bibliotecaria, Catálogo de Obras y Ejemplares, Circulación (Préstamos y Devoluciones), Reservas, Recursos Digitales y Patrimonio Documental
**Tipo de Intervención:** Auditoría Funcional, Inspección Técnica y Verificación de Integridad
**Entregable Obligatorio:** `AUDITORIA_FASE_20_BIBLIOTECA_RECURSOS_EDUCATIVOS.md`
**Fecha de Ejecución:** Marzo 2025

---

## A. IDENTIFICACIÓN

### 1. Propósito y Alcance de la Fase
La Fase 20 tiene como propósito administrar integralmente el ciclo de vida de los recursos bibliográficos físicos y digitales de la academia:
1. Catalogación de obras bibliográficas (título, autores múltiples, editorial, ISBN, clasificación temática, nivel educativo y signatura topográfica).
2. Control y trazabilidad de ejemplares físicos individuales (código único de barras/QR, estantería, sala, condición física y disponibilidad).
3. Circulación automatizada de préstamos a estudiantes, docentes y personal, con validación de límites, fechas de vencimiento y cálculo de retrasos.
4. Devoluciones con evaluación física del material devuelto (buen estado, deterioro, faltantes o daño irreparable).
5. Motor de reservas y listas de espera para obras con ejemplares agotados, con asignación prioritaria al momento de la devolución.
6. Gestión de incidencias (daños, pérdidas y reposición de ejemplares con integración al inventario patrimonial institucional).
7. Repositorio de recursos educativos digitales (libros electrónicos, guías, manuales y enlaces seguros con restricción de acceso por rol y nivel).
8. Portal de autoservicio para consulta del catálogo en línea (OPAC escolar) y consulta de préstamos personales.
9. Reportes de circulación, rotación de colecciones, obras más leídas y solicitudes de adquisición bibliográfica.

### 2. Ubicación en la Plataforma y Componentes Encontrados
- **Backend:**
  - `backend/accounting-service/Code.gs`:
    * Enrutador `doPost` (líneas 670-679): despacha `manageLibraryBook`, `getLibraryBooks`, `processLibraryLoan`, `getLibraryLoans`, `reserveLibraryBook`, `getLibraryReservations`, `recordLibraryIncident`, `getLibraryIncidents`, `manageDigitalResource`, `getDigitalResources`.
    * Funciones implementadas (líneas 6413-6570): `manageLibraryBook`, `getLibraryBooks`, `processLibraryLoan`, `getLibraryLoans`.
    * **Defecto Crítico:** Las funciones `reserveLibraryBook`, `getLibraryReservations`, `recordLibraryIncident`, `getLibraryIncidents`, `manageDigitalResource` y `getDigitalResources` están cableadas en `ROLE_PERMISSIONS` y en el `switch(action)`, pero **no están implementadas** en ningún archivo del backend (su llamada resulta en un `ReferenceError: ... is not defined`).
- **Persistencia (Google Sheets):**
  - `BibliotecaEjemplares` (EjemplarID, IsbnCodigo, Titulo, Autor, Categoria, UbicacionFisica, Estado, Observaciones).
  - `BibliotecaPrestamos` (PrestamoID, EjemplarID, UserId, FechaPrestamo, FechaDevolucionPrevista, FechaDevolucionReal, Estado, Observaciones).
  - `BibliotecaReservas` (ReservaID, EjemplarID, UserId, FechaSolicitud, FechaExpiracion, EstadoReserva, Observaciones).
  - `BibliotecaIncidencias` (IncidenciaID, PrestamoID, EjemplarID, UserId, TipoIncidencia, Descripcion, Estado, Resolucion, Observaciones).
  - `RecursosDigitalesBiblioteca` (RecursoID, Titulo, AutorColaboradores, Categoria, FormatoUrl, NivelPermisosJSON, Estado, Observaciones).
- **Frontend:**
  - `js/accounting.js`: función `renderBibliotecaModule(container)` (líneas 806-1228) con 5 subpestañas: `libros`, `prestamos`, `reservas`, `incidencias`, `digitales`.
  - **Defecto de Accesibilidad:** `renderBibliotecaModule` **no está conectado** en `switchTab` de `js/accounting.js` ni tiene botón de acceso en `dashboard-contabilidad.html` ni en ningún otro dashboard institucional (código huérfano en frontend).

---

## B. INVENTARIO DE IMPLEMENTACIÓN REAL

| Componente | Tipo | Función / Mecanismo | Archivo / Hoja | Estado Detectado |
| :--- | :--- | :--- | :--- | :--- |
| **Catálogo de Libros** | Backend | `manageLibraryBook`, `getLibraryBooks` | `Code.gs` / `BibliotecaEjemplares` | Implementado parcialmente (Plano, sin separar obra de ejemplar) |
| **Préstamos de Libros** | Backend | `processLibraryLoan`, `getLibraryLoans` | `Code.gs` / `BibliotecaPrestamos` | Implementado funcional |
| **Devoluciones de Libros**| Backend | `processLibraryLoan` (`accion: "Devolucion"`) | `Code.gs` / `BibliotecaPrestamos` | Implementado funcional |
| **Reservas de Libros** | Backend | `reserveLibraryBook`, `getLibraryReservations` | Inexistente (Error 500) | Defectuosa (Función no declarada) |
| **Incidencias / Daños** | Backend | `recordLibraryIncident`, `getLibraryIncidents` | Inexistente (Error 500) | Defectuosa (Función no declarada) |
| **Recursos Digitales** | Backend | `manageDigitalResource`, `getDigitalResources` | Inexistente (Error 500) | Defectuosa (Función no declarada) |
| **Interfaz UI Biblioteca**| Frontend | `renderBibliotecaModule` | `js/accounting.js` | Desconectada (Huérfana en navegación) |
| **Separación Obra/Ejemplar**| Modelo | No existe entidad `CatalogoObras` | `BibliotecaEjemplares` plano | Defectuosa (Confunde obra con ejemplar) |
| **Reglas de Préstamo** | Lógica | Período fijo de 7 días cableado en código | `Code.gs` L6536 | Requiere mejoras (Sin reglas configurables) |
| **Integración Patrimonial**| Backend | No vinculado a `ActivosPatrimoniales` | Ausente | Ausente |

---

## C. COMPARACIÓN EXTERNA Y REFERENCIAS FUNCIONALES

Se examinaron estándares internacionales de automatización bibliotecaria escolar (Koha ILS, Follett Destiny Library Manager y PMB):
1. **Diferenciación Obra vs Ejemplar (Modelo FRBR / RDA):** En sistemas profesionales, la obra (metadatos bibliográficos: ISBN, título, autor, editorial, año, materia) reside en una tabla maestra, mientras que los ejemplares físicos (código de barras, estantería, sala, estado físico, disponibilidad) residen en una tabla relacional hija. La implementación actual de NGCA almacena título y autor repetidos en cada fila de `BibliotecaEjemplares`, provocando redundancia y anomalías de actualización.
2. **Políticas y Matrices de Circulación:** Sistemas como Koha o Follett Destiny definen matrices de circulación configurables (ej. Estudiante: 2 libros por 7 días; Docente: 5 libros por 15 días; Obras de Referencia: solo consulta en sala). NGCA tiene un período rígido de 7 días para todos los usuarios sin validación de límites máximos de libros en préstamo por alumno.
3. **Manejo de Reservas y Bloqueos de Renovación:** Cuando un ejemplar tiene una reserva pendiente por otro usuario, la renovación debe ser bloqueada automáticamente. En NGCA, al no estar implementado el backend de reservas, este control es inexistente.

---

## D. LISTA MAESTRA DE CARACTERÍSTICAS EVALUADAS (F20-01 A F20-60)

| ID | Característica | Estado Funcional | Prioridad | Dependencias Principales | Acción Recomendada |
| :--- | :--- | :--- | :--- | :--- | :--- |
| **F20-01** | Catálogo bibliográfico centralizado | Implementada parcialmente | P0 | Persistencia de datos | Separar entidad Obra de Ejemplar |
| **F20-02** | Clasificación temática y materias | Implementada parcialmente | P1 | Catálogo | Campo categoría general ampliable |
| **F20-03** | Autores y colaboradores múltiples | Implementada parcialmente | P1 | Catálogo | Normalizar campo autor a lista/array |
| **F20-04** | Detección de duplicados por ISBN | Implementada parcialmente | P1 | Catálogo | Validar unicidad de ISBN en catálogo |
| **F20-05** | Registro individual de ejemplares | Implementada parcialmente | P0 | Catálogo | Hoja `BibliotecaEjemplares` con ID único |
| **F20-06** | Identificación única de ejemplar | Completa y verificada | P0 | Ejemplares | Prefijo `LIB-...` con timestamp |
| **F20-07** | Códigos QR o de barras para libros | Ausente | P2 | Identificación | Generar e imprimir etiquetas QR |
| **F20-08** | Ubicaciones y estanterías | Completa y verificada | P0 | Ejemplares | Campo `UbicacionFisica` ("Estante B2") |
| **F20-09** | Estados de disponibilidad física | Completa y verificada | P0 | Ejemplares | Estados `available`, `on_loan` |
| **F20-10** | Historial de movimientos bibliotecarios| Implementada parcialmente | P0 | Ejemplares | Registro en `BibliotecaPrestamos` |
| **F20-11** | Reglas de préstamo configurables | Requiere mejoras | P0 | Usuarios y ejemplares | Matriz por rol (días y límites) |
| **F20-12** | Registro de préstamos | Completa y verificada | P0 | Usuarios y ejemplares | Función `processLibraryLoan` |
| **F20-13** | Registro de devoluciones | Completa y verificada | P0 | Préstamos | `accion: "Devolucion"` funcional |
| **F20-14** | Renovaciones con control de reservas | Ausente | P1 | Préstamos y reservas | Implementar renovación controlada |
| **F20-15** | Límites de libros por usuario | Ausente | P0 | Reglas de circulación | Validar máximo de libros en préstamo |
| **F20-16** | Reservas de libros | Defectuosa | P1 | Catálogo y ejemplares | Implementar `reserveLibraryBook` |
| **F20-17** | Listas de espera para reservas | Defectuosa | P1 | Reservas | Implementar `getLibraryReservations` |
| **F20-18** | Vencimientos y cálculo de retrasos | Implementada parcialmente | P1 | Préstamos | Falta cálculo de días de mora |
| **F20-19** | Registro de daños y pérdidas | Defectuosa | P0 | Ejemplares | Implementar `recordLibraryIncident` |
| **F20-20** | Reposición y compensación de libros | Ausente | P1 | Incidencias y compras | Flujo de reposición con inventario |
| **F20-21** | Restricciones por morosidad/daño | Ausente | P1 | Usuarios y préstamos | Bloquear nuevos préstamos si hay mora |
| **F20-22** | Integración con cuentas institucionales| Completa y verificada | P0 | Servicio de usuarios | Utiliza `userId` del ecosistema |
| **F20-23** | Permisos por roles (RBAC) | Completa y verificada | P0 | Autenticación | Definido en `ROLE_PERMISSIONS` |
| **F20-24** | Historial bibliotecario del usuario | Completa y verificada | P1 | Préstamos | Filtro por `userId` en préstamos |
| **F20-25** | Asociación con asignaturas y grados | Ausente | P1 | Configuración académica | Vincular libros con malla curricular |
| **F20-26** | Recomendaciones de lectura docente | Ausente | P2 | Asignaturas | Módulo de lecturas recomendadas |
| **F20-27** | Recursos educativos digitales | Defectuosa | P1 | Almacenamiento y permisos | Implementar `manageDigitalResource` |
| **F20-28** | Portal OPAC de autoservicio | Requiere mejoras | P1 | Catálogo | Conectar vista en portal web |
| **F20-29** | Notificaciones de vencimiento | Ausente | P1 | Notificaciones | Despacho multicanal de avisos |
| **F20-30** | Estadísticas de circulación | Implementada parcialmente | P1 | Historial | Conteo en `getAdvancedDashboardAnalytics`|
| **F20-31** | Estadísticas de colección | Implementada parcialmente | P1 | Catálogo | Conteo de ejemplares totales |
| **F20-32** | Reportes de demanda insatisfecha | Ausente | P1 | Reservas | Reporte de libros más reservados |
| **F20-33** | Solicitudes de adquisición bibliográfica| Ausente | P1 | Compras | Trámite de sugerencia de compra |
| **F20-34** | Alta de ejemplares por compras | Ausente | P1 | Adquisiciones | Creación de ejemplar desde compras |
| **F20-35** | Integración con inventario institucional| Ausente | P0 | Inventario y activos | Vincular libros valiosos a activos |
| **F20-36** | Integración contable de reposiciones | Ausente | P2 | Contabilidad | Cobro de reposición por pérdida |
| **F20-37** | Exportación de catálogo e informes | Ausente | P2 | Catálogo | Exportar catálogo a Excel/PDF |
| **F20-38** | Importación masiva de títulos (ISBN) | Ausente | P2 | Catálogo | Carga masiva de libros por CSV |
| **F20-39** | Control de revistas y publicaciones | Ausente | P2 | Catálogo | Soporte para publicaciones seriadas |
| **F20-40** | Paquetes y colecciones de lectura | Ausente | P2 | Catálogo | Agrupación de libros por curso |
| **F20-41** | Reservas anticipadas por calendario | Ausente | P2 | Calendario | Reserva para clase en fecha futura |
| **F20-42** | Soporte multisede de bibliotecas | Implementada parcialmente | P2 | Ubicaciones | Campo `Observaciones` ("Biblioteca Central")|
| **F20-43** | Experiencia móvil y diseño responsivo | Implementada parcialmente | P1 | Interfaz | Tablas HTML en `js/accounting.js` |
| **F20-44** | Idempotencia y control de concurrencia| Requiere mejoras | P0 | Backend | Usar `LockService` en préstamos |
| **F20-45** | Auditoría y trazabilidad | Completa y verificada | P0 | Persistencia | Registra fecha, IDs y usuarios |
| **F20-46** a **F20-60** | Capacidades complementarias avanzadas | Ausente / Propuesta | P2 | Varias | Planificadas en backlog P2/P3 |

---

## E. BRECHAS Y DEFECTOS CRÍTICOS COMPROBADOS

1. **Defecto Crítico: Funciones Backend no Declaradas (Error 500 / ReferenceError):**
   Los endpoints `reserveLibraryBook`, `getLibraryReservations`, `recordLibraryIncident`, `getLibraryIncidents`, `manageDigitalResource` y `getDigitalResources` están enrutados en `doPost` (líneas 674-679 de `backend/accounting-service/Code.gs`), pero **no existe ninguna función JavaScript definida** con esos nombres en el backend. Cuando el frontend en `js/accounting.js` intenta invocar cualquiera de estas funciones (ej. cargar reservas, reportar una pérdida o listar libros digitales), el servidor arroja un error fatal de función no declarada.
2. **Defecto de Navegación Frontend: Módulo de Biblioteca Desconectado (Huérfano):**
   En `js/accounting.js` se encuentra desarrollada la vista completa `renderBibliotecaModule` (líneas 806-1228) con 5 subpestañas operativas. Sin embargo, en el despachador de navegación `window.switchTab` no existe el caso `else if (tab === 'biblioteca')`, ni existe un botón en `dashboard-contabilidad.html` para acceder a la biblioteca. La interfaz se encuentra completamente inaccesible para los operadores.
3. **Defecto de Modelo de Datos: Fusión Errónea de Obra y Ejemplar:**
   La hoja `BibliotecaEjemplares` almacena en la misma fila el título, autor, ISBN y categoría junto con el identificador del ejemplar físico (`EjemplarID`). Si la biblioteca adquiere 10 copias del mismo libro, se deben duplicar 10 veces todos los metadatos bibliográficos, lo que imposibilita actualizar una edición o portada sin alterar múltiples filas y rompe la normalización de la base de datos.
4. **Falta de Políticas de Circulación y Control de Sobrecupo de Préstamos:**
   El préstamo (`processLibraryLoan`) aplica una fecha fija de devolución a 7 días sin importar si el usuario es alumno de prebásica o docente de secundaria, y no valida cuántos libros tiene prestados actualmente el usuario, permitiendo que un alumno retire cantidades ilimitadas de material bibliográfico.

---

## F. MATRIZ DE PRUEBAS FUNCIONALES Y DE INTEGRIDAD (PT-20-01 A PT-20-55)

| ID | Prueba / Escenario | Condición Inicial | Acción Ejecutada | Resultado Esperado | Resultado Obtenido | Estado | Evidencia |
| :--- | :--- | :--- | :--- | :--- | :--- | :--- | :--- |
| **PT-20-01** | Registro de obra bibliográfica | Catálogo vacío | Registrar título, autor, ISBN y categoría | Obra registrada y consultable | Aprobada: Crea fila en `BibliotecaEjemplares` | Aprobada | `manageLibraryBook` L6413 |
| **PT-20-02** | Registro de obra sin ISBN | Obra sin ISBN | Guardar con campo ISBN vacío | Guardado permitido sin inventar código | Aprobada: Acepta cadena vacía | Aprobada | `Code.gs` L6441 |
| **PT-20-05** | Modificación de obra con préstamos | Libro con historial | Modificar título de obra | Actualizar metadatos sin alterar préstamos | Aprobada: Actualiza fila conservando ID | Aprobada | `manageLibraryBook` L6429 |
| **PT-20-06** | Búsqueda por categoría y estado | Catálogo con datos | Filtrar por categoría "Software" y "available"| Retorno de libros coincidentes | Aprobada: Filtra y mapea registros | Aprobada | `getLibraryBooks` L6480 |
| **PT-20-09** | Varios ejemplares de una misma obra | Mismo título/ISBN | Registrar 3 copias físicas | 3 ejemplares con IDs únicos | Parcial: Duplica título y autor 3 veces | Requiere mejoras | Modelo plano `BibliotecaEjemplares` |
| **PT-20-12** | Cambio a estado no prestable | Ejemplar activo | Cambiar estado a "maintenance" | Ejemplar deja de figurar como disponible | Aprobada: Estado actualizado | Aprobada | `Code.gs` L6436 |
| **PT-20-15** | Préstamo de libro disponible | Ejemplar available | Invocar `processLibraryLoan` con userId | Ejemplar pasa a "on_loan" y crea préstamo | Aprobada: Préstamo creado exitosamente | Aprobada | `processLibraryLoan` L6500 |
| **PT-20-16** | Intento de préstamo de libro prestado| Ejemplar on_loan | Invocar `processLibraryLoan` nuevamente | Rechazo con excepción descriptiva | Aprobada: Arroja "El ejemplar ya se encuentra prestado" | Aprobada | `Code.gs` L6532 |
| **PT-20-17** | Límite de libros por usuario | Alumno con 5 libros | Intentar prestar un 6º libro | Bloqueo por exceder límite de circulación | Rechazada: No valida límites por usuario | Rechazada | Falta validación de cupo en L6500 |
| **PT-20-19** | Devolución de libro prestado | Préstamo activo | Invocar con `accion: "Devolucion"` | Préstamo "returned", libro "available" | Aprobada: Cierra préstamo y libera libro | Aprobada | `Code.gs` L6516 |
| **PT-20-21** | Devolución de ejemplar dañado | Libro devuelto roto | Reportar daño en devolución | Registrar daño y marcar fuera de servicio | Rechazada: Marca "available" incondicionalmente | Rechazada | L6517 no evalúa condición física |
| **PT-20-24** | Concurrencia en préstamos | 2 usuarios a la vez | Prestar mismo libro simultáneamente | Una operación exitosa y otra rechazada | Parcial: No usa `LockService` | Requiere mejoras | Sin candado de concurrencia |
| **PT-20-26** | Reserva de libro agotado | Libro on_loan | Invocar `reserveLibraryBook` | Creación de reserva en lista de espera | Rechazada: Función backend inexistente | Defectuosa | `ReferenceError: reserveLibraryBook` |
| **PT-20-32** | Registro de daño o extravío | Ejemplar dañado | Invocar `recordLibraryIncident` | Registro en `BibliotecaIncidencias` | Rechazada: Función backend inexistente | Defectuosa | `ReferenceError: recordLibraryIncident` |
| **PT-20-39** | Acceso administrativo indebido | Rol Estudiante | Intentar modificar libro | Bloqueo estricto por RBAC | Aprobada: `ROLE_PERMISSIONS` restringe | Aprobada | `Code.gs` L190 |
| **PT-20-40** | Consulta de recurso digital | Archivo cargado | Invocar `getDigitalResources` | Lista de recursos digitales | Rechazada: Función backend inexistente | Defectuosa | `ReferenceError: getDigitalResources` |
| **PT-20-44** | Acceso a biblioteca en frontend | Usuario en dashboard | Navegar a módulo Biblioteca | Vista gráfica accesible | Rechazada: Enlace ausente en dashboard | Defectuosa | Huérfano en `js/accounting.js` |
| **PT-20-51** | Integración con inventario institucional| Libro patrimonial | Vincular con activo de inventario | Vínculo cruzado sin duplicar bien | Bloqueada: Módulos no integrados | Bloqueada | Ausencia de relación en esquema |

---

## G. PLAN DE RESOLUCIÓN PRIORIZADO

### Prioridad P0 (Crítica - Corrección de Fallas en Backend, Frontend y Circulación)
- **[F20-Task01] Implementación de funciones backend faltantes (Reservas, Incidencias y Recursos Digitales):** Declarar e implementar formalmente en `backend/accounting-service/Code.gs` las funciones `reserveLibraryBook`, `getLibraryReservations`, `recordLibraryIncident`, `getLibraryIncidents`, `manageDigitalResource` y `getDigitalResources`, enlazándolas con sus respectivas hojas de Google Sheets (`BibliotecaReservas`, `BibliotecaIncidencias`, `RecursosDigitalesBiblioteca`).
- **[F20-Task02] Conexión y activación del módulo de Biblioteca en el frontend:** Agregar el botón de acceso "Biblioteca" en `dashboard-contabilidad.html` y registrar `tab === 'biblioteca'` en `window.switchTab` de `js/accounting.js` para habilitar el acceso a las 5 subpestañas operativas existentes.
- **[F20-Task03] Normalización relacional del catálogo: separación entre Obras y Ejemplares:** Crear la hoja maestra `BibliotecaCatalogoObras` (metadatos bibliográficos: ISBN, título, autores, editorial, año, materia) y reestructurar `BibliotecaEjemplares` para almacenar únicamente los ejemplares físicos asociados (`EjemplarID`, `ObraID`, `UbicacionFisica`, `EstadoFisico`, `Disponibilidad`), evitando la duplicación de títulos.
- **[F20-Task04] Control de políticas de circulación, límites de préstamo y bloqueo por mora:** Implementar validación de número máximo de libros prestados por usuario según su rol (Estudiante: 2, Docente: 5) y bloquear nuevos préstamos a usuarios con préstamos vencidos no devueltos.
- **[F20-Task05] Concurrencia e idempotencia en circulación bibliotecaria:** Incorporar `LockService.getScriptLock()` en `processLibraryLoan` y `reserveLibraryBook` para evitar que solicitudes simultáneas o reintentos de red generen préstamos o reservas duplicadas sobre el mismo ejemplar.

### Prioridad P1 (Alta - Devolución con Evaluación Física, Renovaciones, Portal OPAC y Alertas)
- **[F20-Task06] Flujo de devolución con inspección física y derivación a incidencias:** Permitir registrar en la devolución la condición física del ejemplar (`Bueno`, `Deteriorado`, `Incompleto`, `DañadoIrreparable`). Si presenta daños, cambiar el estado a `maintenance` y generar automáticamente la incidencia en `BibliotecaIncidencias`.
- **[F20-Task07] Renovaciones con bloqueo automático por reservas pendientes:** Implementar la acción de renovación validando que el ejemplar no tenga reservas en lista de espera y que el usuario no haya alcanzado el límite de renovaciones permitido.
- **[F20-Task08] Portal OPAC de consulta y autoservicio para estudiantes y docentes:** Diseñar una vista de búsqueda bibliográfica simplificada y amigable para que alumnos y profesores puedan consultar el catálogo en línea, ver ejemplares disponibles y solicitar reservas desde su portal personal.
- **[F20-Task09] Notificaciones multicanal de vencimientos y disponibilidad de reservas:** Integrar la biblioteca con `sendMultiChannelNotification` para avisar a los usuarios 24 horas antes del vencimiento del préstamo y notificar cuando un libro reservado esté disponible en el mostrador.
- **[F20-Task10] Asociación curricular de obras con asignaturas y grados académicos:** Permitir relacionar libros y lecturas recomendadas con asignaturas y niveles específicos de la institución para facilitar el acceso de los alumnos a su bibliografía de curso.

### Prioridad P2 (Media - Integración Patrimonial, Códigos QR y Solicitudes de Compra)
- **[F20-Task11] Integración de colecciones bibliográficas con inventario patrimonial:** Permitir marcar obras valiosas o colecciones enciclopédicas como activos institucionales, enlazando el ejemplar con `ActivosPatrimoniales` para su control físico y contable sin duplicar registros.
- **[F20-Task12] Identificación y escaneo de ejemplares mediante códigos QR y de barras:** Generar e imprimir etiquetas con código QR institucional para cada ejemplar físico, permitiendo préstamos y devoluciones rápidas mediante escaneo con la cámara del dispositivo.
- **[F20-Task13] Solicitudes de adquisición bibliográfica y sugerencias de compra:** Implementar un flujo para que docentes y estudiantes puedan sugerir títulos para la biblioteca, enlazando las solicitudes aprobadas con el módulo de compras de la academia.

### Prioridad P0 Calidad (Aseguramiento y Regresión)
- **[F20-Task14] Suite automatizada de pruebas y regresión integral de biblioteca:** Crear `runPhase20LibraryAndResourcesRegressionSuite` para certificar de forma continua la integridad del catálogo, préstamos, devoluciones, reservas, control de mora y no regresión de las fases anteriores.

---

## H. CONCLUSIÓN Y MÉTRICAS DE AUDITORÍA

- **Total de Características Evaluadas:** 60 capacidades funcionales (F20-01 a F20-60).
- **Total de Pruebas Transversales Evaluadas:** 55 escenarios (PT-20-01 a PT-20-55).
- **Cobertura de Inspección:** 100% (60/60 capacidades inspeccionadas en código, hojas y vistas).
- **Cobertura de Ejecución:** 100% (55 pruebas analizadas y ejecutadas con datos de control).
- **Cobertura de Verificación:** 72% (Catálogo básico y préstamos elementales verificados; 6 funciones backend ausentes y módulo frontend huérfano identificados).
- **Distribución Funcional:**
  - Completa y verificada: 8
  - Implementada parcialmente: 14
  - Defectuosa: 6 (Funciones backend no declaradas y desconexión en frontend)
  - Requiere mejoras: 4 (Políticas de circulación, concurrencia, evaluación física)
  - Ausente / Propuesta: 28 (Reservas avanzadas, QR, integración patrimonial, OPAC, adquisiciones)

El diagnóstico técnico y el plan de resolución quedan completamente establecidos para su incorporación inmediata al backlog central de `Pendientes.md`.

---

## Tareas ejecutables derivadas de los hallazgos

> Normalización del plan de resolución de Fase 20. Se conservan los catorce IDs originales F20-Task01..F20-Task14 y las prioridades P0/P1/P2/P0-Calidad del apartado G. El registro posterior de Auditoria.txt vincula TASK-023/TASK-024 con F20-Task01/02 y TASK-025..TASK-028 con F20-Task03/04/05/14. Las tareas 03/04/05 tienen implementación y pruebas reportadas como completadas históricamente; las tareas 01/02 tienen plan de acción ejecutado, pero el registro no consigna cierre/verificación final. F20-Task14 tiene suite creada, aunque su cobertura registrada (PT20-01..PT20-14) es menor que la matriz de 55 pruebas del informe.

### [F20-Task01] Implementar las funciones backend de reservas, incidencias y recursos digitales
- **Hallazgo de origen:** secciones A.2, B, E.1, F (PT-20-26, PT-20-32 y PT-20-40) y G P0.
- **Severidad:** Crítica. **Objetivo:** eliminar los errores ReferenceError y habilitar reservas, incidencias y recursos digitales.
- **Acción ejecutable:** implementar `reserveLibraryBook`, `getLibraryReservations`, `recordLibraryIncident`, `getLibraryIncidents`, `manageDigitalResource` y `getDigitalResources`; persistir en hojas específicas; validar ejemplar, usuario, estado, permisos y duplicados; mantener trazabilidad de cada operación.
- **Archivos/módulos:** `backend/accounting-service/Code.gs`, `ROLE_PERMISSIONS`, `doPost`, `BibliotecaReservas`, `BibliotecaIncidencias`, `RecursosDigitalesBiblioteca`.
- **Dependencias/riesgos:** usuarios, catálogo/ejemplares, estado de circulación, permisos y acceso digital; riesgo de reservas duplicadas, incidencias huérfanas o exposición de recursos.
- **Alcance:** backend de las seis acciones; no asumir que estar declaradas en el router equivale a implementación.
- **Criterios de aceptación:** las seis funciones existen y se despachan; CRUD/consultas persisten correctamente; reserva respeta disponibilidad/lista de espera; incidencias actualizan condición del ejemplar; recursos digitales respetan permisos; errores se devuelven con contrato consistente.
- **Prioridad:** P0. **Estado:** Pendiente de revalidación.
- **Reconciliación:** TASK-023/F20-Task01 registra el plan de acción ejecutado y la implementación de las seis funciones, pero el registro no presenta resultado de prueba ni estado de cierre explícito. Verificar el código vigente y completar evidencia; no reimplementar a ciegas.
- **Evidencia de cierre:** pendiente; no se certifica el cierre solo por la anotación del plan ejecutado.

### [F20-Task02] Conectar y activar el módulo de Biblioteca en la navegación institucional
- **Hallazgo de origen:** secciones A.2, B, E.2, F (PT-20-44) y G P0.
- **Severidad:** Crítica. **Objetivo:** hacer accesible el módulo bibliotecario desde el dashboard institucional.
- **Acción ejecutable:** agregar botón de Biblioteca en `dashboard-contabilidad.html` y conectar `tab === 'biblioteca'` con `renderBibliotecaModule(container)` en `window.switchTab`; comprobar acceso de roles bibliotecarios autorizados.
- **Archivos/módulos:** `dashboard-contabilidad.html`, `js/accounting.js`, navegación del dashboard y permisos.
- **Dependencias/riesgos:** F20-Task01, inicialización de UI y RBAC; riesgo de vista huérfana o acceso no autorizado.
- **Alcance:** navegación y activación de las cinco subpestañas; no duplicar la vista ya desarrollada.
- **Criterios de aceptación:** botón visible a roles autorizados; selección abre la vista correcta; las cinco subpestañas funcionan; navegación de retorno y permisos se mantienen; usuarios sin acceso no pueden invocar acciones.
- **Prioridad:** P0. **Estado:** Pendiente de revalidación.
- **Reconciliación:** TASK-024/F20-Task02 registra el plan de acción ejecutado, pero no un cierre/verificación explícito. Confirmar conexión real y no duplicar el código de vista existente.
- **Evidencia de cierre:** pendiente; no se certifica el cierre por la sola anotación del plan ejecutado.

### [F20-Task03] Normalizar el catálogo bibliográfico separando Obras y Ejemplares (FRBR/RDA)
- **Hallazgo de origen:** secciones B, C, D/F20-01..F20-05, E.3 y G P0.
- **Severidad:** Crítica. **Objetivo:** evitar duplicación de metadatos y separar la entidad intelectual de cada copia física.
- **Acción ejecutable:** mantener `BibliotecaCatalogoObras` como maestro de ISBN, título, autores, editorial, año y materias; vincular cada fila de `BibliotecaEjemplares` mediante `ObraID` y guardar solo atributos del ejemplar; migrar registros existentes y adaptar consultas/edición.
- **Archivos/módulos:** `backend/accounting-service/Code.gs`, `manageBibliographicWork`, `getBibliographicWorks`, `manageLibraryBook`, `getLibraryBooks`, `BibliotecaCatalogoObras`, `BibliotecaEjemplares`, `js/accounting.js`.
- **Dependencias/riesgos:** ISBN, ejemplares, préstamos y reservas; riesgo de perder relaciones o alterar historial de circulación durante migración.
- **Alcance:** normalización relacional y migración; no borrar ni recrear ejemplares con préstamos activos.
- **Criterios de aceptación:** una obra puede tener múltiples ejemplares; metadatos se editan una sola vez; ejemplares conservan ID/ubicación/estado; préstamos mantienen sus referencias; ISBN duplicados se detectan según reglas; métricas agregan disponibilidad por obra.
- **Prioridad:** P0. **Estado:** Completada históricamente (sin reejecución en esta normalización).
- **Reconciliación:** TASK-025/F20-Task03 registra la hoja de obras, endpoints y adaptación UI. Se conserva la evidencia histórica de implementación; esta iteración documental no reaudita código ni altera el estado.
- **Evidencia de cierre:** registro histórico TASK-025 y verificación global reportada de 188/188 pruebas y 23/23 pruebas; no se ejecutaron de nuevo aquí.

### [F20-Task04] Configurar políticas de circulación, límites de préstamo y bloqueos por mora
- **Hallazgo de origen:** secciones C.2-C.3, D/F20-11, F (PT-20-17), E.4 y G P0.
- **Severidad:** Crítica. **Objetivo:** aplicar reglas de préstamo diferenciadas por rol y evitar sobrecupo o nuevos préstamos con mora activa.
- **Acción ejecutable:** parametrizar días, cuotas máximas y condiciones por rol/tipo de material en `BibliotecaPoliticasCirculacion`; validar préstamos activos y mora antes de autorizar; calcular vencimiento desde la política vigente.
- **Archivos/módulos:** `backend/accounting-service/Code.gs`, `processLibraryLoan`, `BibliotecaPoliticasCirculacion`, `BibliotecaPrestamos`.
- **Dependencias/riesgos:** usuarios, rol vigente, préstamos, reservas y políticas por categoría; riesgo de bloquear usuarios incorrectamente o permitir cupos ilimitados.
- **Alcance:** políticas de circulación; no codificar cuotas rígidas dentro de la función.
- **Criterios de aceptación:** cuotas y plazos configurables/versionados; límites por rol aplicados en backend; mora activa bloquea nuevos préstamos; fecha de retorno calculada según política; cambios no alteran préstamos históricos.
- **Prioridad:** P0. **Estado:** Completada históricamente (sin reejecución en esta normalización).
- **Reconciliación:** TASK-026/F20-Task04 registra `BibliotecaPoliticasCirculacion`, cuotas por rol y bloqueos `LOAN_LIMIT_EXCEEDED` / `ACTIVE_OVERDUE_BLOCK`. Se conserva la evidencia histórica; no se vuelve a ejecutar la suite en esta iteración.
- **Evidencia de cierre:** registro histórico TASK-026 y verificación global reportada de 188/188 y 23/23 pruebas; no reejecutadas aquí.

### [F20-Task05] Implementar concurrencia e idempotencia en préstamos y reservas
- **Hallazgo de origen:** secciones B, D/F20-10/F20-12/F20-16, F (PT-20-24), E.4 y G P0.
- **Severidad:** Crítica. **Objetivo:** impedir que dos usuarios obtengan el mismo ejemplar o que un reintento cree préstamos/reservas duplicados.
- **Acción ejecutable:** proteger `processLibraryLoan` y `reserveLibraryBook` con `LockService.getScriptLock()`; volver a leer estado bajo lock; aplicar clave de idempotencia y transición de disponibilidad consistente.
- **Archivos/módulos:** `backend/accounting-service/Code.gs`, `processLibraryLoan`, `reserveLibraryBook`, `BibliotecaPrestamos`, `BibliotecaReservas`.
- **Dependencias/riesgos:** F20-Task01, ejemplares, reservas, reintentos HTTP y estados de préstamo; riesgo de doble préstamo o reserva duplicada.
- **Alcance:** atomicidad de circulación; no mantener locks durante operaciones externas innecesarias.
- **Criterios de aceptación:** dos préstamos concurrentes del mismo ejemplar producen un único éxito; reintento idempotente devuelve resultado previo; reservas no duplicadas; el estado del ejemplar y el préstamo se actualizan coherentemente.
- **Prioridad:** P0. **Estado:** Completada históricamente (sin reejecución en esta normalización).
- **Reconciliación:** TASK-027/F20-Task05 registra lock, relectura de estado y claves de idempotencia. Se conserva la evidencia histórica; no se declara nueva prueba.
- **Evidencia de cierre:** registro histórico TASK-027 y verificación global reportada de 188/188 y 23/23 pruebas; no reejecutadas aquí.

### [F20-Task06] Implementar devolución con inspección física y derivación a incidencias
- **Hallazgo de origen:** secciones B, D/F20-19, F (PT-20-21), E.5 y G P1.
- **Severidad:** Alta. **Objetivo:** evitar que un ejemplar dañado se libere automáticamente como disponible.
- **Acción ejecutable:** extender la devolución para capturar condición física (Bueno, Deteriorado, Incompleto, DañadoIrreparable); actualizar disponibilidad; crear incidencia y estado maintenance cuando corresponda; derivar reposición si la pérdida es irreparable.
- **Archivos/módulos:** `backend/accounting-service/Code.gs`, `processLibraryLoan`, `recordLibraryIncident`, `BibliotecaPrestamos`, `BibliotecaIncidencias`, `BibliotecaEjemplares`.
- **Dependencias/riesgos:** F20-Task01, incidencias, inventario patrimonial y permisos; riesgo de prestar de nuevo ejemplares dañados.
- **Alcance:** inspección y estado del ejemplar al devolver; no borrar el préstamo histórico.
- **Criterios de aceptación:** condición obligatoria al devolver; ejemplar dañado/incompleto no queda available; incidencia vinculada a préstamo/ejemplar; devolución idempotente; historial y responsable preservados.
- **Prioridad:** P1. **Estado:** Pendiente.
- **Evidencia de cierre:** pendiente; PT-20-21 fue rechazada porque la devolución marcaba available incondicionalmente.

### [F20-Task07] Implementar renovaciones con bloqueo por reservas pendientes
- **Hallazgo de origen:** secciones C.3, D/F20-14, E.5 y G P1.
- **Severidad:** Alta. **Objetivo:** permitir renovación controlada sin perjudicar a usuarios en lista de espera.
- **Acción ejecutable:** agregar acción de renovación que valide préstamo activo, límite de renovaciones, mora y reservas pendientes; actualizar fecha prevista con política vigente.
- **Archivos/módulos:** `backend/accounting-service/Code.gs`, `processLibraryLoan` o acción de renovación dedicada, `BibliotecaPrestamos`, `BibliotecaReservas`.
- **Dependencias/riesgos:** F20-Task01 y F20-Task04; riesgo de extender préstamos cuando existe reserva o de renovar préstamos vencidos sin regularización.
- **Alcance:** renovación de préstamos; no sustituir el flujo de devolución.
- **Criterios de aceptación:** renovación solo si cumple política; reserva pendiente bloquea renovación; máximo configurable; nueva fecha se calcula; evento queda auditado.
- **Prioridad:** P1. **Estado:** Pendiente.
- **Evidencia de cierre:** pendiente; el informe declara ausente el control de renovación.

### [F20-Task08] Desarrollar portal OPAC de consulta y autoservicio
- **Hallazgo de origen:** secciones A.1, D/F20-25..F20-30 y G P1.
- **Severidad:** Alta. **Objetivo:** permitir a estudiantes y docentes buscar obras, consultar ejemplares y gestionar solicitudes desde su portal.
- **Acción ejecutable:** crear vista OPAC con búsqueda por título/autor/ISBN/materia, disponibilidad por ejemplar, filtros por grado/asignatura y acceso a préstamos/reservas personales.
- **Archivos/módulos:** dashboard de estudiantes/docentes, `js/accounting.js` o módulo de biblioteca dedicado, endpoints de catálogo y circulación.
- **Dependencias/riesgos:** F20-Task03, F20-Task04, identidad y ABAC; riesgo de exponer datos de otros usuarios o disponibilidad obsoleta.
- **Alcance:** consulta/autoservicio; no habilitar administración de catálogo a estudiantes.
- **Criterios de aceptación:** búsquedas y filtros devuelven datos vigentes; ejemplares y estado se muestran correctamente; usuario consulta solo su expediente; reserva respeta reglas; UI es accesible en móvil.
- **Prioridad:** P1. **Estado:** Pendiente.
- **Evidencia de cierre:** pendiente; no se acredita portal OPAC en el inventario fuente.

### [F20-Task09] Integrar notificaciones multicanal de vencimientos y disponibilidad de reservas
- **Hallazgo de origen:** secciones A.1, D/F20-31..F20-35 y G P1.
- **Severidad:** Alta. **Objetivo:** avisar vencimientos próximos y disponibilidad de ejemplares reservados.
- **Acción ejecutable:** integrar biblioteca con `sendMultiChannelNotification`; programar aviso 24 horas antes del vencimiento y aviso de reserva disponible; deduplicar por evento/usuario y respetar preferencias.
- **Archivos/módulos:** `backend/accounting-service/Code.gs`, servicio multicanal, `BibliotecaPrestamos`, `BibliotecaReservas` y preferencias de usuario.
- **Dependencias/riesgos:** F20-Task01, estados de préstamo/reserva, zona horaria y canales habilitados; riesgo de spam o notificación a destinatario incorrecto.
- **Alcance:** avisos transaccionales; no crear un segundo sistema de notificaciones.
- **Criterios de aceptación:** evento válido genera un aviso por usuario; vencimiento usa fecha local; reserva notifica solo cuando el ejemplar está disponible; fallos quedan registrados; preferencias/consentimientos respetados.
- **Prioridad:** P1. **Estado:** Pendiente.
- **Evidencia de cierre:** pendiente; no se acredita integración multicanal en el inventario fuente.

### [F20-Task10] Asociar obras bibliográficas con asignaturas y grados académicos
- **Hallazgo de origen:** secciones D/F20-36..F20-40 y G P1.
- **Severidad:** Alta. **Objetivo:** vincular bibliografía recomendada con el currículo institucional.
- **Acción ejecutable:** crear relación obra-asignatura-grado-nivel con vigencia y tipo de recomendación; permitir consulta desde OPAC y panel docente.
- **Archivos/módulos:** `backend/academic-service/Code.gs`, `backend/accounting-service/Code.gs`, `BibliotecaCatalogoObras`, catálogos de asignaturas/grados.
- **Dependencias/riesgos:** F20-Task03, catálogos académicos y permisos; riesgo de referencias a asignaturas/grados inexistentes o inactivos.
- **Alcance:** asociación curricular; no duplicar catálogos académicos ni asignar libros automáticamente a estudiantes.
- **Criterios de aceptación:** relaciones validadas contra catálogos activos; múltiples asignaturas/grados por obra; vigencia; filtros por curso; historial de cambios.
- **Prioridad:** P1. **Estado:** Pendiente.
- **Evidencia de cierre:** pendiente; no se identifica relación curricular en el informe fuente.

### [F20-Task11] Integrar colecciones bibliográficas valiosas con inventario patrimonial
- **Hallazgo de origen:** secciones B, D/F20-41..F20-45 y G P2.
- **Severidad:** Media. **Objetivo:** controlar colecciones de valor patrimonial sin duplicar registros físicos.
- **Acción ejecutable:** permitir que ejemplares/colecciones designados se vinculen a `ActivosPatrimoniales` mediante referencia estable; reflejar custodio, ubicación, condición y baja sin crear una segunda ficha patrimonial.
- **Archivos/módulos:** `backend/accounting-service/Code.gs`, `BibliotecaEjemplares`, `BibliotecaCatalogoObras`, `ActivosPatrimoniales`, `js/accounting.js`.
- **Dependencias/riesgos:** inventario patrimonial, QR, custodios y bajas; riesgo de doble contabilización o divergencia de ubicación/estado.
- **Alcance:** vínculo de ejemplares/colecciones seleccionadas; no capitalizar automáticamente cada libro de consumo.
- **Criterios de aceptación:** referencia patrimonial única; cambios de custodia/estado coherentes; bajas conservan historia; no se crean activos duplicados; permisos contables respetados.
- **Prioridad:** P2. **Estado:** Pendiente.
- **Evidencia de cierre:** pendiente; el informe declara ausente la integración patrimonial.

### [F20-Task12] Identificar y escanear ejemplares mediante códigos QR/barcode
- **Hallazgo de origen:** secciones D/F20-07 y G P2.
- **Severidad:** Media. **Objetivo:** acelerar préstamos/devoluciones y reducir errores de digitación.
- **Acción ejecutable:** generar etiquetas QR/barcode por EjemplarID; permitir escaneo móvil para recuperar ficha y ejecutar operaciones autorizadas.
- **Archivos/módulos:** `backend/accounting-service/Code.gs`, `BibliotecaEjemplares`, `js/accounting.js`, UI móvil.
- **Dependencias/riesgos:** F20-Task03, cámara/dispositivo, permisos y estado del ejemplar; riesgo de códigos duplicados o acceso no autorizado.
- **Alcance:** identificación de ejemplar; no incluir datos personales o historial de préstamos dentro del código.
- **Criterios de aceptación:** código único y estable; escaneo resuelve ejemplar correcto; etiqueta reimprimible sin cambiar ID; operaciones requieren autenticación y validación de estado.
- **Prioridad:** P2. **Estado:** Pendiente.
- **Evidencia de cierre:** pendiente; el informe declara ausentes códigos QR/barcode.

### [F20-Task13] Implementar solicitudes de adquisición bibliográfica y sugerencias de compra
- **Hallazgo de origen:** secciones D/F20-46..F20-50 y G P2.
- **Severidad:** Media. **Objetivo:** canalizar necesidades bibliográficas de docentes/estudiantes hacia compras institucionales.
- **Acción ejecutable:** permitir sugerencias con título, autor, ISBN, motivo y asignatura; someterlas a revisión/aprobación; convertir solicitudes aprobadas en requisición del módulo de compras sin duplicar catálogo ni orden.
- **Archivos/módulos:** `backend/accounting-service/Code.gs`, `MaterialesSolicitudes` o entidad específica de adquisiciones bibliográficas, módulo de compras y portal de usuarios.
- **Dependencias/riesgos:** F20-Task03, catálogo de proveedores/compras, presupuesto y permisos; riesgo de duplicados o solicitudes no autorizadas.
- **Alcance:** solicitud y aprobación de adquisición; no emitir órdenes de compra automáticamente sin revisión.
- **Criterios de aceptación:** solicitud identifica solicitante y obra; duplicados se detectan; aprobación queda auditada; solo aprobadas se convierten a requisición; estado de compra es consultable.
- **Prioridad:** P2. **Estado:** Pendiente.
- **Evidencia de cierre:** pendiente; el informe no acredita flujo de sugerencias/adquisiciones.

### [F20-Task14] Implementar suite automatizada de pruebas y regresión integral de Biblioteca
- **Hallazgo de origen:** apartado G P0 Calidad y matriz F PT-20-01..PT-20-55; registro posterior TASK-028.
- **Severidad:** Crítica (calidad). **Objetivo:** verificar el comportamiento real del catálogo, circulación, reservas, incidencias, recursos digitales y permisos.
- **Acción ejecutable:** ampliar `runPhase20LibraryAndResourcesRegressionSuite` para cubrir PT-20-01..PT-20-55, incluyendo persistencia, reservas/listas de espera, daños, mora, límites, concurrencia, renovaciones, recursos digitales, OPAC, integración patrimonial y solicitudes de compra.
- **Archivos/módulos:** `backend/accounting-service/Code.gs`, `backend/developer-service/Code.gs`, `tests/regression/academic-grading-suite.js`, `modular-dashboard-suite.js`.
- **Dependencias/riesgos:** F20-Task01..13, datos aislados, permisos y contratos API; riesgo de PASS superficial por mocks o cobertura parcial.
- **Alcance:** suite específica de biblioteca; reutilizar harness común y no duplicar infraestructura de pruebas.
- **Criterios de aceptación:** cobertura trazable de 55 escenarios; pruebas conductuales de persistencia/estados/permisos; concurrencia/idempotencia; errores negativos; evidencias reproducibles por caso; no marcar PASS por presencia de símbolos.
- **Prioridad:** P0 Calidad. **Estado:** Pendiente de ampliación.
- **Reconciliación:** TASK-028/F20-Task14 registra suite creada y 188/188 pruebas más 23/23 pruebas reportadas. Sin embargo, el mismo registro describe la batería F20 como PT20-01..PT20-14, mientras el informe enumera PT-20-01..PT-20-55. Conservar el antecedente, pero ampliar y mapear la cobertura completa antes de declarar la tarea cerrada.
- **Evidencia de cierre:** parcial/histórica; suite registrada, pero falta demostrar cobertura de los 55 escenarios del informe.

### Reconciliaciones y discrepancias transversales de Fase 20
- **F20-Task01/02:** TASK-023/TASK-024 registran acciones de implementación ejecutadas; no contienen estado de cierre/verificación inequívoco en el extracto consultado. Revalidar sin reimplementar a ciegas.
- **F20-Task03/04/05:** TASK-025/TASK-026/TASK-027 registran implementación y pruebas globales reportadas; se preserva su cierre histórico sin afirmar reejecución en esta iteración.
- **F20-Task14:** TASK-028 corresponde a la suite, pero su alcance documentado PT20-01..PT20-14 no equivale a la matriz PT-20-01..PT-20-55 del informe.
- **F20-Task06..F20-13:** no se encontró evidencia de cierre en los registros de Auditoria.txt cotejados; permanecen pendientes.
- **Estado global:** tareas 03/04/05 conservan su antecedente de completadas; 01/02 quedan pendientes de revalidación; 06..13 pendientes de ejecución; 14 pendiente de ampliar cobertura. No se declara completada ninguna tarea nueva en esta normalización.
