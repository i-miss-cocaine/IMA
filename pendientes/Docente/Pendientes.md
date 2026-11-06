# Pendientes del departamento: Docente

> Migración íntegra desde `Pendientes.md` (raíz del repositorio). Fuente consultada en la rama `NG_beta_0.0.0.1_work`, blob SHA `8867ecf1f58f768cac8fa5ddaa7b50bb68e57158`. Los bloques de tareas se conservaron completos, incluidos identificadores, descripciones, criterios, severidad y estados. No editar la fuente para mantener esta distribución: los cambios futuros de tareas se registran en los archivos departamentales.

**Responsabilidad de clasificación:** Configuración académica, planificación, recursos de enseñanza, evaluación y herramientas de gestión docente.

**Tareas migradas:** 20

---

### [UNIF-001] Unificación de Configuración Académica
- **Origen del Hallazgo:** Nueva Tarea Adicional.
- **Severidad:** Crítico.
- **Archivos Involucrados:** backend/user-service/Code.gs, js/config.js
- **Descripción:** Migrar ConfiguracionAcademica a estructura granular, eliminando redundancias con AsignaturasPorParcial.
- **Estado:** [X] Completada

---

### [FIX-001] Corrección DataError y Persistencia profesorId
- **Estado:** [X] Completada

---

### [AUTH-001] Filtrado de Asignaturas por Grado
- **Estado:** [X] Completada

---

### [PROF-001] Personalización por Docente e Integridad
- **Estado:** [X] Completada

---

### [NAV-001] Flujo de Navegación Contextual Docente
- **Estado:** [X] Completada

---

### [CONF-001] Desacoplamiento Parcial/Unidad y Lógica Upsert
- **Origen del Hallazgo:** Auditoria.txt (v7.8.7)
- **Severidad/Clasificación:** Crítico
- **Archivos Involucrados:** `backend/user-service/Code.gs`
- **Descripción del Alcance:**
  1. Modificar `updateAcademicConfig` para tratar Parcial y Unidad como conceptos independientes.
  2. Implementar búsqueda por contexto (Parcial, Grado, Sección, Asignatura, Tema, Profesor) antes de crear registro.
  3. Si existe, actualizar fila; si no, crear nueva.
- **Criterios de Aceptación:** No se generan registros duplicados. Las unidades corresponden a la planificación real.
- **Estado:** [X] Completada

---

### [DATE-001] Ciclo de Vida Dinámico de Columna Fecha
- **Origen del Hallazgo:** Auditoria.txt (v7.8.7)
- **Severidad/Clasificación:** Medio
- **Archivos Involucrados:** `backend/user-service/Code.gs`
- **Descripción del Alcance:** Implementar lógica de fecha: nuevo parcial = mes actual; al configurar siguiente parcial = actualizar anterior con rango (inicio - fin).
- **Criterios de Aceptación:** Las filas reflejan periodos de vigencia automáticos según el mes de configuración.
- **Estado:** [X] Completada

---

### [NAV-002] Navegación Docente Basada en Configuración Vigente
- **Origen del Hallazgo:** Auditoria.txt (v7.8.7)
- **Severidad/Clasificación:** Alto
- **Archivos Involucrados:** `js/teacher.js`
- **Descripción del Alcance:** Restringir `renderGrados`, `renderSecciones` y `renderAsignaturas` para que utilicen exclusivamente `window.GLOBAL_SCOPE`.
- **Criterios de Aceptación:** Solo aparecen los grados y materias configurados por el docente para el periodo activo.
- **Estado:** [X] Completada

---

### [MOD-001] Modularización de Microservicio Académico
- **Origen del Hallazgo:** Nueva Revisión Post-Commit.
- **Severidad:** Alto.
- **Descripción:** Separación de lógica académica del microservicio de usuarios.
- **Estado:** [X] Completada

---

### [REQ-EXP-003] Estructura Académica Jerárquica y Separación Estricta (Sección 6)
- **Origen del Hallazgo:** Requerimientos de Desarrollo y Expansión (Sección 6).
- **Severidad/Clasificación:** Crítico
- **Archivos Involucrados:** `js/teacher.js`, `js/student.js`, `js/config.js`, `backend/academic-service/Code.gs`
- **Dependencias Expuestas:** `GLOBAL_SCOPE`, `GranularConfig`, `SUBJECT_GRADE_MAP`
- **Descripción del Alcance:** Enforzar la jerarquía Nivel -> Grado -> Sección -> Asignatura -> Asignación Docente. Impedir mezclas entre secciones y asignaturas de distintos grados.
- **Criterios de Aceptación:** Navegación en cascada obligatoria, salto automático en sección única, validación de unicidad de 4 factores en backend.
- **Estado:** [X] Completada

