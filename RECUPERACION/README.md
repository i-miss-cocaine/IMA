# Recuperación archivística de Pendientes.md

**Estado:** copia histórica recuperada; no es un registro operativo de tareas.

## Fuente recuperada

- Repositorio: `i-miss-cocaine/IMA`
- Rama fuente: `NG_beta_0.0.0.1`
- Commit fuente: `44d9891132332e692dbe2ba8602b41f50a508a59`
- Ruta fuente: `/Pendientes.md`
- Blob SHA-1: `ef47d232db3ed46317dc14f22b1cdf8f938e8405`
- Tamaño registrado por Git: **1.443.391 bytes**
- Líneas: **17.884**
- Ruta de esta copia: `/RECUPERACION/Pendientes_RECUPERADO.md`

La copia utiliza el blob original sin transformación. Su SHA debe coincidir con el blob fuente.

## Integridad del contenido preauditoría

Se comparó con `New_Generation:/Pendientes.md` (commit `6b31c2afedd2568950001eae97eacd7add7f206e`, blob `2f3c2e066f362a8a4651e690c4be75d82bfe0ca6`). Sus **16.872 líneas** coinciden exactamente con el prefijo de la versión recuperada. No se detectaron líneas faltantes ni alteradas en ese tramo.

## Adiciones de auditoría incluidas en esta versión

La versión recuperada contiene **104 IDs AUD-NG distintos**, hasta `AUD-NG-109` (con saltos de numeración ya presentes en la fuente), además de las referencias originales de tareas `TASK-001` a `TASK-473`. Esto preserva tanto el backlog de New_Generation como las adiciones de auditoría que ya estaban anexadas antes de la recuperación equivocada.

## Tareas posteriores a las auditorías históricas

Las tareas posteriores que aparecen en los informes recientes no se duplican aquí. La metodología y `AUDITORIAS/README.md` establecen que cada tarea debe permanecer en el informe que contiene su hallazgo. Se verificaron, entre otras, las referencias siguientes:

- `AUD-NG-179 / TASK-477` y `AUD-NG-180 / TASK-478`: `AUDITORIAS/AUDITORIA_COMPLETADAS_FASE2-T06.md`.
- `TASK-483` y `AUD-NG-194`: `AUDITORIAS/AUDITORIA_COMPLETADAS_T-UX-13.md`.
- `TASK-481`, `TASK-482`, `TASK-491`, `AUD-NG-195` a `AUD-NG-200`: `AUDITORIAS/AUDITORIA_COMPLETADAS_T-UX-14.md`.
- `TASK-429`, `AUD-NG-201` y `AUD-NG-202`: `AUDITORIAS/AUDITORIA_COMPLETADAS_T-UX-15.md`.
- `AUD-NG-232 / TASK-512` y `AUD-NG-233 / TASK-513`: `AUDITORIAS/AUDITORIA_COMPLETADAS_TAREA-F5-001.md`.
- `AUD-NG-230 / TASK-510` y `AUD-NG-231 / TASK-511`: `AUDITORIAS/AUDITORIA_COMPLETADAS_PLAN.md`.

Estos informes y el plan de auditoría siguen siendo la fuente oficial para esas tareas posteriores. Esta copia no los sustituye.

## Límite de la recuperación

El archivo recuperado es la versión más grande confirmada entre las ramas inspeccionadas, pero Git registra **1.443.391 bytes**, menos de los más de 1,6 MB recordados. No se afirma que sea la versión original exacta que el usuario recuerda; se conserva como la recuperación verificable más completa localizada hasta ahora.

El archivo raíz `/Pendientes.md` y `/pendiente_legacy.md` no se modificaron. Esta copia es archivística y no debe utilizarse para administrar tareas ni reemplazar las reglas vigentes de `AUDITORIAS/README.md`.
