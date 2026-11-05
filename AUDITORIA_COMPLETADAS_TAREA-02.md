# Auditoría de completadas.md - TAREA-02

**Fecha:** 2026-11-05  
**Repositorio:** i-miss-cocaine/IMA  
**Rama:** NG_beta_0.0.0.1_work  
**Tarea:** TAREA-02 - Consolidar la matriz maestra de requisitos, dependencias y pruebas  
**Fuente:** completadas.md, SHA f57f1aef832e81e44fc4f7ec36a852d50e464676  
**HEAD de referencia:** c0d27dacb187cf652914e70eecda069a564fb0b5

## Dictamen

**CUMPLE PARCIALMENTE.** La documentación actual contiene relaciones técnicas parciales entre algunos módulos y componentes, pero no se encuentra implementada ni mantenida la matriz maestra que exige la tarea. El README describe la arquitectura a nivel general; MapaDependencias.md reúne notas y relaciones puntuales, pero no ofrece un registro unificado de requisitos, subcapacidades, criterios, pruebas, evidencias, estados, prioridades y tareas de resolución.

## Evidencia documental

1. **MapaDependencias.md:** blob SHA a40ee1d2f245516abd0798e6597f936845d051d6. El encabezado identifica el documento como “Mapa de Dependencias Académicas (v7.6.1)”. Su contenido incluye relaciones de módulos y apartados de auditorías posteriores (por ejemplo, tareas, servicios, hojas y funciones), pero no contiene la sección “MATRIZ MAESTRA DE TRAZABILIDAD DE REQUISITOS, DEPENDENCIAS Y PRUEBAS” que ChangesLogs.txt afirma que se añadió. Tampoco existe una tabla o estructura equivalente que vincule cada requisito con todos los campos exigidos.
2. **README.md:** blob SHA 1d76341a6a286ebd0115e319f77b8c33b727dbba. Presenta una visión general de PWA, frontend, microservicios y algunas hojas/módulos. No asigna identificadores estables a requisitos ni enlaza criterios de aceptación, pruebas, evidencias, prioridades o tareas de resolución.
3. **ChangesLogs.txt:** blob SHA d57cf4bd861b5c3720e60cf83241ed804ff645d9. El registro histórico de TAREA-02 afirma que se agregó la matriz maestra a MapaDependencias.md y que se actualizaron Pendientes.md, Auditoria.txt y ChangesLogs.txt. Ese registro no sustituye la comprobación del artefacto actual: la sección declarada no está presente en el mapa de la rama auditada.
4. **Historial de MapaDependencias.md:** las versiones consultadas en la historia disponible de la rama, incluida la versión de NG_beta_0.0.0.1 y snapshots anteriores, tampoco contienen el título de la matriz. Esto no demuestra por sí solo cuándo se perdió el contenido, pero confirma que no está disponible en la versión actual revisada.
5. **Documento de origen:** AUDITORIA_FASE1_PLANIFICACION_EXPANSION.md, citado como origen en completadas.md, no aparece en el directorio raíz actual bajo ese nombre. No se pudo contrastar su inventario original.
6. **Hallazgo preexistente:** AUD-NG-010 ya documenta que MapaDependencias.md no satisface el inventario de trazabilidad y que no relaciona completamente tareas, criterios, pruebas y evidencias. La tarea AUD-NG-010 continúa pendiente en Pendientes.md. AUD-NG-011 también permanece pendiente respecto a la demostración del aislamiento de microservicios por área curricular.

## Evaluación de los criterios de aceptación

