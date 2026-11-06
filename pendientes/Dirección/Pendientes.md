# Pendientes del departamento: Dirección

> Migración íntegra desde `Pendientes.md` (raíz del repositorio). Fuente consultada en la rama `NG_beta_0.0.0.1_work`, blob SHA `8867ecf1f58f768cac8fa5ddaa7b50bb68e57158`. Los bloques de tareas se conservaron completos, incluidos identificadores, descripciones, criterios, severidad y estados. No editar la fuente para mantener esta distribución: los cambios futuros de tareas se registran en los archivos departamentales.

**Responsabilidad de clasificación:** Gobierno institucional, metodología, seguridad de roles, administración general, supervisión y continuidad.

**Tareas migradas:** 10

---

### [REQ-EXP-001] Adopción de Metodología de Desarrollo y Auditoría (Sección 2)
- **Origen del Hallazgo:** Requerimientos de Desarrollo y Expansión (Sección 2).
- **Severidad/Clasificación:** Crítico
- **Archivos Involucrados:** `METODOLOGIA_DESARROLLO.md`, `Auditoria.txt`, `ChangesLogs.txt`, `Pendientes.md`, `MapaDependencias.md`
- **Dependencias Expuestas:** Todas las dependencias del proyecto.
- **Descripción del Alcance:** Establecer y cumplir estrictamente el procedimiento obligatorio de 8 fases para la organización, ejecución, verificación y documentación de cambios.
- **Criterios de Aceptación:** Toda modificación cumple el flujo de auditoría previo, respaldo, registro en auditoría/changeslogs y verificación funcional.
- **Estado:** [X] Completada

---

### [REQ-EXP-002] Auditoría de Hoja de Cálculo de Referencia e Inspección de Datos (Sección 3)
- **Origen del Hallazgo:** Requerimientos de Desarrollo y Expansión (Sección 3).
- **Severidad/Clasificación:** Alto
- **Archivos Involucrados:** `backend/Spreadsheet/AREA DE INFORMATICA IMA.xlsx`, `backend/academic-service/Code.gs`, `backend/user-service/Code.gs`
- **Dependencias Expuestas:** `ConfiguracionAcademica`, `HistorialAcademico`, `Tareas`, `Entregas`
- **Descripción del Alcance:** Auditar la estructura de tablas de referencia, normalizar entidades y establecer claves primarias e índices de relación de datos.
- **Criterios de Aceptación:** Esquema tabular de 9 columnas en `ConfiguracionAcademica` y 8 en `HistorialAcademico` operando sin redundancias JSON.
- **Estado:** [X] Completada

---

### [REQ-EXP-005] Procedimiento de Cierre de Año Escolar y Purga de Drive (Sección 7 / 18)
- **Origen del Hallazgo:** Requerimientos de Desarrollo y Expansión (Sección 7 / 18 - Fase 3/9).
- **Severidad/Clasificación:** Crítico
- **Archivos Involucrados:** `backend/task-service/Code.gs`, `teacher-dashboard.html`, `js/teacher.js`
- **Dependencias Expuestas:** Google Drive API (DriveApp), Spreadsheets `Tareas`, `Entregas`, `ConfiguracionAcademica`.
- **Descripción del Alcance:** Ejecutar borrado físico en Google Drive (setTrashed) de archivos de entregas y resetear asignaciones docentes al cerrar el ciclo.
- **Criterios de Aceptación:** Confirmación explícita, eliminación de archivos en Drive y limpieza de asignaciones para inicio de nuevo año.
- **Estado:** [X] Completada

---

### [REQ-EXP-007] Renombrado Institucional e Identidad Visual PWA (Sección 4)
- **Origen del Hallazgo:** Requerimientos de Desarrollo y Expansión (Sección 4).
- **Severidad/Clasificación:** Alto
- **Archivos Involucrados:** `index.html`, `login.html`, `register.html`, `student-dashboard.html`, `teacher-dashboard.html`, `manifest.json`, `imagenes/new-generation-logo.png`
- **Dependencias Expuestas:** Encabezados HTML, pies de página, manifiesto PWA, diálogos de login/registro.
- **Descripción del Alcance:** Reemplazar todas las menciones institucionales anteriores por "New Generation Bilingual School and Institute", renombrar recurso de logotipo a `new-generation-logo.png` y actualizar PWA manifest.
- **Criterios de Aceptación:** No existen referencias institucionales obsoletas en la UI pública. El logotipo carga correctamente en todas las vistas.
- **Estado:** [ ] Pendiente

---