---

### [REQ-EXP-004] Consolidación del Módulo Académico, Evaluaciones y Tareas (Sección 7)
- **Origen del Hallazgo:** Requerimientos de Desarrollo y Expansión (Sección 7).
- **Severidad/Clasificación:** Alto
- **Archivos Involucrados:** `js/teacher.js`, `js/student.js`, `backend/task-service/Code.gs`, `backend/exam-service/Code.gs`
- **Dependencias Expuestas:** Módulo de entregas, tareas, exámenes y regla de penalización por entrega tardía (50%).
- **Criterios de Aceptación:** Expedientes, entregas, calificaciones, asistencia y evaluaciones operando bajo el alcance global sin modificar registros históricos retroactivamente.
- **Estado:** [X] Completada

---

### [REQ-DOC-001] Gestión de Guías de Estudio por Asignatura y Parcial (Sección 3)
- **Origen del Hallazgo:** Especificación de Gestión Docente y Tareas (Sección 3).
- **Severidad/Clasificación:** Alto
- **Archivos Involucrados:** `teacher-dashboard.html`, `js/teacher.js`, `js/student.js`, `backend/academic-service/Code.gs`
- **Dependencias Expuestas:** `getAcademicConfig`, subida de archivos, tipos MIME documentales autorizados (PDF, DOCX, TXT, XLSX, PPTX).
- **Descripción del Alcance:** Permitir a los docentes crear, publicar, sustituir, consultar y desactivar guías de estudio por asignatura, grado, sección y parcial, con sanitización de contenido y visualización en el dashboard estudiantil.
- **Criterios de Aceptación:** Las guías creadas se vinculan correctamente a la asignatura/parcial y se despliegan para alumnos autorizados.
- **Estado:** [ ] Pendiente

---

### [REQ-DOC-002] Registro de Contenido de Clases y Presentaciones por Tema (Sección 4 / 13.1 - 13.2)
- **Origen del Hallazgo:** Especificación de Gestión Docente y Tareas (Sección 4 / 13.1 - 13.2).
- **Severidad/Clasificación:** Alto
- **Archivos Involucrados:** `js/teacher.js`, `js/config.js`, `teacher-dashboard.html`
- **Dependencias Expuestas:** `PRESENTATION_INDEX`, `GLOBAL_SCOPE.TemaActual`, integración con Google Drive.
- **Descripción del Alcance:** Organizar material pedagógico por tema (título, descripción, fecha de clase, contenido en editor enriquecido, presentación adjunta en Drive, documentos complementarios y tareas asociadas).
- **Criterios de Aceptación:** Asociación temas-presentaciones-recursos almacenada y persistida tras recarga de página.
- **Estado:** [X] Completada

---

### [REQ-DOC-003] Creación de Tareas Polimórficas y Validación de Contenido Obligatorio (Sección 5.1 - 5.3)
- **Origen del Hallazgo:** Especificación de Gestión Docente y Tareas (Sección 5.1 - 5.3).
- **Severidad/Clasificación:** Crítico
- **Archivos Involucrados:** `teacher-dashboard.html`, `js/teacher.js`, `backend/task-service/Code.gs`
- **Dependencias Expuestas:** Editor Quill, modal de creación de tareas, validaciones de adjuntos.
- **Descripción del Alcance:** Proveer tres modalidades de creación (A. Editor de texto enriquecido, B. Documento adjunto, C. Ejercicios a desarrollar). Validar que ninguna tarea se guarde sin contenido o sin fecha límite.
- **Criterios de Aceptación:** Bloqueo de guardado ante tareas vacías y almacenamiento de instrucciones/archivos en backend.
- **Estado:** [X] Completada

---

### [REQ-DOC-004] Desacoplamiento de Guías de Estudio vs Tareas Evaluables (Sección 5.4)
- **Origen del Hallazgo:** Especificación de Gestión Docente y Tareas (Sección 5.4).
- **Severidad/Clasificación:** Alto
- **Archivos Involucrados:** `js/teacher.js`, `js/student.js`, `backend/task-service/Code.gs`
- **Dependencias Expuestas:** Clasificación de tipo de recurso (`tipoRecurso`).
- **Descripción del Alcance:** Permitir indicar la función del material (tarea/actividad para entregar, ejercicios, guía de estudio, material de apoyo). Garantizar que las guías de estudio no aparezcan automáticamente como tareas pendientes.
- **Criterios de Aceptación:** Distinción visual y lógica clara entre guías informativas y actividades evaluables que requieren entrega.
- **Estado:** [X] Completada

