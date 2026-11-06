# Pendientes del departamento: Otros

> Migración íntegra desde `Pendientes.md` (raíz del repositorio). Fuente consultada en la rama `NG_beta_0.0.0.1_work`, blob SHA `8867ecf1f58f768cac8fa5ddaa7b50bb68e57158`. Los bloques de tareas se conservaron completos, incluidos identificadores, descripciones, criterios, severidad y estados. No editar la fuente para mantener esta distribución: los cambios futuros de tareas se registran en los archivos departamentales.

**Responsabilidad de clasificación:** Infraestructura técnica transversal y tareas sin propietario funcional claro en los departamentos anteriores.

**Tareas migradas:** 1

---

### [CORS-001] Estabilización de Conexión (Red/CORS)
- **Origen del Hallazgo:** Auditoria.txt (Revisión v7.8.6)
- **Severidad/Clasificación:** Crítico
- **Archivos Involucrados:** `js/api.js`
- **Descripción del Alcance:** Cambiar Content-Type a 'text/plain' para evitar Preflight requests y bloqueos de CORS.
- **Criterios de Aceptación:** Las peticiones a USER/getAcademicConfig no deben fallar con 'TypeError: Failed to fetch'.
- **Estado:** [X] Completada