### [REQ-EXP-008] Sistema de Roles y Permisos Granulares Servidor/RBAC (Sección 5)
- **Origen del Hallazgo:** Requerimientos de Desarrollo y Expansión (Sección 5).
- **Severidad/Clasificación:** Crítico
- **Archivos Involucrados:** `backend/user-service/Code.gs`, `js/config.js`, `js/api.js`
- **Dependencias Expuestas:** Matriz de autorización por rol (Administrador, Director, Subdirector, Secretaría, Contador, Consejeros, Profesor, Asistente, Alumnos/Padres).
- **Descripción del Alcance:** Validar roles y permisos del lado del servidor en cada endpoint. Garantizar que ocultar botones en la interfaz no sea el único mecanismo de seguridad.
- **Criterios de Aceptación:** Rechazo explícito en backend (`AUTH_PERMISSION_DENIED`) ante peticiones no autorizadas para la responsabilidad del usuario.
- **Estado:** [ ] Pendiente

---

### [REQ-EXP-017] Consola de Administración Técnica, Panel de Estado y Health Checks Ping-Pong (Sección 14.1 - 14.3)
- **Origen del Hallazgo:** Requerimientos de Desarrollo y Expansión (Sección 14.1 - 14.3).
- **Severidad/Clasificación:** Crítico
- **Archivos Involucrados:** `teacher-dashboard.html`, `js/teacher.js`, `backend/academic-service/Code.gs`, `backend/user-service/Code.gs`
- **Dependencias Expuestas:** Monitoreo de microservicios (USER, ACADEMIC, TASK, EXAM).
- **Descripción del Alcance:** Construir panel de estado general para el rol Administrador con solicitudes ping-pong de salud real de los endpoints, tiempos de respuesta e indicadores visuales (En línea, Degradado, Fuera de línea).
- **Criterios de Aceptación:** Verificación real de conectividad sin estados simulados.
- **Estado:** [ ] Pendiente

---

### [REQ-EXP-018] Sistema de Logs Estructurados por Servicio y Función (Sección 14.4 - 14.6)
- **Origen del Hallazgo:** Requerimientos de Desarrollo y Expansión (Sección 14.4 - 14.6).
- **Severidad/Clasificación:** Alto
- **Archivos Involucrados:** `backend/user-service/Code.gs`, `backend/academic-service/Code.gs`, `js/api.js`
- **Dependencias Expuestas:** Visor de logs en Consola Técnica.
- **Descripción del Alcance:** Registrar eventos con fecha, hora, severidad, servicio, función y códigos de error unívocos (ej. `AUTH_INVALID_CREDENTIALS`, `SHEETS_WRITE_FAILED`), con filtros por severidad y fecha.
- **Criterios de Aceptación:** Logs detallados sin exponer información sensible ni contraseñas.
- **Estado:** [ ] Pendiente

---

### [REQ-EXP-019] Módulo de Copias de Seguridad, Verificación y Mantenimiento Seguro (Sección 14.7 - 14.8)
- **Origen del Hallazgo:** Requerimientos de Desarrollo y Expansión (Sección 14.7 - 14.8).
- **Severidad/Clasificación:** Crítico
- **Archivos Involucrados:** `backend/user-service/Code.gs`, `backend/academic-service/Code.gs`
- **Dependencias Expuestas:** Drive API, automatización de respaldos de datos de la institución.
- **Descripción del Alcance:** Crear respaldos manuales/programados, verificar integridad de archivos guardados, control de restauración protegida con confirmación doble y herramientas de mantenimiento seguro.
- **Criterios de Aceptación:** Generación exitosa de respaldos verificables con políticas de retención.
- **Estado:** [ ] Pendiente

---

### [REQ-DOC-010] Panel Administrativo del Desarrollador, Consola Técnica y Exportación RAR/ZIP (Sección 10 / 11)
- **Origen del Hallazgo:** Especificación de Gestión Docente y Tareas (Sección 10 / 11).
- **Severidad/Clasificación:** Crítico
- **Archivos Involucrados:** `teacher-dashboard.html`, `js/teacher.js`, `backend/academic-service/Code.gs`
- **Dependencias Expuestas:** Consola técnica de administración, exportación documental por año lectivo.
- **Descripción del Alcance:** Configurar horas de publicación e intervalo post-clase, monitoreo de salud de microservicios, visor de logs y exportación comprimida (ZIP/RAR) de archivos del año escolar seleccionado.
- **Criterios de Aceptación:** Descarga de paquete comprimido respetando la estructura de carpetas sin bloquear la interfaz.
- **Estado:** [ ] Pendiente

---

### [REQ-DOC-012] Seguridad en Servidor, Permisos y Trazabilidad de Contenidos (Sección 14)
- **Origen del Hallazgo:** Especificación de Gestión Docente y Tareas (Sección 14).
- **Severidad/Clasificación:** Crítico
- **Archivos Involucrados:** `backend/academic-service/Code.gs`, `backend/task-service/Code.gs`, `js/api.js`
- **Dependencias Expuestas:** Capa de autorización en microservicios backend.
- **Descripción del Alcance:** Enforzar permisos en el servidor para evitar que docentes publiquen en asignaturas/secciones no asignadas. Proteger credenciales de Drive y registrar trazabilidad de fechas de entrega.
- **Criterios de Aceptación:** Peticiones no autorizadas rechazadas en backend independientemente de la interfaz cliente.
- **Estado:** [ ] Pendiente
