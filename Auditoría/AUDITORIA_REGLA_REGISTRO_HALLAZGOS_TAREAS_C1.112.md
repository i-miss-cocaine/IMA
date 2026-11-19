# AUDITORÍA DE CUMPLIMIENTO DOCUMENTAL — REGLA DE HALLAZGOS Y TAREAS

- **Fecha:** 2026-11-06.
- **Repositorio:** i-miss-cocaine/IMA.
- **Rama auditada:** `NG_beta_0.0.0.1_work`.
- **HEAD de partida:** b658b42e06b1eb19387ec3457e1ac7d9aa1404f9.
- **Rama base protegida:** `NG_beta_0.0.0.1`.
- **HEAD de rama base:** 44d9891132332e692dbe2ba8602b41f50a508a59.
- **Sesión:** IMA-AUDIT-20261106-1938Z.
- **Checkpoint:** C1.112.
- **Alcance:** verificar que los resultados y hallazgos de cada auditoría se documenten en su propio informe y que los hallazgos accionables se conviertan en tareas dentro de la sección obligatoria del mismo archivo.

## 1. Regla normativa verificada

`METODOLOGIA_DESARROLLO.md` (blob SHA `cf796728bb384a32537392df2f9c72a339fa03ee`) establece:

- **§3.4:** el registro oficial de tareas derivadas de auditoría reside en cada informe; exige la sección **Tareas ejecutables derivadas de los hallazgos** y prohíbe un archivo maestro externo.
- **§3.11:** todo hallazgo accionable debe convertirse en una tarea ejecutable dentro del mismo informe que documenta el hallazgo.
- El protocolo posterior define los campos obligatorios: ID, hallazgo de origen, severidad, objetivo, acción, archivos/módulos, dependencias/riesgos, alcance, criterios de aceptación, prioridad, estado y evidencia de cierre.
- También exige distinguir tareas nuevas, ampliaciones de tareas existentes y hallazgos ya cubiertos, sin duplicar IDs; si no hay hallazgos accionables, el informe debe indicarlo expresamente.

`AUDITORIAS/README.md` (blob SHA `2f649c6ffc39ec7cdd242e85cb71b4344fd69e34`) reitera la regla y aclara que los informes históricos se conservan íntegros y se incorporan al formato al revisarlos.

## 2. Muestra documental inspeccionada

| Informe | Resultado de la comprobación |
|---|---|
| `AUDITORIAS/AUDITORIA_COMPLETADAS_T-UX-20.md` (blob `870f894bf637fc6ea8e7fd75d871e415edf72e84`) | Registra AUD-NG-212/AUD-NG-213 y anuncia TASK-494, pero no contiene la sección obligatoria ni el bloque estructurado de TASK-494. |
| `AUDITORIAS/AUDITORIA_COMPLETADAS_T-UX-21.md` a `T-UX-27.md` | Los siete informes inspeccionados carecen de la sección obligatoria. Algunos registran hallazgos nuevos o ampliaciones de tareas existentes; otros reconcilian hallazgos sin crear IDs nuevos. |
| `AUDITORIAS/AUDITORIA_COMPLETADAS_T-UX-28.md` (blob `9fc7422ec105586f40d6094366d98d28ed5579ec`) | No contiene la sección. Declara que no crea hallazgos ni tareas nuevos, pero remite a AUD-NG-188/189 y TASK-485/486. Debe incluir la sección y dejar explícito que no hay tareas nuevas, manteniendo las referencias existentes. |
| `AUDITORIAS/AUDITORIA-FASE-28-ACCESIBILIDAD-MOVILIDAD-CONTINUIDAD.md` (blob `5c74b773783044a1fc2f84761f30dbfe1e7b4140`) | Contiene cinco acciones en un plan de resolución, pero no la sección estandarizada ni tareas con todos los campos exigidos. |
| `AUDITORIAS/AUDITORIA-FASE-11-COMUNICACION-BIENESTAR-SUPERVISION-FINANZAS.md` y `AUDITORIAS/AUDITORIA-FASE-18-COMPRAS-PROVEEDORES-CONTRATACION.md` | Informes históricos inspeccionados sin la sección estandarizada. Su incorporación debe hacerse al revisarlos, preservando el contenido histórico y sin inventar criterios. |

