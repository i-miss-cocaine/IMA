# Auditoría TAREA-13

Fecha: 2026-11-05  
Rama: NG_beta_0.0.0.1_work  
Dictamen: **CUMPLE PARCIALMENTE**.

## Alcance y evidencia revisada

Requisito [TAREA-13] de completadas.md: responsables de departamentos; docentes asociados a áreas/asignaturas/grados/secciones; límites de carga y horarios; detección de conflictos de docente/aula; docentes compartidos/sustitutos; planificación departamental, vacantes y carga por área.

Archivos inspeccionados:
- backend/academic-service/Code.gs (SHA daf1883ec0b8d4f0ff2bc673af8a4e8c5bbd03fc).
- js/teacher.js (SHA c475fce5afcd28fca23e7b64398ad32b17773746).
- teacher-dashboard.html (SHA cbb9e6a272a7d8ad33f99727303305d950533e71).
- ChangesLogs.txt (SHA d57cf4bd861b5c3720e60cf83241ed804ff645d9).

Los tres archivos de código/UI tienen el mismo SHA en NG_beta_0.0.0.1 y NG_beta_0.0.0.1_work; no se identificaron correcciones posteriores en la rama de trabajo.

## Evidencia de cumplimiento parcial

- Existe asignación de jefaturas departamentales mediante assignDepartmentHead y una vista de planificación/vacantes mediante getDepartmentAcademicPlanning.
- Existe asignación de docentes a áreas en DocentesAreasAcademicas, con fechas, tipo de vinculación y roles de coordinación; hay consultas por área/docente y baja lógica.
- Existe AsignacionesDocentes para vincular docentes con ofertas, y funciones de sustitución temporal.
- Existe creación de horarios con LockService, validación de solapamiento, capacidad de aula, jornada laboral y límite de carga configurable.
- La interfaz incluye matriz de horarios, formulario de horario, configuración de preferencias/carga, sustituciones y panel de vacantes/jefaturas.

## Incumplimientos y defectos

1. **Fuentes de ofertas incompatibles.** getAcademicOffers/createAcademicOffer trabajan con la hoja OfertaAcademica. getDepartmentAcademicPlanning consulta OfertasAcademicas (plural), una hoja distinta que no corresponde al catálogo inicializado/consumido por las funciones de ofertas. La planificación departamental puede devolver cero ofertas y declarar falsamente que no existen vacantes aunque sí haya ofertas en OfertaAcademica.
2. **Relación docente-área y docente-oferta fragmentada.** assignTeacherToAcademicArea registra pertenencia a un área, pero no la vincula con asignatura, oferta, grado, sección ni periodo. assignTeacherToClass registra solo oferta/docente y no valida que la oferta y el docente existan/estén activos, que la asignación esté dentro de fechas, ni evita duplicados o incompatibilidades. No se demuestra una relación canónica que permita resolver la carga de un docente desde área hasta grupo/periodo.
3. **Consultas de horarios interpretan columnas incorrectas.** createClassSchedule persiste HorariosClase con el orden [HorarioID, OfertaID, DiaSemana, HoraInicio, HoraFin, AulaCodigo, DocenteUserId, Estado, UltimaModificacion]. getClassSchedules interpreta r[7] como grado y r[8] como sección, aunque esos índices contienen Estado y UltimaModificacion; también asigna materia = r[1] (OfertaID). Sus filtros de grado/sección y los datos devueltos son incorrectos para las filas creadas por el propio servicio. El filtro de cancelados consulta r[9]/r[10], no la columna de estado r[7].
4. **Año lectivo ausente o ignorado en el modelo de horarios.** La hoja HorariosClase no persiste AnoID/PeriodoID. getClassSchedules recibe anolectivo pero no lo aplica; getTeacherTeachingLoad recibe anoId pero tampoco lo aplica; checkScheduleConflict compara registros sin ámbito temporal. Horarios de años lectivos distintos pueden mezclarse en consultas, carga y detección de conflictos.
5. **Sustituciones no comprueban correctamente los conflictos.** createTeacherSubstitution filtra horarios por r[8] === Activo, pero en el esquema vigente r[8] es UltimaModificacion y el estado está en r[7]. Además, pasa sched[3] como día, sched[4] como hora de inicio y sched[5] como hora de fin, aunque esos índices representan horaInicio, horaFin y aulaCodigo. Por ello no se comprueba de forma fiable la disponibilidad del sustituto. La asignación se guarda con estado Activa, mientras otras consultas buscan Activo; tampoco se valida superposición de periodos de sustitución ni se refleja el titular/reemplazo en el calendario de forma inequívoca.
6. **Asignaciones compartidas y vacantes mal representadas.** getDepartmentAcademicPlanning guarda un solo docente por oferta en offerAssignedMap; asignaciones adicionales sobrescriben la anterior en el mapa. Las sustituciones se guardan con estado Activa, pero el resumen departamental considera asignaciones solo cuando r[6] === Activo. Una oferta sustituida puede seguir apareciendo vacante y no se representa de manera fiable una asignación compartida.
7. **Cálculo de carga docente incluye estados no vigentes.** getTeacherTeachingLoad excluye únicamente filas con estado Inactivo; por tanto puede sumar Borrador y Cancelado como horas activas. Tampoco aplica anoId. saveTeacherWorkLoadPreferences acepta límites sin validar rango/consistencia de horaEntrada/horaSalida y no valida el JSON de días laborales antes de persistirlo.
8. **Motor de conflictos mezcla estados y periodos.** checkScheduleConflict excluye solo Inactivo, por lo que puede considerar Cancelado como conflicto; además compara horarios de todos los años al no existir filtro de año lectivo. El control de aula, docente y oferta existe, pero la exactitud de sus resultados depende de un esquema de horario consistente y del estado efectivo del bloque.
9. **Reporte de ocupación no es una medición contextual fiable.** getPlanningQualityAndOccupancyReport recibe anoLectivo pero no filtra por él; incluye filas distintas de Inactivo para el cálculo de ocupación, incluidos borradores/cancelados, y calcula capacidad semanal como 40 horas por aula de forma fija. El porcentaje global puede mezclar años y estados y no representa la disponibilidad real por periodo.
10. **Interfaz incompleta para asignación por área.** js/teacher.js no consume assignTeacherToAcademicArea, getTeachersByAcademicArea, getAcademicAreasByTeacher ni removeTeacherFromAcademicArea. Las funciones existen en backend y tienen permisos para roles de coordinación/dirección, pero la interfaz revisada no integra el flujo de asignación de docentes a áreas curriculares. La interfaz sí consume jefaturas, vacantes, horarios, preferencias y sustituciones.
11. **Trazabilidad/autorización contextual transversal.** Las consultas getTeacherAssignments/getClassSchedules y las funciones de asignación reciben identificadores desde payload. El actor/autorizador se registra desde campos declarados por el cliente en varias operaciones. Coordinar con AUD-NG-158 para derivar identidad y ámbito del token, validar asignaciones vigentes y restringir consulta/modificación por área/oferta/grupo sin duplicar el hallazgo transversal.