---

### [REQ-DOC-005] Programación de Publicación Posterior a Clase y Fecha Predeterminada (Sección 6.1 - 6.2)
- **Origen del Hallazgo:** Especificación de Gestión Docente y Tareas (Sección 6.1 - 6.2).
- **Severidad/Clasificación:** Medio
- **Archivos Involucrados:** `js/teacher.js`, `teacher-dashboard.html`
- **Dependencias Expuestas:** Cálculo de fechas en el formulario de creación de tareas.
- **Descripción del Alcance:** Sugerir por defecto como fecha de entrega el día siguiente a la fecha de la clase impartida. Permitir al docente modificar la fecha y validar que la entrega no sea anterior a la fecha de clase.
- **Criterios de Aceptación:** La fecha por defecto se calcula a partir de la fecha de la clase vinculada.
- **Estado:** [ ] Pendiente

---

### [REQ-DOC-006] Hora de Disponibilidad de Tareas Independiente de Fecha Límite (Sección 6.3 - 6.5)
- **Origen del Hallazgo:** Especificación de Gestión Docente y Tareas (Sección 6.3 - 6.5).
- **Severidad/Clasificación:** Crítico
- **Archivos Involucrados:** `js/teacher.js`, `js/student.js`, `backend/task-service/Code.gs`
- **Dependencias Expuestas:** Máquina de estados de la tarea (Borrador, Programada, Publicada, Disponible, Entregada, Vencida, Cerrada).
- **Descripción del Alcance:** Manejar hora de disponibilidad configurada desde el panel administrativo de desarrollador. Ocultar el botón de entrega si la tarea aún está programada para el futuro tras la clase.
- **Criterios de Aceptación:** Control de visibilidad y bloqueo de entregas antes de la hora de disponibilidad configurada.
- **Estado:** [ ] Pendiente

---

### [REQ-DOC-007] Visualización de Tareas y Recursos en Dashboard Estudiantil (Sección 7)
- **Origen del Hallazgo:** Especificación de Gestión Docente y Tareas (Sección 7).
- **Severidad/Clasificación:** Alto
- **Archivos Involucrados:** `js/student.js`, `student-dashboard.html`
- **Dependencias Expuestas:** `renderSubjectNavigation`, tarjetas expandibles de asignatura.
- **Descripción del Alcance:** Mostrar tareas con título, asignatura, tema, parcial, fechas y estado (pendiente, entregada, vencida). Separar visualmente las guías de estudio de las tareas evaluables.
- **Criterios de Aceptación:** Tarjetas desplegables por materia mostrando claramente guías y tareas sin confusión de estados.
- **Estado:** [ ] Pendiente

---

### [REQ-DOC-008] Estructura de Carpetas Jerárquica en Google Drive y Nomenclatura (Sección 8)
- **Origen del Hallazgo:** Especificación de Gestión Docente y Tareas (Sección 8).
- **Severidad/Clasificación:** Crítico
- **Archivos Involucrados:** `backend/task-service/Code.gs`, `backend/academic-service/Code.gs`
- **Dependencias Expuestas:** Google Drive API (`DriveApp`), jerarquía de carpetas por Asignatura/Año/Parcial.
- **Descripción del Alcance:** Almacenar archivos en la estructura estandarizada `Área/New Generation/Docentes/Asignaturas/[Nombre]/[Año]/Parcial I..IV/[Tipo]`, previniendo duplicación por variaciones triviales y sanitizando nombres.
- **Criterios de Aceptación:** Los archivos subidos se depositan en las subcarpetas correctas de Google Drive según el tipo y parcial.
- **Estado:** [ ] Pendiente

---

### [REQ-DOC-011] Optimización del Análisis de Desempeño Estudiantil e Índice de Asistencia (Sección 12)
- **Origen del Hallazgo:** Especificación de Gestión Docente/Tareas (Sección 12).
- **Severidad/Clasificación:** Alto
- **Archivos Involucrados:** `js/student.js`, `backend/user-service/Code.gs`
- **Dependencias Expuestas:** Algoritmos de promedios, ponderaciones y métricas psicométricas (ICR, GP, Mastery).
- **Descripción del Alcance:** Calcular rendimiento integral considerando notas por asignatura, tareas, proyectos, exámenes, entregas tardías (penalización 50%) e índice de asistencia por separado sin falsear datos ausentes como ceros.
- **Criterios de Aceptación:** Reporte analítico claro que diferencia desempeño académico de control de asistencia.
- **Estado:** [ ] Pendiente
