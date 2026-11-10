# IMA — Norma de Desarrollo Ágil, Seguro y Continuo (NDASC)
**Versión:** 1.1  
**Vigencia:** 2026-11-10  
**Repositorio:** `i-miss-cocaine/IMA`  
**Rama exclusiva de trabajo:** `NG_beta_0.0.0.1_work`  
**Rama base:** `NG_beta_0.0.0.1` (solo lectura para el agente)

## 1. Propósito y autoridad normativa
Esta norma reemplaza, exclusivamente para IMA, los procedimientos administrativos rígidos que dupliquen análisis, impidan correcciones iterativas o exijan controles no relacionados con el riesgo del cambio. Es la fuente normativa operativa única para el ciclo de desarrollo. Prevalece sobre cualquier instrucción anterior incompatible en `Instrucciones.txt`, `METODOLOGIA_DESARROLLO.md`, el Plan Maestro, checklists, expedientes y checkpoints. Las especificaciones funcionales, de seguridad, accesibilidad, presentación y aceptación de producto siguen vigentes; esta norma no reduce sus requisitos.

**Principio rector:** implementar cambios correctos con rapidez y evidencia proporcional. La calidad se demuestra por el comportamiento, las pruebas, la revisión del diff, la seguridad y la preservación de capacidades; no por la cantidad de documentos, fases o validaciones repetidas.

## 2. Ciclo operativo continuo
El agente puede alternar libremente análisis, edición, pruebas y correcciones. No son fases aisladas ni requieren reiniciar el proceso:
1. **Entender:** leer el requisito pertinente y el contexto mínimo necesario; identificar el resultado esperado.
2. **Ubicar:** verificar repositorio, rama, HEAD y estado del árbol; localizar archivos, consumidores y dependencias que puedan verse afectados.
3. **Implementar:** realizar el cambio directamente cuando el alcance sea suficiente. Mantener el cambio enfocado y resolver los defectos relacionados necesarios.
4. **Verificar:** ejecutar las comprobaciones aplicables según riesgo y disponibilidad; revisar el diff completo.
5. **Corregir y repetir:** corregir los fallos encontrados y repetir solo las pruebas afectadas y las regresiones justificadas.
6. **Consolidar:** documentar lo relevante, crear checkpoint cuando corresponda y publicar cambios coherentes en la rama autorizada.

No se exige una auditoría completa previa separada ni se prohíbe modificar código durante el análisis. El análisis previo puede ser breve y focalizado; se amplía solo si la complejidad o el riesgo lo justifican.

## 3. Alcance de inspección proporcional
- **Bajo riesgo:** texto, documentación, etiquetas o estilos aislados. Revisar el archivo y su contexto inmediato.
- **Riesgo medio:** funciones, componentes, flujos UI o lógica de negocio. Revisar función/componente, consumidores directos, contratos y pruebas relacionadas.
- **Alto riesgo:** autenticación, autorización, aislamiento multiinstitucional, persistencia, migraciones, pagos, archivos, firmas, borrado o recuperación. Revisar límites de confianza, rutas de lectura/escritura, actores, permisos positivos y negativos, integridad, compatibilidad y recuperación.
- **Transversal:** cambios que afecten arquitectura compartida, contratos públicos o múltiples servicios. Ampliar el análisis a los consumidores y capas realmente afectadas.

No se exige revisar línea por línea todo el repositorio por un cambio localizado. Los inventarios y mapas existentes se reutilizan mientras su evidencia siga vigente. Actualizarlos solo cuando el cambio altere la información que describen.

## 4. Autonomía y límites de decisión
El agente debe tomar decisiones técnicas ordinarias y avanzar sin pedir autorización para cada edición, refactorización localizada, prueba o corrección necesaria para cumplir el requisito.

Detenerse y consultar al usuario únicamente cuando:
- falte una decisión funcional que cambie sustancialmente el resultado;
- exista riesgo concreto de pérdida irreversible, exposición de datos o daño a un entorno real;
- se requiera una operación externa/productiva, gasto, publicación o acto que necesite autorización;
- haya conflicto de requisitos que no pueda resolverse preservando compatibilidad y seguridad.

No son bloqueos: ausencia de documentos institucionales para desarrollar capacidades genéricas; organigramas o cargos aún no configurados; falta de datos reales para probar con fixtures; ausencia de protección técnica de la rama base; una tarea documental pendiente que no sea prerrequisito técnico; o un ciclo de dependencias que no afecte al subflujo que se pretende implementar.

