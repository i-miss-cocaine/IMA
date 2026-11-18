# IMA — Norma de Desarrollo Ágil, Seguro y Continuo (NDASC)
**Versión:** 1.5  
**Vigencia:** 2026-11-18  
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

No ejecutar suites completas o E2E de toda la plataforma por cambios menores si no aportan cobertura adicional razonable.

**Qué significa prueba local (obligatoria):** una prueba local verifica el código y el comportamiento de la unidad modificada sin depender de que la plataforma o el servicio estén desplegados. Incluye, según el alcance, sintaxis/parseo, compilación o build local, lint, tipos, análisis estático, pruebas unitarias, lógica de negocio, contratos, integración aislada con mocks/fixtures, autorización y propiedad con identidades sintéticas, regresiones y validaciones de seguridad ejecutables en el entorno de desarrollo. Estas pruebas deben poder ejecutarse sobre el código fuente o en un entorno local/aislado; no requieren una URL pública ni un servicio beta operativo.

**Ejecución local obligatoria:** ejecutar todas las verificaciones locales pertinentes y disponibles para el cambio antes de considerar terminada la tarea. Si la lógica nueva o modificada carece de cobertura pertinente, crear o ampliar pruebas locales y ejecutarlas. Registrar resultados verificables y repetir las pruebas afectadas después de corregir fallos. No basta con añadir pruebas, inspeccionar el código o confiar únicamente en CI.

**Concurrencia y condiciones de carrera (verificación local):** cuando el cambio pueda verse afectado por ejecuciones simultáneas, reintentos, duplicidad de solicitudes, escrituras concurrentes, orden de eventos, locks, transacciones o estados compartidos, diseñar y ejecutar pruebas locales reproducibles para esos escenarios. Usar procesos/hilos, promesas, mocks, fixtures, barreras o controladores deterministas según la tecnología. Verificar invariantes, idempotencia, aislamiento, ausencia de efectos duplicados, consistencia y recuperación ante intercalaciones/fallos. Estas pruebas forman parte de la aprobación local; no se posponen a beta por el hecho de que el escenario también pueda ocurrir en producción. Si una propiedad no puede reproducirse localmente por depender de infraestructura real, probar localmente el contrato y la lógica aislable, y registrar únicamente la validación dependiente del despliegue como pendiente beta.

**Separación estricta entre aprobación local y beta:** el cierre de una tarea de implementación se decide exclusivamente con las verificaciones locales aplicables al código y su revisión. Las pruebas que requieren desplegar uno o varios servicios, utilizar URLs/infraestructura remota, credenciales de un entorno desplegado o comprobar el comportamiento real entre servicios ya desplegados se reservan para la versión beta y se ejecutan cuando los servicios estén efectivamente desplegados y el entorno beta esté disponible. No se exige ni se intenta un despliegue para aprobar tareas individuales. La clasificación no permite diferir pruebas de lógica, sintaxis, contratos aislables, regresión, seguridad local ni concurrencia reproducible: esas deben aprobarse antes del cierre. Registrar los escenarios beta en `beta_test.txt` conforme al apartado siguiente, sin convertir su estado Pendiente beta en bloqueo de implementación.

**Qué NO es una prueba local:** una prueba cuya ejecución necesita desplegar la plataforma o un servicio, acceder a una URL/infraestructura remota, utilizar credenciales o permisos de un entorno desplegado, validar el comportamiento real del navegador contra ese despliegue, consumir integraciones externas vivas, cuotas o propiedades remotas. Aunque el escenario se describa como “funcional”, “E2E” o “integración”, si depende de esas condiciones es una prueba de despliegue/beta, no una prueba local. La clasificación depende de sus precondiciones técnicas reales, no del nombre de la prueba.