La inspección fue una muestra dirigida, no un inventario exhaustivo de todos los informes del repositorio. Por tanto, no se atribuye a los documentos no inspeccionados un estado de cumplimiento.

## 3. Dictamen

**CUMPLIMIENTO PARCIAL.** La regla está correctamente escrita en la metodología y en el README del directorio. No obstante, su aplicación documental no es uniforme: los informes T-UX-20 a T-UX-28 inspeccionados no contienen la sección obligatoria; T-UX-20 además registra tareas nuevas sin desarrollar el bloque estructurado. Los informes históricos de fases 11, 18 y 28 también requieren revisión y adaptación cuando sean intervenidos.

La regla debe aplicarse desde ahora a toda auditoría nueva. Los informes históricos se deben adaptar progresivamente al ser revisados, conservando su texto y trazabilidad originales. No se debe trasladar ninguna tarea a `Pendientes.md` ni a un registro externo.

## 4. Restricciones y límites

- No se modificó código fuente ni pruebas.
- No se modificaron informes existentes durante esta verificación.
- No se crearon IDs de hallazgo o tarea dentro de los informes inspeccionados.
- La presente auditoría queda registrada en este archivo y en `AUDITORIAS/Auditoria.txt`.
- La rama base protegida no se modificó.
- No se ejecutaron pruebas de aplicación; no aplican a esta comprobación documental.
- La revisión de la muestra no demuestra todavía que todos los informes históricos estén adaptados.

## Tareas ejecutables derivadas de los hallazgos

### [TASK-DOC-C1.112-01] Normalizar los informes históricos al contrato de registro de hallazgos y tareas

- **Hallazgo de origen:** AUD-DOC-C1.112-01, secciones 2 y 3 de este informe. Los informes inspeccionados carecen de la sección obligatoria o contienen tareas resumidas sin todos los campos exigidos.
- **Severidad:** Medio.
- **Objetivo:** garantizar que cada informe de auditoría conserve sus resultados y hallazgos en el propio archivo y que toda acción derivada quede expresada en un bloque de tarea verificable.
- **Acción ejecutable:** revisar progresivamente los informes históricos de `AUDITORIAS/`; agregar al final de cada informe la sección obligatoria; convertir cada hallazgo accionable en una tarea estructurada dentro del mismo archivo; cuando exista una tarea previa, ampliar y referenciar su ID sin duplicarlo; cuando no haya hallazgos accionables, declararlo expresamente. Preservar íntegramente el contenido histórico y no usar un registro externo.
- **Archivos/módulos afectados:** informes históricos `AUDITORIAS/*.md`; no implica modificar código fuente.
- **Dependencias y riesgos:** `METODOLOGIA_DESARROLLO.md` §§3.4 y 3.11; `AUDITORIAS/README.md`; `AUDITORIAS/Auditoria.txt`; IDs de hallazgos y tareas existentes. Riesgo de duplicación o pérdida de trazabilidad si se crean IDs nuevos sin reconciliar los anteriores.
- **Alcance:** inventariar y adaptar los informes históricos por lotes; comenzar por los informes que ya contienen hallazgos accionables sin bloque de tareas. No alterar los hallazgos originales, estados históricos, código ni rama base.
- **Criterios de aceptación:** (1) cada informe revisado contiene la sección obligatoria; (2) cada hallazgo accionable tiene tarea en ese mismo informe; (3) cada tarea contiene todos los campos del protocolo; (4) las ampliaciones y coberturas existentes se referencian sin duplicar IDs; (5) los informes sin acciones lo declaran; (6) no se pierde contenido histórico; (7) no se usa `Pendientes.md` ni un registro externo como destino de tareas; (8) queda evidencia de cotejo por informe.
- **Prioridad:** P2.
- **Estado:** Pendiente.
- **Evidencia de cierre:** pendiente; registrar commits, informes adaptados y verificación de integridad al completar.

## 5. Continuidad

La regla normativa queda confirmada. La siguiente ejecución de auditoría debe incluir siempre la sección propia de tareas, incluso si solo declara que no existen acciones nuevas. La adaptación de informes históricos queda como tarea pendiente y deberá ejecutarse por lotes con checkpoints.