## 5. Prevención de degradación y regresiones
Todo cambio debe preservar, salvo requisito explícito en contrario:
- contratos y compatibilidad de APIs, eventos, esquemas y persistencia;
- capacidades existentes y flujos no incluidos en el cambio;
- autenticación, autorización, separación de instituciones y privacidad;
- integridad, unicidad, propiedad, trazabilidad y recuperabilidad de datos;
- accesibilidad, responsive y comportamiento de interfaces afectados;
- historial Git y cambios previos válidos.

No realizar reescrituras, limpiezas masivas ni cambios cosméticos ajenos al objetivo. Se permiten refactorizaciones locales cuando reduzcan riesgo o sean necesarias para una implementación mantenible; deben quedar cubiertas por pruebas pertinentes. No revertir cambios preexistentes solo porque no pertenezcan a la tarea actual.

Antes de publicar, revisar el diff completo y detectar cambios inesperados, secretos, datos reales, artefactos temporales y archivos generados no destinados al repositorio. No borrar archivos del usuario ni cambios previos para limpiar el árbol.

## 6. Verificación basada en riesgo
Las pruebas se seleccionan por el comportamiento y la superficie modificada:
- Ejecutar pruebas unitarias, contratos, sintaxis, lint, tipos o validaciones estáticas cuando existan y sean pertinentes.
- En lógica de negocio, probar resultados válidos, límites y entradas inválidas relevantes.
- En seguridad, probar acceso permitido y denegado, identidad/ámbito verificados y aislamiento entre instituciones.
- En persistencia, probar escritura, lectura, unicidad, relaciones y recuperación en entorno aislado.
- En UI, verificar el flujo afectado y estados de carga, error, vacío y responsive cuando apliquen.
- En contratos o integraciones, probar productores/consumidores y compatibilidad relevante.
- Usar automatización, scripts, CI, mocks, fixtures y análisis estático cuando aporten evidencia; la inspección manual complementa, no sustituye, estas pruebas.

No ejecutar suites completas o E2E de toda la plataforma por cambios menores si no aportan cobertura adicional razonable. Las pruebas remotas/de despliegue que dependan de infraestructura o credenciales externas siguen registradas para beta conforme a §21 de la metodología.

**Honestidad de resultados:** diferenciar PASS, FAIL, BLOCKED y NOT RUN. Nunca declarar aprobada una prueba no ejecutada. Si una prueba pertinente no puede ejecutarse, registrar la causa y el riesgo residual. Un defecto local reproducible que afecte al requisito o a seguridad/integridad debe corregirse antes de cerrar el cambio.

## 7. Hallazgos y defectos
Clasificar los hallazgos como:
- **Crítico:** exposición de datos, bypass de autorización, corrupción/pérdida de datos o riesgo irreversible. Detener la publicación del cambio afectado.
- **Alto:** incumplimiento de requisito o regresión relevante. Corregir antes de publicar el componente afectado.
- **Medio:** defecto relacionado o deuda técnica no bloqueante. Corregir en la misma iteración si es pequeño, seguro y claramente relacionado; de lo contrario, registrar una acción futura.
- **Bajo/informativo:** mejora opcional. No bloquea ni obliga a crear tarea.

Registrar en `Auditoria.txt` solo hallazgos accionables, riesgos relevantes, decisiones técnicas no obvias y evidencia necesaria. Crear o ampliar una tarea en `tareas_auditoria.txt` únicamente para trabajo independiente que realmente deba planificarse; no crear tareas para cada observación menor, errata o corrección resuelta en la misma implementación.

## 8. Code Review y correcciones
La revisión de código es proporcional al riesgo y puede ser interna. Revisión independiente/externa se reserva para cambios de alto riesgo, contratos críticos o cuando el proyecto disponga de un proceso de PR que aporte control real; no es una puerta universal para cada cambio.

Una observación se resuelve de forma focalizada:
1. comprobar si es válida y si el cambio actual la introdujo;
2. corregir el bloque afectado;
3. ejecutar pruebas pertinentes y regresión asociada;
4. actualizar la evidencia existente.

No reiniciar auditorías, documentación ni pruebas completas por una corrección localizada. No auditar una auditoría ni crear cadenas recursivas de revisión documental.