| Criterio | Resultado | Evidencia |
|---|---|---|
| Registro único de requisitos y subcapacidades | No cumple | No existe una matriz maestra actual. |
| Identificador, estado y criterio por requisito | Parcial | Hay identificadores en los registros, pero no un catálogo unificado con esos campos. |
| Evidencia suficiente para capacidades completas | No cumple | No existe vínculo sistemático entre capacidad, prueba ejecutada y evidencia. |
| Trazabilidad de tareas hacia requisitos | Parcial | Hay referencias puntuales, pero no cobertura completa. |
| Dependencias para evaluar impacto | Parcial | Existen relaciones técnicas aisladas, no un mapa integral y normalizado. |
| Elementos sin implementación, pruebas huérfanas y componentes sin responsable | No cumple | No se encontró un mecanismo de detección ni un inventario completo. |
| Registro de cambios e impacto | Parcial | ChangesLogs.txt registra modificaciones, pero no las relaciona de forma estructurada con requisitos y dependencias afectados. |
| Nuevas áreas curriculares y servicios especializados | Parcial | Hay notas y referencias dispersas; no están integradas en una matriz verificable. |

## Hallazgo y control de duplicados

**No se crea un identificador de hallazgo nuevo.** La causa principal coincide con **AUD-NG-010**, cuyo alcance ya cubre la insuficiencia del inventario técnico y la falta de trazabilidad entre componentes, tareas, pruebas y evidencias. Se amplía esa tarea existente para incorporar explícitamente los requisitos completos de TAREA-02. AUD-NG-011 se mantiene como dependencia relacionada para la separación por áreas curriculares.

## Evaluación de calidad

La documentación está fragmentada y presenta una diferencia entre el estado histórico declarado en ChangesLogs.txt y el artefacto disponible. MapaDependencias.md mezcla relaciones generales con anexos de auditorías de distintas fechas, sin un esquema uniforme, propietario, versión de matriz o mecanismo de cobertura. README.md es descriptivo, no una matriz de control. La calidad documental es insuficiente para utilizar estos archivos como fuente única de trazabilidad y análisis de impacto.

## Integridad de registros

Durante la continuidad se detectó que Auditoria.txt en la rama de trabajo contenía solo los registros AUD-NG-159 a AUD-NG-162 (7,551 caracteres), mientras que el último snapshot completo anterior, en el commit b2e1f4fa036edfb4028972230eb37e25341dd437, conservaba 423,466 caracteres y los registros históricos anteriores. Para no perpetuar la pérdida de historial, se recuperó ese snapshot completo y se anexaron los cuatro registros AUD-NG-159 a AUD-NG-162 y el presente resultado. No se eliminaron registros anteriores.

## Pruebas y límites

- Inspección manual y estática de documentación versionada.
- No se ejecutaron pruebas de código ni de despliegue; el alcance auditado es la matriz documental.
- No se modificó código fuente, completadas.md ni ChangesLogs.txt.
- La inspección no certifica el estado de despliegues ni fuentes externas.

## Respaldos y SHAs

- completadas.md: f57f1aef832e81e44fc4f7ec36a852d50e464676.
- MapaDependencias.md: a40ee1d2f245516abd0798e6597f936845d051d6.
- README.md: 1d76341a6a286ebd0115e319f77b8c33b727dbba.
- Pendientes.md antes de la ampliación: 995f1408b3bc75207f2a64bf43b60e0bbcd6f783.
- Auditoria.txt antes de restaurar historial: e12b691d8870b08d3512e655d9ea020fd61705d7.
- Auditoria.txt, snapshot histórico íntegro: 2752d81a022f28724fc2c4bce42bc700f1c216b9.
- ChangesLogs.txt: d57cf4bd861b5c3720e60cf83241ed804ff645d9.
- METODOLOGIA_DESARROLLO.md: 3973a5ecb370a24a7fa568cb4b0afa771d629793.

## Resumen

- TAREA-02: cumple parcialmente.
- Hallazgo nuevo: ninguno.
- Tarea existente ampliada: AUD-NG-010.
- Hallazgo relacionado: AUD-NG-011.
- Progreso acumulado: 9/183 identificadores únicos auditados; 174 pendientes.
- Siguiente tarea: TAREA-03.