## Hallazgo nuevo

**AUD-NG-168 - Unificar el modelo de asignaciones docentes, carga horaria y planificación de horarios.** Alto (P1). Alcance: fuente canónica de ofertas y asignaciones; relación verificable docente-área-asignatura-oferta-grado-sección-año/periodo; soporte de asignaciones compartidas y sustituciones con vigencia; esquema único de horarios; filtros temporales; detección de conflictos y carga solo sobre bloques vigentes; paneles departamentales y vacantes calculados desde las mismas relaciones persistidas.

## Ampliaciones de tareas existentes (sin duplicar)

- **AUD-NG-164:** consolidar OfertaAcademica como fuente canónica y evitar que los informes/planificación consulten OfertasAcademicas u otros catálogos paralelos; validar IDs estables entre área, asignatura, plan y oferta.
- **AUD-NG-158:** aplicar ABAC a asignación/consulta/baja de docentes por área, oferta, grado, sección y periodo; derivar actor de claims verificados para asignaciones, sustituciones, preferencias, horarios y excepciones; no confiar en IDs/autorizadores enviados por el cliente.

## Calidad y límites

Calidad insuficiente: existen funciones y pantallas parciales, pero la divergencia de hojas/esquemas invalida consultas y reportes, las sustituciones leen columnas incorrectas, los cálculos mezclan estados/años y el flujo de área no está integrado en la interfaz. Revisión estática/manual; no se ejecutaron pruebas con datos reales, conflictos concurrentes, múltiples docentes, periodos lectivos, permisos ni despliegue productivo. No se modificó código fuente, completadas.md, completadas_legacy.md ni ChangesLogs.txt.

## Tareas ejecutables derivadas de los hallazgos