**Criterio obligatorio de cierre:** una tarea puede marcarse **Completada** cuando la implementación está terminada y todas las pruebas/verificaciones locales pertinentes y ejecutables sobre el código hayan sido ejecutadas con PASS, junto con la revisión del diff y los demás criterios aplicables. Un FAIL local relevante debe corregirse antes del cierre. Una prueba local no ejecutada solo impide cerrar si es pertinente, ejecutable en el entorno local disponible y necesaria para verificar el cambio; si está ausente, debe crearse o ampliarse. No convertir en bloqueo una prueba que por naturaleza requiere despliegue, infraestructura remota, credenciales reales o un servicio vivo. No es requisito disponer de un checkout conectado a un servicio desplegado para completar tareas de código.

**Pruebas de despliegue/beta:** todas las verificaciones que requieren las condiciones descritas en “Qué NO es una prueba local” se registran en el archivo maestro `beta_test.txt` de la raíz, con ID, módulo/rol, tarea/requisito, objetivo, precondiciones, pasos, resultado esperado, estado Pendiente beta y evidencia requerida. No añadir casos nuevos al archivo histórico `docs/testing/PRUEBAS_FUNCIONALES_BETA.md`. Estas pruebas se ejecutan cuando exista una versión beta y el entorno correspondiente. Su estado pendiente, la inexistencia del despliegue o la falta de acceso a ese entorno **nunca bloquean ni impiden marcar como completada una tarea de implementación** si las verificaciones locales de código aplicables han pasado. No clasificar como beta un defecto que puede detectarse y corregirse localmente.

**Honestidad de resultados:** diferenciar PASS, FAIL, BLOCKED y NOT RUN para las pruebas que correspondan a cada entorno. Nunca declarar aprobada una prueba no ejecutada. Los resultados beta pendientes se mantienen explícitamente como Pendiente beta, sin presentarlos como PASS ni usarlos como condición de cierre de implementación. Un defecto local reproducible que afecte al requisito o a seguridad/integridad debe corregirse antes de cerrar el cambio.

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
La protección de `NG_beta_0.0.0.1` es una configuración que corresponde exclusivamente al propietario/administrador. El usuario confirma que la rama base está protegida desde su lado. Si la API, el conector o una consulta del repositorio devuelve `protected=false`, no muestra rulesets o no permite verificar la configuración, ese dato describe únicamente lo que la herramienta puede observar y **no demuestra que la rama esté desprotegida ni contradice la confirmación del usuario**. El agente debe registrar, si resulta pertinente, que la API no refleja/no permite verificar la protección; nunca cuestionar al usuario, exigir que cambie la configuración ni bloquear tareas por ese indicador. El agente no modifica la protección salvo instrucción expresa. Su obligación es trabajar exclusivamente en `NG_beta_0.0.0.1_work`, no escribir en la rama base y verificar que la rama base permanezca intacta.

## 14. Cierre y estados
Una unidad de trabajo puede cerrarse cuando su alcance está implementado, las verificaciones pertinentes fueron ejecutadas o sus limitaciones quedaron explícitas, el diff fue revisado y existe evidencia suficiente. No requiere aprobar trámites administrativos no relacionados ni ejecutar pruebas beta remotas pendientes.