## 9. Dependencias y Plan Maestro
Una dependencia es **bloqueante** solo si existe una relación técnica necesaria y demostrable: contrato requerido, dato/estado previo, control de seguridad, migración, componente compartido o requisito funcional que no puede satisfacerse sin ella.

Distinguir:
- **Obligatoria:** impide ejecutar el alcance dependiente hasta que el prerrequisito esté disponible.
- **Condicional:** aplica solo a una variante, entorno, dato real o flujo concreto.
- **Informativa:** orden recomendado, relación histórica o posible consumidor; no bloquea.

No bloquear tareas independientes por una dependencia ajena, por ciclos en el grafo o porque una fase anterior tenga documentación pendiente. En un ciclo, aislar el subflujo seguro, definir el contrato mínimo y resolver el ciclo con cambios compatibles; bloquear únicamente la operación que dependa de la parte no resuelta. PM-00 es clasificación/triage, no una puerta universal que impida desarrollar trabajo independiente.

La secuencia PM-00→PM-09 es una guía de capas y orden recomendado. Puede avanzarse fuera de la fase nominal cuando la independencia técnica esté demostrada, sin omitir prerrequisitos reales ni comprometer seguridad o integridad. Registrar en el plan solo cambios de orden relevantes y su justificación.

## 10. Commits, checkpoints y recuperación
- Trabajar exclusivamente en `NG_beta_0.0.0.1_work`; nunca escribir, fusionar ni publicar en `NG_beta_0.0.0.1` u otra rama.
- Verificar HEAD antes de publicar y usar actualización de referencia con control de concurrencia. No reescribir historia ni usar force push.
- Crear commits por **unidad coherente y recuperable**, no por archivo ni por cada microtarea. Un commit puede incluir código, pruebas y documentación estrechamente relacionadas. Se permiten varios commits en una sesión cuando representen unidades completas distintas; no crear commits vacíos o fragmentar artificialmente un cambio.
- Un checkpoint se agrega al completar un hito significativo, antes de una pausa/handoff, antes de una operación de riesgo o cuando sea necesario preservar un estado recuperable. No se exige checkpoint por cada subpaso, archivo, prueba o mensaje.
- Mantener el historial de checkpoints y su índice. Nunca borrar, resumir, truncar ni sobrescribir entradas históricas. Rotar el archivo activo antes de superar 180.000 caracteres, conforme a las reglas de continuidad.
- Git es el respaldo principal: el blob/commit de partida debe ser alcanzable desde la rama autorizada y recuperable. No se exige copia duplicada por archivo si el respaldo Git íntegro está verificado.
- Antes del commit: revisar diff, pruebas y archivos incluidos. Después: verificar commit, árbol, HEAD y que la rama base siga intacta. Si el HEAD cambió concurrentemente, volver a inspeccionar el diff y reconciliar; no forzar la actualización.

El checkpoint debe resumir: objetivo/ID si existe; HEAD inicial y final (el final se confirma tras publicar); archivos cambiados; decisiones; pruebas y resultados; riesgos/limitaciones; estado; siguiente acción concreta. No repetir el contenido íntegro de informes o registros.

## 11. Documentación mínima y fuentes de verdad
- Requisito funcional: backlog departamental/origen del requisito.
- Orden y estado global: Plan Maestro.
- Normas operativas: este documento.
- Hallazgos: `Auditoria.txt` y expediente principal existente cuando corresponda.
- Cambios publicados: `changueslogs.txt`.
- Continuidad: checkpoints e índice.
- Dependencias técnicas: `MapaDependencias.md`, solo para relaciones verificadas y útiles.

Actualizar únicamente los registros afectados. No duplicar el mismo texto en varios documentos; usar IDs y referencias cruzadas. No crear informe completo para una corrección documental pequeña. Preservar íntegramente los registros históricos existentes.

## 12. Autonomía institucional y neutralidad de plataforma
IMA es una plataforma/portal/herramienta multiinstitucional, no una institución. No define un organigrama, cargos, autoridades, estatutos ni políticas universales. Cada institución configura sus propios departamentos, jerarquías, roles, responsables, políticas y datos.

La ausencia de decisiones o documentos institucionales no bloquea el diseño, implementación ni prueba local de motores genéricos configurables. La aprobación institucional solo se exige para registrar o ratificar datos reales, elegir fuentes canónicas institucionales, ejecutar asignaciones productivas, migrar datos reales o realizar actos jurídicos/administrativos en nombre de una institución. El bloqueo debe limitarse a ese dato o acto concreto.

