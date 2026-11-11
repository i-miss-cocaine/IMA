# Registro oficial de auditoría

Este directorio es el destino único de los artefactos de auditoría de IMA: informes por fase/tarea, planes, bitácoras, mapas de dependencias y contexto/checkpoints.

## Regla de tareas
Cada informe debe contener la sección **Tareas ejecutables derivadas de los hallazgos**. Cada tarea se registra en el mismo informe que contiene su hallazgo de origen y debe incluir ID único, hallazgo, severidad, objetivo, acción concreta, archivos/módulos, dependencias/riesgos, alcance, criterios de aceptación, prioridad, estado y evidencia de cierre. No se utilizará un registro maestro externo para las tareas de auditoría.

Los informes históricos se conservan íntegros durante esta migración. La incorporación de tareas ejecutables a cada informe histórico se realizará mediante revisión del contenido de ese informe, sin inventar tareas ni duplicar IDs.

## Convenciones
- Informes: conservar sus nombres históricos y añadir nuevos informes con identificadores de checkpoint/tarea.
- Plan maestro: `AUDITORIA_COMPLETADAS_PLAN.md`.
- Bitácora de hallazgos: `Auditoria.txt` (y conservar la variante histórica `Auditoría.txt` si existe).
- Dependencias: `MapaDependencias.md`.
- Contexto y checkpoints: `Contexto_personal.txt`.
- `Pendientes.md` queda fuera del flujo operativo: no recuperar, reconstruir, actualizar ni consultar para gestionar tareas.