### AUD-NG-168 - Modelo unificado de asignaciones docentes, carga horaria y planificación (P1)
- Establecer una fuente canónica de ofertas y asignaciones. Las consultas de planificación deben consumir la misma entidad persistida que `getAcademicOffers/createAcademicOffer`; eliminar la divergencia entre `OfertaAcademica` y `OfertasAcademicas` o implementar una migración/sincronización explícita y verificable.
- Definir la relación completa y trazable docente-área-asignatura-oferta-grado-sección-año lectivo-periodo. Cada vínculo debe usar IDs canónicos, validar existencia/estado de las entidades y conservar fechas de vigencia.
- Validar `assignTeacherToClass` en servidor: docente y oferta existentes/activos, compatibilidad con el área/asignatura/grupo/periodo, vigencia de la asignación y ausencia de duplicados o incompatibilidades.
- Soportar múltiples docentes por oferta sin sobrescribir asignaciones previas en mapas de un solo valor. Los informes deben representar asignaciones compartidas y distinguir titular, docente asociado y sustituto.
- Normalizar el esquema de `HorariosClase` y sus lectores/escritores. La interpretación de cada columna debe corresponder al esquema real; validar encabezados y versión del esquema antes de leer/escribir para impedir que Estado o UltimaModificacion se interpreten como grado/sección.
- Persistir el contexto temporal del horario (año lectivo y periodo) y aplicarlo en `getClassSchedules`, `getTeacherTeachingLoad`, `checkScheduleConflict` y reportes de ocupación. No mezclar horarios de distintos años/periodos.
- Corregir la detección de conflictos para que utilice las columnas reales de día, hora inicial, hora final, aula, docente y estado; considerar solo bloques vigentes/activos y excluir cancelados o borradores conforme a la regla institucional.
- Validar sustituciones con el mismo esquema canónico de horario: comprobar disponibilidad del sustituto en día/hora/aula correctos, vigencia temporal de la sustitución y ausencia de solapamientos. Unificar los estados utilizados para asignación y consulta; representar inequívocamente titular y sustituto en el calendario.
- Calcular carga docente únicamente con asignaciones y horarios vigentes del año/periodo solicitado. Excluir borradores, cancelados e inactivos; validar límites de carga y coherencia de preferencias de entrada/salida y días laborales antes de persistirlas.
- Calcular ocupación y vacantes desde las mismas relaciones canónicas, con filtros por año/periodo y estado. Sustituir la capacidad semanal fija por parámetros institucionales verificables de disponibilidad/capacidad del aula.
- Integrar en la interfaz docente el flujo de pertenencia a áreas (asignar, consultar y retirar), manteniendo sincronía con asignaturas, ofertas y grupos. La existencia de endpoints backend sin consumidores UI no acredita el flujo institucional.
- Mantener historial de cambios de asignación, horario, carga y sustitución con actor, fecha, motivo y vigencia anterior/nueva, sin sobrescribir el único registro histórico.

### AUD-NG-164 - Catálogo curricular como fuente canónica de ofertas
- Consolidar `OfertaAcademica` como la fuente canónica que consumen creación de ofertas, planificación departamental, asignaciones docentes y horarios.
- Garantizar IDs estables y referencias válidas entre área, departamento, programa, grado, asignatura, plan y oferta; evitar catálogos paralelos o nombres de hojas divergentes.
- Validar compatibilidad y vigencia curricular de cada oferta antes de permitir asignaciones docentes, horarios o matrícula.
- Preservar la responsabilidad de AUD-NG-164 sobre el catálogo maestro; el modelo operativo de asignaciones, sustituciones y horarios se mantiene en AUD-NG-168.

### AUD-NG-158 - ABAC para asignaciones, horarios y planificación
- Aplicar autorización contextual a asignar/consultar/retirar docentes por área, oferta, grado, sección y periodo.
- Derivar actor y autorizador de claims verificados; no confiar en `profesorId`, `autorId`, `asignadoPor` ni otros identificadores enviados por el cliente.
- Validar el ámbito autorizado antes de crear o modificar asignaciones, sustituciones, preferencias de carga, horarios y excepciones.
- Restringir `getTeacherAssignments`, `getClassSchedules`, planificación departamental y reportes a los ámbitos permitidos por rol y asignación vigente.
- Mantener el control ABAC transversal separado de la integridad de relaciones y reglas de horario que corresponden a AUD-NG-168.

**Reconciliación y límites:** AUD-NG-168 concentra la integridad de asignaciones, esquema/periodos de horarios, sustituciones, carga, conflictos, ocupación e integración de interfaz. AUD-NG-164 conserva el catálogo curricular maestro y la fuente canónica de ofertas. AUD-NG-158 conserva identidad, autorización y ámbito contextual. No se crean IDs adicionales ni se duplican responsabilidades.

**Evidencia requerida:** pruebas de fuente canónica de ofertas; relaciones docentes/ofertas/grupos válidas e inválidas; asignaciones compartidas; sustituciones con intervalos y conflictos; filtros de año/periodo; lectura/escritura del esquema de horarios; cálculo de carga y ocupación por estado; validación de preferencias; interfaz de áreas; y pruebas ABAC con acceso permitido/denegado. La auditoría actual es estática y no acredita estos resultados.