## 13. Rama base y responsabilidad del propietario
La protección de `NG_beta_0.0.0.1` es una configuración que corresponde al propietario/administrador. El indicador `protected=false` o la ausencia de rulesets es informativo, nunca un bloqueo automático para trabajar en la rama exclusiva. El agente no modifica la protección salvo instrucción expresa. La obligación del agente es no escribir en la rama base y verificar que permanezca intacta.

## 14. Cierre y estados
Una unidad de trabajo puede cerrarse cuando su alcance está implementado, las verificaciones pertinentes fueron ejecutadas o sus limitaciones quedaron explícitas, el diff fue revisado y existe evidencia suficiente. No requiere aprobar trámites administrativos no relacionados ni ejecutar pruebas beta remotas pendientes.

Estados:
- **Completada:** criterios de implementación cumplidos y verificaciones locales aplicables satisfactorias.
- **En ejecución:** queda trabajo del alcance pendiente.
- **Bloqueada:** existe un prerrequisito técnico o autorización externa imprescindible, identificado y probado.
- **Pendiente:** aún no iniciada.
- Las pruebas beta conservan estados independientes; su ausencia no bloquea la implementación.

## 15. Reglas de aplicación y mantenimiento
Esta norma aplica solo al repositorio IMA. Las reglas específicas de producto (seguridad, privacidad, requisitos funcionales, accesibilidad, contenidos y beta) continúan vigentes cuando no contradicen el proceso operativo aquí definido. Si una regla antigua impone auditoría total, fases rígidas, copia redundante, registro exhaustivo, reinicio completo, commit único obligatorio o bloqueo por dependencia meramente documental, prevalece esta NDASC.

Los cambios futuros a esta norma deben ser explícitos, versionados y compatibles con el historial. No se permite usarla para justificar omitir controles de seguridad, integridad, pruebas relevantes o revisión del diff.


## 16. Fuente normativa única y lectura obligatoria antes de modificar archivos

Este documento es la **única fuente de normas operativas y de gobierno del desarrollo de IMA**. Su lectura es obligatoria antes de iniciar cualquier cambio en cualquier archivo del repositorio, incluidos código, pruebas, configuraciones, documentación, auditorías, planes, backlogs, checkpoints e índices. Si una sesión continúa después de una pausa o cambia de alcance, se vuelve a consultar la sección pertinente antes de editar.

Ningún otro archivo debe crear, copiar, mantener ni modificar una normativa paralela. Los documentos auxiliares pueden incluir únicamente una referencia a este archivo y las reglas mínimas de conservación propias de su función. Si se propone cambiar una norma, se modifica primero este documento, se versiona y se registra el cambio; después se alinean las referencias afectadas. Ante contradicción, prevalece esta norma.

### 16.1 Función de los demás documentos

- `Instrucciones.txt`: acceso directo a esta norma; no contiene una segunda normativa para IMA.
- `METODOLOGIA_DESARROLLO.md`: conserva especificaciones y criterios técnicos/funcionales del producto, seguridad, calidad y beta. No gobierna el flujo operativo; cualquier regla de proceso se interpreta conforme a este documento.
- `Auditoría/PLAN_MAESTRO_IMPLEMENTACION.md`: conserva planificación, secuenciación, estado y dependencias de tareas; no crea normas de desarrollo.
- `Auditoria.txt` y `changueslogs.txt`: conservan sus registros históricos. Sus encabezados remiten a esta norma; no contienen normativa duplicada.
- Informes, mapas, backlogs, checkpoints e índices: conservan evidencia, requisitos, decisiones y continuidad. Antes de modificarlos se consulta esta norma y se respetan sus reglas de conservación e historial.

### 16.2 Regla de lectura y modificación

Antes de modificar cualquier documento auxiliar, leer esta norma y la parte del documento auxiliar que corresponda al cambio. No es necesario volver a leer íntegramente todo el repositorio ni todos los documentos: la lectura se limita al alcance y riesgo definidos aquí. Las referencias de los documentos auxiliares no sustituyen la lectura del archivo maestro.

Esta sección no elimina requisitos funcionales, técnicos, de seguridad, privacidad, accesibilidad ni aceptación del producto. Distingue esos requisitos de las normas operativas, cuya fuente única es este archivo.
