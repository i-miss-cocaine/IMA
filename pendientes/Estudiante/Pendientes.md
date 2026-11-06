# Pendientes del departamento: Estudiante

> Migración íntegra desde `Pendientes.md` (raíz del repositorio). Fuente consultada en la rama `NG_beta_0.0.0.1_work`, blob SHA `8867ecf1f58f768cac8fa5ddaa7b50bb68e57158`. Los bloques de tareas se conservaron completos, incluidos identificadores, descripciones, criterios, severidad y estados. No editar la fuente para mantener esta distribución: los cambios futuros de tareas se registran en los archivos departamentales.

**Responsabilidad de clasificación:** Interfaz, navegación y funciones cuyo responsable principal es el portal o la experiencia del estudiante.

**Tareas migradas:** 5

---

### [LOOP-001] Eliminación de Bucle Infinito en Dashboard
- **Origen del Hallazgo:** Auditoria.txt (Revisión v7.8.6)
- **Severidad/Clasificación:** Crítico
- **Archivos Involucrados:** `js/student.js`
- **Descripción del Alcance:** Implementar flag `isFetchingActivities` y remover llamada recursiva a `syncAcademicScope`.
- **Criterios de Aceptación:** La página no debe recargarse infinitamente ni saturar el microservicio.
- **Estado:** [X] Completada

---

### [UI-001] Eliminación de Navegación Residual por Pestañas
- **Origen del Hallazgo:** Auditoria.txt (Revisión v7.8.6)
- **Severidad/Clasificación:** Alto
- **Archivos Involucrados:** `student-dashboard.html`, `js/student.js`
- **Descripción del Alcance:** Remover `#subject-tabs-container` y lógica de tabs. Corregir filtrado por parcial activo.
- **Criterios de Aceptación:** Navegación exclusiva por tarjetas expandibles. Solo se muestran asignaturas del parcial vigente.
- **Estado:** [X] Completada

---

### [STUD-002] Actualización de Tarjeta Estudiante e Interfaz
- **Origen del Hallazgo:** Auditoria.txt (v7.8.7)
- **Severidad/Clasificación:** Alto
- **Archivos Involucrados:** `js/student.js`, `student-dashboard.html`
- **Descripción del Alcance:**
  1. Agregar Email y Teléfono (con link WhatsApp) a `renderStudentHeader`.
  2. Reemplazar texto "Vista Unificada de Asignaturas" por instrucción de selección.
  3. Asegurar filtrado estricto por parcial vigente.
- **Criterios de Aceptación:** La tarjeta muestra datos de contacto funcionales. El dashboard muestra la instrucción correcta.
- **Estado:** [X] Completada

---

### [FIX-003] Reparación de Filtrado de Asignaturas (matchParcial)
- **Origen del Hallazgo:** Error de consola detectado en auditoría.
- **Descripción:** Definición de variable matchParcial en student.js.
- **Estado:** [X] Completada

---

### [REQ-EXP-006] Dashboard de Estudiante e Integración de Contacto WhatsApp (Sección 13 / 16 / 18)
- **Origen del Hallazgo:** Requerimientos de Desarrollo y Expansión (Sección 13 / 16).
- **Severidad/Clasificación:** Alto
- **Archivos Involucrados:** `js/student.js`, `student-dashboard.html`, `js/index-ui.js`
- **Dependencias Expuestas:** `renderStudentHeader`, `renderSubjectNavigation`, `downloadContentData`
- **Descripción del Alcance:** Mostrar tarjetas por materia derivadas de `GranularConfig`, enlace directo WhatsApp (`wa.me/504...`), ordenamiento de tareas por fecha limite y filtrado de recursos por Unidad Activa.
- **Criterios de Aceptación:** Visualización permanente de materias autorizadas, tarjeta de contacto activa y filtrado dinámico por parcial y unidad.
- **Estado:** [X] Completada