Estados:
- **Completada:** todos los requisitos de implementación están cumplidos, las pruebas y verificaciones locales pertinentes y ejecutables sobre el código fueron ejecutadas con resultado PASS, la revisión interna exigida está aprobada y existe evidencia verificable. Las pruebas que requieren despliegue, servicios vivos, infraestructura/URLs remotas o credenciales del entorno beta se registran en `beta_test.txt` y no impiden completar la implementación.
- **En ejecución:** queda trabajo del alcance o alguna prueba/verificación local pertinente, ejecutable en el entorno de desarrollo y necesaria para verificar el código pendiente de ejecución, corrección o aprobación.
- **Bloqueada:** existe un prerrequisito técnico o autorización externa imprescindible, identificado y probado, que impide avanzar en el alcance afectado.
- **Pendiente:** aún no iniciada.
- Las pruebas funcionales que requieren despliegue/servicios vivos se registran por separado en \`beta_test.txt\` y conservan estados beta independientes; su ausencia no bloquea una implementación cuyas pruebas locales aplicables hayan pasado.

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


## 17. Alcance funcional de seguridad y optimización de rendimiento

### 17.1 Principio de seguridad proporcional al uso académico

IMA es una plataforma de gestión académica. Su seguridad debe proteger el acceso por identidad y rol, la separación de los espacios institucionales y la integridad básica de los registros, sin convertir operaciones académicas ordinarias en flujos de validación transaccional o controles redundantes. La seguridad se aplica en el punto de entrada de cada acción y conforme al permiso requerido; no se repiten controles equivalentes en cada archivo, fragmento, imagen, video o evidencia cuando la autorización de la acción y el contexto ya fueron comprobados.

Este apartado actualiza el alcance de producto de las secciones 1, 5, 6, 7 y 15. No elimina los requisitos mínimos de autenticación, autorización por rol, separación institucional, protección de sesiones ni integridad de los datos. Ante una regla previa que exija validaciones redundantes o seguridad desproporcionada para un flujo académico ordinario, prevalece este apartado.

### 17.2 Acciones académicas y registro de datos

- Los usuarios pueden crear aportes y registros académicos, registrar calificaciones y adjuntar archivos, imágenes, videos y materiales conforme a los permisos de su rol.
- La aplicación debe capturar los campos enviados por el formulario y asociar al registro la fecha/hora de creación y la identidad/nombre del usuario que lo realizó. La identidad debe proceder de la sesión autenticada, no de un nombre libremente declarado por el cliente.
- No se requiere una autorización entre servicios ni una validación de legitimidad transaccional adicional para cada registro ordinario. El servicio que recibe la acción aplica la autorización correspondiente al rol y al ámbito institucional, valida los campos indispensables para procesar correctamente el formulario y persiste el registro.
- Evitar dobles consultas, verificaciones repetidas de permisos, cadenas de aprobación técnica y llamadas entre servicios que no aporten una garantía necesaria al requisito.
- Las operaciones de guardado deben ser directas, con respuestas ágiles y sin bloquear al usuario por controles que no cambian el resultado de la operación.
- Los tutoriales no forman parte del flujo operativo obligatorio de registro, carga o presentación de evidencias. No deben imponerse como paso previo para completar una acción académica.

### 17.3 Carga y consulta de archivos y evidencias

- La carga debe integrarse de forma fluida con el formulario y con el registro académico al que pertenece.
- No ejecutar validaciones de seguridad duplicadas por cada archivo, imagen, video, fragmento o reintento de carga si ya se validó la acción, la identidad y el contexto de destino.
- Mantener únicamente las comprobaciones operativas indispensables para que la carga funcione y el archivo pueda asociarse y recuperarse correctamente, como los límites técnicos configurados por la plataforma y la referencia al registro destino.
- No introducir flujos de aprobación entre servicios, análisis costosos o controles adicionales por defecto que no respondan a un requisito concreto del producto.
- Las reglas de acceso por rol y ámbito se aplican al acceso a la acción y a la consulta del recurso. La implementación debe evitar repetirlas innecesariamente dentro de cada etapa técnica de una misma carga.

### 17.4 Autenticación, sesión y controles de cuenta

Los controles de seguridad de cuenta requeridos para este alcance son:

1. Inicio de sesión con usuario y contraseña, almacenando contraseñas únicamente mediante un algoritmo de hash de contraseñas actual y adecuado.
2. Autorización de las acciones según los roles y permisos ya definidos. Cada acción protegida debe comprobar el permiso correspondiente; no se deben agregar capas equivalentes redundantes.
3. Cierre de sesión remoto y revocación de sesiones activas del usuario. La aplicación debe invalidar también el estado autenticado y los datos privados almacenados en su caché local tan pronto como el cliente reciba la señal de revocación o en su siguiente comunicación con el servidor.
4. Al eliminar una cuenta, revocar sus sesiones y credenciales activas para impedir nuevos accesos con esa cuenta. Las sesiones ya emitidas no deben seguir siendo válidas después de que la revocación sea efectiva.
5. Bloqueo temporal del acceso después de varios intentos fallidos consecutivos, con umbral y duración razonables y configurables, para reducir intentos repetidos y consumo innecesario de recursos.

La revocación remota no debe describirse como capacidad de borrar instantáneamente la caché de un dispositivo desconectado: el servidor puede invalidar la sesión de inmediato, pero la limpieza de la caché del cliente se ejecuta cuando el cliente recibe la instrucción o vuelve a conectarse. Los datos privados locales deben quedar inaccesibles al perder vigencia la sesión.

### 17.5 Rendimiento y estrategia de validación

- Priorizar el menor tiempo de respuesta razonable, menos llamadas de red, menos consultas repetidas y menos pasos de interacción.
- Validar una vez en el límite de la acción los datos y permisos necesarios. Reutilizar el contexto autenticado y autorizado durante la operación en lugar de recalcularlo en cada subpaso.
- No validar de nuevo la legitimidad de una transacción académica ordinaria ni solicitar permisos entre servicios si el flujo no lo requiere.
- Conservar las validaciones que evitan errores reales de formulario, asociaciones incorrectas, escrituras inválidas o acciones fuera del rol. La optimización no significa aceptar datos mal formados ni permitir operaciones no autorizadas.
- Medir y corregir latencias, consultas duplicadas, serialización innecesaria, procesamiento bloqueante y controles repetidos. No sacrificar la corrección de los datos ni la autorización efectiva para mejorar una métrica aislada.
- Las pruebas deben verificar tanto el comportamiento funcional como que el flujo no introduce validaciones, consultas o llamadas redundantes. No se deben reducir, falsear ni debilitar las pruebas para obtener una aprobación.

### 17.6 Estrategia ante fallos de pruebas y CI

Un fallo de Node.js, CLI, GitHub Actions u otra herramienta no constituye por sí solo una razón para detener el trabajo. El agente debe:

1. Identificar si el fallo proviene del código, de la prueba, de la configuración, de la herramienta, de la red o del entorno.
2. Revisar logs, comandos, versiones, dependencias, fixtures y precondiciones.
3. Reintentar de forma razonada cuando el fallo sea transitorio; si persiste, probar una vía equivalente y reproducible que mantenga el mismo criterio de aceptación.
4. Ejecutar las pruebas directamente con Node.js o CLI cuando el wrapper o workflow no esté disponible, y aislar las pruebas pertinentes cuando una suite amplia falle por una causa ajena al cambio.
5. Corregir el código o la prueba cuando exista un defecto real. Ajustar una prueba solo si se demuestra que el propio test es incorrecto o está desactualizado, preservando la intención y cobertura originales.
6. No eliminar casos, reducir aserciones, omitir escenarios, alterar resultados esperados ni modificar código ajeno para forzar un PASS.
7. Registrar con precisión PASS, FAIL, BLOCKED o NOT RUN, incluyendo el método alternativo usado y la limitación restante.

El objetivo es encontrar una manera válida de verificar el requisito, no conseguir una marca verde a cualquier costo. La búsqueda de métodos alternativos nunca autoriza a presentar como ejecutada una prueba que no se pudo correr.

### 17.7 Revisión y conservación de integridad

Las revisiones de código, sintaxis, lógica, regresiones y concurrencia siguen siendo aplicables en proporción al cambio. Deben concentrarse en los riesgos reales y no introducir controles de producto adicionales que contradigan este alcance. Proteger el código no relacionado, conservar las pruebas relevantes y revisar el diff completo antes de cada commit. Esta optimización no autoriza a borrar líneas, capacidades o validaciones necesarias fuera del alcance de la tarea.
