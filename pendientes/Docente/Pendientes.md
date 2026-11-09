# Backlog consolidado — Docente

**Estado operativo del Plan Maestro (reinicio global):** todas las tareas de este backlog quedan en estado `Pendiente` al inicio de la ejecución. Ninguna tarea se considera `Completada`; marcas, etiquetas o declaraciones históricas de cierre son únicamente antecedentes y no acreditan estado vigente. Una tarea solo podrá cambiar de estado tras su implementación y verificación conforme al Plan Maestro.

**Fuentes integradas:** informes de auditoría de `AUDITORIAS/`, `Pendientes.md`, `completadas.md` y los archivos departamentales preexistentes. Los registros con el mismo identificador se reúnen en una sola tarea.

**Integridad:** se conservan los requisitos originales sin resumen ni paráfrasis. Se eliminan líneas exactamente repetidas tras normalizar espacios/capitalización. Los títulos alternativos se conservan como referencia. Las fuentes originales se mantienen sin alteración para trazabilidad.

---

<!-- ID: AUD-NG-217 | Fuentes: Pendientes.md -->
### [ ] [AUD-NG-217] Restringir perfiles, vínculos familiares y trámites al ámbito docente autenticado
- **Origen del Hallazgo:** Auditoria.txt / AUD-NG-217 (TAREA-F4-P0-02, C1.73).
- **Severidad/Clasificación:** Crítico · P0 · Seguridad · IDOR · Protección de datos personales.
- **Archivos Involucrados:** backend/user-service/Code.gs.
- **Dependencias Expuestas:** ROLE_PERMISSIONS["Profesor"], validateContextualAccess, getUserInfo, getGuardianStudents, getAdministrativeRequests, submitAdministrativeRequest, getMyAssignedSections, getMyTeachingAssignments, AsignacionesDocentes, RelacionesFamiliares.
- **Descripción del Alcance:** El rol Profesor tiene permiso para getUserInfo, getGuardianStudents, getAdministrativeRequests y submitAdministrativeRequest. validateContextualAccess en USER solo aplica controles específicos a Estudiante/Alumno y Padre/Tutor/Responsable; no valida asignaciones docentes. Los handlers aceptan userId, targetUserId o userIdResponsable del payload sin comprobar que el estudiante pertenezca a las secciones/asignaturas activas del profesor. Esto permite consultar perfiles (correo, teléfono, personaId), obtener estudiantes vinculados a cualquier tutor y leer/crear trámites en nombre de usuarios ajenos.
- **Criterios de Aceptación:** El servidor deriva el ámbito del profesor desde asignaciones activas; getUserInfo solo devuelve perfiles dentro del ámbito autorizado; getGuardianStudents solo permite consultar tutores de estudiantes asignados; getAdministrativeRequests solo devuelve solicitudes propias o de estudiantes asignados; submitAdministrativeRequest deriva el solicitante desde claims y valida el estudiante objetivo; manipular IDs no amplía el acceso; se prueban casos de profesor asignado/no asignado, otro profesor, otro tutor y otro estudiante.
- **Estado:** [ ] Pendiente

---

<!-- ID: F9-TASK01 | Fuentes: completadas.md -->
### [ ] [F9-TASK01] Verificar y fortalecer la compatibilidad de las plantillas oficiales de calificaciones de SACE
- **Origen del Hallazgo:** `AUDITORIA_FASE_9_EVALUACIONES_CALIFICACIONES_RESULTADOS.md` / Tarea F9-Task01 (P0)
- **Prioridad:** P0
- **Severidad/Clasificación:** Crítica (Exportación académica, compatibilidad institucional y automatización de calificaciones)
- **Archivos Involucrados:**
  - `backend/academic-service/Code.gs`
  - `backend/exam-service/Code.gs`
  - `js/secretary.js` / `js/teacher.js`
  - Plantillas oficiales de SACE en el repositorio
- **Dependencias Expuestas:** Registros oficiales de estudiantes, matrículas, asignaciones docentes, calificaciones consolidadas, período académico y plantillas existentes en el repositorio
- **Descripción del Alcance:**
  La plataforma debe aprovechar las plantillas existentes en el repositorio para completar los archivos oficiales descargados por los docentes, conservando su estructura y evitando que tengan que copiar y pegar manualmente las calificaciones.

  Requisitos Funcionales:
  1. Localizar e identificar las plantillas de hojas de cálculo relacionadas con el registro y la carga de calificaciones en SACE que ya existen en el repositorio. Identificar sus formatos, hojas, columnas, encabezados, celdas editables, fórmulas, validaciones, rangos, celdas combinadas y demás elementos relevantes.
  2. Determinar cuáles de esas plantillas corresponden a cada tipo de registro académico, asignatura, grado, sección, período o nivel educativo. No asumir que todas utilizan una estructura idéntica.
  3. Permitir que el docente utilice el archivo descargado desde SACE como documento de entrada, sin tener que convertirlo a un formato interno ni reconstruir su estructura.
  4. Incorporar las calificaciones correspondientes a los estudiantes y las asignaturas que coincidan con los registros institucionales.
  5. Organizar la generación de archivos por asignatura, sección y docente, respetando los criterios de agrupación y los campos que exija cada plantilla.
  6. Mantener los identificadores oficiales de estudiantes y los demás campos requeridos por SACE. No sustituirlos por identificadores internos de la plataforma cuando el archivo requiera los oficiales.
  7. Conservar los encabezados, las hojas, el orden de las columnas, las fórmulas, las validaciones, los formatos de celda y los demás elementos estructurales necesarios para que SACE acepte el archivo.
  8. Modificar únicamente los campos destinados a recibir información académica. No sobrescribir fórmulas ni celdas protegidas, ni eliminar información que deba conservarse.
  9. Relacionar las calificaciones con el estudiante correcto mediante identificadores fiables. No depender exclusivamente del nombre del estudiante, porque puede haber nombres iguales, diferencias ortográficas o variaciones en los apellidos.
  10. Cuando existan diferencias entre los registros institucionales y el archivo descargado, identificarlas y presentar un informe de inconsistencias en lugar de asignar notas por aproximación.
  11. Si falta una calificación, distinguir entre una nota pendiente, una ausencia, una exención y una calificación numérica de cero, según las reglas académicas aplicables. No convertir automáticamente un dato ausente en cero.
  12. Generar un archivo independiente para cada combinación de asignatura, sección y docente que corresponda al proceso de carga, evitando mezclar estudiantes, materias o grupos diferentes.
  13. Permitir que el docente descargue cada archivo generado y lo revise antes de subirlo a SACE.
  14. Conservar la plantilla original descargada como fuente de referencia y producir una copia completada, sin modificar el archivo de entrada.
  15. Proporcionar mensajes de error específicos cuando no se pueda identificar la plantilla, reconocer sus encabezados, relacionar estudiantes o determinar las columnas que deben completarse.
  16. Comparar el funcionamiento esperado con la experiencia de generación de archivos de calificaciones utilizada en Califik, tomando como referencia la automatización del llenado de plantillas y la separación de archivos por contexto académico, sin asumir que ambas plataformas utilizan idénticos formatos internos.
- **Criterios de Aceptación:**
  - Al proporcionar una plantilla válida descargada desde SACE, la plataforma identifica su estructura y determina qué campos puede completar.
  - Las calificaciones se asignan a los estudiantes correctos, incluso cuando existen nombres similares.
  - El archivo generado conserva la estructura original y únicamente modifica los campos autorizados.
  - Los archivos se separan correctamente por asignatura, sección y docente.
  - Los registros incompletos, duplicados o incompatibles se informan sin producir asignaciones silenciosamente incorrectas.
  - Las notas pendientes no se convierten automáticamente en ceros.
  - El archivo generado puede abrirse en el programa de hojas de cálculo compatible con su formato sin errores estructurales.
  - Una comparación entre el archivo original y el generado permite comprobar que los encabezados, las hojas, las fórmulas y los campos no editables se han conservado.
  - Se comprueba la compatibilidad con las plantillas disponibles en el repositorio, incluyendo las variantes existentes.
  - Cuando no se dispone de una plantilla representativa o de un procedimiento de validación oficial, esa limitación se documenta y no se declara demostrada la aceptación del archivo por SACE.
- **Estado:** Pendiente

---

<!-- ID: F9-TASK02 | Fuentes: completadas.md -->
### [ ] [F9-TASK02] Fortalecer la validación y el diagnóstico de archivos SACE antes de generar las calificaciones
- **Origen del Hallazgo:** `AUDITORIA_FASE_9_EVALUACIONES_CALIFICACIONES_RESULTADOS.md` / Tarea F9-Task02 (P0)
- **Prioridad:** P0
- **Severidad/Clasificación:** Crítica (Validación de datos e integridad de exportaciones)
- **Archivos Involucrados:**
  - `backend/academic-service/Code.gs`
  - `js/secretary.js` / `js/teacher.js`
- **Dependencias Expuestas:** F9-Task01, registros de matrícula y estudiantes, estructura de las plantillas disponibles y reglas de validación académica
- **Descripción del Alcance:**
  Garantizar que la generación de archivos identifique errores antes de producir documentos que puedan contener calificaciones incorrectas o resultar incompatibles con el formato esperado.

  Requisitos Funcionales:
  1. Validar la estructura de cada archivo antes de procesarlo, incluyendo las hojas requeridas, encabezados, columnas obligatorias, identificadores y campos destinados a recibir calificaciones.
  2. Detectar archivos vacíos, corruptos, incompletos, modificados o correspondientes a una estructura que la plataforma no reconoce.
  3. Validar que el archivo corresponda al período académico, grado, sección, asignatura y contexto institucional seleccionados, cuando esos datos estén presentes.
  4. Detectar estudiantes duplicados, identificadores inexistentes, matrículas inactivas, estudiantes faltantes y registros que no correspondan al grupo seleccionado.
  5. Comparar los datos del archivo con los registros institucionales sin asumir que el orden de las filas permanece constante.
  6. Identificar columnas con nombres similares, encabezados modificados y campos obligatorios ausentes. No completar automáticamente columnas ambiguas.
  7. Comprobar que cada calificación cumpla el rango y el tipo de dato requerido por el campo de destino.
  8. Diferenciar errores bloqueantes, advertencias y diferencias informativas.
  9. Mostrar un resumen previo a la generación con el número de estudiantes identificados, notas que se incorporarán, registros omitidos, advertencias y errores bloqueantes.
  10. Permitir corregir los problemas identificados y repetir la validación sin necesidad de reiniciar todo el proceso.
  11. Generar un informe descargable de inconsistencias que identifique el registro afectado y describa la corrección necesaria.
  12. Evitar que los errores parciales se oculten detrás de un mensaje genérico de exportación exitosa.
- **Criterios de Aceptación:**
  - Un archivo válido se procesa sin alterar su estructura.
  - Un archivo con columnas obligatorias ausentes no se completa silenciosamente.
  - Los identificadores duplicados o desconocidos se detectan antes de incorporar calificaciones.
  - Los registros incompatibles quedan identificados individualmente.
  - Los errores bloqueantes impiden generar el archivo definitivo.
  - Las advertencias no bloqueantes se muestran antes de confirmar la operación.
  - El informe de validación permite identificar cada problema sin consultar manualmente el código.
  - La validación puede repetirse después de corregir el archivo y produce resultados coherentes con los cambios realizados.
- **Estado:** Pendiente

---

<!-- ID: F9-TASK03 | Fuentes: completadas.md -->
### [ ] [F9-TASK03] Consolidar la administración de escalas, ponderaciones y métodos de cálculo académico
- **Origen del Hallazgo:** `AUDITORIA_FASE_9_EVALUACIONES_CALIFICACIONES_RESULTADOS.md` / Tarea F9-Task03 (P0)
- **Prioridad:** P0
- **Severidad/Clasificación:** Crítica (Configuración académica y motor de cálculo)
- **Archivos Involucrados:**
  - `backend/academic-service/Code.gs`
  - `backend/exam-service/Code.gs`
  - `js/config.js`
- **Dependencias Expuestas:** Configuración académica institucional, asignaturas, niveles, períodos, competencias y motor de cálculo existente
- **Descripción del Alcance:**
  Garantizar que las reglas sean configurables, consistentes entre materias y períodos, y compatibles con las distintas modalidades educativas sin introducir valores fijos que puedan resultar incorrectos en otros contextos.

  Requisitos Funcionales:
  1. Permitir configurar métodos de evaluación por nivel educativo, grado, asignatura y período académico, según corresponda.
  2. Admitir, como mínimo: promedio aritmético, promedio ponderado por categorías, cálculo proporcional por puntos obtenidos respecto a puntos posibles, escalas numéricas, escalas cualitativas, evaluación por competencias e indicadores de logro.
  3. Permitir configurar pesos por categoría y validar que la suma corresponda al total requerido por el método seleccionado.
  4. Permitir que las ponderaciones se distribuyan entre categorías y actividades sin duplicar accidentalmente su contribución al resultado final.
  5. Definir expresamente cómo se tratan las actividades pendientes, las exenciones, las ausencias justificadas y no justificadas, las actividades no calificadas y las calificaciones recuperadas.
  6. Evitar que una actividad pendiente se interprete automáticamente como cero, salvo que una regla institucional explícita y aplicable determine ese comportamiento.
  7. Configurar las escalas de calificación con límites, equivalencias, estados de aprobación y reglas de redondeo.
  8. Evitar que los umbrales de aprobación o las equivalencias institucionales se apliquen universalmente cuando deban variar según el nivel, la modalidad o la normativa aplicable.
  9. Mantener versiones de las reglas utilizadas en cada período, de modo que los cambios de configuración no modifiquen retroactivamente los resultados históricos.
  10. Proporcionar una vista previa que muestre cómo cambia el resultado de un estudiante de prueba al modificar las ponderaciones o el método de cálculo.
  11. Permitir reutilizar configuraciones entre materias o grupos compatibles, conservando la posibilidad de ajustarlas de forma independiente.
  12. Presentar el desglose del cálculo para que el docente y los responsables autorizados puedan comprender cómo se obtuvo la nota final.
- **Criterios de Aceptación:**
  - Dos configuraciones independientes pueden utilizar categorías con nombres iguales sin compartir accidentalmente sus ponderaciones.
  - Una ponderación inválida impide activar la configuración o genera un estado explícito que impide calcular resultados oficiales.
  - El mismo conjunto de datos y la misma versión de reglas producen el mismo resultado.
  - Las notas pendientes y las exenciones se procesan según las reglas configuradas.
  - Cambiar una configuración no modifica silenciosamente las calificaciones históricas.
  - Los resultados de la vista previa coinciden con los del cálculo definitivo.
  - Las escalas numéricas y cualitativas se representan correctamente en el libro de calificaciones y en los reportes.
- **Estado:** Pendiente

---

<!-- ID: F9-TASK04 | Fuentes: completadas.md -->
### [ ] [F9-TASK04] Fortalecer la precisión de los cálculos y la detección de inconsistencias académicas
- **Origen del Hallazgo:** `AUDITORIA_FASE_9_EVALUACIONES_CALIFICACIONES_RESULTADOS.md` / Tarea F9-Task04 (P0)
- **Prioridad:** P0
- **Severidad/Clasificación:** Crítica (Integridad de las calificaciones y resultados oficiales)
- **Archivos Involucrados:**
  - `backend/academic-service/Code.gs`
  - `backend/exam-service/Code.gs`
  - `backend/task-service/Code.gs`
- **Dependencias Expuestas:** F9-Task03, libro de calificaciones, evaluaciones, recuperaciones e historial académico
- **Descripción del Alcance:**
  Garantizar que todos los procesos que generan, modifican o consolidan calificaciones apliquen exactamente el mismo conjunto de reglas y precisión estandarizada.

  Requisitos Funcionales:
  1. Identificar todos los flujos que producen o modifican notas: exámenes, tareas, proyectos, rúbricas, recuperaciones, competencias y registros manuales.
  2. Verificar que los resultados oficiales utilicen el mismo conjunto de reglas y que ningún módulo aplique una fórmula incompatible.
  3. Validar que las puntuaciones obtenidas no excedan los puntos máximos permitidos, salvo que una regla explícita admita bonificaciones.
  4. Detectar ponderaciones duplicadas, categorías sin configuración, actividades vinculadas a períodos incorrectos y evaluaciones que no correspondan a la asignatura.
  5. Verificar el tratamiento de los decimales, el redondeo y la precisión intermedia para evitar diferencias entre el libro de notas, el boletín y la exportación.
  6. Definir el orden de aplicación de las reglas de recuperación, redondeo, equivalencia y aprobación.
  7. Evitar que una modificación de una actividad altere resultados de estudiantes o períodos que no estén relacionados con ella.
  8. Detectar resultados imposibles o inconsistentes, como promedios fuera del rango permitido, notas finales incompatibles con las calificaciones de origen o totales que no coincidan con sus componentes.
  9. Registrar los datos de origen y la versión de las reglas necesarias para reproducir un resultado oficial.
  10. Proporcionar un diagnóstico que permita distinguir entre un dato de entrada incorrecto, una regla mal configurada y un fallo del cálculo.
- **Criterios de Aceptación:**
  - Los cálculos de prueba coinciden con resultados de referencia definidos para cada método.
  - Las mismas notas no producen promedios diferentes entre los módulos que presentan el resultado oficial.
  - Los valores fuera de rango se rechazan o se procesan únicamente cuando una regla explícita lo permite.
  - Los errores de configuración se identifican antes de publicar resultados afectados.
  - Las modificaciones se propagan a los resultados dependientes sin alterar registros ajenos.
  - Se pueden reproducir los resultados históricos utilizando sus reglas originales.
- **Estado:** Pendiente

---

<!-- ID: F9-TASK05 | Fuentes: completadas.md -->
### [ ] [F9-TASK05] Completar el ciclo de revisión, aprobación, cierre y publicación de calificaciones
- **Origen del Hallazgo:** `AUDITORIA_FASE_9_EVALUACIONES_CALIFICACIONES_RESULTADOS.md` / Tarea F9-Task06 (P0)
- **Prioridad:** P0
- **Severidad/Clasificación:** Crítica (Gestión de períodos académicos y publicación oficial)
- **Archivos Involucrados:**
  - `backend/exam-service/Code.gs`
  - `teacher-dashboard.html` / `js/teacher.js`
  - `dashboard-secretaria.html` / `js/secretary.js`
- **Dependencias Expuestas:** F9-Task03, F9-Task04, F9-Task05 y sistema de permisos
- **Descripción del Alcance:**
  Garantizar que las etapas de revisión, aprobación, cierre y publicación representen estados diferenciados, con controles adecuados para impedir que resultados incompletos o no autorizados lleguen a estudiantes y tutores.

  Requisitos Funcionales:
  1. Diferenciar los estados de borrador, pendiente de revisión, observado, aprobado, cerrado y publicado, según el flujo institucional aplicable.
  2. Permitir que el docente finalice la preparación de las calificaciones sin publicarlas automáticamente.
  3. Proporcionar a los responsables autorizados un resumen de las notas pendientes, evaluaciones sin calificar, inconsistencias y excepciones.
  4. Permitir devolver un período al docente para corregir problemas identificados antes de su aprobación.
  5. Validar las condiciones de cierre antes de bloquear nuevas modificaciones.
  6. Identificar las excepciones que requieren autorización, como estudiantes con actividades pendientes o registros sujetos a revisión.
  7. Exigir una confirmación explícita antes de ejecutar operaciones de cierre o publicación.
  8. Diferenciar el cierre administrativo de la disponibilidad de las notas en los portales de estudiantes y tutores.
  9. Garantizar que los borradores no sean visibles como calificaciones oficiales.
  10. Registrar quién inició, aprobó, cerró y publicó el período, con sus respectivas fechas.
  11. Si la publicación incluye notificaciones, registrar los intentos de envío y permitir detectar fallos sin repetir innecesariamente avisos ya entregados.
  12. Evitar que una operación interrumpida deje el período en un estado contradictorio entre el libro de calificaciones, la configuración del período y el portal estudiantil.
- **Criterios de Aceptación:**
  - No se puede publicar un período que no haya cumplido las condiciones de aprobación establecidas.
  - Las calificaciones en borrador permanecen ocultas para los usuarios que solo tienen acceso a resultados oficiales.
  - El cierre impide las modificaciones ordinarias no autorizadas.
  - La publicación actualiza correctamente la visibilidad de los resultados.
  - Las transiciones de estado quedan registradas y pueden consultarse.
  - Los errores durante el cierre o la publicación no dejan el período en un estado inconsistente.
  - Las notificaciones fallidas pueden identificarse y gestionarse sin duplicar las operaciones académicas.
- **Estado:** Pendiente

---

<!-- ID: F9-TASK06 | Fuentes: completadas.md -->
### [ ] [F9-TASK06] Fortalecer las rectificaciones de notas y la trazabilidad de los cambios
- **Origen del Hallazgo:** `AUDITORIA_FASE_9_EVALUACIONES_CALIFICACIONES_RESULTADOS.md` / Tarea F9-Task07 (P0)
- **Prioridad:** P0
- **Severidad/Clasificación:** Crítica (Seguridad académica, auditoría e integridad histórica)
- **Archivos Involucrados:**
  - `backend/user-service/Code.gs`
  - `backend/exam-service/Code.gs`
  - `backend/academic-service/Code.gs`
- **Dependencias Expuestas:** F9-Task04, F9-Task06, servicio de usuarios, permisos y bitácora institucional
- **Descripción del Alcance:**
  Garantizar que cada rectificación tenga un motivo documentado, conserve el valor anterior y permita reconstruir qué ocurrió con la calificación desde su registro inicial hasta su publicación definitiva.

  Requisitos Funcionales:
  1. Registrar cada modificación de una calificación con el valor anterior, el nuevo valor, el usuario responsable, la fecha, el motivo y el contexto académico.
  2. Identificar el estudiante, la asignatura, la actividad y el período afectados.
  3. Exigir una justificación para las rectificaciones de resultados oficiales y las reaperturas de períodos cerrados.
  4. Permitir que los responsables autorizados aprueben o rechacen solicitudes de rectificación, cuando el flujo institucional lo requiera.
  5. Diferenciar la solicitud, la autorización, la ejecución y la publicación de una corrección.
  6. Conservar el historial de modificaciones sin eliminar silenciosamente los registros anteriores.
  7. Registrar las operaciones realizadas sobre lotes de calificaciones e identificar cada nota efectivamente modificada.
  8. Recalcular los promedios y documentos dependientes cuando una rectificación aprobada lo requiera.
  9. Registrar la versión anterior y posterior de los resultados afectados.
  10. Evitar que un usuario pueda modificar una nota oficial utilizando una operación de actualización ordinaria que omita los controles de rectificación.
  11. Impedir que usuarios sin autorización alteren o eliminen los registros de auditoría.
  12. Proporcionar consultas filtrables por estudiante, docente, asignatura, período, usuario responsable y fecha.
- **Criterios de Aceptación:**
  - Toda rectificación oficial deja un registro completo y consultable.
  - Los cambios no autorizados se rechazan en el servidor, incluso si se envían solicitudes directamente a la API.
  - El valor anterior puede recuperarse desde el historial.
  - Las notas corregidas se reflejan en los cálculos y documentos que dependan de ellas.
  - Los intentos fallidos de rectificación no modifican el resultado oficial.
  - Las rectificaciones masivas permiten identificar cada cambio individual.
  - El historial conserva la relación entre la solicitud, la autorización y la modificación efectuada.
- **Estado:** Pendiente

---

<!-- ID: F9-TASK07 | Fuentes: completadas.md -->
### [ ] [F9-TASK07] Fortalecer la generación de boletines, certificados e historiales académicos
- **Origen del Hallazgo:** `AUDITORIA_FASE_9_EVALUACIONES_CALIFICACIONES_RESULTADOS.md` / Tarea F9-Task10 (P0)
- **Prioridad:** P0
- **Severidad/Clasificación:** Crítica (Documentación académica y resultados oficiales)
- **Archivos Involucrados:**
  - `backend/academic-service/Code.gs`
  - `student-dashboard.html` / `js/student.js`
- **Dependencias Expuestas:** F9-Task03, F9-Task04, F9-Task06, F9-Task07 y expediente académico
- **Descripción del Alcance:**
  Garantizar la consistencia entre las calificaciones oficiales, los documentos emitidos y las versiones históricas de esos documentos.

  Requisitos Funcionales:
  1. Generar boletines por estudiante, período, grado y año lectivo.
  2. Incluir las asignaturas correspondientes, las calificaciones, los promedios, los estados de aprobación y las observaciones autorizadas.
  3. Diferenciar los resultados parciales, los resultados finales y las calificaciones de recuperación.
  4. Permitir consultar el historial académico agrupado por año lectivo, grado, período y asignatura.
  5. Generar certificados e historiales a partir de datos oficiales y de las reglas aplicables al período correspondiente.
  6. Mantener coherencia entre las notas mostradas en el portal y las incluidas en los documentos descargables.
  7. Evitar que una corrección posterior modifique silenciosamente un documento oficial previamente emitido.
  8. Permitir reemitir documentos cuando exista una rectificación autorizada, conservando la trazabilidad de la versión anterior.
  9. Registrar la fecha de emisión, el período cubierto, la versión del documento y el usuario responsable, según corresponda.
  10. Aplicar permisos para impedir la consulta o descarga de documentos pertenecientes a estudiantes no autorizados.
  11. Diferenciar entre documentos informativos y documentos oficiales que requieran aprobación, firma o validación institucional.
  12. Permitir generar reportes individuales y consolidados para los responsables autorizados, sin exponer datos de estudiantes ajenos al ámbito de consulta.
- **Criterios de Aceptación:**
  - Los documentos coinciden con los resultados académicos oficiales de su período.
  - Los promedios y estados de aprobación son coherentes con el libro de calificaciones.
  - Las rectificaciones generan versiones actualizadas sin borrar la trazabilidad anterior.
  - Los documentos históricos conservan su contexto académico.
  - Los usuarios no autorizados no pueden consultar ni descargar documentos ajenos.
  - Las asignaturas exentas, las recuperaciones y los resultados pendientes se representan de acuerdo con las reglas aplicables.
- **Estado:** Pendiente

---

<!-- ID: F9-TASK08 | Fuentes: completadas.md -->
### [ ] [F9-TASK08] Fortalecer el control de permisos y la separación de responsabilidades académicas
- **Origen del Hallazgo:** `AUDITORIA_FASE_9_EVALUACIONES_CALIFICACIONES_RESULTADOS.md` / Tarea F9-Task12 (P0)
- **Prioridad:** P0
- **Severidad/Clasificación:** Crítica (Seguridad, privacidad y acceso a calificaciones)
- **Archivos Involucrados:**
  - `backend/exam-service/Code.gs`
  - `backend/academic-service/Code.gs`
  - `backend/user-service/Code.gs`
- **Dependencias Expuestas:** Servicios de usuarios, matrícula, asignaciones docentes, expediente académico y operaciones de exportación
- **Descripción del Alcance:**
  Verificar y aplicar estrictamente los controles de seguridad tanto en la interfaz como en cada operación del servidor que consulte, registre, modifique, publique o exporte calificaciones.

  Requisitos Funcionales:
  1. Verificar los permisos tanto en la interfaz como en cada operación del servidor que consulte, registre, modifique, publique o exporte calificaciones.
  2. Limitar a los docentes a las asignaturas, grupos y períodos que tengan asignados.
  3. Permitir a Secretaría, Dirección y Coordinación acceder a las operaciones correspondientes a sus responsabilidades institucionales.
  4. Restringir a estudiantes y tutores la consulta a los resultados para los que tengan autorización.
  5. Validar las relaciones entre el usuario, el estudiante, el grupo, la asignatura, el período y la operación solicitada.
  6. Impedir que la modificación de identificadores en una petición permita consultar o alterar calificaciones de otros estudiantes.
  7. Aplicar las mismas restricciones a las descargas, los reportes, los boletines, los historiales y los archivos de SACE.
  8. Evitar que las funciones de administración de permisos permitan ampliar privilegios sin autorización.
  9. Registrar los accesos denegados y los intentos de operaciones sensibles, sin exponer datos académicos innecesarios en los mensajes de error.
  10. Mantener los controles de acceso al cambiar la matrícula de un estudiante, las asignaciones de un docente o las relaciones entre tutores y estudiantes.
- **Criterios de Aceptación:**
  - Un docente no puede modificar notas de una asignatura que no tiene asignada, aunque envíe una petición directa al servicio.
  - Un estudiante no puede consultar resultados de otro alumno alterando un identificador.
  - Un tutor solo puede consultar a los estudiantes vinculados a su perfil y autorizados para esa consulta.
  - Los permisos se aplican de igual manera a las operaciones individuales, masivas y de exportación.
  - Los intentos no autorizados se rechazan sin modificar los datos.
  - Los cambios en las relaciones académicas actualizan los permisos efectivos de manera coherente.
- **Estado:** Pendiente

---

<!-- ID: F9-TASK09 | Fuentes: completadas.md -->
### [ ] [F9-TASK09] Completar las pruebas automatizadas de regresión de la Fase 9
- **Origen del Hallazgo:** `AUDITORIA_FASE_9_EVALUACIONES_CALIFICACIONES_RESULTADOS.md` / Tarea F9-Task14 (P0)
- **Prioridad:** P0
- **Severidad/Clasificación:** Crítica (Calidad funcional e integridad académica)
- **Archivos Involucrados:**
  - `tests/regression/academic-grading-suite.js`
  - `backend/developer-service/Code.gs`
- **Dependencias Expuestas:** F9-Task01 a F9-Task13, según las capacidades cubiertas por cada prueba
- **Descripción del Alcance:**
  Establecer pruebas reproducibles y automatizadas para verificar el correcto funcionamiento de los cálculos, cierres, rectificaciones, exportaciones SACE y seguridad.

  Requisitos Funcionales:
  1. Establecer pruebas reproducibles para los métodos de cálculo, las ponderaciones, las escalas, las recuperaciones y los estados de aprobación.
  2. Crear casos de prueba para notas mínimas, máximas, decimales, valores inválidos, actividades pendientes y estudiantes exentos.
  3. Verificar que las modificaciones de una calificación se reflejen correctamente en los promedios, los boletines y los historiales.
  4. Comprobar las restricciones de edición en períodos cerrados y años históricos.
  5. Probar los flujos de aprobación, publicación, rectificación y reapertura.
  6. Probar la generación de archivos SACE con las plantillas reales existentes en el repositorio.
  7. Verificar que las plantillas originales mantengan su estructura después de generar los archivos completados.
  8. Comprobar el aislamiento entre estudiantes, tutores, docentes, asignaturas y secciones.
  9. Simular fallos de conexión, reintentos, guardados concurrentes y errores durante la generación de archivos.
  10. Probar la generación de reportes con estudiantes trasladados, matrículas inactivas, asignaturas exentas y registros históricos.
  11. Verificar la accesibilidad de las operaciones principales con teclado y pantallas pequeñas.
  12. Incorporar pruebas de regresión para evitar que una corrección en el cálculo, la exportación o la publicación afecte las funciones existentes.
- **Criterios de Aceptación:**
  - Los casos de prueba tienen resultados esperados explícitos y reproducibles.
  - Los cálculos coinciden con los resultados de referencia.
  - Las operaciones no autorizadas se rechazan.
  - Las rectificaciones mantienen la trazabilidad histórica.
  - Los archivos generados respetan las plantillas utilizadas en las pruebas.
  - Los fallos simulados no provocan pérdida silenciosa de calificaciones.
  - Las modificaciones posteriores no reintroducen defectos en los flujos previamente verificados.
- **Estado:** Pendiente

---

<!-- ID: F16-TASK02 | Fuentes: AUDITORIAS/AUDITORIA_FASE_16_RECURSOS_HUMANOS.md -->
### [ ] [F16-TASK02] Desarrollar la gestión de docentes por área académica independiente y comités pedagógicos
- **Severidad:** Crítica (Estructura académica institucional y conformación de academias)
- **Componentes Afectados:** `backend/academic-service/Code.gs`, `backend/accounting-service/Code.gs`, hoja `DocentesAreasAcademicas`.
- **Descripción:** Implementar la hoja y endpoints `assignTeacherToAcademicArea` y `getTeachersByAcademicArea`, permitiendo vincular docentes a una o varias áreas académicas (Matemáticas, Informática, Ciencias, etc.) de forma institucional, designando docentes titulares y coordinadores sin depender de que tengan una oferta de clases asignada en el período lectivo vigente.
- **Criterios de Aceptación:** Se puede asignar un docente a múltiples áreas; se pueden consultar todos los docentes de un área; los docentes desvinculados pasan automáticamente a estado inactivo en el área sin borrar asignaciones históricas.
- **Hallazgo de origen:** C.2, F.2, G.1, tabla E/F16-04, backlog H.1 y continuidad J.
- **Severidad:** Crítica. **Objetivo:** registrar la pertenencia institucional de docentes a una o varias áreas con independencia de su carga lectiva.
- **Acción ejecutable:** crear `DocentesAreasAcademicas` y endpoints `assignTeacherToAcademicArea` / `getTeachersByAcademicArea`; admitir áreas múltiples, titularidad/coordinación, vigencia, estado y consulta para comités; inactivar al desvincular al empleado sin borrar historial.
- **Archivos/módulos:** `backend/academic-service/Code.gs`, `backend/accounting-service/Code.gs`, hoja `DocentesAreasAcademicas` y pantallas de coordinación/RR. HH.
- **Dependencias/riesgos:** `AreasCurricularesExtensiones`, identidad laboral, permisos y asignaciones docentes; riesgo de confundir pertenencia a un área con asignación de una clase.
- **Alcance:** pertenencia docente-área y comités; no sustituir `AsignacionesDocentes` ni la oferta académica.
- **Criterios de aceptación:** un docente pertenece a varias áreas sin sección activa; consultas devuelven miembros vigentes; titular/coordinador identificado; desvinculación inactiva la relación conservando historia; accesos respetan ámbito.
- **Prioridad:** P0. **Estado:** Pendiente.
- **Reconciliación:** AUD-NG-018 cubre historial de asignaciones docentes y es dependencia, pero no equivale a la entidad de pertenencia institucional docente-área.
- **Evidencia de cierre:** pendiente; no se declara ejecución ni verificación.

---

<!-- ID: F16-TASK03 | Fuentes: AUDITORIAS/AUDITORIA_FASE_16_RECURSOS_HUMANOS.md -->
### [ ] [F16-TASK03] Ejecutar un offboarding atómico con revocación de accesos en cascada
- **Severidad:** Crítica (Seguridad de accesos, prevención de fugas de información e integridad)
- **Componentes Afectados:** `backend/accounting-service/Code.gs`, `backend/user-service/Code.gs`, `backend/academic-service/Code.gs`.
- **Descripción:** Refactorizar `updateEmployeeLaborStatus` para que, al marcar a un empleado como `Retirado` o `Desvinculado`, ejecute una operación atómica que: 1) cierre el expediente laboral con fecha de salida y motivo; 2) invalide sus adscripciones en `HistorialAdscripciones`; 3) desactive su cuenta de usuario en `Usuarios` revocando tokens activos; 4) finalice sus asignaciones docentes activas en `AsignacionesDocentes`; y 5) genere la constancia de finiquito y liquidación laboral conforme a ley.
- **Criterios de Aceptación:** La desvinculación inhabilita de inmediato el acceso a la plataforma; se preservan todos los contratos, asistencias y calificaciones históricas; se genera un registro de auditoría `EMPLOYEE_OFFBOARDED_CASCADED`.

- **Hallazgo de origen:** C.1, F.3, G.1, tabla E/F16-20, backlog H.1 y continuidad J.
- **Severidad:** Crítica. **Objetivo:** impedir que una persona desvinculada conserve cuentas, sesiones, adscripciones o asignaciones activas.
- **Acción ejecutable:** consolidar `updateEmployeeLaborStatus` en un flujo transaccional/idempotente que cierre expediente con fecha/motivo, invalide adscripciones, desactive cuenta y tokens, termine asignaciones docentes y sustituciones, genere finiquito/liquidación conforme a reglas aplicables y registre `EMPLOYEE_OFFBOARDED_CASCADED`.
- **Archivos/módulos:** servicios accounting, user y academic; `ExpedientesLaborales`, `HistorialAdscripciones`, `Usuarios`, `AsignacionesDocentes` y sustituciones.
- **Dependencias/riesgos:** identidad/sesiones, historial laboral, asignaciones académicas, contratos y liquidación; riesgo crítico de accesos residuales o cierres parciales.
- **Alcance:** desvinculación y revocación coordinada; preservar contratos, asistencias, calificaciones e historia.
- **Criterios de aceptación:** cuenta inhabilitada inmediatamente; relaciones activas cerradas; fallos no dejan estado parcial irrecuperable; historial íntegro; evento auditable emitido una sola vez.
- **Prioridad:** P0 en H.1; tabla E asigna P1 (discrepancia).
- **Estado:** Pendiente.
- **Reconciliación:** C1.82 vincula offboarding con TASK-006/AUD-NG-017. Reconciliar alcance y ampliar la tarea existente si corresponde; no duplicar implementación.
- **Evidencia de cierre:** pendiente; no se declara ejecución ni verificación.

---

<!-- ID: F29-TASK03 | Fuentes: AUDITORIAS/AUDITORIA_FASE_29_MIGRACION_Y_TRANSICION.md -->
### [ ] [F29-TASK03] Proteger la inalterabilidad de calificaciones históricas migradas
- **Hallazgo de origen:** BR-29-03; F29-06; secciones C.6, E y G.
- **Severidad:** Crítica / P0. **Objetivo:** conservar notas oficiales de ciclos cerrados sin que los motores actuales las recalculen o sobrescriban.
- **Acción ejecutable:** identificar y versionar cada nota migrada; registrar sistema/periodo de origen, fórmula histórica, valor original y evidencia; establecer estado de solo lectura para ciclos cerrados; separar rectificaciones autorizadas de recálculos automáticos.
- **Archivos/módulos:** `backend/academic-service/Code.gs`, `backend/exam-service/Code.gs`, `CalificacionesEstudiantes`, `RecuperacionesEstudiante`, libro de calificaciones y `AuditoriaMigraciones`.
- **Dependencias/riesgos:** F29-Task01, F29-Task13 y AUD-NG-167 (fuente y ciclo institucional de calificaciones); riesgo de pérdida de integridad académica o alteración retroactiva de promedios.
- **Alcance:** notas históricas migradas y ciclos cerrados; no impedir rectificaciones legales con flujo separado, autorizado y trazable.
- **Criterios de aceptación:** cada nota tiene origen y snapshot; triggers/cálculos excluyen notas protegidas; rectificación requiere actor autorizado, motivo y nueva versión; conciliación conserva valor original; pruebas de recálculo, importación repetida, cierre y rectificación.
- **Prioridad:** P0. **Estado:** Pendiente.
- **Evidencia de cierre:** pendiente; el informe reconoce preservación parcial, pero la matriz H exige proteger la integridad histórica.

---

<!-- ID: F29-TASK16 | Fuentes: AUDITORIAS/AUDITORIA_FASE_29_MIGRACION_Y_TRANSICION.md -->
### [ ] [F29-TASK16] Ejecutar smoke tests e integridad posterior a cada migración
- **Hallazgo de origen:** F29-13; sección C.13 y H.
- **Severidad:** Crítica / P0. **Objetivo:** verificar que el destino permanece funcional y coherente después de cada lote, piloto y cutover.
- **Acción ejecutable:** ampliar `AUD-NG-161` con suites conductuales específicas de migración: conteos, relaciones, permisos, cálculos, documentos, saldos, calificaciones, asistencia y flujos de lectura; generar evidencia por entidad y bloquear promoción ante fallos.
- **Archivos/módulos:** `tests/regression`, servicios Academic/Accounting/User/Developer, `AuditoriaMigraciones` y pipeline de migración.
- **Dependencias/riesgos:** F29-Task01..Task15 y AUD-NG-161; riesgo de pruebas estructurales que no detecten corrupción semántica.
- **Alcance:** validación posterior aislada; no ejecutar escrituras ni notificaciones productivas durante pruebas.
- **Criterios de aceptación:** fixtures conocidos; verificaciones por rol y entidad; relaciones y totales conciliados; no hay registros huérfanos; smoke tests tras lote/piloto/cutover; fallos bloquean Go; evidencia reproducible con versión de suite.
- **Prioridad:** P0. **Estado:** Pendiente (ampliación de AUD-NG-161).
- **Evidencia de cierre:** pendiente; la matriz H considera que la suite general requiere pruebas específicas posteriores a migración.

---

<!-- ID: F30-TASK02 | Fuentes: AUDITORIAS/AUDITORIA_FASE_30_CONSOLIDACION_CERTIFICACION_MEJORA_CONTINUA.md -->
### [ ] [F30-TASK02] Implementar motor de integridad referencial cruzada y detección de registros huérfanos
- **Hallazgo de origen:** F30-02; relaciones entre Usuarios, ExpedientesEstudiantes, MatriculasEstudiantes, CargosEstudiante, RelacionesFamiliares y AsignacionesDocentes.
- **Severidad:** Crítica / P0. **Objetivo:** detectar y prevenir relaciones inválidas o huérfanas en el almacenamiento basado en hojas.
- **Acción ejecutable:** crear catálogo declarativo de entidades, claves y relaciones; implementar validación previa a escritura, escaneo periódico de integridad y reporte de huérfanos; impedir borrados/archivados que rompan relaciones o exigir operación controlada.
- **Archivos/módulos:** `backend/developer-service/Code.gs`, servicios User/Academic/Accounting, catálogos maestros y hojas de entidades relacionadas.
- **Dependencias/riesgos:** F29-Task01 (correspondencia de IDs), AUD-NG-036 (relación familiar), AUD-NG-158 (ámbito docente) y AUD-NG-164 (catálogo curricular); riesgo de reparación automática incorrecta.
- **Alcance:** integridad lógica en Sheets; no asumir que Google Sheets ofrece llaves foráneas ni reparar automáticamente relaciones ambiguas.
- **Criterios de aceptación:** esquema de relaciones versionado; validación server-side; escaneo informa entidad/clave/origen; borrado lógico conserva referencias; reparaciones requieren regla determinista o aprobación; pruebas de huérfanos, colisiones y relaciones interinstitucionales.
- **Prioridad:** P0. **Estado:** Pendiente.
- **Evidencia de cierre:** pendiente; el informe señala ausencia de integridad referencial forzada y riesgo de huérfanos por archivo/eliminación.

---

<!-- ID: F31-TASK04 | Fuentes: AUDITORIAS/AUDITORIA_FASE_31_DISENADOR_UNIVERSAL_DOCUMENTOS_PLANTILLAS.md -->
### [ ] [F31-TASK04] Ampliar catálogo de variables con secciones y tablas repetibles
- **Hallazgo de origen:** F31-23 y brecha F.3; plan G.4.
- **Severidad:** Crítica / P0. **Objetivo:** generar tablas de longitud variable (asignaturas, calificaciones, conceptos de cobro) dentro de plantillas.
- **Acción ejecutable:** ampliar el motor de plantillas con bloques iterables tipados (por ejemplo `{{#each asignaturas}}...`) y contexto limitado; validar listas, campos permitidos, anidamiento y límites de filas; escapar contenido por contexto.
- **Archivos/módulos:** `backend/accounting-service/Code.gs`, `generateSchoolDocument`, `PlantillasEscolares`, `populatePropSourceTags` y renderizador HTML/PDF.
- **Dependencias/riesgos:** F31-Task01, F24-Task02 (diccionario de indicadores cuando se use), seguridad de plantillas; riesgo de inyección HTML o expansión excesiva de documentos.
- **Alcance:** repetición de datos autorizados; no permitir evaluación de expresiones o acceso libre a objetos internos.
- **Criterios de aceptación:** sintaxis declarativa y versionada; variables permitidas; escape contextual; límites de iteraciones/tamaño; listas vacías manejadas; pruebas de tablas con 0/1/múltiples filas, datos maliciosos y anidamiento no permitido.
- **Prioridad:** P0. **Estado:** Pendiente.
- **Evidencia de cierre:** pendiente; el catálogo actual contiene variables escalares y carece de iteradores para colecciones.

---

<!-- ID: F34-TASK03 | Fuentes: AUDITORIAS/AUDITORIA_FASE_34_BANDEJAS_REVISION_FIRMAS.md -->
### [ ] [F34-TASK03] Implementar acceso contextual ABAC docente a justificaciones de sus estudiantes
- **Hallazgo de origen:** F34-11 y CAR-F34-04; PT-F34-06 no aprobado.
- **Severidad:** Crítica / P0. **Objetivo:** permitir al docente consultar solo justificaciones de estudiantes matriculados en sus asignaturas/secciones vigentes.
- **Acción ejecutable:** crear `getTeacherStudentJustifications` con identidad derivada de sesión verificada; validar asignación docente, oferta, grupo, periodo y relación con el estudiante; excluir notas internas y datos familiares no necesarios.
- **Archivos/módulos:** `backend/academic-service/Code.gs`, `ROLE_PERMISSIONS`, `AsignacionesDocentes`, `MatriculasEstudiantes`, justificaciones y `backend/user-service/Code.gs`.
- **Dependencias/riesgos:** AUD-NG-105/108/158, AUD-NG-217/TASK-496 cuando corresponda; riesgo de IDOR o acceso a alumnos fuera de asignación.
- **Alcance:** consulta docente de justificaciones; no habilitar acceso a expedientes completos ni observaciones internas administrativas.
- **Criterios de aceptación:** contexto se deriva del token; asignación y matrícula vigentes verificadas server-side; filtros por año/periodo; respuesta minimizada; denegación fail-closed ante relación ausente; pruebas multi-docente, sección ajena, periodo vencido y usuario manipulado.
- **Prioridad:** P0. **Estado:** Pendiente.
- **Evidencia de cierre:** pendiente; la auditoría confirma que no existe endpoint contextual docente.

---

<!-- ID: F35-TASK02 | Fuentes: AUDITORIAS/AUDITORIA_FASE_35_IMPORTADOR_INTELIGENTE.md -->
### [ ] [F35-TASK02] Normalizar tipos, formatos regionales y preservar identificadores
- **Hallazgo de origen:** F35-06; CAR-F35-06.
- **Severidad:** Crítica / P0. **Objetivo:** preservar códigos con ceros iniciales y convertir fechas/importes de forma explícita y reversible.
- **Acción ejecutable:** configurar lectura de identificadores como texto; crear normalizadores por tipo/locale para fecha, decimal, moneda y booleano; exigir selección de formato cuando los valores sean ambiguos; conservar valor bruto y valor normalizado.
- **Archivos/módulos:** `js/teacher.js`, SheetJS, `validateImportPreview`, `importDataWithColumnMapping`, `js/config.js`.
- **Dependencias/riesgos:** F26-Task02 (formateo regional), F35-Task16 (validación); riesgo de convertir fechas/identificadores incorrectamente o perder el valor original.
- **Alcance:** normalización antes de persistir; no modificar identificadores ya almacenados ni inferir locale ambiguo sin confirmación.
- **Criterios de aceptación:** ceros iniciales conservados; fechas DD/MM y MM/DD desambiguadas; decimales coma/punto interpretados según configuración; moneda explícita; valor original disponible para auditoría; pruebas con 00125, fechas ambiguas, 1.250,50, negativos y nulos.
- **Prioridad:** P0. **Estado:** Pendiente.
- **Evidencia de cierre:** pendiente; la auditoría confirma conversión de códigos como 00125 a 125 y falta de normalización regional.

---

<!-- ID: F35-TASK15 | Fuentes: AUDITORIAS/AUDITORIA_FASE_35_IMPORTADOR_INTELIGENTE.md -->
### [ ] [F35-TASK15] Implementar selección de hoja, detección de encabezados y rangos/columnas de origen
- **Hallazgo de origen:** F35-01/F35-02/F35-05; CAR-F35-01/CAR-F35-02/CAR-F35-05.
- **Severidad:** Crítica / P0. **Objetivo:** permitir importar desde la hoja y rango correctos aunque el archivo contenga varias pestañas, títulos o columnas irrelevantes.
- **Acción ejecutable:** mostrar hojas disponibles; detectar filas candidatas de encabezado con confianza; permitir elegir fila/rango de datos, columnas incluidas/excluidas y vista de muestra antes del mapeo.
- **Archivos/módulos:** `js/teacher.js`, SheetJS, `#modal-excel-importer`, `validateImportPreview`.
- **Dependencias/riesgos:** F35-Task01/04, F35-Task09; riesgo de seleccionar encabezados equivocados o excluir columnas clave.
- **Alcance:** configuración del origen; no modificar archivo original ni confiar en detección automática sin revisión.
- **Criterios de aceptación:** selector de hojas; fila de encabezado editable; rango inicial/final; inclusión/exclusión de columnas; preview con muestra; validación de formato/tamaño/corrupción en cliente y servidor; pruebas con múltiples hojas, títulos, filas vacías, rangos parciales y archivo protegido.
- **Prioridad:** P0. **Estado:** Pendiente.
- **Evidencia de cierre:** pendiente; se lee siempre la primera hoja y se asume encabezado en fila 1, sin MIME real ni selección de rango.

---

<!-- ID: TAREA-F7-IMP-22 | Fuentes: AUDITORIAS/AUDITORIA_COMPLETADAS_PLAN.md ; completadas.md -->
### [ ] [TAREA-F7-IMP-22] Ampliar la planificación mediante plantillas y reutilización controlada de horarios
- **Dictamen:** NO CUMPLE; la marca [ ] de completadas.md no acredita cumplimiento.
- **Criterios:** CA-F7-133 CUMPLE; CA-F7-134 NO CUMPLE; CA-F7-135 NO CUMPLE; CA-F7-136 CUMPLE; CA-F7-137 NO CUMPLE.
- **Hallazgos:** AUD-NG-265 nuevo CRÍTICO/P0 (tres acciones de plantillas públicas y sin token); AUD-NG-266 nuevo ALTO/P1 (esquema/captura de origen); AUD-NG-267 nuevo ALTO/P1 (conflictos y referencias no bloqueados); AUD-NG-268 nuevo MEDIO/P2 (UI, selección, preview y ajustes ausentes); AUD-NG-269 nuevo MEDIO/P2 (sin trazabilidad y sin pruebas conductuales).
- **Tareas ejecutables derivadas:** TASK-622 seguridad de acciones; TASK-623 esquema y componentes seleccionables; TASK-624 validación/preview/confirmación; TASK-625 UI y pruebas conductuales.
- **Ampliaciones:** AUD-NG-168/AUD-NG-236/AUD-NG-241 para esquema y motor de conflictos; AUD-NG-261/TASK-620 para evento de aplicación; AUD-NG-224/TASK-504 y AUD-NG-145 para historial/bitácora; AUD-NG-161 para coordinación de pruebas.
- **Evidencia:** Code.gs 249, 524-543, 671-681, 6718-6770, 6900-6990, 7493-7691, 13895-14100, 14109-14165; teacher.js 1297-1368; teacher-dashboard.html completo; ChangesLogs 2586 y siguientes; completadas.md 4625-4664.
- **Pruebas:** inspección manual/estática y verificación Git/blob. No ejecutados Apps Script, Sheets productivas, HTTP/OAuth, requests anónimas reales, DOM/navegador, roles reales, concurrencia, Node ni E2E.
- **Documentación:** informe individual IMP-22 y fuente de Fase 7 no existen; auditoría ejecutada directamente desde completadas.md. Pendientes.md lectura ordinaria 0 caracteres; blob 631b4c2dbf0e86d5704b63625382d73ccb8ceb3c recuperado íntegramente (1.782.094 caracteres, 20.182 líneas, 0 U+FFFD, 511 TASK únicos TASK-001..TASK-511); ya está en la rama y no requiere restauración.
- **Siguiente tarea exacta:** TAREA-F7-IMP-23, herramientas de impresión y distribución de horarios.

- **Origen del Hallazgo:** `AUDITORIA_FASE_7_PLANIFICACION_HORARIOS_RECURSOS.md` / Tarea F7-IMP-22 (P2 · Plantillas de Horario)
- **Prioridad:** P2
- **Severidad/Clasificación:** Medio (Nueva herramienta de productividad)
- **Archivos Involucrados:**
  - `backend/academic-service/Code.gs`
  - `teacher-dashboard.html`
  - `js/teacher.js`
- **Dependencias Expuestas:** `copyClassSchedules`, `HorariosClase`, `F7-IMP-01`, `F7-IMP-02`, `F7-IMP-09`
- **Descripción del Alcance:**
  Desarrollar la capacidad de guardar la estructura de distribución horaria semanal de un período o sección como plantilla reutilizable, permitiendo clonarla hacia otro período con previsualización y re-validación de aulas y docentes.

  Requisitos Funcionales:
  1. Permitir guardar una estructura de horario como plantilla cuando corresponda.
  2. Permitir seleccionar qué elementos se reutilizarán: distribución semanal, períodos horarios, asignaturas, estructura de secciones, preferencias de planificación.
  3. Evitar copiar automáticamente docentes, aulas o asignaciones que deban volver a validarse para el nuevo período.
  4. Identificar las referencias que no existan en el período de destino.
  5. Validar la plantilla antes de aplicarla.
  6. Permitir previsualizar las asignaciones resultantes.
  7. Detectar conflictos con los recursos y docentes del período de destino.
  8. Permitir ajustar la plantilla antes de confirmar.
  9. Registrar el origen de la plantilla y la operación realizada.
  10. Evitar modificar la plantilla original cuando se aplica a otro período.
- **Criterios de Aceptación:**
  - CA-F7-133: Aplicar una plantilla no modifica su versión original.
  - CA-F7-134: Las referencias inexistentes se identifican antes de confirmar.
  - CA-F7-135: Las asignaciones resultantes se validan contra la disponibilidad del período de destino.
  - CA-F7-136: El sistema no publica automáticamente un horario generado sin revisión.
  - CA-F7-137: Los cambios aplicados quedan registrados y pueden identificarse posteriormente.
- **Estado:** Pendiente

---

<!-- ID: TASK-023 | Fuentes: Pendientes.md ; pendientes/Docente/Pendientes.md -->
### [ ] [TASK-023] Implementación de funciones backend faltantes para biblioteca
- **Origen del Hallazgo:** `AUDITORIA_FASE_20_BIBLIOTECA_RECURSOS_EDUCATIVOS.md` / Sección E (Defecto 1), Sección G y Plan de Trabajo P0
- **Prioridad:** P0
- **Severidad/Clasificación:** Crítica (Funciones cableadas en enrutador doPost y ROLE_PERMISSIONS pero no declaradas, originando errores fatales de ejecución ReferenceError)
- **Archivos Involucrados:**
  - `backend/accounting-service/Code.gs` (nuevas funciones `reserveLibraryBook`, `getLibraryReservations`, `recordLibraryIncident`, `getLibraryIncidents`, `manageDigitalResource`, `getDigitalResources`)
  - `BibliotecaReservas`
  - `BibliotecaIncidencias`
  - `RecursosDigitalesBiblioteca`
- **Dependencias Expuestas:** `BibliotecaReservas`, `BibliotecaIncidencias`, `RecursosDigitalesBiblioteca`, `ROLE_PERMISSIONS`
- **Descripción del Alcance:**
  Los endpoints `reserveLibraryBook`, `getLibraryReservations`, `recordLibraryIncident`, `getLibraryIncidents`, `manageDigitalResource` y `getDigitalResources` están registrados en `ROLE_PERMISSIONS` y en el despachador `doPost` de `Code.gs`, pero no tienen ninguna implementación JavaScript en el backend. Cuando el frontend invoca cualquiera de estas acciones, el servidor arroja un error crítico de función no declarada.
  Requerimientos Funcionales Detallados:
  1. Implementación de Reservas y Listas de Espera:
     - `reserveLibraryBook`: registrar solicitudes de reserva en `BibliotecaReservas` (`ReservaID`, `EjemplarID`, `UserId`, `FechaSolicitud`, `FechaExpiracion`, `EstadoReserva`, `Observaciones`). Validar que el ejemplar se encuentre actualmente en préstamo y que el usuario no tenga ya una reserva activa para la misma obra.
     - `getLibraryReservations`: consultar y filtrar reservas por `userId`, `ejemplarId` o `estadoReserva` (`Pendiente`, `Asignada`, `Completada`, `Cancelada`, `Expirada`).
  2. Implementación de Incidencias y Daños Bibliotecarios:
     - `recordLibraryIncident`: registrar reportes de deterioro, pérdida o páginas rotas en `BibliotecaIncidencias` (`IncidenciaID`, `PrestamoID`, `EjemplarID`, `UserId`, `TipoIncidencia`, `Descripcion`, `Estado`, `Resolucion`, `Observaciones`). Si la incidencia es grave o pérdida, actualizar el estado del ejemplar a `damaged` o `lost` en `BibliotecaEjemplares`.
     - `getLibraryIncidents`: consultar y filtrar incidencias por ejemplar, usuario o estado.
  3. Implementación de Recursos Educativos Digitales:
     - `manageDigitalResource`: registrar o actualizar materiales en `RecursosDigitalesBiblioteca` (`RecursoID`, `Titulo`, `AutorColaboradores`, `Categoria`, `FormatoUrl`, `NivelPermisosJSON`, `Estado`, `Observaciones`). Validar formato y URL autorizada.
     - `getDigitalResources`: consultar recursos filtrando por categoría y nivel de permisos del usuario.
- **Criterios de Aceptación:**
  - Invocar desde el frontend o mediante API cualquiera de las 6 funciones y recibir una respuesta exitosa (`status: "success"`) con persistencia en su respectiva hoja.
  - Al reservar un libro prestado, se genera la reserva con fecha de expiración y orden de lista de espera.
  - Al reportar una incidencia de extravío, el libro deja de figurar como disponible en el catálogo.
  - La consulta de recursos digitales devuelve los materiales activos respetando los permisos del rol.
- **Estado:** Pendiente

<!-- Fuente: RECUPERACION/Pendientes_RECUPERADO.md, líneas 1627-1652; clave TASK-024; asignación única: Docente -->

---

<!-- ID: TASK-024 | Fuentes: Pendientes.md ; pendientes/Docente/Pendientes.md -->
### [ ] [TASK-024] Conexión y activación del módulo de Biblioteca en la interfaz institucional
- **Origen del Hallazgo:** `AUDITORIA_FASE_20_BIBLIOTECA_RECURSOS_EDUCATIVOS.md` / Sección E (Defecto 2), Sección G y Plan de Trabajo P0
- **Prioridad:** P0
- **Severidad/Clasificación:** Crítica (Código de frontend huérfano, falta de navegación en dashboards y operatividad de la interfaz)
- **Archivos Involucrados:**
  - `dashboard-contabilidad.html`
  - `dashboard-director.html`
  - `js/accounting.js` (`switchTab`, `renderBibliotecaModule`)
- **Dependencias Expuestas:** `js/accounting.js`, `dashboard-contabilidad.html`, `F20-Task01`
- **Descripción del Alcance:**
  La función `renderBibliotecaModule` está completamente codificada en `js/accounting.js` (con 5 subpestañas: Catálogo & Ejemplares, Préstamos, Reservas, Incidencias, Recursos Digitales), pero no existe el caso `else if (tab === 'biblioteca')` en la función `switchTab` de navegación ni existe un botón en `dashboard-contabilidad.html` para acceder a ella, dejando el módulo inaccesible para los operadores escolares.
  Requerimientos Funcionales Detallados:
  1. Habilitación de la pestaña en `dashboard-contabilidad.html`:
     - Agregar el botón de acceso visual "Biblioteca" con icono representativo (`fas fa-book-reader`) en la barra de navegación de módulos de contabilidad/administración.
  2. Enrutamiento en `switchTab`:
     - Incorporar en `window.switchTab` el bloque para ejecutar `renderBibliotecaModule(container)` cuando `tab === 'biblioteca'`.
  3. Conexión de subpestañas operativas:
     - Asegurar la interacción fluida entre las subpestañas (`libros`, `prestamos`, `reservas`, `incidencias`, `digitales`) con carga reactiva de datos del backend.
- **Criterios de Aceptación:**
  - Al hacer clic en el botón "Biblioteca" del dashboard, se despliega la interfaz del módulo sin errores de consola.
  - Se puede navegar entre las 5 subpestañas y cada una carga sus datos correspondientes desde Google Sheets.
  - Los formularios de registro y modales de préstamo operan de forma interactiva y notifican al usuario.
- **Estado:** Pendiente

<!-- Fuente: RECUPERACION/Pendientes_RECUPERADO.md, líneas 1653-1679; clave TASK-025; asignación única: Docente -->

---

<!-- ID: TASK-025 | Fuentes: Pendientes.md ; pendientes/Docente/Pendientes.md -->
### [ ] [TASK-025] Normalización relacional del catálogo: separación entre Obras y Ejemplares
- **Origen del Hallazgo:** `AUDITORIA_FASE_20_BIBLIOTECA_RECURSOS_EDUCATIVOS.md` / Sección E (Defecto 3), Sección C y Plan de Trabajo P0
- **Prioridad:** P0
- **Severidad/Clasificación:** Crítica (Normalización de datos bibliográficos, modelo FRBR/RDA y prevención de duplicidad de obras)
- **Archivos Involucrados:**
  - `backend/accounting-service/Code.gs` (`manageLibraryBook`, `getLibraryBooks`, nuevas funciones `manageBibliographicWork`, `getBibliographicWorks`)
  - Hoja `BibliotecaCatalogoObras`
  - `BibliotecaEjemplares`
  - `js/accounting.js`
- **Dependencias Expuestas:** `BibliotecaEjemplares`, `BibliotecaPrestamos`, `F20-Task01`
- **Descripción del Alcance:**
  La hoja `BibliotecaEjemplares` almacena en una sola fila el título, autor, ISBN y categoría junto con el identificador del ejemplar físico (`EjemplarID`). Si la biblioteca adquiere 10 copias de un mismo libro, se deben duplicar 10 veces todos los metadatos bibliográficos, provocando inconsistencias ante correcciones editoriales.
  Requerimientos Funcionales Detallados:
  1. Hoja maestra `BibliotecaCatalogoObras`:
     - Almacenar los metadatos bibliográficos de la obra: `ObraID`, `IsbnCodigo`, `Titulo`, `Subtitulo`, `AutoresJSON`, `Editorial`, `EdicionAno`, `Idioma`, `Categoria`, `MateriaAcademica`, `NivelEducativo`, `PortadaUrl`, `Descripcion`, `PalabrasClave`, `EstadoObra`.
  2. Reestructuración de `BibliotecaEjemplares`:
     - Almacenar las copias físicas individuales vinculadas a la obra: `EjemplarID`, `ObraID`, `CodigoBarrasQR`, `UbicacionFisica` (Edificio/Estante/Nivel), `CondicionFisica` (`Nuevo`, `Bueno`, `Deteriorado`), `EstadoDisponibilidad` (`available`, `on_loan`, `reserved`, `maintenance`, `lost`, `disposed`), `Observaciones`.
  3. Consultas consolidadas:
     - Al consultar una obra, mostrar la ficha bibliográfica única con el desglose de cuántos ejemplares existen en total, cuántos están disponibles en estantería y cuántos están prestados o en mantenimiento.
- **Criterios de Aceptación:**
  - Se puede registrar una obra bibliográfica una sola vez y asociarle múltiples ejemplares físicos independientes.
  - Modificar los datos de la obra (ej. corregir nombre de la editorial) actualiza la ficha global sin tocar los registros de préstamos de sus ejemplares.
  - Cada ejemplar físico mantiene su propio estado de disponibilidad y ubicación física aislada.
- **Estado:** Pendiente

<!-- Fuente: RECUPERACION/Pendientes_RECUPERADO.md, líneas 1680-1708; clave TASK-026; asignación única: Docente -->

---

<!-- ID: TASK-026 | Fuentes: Pendientes.md ; pendientes/Docente/Pendientes.md -->
### [ ] [TASK-026] Control de políticas de circulación, límites de préstamo y bloqueo por mora
- **Origen del Hallazgo:** `AUDITORIA_FASE_20_BIBLIOTECA_RECURSOS_EDUCATIVOS.md` / Sección E (Defecto 4), Sección C y Plan de Trabajo P0
- **Prioridad:** P0
- **Severidad/Clasificación:** Crítica (Políticas institucionales de circulación, límites por rol escolar y prevención de retención indebida de libros)
- **Archivos Involucrados:**
  - `backend/accounting-service/Code.gs` (`processLibraryLoan`, `getLibraryLoans`)
  - `BibliotecaPrestamos`
  - Hoja `BibliotecaPoliticasCirculacion`
- **Dependencias Expuestas:** `BibliotecaPrestamos`, `BibliotecaEjemplares`, `ROLE_PERMISSIONS`
- **Descripción del Alcance:**
  `processLibraryLoan` aplica una fecha fija de devolución a 7 días sin importar el perfil del usuario, y no valida cuántos libros tiene prestados actualmente, permitiendo que un alumno retire cantidades excesivas de material sin devolver los anteriores.
  Requerimientos Funcionales Detallados:
  1. Políticas de circulación configurables por rol:
     - Estudiante: máximo 2 libros simultáneos, período de préstamo de 7 días calendario.
     - Docente / Profesor: máximo 5 libros simultáneos, período de préstamo de 15 días calendario.
     - Personal Administrativo / Dirección: máximo 3 libros simultáneos, período de 15 días.
     - Obras de Referencia / Consulta en Sala (Diccionarios, enciclopedias): no prestables a domicilio (préstamo interno de 1 día).
  2. Validación y bloqueo preventivo:
     - Antes de conceder un nuevo préstamo, verificar cuántos préstamos activos (`on_loan`) mantiene el `userId`.
     - Si ha alcanzado el límite configurado para su rol, rechazar el préstamo informando el tope máximo permitido.
     - Si el usuario mantiene algún préstamo con fecha de devolución vencida no devuelto (`mora activa`), bloquear la emisión de nuevos préstamos hasta que regularice su situación.
- **Criterios de Aceptación:**
  - Un estudiante con 2 libros en préstamo intenta solicitar un 3º y el sistema rechaza la operación por límite de cupo alcanzado.
  - Un usuario con un libro vencido no puede recibir nuevos préstamos hasta devolver el material atrasado.
  - Un docente puede recibir hasta 5 libros con fecha de retorno configurada a 15 días.
- **Estado:** Pendiente

<!-- Fuente: RECUPERACION/Pendientes_RECUPERADO.md, líneas 1709-1733; clave TASK-027; asignación única: Docente -->

---

<!-- ID: TASK-027 | Fuentes: Pendientes.md ; pendientes/Docente/Pendientes.md -->
### [ ] [TASK-027] Control de concurrencia e idempotencia en circulación bibliotecaria
- **Origen del Hallazgo:** `AUDITORIA_FASE_20_BIBLIOTECA_RECURSOS_EDUCATIVOS.md` / Sección E, Sección F (PT-20-24, PT-20-25) y Plan de Trabajo P0
- **Prioridad:** P0
- **Severidad/Clasificación:** Crítica (Integridad transaccional, prevención de doble asignación de ejemplares y protección de reintentos)
- **Archivos Involucrados:**
  - `backend/accounting-service/Code.gs` (`processLibraryLoan`, `reserveLibraryBook`)
  - `BibliotecaPrestamos`
  - `BibliotecaEjemplares`
- **Dependencias Expuestas:** `LockService`, `BibliotecaPrestamos`, `BibliotecaEjemplares`
- **Descripción del Alcance:**
  Las operaciones de préstamo y reserva no utilizan candados de concurrencia. Si dos bibliotecarios intentan prestar el mismo ejemplar simultáneamente, o si un usuario reintenta la solicitud por lentitud de red, se pueden generar préstamos dobles sobre el mismo libro físico.
  Requerimientos Funcionales Detallados:
  1. Bloqueo transaccional atómico:
     - Adquirir candado de script (`LockService.getScriptLock()`) al inicio de `processLibraryLoan` y `reserveLibraryBook`.
     - Re-leer el estado más reciente del ejemplar en `BibliotecaEjemplares` para asegurar que continúa en estado `available`.
     - Si ya fue prestado por otra transacción milisegundos antes, liberar el candado y responder con error controlado.
  2. Claves de idempotencia:
     - Evitar que una doble pulsación de botón registre dos préstamos idénticos mediante clave única de operación (`ejemplarId + userId + fechaActual`).
- **Criterios de Aceptación:**
  - Dos solicitudes simultáneas sobre el mismo ejemplar resultan en un préstamo exitoso y un rechazo controlado.
  - Los reintentos de red no duplican las filas de préstamo en `BibliotecaPrestamos`.
- **Estado:** Pendiente

<!-- Fuente: RECUPERACION/Pendientes_RECUPERADO.md, líneas 3568-3600; clave TASK-071; asignación única: Docente -->

---

<!-- ID: TASK-071 | Fuentes: Pendientes.md ; pendientes/Docente/Pendientes.md -->
### [ ] [TASK-071] [P0] Protección de Historiales Académicos y Conservación de Calificaciones Históricas
- **Orden de Ejecución:** 5
- **Prioridad:** P0 (Crítica)
- **Componentes Afectados:**
  - `backend/academic-service/Code.gs` (`calculateUnifiedAcademicGrade`, `generateStudentReportCard`, `importHistoricGradesBatch`)
  - Hojas: `CalificacionesEstudiantes`, `RecuperacionesEstudiante`, `HistorialAcademicoMigrado`
- **Subcapacidades Relacionadas:** F29-04, F29-06, F29-12.
- **Estado de Partida:** Requiere mejoras.
- **Dependencias Principales:** [F29-Task01], [F29-Task02], [F29-Task03].
- **Problema Detectado y Riesgos:**
  Las calificaciones históricas pueden importarse desde estructuras diferentes a las utilizadas actualmente (semestres, trimestres, notas finales anuales sin desglose). Si posteriormente se ejecutan los motores vigentes de cálculo académico, las notas podrían recalcularse con ponderaciones o reglas de 2024 que no corresponden al ciclo en que fueron generadas, alterando promedios y estados de aprobación pasados.
- **Requisitos Funcionales y Técnicos Convergentes:**
  1. *Marcado de procedencia histórica e inalterabilidad:*
     - Incorporar bandera obligatoria `esRegistroHistoricoMigrado: true`, `esquemaEvaluativoOrigen: string`, `formulaEquivalencia: string`.
  2. *Protección en motores de cálculo:*
     - Modificar `calculateUnifiedAcademicGrade` y `generateStudentReportCard` para que los registros con `esRegistroHistoricoMigrado === true` no sufran recálculo automático ni re-ponderación.
     - Conservar y desplegar la nota final original, promedios y estados de aprobación históricos (`Aprobado`, `Reprobado`, `Recuperación`).
  3. *Advisión de estructuras de evaluación heterogéneas:*
     - Permitir importar notas organizadas por semestres, trimestres, unidades o consolidadas anuales en `HistorialAcademicoMigrado`.
     - Conservar calificaciones finales cuando no exista desglose de parciales.
     - Prohibición de conversión automática de escalas sin regla explícita aprobada.
  4. *Protocolo de rectificaciones excepcionales:*
     - Exigir procedimiento autorizado para rectificaciones de notas históricas, registrando valor previo, nuevo valor, usuario autorizador y justificante formal.
- **Criterios de Aceptación:**
  - [ ] Una nota histórica migrada no cambia al modificar las ponderaciones del ciclo actual.
  - [ ] Se importan historiales semestrales y estructuras diferentes a las 4 parciales vigentes.
  - [ ] Los boletines reproducen exactamente los resultados y promedios históricos originales.
  - [ ] Las escalas diferentes se conservan o convierten únicamente mediante reglas explícitas aprobadas.
  - [ ] Las rectificaciones históricas quedan registradas y auditables.
- **Estado:** [ ] Pendiente

<!-- Fuente: RECUPERACION/Pendientes_RECUPERADO.md, líneas 4717-4778; clave TASK-105; asignación única: Docente -->

---

<!-- ID: TASK-105 | Fuentes: Pendientes.md ; pendientes/Docente/Pendientes.md -->
### [ ] [TASK-105] [P0] Unificación del ciclo de vida de las justificaciones de asistencia y sincronización con los registros académicos
- **Prioridad:** P0 (Crítica)
- **Orden de Ejecución:** 1 (Dependencia base para sincronización académica)
- **Componentes Afectados:**
  - `backend/user-service/Code.gs` (`submitStudentAbsenceJustification`, `reviewAbsenceJustification`, `updateRequestStatus`)
  - `backend/academic-service/Code.gs` (`submitAttendanceJustification`, `reviewAttendanceJustification`, `RegistrosAsistencia`, `SesionesAsistencia`, `JustificacionesAsistencia`)
  - Hojas de Cálculo: `SolicitudesTramites`, `JustificacionesAsistencia`, `RegistrosAsistencia`, `SesionesAsistencia`
- **Subcapacidades Relacionadas:** F34-01, F34-07, F34-12.
- **Origen del Hallazgo:** `AUDITORIA_FASE_34_BANDEJAS_REVISION_FIRMAS.md` / Sección C (F34-12), Matriz CAR-F34-03 y Especificación Técnica ChatGPT/Jules.
- **Problema Detectado y Riesgos:**
  Existen dos implementaciones independientes para presentar y revisar excusas estudiantiles:
  1. El servicio de usuarios registra solicitudes en `SolicitudesTramites`.
  2. El servicio académico registra justificaciones en `JustificacionesAsistencia` y es el único que actualiza `RegistrosAsistencia` (`Justificada = true`).
  Como consecuencia directa, una excusa aprobada desde el flujo administrativo en Secretaría puede no reflejarse en la asistencia académica, produciendo inconsistencias críticas entre la resolución administrativa y los registros que consultan los docentes, derivando en inasistencias injustificadas erróneas y sanciones académicas indebidas para el estudiante.
- **Requerimientos Funcionales y Técnicos Convergentes:**
  1. *Ciclo de vida unificado e inequívoco:*
     - Establecer un único ciclo de vida institucional para las justificaciones de asistencia, independientemente de la interfaz o departamento desde el que se presenten.
     - Mantener una relación relacional inequívoca entre:
       * Solicitud original (`solicitudId` / `justificacionId`).
       * Estudiante (`estudianteId` / `userId`).
       * Representante legal o tutor que la presentó.
       * Fechas y sesiones de asistencia afectadas (`fechaAusencia`, `periodo`).
       * Evidencias adjuntas (`adjuntoUrl`, hash criptográfico).
       * Revisiones y decisiones (`revisadoPor`, `observacionesAdmin`).
       * Resolución final (`EstadoRevision`).
       * Registros académicos actualizados (`RegistrosAsistencia`).
  2. *Sincronización académica atómica sin re-captura manual:*
     - La aprobación administrativa en `reviewAbsenceJustification` (o mediante `processWorkflowDecision`) debe producir automáticamente la actualización académica correspondiente en `RegistrosAsistencia` sin requerir que Secretaría vuelva a registrar manualmente la justificación en otro módulo.
     - La actualización debe afectar exclusivamente las fechas y sesiones comprendidas en la justificación aprobada.
     - En solicitudes que cubran varios días o períodos extendidos, identificar con precisión las sesiones de clase afectadas (`SesionesAsistencia`) y aplicar la justificación únicamente a las que correspondan.
  3. *Segregación estricta de estados y justificaciones parciales:*
     - Una solicitud en estado pendiente, observada o rechazada bajo ninguna circunstancia debe modificar los registros de asistencia como si estuviera aprobada.
     - Conservar en el modelo la distinción entre:
       * Justificación recibida.
       * Justificación en revisión.
       * Justificación aprobada.
       * Inasistencia justificada.
       * Inasistencia todavía pendiente de justificar.
     - Permitir resoluciones administrativas con *justificación parcial*, cuando solo algunas fechas o sesiones del rango solicitado hayan sido aceptadas y validadas por Secretaría.
  4. *Idempotencia, prevención de duplicados y reversibilidad:*
     - Evitar que una misma aprobación repetida actualice dos veces los mismos registros de asistencia.
     - Asegurar que la anulación, revocación o rechazo posterior de una justificación revierta coherentemente el estado de la asistencia a su condición original previa (`Inasistencia Injustificada`) sin borrar la evidencia histórica.
     - Registrar los resultados de la sincronización y registrar en log estructurado los fallos que impidan actualizar la asistencia.
     - Permitir reintentar una sincronización fallida sin duplicar registros ni alterar decisiones anteriores.
  5. *Parametrización configurable en plataforma:*
     - En caso de discrepancias entre políticas institucionales, incorporar en `ConfiguracionInstitucional`:
       * `JUSTIFICACION_IMPACTO_AUTOMATICO_ASISTENCIA`: Valores `INMEDIATO_AL_APROBAR_SECRETARIA` (por defecto) vs. `REQUIERE_CONFORMIDAD_PREVIA_DOCENTE`.
       * `PERMITIR_JUSTIFICACION_PARCIAL_DIAS`: Valores `HABILITADO` (permite aprobar días seleccionados del rango) vs. `TODO_O_NADA` (exige aprobar o rechazar el bloque completo).
- **Criterios de Aceptación:**
  - [ ] Presentar una excusa desde el portal del representante y comprobar que se conserva su identificador único durante todo el proceso.
  - [ ] Aprobarla desde el flujo administrativo y verificar que las sesiones afectadas se actualizan en `RegistrosAsistencia` (`Justificada = true` y `EstadoAsistencia = "Justificada"`).
  - [ ] Comprobar que una excusa rechazada, observada o pendiente no modifica la asistencia en ningún aula.
  - [ ] Aprobar una excusa que cubra varias fechas y verificar que solo se actualizan las sesiones comprendidas en el período autorizado.
  - [ ] Ejecutar dos veces la misma operación de aprobación y comprobar que no se duplican cambios ni registros.
  - [ ] Simular un fallo durante la sincronización y comprobar que el sistema conserva la resolución y permite completar la actualización sin duplicarla.
  - [ ] Verificar que la asistencia y el expediente muestran exactamente la misma resolución.
  - [ ] Comprobar que las modificaciones quedan registradas con fecha, responsable y solicitud de origen.
- **Dependencias:** F34-Task03 (acceso contextual docente a justificaciones resultantes), F34-Task04 (integridad criptográfica de evidencias adjuntas).
- **Estado:** [ ] Pendiente

<!-- Fuente: RECUPERACION/Pendientes_RECUPERADO.md, líneas 4832-4881; clave TASK-107; asignación única: Docente -->

---

<!-- ID: TASK-107 | Fuentes: Pendientes.md ; pendientes/Docente/Pendientes.md -->
### [ ] [TASK-107] [P0] Consulta contextual de justificaciones de asistencia para docentes mediante permisos ABAC
- **Prioridad:** P0 (Crítica)
- **Orden de Ejecución:** 3 (Control de acceso basado en atributos y privacidad docente)
- **Componentes Afectados:**
  - `backend/academic-service/Code.gs` (`getTeacherStudentJustifications`)
  - `backend/user-service/Code.gs`
  - `js/teacher.js`
  - `teacher-dashboard.html`
- **Subcapacidades Relacionadas:** F34-01, F34-04, F34-11.
- **Origen del Hallazgo:** `AUDITORIA_FASE_34_BANDEJAS_REVISION_FIRMAS.md` / Sección C (F34-11), Matriz CAR-F34-04 y Especificación Técnica ChatGPT/Jules.
- **Problema Detectado y Riesgos:**
  Los docentes no disponen de una consulta específica que les permita visualizar las justificaciones de inasistencia de los estudiantes matriculados en sus asignaturas. La protección contextual para padres ya está implementada, pero falta extender el acceso a los docentes según sus asignaciones académicas efectivas. Si se les concediera acceso global verían expedientes de otros grupos y notas privadas, y si no se les concede quedan desinformados del motivo de la inasistencia.
- **Requerimientos Funcionales y Técnicos Convergentes:**
  1. *Control de acceso basado en atributos (ABAC):*
     - Incorporar la consulta `getTeacherStudentJustifications(payload)` validando en backend la relación entre:
       * Docente autenticado (`_verifiedUserId`).
       * Asignaturas que imparte (`AsignacionesDocentes`).
       * Secciones o grupos asignados activamente.
       * Estudiantes matriculados en sus listas (`MatriculasEstudiantes`).
       * Fechas y sesiones de clase afectadas (`SesionesAsistencia`).
     - La consulta debe limitarse estrictamente a los estudiantes asignados en el período lectivo correspondiente.
     - Cuando una justificación afecte varias asignaturas impartidas por distintos docentes, cada docente debe consultar únicamente las sesiones que le corresponden en su horario.
  2. *Segregación de confidencialidad y datos sensibles:*
     - Mostrar únicamente la información indispensable para la función docente:
       * Nombre del estudiante y grado/sección.
       * Fecha o período justificado.
       * Estado de la solicitud (`Aprobada`, `Pendiente`, `Rechazada`).
       * Resultado de la revisión administrativa.
       * Observaciones públicas de Secretaría.
       * Evidencias autorizadas para conocimiento docente.
     - Ocultar estrictamente notas administrativas internas, detalles clínicos reservados, información médica innecesaria o disputas de custodia legal familiar.
  3. *Constancia de conocimiento docente:*
     - Permitir que el docente registre una constancia digital de conocimiento o conformidad sobre la inasistencia justificada sin alterar la resolución emitida por Secretaría.
     - Mantener el acceso contextual histórico cuando el docente cambie de sección o finalice el período académico según las directrices institucionales.
  4. *Parametrización configurable en plataforma:*
     - Parámetro en `ConfiguracionInstitucional`: `DOCENTE_VISIBILIDAD_EVIDENCIAS_MEDICAS` (Valores: `SOLO_DICTAMEN_SECRETARIA` [recomendado por privacidad] vs. `PERMITIR_VER_CONSTANCIA_MEDICA_COMPLETA`).
- **Criterios de Aceptación:**
  - [ ] Un docente consulta exclusivamente las justificaciones de estudiantes matriculados en sus secciones y asignaturas activas.
  - [ ] Un docente no puede consultar justificaciones de alumnos que no pertenecen a su asignación académica (rechazo con error 403).
  - [ ] Si una excusa cubre varias asignaturas, cada docente visualiza únicamente las sesiones correspondientes a su carga horaria.
  - [ ] Alterar manualmente identificadores en la solicitud no permite eludir los filtros ABAC ni acceder a expedientes ajenos.
  - [ ] La consulta docente no expone observaciones administrativas privadas ni información sensible no pertinente.
  - [ ] El docente puede registrar constancia de conocimiento sin modificar la decisión tomada por Secretaría.
  - [ ] Todos los intentos de acceso no autorizado son auditados en `RegistroEventos`.
  - [ ] La consulta se integra en la interfaz docente sin interferir con la bandeja de tareas y entregas de aula virtual.
- **Dependencias:** F34-Task01 (unificación de justificaciones), sistema de asignaciones docentes y matrícula.
- **Estado:** [ ] Pendiente

<!-- Fuente: RECUPERACION/Pendientes_RECUPERADO.md, líneas 5756-5787; clave TASK-131; asignación única: Docente -->

---

<!-- ID: TASK-131 | Fuentes: Pendientes.md ; pendientes/Docente/Pendientes.md -->
### [ ] [TASK-131] [P0] Persistencia server-side de preferencias y progreso de aprendizaje por usuario
- **Prioridad:** P0 (Bloqueante / Esencial)
- **Orden de Ejecución:** 4 (Sincronización multi-dispositivo y aislamiento de usuario)
- **Componentes Afectados:**
  - `backend/user-service/Code.gs` (`getUserHelpPreferences`, `saveUserHelpPreference`, `resetUserHelpPreferences`)
  - `js/ui-common.js`
  - Hoja de Cálculo: `PreferenciasUsuario`, `PreferenciasAyudaUsuario`
- **Subcapacidades Relacionadas:** F38-08, F38-09, F38-10.
- **Origen del Hallazgo:** `AUDITORIA_FASE_38_AYUDA_CONTEXTUAL_METADATOS_APRENDIZAJE.md` / Sección C (F38-09), Matriz CAR-F38-09 y Especificación Técnica ChatGPT/Jules.
- **Problema Detectado y Riesgos:**
  El progreso de las guías se guarda exclusivamente mediante `localStorage` (`guide_progress_` + tourKey). Si el usuario cambia de computadora, ingresa desde un teléfono o limpia la caché, los tours se reinician indiscriminadamente, mientras que dos cuentas que compartan un mismo navegador heredan o sobreescriben indebidamente sus estados de aprendizaje.
- **Requerimientos Funcionales y Técnicos Convergentes:**
  1. *Persistencia server-side asociada a la cuenta:*
     - Incorporar persistencia de preferencias en el backend del servicio de usuarios, utilizando la hoja `PreferenciasUsuario` (o `PreferenciasAyudaUsuario`).
     - Almacenar por registro: `UserId`, `ModuloOFuncionId`, `TourOConsejoId`, `EstadoVisualizacion`, `PasoAlcanzado`, `VersionContenidoConsultada`, `FechaUltimaActualizacion`, `FechaSincronizacion`.
     - Distinguir los estados: `Pendiente`, `Presentado`, `EnCurso`, `Finalizado`, `Descartado`, `Restablecido`.
     - Vincular estrictamente cada registro al `_verifiedUserId` autenticado en la sesión activa.
  2. *Sincronización resiliente con soporte offline y migración:*
     - Al iniciar sesión, recuperar las preferencias del servidor y mantener caché local para una respuesta ágil.
     - Al descartar o completar una guía, actualizar el servidor de forma asíncrona e idempotente; si la red falla, encolar el cambio para la siguiente reconexión sin bloquear al usuario.
     - Migración segura: recuperar los estados de `localStorage` cuando el usuario autenticado pueda asociarse inequívocamente con ellos, evitando mezclar cuentas en equipos compartidos.
- **Criterios de Aceptación:**
  - [ ] Descartar un consejo o tour en un dispositivo se refleja de inmediato en otro dispositivo al iniciar sesión con la misma cuenta.
  - [ ] Limpiar los datos locales o caché del navegador no reinicia los tours ya completados en el servidor.
  - [ ] Dos cuentas distintas que inicien sesión en el mismo equipo mantienen estados de ayuda totalmente independientes.
  - [ ] Un usuario no puede consultar ni modificar preferencias de ayuda de otra cuenta.
  - [ ] Una interrupción de conexión conserva los cambios pendientes de forma recuperable.
- **Dependencias:** Sistema de autenticación en `user-service`.
- **Estado:** [ ] Pendiente

<!-- Fuente: RECUPERACION/Pendientes_RECUPERADO.md, líneas 7920-7948; clave TASK-191; asignación única: Docente -->

---

<!-- ID: TASK-496 | Fuentes: Pendientes.md -->
### [ ] [TASK-496] [P0] Restringir perfiles, tutores y trámites al ámbito docente autenticado
- **Prioridad:** P0 (Crítica).
- **Componentes Afectados:** backend/user-service/Code.gs; hojas AsignacionesDocentes y RelacionesFamiliares.
- **Origen del Hallazgo:** AUD-NG-217 / TAREA-F4-P0-02.
- **Dependencias Principales:** validateContextualAccess, ROLE_PERMISSIONS, getUserInfo, getGuardianStudents, getAdministrativeRequests, submitAdministrativeRequest, asignaciones activas de profesor.
- **Problema Detectado:** Los handlers autorizados para Profesor confían en identificadores de usuario/tutor/estudiante enviados por el cliente y no limitan la consulta/escritura a estudiantes asignados al docente.
- **Requisitos de Corrección:** Derivar el profesor desde claims verificados; recuperar asignaciones activas y matrículas vigentes; restringir perfiles, vínculos de tutores y trámites al ámbito docente; derivar el solicitante de trámites desde el token; rechazar IDs ajenos y registrar intentos.
- **Criterios de Aceptación:** No se puede consultar el perfil ni tutor de un estudiante fuera del ámbito asignado; no se pueden leer ni crear trámites en nombre de otro usuario; pruebas negativas de IDOR con IDs válidos de otro estudiante, otro tutor y otro profesor; roles administrativos mantienen solo los permisos explícitos que correspondan.
- **Estado:** [ ] Pendiente

---

<!-- ID: TASK-521 | Fuentes: AUDITORIAS/AUDITORIA_COMPLETADAS_TAREA-F7-IMP-02.md -->
### [ ] [TASK-521] Normalizar el DTO de horarios y su mapeo de columnas
- **Hallazgo de origen:** AUD-NG-237 / H3; amplía AUD-NG-168.
- **Severidad:** Crítico.
- **Objetivo:** representar fielmente estado, grado, sección, asignatura, docente, aula y fechas.
- **Acción ejecutable:** definir esquema canónico HorariosClase y mapear columnas por encabezado/índice centralizado; obtener asignatura/grupo desde OfertaAcademica; filtrar Cancelado/Inactivo con estado real; no inferir grado/sección desde Estado/timestamp.
- **Archivos/módulos afectados:** backend/academic-service/Code.gs; js/teacher.js.
- **Dependencias y riesgos:** OfertaAcademica, AsignacionesDocentes, HorariosClase, CalendarioAcademico y reportes existentes.
- **Alcance:** consultas y DTO de la matriz; preservar compatibilidad de consumidores existentes mediante migración controlada.
- **Criterios de aceptación:** DTO devuelve valores reales; cancelados no se presentan vigentes; asignatura y sección corresponden a la oferta; filtros devuelven fixtures exactos.
- **Prioridad:** P0.
- **Estado:** Pendiente.
- **Evidencia de cierre:** pendiente de implementación, pruebas y revisión.

---

<!-- ID: TASK-532 | Fuentes: AUDITORIAS/AUDITORIA_COMPLETADAS_TAREA-F7-IMP-04.md -->
### [ ] [TASK-532] Aislar escenarios de planificación del horario oficial
- **Hallazgo de origen:** AUD-NG-239 / H1-H2.
- **Severidad:** Crítico.
- **Objetivo:** almacenar propuestas completas en un espacio independiente hasta que se publiquen.
- **Acción ejecutable:** crear esquema de escenario con escenarioId, año/período, creador, estado, parámetros, asignaciones, restricciones y logs; asociar cada bloque al escenario; no insertar filas en HorariosClase durante generación; permitir recuperar/retomar/descartar.
- **Archivos/módulos afectados:** backend/academic-service/Code.gs; almacenamiento académico; js/teacher.js.
- **Dependencias y riesgos:** HorariosClase, EscenariosHorarios, VersionesHorarios, permisos y migración de borradores existentes.
- **Alcance:** ciclo de vida de escenarios; no cambiar el motor de optimización.
- **Criterios de aceptación:** generar/editar/descartar no cambia HorariosClase; escenario recuperado reproduce parámetros y asignaciones; cada fila de propuesta tiene vínculo único a escenarioId.
- **Prioridad:** P0.
- **Estado:** Pendiente.
- **Evidencia de cierre:** pendiente de implementación, pruebas y revisión.

---

<!-- ID: TASK-556 | Fuentes: AUDITORIAS/AUDITORIA_COMPLETADAS_TAREA-F7-IMP-07.md -->
### [ ] [TASK-556] Implementar simulación y confirmación segura de reprogramaciones sin perder historial
- **Hallazgo de origen:** AUD-NG-242 / H1-H6; amplía AUD-NG-238.
- **Severidad:** Crítica.
- **Objetivo:** aplicar únicamente propuestas que hayan sido simuladas y revalidadas, manteniendo la identidad e historial de la evaluación.
- **Acción ejecutable:** crear operación de confirmación que reciba propuesta/versionado, revalide conflictos al confirmar, actualice la misma evaluación por ExamenID, use idempotencia/lock y registre actor, motivo, antes/después; propagar fecha efectiva a calendarios y vistas; impedir eliminación física si existen calificaciones/recuperaciones/referencias históricas.
- **Archivos/módulos afectados:** backend/exam-service/Code.gs; backend/academic-service/Code.gs; hojas Examenes, EntregasExamen, CalificacionesEstudiantes, RecuperacionesEstudiante y CalendarioAcademico.
- **Dependencias y riesgos:** TASK-552..TASK-555; concurrencia, duplicados, datos históricos y operación de calendario.
- **Alcance:** la simulación permanece sin efectos laterales; la confirmación es una operación separada, atómica o compensable, y nunca crea un segundo examen para reprogramar el existente.
- **Criterios de aceptación:** simulación no escribe; confirmación revalida; ExamenID permanece estable; no se duplican evaluaciones; calificaciones/entregas/recuperaciones siguen vinculadas; calendario/vistas reflejan fecha efectiva; fallos parciales no dejan referencias huérfanas.
- **Prioridad:** P0.
- **Estado:** Pendiente.
- **Evidencia de cierre:** pendiente.

---

<!-- ID: TASK-557 | Fuentes: AUDITORIAS/AUDITORIA_COMPLETADAS_TAREA-F7-IMP-07.md -->
### [ ] [TASK-557] Conectar la interfaz docente de programación y simulación de evaluaciones
- **Hallazgo de origen:** AUD-NG-242 / H5-H6; amplía AUD-NG-237.
- **Severidad:** Crítica.
- **Objetivo:** hacer accesible el flujo de programación, validación, simulación y confirmación desde el dashboard.
- **Acción ejecutable:** incorporar botón, modal y formulario reales; agregar campos de fecha/hora efectiva, tipo, período, grupo, docente, aula y recursos; conectar la validación antes de guardar/editar; mostrar conflictos y estudiantes afectados; habilitar confirmar solo después de simulación vigente y autorizada.
- **Archivos/módulos afectados:** teacher-dashboard.html; js/teacher.js; js/api.js; backend/exam-service/Code.gs.
- **Dependencias y riesgos:** TASK-552..TASK-556; navegación y permisos docentes; evitar HTML dinámico inseguro.
- **Alcance:** no alterar flujos de tareas no evaluativas ni crear controles sin invocador real.
- **Criterios de aceptación:** los nodos HTML existen; el botón abre el modal; crear/editar/reprogramar ejecuta el mismo motor; la propuesta y sus causas se ven antes de confirmar; la UI muestra errores reales y no declara éxito anticipado.
- **Prioridad:** P0.
- **Estado:** Pendiente.
- **Evidencia de cierre:** pendiente.

---

<!-- ID: AUD-NG-165 | Fuentes: Pendientes.md -->
### [ ] [AUD-NG-165] Proteger la privacidad y el acceso contextual a comentarios y versiones de entregas
- **Origen:** Auditoría de completadas.md / TAREA-10.
- **Severidad:** Alto (P1; privacidad de entregas y retroalimentación).
- **Archivos:** backend/task-service/Code.gs; js/student.js; js/teacher.js; student-dashboard.html; teacher-dashboard.html.
- **Dependencias:** ROLE_PERMISSIONS, validateContextualAccess, getSubmissionComments, addSubmissionComment, getSubmissionVersions, returnSubmissionForRevision, deleteSubmission, EntregasVersiones, ComentariosEntregas, _verifiedUserId.
- **Problema:** getSubmissionComments devuelve también registros esPrivado=true a cualquier rol que tenga permiso de consulta (incluidos estudiante, padre, tutor y responsable) y no valida propiedad/relación con el expediente. getSubmissionVersions permite consultar por entregaId sin comprobar que la entrega pertenezca al usuario o al ámbito docente. addSubmissionComment confía en autorId, rolAutor y esPrivado recibidos del cliente. returnSubmissionForRevision usa profesorId del payload para identificar al autor. deleteSubmission elimina la fila principal y el archivo, pero no elimina ni marca de forma coherente las versiones/comentarios relacionados.
- **Criterios de aceptación:** comentarios privados solo visibles para docentes asignados y roles expresamente autorizados; estudiantes y responsables solo reciben comentarios públicos de entregas propias/vinculadas; versiones filtradas por propietario o asignación docente aun cuando se consulte por entregaId; autor y rol derivados del token verificado; el cliente no puede elevar esPrivado ni suplantar docentes; devoluciones verifican propiedad de la tarea; borrado lógico conserva trazabilidad y referencias; pruebas negativas con dos estudiantes, dos docentes y responsables no vinculados.
- **Tareas relacionadas (no duplicadas):** AUD-NG-002 (consultas públicas), AUD-NG-124 (propiedad/calificaciones), AUD-NG-158 (ABAC de escrituras docentes).
- **Estado:** [ ] Pendiente

Hallazgo nuevo: AUD-NG-165. Los demás vacíos de TAREA-10 amplían tareas existentes.

---

<!-- ID: AUD-NG-166 | Fuentes: Pendientes.md -->
### [ ] [AUD-NG-166] Completar el modelo verificable de reactivos y la integridad del motor de exámenes
- **Origen:** Auditoría de completadas.md / TAREA-11.
- **Severidad:** Alto (P1).
- **Archivos:** backend/exam-service/Code.gs; js/exam.js; js/quizpro.js; exam.html; results.html.
- **Problema:** el banco carece de validación de esquema/referencias; createExam no persiste todos los campos declarados de Examenes/PreguntasExamen; no conserva vínculo/versionado de reactivos reutilizados; faltan modalidades exigidas; no existe snapshot inmutable para exámenes ya realizados; la analítica psicométrica requerida no está implementada de forma verificable.
- **Criterios:** validar tipos, opciones, respuestas, puntos y referencias curriculares en servidor; persistir área/tema/dificultad/etiquetas/objetivos/criterios; relación estable/versionada con BancoPreguntas; soportar las nueve modalidades (incluidos adjuntos); conservar snapshot de reactivos aplicados; ofrecer analítica psicométrica reproducible por pregunta/tema/asignatura/grupo.
- **Tareas relacionadas (no duplicadas):** AUD-NG-121 (fechas/duración/intentos), AUD-NG-124 (rúbricas/revisión parcial), AUD-NG-006 (idempotencia), AUD-NG-011 (área/routing), AUD-NG-002 (propiedad/consultas), AUD-NG-158 (ámbito docente).
- **Estado:** [ ] Pendiente

Hallazgo nuevo: AUD-NG-166. Progreso de auditoría: 17/183; 166 pendientes. Siguiente tarea: TAREA-12.

---

<!-- ID: AUD-NG-167 | Fuentes: Pendientes.md -->
### [ ] [AUD-NG-167] Unificar la integridad del libro de calificaciones y el ciclo institucional de evaluación
- **Origen:** Auditoría de completadas.md / TAREA-12.
- **Severidad:** Alto (P1).
- **Archivos:** backend/academic-service/Code.gs; backend/exam-service/Code.gs; js/teacher.js; js/student.js; teacher-dashboard.html.
- **Problema:** calificaciones identificadas solo por evaluacionId+userId; consultas sin filtro completo por periodo/asignatura; ponderaciones duplicadas/hardcodeadas; cálculo unificado con validaciones insuficientes; rúbricas/competencias sin esquema ni integración UI; cierre/publicación y rectificación sin transición/autoridad contextual verificable; recuperación CAT-GLOBAL; boletines desconectados de la fuente consolidada y equivalencia SACE no acreditada.
- **Criterios:** clave contextual estable; validar configuración de ponderaciones y notas; cálculo server-side único con pendientes distintos de cero; rúbricas analíticas y competencias vinculadas a catálogos; revisión/publicación/cierre/rectificación con permisos y transiciones verificadas; recuperación asociada a calificación real; boletines oficiales desde notas consolidadas y compatibilidad SACE demostrable.
- **Tareas relacionadas (no duplicadas):** AUD-NG-002 (propiedad y consulta), AUD-NG-158 (ABAC docente), AUD-NG-124 (historial de calificaciones de entregas, no del libro consolidado).
- **Estado:** [ ] Pendiente

Hallazgo nuevo: AUD-NG-167. Progreso de auditoría: 18/183; 165 pendientes. Siguiente tarea: TAREA-13.

---

<!-- ID: AUD-NG-168 | Fuentes: Pendientes.md -->
### [ ] [AUD-NG-168] Unificar el modelo de asignaciones docentes, carga horaria y planificación de horarios
- **Origen:** Auditoría de completadas.md / TAREA-13.
- **Severidad:** Alto (P1).
- **Archivos:** backend/academic-service/Code.gs; js/teacher.js; teacher-dashboard.html.
- **Problema:** las funciones de ofertas usan OfertaAcademica mientras la planificación departamental usa OfertasAcademicas; HorariosClase se escribe con una estructura que getClassSchedules interpreta con índices distintos; sustituciones consultan columnas equivocadas y usan estados Activa/Activo inconsistentes; carga, conflictos y ocupación ignoran año/periodo o incluyen estados no vigentes; asignación por área no está integrada en la interfaz; el mapa departamental representa un único docente por oferta.
- **Criterios:** fuente canónica de ofertas; relación docente-área-asignatura-oferta-grupo-año/periodo; asignaciones compartidas y sustituciones con vigencia; esquema único de horarios; filtros por año/periodo y estado; detección de conflictos verificable; carga calculada solo con bloques vigentes; reportes departamentales/vacantes basados en relaciones canónicas.
- **Tareas relacionadas (no duplicadas):** AUD-NG-164 (catálogo curricular y ofertas), AUD-NG-158 (ABAC docente y actor verificado).
- **Estado:** [ ] Pendiente

Hallazgo nuevo: AUD-NG-168. Progreso de auditoría: 19/183; 164 pendientes. Siguiente tarea: TAREA-14.

---

<!-- ID: AUD-NG-172 | Fuentes: Pendientes.md -->
### [ ] [AUD-NG-172] Implementar migración curricular transaccional con prevalidación y rollback verificable
- Severidad: Alto (P1).
- Origen: Auditoría TAREA-19 de completadas.md; backend/academic-service/Code.gs, js/teacher.js y teacher-dashboard.html.
- Problema: getCurricularEquivalences ignora PlanesEstudio/PlanAsignaturas y asigna cada asignatura a sí misma como MapeadoExacto, sin comparar plan origen/destino ni revisión. executeCurricularMigration no utiliza equivalenciasMap, no modifica registros, no detecta duplicados/huérfanos, no compara antes/después y aun así devuelve success en modo REAL. No existe rollback curricular ni snapshot de las tablas/boletines afectados. El controlador UI no tiene modal en teacher-dashboard.html.
- Alcance: consultar planes y relaciones reales; generar mapeos exactos/probables/ambiguos/no encontrados con revisión manual; prevalidar IDs/códigos, relaciones huérfanas, duplicados, matrículas, calificaciones y boletines; producir informe y snapshot verificable antes de cualquier escritura; ejecutar cambios aprobados de forma idempotente y con registro de migración; comparar antes/después; revertir al estado exacto con conservación de operaciones posteriores; UI de administración con confirmación y permisos server-side.
- Criterios: ninguna equivalencia ambigua se aplica automáticamente; todo registro queda vinculado al destino o explícitamente pendiente; los códigos de estudiante, notas históricas y boletines emitidos permanecen íntegros; duplicados/huérfanos se detectan antes de ejecutar; el reporte contiene totales, diferencias y checksum; modo REAL no puede responder éxito si no aplicó cambios; rollback restaura el snapshot y conserva delta posterior; pruebas con fixtures cubren migración, interrupción y reversión.
- Relacionadas: AUD-NG-164 (catálogo y planes), AUD-NG-167 (calificaciones históricas), TASK-078 (rollback general y delta post-corte), AUD-NG-158 (RBAC/actor verificado).
- Estado: [ ] Pendiente

---

<!-- ID: F9-TASK10 | Fuentes: completadas.md -->
### [ ] [F9-TASK10] Ampliar el libro de calificaciones para mejorar el registro individual y masivo
- **Origen del Hallazgo:** `AUDITORIA_FASE_9_EVALUACIONES_CALIFICACIONES_RESULTADOS.md` / Tarea F9-Task05 (P1)
- **Prioridad:** P1
- **Severidad/Clasificación:** Alta (Portal docente y administración de calificaciones)
- **Archivos Involucrados:**
  - `teacher-dashboard.html`
  - `js/teacher.js`
  - `backend/exam-service/Code.gs`
- **Dependencias Expuestas:** F9-Task03, permisos docentes, matrícula, servicio de calificaciones y mecanismos de persistencia
- **Descripción del Alcance:**
  Asegurar que el registro sea eficiente, claro y resistente a errores, especialmente cuando el docente administra varios grupos, numerosas actividades o cantidades elevadas de estudiantes.

  Requisitos Funcionales:
  1. Mostrar el grupo, asignatura, sección, período y docente correspondientes al libro abierto.
  2. Permitir consultar las calificaciones por estudiante, actividad, categoría y período.
  3. Facilitar la navegación entre celdas mediante teclado, sin exigir el uso constante del ratón.
  4. Permitir registrar notas y observaciones individualmente y en lotes.
  5. Admitir la importación de calificaciones desde archivos tabulares cuando se disponga de una estructura reconocible y validable.
  6. Permitir aplicar una calificación a un conjunto seleccionado de estudiantes, con confirmación previa y sin sobrescribir datos accidentalmente.
  7. Diferenciar visualmente las notas guardadas, los borradores, las actividades pendientes y los errores de validación.
  8. Mostrar el estado de guardado de cada lote y permitir identificar qué registros se guardaron y cuáles fallaron.
  9. Evitar duplicados cuando se repita una petición de guardado o el docente vuelva a intentar una operación tras una desconexión.
  10. Detectar modificaciones simultáneas y advertir cuando otro usuario haya cambiado los mismos datos.
  11. Advertir antes de abandonar una página con cambios pendientes y recuperar los borradores cuando sea posible.
  12. Permitir copiar configuraciones de evaluación entre grupos compatibles sin copiar calificaciones personales ni información que corresponda a otros estudiantes.
  13. Ofrecer filtros por estado de calificación, actividad y estudiante, además de una búsqueda rápida.
  14. Mantener la interfaz utilizable en dispositivos móviles y en pantallas pequeñas.
- **Criterios de Aceptación:**
  - Un docente solo puede consultar y editar los grupos y asignaturas que tiene autorizados.
  - Un lote con errores informa los registros afectados sin ocultar el resultado de los demás.
  - Repetir una operación no duplica calificaciones.
  - Una actualización concurrente no sobrescribe silenciosamente una modificación ajena.
  - Las modificaciones no guardadas se advierten antes de abandonar el libro.
  - El registro de grupos numerosos mantiene tiempos de respuesta aceptables y no produce guardados incompletos silenciosos.
  - La interfaz permite completar el flujo de registro desde teclado y dispositivos móviles.
- **Estado:** Pendiente

---

<!-- ID: F9-TASK12 | Fuentes: completadas.md -->
### [ ] [F9-TASK12] Ampliar la evaluación por competencias, rúbricas e indicadores de logro
- **Origen del Hallazgo:** `AUDITORIA_FASE_9_EVALUACIONES_CALIFICACIONES_RESULTADOS.md` / Tarea F9-Task09 (P1)
- **Prioridad:** P1
- **Severidad/Clasificación:** Alta (Evaluación formativa y seguimiento del aprendizaje)
- **Archivos Involucrados:**
  - `backend/user-service/Code.gs`
  - `backend/exam-service/Code.gs`
  - `js/config.js`
- **Dependencias Expuestas:** F9-Task03, sistema de rúbricas, catálogo de competencias y permisos
- **Descripción del Alcance:**
  Garantizar que estas capacidades permitan evaluar competencias e indicadores de logro de manera consistente, sin reducir obligatoriamente todos los resultados a una nota numérica.

  Requisitos Funcionales:
  1. Permitir configurar competencias, indicadores de logro y niveles de desempeño por nivel educativo, grado y asignatura.
  2. Asociar las actividades y rúbricas con las competencias que evalúan.
  3. Permitir definir criterios de evaluación con descripciones, niveles de desempeño y puntuaciones opcionales.
  4. Admitir escalas cualitativas y numéricas, con equivalencias configurables cuando sean necesarias.
  5. Permitir registrar observaciones específicas por estudiante y criterio evaluado.
  6. Mostrar el nivel alcanzado en cada competencia y los indicadores que todavía no han sido evaluados.
  7. Diferenciar entre una competencia no evaluada y una competencia evaluada cuyo resultado sea insuficiente.
  8. Permitir consolidar resultados de varias actividades sin duplicar la contribución de una misma competencia.
  9. Mantener la relación entre cada resultado y la rúbrica, la versión de los criterios y la actividad utilizada.
  10. Permitir reutilizar rúbricas en asignaturas o grupos compatibles sin compartir accidentalmente resultados individuales.
  11. Presentar al docente un resumen de las competencias que requieren atención y de los criterios con resultados insuficientes.
  12. Mostrar a estudiantes y tutores únicamente los resultados y observaciones que tengan autorización para consultar.
- **Criterios de Aceptación:**
  - Cada resultado puede relacionarse con una competencia y un criterio de evaluación.
  - Las escalas cualitativas se conservan sin conversiones numéricas obligatorias.
  - Las competencias pendientes se distinguen de las evaluadas.
  - Las rúbricas reutilizadas mantienen su configuración sin mezclar las notas de diferentes grupos.
  - Las consolidaciones coinciden con las reglas configuradas.
  - Los resultados se muestran únicamente a los perfiles autorizados.
- **Estado:** Pendiente

---

<!-- ID: F9-TASK13 | Fuentes: completadas.md -->
### [ ] [F9-TASK13] Optimizar la exportación académica y los formatos de intercambio
- **Origen del Hallazgo:** `AUDITORIA_FASE_9_EVALUACIONES_CALIFICACIONES_RESULTADOS.md` / Tarea F9-Task11 (P1)
- **Prioridad:** P1
- **Severidad/Clasificación:** Alta (Exportaciones, interoperabilidad y reportes descargables)
- **Archivos Involucrados:**
  - `backend/academic-service/Code.gs`
  - `js/secretary.js` / `js/teacher.js`
- **Dependencias Expuestas:** F9-Task01, F9-Task02, F9-Task04 y F9-Task10
- **Descripción del Alcance:**
  Proporcionar opciones de exportación para análisis interno en formatos adicionales (XLSX, CSV) sin alterar ni sustituir el formato oficial requerido por SACE.

  Requisitos Funcionales:
  1. Permitir exportar calificaciones por estudiante, asignatura, sección, grupo, docente y período, según los permisos del usuario.
  2. Mantener la compatibilidad con las plantillas oficiales de SACE y diferenciar esa operación de las exportaciones destinadas a análisis interno.
  3. Ofrecer formatos adicionales para los reportes internos cuando resulten útiles, como XLSX y CSV, sin sustituir ni modificar el formato oficial requerido.
  4. Permitir seleccionar las actividades, categorías, calificaciones, observaciones y resultados que se incluirán en los reportes compatibles con cada formato.
  5. Incluir identificadores fiables para relacionar los registros exportados con los estudiantes y las actividades correspondientes.
  6. Diferenciar las calificaciones definitivas de los borradores y las notas que todavía no han sido aprobadas.
  7. Proporcionar una vista previa de los datos que se exportarán antes de generar el archivo.
  8. Registrar la fecha, el usuario, el contexto académico y el resultado de cada operación de exportación.
  9. Detectar registros incompletos y ofrecer un informe de errores que permita corregirlos.
  10. Evitar la duplicación de registros cuando se repita una exportación o se regenere un archivo.
  11. Permitir exportar únicamente los registros nuevos o modificados cuando el formato y el proceso de destino admitan esa modalidad.
  12. Conservar los permisos y las restricciones de acceso al exportar datos de varios grupos o estudiantes.
- **Criterios de Aceptación:**
  - Los archivos contienen únicamente los registros incluidos en los filtros seleccionados.
  - Los valores exportados coinciden con los resultados académicos oficiales.
  - Los borradores no se presentan como calificaciones definitivas.
  - Los archivos oficiales conservan la estructura exigida por su plantilla.
  - Los errores de exportación identifican los registros afectados.
  - Las exportaciones no permiten acceder a información fuera del ámbito autorizado.
  - La repetición de una exportación no modifica las calificaciones originales.
- **Estado:** Pendiente

---

<!-- ID: F10-TASK03 | Fuentes: Pendientes.md ; pendientes/Docente/Pendientes.md -->
### [ ] [F10-TASK03] Fortalecer el modelo de asistencia y su configuración institucional
- **Origen del Hallazgo:** `AUDITORIA_FASE_10_ASISTENCIA_DISCIPLINA_CONVIVENCIA.md` / Tarea 10.1 (P1)
- **Prioridad:** P1
- **Severidad/Clasificación:** Alta (Configuración institucional de asistencia)
- **Archivos Involucrados:**
  - `backend/academic-service/Code.gs`
  - `js/config.js`
- **Dependencias Expuestas:** RegistrosAsistencia, SesionesAsistencia y reglas de cómputo
- **Descripción del Alcance:**
  Incorporar o completar una configuración institucional de asistencia que permita definir modalidades de registro (diaria, por clase, por período), estados, códigos, categorías y reglas de cómputo de minutos/horas sin modificar el código fuente.
- **Criterios de Aceptación:**
  - La institución puede configurar códigos y reglas de cómputo de asistencia dinámicamente.
- **Estado:** Pendiente

<!-- Fuente: RECUPERACION/Pendientes_RECUPERADO.md, líneas 316-331; clave F10-Task04; asignación única: Docente -->

---

<!-- ID: F10-TASK04 | Fuentes: Pendientes.md ; pendientes/Docente/Pendientes.md -->
### [ ] [F10-TASK04] Optimizar el registro masivo de asistencia y la gestión de sesiones
- **Origen del Hallazgo:** `AUDITORIA_FASE_10_ASISTENCIA_DISCIPLINA_CONVIVENCIA.md` / Tarea 10.2 (P1)
- **Prioridad:** P1
- **Severidad/Clasificación:** Alta (Optimización y registro masivo)
- **Archivos Involucrados:**
  - `backend/academic-service/Code.gs`
  - `js/teacher.js`
- **Dependencias Expuestas:** SesionesAsistencia, RegistrosAsistencia
- **Descripción del Alcance:**
  Permitir registrar la asistencia de un grupo completo en una sola vista, aplicar estados masivos, manejar guardado parcial, control de concurrencia y recuperación de sesiones interrumpidas.
- **Criterios de Aceptación:**
  - El registro de grupos numerosos es eficiente, no produce duplicados y permite reintentos seguros.
- **Estado:** Pendiente

<!-- Fuente: RECUPERACION/Pendientes_RECUPERADO.md, líneas 348-363; clave F10-Task06; asignación única: Docente -->

---

<!-- ID: F10-TASK06 | Fuentes: Pendientes.md ; pendientes/Docente/Pendientes.md -->
### [ ] [F10-TASK06] Desarrollar un sistema avanzado de alertas de asistencia y seguimiento preventivo
- **Origen del Hallazgo:** `AUDITORIA_FASE_10_ASISTENCIA_DISCIPLINA_CONVIVENCIA.md` / Tarea F10-Task02 (P1) y Tarea 10.4
- **Prioridad:** P1
- **Severidad/Clasificación:** Alta (Comunicaciones, alertas y prevención de deserción)
- **Archivos Involucrados:**
  - `backend/academic-service/Code.gs`
  - `backend/user-service/Code.gs`
- **Dependencias Expuestas:** BandejaNotificaciones, CasosSeguimiento, RelacionesFamiliares
- **Descripción del Alcance:**
  Permitir configurar reglas de alerta por ausencias acumuladas, tardanzas repetidas y porcentajes de asistencia, notificar a tutores autorizados de forma configurable y evitar notificaciones duplicadas por reintentos.
- **Criterios de Aceptación:**
  - Las alertas de inasistencia se generan según umbrales configurados y se notifican a los tutores legales registrados.
- **Estado:** Pendiente

<!-- Fuente: RECUPERACION/Pendientes_RECUPERADO.md, líneas 410-425; clave F10-Task10; asignación única: Docente -->

---

<!-- ID: F10-TASK10 | Fuentes: Pendientes.md ; pendientes/Docente/Pendientes.md -->
### [ ] [F10-TASK10] Completar el modelo funcional de orientación académica y vocacional
- **Origen del Hallazgo:** `AUDITORIA_FASE_10_ASISTENCIA_DISCIPLINA_CONVIVENCIA.md` / Tarea 10.9 (P1)
- **Prioridad:** P1
- **Severidad/Clasificación:** Alta (Orientación vocacional y proyectos de aprendizaje)
- **Archivos Involucrados:**
  - `backend/academic-service/Code.gs`
  - `backend/user-service/Code.gs`
- **Dependencias Expuestas:** ExpedientesEstudiantes, CasosSeguimiento
- **Descripción del Alcance:**
  Permitir a los orientadores diseñar planes de seguimiento académico, fijar metas de aprendizaje y registrar recomendaciones vocacionales sin alterar las notas oficiales ni matrículas.
- **Criterios de Aceptación:**
  - Los orientadores registran metas académicas e informes sin permisos de alteración de calificaciones oficiales.
- **Estado:** Pendiente

---

<!-- ID: F11-TASK08 | Fuentes: AUDITORIAS/AUDITORIA-FASE-11-COMUNICACION-BIENESTAR-SUPERVISION-FINANZAS.md ; AUDITORIAS/AUDITORIA_COMPLETADAS_TAREA-17.md ; Pendientes.md ; pendientes/Docente/Pendientes.md -->
### [ ] [F11-TASK08] Alertas tempranas basadas en métricas académicas reales

**Otros títulos originales:**
- Desarrollar el sistema de alertas tempranas de rendimiento académico y deserción escolar
- **Hallazgo de origen:** sección 2.C.4; existen alertas por inasistencia/tardanza, pero falta consolidar riesgo académico y de deserción.
- **Severidad:** Alta. **Objetivo:** detectar y canalizar oportunamente casos que requieren acompañamiento.
- **Acción ejecutable:** definir reglas configurables y trazables para señales de riesgo académico/deserción; consolidar asistencia, rendimiento y seguimiento; generar alertas asignadas a roles autorizados con estado y derivación.
- **Archivos/módulos:** `backend/academic-service/Code.gs`, `getAttendanceFollowupCases`, `checkAndDispatchAttendanceAlerts`, `CasosSeguimiento`.
- **Dependencias/riesgos:** calidad de datos académicos/asistencia, privacidad y umbrales institucionales; riesgo de falsos positivos o exposición de información confidencial.
- **Alcance:** alertas integradas y gestión de casos; no automatizar diagnósticos personales.
- **Criterios de aceptación:** reglas reproducibles generan alertas solo con datos suficientes; cada alerta incluye motivo, fecha, responsable y estado; el acceso respeta confidencialidad; se pueden revisar falsos positivos y cerrar/derivar casos.
- **Prioridad:** P1. **Estado:** Pendiente.
- **Evidencia de cierre:** pendiente; el informe declara parcial la alerta actual y señala la integración faltante.
- Sustituir `mockFailingSubjects` y `mockMissingTasks` del payload por consultas verificadas de notas publicadas y entregas persistidas, atribuidas al estudiante, asignatura, año lectivo y periodo correctos.
- Calcular asistencia, materias reprobadas y tareas pendientes en backend con reglas institucionales versionadas; ignorar métricas proporcionadas por el cliente.
- Incluir año lectivo/periodo en la clave de deduplicación para que una alerta de un ciclo no suprima una alerta nueva del siguiente.
- Mantener estados Activa/EnAtencion/Descartada/Resuelta y deduplicación por estudiante/contexto; contar estudiantes únicos y alertas activas desde registros reales.
- Persistir y ejecutar la notificación por los canales institucionales configurados. `NotificadoA` debe reflejar un envío comprobado, con fecha, canal y resultado; no basta con guardar texto.
- Vincular alertas de riesgo alto/crítico con casos de seguimiento, garantizando que el caso y la alerta compartan estudiante, contexto, periodo y trazabilidad.
- Revisar F11-Task08 aunque figure completada: no cambiar su estado aquí, pero exigir evidencia funcional antes de aceptar su cierre.

**Reconciliación y límites:** AUD-NG-167 conserva el libro académico como fuente única; TASK-050/051 definen catálogo y semántica; TASK-052 aplica filtros; TASK-054 valida conducta; TASK-235 gestiona series; TASK-237 exporta; AUD-NG-158 protege el ámbito; F11-Task08 mantiene la lógica de alertas tempranas. No se crea AUD-NG nuevo. No se altera el estado de TASK-051 ni F11-Task08 en este cambio.

**Evidencia requerida:** filtros reales y agrupaciones por dimensión; atribución mediante relaciones curriculares; tendencias por parcial/año; métricas de alertas desde datos persistidos y deduplicación contextual; permisos por perfil/ámbito; exportación idéntica a la consulta y sin filas ficticias; REP-ACAD-01/02 con generadores funcionales; pruebas con fixtures y resultados reproducibles. La auditoría actual es estática y no acredita esos comportamientos.
- **Origen del Hallazgo:** `AUDITORIA-FASE-11-COMUNICACION-BIENESTAR-SUPERVISION-FINANZAS.md` / Área II (P1)
- **Prioridad:** P1
- **Severidad/Clasificación:** Alta (Prevención de reprobación y deserción)
- **Archivos Involucrados:**
  - `backend/academic-service/Code.gs`
- **Dependencias Expuestas:** AlertasTempranas
- **Descripción del Alcance:**
  Evaluar métricas combinadas de ausentismo, reprobación parcial e incumplimiento de tareas para disparar alertas preventivas a coordinadores y orientadores.
- **Criterios de Aceptación:**
  - Las alertas de riesgo se generan según umbrales institucionales sin duplicar notificaciones activas.
- **Estado:** Pendiente

- Sustituir mockFailingSubjects y mockMissingTasks por consultas reales de calificaciones publicadas y entregas de tareas.
- Filtrar asistencia, matrículas, notas y tareas por anolectivo y periodo; la clave de deduplicación debe incluir el año lectivo para no suprimir alertas de ciclos distintos.
- No presentar NotificadoA como notificación enviada: integrar un canal verificable y registrar resultado/reintento; mantener la creación de caso de seguimiento cuando corresponda.
- Probar umbrales, exclusiones, deduplicación, cierre/reactivación y consistencia con el reporte de riesgo.

Hallazgo nuevo: ninguno; se amplían tareas existentes. Progreso de auditoría: 23/183 identificadores únicos; 160 pendientes. Siguiente tarea: TAREA-18.
================================================================

HALLAZGO TAREA-18 - RECURSOS REUTILIZABLES Y PROYECTOS INTERDISCIPLINARIOS (2026-11-05)

<!-- Fuente: RECUPERACION/Pendientes_RECUPERADO.md, líneas 174-188; clave F11-Task09; asignación única: Docente -->

---

<!-- ID: F11-TASK09 | Fuentes: AUDITORIAS/AUDITORIA-FASE-11-COMUNICACION-BIENESTAR-SUPERVISION-FINANZAS.md ; Pendientes.md ; pendientes/Docente/Pendientes.md -->
### [ ] [F11-TASK09] Completar repositorio de planificación pedagógica, jornalizaciones y guiones docentes

**Otros títulos originales:**
- Completar la gestión de planificación pedagógica, jornalizaciones y guiones docentes
- **Hallazgo de origen:** sección 3.C.1; existen asignaturas/períodos vinculados, pero falta repositorio de entrega de guiones y sílabos.
- **Severidad:** Alta. **Objetivo:** centralizar la entrega, versión y consulta de documentos de planificación docente.
- **Acción ejecutable:** implementar carga/registro, clasificación por docente/asignatura/período, versiones, fechas de entrega y estados de revisión para guiones y sílabos.
- **Archivos/módulos:** `backend/academic-service/Code.gs`, `PlanificacionesPedagogicas` y almacenamiento documental relacionado.
- **Dependencias/riesgos:** permisos docentes/coordinación, almacenamiento y metadatos; riesgo de sobrescritura o asociación a período incorrecto.
- **Alcance:** repositorio y trazabilidad de documentos pedagógicos; no sustituye la asignación académica existente.
- **Criterios de aceptación:** cada documento queda ligado a docente, asignatura y período; las versiones se conservan; entregas tardías/incompletas se identifican; solo roles autorizados revisan.
- **Prioridad:** P1. **Estado:** Pendiente.
- **Evidencia de cierre:** pendiente; el informe declara implementación parcial y repositorio ausente.
- **Origen del Hallazgo:** `AUDITORIA-FASE-11-COMUNICACION-BIENESTAR-SUPERVISION-FINANZAS.md` / Área III (P1)
- **Prioridad:** P1
- **Severidad/Clasificación:** Alta (Gestión pedagógica)
- **Archivos Involucrados:**
  - `backend/academic-service/Code.gs`
- **Dependencias Expuestas:** PlanificacionesPedagogicas
- **Descripción del Alcance:**
  Permitir el registro y estructuración de planes de clase, jornalizaciones y sílabos vinculados con grado, seccion, asignatura y período académico.
- **Criterios de Aceptación:**
  - Las planificaciones conservan versión, docente titular y competencias asociadas.
- **Estado:** Pendiente

<!-- Fuente: RECUPERACION/Pendientes_RECUPERADO.md, líneas 300-315; clave F10-Task03; asignación única: Docente -->

---

<!-- ID: F20-TASK08 | Fuentes: AUDITORIAS/AUDITORIA_FASE_20_BIBLIOTECA_RECURSOS_EDUCATIVOS.md -->
### [ ] [F20-TASK08] Desarrollar portal OPAC de consulta y autoservicio
- **Hallazgo de origen:** secciones A.1, D/F20-25..F20-30 y G P1.
- **Severidad:** Alta. **Objetivo:** permitir a estudiantes y docentes buscar obras, consultar ejemplares y gestionar solicitudes desde su portal.
- **Acción ejecutable:** crear vista OPAC con búsqueda por título/autor/ISBN/materia, disponibilidad por ejemplar, filtros por grado/asignatura y acceso a préstamos/reservas personales.
- **Archivos/módulos:** dashboard de estudiantes/docentes, `js/accounting.js` o módulo de biblioteca dedicado, endpoints de catálogo y circulación.
- **Dependencias/riesgos:** F20-Task03, F20-Task04, identidad y ABAC; riesgo de exponer datos de otros usuarios o disponibilidad obsoleta.
- **Alcance:** consulta/autoservicio; no habilitar administración de catálogo a estudiantes.
- **Criterios de aceptación:** búsquedas y filtros devuelven datos vigentes; ejemplares y estado se muestran correctamente; usuario consulta solo su expediente; reserva respeta reglas; UI es accesible en móvil.
- **Prioridad:** P1. **Estado:** Pendiente.
- **Evidencia de cierre:** pendiente; no se acredita portal OPAC en el inventario fuente.

---

<!-- ID: F20-TASK10 | Fuentes: AUDITORIAS/AUDITORIA_FASE_20_BIBLIOTECA_RECURSOS_EDUCATIVOS.md -->
### [ ] [F20-TASK10] Asociar obras bibliográficas con asignaturas y grados académicos
- **Hallazgo de origen:** secciones D/F20-36..F20-40 y G P1.
- **Severidad:** Alta. **Objetivo:** vincular bibliografía recomendada con el currículo institucional.
- **Acción ejecutable:** crear relación obra-asignatura-grado-nivel con vigencia y tipo de recomendación; permitir consulta desde OPAC y panel docente.
- **Archivos/módulos:** `backend/academic-service/Code.gs`, `backend/accounting-service/Code.gs`, `BibliotecaCatalogoObras`, catálogos de asignaturas/grados.
- **Dependencias/riesgos:** F20-Task03, catálogos académicos y permisos; riesgo de referencias a asignaturas/grados inexistentes o inactivos.
- **Alcance:** asociación curricular; no duplicar catálogos académicos ni asignar libros automáticamente a estudiantes.
- **Criterios de aceptación:** relaciones validadas contra catálogos activos; múltiples asignaturas/grados por obra; vigencia; filtros por curso; historial de cambios.
- **Prioridad:** P1. **Estado:** Pendiente.
- **Evidencia de cierre:** pendiente; no se identifica relación curricular en el informe fuente.

---

<!-- ID: F32-TASK04 | Fuentes: AUDITORIAS/AUDITORIA_FASE_32_EDITOR_VISUAL_PDF_CAMPOS_SUPERPUESTOS.md -->
### [ ] [F32-TASK04] Incorporar selección múltiple y alineación en bloque
- **Hallazgo de origen:** C.2, CAR-12 y G.2.
- **Severidad:** Alta / P1. **Objetivo:** editar grupos de campos de manera eficiente y consistente.
- **Acción ejecutable:** implementar selección múltiple con Shift y marco elástico; agregar alineación izquierda/derecha/centro/superior/inferior y distribución/igualación de dimensiones; mantener selección dentro de la página.
- **Archivos/módulos:** `js/teacher.js`, `addOverlayField`, `initDragField`, `initResizeField` y lienzo PDF.
- **Dependencias/riesgos:** F32-Task02 (precisión geométrica); riesgo de arrastrar el PDF o campos no seleccionados.
- **Alcance:** herramientas de edición en grupo; no alterar coordenadas de otros campos o páginas.
- **Criterios de aceptación:** selección con teclado/mouse/táctil; límites de página; alineación determinista; undo/redo o cancelación segura; accesibilidad de controles; pruebas con grupos, zoom y campos bloqueados.
- **Prioridad:** P1. **Estado:** Pendiente.
- **Evidencia de cierre:** pendiente; la auditoría señala que solo existe selección individual y falta marquee/Shift.

---

<!-- ID: TAREA-10 | Fuentes: Pendientes.md ; completadas.md -->
### [ ] [TAREA-10] Ampliación de criterios existentes derivada de TAREA-10 (2026-11-05)
- **AUD-NG-149:** incorporar asignaciones individuales/grupales/recurrentes; persistir y versionar el ciclo de vida de la tarea; emitir comprobante con token almacenado y verificable; usar clave idempotente para evitar entregas/versiones duplicadas. Validar modalidad y alcance al crear.
- **AUD-NG-121:** aplicar en servidor el límite de intentos configurado y las reglas de reentrega, además de la penalización tardía; el comentario actual sobre límites no constituye una validación.
- **AUD-NG-152:** completar transiciones publicable/programada, abierta, vencida y cerrada, separando apertura, fecha límite y cierre.
- **AUD-NG-124:** preservar historial de rúbricas, revisiones parciales, criterios y cambios de evaluación; no sobrescribir silenciosamente el progreso.
- **AUD-NG-158:** derivar autor/profesor de claims verificados en comentarios y devoluciones; comprobar propiedad de la tarea y asignación docente.
- **AUD-NG-002:** mantener protegidas las consultas sensibles de tareas y entregas, sin bypass por PUBLIC_ACTIONS.

### [AUD-NG-165] Proteger la privacidad y el acceso contextual a comentarios y versiones de entregas
- **Origen:** Auditoría de completadas.md / TAREA-10.
- **Severidad:** Alto (P1; privacidad de entregas y retroalimentación).
- **Archivos:** backend/task-service/Code.gs; js/student.js; js/teacher.js; student-dashboard.html; teacher-dashboard.html.
- **Dependencias:** ROLE_PERMISSIONS, validateContextualAccess, getSubmissionComments, addSubmissionComment, getSubmissionVersions, returnSubmissionForRevision, deleteSubmission, EntregasVersiones, ComentariosEntregas, _verifiedUserId.
- **Problema:** getSubmissionComments devuelve también registros esPrivado=true a cualquier rol que tenga permiso de consulta (incluidos estudiante, padre, tutor y responsable) y no valida propiedad/relación con el expediente. getSubmissionVersions permite consultar por entregaId sin comprobar que la entrega pertenezca al usuario o al ámbito docente. addSubmissionComment confía en autorId, rolAutor y esPrivado recibidos del cliente. returnSubmissionForRevision usa profesorId del payload para identificar al autor. deleteSubmission elimina la fila principal y el archivo, pero no elimina ni marca de forma coherente las versiones/comentarios relacionados.
- **Criterios de aceptación:** comentarios privados solo visibles para docentes asignados y roles expresamente autorizados; estudiantes y responsables solo reciben comentarios públicos de entregas propias/vinculadas; versiones filtradas por propietario o asignación docente aun cuando se consulte por entregaId; autor y rol derivados del token verificado; el cliente no puede elevar esPrivado ni suplantar docentes; devoluciones verifican propiedad de la tarea; borrado lógico conserva trazabilidad y referencias; pruebas negativas con dos estudiantes, dos docentes y responsables no vinculados.
- **Tareas relacionadas (no duplicadas):** AUD-NG-002 (consultas públicas), AUD-NG-124 (propiedad/calificaciones), AUD-NG-158 (ABAC de escrituras docentes).
- **Estado:** [ ] Pendiente

Hallazgo nuevo: AUD-NG-165. Los demás vacíos de TAREA-10 amplían tareas existentes.

- **Origen del Hallazgo:** Auditoría de la Fase 1, octubre de 2026 (AUDITORIA_FASE1_PLANIFICACION_EXPANSION.md - Sección B & H)
- **Severidad/Clasificación:** Alto
- **Archivos Involucrados:** `backend/task-service/Code.gs`, `js/teacher.js`, `js/student.js`, `student-dashboard.html`, `teacher-dashboard.html`
- **Dependencias Expuestas:** Servicios curriculares, almacenamiento documental, notificaciones y RBAC.
- **Descripción del Alcance:**
  1. Permitir tareas individuales, grupales y recurrentes.
  2. Fechas de publicación, apertura, vencimiento y cierre.
  3. Entregas anticipadas, tardías y reentregas según reglas docentes.
  4. Límites de intentos y penalizaciones por retraso.
  5. Borradores, confirmación de entrega y comprobantes de recepción con tokens.
  6. Estados claros: no iniciada, borrador, entregada, pendiente de revisión, revisada, devuelta para corrección, vencida.
  7. Control de versiones de entregas y metadatos en `VersionesEntregas`.
  8. Comentarios generales y comentarios privados específicos.
  9. Rúbricas analíticas y criterios de evaluación.
  10. Revisiones parciales con guardado de progreso.
  11. Alertas e historial de modificaciones sin alterar entregas anteriores de forma silenciosa.
  12. Gestión de adjuntos, límites de tamaño y manejo de excepciones de Drive.
- **Criterios de Aceptación:**
  - Un estudiante recibe confirmación de una entrega válida.
  - Una entrega incompleta o fallida no se presenta como completada.
  - Las reentregas conservan las versiones anteriores.
  - El docente puede devolver una tarea para corrección sin eliminar su historial.
  - El estudiante ve las instrucciones, fechas, estado y retroalimentación correspondientes.
  - Las entregas tardías siguen las reglas configuradas.
  - Las operaciones repetidas no duplican entregas ni notificaciones.
  - Los archivos y comentarios respetan los permisos del curso.
- **Estado:** Pendiente

---

<!-- ID: TAREA-11 | Fuentes: Pendientes.md ; completadas.md -->
### [ ] [TAREA-11] Ampliación de criterios derivada de TAREA-11 (2026-11-05)
- **AUD-NG-121:** hacer cumplir en backend fecha de apertura/cierre, duración y máximo de intentos por estudiante; rechazar entregas fuera de ventana o después del máximo permitido y no confiar en temporizadores del cliente.
- **AUD-NG-124:** incorporar corrección manual por pregunta abierta, puntuación parcial, rúbricas/criterios y guardado del progreso de revisión con historial.
- **AUD-NG-006:** aplicar clave idempotente y reserva atómica a submitExam; una repetición tras timeout debe recuperar la entrega existente y no crear otra.
- **AUD-NG-011:** persistir areaId/ámbito curricular en exámenes y reactivos; validar asignación/área y resolver el servicio autorizado.
- **AUD-NG-002:** validar propiedad antes de consultar resultados por entregaExamenId y controlar el momento/rol de exposición de respuestas correctas.
- **AUD-NG-158:** limitar gestión/consulta de bancos y exámenes al ámbito curricular y asignaciones verificadas del docente.

### [AUD-NG-166] Completar el modelo verificable de reactivos y la integridad del motor de exámenes
- **Origen:** Auditoría de completadas.md / TAREA-11.
- **Severidad:** Alto (P1).
- **Archivos:** backend/exam-service/Code.gs; js/exam.js; js/quizpro.js; exam.html; results.html.
- **Problema:** el banco carece de validación de esquema/referencias; createExam no persiste todos los campos declarados de Examenes/PreguntasExamen; no conserva vínculo/versionado de reactivos reutilizados; faltan modalidades exigidas; no existe snapshot inmutable para exámenes ya realizados; la analítica psicométrica requerida no está implementada de forma verificable.
- **Criterios:** validar tipos, opciones, respuestas, puntos y referencias curriculares en servidor; persistir área/tema/dificultad/etiquetas/objetivos/criterios; relación estable/versionada con BancoPreguntas; soportar las nueve modalidades (incluidos adjuntos); conservar snapshot de reactivos aplicados; ofrecer analítica psicométrica reproducible por pregunta/tema/asignatura/grupo.
- **Tareas relacionadas (no duplicadas):** AUD-NG-121 (fechas/duración/intentos), AUD-NG-124 (rúbricas/revisión parcial), AUD-NG-006 (idempotencia), AUD-NG-011 (área/routing), AUD-NG-002 (propiedad/consultas), AUD-NG-158 (ámbito docente).
- **Estado:** [ ] Pendiente

Hallazgo nuevo: AUD-NG-166. Progreso de auditoría: 17/183; 166 pendientes. Siguiente tarea: TAREA-12.

- **Origen del Hallazgo:** Auditoría de la Fase 1, octubre de 2026 (AUDITORIA_FASE1_PLANIFICACION_EXPANSION.md - Sección B & H)
- **Severidad/Clasificación:** Alto
- **Archivos Involucrados:** `backend/exam-service/Code.gs`, `js/quizpro.js`, `js/exam.js`, `exam.html`, `results.html`
- **Dependencias Expuestas:** Tarea 08, Tarea 09, sistema de evaluación y registro académico.
- **Descripción del Alcance:**
  1. Soporte para preguntas de opción múltiple, selección múltiple, verdadero/falso, respuesta corta, respuesta extensa, numéricas, emparejamiento, ordenación y preguntas con archivos/imágenes.
  2. Bancos de preguntas organizados por área, asignatura, grado, tema y nivel de dificultad en `BancoPreguntas`.
  3. Etiquetas, objetivos de aprendizaje y criterios.
  4. Reutilización de reactivos en distintos exámenes sin duplicar.
  5. Configuración de duración, fechas, intentos, aleatoriedad y disponibilidad.
  6. Separación estricta de respuestas correctas antes del momento autorizado.
  7. Recuperación ante interrupciones de conectividad y prevención de solicitudes duplicadas.
  8. Calificación manual para preguntas abiertas con asignación de puntos parciales y rúbricas.
  9. Analítica psicométrica por pregunta, tema, asignatura y grupo.
- **Criterios de Aceptación:**
  - Cada tipo de pregunta tiene reglas de validación y calificación definidas.
  - Los exámenes respetan las fechas, la duración y los intentos configurados.
  - La interrupción de conexión no duplica una respuesta ya registrada.
  - Las respuestas correctas no se exponen antes del momento autorizado.
  - Las preguntas de revisión manual permanecen pendientes hasta que el docente las califique.
  - Las calificaciones se reflejan correctamente en los resultados académicos.
  - Los análisis estadísticos coinciden con las respuestas y puntuaciones almacenadas.
  - Los cambios en un banco de preguntas no alteran silenciosamente exámenes ya realizados.
- **Estado:** Pendiente

---

<!-- ID: TAREA-12 | Fuentes: Pendientes.md ; completadas.md -->
### [ ] [TAREA-12] Ampliación de criterios derivada de TAREA-12 (2026-11-05)
- **AUD-NG-002:** getStudentAcademicReport debe derivar el estudiante de claims verificados o comprobar relación familiar; no debe exponer registros no publicados ni ignorar el ámbito/periodo autorizado.
- **AUD-NG-158:** incluir todas las operaciones de calificación institucional, rúbricas, competencias, recuperación, cierre, revisión, reapertura y rectificación en ABAC server-side; actor/autoridad deben derivarse de claims, no de campos libres del payload.
- **AUD-NG-124:** conservar su alcance original de historial/propiedad de calificaciones de entregas; no absorber el libro académico consolidado, que se registra en AUD-NG-167.

### [AUD-NG-167] Unificar la integridad del libro de calificaciones y el ciclo institucional de evaluación
- **Origen:** Auditoría de completadas.md / TAREA-12.
- **Severidad:** Alto (P1).
- **Archivos:** backend/academic-service/Code.gs; backend/exam-service/Code.gs; js/teacher.js; js/student.js; teacher-dashboard.html.
- **Problema:** calificaciones identificadas solo por evaluacionId+userId; consultas sin filtro completo por periodo/asignatura; ponderaciones duplicadas/hardcodeadas; cálculo unificado con validaciones insuficientes; rúbricas/competencias sin esquema ni integración UI; cierre/publicación y rectificación sin transición/autoridad contextual verificable; recuperación CAT-GLOBAL; boletines desconectados de la fuente consolidada y equivalencia SACE no acreditada.
- **Criterios:** clave contextual estable; validar configuración de ponderaciones y notas; cálculo server-side único con pendientes distintos de cero; rúbricas analíticas y competencias vinculadas a catálogos; revisión/publicación/cierre/rectificación con permisos y transiciones verificadas; recuperación asociada a calificación real; boletines oficiales desde notas consolidadas y compatibilidad SACE demostrable.
- **Tareas relacionadas (no duplicadas):** AUD-NG-002 (propiedad y consulta), AUD-NG-158 (ABAC docente), AUD-NG-124 (historial de calificaciones de entregas, no del libro consolidado).
- **Estado:** [ ] Pendiente

Hallazgo nuevo: AUD-NG-167. Progreso de auditoría: 18/183; 165 pendientes. Siguiente tarea: TAREA-13.

- **Origen del Hallazgo:** Auditoría de la Fase 1, octubre de 2026 (AUDITORIA_FASE1_PLANIFICACION_EXPANSION.md - Sección B & H)
- **Severidad/Clasificación:** Alto
- **Archivos Involucrados:** `backend/academic-service/Code.gs`, `js/teacher.js`, `js/student.js`, `teacher-dashboard.html`
- **Dependencias Expuestas:** Configuración curricular, servicios de tareas y exámenes, rúbricas, calificaciones y boletines.
- **Descripción del Alcance:**
  1. Relacionar tareas, exámenes y proyectos con criterios institucionales.
  2. Ponderaciones configurables por asignatura y periodo.
  3. Rúbricas analíticas con niveles de desempeño y comentarios cualitativos.
  4. Estados de calificación: pendientes, provisionales, publicadas, rectificadas, cerradas.
  5. Inalterabilidad de periodos cerrados y procedimientos autorizados de rectificación con historial auditorable.
  6. Reglas de recuperación, nivelación y reevaluación.
  7. Compatibilidad con boletines oficiales SACE y cuadro de honor.
- **Criterios de Aceptación:**
  - Las calificaciones se calculan de acuerdo con las ponderaciones configuradas.
  - Las notas pendientes no se interpretan como cero salvo que la regla institucional lo establezca.
  - Las rectificaciones preservan el historial anterior.
  - Los periodos cerrados no se modifican mediante operaciones ordinarias.
  - Los docentes no pueden modificar notas de estudiantes fuera de su ámbito autorizado.
  - Los boletines y los historiales coinciden con las calificaciones consolidadas.
  - Las escalas de distintos programas curriculares pueden coexistir sin confusión.
- **Estado:** Pendiente

---

<!-- ID: TAREA-13 | Fuentes: Pendientes.md ; completadas.md -->
### [ ] [TAREA-13] Ampliación de criterios derivada de TAREA-13 (2026-11-05)
- **AUD-NG-164:** usar OfertaAcademica como fuente canónica de ofertas; eliminar la divergencia de lectura con OfertasAcademicas y conservar IDs estables en área/asignatura/plan/oferta.
- **AUD-NG-158:** incorporar ABAC a asignación, consulta y baja de docentes por área/oferta/grado/sección/periodo; derivar actor de claims verificados para sustituciones, preferencias, horarios y excepciones; validar asignaciones vigentes antes de leer o modificar.

### [AUD-NG-168] Unificar el modelo de asignaciones docentes, carga horaria y planificación de horarios
- **Origen:** Auditoría de completadas.md / TAREA-13.
- **Severidad:** Alto (P1).
- **Archivos:** backend/academic-service/Code.gs; js/teacher.js; teacher-dashboard.html.
- **Problema:** las funciones de ofertas usan OfertaAcademica mientras la planificación departamental usa OfertasAcademicas; HorariosClase se escribe con una estructura que getClassSchedules interpreta con índices distintos; sustituciones consultan columnas equivocadas y usan estados Activa/Activo inconsistentes; carga, conflictos y ocupación ignoran año/periodo o incluyen estados no vigentes; asignación por área no está integrada en la interfaz; el mapa departamental representa un único docente por oferta.
- **Criterios:** fuente canónica de ofertas; relación docente-área-asignatura-oferta-grupo-año/periodo; asignaciones compartidas y sustituciones con vigencia; esquema único de horarios; filtros por año/periodo y estado; detección de conflictos verificable; carga calculada solo con bloques vigentes; reportes departamentales/vacantes basados en relaciones canónicas.
- **Tareas relacionadas (no duplicadas):** AUD-NG-164 (catálogo curricular y ofertas), AUD-NG-158 (ABAC docente y actor verificado).
- **Estado:** [ ] Pendiente

Hallazgo nuevo: AUD-NG-168. Progreso de auditoría: 19/183; 164 pendientes. Siguiente tarea: TAREA-14.

- **Origen del Hallazgo:** Auditoría de la Fase 1, octubre de 2026 (AUDITORIA_FASE1_PLANIFICACION_EXPANSION.md - Sección B & D)
- **Severidad/Clasificación:** Medio
- **Archivos Involucrados:** `backend/academic-service/Code.gs`, `js/teacher.js`, `teacher-dashboard.html`
- **Dependencias Expuestas:** Tarea 08, catálogo de asignaturas, departamentos, oferta académica y horarios.
- **Descripción del Alcance:**
  1. Asignar responsables a los departamentos académicos.
  2. Asociar docentes con áreas, asignaturas, grados y secciones.
  3. Definir cargas horarias y límites configurables por docente.
  4. Detección automática de conflictos de horario y solapamiento de aulas.
  5. Asignaciones compartidas o docentes sustitutos.
  6. Vistas de planificación de carga académica por departamento y detección de vacantes.
- **Criterios de Aceptación:**
  - Cada asignación está vinculada a una asignatura, grupo, periodo y docente.
  - Los conflictos detectados se muestran antes de confirmar una asignación incompatible.
  - Los cambios no modifican retroactivamente las calificaciones ni las entregas históricas.
  - Los docentes visualizan únicamente sus asignaciones autorizadas.
  - La Dirección puede identificar vacantes, conflictos y carga académica por área.
- **Estado:** Pendiente

---

<!-- ID: TAREA-F6-006 | Fuentes: AUDITORIAS/AUDITORIA_COMPLETADAS_TAREA-F6-006.md ; completadas.md -->
### [ ] [TAREA-F6-006] Crear una plantilla de microservicio académico reutilizable para múltiples áreas
| Requisito | Dictamen | Motivo |
|---|---|---|
| R1 plantilla reutilizable para siete áreas | Parcial | hay catálogo seed, pero está hardcodeado y no coincide con el frontend de doce áreas. |
| R2 áreas/asignaturas/grados/secciones configurables | Parcial | hay registro de áreas, asignaturas y ofertas; faltan catálogos relacionales de grado/sección y validación. |
| R3 relaciones mediante IDs inmutables | No cumple | tareas/exámenes usan nombres y no enlazan área/instancia/oferta/periodo; IDs Date.now sin unicidad. |
| R4 preservar historial ante cambios | No cumple | asignaciones y catálogo se actualizan in-place; falta versionado/snapshot. |
| R5 docentes/estudiantes/coordinadores con alcance específico | No cumple | consultas públicas y filtros de cliente; no se aplica ámbito de coordinador. |
| R6 instancias independientes por área | No cumple | registro de metadatos sin despliegue real; Spreadsheet compartido y URLs estáticas. |
| CA-037 | No cumple | defaultAreas está codificado y diverge del frontend. |
| CA-038 | Parcial | APIs para extensiones/asignaturas/ofertas, pero no CRUD completo ni validación de relaciones. |
| CA-039 | No cumple | IDs/relaciones no son completos ni inmutables. |
| CA-040 | No cumple | no hay historial versionado de asignaciones y relaciones. |
| CA-041 | No cumple | alcance de coordinación no se aplica en consultas/operaciones. |
- **Origen del Hallazgo:** Reestructuración Arquitectónica / F6-009 (P1 · Modularización y Reutilización)
- **Prioridad:** P1
- **Severidad/Clasificación:** Alta (Plantilla genérica de servicio académico y coordinaciones)
- **Archivos Involucrados:**
  - `backend/academic-service/Code.gs`
  - `backend/task-service/Code.gs`
  - `backend/exam-service/Code.gs`
  - Dashboards y configuraciones académicas
- **Dependencias Expuestas:** `getAcademicOffers`, `getTeacherAssignments`, `getAllTasks`, `getAllExams`, `saveQuestion`
- **Descripción del Alcance:**
  Implementar una plantilla genérica y reutilizable para microservicios académicos que permita desplegar áreas independientes (Comunicaciones, Inglés, Ciencias Sociales, Ciencias, Matemáticas, Informática, Contaduría y Finanzas) utilizando configuración parametrizada sin harcodeos en el código.

  Requisitos Funcionales:
  1. Desarrollar plantilla académica desacoplada que gestione: grados, secciones, asignaturas, asignaciones docentes, tareas, exámenes, entregas, calificaciones y retroalimentación.
  2. Configurar las 7 áreas académicas iniciales mediante registros de base de datos / parámetros JSON sin condicionales de nombres fijos (`if`/`switch`) en la lógica.
  3. Implementar modelo de relaciones por IDs inmutables (Grado -> Sección -> Asignatura -> Docente/Periodo -> Tarea/Examen -> Entrega).
  4. Garantizar que los cambios de docente, sección o año no alteren retroactivamente las calificaciones históricas.
  5. Soporte para coordinaciones académicas configurables (ámbito de supervisión por área, asignatura, grado o sección sin otorgar permisos administrativos generales).
  6. Permitir que cada instancia tenga su propio proyecto Apps Script, Spreadsheet, almacenamiento Drive y configuración aislada.
- **Criterios de Aceptación:**
  - CA-037: La plantilla no contiene nombres fijos de áreas, asignaturas, docentes o secciones en la lógica de negocio.
  - CA-038: Se pueden crear áreas, asignaturas, grados, secciones y coordinaciones desde configuración sin editar código.
  - CA-039: Cada instancia gestiona sus tareas, exámenes y entregas con aislamiento total de datos.
  - CA-040: Los estudiantes solo consultan sus asignaturas matriculadas y los docentes solo sus grupos autorizados.
  - CA-041: Un coordinador supervisa sus asignaturas asignadas sin obtener privilegios en áreas ajenas ni duplicar cuenta.
- **Estado:** Pendiente

---

<!-- ID: TAREA-F6-031 | Fuentes: AUDITORIAS/AUDITORIA_COMPLETADAS_TAREA-F6-006.md ; completadas.md -->
### [ ] [TAREA-F6-031] Crear una plantilla de microservicio académico reutilizable para múltiples áreas
| Criterio | Dictamen | Motivo |
|---|---|---|
| CA-061 siete áreas y materias configurables | Parcial | siete seeds hardcodeados; no sincronizados con frontend ni catálogo de materias por área. |
| CA-062 crear áreas, materias, grados, secciones y asignaciones sin código | Parcial | APIs parciales; grados/secciones son texto, no entidades administrables. |
| CA-063 relaciones por IDs inmutables | No cumple | falta areaId/instanceId/ofertaId/periodoId en tareas/exámenes. |
| CA-064 preservar calificaciones históricas | No cumple | asignaciones y catálogo mutables; sin snapshots/versiones. |
| CA-065 estudiante solo consulta materias matriculadas | No cumple | acciones públicas y grado/sección del payload sin matrícula verificada. |
| CA-066 docente solo consulta grupos asignados | No cumple | getAllTasks/getAllExams públicos y getTeacherAssignments confía en docenteUserId. |
| CA-067 coordinador solo supervisa ámbito asignado | No cumple | scope opcional y no aplicado en servicios. |
| CA-068 instancia propia de Apps Script/Spreadsheet/Drive/config | No cumple | despliegue simulado, IDs opcionales y fallback a Spreadsheet compartido. |
| CA-069 múltiples roles sin duplicar cuenta ni heredar privilegios | Parcial | existen ámbitos, pero no roles activos integrados al token/validación. |
| CA-070 funciones y módulos siguen operativos por área | No cumple | no hay routing por instancia ni pruebas reales; las consultas pueden mezclar áreas. |
| CA-151 coordinador con ámbito configurable | Parcial | solo areaId/tipo/fechas; faltan subject/grade/section/period y enforcement. |
| CA-152 coordinación enlazada a relaciones/periodos | No cumple | el JSON de coordinación no conserva esos IDs. |
| CA-153 coordinador con otros roles sin ampliar privilegios | No cumple | token usa un solo rol y no hay intersección de permisos por ámbito. |
- **Origen del Hallazgo:** F6-009 / Modularización y reutilización de código
- **Prioridad:** P1
- **Estado:** Pendiente
- **Severidad/Clasificación:** Alta (Modularización y reutilización)
- **Archivos Involucrados:** Servicio de tareas y exámenes, dashboards de docentes y estudiantes, configuración académica, asignación de asignaturas, gestión de usuarios y despliegues académicos.
- **Descripción del Alcance:**
  Permitir que cada área académica disponga de un microservicio independiente utilizando una misma plantilla de código, sin mantener copias adaptadas manualmente para cada área. Los nombres de las áreas, asignaturas, grados, secciones, períodos y docentes deben ser configurables.

  A. Plantilla académica genérica:
  La plantilla debe contemplar las funciones existentes y previstas de: gestión de grados y secciones, gestión de asignaturas, asignación de asignaturas a grados y secciones, matrículas y relaciones académicas de estudiantes, asignación de docentes a asignaturas, grados, secciones y períodos, gestión de tareas, exámenes y evaluaciones, publicación, edición y consulta de actividades, fechas de apertura y cierre, estados de publicación, entrega y calificación, entregas de estudiantes y archivos adjuntos cuando corresponda, calificaciones, observaciones y retroalimentación, consultas de docentes sobre sus asignaciones autorizadas, consultas de estudiantes sobre las asignaturas en las que están matriculados, validaciones de integridad y relaciones entre entidades, registros de operaciones y diagnóstico, comunicación con los servicios de usuarios, matrículas, expedientes y demás dependencias institucionales necesarias.

  B. Áreas académicas iniciales:
  Configurar, como mínimo, estas 7 áreas y asignaturas iniciales:
  - Área 1. Comunicaciones: Español, Ortografía, Caligrafía, Literatura.
  - Área 2. Inglés: Spelling, Writing, Literature, Grammar, Otras asignaturas de inglés.
  - Área 3. Ciencias Sociales: Historia de Honduras, Estudios Sociales, Sociología, Educación Cívica, Otras asignaturas relacionadas.
  - Área 4. Ciencias: Química, Biología, Ciencias Naturales, Otras asignaturas científicas.
  - Área 5. Matemáticas: Matemáticas, Geometría, Física, Otras asignaturas relacionadas.
  - Área 6. Informática: Computación, Informática I, Informática Aplicada, Análisis y Diseño, Otras asignaturas de informática.
  - Área 7. Contaduría y Finanzas: Economía, Contabilidad, Otras asignaturas relacionadas.
  No incorporar mediante condiciones `if`, `switch` ni nombres fijos dentro de la lógica de negocio.

  C. Modelo de relaciones académicas:
  - Una institución puede tener varios grados.
  - Un grado puede tener varias secciones.
  - Un grado o sección puede tener varias asignaturas.
  - Una asignatura puede impartirse en distintos grados o secciones.
  - Una asignatura puede tener docentes diferentes según el grado, sección o período.
  - Un estudiante puede estar inscrito en varias asignaturas mediante sus relaciones de matrícula.
  - Un docente puede impartir varias asignaturas y atender diferentes secciones.
  - Cada tarea o examen pertenece a una asignatura y a una asignación académica específica.
  - Cada entrega, calificación y retroalimentación queda vinculada al estudiante y actividad correctos.
  - Los cambios de grado, sección, docente o período no alteran retroactivamente las calificaciones históricas ni reasignan actividades antiguas a personas incorrectas.
  Las relaciones deben utilizar identificadores únicos e inmutables.

  D. Coordinación académica configurable:
  Permitir crear y administrar áreas de coordinación que agrupen asignaturas, docentes y responsabilidades de supervisión (ID único, nombre, descripción, estado activo/inactivo, grados/secciones/períodos aplicables, asignaturas asociadas, coordinadores, docentes supervisados, alcance de supervisión, permisos de consulta/supervisión, reportes, historial de asignaciones).

  E. Independencia de cada instancia:
  Cada instancia dispone de proyecto y despliegue de Apps Script, Spreadsheet y datos propios, configuración independiente, registros propios, permisos y límites específicos, versión identificable y carpetas de Drive propias.
- **Criterios de Aceptación:**
  - CA-061: La plantilla no contiene nombres fijos de áreas, grados, asignaturas, docentes o secciones en la lógica funcional.
  - CA-062: Se puede crear una asignatura sin modificar el código.
  - CA-063: Se pueden crear grados, secciones y asignaciones docentes sin modificar el código.
  - CA-064: Cada instancia gestiona tareas y exámenes mediante su configuración y sus propios datos.
  - CA-065: Los estudiantes solo consultan sus asignaturas, actividades, entregas y calificaciones autorizadas.
  - CA-066: Los docentes solo administran las asignaciones y grupos autorizados.
  - CA-067: Los datos de una instancia no se mezclan con los de otra.
  - CA-068: Se conservan las relaciones entre tareas, exámenes, entregas, estudiantes, docentes y asignaturas.
  - CA-069: Los cambios de configuración no modifican automáticamente los registros históricos.
  - CA-070: Las funciones existentes de tareas y exámenes continúan operativas.
  - CA-151: Las coordinaciones se pueden configurar sin modificar el código.
  - CA-152: Una coordinación puede relacionar asignaturas, docentes, grados, secciones y períodos según su alcance autorizado.
  - CA-153: Un coordinador puede tener otros roles institucionales sin duplicar su cuenta ni ampliar automáticamente sus permisos.

---

<!-- ID: TAREA-F7-IMP-01 | Fuentes: completadas.md -->
### [ ] [TAREA-F7-IMP-01] Ampliar la validación integral de horarios y asignaciones
- **Origen del Hallazgo:** `AUDITORIA_FASE_7_PLANIFICACION_HORARIOS_RECURSOS.md` / Tarea F7-IMP-01 (P1 · Fortalecimiento de Validaciones)
- **Prioridad:** P1
- **Severidad/Clasificación:** Alta (Ampliación funcional y fortalecimiento de validaciones)
- **Archivos Involucrados:**
  - `backend/academic-service/Code.gs`
  - `teacher-dashboard.html`
  - `js/teacher.js`
- **Dependencias Expuestas:** `checkScheduleConflict`, `createClassSchedule`, `getTeacherTeachingLoad`, `HorariosClase`, `CalendarioAcademico`, `HorariosLaborales`, `SedesAulas`
- **Descripción del Alcance:**
  Consolidar las reglas de validación aplicables a las asignaciones académicas, considerando las relaciones entre horarios, disponibilidad, períodos académicos, evaluaciones, recursos y reglas institucionales antes de crear, modificar, importar o publicar una asignación.

  Requisitos Funcionales:
  1. Consolidar las reglas de validación aplicables a las asignaciones académicas, sin duplicar innecesariamente las comprobaciones existentes.
  2. Evaluar las restricciones pertinentes antes de crear, modificar, importar o publicar una asignación.
  3. Distinguir entre:
     - Conflictos que impiden guardar o publicar.
     - Advertencias que permiten continuar con autorización.
     - Preferencias de planificación que pueden incumplirse sin invalidar la operación.
     - Errores de configuración que impiden evaluar correctamente una asignación.
  4. Detectar superposiciones horarias exactas y parciales.
  5. Considerar las fechas efectivas de las actividades, las excepciones del calendario y los períodos académicos aplicables.
  6. Validar la disponibilidad del docente, el aula y los recursos requeridos.
  7. Comprobar las restricciones de las secciones y los grupos involucrados.
  8. Identificar incompatibilidades entre clases, evaluaciones y otras actividades cuando compartan participantes o recursos exclusivos.
  9. Ejecutar las validaciones sobre el estado actualizado de los datos, no exclusivamente sobre información previamente cargada en la interfaz.
  10. Devolver resultados estructurados que permitan identificar las asignaciones afectadas y la regla incumplida.
  11. Evitar que la creación o modificación de un horario deje el sistema en un estado inconsistente si una validación o escritura falla.
  12. Conservar las excepciones legítimas que estén expresamente configuradas, sin convertir todas las coincidencias horarias en errores.
- **Criterios de Aceptación:**
  - CA-F7-01: Una asignación incompatible con una restricción obligatoria no puede confirmarse.
  - CA-F7-02: Una coincidencia permitida por una excepción explícita se acepta y conserva la justificación correspondiente.
  - CA-F7-03: Los intervalos parcialmente superpuestos se detectan correctamente.
  - CA-F7-04: Los intervalos consecutivos que no se superponen se aceptan, salvo que exista otra restricción aplicable.
  - CA-F7-05: Las modificaciones se validan considerando tanto el horario anterior como el nuevo, sin generar conflictos artificiales con el registro que se está actualizando.
  - CA-F7-06: Los errores identifican el recurso, docente, grupo o actividad implicados.
  - CA-F7-07: Una operación fallida no deja asignaciones parcialmente actualizadas.
  - CA-F7-08: Las reglas existentes que funcionan correctamente siguen superando sus pruebas.
- **Estado:** Pendiente

---

<!-- ID: TAREA-F7-IMP-02 | Fuentes: completadas.md -->
### [ ] [TAREA-F7-IMP-02] Implementar una matriz visual de planificación y disponibilidad
- **Origen del Hallazgo:** `AUDITORIA_FASE_7_PLANIFICACION_HORARIOS_RECURSOS.md` / Tarea F7-IMP-02 (P1 · Interfaz de Planificación)
- **Prioridad:** P1
- **Severidad/Clasificación:** Alta (Ampliación de interfaz y herramientas de planificación)
- **Archivos Involucrados:**
  - `teacher-dashboard.html`
  - `js/teacher.js`
  - `backend/academic-service/Code.gs`
- **Dependencias Expuestas:** `getClassSchedules`, `getClassroomResources`, `getTeacherAssignments`, `HorariosClase`, `SedesAulas`
- **Descripción del Alcance:**
  Incorporar una herramienta integral de visualización que permita comparar la disponibilidad de docentes, secciones, asignaturas, aulas y recursos para tomar decisiones de planificación desde una misma matriz unificada.

  Requisitos Funcionales:
  1. Incorporar una vista de planificación que permita alternar entre:
     - Horario institucional.
     - Horario por docente.
     - Horario por sección.
     - Horario por asignatura.
     - Ocupación por aula.
     - Disponibilidad por recurso.
  2. Permitir filtrar por año lectivo, período académico, jornada, sede, grado, sección y estado de publicación.
  3. Mostrar, para cada asignación, la información pertinente: asignatura, sección/grupo, docente, aula, día y horario, período académico y estado de la asignación.
  4. Diferenciar visualmente las clases confirmadas, los borradores, las actividades canceladas y los conflictos pendientes.
  5. Mostrar los intervalos disponibles y ocupados.
  6. Permitir seleccionar un bloque para consultar sus detalles y ejecutar las acciones autorizadas.
  7. Permitir identificar la disponibilidad simultánea de los recursos necesarios para una nueva clase.
  8. Actualizar los resultados después de guardar, modificar o cancelar una asignación.
  9. Proporcionar estados vacíos y mensajes claros cuando no existan resultados para los filtros seleccionados.
  10. Mantener la interfaz utilizable en pantallas de escritorio, tabletas y dispositivos móviles.
  11. Facilitar la impresión o exportación de las vistas cuando corresponda.
  12. Respetar los permisos de consulta y modificación del usuario.
- **Criterios de Aceptación:**
  - CA-F7-09: Un coordinador puede consultar la ocupación de un aula para un intervalo determinado.
  - CA-F7-10: Puede identificar los horarios de un docente y de una sección sin consultar manualmente cada registro.
  - CA-F7-11: Los filtros combinados devuelven únicamente los registros que cumplen las condiciones seleccionadas.
  - CA-F7-12: Una asignación cancelada deja de mostrarse como vigente, aunque pueda seguir disponible en el historial.
  - CA-F7-13: Una modificación confirmada se refleja en todas las vistas pertinentes.
  - CA-F7-14: Los usuarios sin permiso de modificación no pueden alterar los horarios desde esta interfaz.
  - CA-F7-15: Las consultas no muestran información de períodos o grupos ajenos al ámbito autorizado.
  - CA-F7-16: La vista funciona con horarios extensos sin bloquear la interacción ni ocultar información esencial.
- **Estado:** Pendiente

---

<!-- ID: TAREA-F7-IMP-03 | Fuentes: completadas.md -->
### [ ] [TAREA-F7-IMP-03] Desarrollar una herramienta de resolución asistida de conflictos
- **Origen del Hallazgo:** `AUDITORIA_FASE_7_PLANIFICACION_HORARIOS_RECURSOS.md` / Tarea F7-IMP-03 (P1 · Optimización de Horarios)
- **Prioridad:** P1
- **Severidad/Clasificación:** Alta (Nueva capacidad de planificación y optimización)
- **Archivos Involucrados:**
  - `backend/academic-service/Code.gs`
  - `teacher-dashboard.html`
  - `js/teacher.js`
- **Dependencias Expuestas:** `checkScheduleConflict`, `getClassSchedules`, `getTeacherTeachingLoad`, `getClassroomResources`, `F7-IMP-01`, `F7-IMP-02`
- **Descripción del Alcance:**
  Implementar un mecanismo integral de resolución asistida que agrupe conflictos, proporcione explicaciones claras y evalúe alternativas válidas (cambio de horario, sustituto disponible, aula alternativa, reprogramación) permitiendo comparar sus consecuencias antes de aplicar cambios oficiales.

  Requisitos Funcionales:
  1. Mostrar los conflictos agrupados por docente, aula, sección, recurso y actividad.
  2. Identificar todas las asignaciones que participan en un mismo conflicto.
  3. Explicar qué regla se incumple y qué intervalo produce la incompatibilidad.
  4. Proponer alternativas válidas, cuando existan: cambiar el horario, utilizar otro docente disponible, seleccionar otra aula compatible, reasignar el recurso, reprogramar la actividad.
  5. Comprobar que cada alternativa propuesta satisface las restricciones obligatorias.
  6. Mostrar las consecuencias de cada alternativa sobre las asignaciones relacionadas.
  7. Permitir comparar alternativas sin modificar todavía los datos oficiales.
  8. Exigir confirmación antes de aplicar cambios que afecten a otras asignaciones o usuarios.
  9. Volver a validar la alternativa seleccionada inmediatamente antes de guardarla.
  10. Identificar los casos en que no exista una solución válida y explicar las restricciones que lo impiden.
  11. Registrar la resolución seleccionada y los cambios efectivamente aplicados.
  12. Permitir que el usuario descarte una propuesta sin alterar la planificación existente.
- **Criterios de Aceptación:**
  - CA-F7-17: Ante un conflicto docente, el sistema puede mostrar intervalos alternativos que respeten su disponibilidad.
  - CA-F7-18: Las alternativas que producen otros conflictos obligatorios se descartan o se identifican explícitamente como inválidas.
  - CA-F7-19: Una propuesta no modifica los datos oficiales antes de su confirmación.
  - CA-F7-20: Si los datos cambian mientras se evalúa una alternativa, el sistema vuelve a validarla.
  - CA-F7-21: La confirmación aplica únicamente los cambios seleccionados.
  - CA-F7-22: Si la operación falla, no quedan modificaciones parciales.
  - CA-F7-23: Si no existe una alternativa válida, el sistema lo comunica sin presentar una solución incorrecta como aceptable.
- **Estado:** Pendiente

---

<!-- ID: TAREA-F7-IMP-05 | Fuentes: completadas.md -->
### [ ] [TAREA-F7-IMP-05] Ampliar el control de carga laboral y las preferencias docentes
- **Origen del Hallazgo:** `AUDITORIA_FASE_7_PLANIFICACION_HORARIOS_RECURSOS.md` / Tarea F7-IMP-05 (P1 · Carga Docente)
- **Prioridad:** P1
- **Severidad/Clasificación:** Alta (Ampliación de reglas académicas y laborales)
- **Archivos Involucrados:**
  - `backend/academic-service/Code.gs`
  - `teacher-dashboard.html`
  - `js/teacher.js`
- **Dependencias Expuestas:** `getTeacherTeachingLoad`, `HorariosLaborales`, `HorariosClase`, `checkScheduleConflict`
- **Descripción del Alcance:**
  Parametrizar de forma configurable los límites de carga laboral docente por contrato, jornada o política institucional (separando horas lectivas de actividades adicionales), e integrar el cálculo dinámico y el registro de preferencias autorizadas en la matriz de planificación.

  Requisitos Funcionales:
  1. Identificar y separar las reglas de carga obligatoria de las preferencias de distribución.
  2. Permitir configurar límites aplicables a cada docente según las políticas institucionales.
  3. Considerar: horas lectivas semanales, cantidad de sesiones, duración de las clases, límites diarios, períodos consecutivos, descansos mínimos, jornadas autorizadas, disponibilidad parcial, responsabilidades adicionales.
  4. Evitar que las clases recurrentes se contabilicen varias veces en el cálculo semanal.
  5. Diferenciar las horas lectivas de las actividades adicionales cuando la institución las contabilice por separado.
  6. Mostrar la carga total, el límite aplicable y la distribución por día.
  7. Identificar las asignaciones que provocan un exceso de carga.
  8. Permitir registrar preferencias de horario cuando estén autorizadas y sean compatibles con las reglas obligatorias.
  9. Actualizar los cálculos después de modificar una asignación.
  10. Conservar el historial de las reglas aplicadas cuando sea necesario explicar una planificación anterior.
- **Criterios de Aceptación:**
  - CA-F7-32: Los límites se aplican según la configuración efectiva y no mediante un valor global arbitrario.
  - CA-F7-33: Una modificación de horario actualiza la carga del docente afectado.
  - CA-F7-34: Las clases recurrentes se contabilizan de acuerdo con su frecuencia real.
  - CA-F7-35: Los períodos libres no se contabilizan como horas lectivas.
  - CA-F7-36: El sistema identifica excesos de carga y explica qué asignaciones los producen.
  - CA-F7-37: Las preferencias docentes no permiten incumplir restricciones obligatorias.
  - CA-F7-38: Si no existe una política definida para una regla, el sistema no inventa un límite institucional.
- **Estado:** Pendiente

---

<!-- ID: TAREA-F7-IMP-07 | Fuentes: completadas.md -->
### [ ] [TAREA-F7-IMP-07] Fortalecer la programación de evaluaciones y la prevención de sobrecargas
- **Origen del Hallazgo:** `AUDITORIA_FASE_7_PLANIFICACION_HORARIOS_RECURSOS.md` / Tarea F7-IMP-07 (P1 · Programación de Evaluaciones)
- **Prioridad:** P1
- **Severidad/Clasificación:** Alta (Ampliación de planificación evaluativa)
- **Archivos Involucrados:**
  - `backend/exam-service/Code.gs`
  - `backend/academic-service/Code.gs`
  - `teacher-dashboard.html`
  - `js/teacher.js`
- **Dependencias Expuestas:** `CalendarioAcademico`, `checkScheduleConflict`, `createCalendarEvent`, `Examenes`
- **Descripción del Alcance:**
  Establecer reglas configurables para la programación de evaluaciones (exámenes parciales, recuperaciones) que controlen la sobrecarga diaria de exámenes por sección, días no lectivos, disponibilidad de aulas y la simulación pre-confirmación de reprogramaciones.

  Requisitos Funcionales:
  1. Permitir configurar las restricciones institucionales aplicables a las evaluaciones.
  2. Comprobar las coincidencias de evaluaciones para una misma sección o grupo.
  3. Detectar conflictos de docentes, aulas y recursos.
  4. Permitir definir límites de evaluaciones por día o intervalo, si la institución los establece.
  5. Permitir definir períodos de separación entre evaluaciones cuando corresponda.
  6. Considerar las fechas de vacaciones, suspensiones y días no lectivos.
  7. Diferenciar exámenes ordinarios, recuperaciones y otras actividades evaluativas.
  8. Permitir simular cambios de fecha antes de confirmarlos.
  9. Identificar a los estudiantes o grupos afectados cuando exista información suficiente.
  10. Conservar los resultados y calificaciones históricos al modificar la programación.
  11. Propagar los cambios a los calendarios y vistas pertinentes.
  12. Evitar que las reglas nuevas contradigan las configuraciones académicas existentes.
- **Criterios de Aceptación:**
  - CA-F7-45: Las evaluaciones incompatibles se identifican antes de su confirmación.
  - CA-F7-46: Los límites diarios se aplican únicamente cuando están configurados.
  - CA-F7-47: Una reprogramación actualiza la fecha efectiva sin duplicar la evaluación.
  - CA-F7-48: Las calificaciones y los registros históricos permanecen vinculados a la evaluación correcta.
  - CA-F7-49: Los días no lectivos se respetan conforme a las reglas institucionales.
  - CA-F7-50: Los conflictos resultantes de una reprogramación se muestran antes de confirmar los cambios.
- **Estado:** Pendiente

---

<!-- ID: TAREA-F7-IMP-10 | Fuentes: completadas.md -->
### [ ] [TAREA-F7-IMP-10] Fortalecer las notificaciones y la trazabilidad de cambios académicos
- **Origen del Hallazgo:** `AUDITORIA_FASE_7_PLANIFICACION_HORARIOS_RECURSOS.md` / Tarea F7-IMP-10 (P1 · Notificaciones de Horarios)
- **Prioridad:** P1
- **Severidad/Clasificación:** Alta (Ampliación de notificaciones e integración)
- **Archivos Involucrados:**
  - `backend/user-service/Code.gs`
  - `backend/academic-service/Code.gs`
  - `js/teacher.js`
  - `js/secretary.js`
- **Dependencias Expuestas:** `sendMultiChannelNotification`, `HistorialCambiosEntidad`, `BitacoraNotificaciones`
- **Descripción del Alcance:**
  Estandarizar las notificaciones automáticas por cambios de horario, docente o aula con claves de deduplicación, registro de estado de entrega (preparado, enviado, entregado, fallido) y aislamiento frente a fallos de comunicación.

  Requisitos Funcionales:
  1. Identificar los destinatarios afectados por cada cambio.
  2. Diferenciar las notificaciones dirigidas a docentes, estudiantes, familias y responsables institucionales.
  3. Incorporar los cambios de fecha, hora, aula, docente, cancelación y reprogramación.
  4. Incluir la información anterior y la nueva cuando corresponda.
  5. Permitir consultar el historial de notificaciones asociadas a una actividad.
  6. Diferenciar los estados de preparado, enviado, entregado, fallido y leído, únicamente cuando el canal permita comprobarlos.
  7. Aplicar claves de deduplicación coherentes con el evento y el destinatario.
  8. Permitir reintentar notificaciones fallidas sin repetir innecesariamente las que ya se entregaron.
  9. Aislar los errores de comunicación del resultado de la operación académica.
  10. Evitar que las notificaciones revelen datos que el destinatario no está autorizado a consultar.
  11. Registrar los errores que requieran intervención.
  12. Permitir configurar los canales disponibles y las preferencias compatibles con las políticas institucionales.
- **Criterios de Aceptación:**
  - CA-F7-63: Cada cambio confirmado genera las notificaciones que correspondan según los destinatarios y las reglas configuradas.
  - CA-F7-64: Un fallo de comunicación no revierte una modificación académica confirmada.
  - CA-F7-65: Los reintentos no duplican injustificadamente los avisos.
  - CA-F7-66: El historial permite identificar el evento, los destinatarios y el resultado del envío.
  - CA-F7-67: Los estados de entrega no se marcan como confirmados sin evidencia del canal.
  - CA-F7-68: Los destinatarios no reciben información ajena a sus permisos.
- **Estado:** Pendiente

---

<!-- ID: TAREA-F7-IMP-12 | Fuentes: AUDITORIAS/AUDITORIA_COMPLETADAS_PLAN.md ; completadas.md -->
### [ ] [TAREA-F7-IMP-12] Auditoría de reportes de carga docente, ocupación y calidad (C1.244)
- **Fecha:** 2026-11-08.
- **Dictamen:** NO CUMPLE; se preserva [ ] histórico en completadas.md.
- **Hallazgo:** AUD-NG-247 (ALTO/P1), relacionado con AUD-NG-001, AUD-NG-244, AUD-NG-245 y AUD-NG-246.
- **Criterios:** CA-F7-75..80, todos NO CUMPLE.
- **Informe:** AUDITORIAS/AUDITORIA_COMPLETADAS_TAREA-F7-IMP-12.md.
- **Integridad:** completadas.md confirma tarea [ ]. Pendientes.md se leyó por blob 631b4c2dbf0e86d5704b63625382d73ccb8ceb3c, 1.782.094 caracteres y 20.182 líneas; la ruta de la rama ya referencia ese mismo blob, por lo que no se restaura ni modifica. El origen AUDITORIA_FASE_7_PLANIFICACION_HORARIOS_RECURSOS.md y el informe individual anterior no existían.
- **Evidencia principal:** getTeachingHoursSummary cuenta sesiones sin agrupar horas por período; getTeacherTeachingLoad ignora anoId e incluye Borrador/Cancelado; getCurricularAnalyticsReport no aplica filtros; getPlanningQualityAndOccupancyReport no filtra año, usa 40 h fijas por aula e incluye cancelados/borradores en ocupación; ROLE_PERMISSIONS no habilita el reporte de calidad para Profesor; los endpoints de carga no verifican docenteUserId contra identidad; el modal JS no tiene nodos HTML ni invocador.
- **Tareas derivadas:** TASK-590..TASK-596, descritas con objetivo, archivos, dependencias y aceptación en el informe individual.
- **Código/UI/pruebas sin cambios:** Code.gs df87a2eea9f0ef79d0b966d03fd5bbe432003df5; js/teacher.js c475fce5afcd28fca23e7b64398ad32b17773746; teacher-dashboard.html cbb9e6a272a7d8ad33f99727303305d950533e71; academic-grading-suite.js a22cb3ef376fe09e65c1b17c2f4f5125290bfba6.
- **Pruebas:** inspección estática manual y comparación Git. No ejecutados Apps Script runtime, HTTP/OAuth, DOM/navegador, Sheets productivas, exportación descargada, concurrencia, E2E ni Node.
- **Archivos nuevos:** AUDITORIAS/AUDITORIA_COMPLETADAS_TAREA-F7-IMP-12.md.
- **Archivos actualizados:** AUDITORIAS/Auditoria.txt; AUDITORIAS/MapaDependencias.md; AUDITORIAS/AUDITORIA_COMPLETADAS_PLAN.md; AUDITORIAS/Contexto_personal.txt.
- **Archivos sin cambios:** código, UI, pruebas, completadas.md, Pendientes.md, ChangesLogs.txt y METODOLOGIA_DESARROLLO.md.
- **Siguiente tarea exacta:** TAREA-F7-IMP-13, importación, exportación y validación masiva de horarios; CA-F7-81..86.
===============================================================================

- **Origen del Hallazgo:** `AUDITORIA_FASE_7_PLANIFICACION_HORARIOS_RECURSOS.md` / Tarea F7-IMP-12 (P2 · Analítica de Horarios)
- **Prioridad:** P2
- **Severidad/Clasificación:** Medio (Ampliación de análisis y reportes)
- **Archivos Involucrados:**
  - `backend/academic-service/Code.gs`
  - `teacher-dashboard.html`
  - `js/teacher.js`
- **Dependencias Expuestas:** `getTeachingHoursSummary`, `getCurricularAnalyticsReport`, `getTeacherTeachingLoad`
- **Descripción del Alcance:**
  Crear indicadores analíticos y reportes ejecutivos sobre la ocupación porcentual de aulas/laboratorios, distribución de carga laboral docente por período y detección de horas huecas o conflictos de calidad de planificación.

  Requisitos Funcionales:
  1. Incorporar reportes de carga docente por día, semana, período y año lectivo.
  2. Permitir comparar la carga con los límites aplicables a cada docente.
  3. Mostrar la ocupación de aulas y recursos por intervalo.
  4. Identificar los períodos de alta y baja utilización.
  5. Mostrar los conflictos pendientes y las asignaciones que requieren revisión.
  6. Resumir las evaluaciones y actividades programadas por sección y período.
  7. Permitir filtrar por sede, jornada, grado, sección, docente, aula y período, según corresponda.
  8. Diferenciar las asignaciones activas, canceladas y pendientes de publicación.
  9. Mostrar la fecha de actualización de los datos cuando sea relevante.
  10. Permitir exportar los reportes en los formatos admitidos por la plataforma.
  11. Restringir los datos sensibles según el rol.
  12. Evitar que los registros históricos se mezclen con la planificación vigente.
- **Criterios de Aceptación:**
  - CA-F7-75: Los totales de carga coinciden con las asignaciones incluidas en el período consultado.
  - CA-F7-76: Las actividades canceladas se contabilizan conforme a la definición de cada indicador.
  - CA-F7-77: La ocupación de recursos se calcula a partir de intervalos efectivos.
  - CA-F7-78: Los filtros combinados producen resultados coherentes.
  - CA-F7-79: Los reportes no incluyen datos fuera del ámbito autorizado.
  - CA-F7-80: Las exportaciones coinciden con los resultados presentados en pantalla.
- **Estado:** Pendiente

---

<!-- ID: TAREA-F7-IMP-16 | Fuentes: AUDITORIAS/AUDITORIA_COMPLETADAS_PLAN.md ; completadas.md -->
### [ ] [TAREA-F7-IMP-16] Auditoría de sustituciones y reasignación de clases (C1.248)
- **Fecha:** 2026-11-08.
- **Dictamen:** NO CUMPLE; se conserva [ ] histórico en completadas.md.
- **Criterios:** CA-F7-99 NO CUMPLE; CA-F7-100 PARCIAL; CA-F7-101 NO CUMPLE; CA-F7-102 NO CUMPLE; CA-F7-103 NO CUMPLE; CA-F7-104 NO CUMPLE; CA-F7-105 NO CUMPLE.
- **Hallazgos:** AUD-NG-168 ampliado; AUD-NG-251 nuevo (ALTO/P1); AUD-NG-245, AUD-NG-246 y AUD-NG-250 ampliados.
- **Informe:** AUDITORIAS/AUDITORIA_COMPLETADAS_TAREA-F7-IMP-16.md.
- **Integridad:** completadas.md SHA f57f1aef832e81e44fc4f7ec36a852d50e464676, TAREA-F7-IMP-16 [ ] en línea 4414. Pendientes.md blob 631b4c2dbf0e86d5704b63625382d73ccb8ceb3c recuperado (1782094 caracteres, 20.182 líneas, 0 U+FFFD); incluye TASK-173, no TAREA-F7-IMP-16. Informe individual y documento fuente no existen.
- **Evidencia:** HorariosClase tiene ocho columnas y createTeacherSubstitution usa r[8] como estado y pasa columnas desplazadas al motor; estado Activa no coincide con Temporal/Activo de los consumidores; vencimiento solo se calcula en DTO; no hay mapeo ni aplicación multibloque; el HTML carece del modal/botón; no se llaman notificaciones; el rol Profesor puede crear/consultar y forzar desde payload; el autor se toma del cliente; TC-F7-05 usa propiedad de respuesta incorrecta y la suite externa solo verifica presencia textual.
- **Tareas derivadas:** nuevas TASK-607 (ciclo de vida por fecha), TASK-608 (preview y aplicación multibloque), TASK-609 (autorización/actor/bypass); ampliar TASK-584/585/586/567, TASK-577..583, TASK-587, TASK-591, TASK-598, TASK-602, TASK-605/606 y TASK-173.
- **Archivos inspeccionados:** backend/academic-service/Code.gs (110-120, 168-260, 465-583, 671-755, 6228-6347, 6501-6616, 6773-6841, 7493-7693, 7879-8085, 14080-14173); js/teacher.js (1908-1944, 2077-2157); teacher-dashboard.html completo; tests/regression/academic-grading-suite.js línea 102; ChangesLogs.txt F11-Task12; completadas.md; Pendientes.md blob; informes IMP-10/11/13/15; plan, Auditoria.txt y MapaDependencias.md.
- **SHAs de respaldo:** Code.gs df87a2eea9f0ef79d0b966d03fd5bbe432003df5; teacher.js c475fce5afcd28fca23e7b64398ad32b17773746; teacher-dashboard.html cbb9e6a272a7d8ad33f99727303305d950533e71; academic-grading-suite.js a22cb3ef376fe09e65c1b17c2f4f5125290bfba6; completadas.md f57f1aef832e81e44fc4f7ec36a852d50e464676; Pendientes.md 631b4c2dbf0e86d5704b63625382d73ccb8ceb3c; ChangesLogs.txt 5b5cff1926b73a05d1b92087a7bf4b2db75326ff; metodología cf796728bb384a32537392df2f9c72a339fa03ee.
- **Pruebas:** inspección estática/manual y verificación Git. No ejecutados Apps Script runtime, HTTP/OAuth, DOM real, Sheets productivas, concurrencia, fallos inducidos, notificaciones reales, Node ni E2E.
- **Archivos nuevos:** AUDITORIAS/AUDITORIA_COMPLETADAS_TAREA-F7-IMP-16.md.
- **Archivos actualizados:** AUDITORIAS/Auditoria.txt; AUDITORIAS/MapaDependencias.md; AUDITORIAS/AUDITORIA_COMPLETADAS_PLAN.md; AUDITORIAS/Contexto_personal.txt.
- **Sin cambios:** código, UI, pruebas, completadas.md, Pendientes.md, ChangesLogs.txt, metodología y rama base.
- **Última tarea completamente auditada:** TAREA-F7-IMP-16.
- **Tarea en curso:** ninguna al cierre.
- **Siguiente tarea exacta:** TAREA-F7-IMP-17, gestión de eventos y actividades con participantes y recursos (CA-F7-106..111). Buscar informe y fuente; si faltan, auditar directamente los requisitos completos de completadas.md.
===============================================================================

- **Origen del Hallazgo:** `AUDITORIA_FASE_7_PLANIFICACION_HORARIOS_RECURSOS.md` / Tarea F7-IMP-16 (P1 · Sustituciones Complejas)
- **Prioridad:** P1
- **Severidad/Clasificación:** Alta (Ampliación de gestión docente)
- **Archivos Involucrados:**
  - `backend/academic-service/Code.gs`
  - `teacher-dashboard.html`
  - `js/teacher.js`
- **Dependencias Expuestas:** `createTeacherSubstitution`, `AsignacionesDocentes`, `checkScheduleConflict`
- **Descripción del Alcance:**
  Ampliación del módulo de sustituciones docentes para gestionar licencias prolongadas con reasignación de múltiples bloques horarios, verificación automática de carga del sustituto y caducidad automática de la sustitución al vencer su período.

  Requisitos Funcionales:
  1. Permitir identificar el intervalo exacto de la sustitución.
  2. Localizar las clases y actividades afectadas por la ausencia.
  3. Comprobar la disponibilidad del sustituto en cada intervalo.
  4. Validar su compatibilidad con las asignaturas, grupos y requisitos correspondientes.
  5. Detectar conflictos de carga laboral, horario y aula.
  6. Permitir gestionar varias sustituciones relacionadas.
  7. Conservar la asignación del docente titular.
  8. Distinguir entre sustituciones temporales y cambios permanentes.
  9. Registrar quién autorizó la sustitución y su período de vigencia.
  10. Propagar los cambios a las vistas y notificaciones pertinentes.
  11. Evitar que una sustitución temporal modifique las clases posteriores al período autorizado.
  12. Permitir consultar el historial de sustituciones.
- **Criterios de Aceptación:**
  - CA-F7-99: Una sustitución se aplica únicamente durante el intervalo autorizado.
  - CA-F7-100: El docente titular conserva su asignación histórica.
  - CA-F7-101: El sustituto no recibe clases incompatibles.
  - CA-F7-102: Los conflictos pendientes se identifican antes de confirmar.
  - CA-F7-103: Las vistas de los usuarios reflejan el responsable efectivo.
  - CA-F7-104: Las notificaciones se envían a los destinatarios correspondientes.
  - CA-F7-105: La finalización de la sustitución no altera indebidamente las asignaciones futuras.
- **Estado:** Pendiente

---

<!-- ID: TAREA-F7-IMP-18 | Fuentes: AUDITORIAS/AUDITORIA_COMPLETADAS_PLAN.md ; completadas.md -->
### [ ] [TAREA-F7-IMP-18] Auditoría de restricciones curriculares y dependencias entre asignaturas (C1.250)
- **Fecha:** 2026-11-08; sesión IMA-AUDIT-20261108-1814Z.
- **Checkpoint inicial:** C1.249; HEAD auditado ae26055ea27c87adfeb473a45e31bff8d5da43b1.
- **Dictamen:** NO CUMPLE; se conserva [ ] histórico en completadas.md, líneas 4487-4521.
- **Criterios:** CA-F7-112 NO CUMPLE; CA-F7-113 NO CUMPLE; CA-F7-114 PARCIAL; CA-F7-115 NO CUMPLE; CA-F7-116 PARCIAL.
- **Fuentes:** informe individual y fuente de fase no existen; auditoría directa desde completadas.md. ChangesLogs.txt 2471-2495 contiene afirmaciones no corroboradas por HTML/motor actuales.
- **Hallazgos:** AUD-NG-254 y AUD-NG-255 nuevos ALTO/P1; ampliar AUD-NG-001, AUD-NG-168, AUD-NG-236, AUD-NG-239, AUD-NG-246, AUD-NG-248 y AUD-NG-250.
- **Evidencia:** motor curricular dentro de if(aulaCodigo), payload sin asignatura/grado/sección, índices de HorariosClase incompatibles, conflictos no declarado y errores silenciados; solo dos tipos de regla; esquema sin año/período/tipo de actividad; CRUD append-only sin historial/preview/lock; actor cliente-controlado; UI ausente; fetchApi sin token; suite solo comprueba estructura.
- **Tareas derivadas:** nuevas TASK-613 (modelo/ciclo de vida), TASK-614 (motor e integración) y TASK-615 (UI conectada). Ampliar TASK-516, TASK-519, TASK-533, TASK-567, TASK-598, TASK-605 y TASK-606.
- **Archivos inspeccionados:** Code.gs (84-155, 168-265, 465-585, 671-830, 4816-4880, 6335-6458, 6900-7120, 7493-7693, 13509-13650, 14000-14173); js/api.js (1-100); js/teacher.js (1512-1595); teacher-dashboard.html completo; academic-grading-suite.js (412 líneas); ChangesLogs 2471-2495; completadas 4487-4521; informes IMP-01/04; Pendientes blob.
- **SHAs:** Code.gs df87a2eea9f0ef79d0b966d03fd5bbe432003df5; api.js 6b24f666db30a811a8e9b38d466fc6001cf6dfa9; teacher.js c475fce5afcd28fca23e7b64398ad32b17773746; teacher-dashboard cbb9e6a272a7d8ad33f99727303305d950533e71; academic-grading-suite a22cb3ef376fe09e65c1b17c2f4f5125290bfba6; completadas f57f1aef832e81e44fc4f7ec36a852d50e464676; Pendientes 631b4c2dbf0e86d5704b63625382d73ccb8ceb3c; ChangesLogs 5b5cff1926b73a05d1b92087a7bf4b2db75326ff; metodología cf796728bb384a32537392df2f9c72a339fa03ee.
- **Pruebas:** inspección estática/manual, recuperación del blob y verificación Git. No ejecutados Apps Script runtime, HTTP/OAuth, DOM/navegador, Sheets productivas, generación/publicación real, concurrencia, rollback, Node ni E2E.
- **Nuevo:** AUDITORIAS/AUDITORIA_COMPLETADAS_TAREA-F7-IMP-18.md.
- **Actualizados:** Auditoria.txt, MapaDependencias.md, AUDITORIA_COMPLETADAS_PLAN.md y Contexto_personal.txt.
- **Sin cambios:** código, UI, pruebas, completadas.md, Pendientes.md, ChangesLogs.txt, metodología y rama base.
- **Última tarea auditada:** TAREA-F7-IMP-18.
- **Siguiente tarea exacta:** TAREA-F7-IMP-19, control de capacidad y distribución de estudiantes por sección (CA-F7-117..121).
===============================================================================

- **Origen del Hallazgo:** `AUDITORIA_FASE_7_PLANIFICACION_HORARIOS_RECURSOS.md` / Tarea F7-IMP-18 (P2 · Dependencias Curriculares)
- **Prioridad:** P2
- **Severidad/Clasificación:** Medio (Nueva capacidad de planificación académica avanzada)
- **Archivos Involucrados:**
  - `backend/academic-service/Code.gs`
  - `teacher-dashboard.html`
  - `js/teacher.js`
- **Dependencias Expuestas:** `CatalogoAsignaturas`, `MallaCurricular`, `F7-IMP-01`, `F7-IMP-04`
- **Descripción del Alcance:**
  Implementar la configuración de restricciones de co-requisito horario entre asignaturas (clases simultáneas requeridas, bloques estrictamente consecutivos o dictados secuenciales obligatorios) e integrarlas en el motor de validación.

  Requisitos Funcionales:
  1. Permitir representar las relaciones académicas que afecten a la planificación.
  2. Distinguir entre:
     - Actividades que deben coincidir en horario.
     - Actividades que no pueden coincidir.
     - Actividades que requieren una secuencia temporal.
     - Actividades que necesitan compartir recursos.
     - Actividades que deben permanecer separadas.
  3. Permitir asociar las restricciones con asignaturas, secciones o tipos de actividad, según corresponda.
  4. Validar que las relaciones no sean contradictorias.
  5. Considerar las dependencias al generar o reorganizar horarios.
  6. Explicar qué restricción impide una asignación.
  7. Permitir desactivar o modificar una relación con los permisos adecuados.
  8. Conservar el historial de cambios en las reglas.
  9. Evitar que las dependencias se apliquen a períodos o secciones ajenos a su ámbito.
  10. Permitir comprobar las consecuencias de una modificación antes de aplicarla.
- **Criterios de Aceptación:**
  - CA-F7-112: Una relación configurada se aplica únicamente a las asignaciones comprendidas en su ámbito.
  - CA-F7-113: Las relaciones obligatorias se respetan al validar y publicar horarios.
  - CA-F7-114: Las reglas contradictorias se identifican antes de generar un escenario.
  - CA-F7-115: El sistema explica las dependencias que impiden una asignación.
  - CA-F7-116: Los cambios en las reglas no alteran silenciosamente los registros históricos.
- **Estado:** Pendiente

---

<!-- ID: TASK-191 | Fuentes: Pendientes.md ; pendientes/Docente/Pendientes.md -->
### [ ] [TASK-191] Flujo de devolución con inspección física y derivación a incidencias
- **Origen del Hallazgo:** `AUDITORIA_FASE_20_BIBLIOTECA_RECURSOS_EDUCATIVOS.md` / Sección E, Sección F (PT-20-21) y Plan de Trabajo P1
- **Prioridad:** P1
- **Severidad/Clasificación:** Alta (Preservación del fondo bibliográfico, control de deterioro y reporte inmediato de averías)
- **Archivos Involucrados:**
  - `backend/accounting-service/Code.gs` (`processLibraryLoan`, `recordLibraryIncident`)
  - `BibliotecaPrestamos`
  - `BibliotecaEjemplares`
  - `BibliotecaIncidencias`
  - `js/accounting.js`
- **Dependencias Expuestas:** `BibliotecaPrestamos`, `BibliotecaEjemplares`, `F20-Task01`
- **Descripción del Alcance:**
  Al procesar una devolución con `accion: "Devolucion"`, el sistema cambia incondicionalmente el libro a `available` sin permitir evaluar el estado físico en que se entrega. Si el libro fue devuelto roto, rayado o sin páginas, vuelve a estar disponible para préstamo erróneamente.
  Requerimientos Funcionales Detallados:
  1. Inspección física obligatoria al devolver:
     - Permitir registrar en la devolución la condición física del material: `Excelente`, `Bueno`, `DeterioradoNormal`, `DañadoGrave`, `Incompleto/FaltanPaginas`.
     - Si la condición es `Excelente` o `Bueno`, cerrar el préstamo y marcar el ejemplar como `available`.
     - Si la condición es `DañadoGrave` o `Incompleto`, cambiar el estado del ejemplar a `maintenance` (en reparación) o `damaged` (dañado fuera de servicio).
     - Generar automáticamente la incidencia en `BibliotecaIncidencias` vinculada al préstamo y al usuario que entregó el material dañado.
  2. Cálculo de días de mora:
     - Calcular automáticamente si hubo retraso respecto a la `FechaDevolucionPrevista` y registrar los días de mora acumulados.
- **Criterios de Aceptación:**
  - Devolver un libro en buen estado lo restituye a disponibilidad para préstamo.
  - Devolver un libro dañado lo coloca en estado de reparación y registra la incidencia asociada al estudiante responsable.
  - Se calculan de forma exacta los días de retraso si el libro fue entregado después de la fecha límite.
- **Estado:** [ ] Pendiente

<!-- Fuente: RECUPERACION/Pendientes_RECUPERADO.md, líneas 7949-7974; clave TASK-192; asignación única: Docente -->

---

<!-- ID: TASK-192 | Fuentes: Pendientes.md ; pendientes/Docente/Pendientes.md -->
### [ ] [TASK-192] Renovaciones de préstamo con bloqueo automático por reservas en lista de espera
- **Origen del Hallazgo:** `AUDITORIA_FASE_20_BIBLIOTECA_RECURSOS_EDUCATIVOS.md` / Sección E, Sección C y Plan de Trabajo P1
- **Prioridad:** P1
- **Severidad/Clasificación:** Alta (Equidad en el acceso a recursos bibliográficos, control de lista de espera y límites de renovación)
- **Archivos Involucrados:**
  - `backend/accounting-service/Code.gs` (nueva función `renewLibraryLoan`, `processLibraryLoan`)
  - `BibliotecaPrestamos`
  - `BibliotecaReservas`
- **Dependencias Expuestas:** `BibliotecaPrestamos`, `BibliotecaReservas`, `F20-Task01`
- **Descripción del Alcance:**
  No existe la capacidad de renovar préstamos. Los usuarios deben devolver el libro físicamente y solicitarlo de nuevo, y no se comprueba si otros estudiantes están esperando la obra mediante una reserva activa.
  Requerimientos Funcionales Detallados:
  1. Función `renewLibraryLoan`:
     - Permitir solicitar la renovación de un préstamo activo antes de su vencimiento.
     - Validar que el usuario no haya excedido el número máximo de renovaciones permitidas por obra (predeterminado: máximo 1 renovación).
  2. Bloqueo por reservas pendientes:
     - Antes de conceder la renovación, verificar si existen solicitudes activas en `BibliotecaReservas` para la misma obra.
     - Si existen reservas en lista de espera de otros usuarios, bloquear la renovación obligando a entregar el libro en su fecha para atender a los estudiantes en espera.
- **Criterios de Aceptación:**
  - Un usuario puede renovar su préstamo extendiendo la fecha de vencimiento según las reglas de su rol.
  - Si la obra cuenta con una reserva pendiente de otro estudiante, el sistema rechaza la renovación informando de la lista de espera.
  - Se impide renovar un préstamo más de las veces autorizadas por la política de circulación.
- **Estado:** [ ] Pendiente

<!-- Fuente: RECUPERACION/Pendientes_RECUPERADO.md, líneas 8004-8030; clave TASK-194; asignación única: Docente -->

---

<!-- ID: TASK-195 | Fuentes: Pendientes.md ; pendientes/Docente/Pendientes.md -->
### [ ] [TASK-195] Asociación curricular de obras bibliográficas con asignaturas y niveles
- **Origen del Hallazgo:** `AUDITORIA_FASE_20_BIBLIOTECA_RECURSOS_EDUCATIVOS.md` / Sección E, Sección C (2.8) y Plan de Trabajo P1
- **Prioridad:** P1
- **Severidad/Clasificación:** Alta (Apoyo pedagógico, bibliografía recomendada por materia y pertinencia académica)
- **Archivos Involucrados:**
  - `backend/accounting-service/Code.gs` (nuevas funciones `linkBookToSubject`, `getBooksBySubject`)
  - Hoja `BibliotecaAsociacionesCurriculares`
  - `BibliotecaCatalogoObras`
  - `js/teacher.js`
- **Dependencias Expuestas:** `BibliotecaCatalogoObras`, Malla curricular académica
- **Descripción del Alcance:**
  Los libros del catálogo no están asociados con las asignaturas ni con los planes de estudio de la institución. Los docentes no pueden publicar listas de lecturas obligatorias o sugeridas para su clase directamente desde la biblioteca.
  Requerimientos Funcionales Detallados:
  1. Vínculo curricular de obras:
     - Asociar obras del catálogo a combinaciones de: Grado/Nivel educativo, Asignatura y Parcial/Período.
     - Clasificación pedagógica: `LecturaObligatoria`, `LecturaSugerida`, `MaterialConsultaTecnica`.
  2. Consulta de bibliografía de curso:
     - Permitir a los estudiantes de una clase consultar en un solo clic la bibliografía recomendada para sus materias activas y verificar en tiempo real si hay copias disponibles en la biblioteca física o enlaces en la biblioteca digital.
- **Criterios de Aceptación:**
  - Un docente puede vincular títulos del catálogo como lecturas recomendadas para su clase.
  - Los alumnos inscritos en la materia visualizan la lista bibliográfica con la disponibilidad de ejemplares.
- **Estado:** [ ] Pendiente

<!-- Fuente: RECUPERACION/Pendientes_RECUPERADO.md, líneas 8252-8275; clave TASK-203; asignación única: Docente -->

---

<!-- ID: TASK-216 | Fuentes: Pendientes.md ; pendientes/Docente/Pendientes.md -->
### [ ] [TASK-216] Compatibilidad con las plantillas oficiales de cuadros de calificaciones de SACE
- **Origen del Hallazgo:** `AUDITORIA_FASE_22_GESTION_DOCUMENTAL_FORMULARIOS_FIRMA_ELECTRONICA.md` / Sección E, Sección G y Plan de Trabajo TAREA 22-09
- **Prioridad:** P1
- **Severidad/Clasificación:** Alta (Compatibilidad con el sistema educativo oficial SACE de Honduras, llenado exacto de calificaciones y preservación de formato)
- **Archivos Involucrados:**
  - `backend/accounting-service/Code.gs` (`fillAndExportSACETemplate`, `validateSACETemplateFile`, `verifySACETemplateCompatibility`)
  - `js/teacher.js` (Cuadro de Calificaciones)
  - Archivos Excel oficiales SACE en repositorio
- **Dependencias Expuestas:** Cuadro de calificaciones docente, registros académicos, matrícula, asignaturas, grados y secciones, repositorio de plantillas SACE y mecanismo de procesamiento de archivos Excel.
- **Descripción del Alcance:**
  La plataforma administra calificaciones académicas, pero necesita exportar los resultados al formato oficial de cuadros de calificaciones de SACE completando correctamente el archivo oficial que el docente utiliza y entrega, sin reconstruirlo desde cero ni alterar su estructura original.
  Requerimientos Funcionales Detallados:
  1. Análisis y mapeo de las plantillas oficiales de SACE:
     - Localizar y examinar los archivos de cuadros de SACE disponibles en el repositorio.
     - Analizar cada archivo para determinar: hojas de cálculo incluidas, nombres y distribución, filas y columnas utilizadas, celdas combinadas, encabezados institucionales, centro educativo, año lectivo, grado, sección, jornada, asignatura, identificación del docente, lista de alumnos, columnas de calificaciones por parcial, totales/promedios, fórmulas preexistentes, validaciones de datos, formatos numéricos y áreas protegidas.
     - Determinar exactamente qué dato de la plataforma corresponde a cada celda del archivo oficial.
     - Reconocer las fórmulas que ya incorpora SACE y conservarlas intactas sin sustituirlas por valores estáticos calculados, salvo exigencia expresa de la plantilla.
  2. Reconocimiento y validación del archivo seleccionado:
     - Al seleccionar «Llenar cuadro de SACE» en el menú del cuadro de notas del docente, abrir el selector para elegir el archivo Excel oficial.
     - Analizar el archivo y comprobar: que corresponde a una plantilla SACE reconocida, que el grado coincide con el que califica el docente, que la sección coincide, que la asignatura corresponde, que el año lectivo es correcto y que la lista de alumnos coincide.
     - Si existe incompatibilidad, detener el proceso y explicar exactamente qué dato no coincide.
  3. Correspondencia estricta de alumnos y calificaciones:
     - Leer la lista de alumnos incluida en el archivo oficial y establecer correspondencia con la plataforma mediante identidad oficial (DNI) o comparación robusta de nombres (manejando mayúsculas, acentos, espacios y orden de apellidos).
     - Nunca asignar una calificación basándose en una coincidencia dudosa de nombres; si no es confiable, solicitar revisión.
     - Detectar alumnos ausentes en SACE o en la plataforma e informar discrepancias.
     - Colocar cada calificación en la celda correspondiente al alumno y parcial.
     - Respetar la escala de calificación; no convertir calificaciones vacías en ceros ni sustituir valores sin advertirlo.
  4. Conservación absoluta del formato del archivo oficial:
     - Modificar exclusivamente las celdas de calificaciones y datos autorizados del mapeo.
     - Conservar: nombre original del archivo, estructura y orden de hojas, celdas combinadas, fuentes, tamaños, bordes, colores, anchos de columna, fórmulas, configuración de impresión y áreas de impresión.
     - Prohibido convertir a CSV/PDF para reconstruir como Excel ni generar archivos nuevos con apariencia aproximada.
  5. Descarga automática del archivo completado:
     - Al terminar, iniciar automáticamente la descarga del archivo completado conservando el nombre original exacto, formato y extensión.
     - Mostrar confirmación con resumen de alumnos identificados y notas colocadas, advirtiendo si quedaron elementos sin correspondencia.
- **Criterios de Aceptación:**
  - [ ] Se identifican y analizan las plantillas SACE existentes en el repositorio documentando el mapeo.
  - [ ] La opción «Llenar cuadro de SACE» aparece en el menú de acciones del cuadro de calificaciones.
  - [ ] El sistema identifica asignatura, grado, sección y año lectivo del archivo seleccionado.
  - [ ] Se rechaza un archivo correspondiente a otra asignatura, grado o sección.
  - [ ] Se reconoce correctamente la lista de alumnos que ya contiene el archivo SACE.
  - [ ] Las calificaciones se asignan a los alumnos correctos sin que las vacías se conviertan en cero.
  - [ ] Las fórmulas originales y celdas ajenas al mapeo permanecen intactas.
  - [ ] El archivo conserva su nombre original, formato Excel, hojas, estilos y configuración de impresión.
  - [ ] La descarga comienza automáticamente y el archivo abre en Excel sin advertencias de reparación.
  - [ ] El sistema informa cualquier alumno o calificación que no haya podido procesarse.
- **Estado:** [ ] Pendiente

<!-- Fuente: RECUPERACION/Pendientes_RECUPERADO.md, líneas 8682-8710; clave TASK-217; asignación única: Docente -->

---

<!-- ID: TASK-217 | Fuentes: Pendientes.md ; pendientes/Docente/Pendientes.md -->
### [ ] [TASK-217] Administración de versiones y compatibilidad de plantillas SACE
- **Origen del Hallazgo:** `AUDITORIA_FASE_22_GESTION_DOCUMENTAL_FORMULARIOS_FIRMA_ELECTRONICA.md` / Sección E, Sección G y Plan de Trabajo TAREA 22-10
- **Prioridad:** P1
- **Severidad/Clasificación:** Alta (Gestión de cambios de formato oficial SACE, retrocompatibilidad y mapeo versionado)
- **Archivos Involucrados:**
  - `backend/accounting-service/Code.gs`
  - Hoja `PlantillasSACEVerificadas`
- **Dependencias Expuestas:** `F22-Task09`, repositorio de archivos SACE y mecanismo de procesamiento Excel.
- **Descripción del Alcance:**
  Las plantillas oficiales de SACE pueden cambiar entre períodos o años lectivos. Si el sistema utiliza posiciones fijas, una actualización del formato ministerial podría provocar que las notas se escriban en columnas erróneas.
  Requerimientos Funcionales Detallados:
  1. Catálogo versionado de plantillas SACE:
     - Separar el reconocimiento de plantillas de la escritura de calificaciones.
     - Registrar en `PlantillasSACEVerificadas`: Identificador, Versión, Año lectivo/vigencia, Tipo de cuadro, Grado o nivel aplicable, Asignatura aplicable, Estructura de hojas, Mapeo de celdas (`ColumnasMapJSON`), Reglas de identificación de alumnos y Reglas de conservación.
  2. Validación estructural previa:
     - Detectar cambios en encabezados, posiciones, nombres de hojas y celdas combinadas.
     - Identificar plantillas desconocidas o modificadas; evitar utilizar un mapeo antiguo cuando la estructura no coincida.
     - Permitir probar una plantilla nueva con archivos de ejemplo antes de habilitarla.
     - Mantener disponibles las versiones anteriores para procesar cuadros históricos.
- **Criterios de Aceptación:**
  - [ ] Se pueden registrar y administrar distintas versiones de plantillas SACE.
  - [ ] El sistema identifica la versión de la plantilla del archivo seleccionado.
  - [ ] Un archivo modificado de forma incompatible es rechazado con explicación clara.
  - [ ] Una nueva plantilla puede configurarse y probarse sin alterar las existentes.
  - [ ] Cada procesamiento registra la versión del mapeo utilizado.
- **Estado:** [ ] Pendiente

<!-- Fuente: RECUPERACION/Pendientes_RECUPERADO.md, líneas 10306-10335; clave TASK-263; asignación única: Docente -->

---

<!-- ID: TASK-263 | Fuentes: Pendientes.md ; pendientes/Docente/Pendientes.md -->
### [ ] [TASK-263] [P1] Migración de Asistencia y Registros Operativos Históricos Consolidados
- **Orden de Ejecución:** 9
- **Prioridad:** P1 (Alta)
- **Componentes Afectados:**
  - `backend/academic-service/Code.gs` (`importAttendanceHistoricalSummary`, `getAsistenciaEstudiante`)
  - Hojas: `AsistenciasDiarias`, `AsistenciasHistoricasConsolidadas`
- **Subcapacidades Relacionadas:** F29-10.
- **Estado de Partida:** Requiere mejoras.
- **Dependencias Principales:** [F29-Task01], [F29-Task02], [F29-Task03].
- **Problema Detectado y Riesgos:**
  La plataforma admite asistencia diaria detallada, pero muchas fuentes legadas solo conservan acumulados anuales o porcentajes de asistencia por ciclo. Forzar la creación de fechas ficticias o no admitir consolidados impide migrar el historial de conducta y asistencia.
- **Requisitos Funcionales y Técnicos Convergentes:**
  1. *Soporte para detalle diario y acumulados consolidados:*
     - Importar registros diarios cuando existan.
     - Crear tabla `AsistenciasHistoricasConsolidadas` para fuentes con totales por ciclo/parcial.
     - Diferenciar: asistencias, inasistencias justificadas, inasistencias injustificadas, retardos y porcentajes consolidados.
  2. *Preservación de fidelidad y reglas de integridad:*
     - Prohibición estricta: No inventar fechas individuales cuando el origen solo contiene totales acumulados.
     - Conservar ciclo, grado, sección, período y método de cálculo del porcentaje.
     - No mezclar acumulados históricos con la asistencia diaria del ciclo activo.
     - Detección de inconsistencias (ej. inasistencias superiores a los días lectivos oficiales).
- **Criterios de Aceptación:**
  - [ ] Se importan históricos de asistencia tanto en detalle diario como en consolidados anuales.
  - [ ] Los acumulados se muestran en los expedientes sin generar fechas ficticias.
  - [ ] Los registros históricos de asistencia no alteran los porcentajes del ciclo activo actual.
  - [ ] Los reportes diferencian claramente el nivel de detalle disponible.
- **Estado:** [ ] Pendiente

<!-- Fuente: RECUPERACION/Pendientes_RECUPERADO.md, líneas 10423-10449; clave TASK-269; asignación única: Docente -->

---

<!-- ID: TASK-269 | Fuentes: Pendientes.md ; pendientes/Docente/Pendientes.md -->
### [ ] [TASK-269] [P1] Importación y Exportación Integral de Información SACE
- **Orden de Ejecución:** 16
- **Prioridad:** P1 (Alta)
- **Componentes Afectados:**
  - `backend/accounting-service/Code.gs` (`importSACEDataFile`, `exportSACETemplateData`)
  - Módulos de compatibilidad SACE en `developer-service`
- **Subcapacidades Relacionadas:** F29-01, F29-03, F29-16.
- **Estado de Partida:** Implementada parcialmente.
- **Dependencias Principales:** [F29-Task01] a [F29-Task04], [F29-Task10].
- **Problema Detectado y Riesgos:**
  Existe validación de plantillas SACE, pero falta el flujo completo de importación masiva de calificaciones y matrículas desde los archivos oficiales ministeriales y la exportación verificada con perfiles versionados.
- **Requisitos Funcionales y Técnicos Convergentes:**
  1. *Importador de archivos oficiales SACE:*
     - Reconocer automáticamente plantilla, ciclo, grado, sección y centro educativo.
     - Validar RNE (13 dígitos) y mapear con identidades institucionales existentes.
     - Importar calificaciones y matrículas con vista previa obligatoria.
  2. *Exportación y revalidación:*
     - Exportar datos al formato ministerial oficial exacto y comparar contra los registros de origen.
     - Conservar perfiles versionados ante cambios futuros en las plantillas de la Secretaría de Educación.
- **Criterios de Aceptación:**
  - [ ] Importa plantillas SACE oficiales asociando los registros a los expedientes institucionales correspondientes.
  - [ ] Exporta datos en el formato ministerial exacto pasando la validación estructural.
  - [ ] Se conserva la versión de plantilla utilizada.
- **Estado:** [ ] Pendiente

<!-- Fuente: RECUPERACION/Pendientes_RECUPERADO.md, líneas 13047-13061; clave TASK-357; asignación única: Docente -->

---

<!-- ID: TASK-517 | Fuentes: AUDITORIAS/AUDITORIA_COMPLETADAS_TAREA-F7-IMP-01.md -->
### [ ] [TASK-517] Unificar calendario y contexto temporal de las asignaciones
- **Hallazgo de origen:** AUD-NG-236 / H5-H6; amplía AUD-NG-168.
- **Severidad:** Alto.
- **Objetivo:** validar asignaciones dentro de su año, período y fechas efectivas con un esquema de calendario único.
- **Acción ejecutable:** definir contrato canónico de CalendarioAcademico; actualizar inicializador/lectores; transmitir anoId, período y fecha efectiva hasta checkScheduleConflict; filtrar carga docente por período y estados pertinentes.
- **Archivos/módulos afectados:** backend/academic-service/Code.gs; teacher-dashboard.html; js/teacher.js.
- **Dependencias y riesgos:** CalendarioAcademico, HorariosClase, HorariosLaborales, PeriodosAcademicos, AnosLectivos y reportes consumidores.
- **Alcance:** validación de fechas y períodos de la asignación; no rediseñar el calendario institucional.
- **Criterios de aceptación:** todos los consumidores comparten el mismo esquema; una fecha no lectiva activa bloquea asignaciones ordinarias; una fecha/período distinto no genera conflicto artificial; la carga docente solo suma asignaciones vigentes aplicables.
- **Prioridad:** P1.
- **Estado:** Pendiente.
- **Evidencia de cierre:** pendiente de implementación, pruebas y revisión.

---

<!-- ID: TASK-522 | Fuentes: AUDITORIAS/AUDITORIA_COMPLETADAS_TAREA-F7-IMP-02.md -->
### [ ] [TASK-522] Implementar disponibilidad por intervalos y filtros temporales/organizativos
- **Hallazgo de origen:** AUD-NG-237 / H2/H4/H5; amplía AUD-NG-168.
- **Severidad:** Alto.
- **Objetivo:** calcular disponibilidad simultánea de docente, sección, aula y recursos en año/período/fecha concretos.
- **Acción ejecutable:** incorporar filtros año, período, jornada, sede, grado, sección y estado; calcular intervalos ocupados/libres por entidad; excluir estados no vigentes; relacionar mantenimientos y recursos; sustituir capacidad fija de 40h por disponibilidad configurable.
- **Archivos/módulos afectados:** backend/academic-service/Code.gs; js/teacher.js; teacher-dashboard.html.
- **Dependencias y riesgos:** AnosLectivos, PeriodosAcademicos, JornadasAcademicas, OfertaAcademica, AsignacionesDocentes, SedesAulas, MantenimientoAulas y catálogo de recursos.
- **Alcance:** consultas y visualización de disponibilidad; la validación final antes de guardar corresponde a F7-IMP-01.
- **Criterios de aceptación:** consulta por intervalo devuelve ocupación y huecos correctos; filtros combinados son acumulativos; no mezcla períodos/años; recursos simultáneos se validan con fixtures.
- **Prioridad:** P1.
- **Estado:** Pendiente.
- **Evidencia de cierre:** pendiente de implementación, pruebas y revisión.

---

<!-- ID: TASK-527 | Fuentes: AUDITORIAS/AUDITORIA_COMPLETADAS_TAREA-F7-IMP-03.md -->
### [ ] [TASK-527] Ampliar generación de candidatos y agrupación de conflictos
- **Hallazgo de origen:** AUD-NG-238 / H2-H3.
- **Severidad:** Alto.
- **Objetivo:** evaluar alternativas de docente, aula, horario, día, recurso y reprogramación.
- **Acción ejecutable:** obtener todos los registros participantes; agrupar por docente/aula/sección/recurso/actividad; generar candidatos dinámicos según jornada y disponibilidad; validar cada candidato contra todas las restricciones obligatorias y devolver motivos de rechazo.
- **Archivos/módulos afectados:** backend/academic-service/Code.gs; js/teacher.js.
- **Dependencias y riesgos:** checkScheduleConflict, getClassSchedules, getTeacherTeachingLoad, getClassroomResources, asignaciones, calendario y recursos.
- **Alcance:** propuestas de resolución; la aplicación persistente queda en TASK-529/530.
- **Criterios de aceptación:** alternativas cubren sustituto/aula/horario/recurso/reprogramación; se identifican todas las asignaciones; candidatos inválidos incluyen regla e intervalo; no se presenta una opción incompleta como válida.
- **Prioridad:** P1.
- **Estado:** Pendiente.
- **Evidencia de cierre:** pendiente de implementación, pruebas y revisión.

---

<!-- ID: TASK-533 | Fuentes: AUDITORIAS/AUDITORIA_COMPLETADAS_TAREA-F7-IMP-04.md -->
### [ ] [TASK-533] Implementar asignación masiva basada en restricciones y preferencias
- **Hallazgo de origen:** AUD-NG-239 / H3-H4.
- **Severidad:** Alto.
- **Objetivo:** generar soluciones que consideren frecuencia, duración, disponibilidad, recursos, jornadas y preferencias autorizadas.
- **Acción ejecutable:** reemplazar primera opción greedy por motor de planificación; aplicar restricciones obligatorias primero; optimizar preferencias después; considerar varias sesiones por oferta, duración real, docentes/aulas/recursos compatibles y asignaciones bloqueadas.
- **Archivos/módulos afectados:** backend/academic-service/Code.gs.
- **Dependencias y riesgos:** F7-IMP-01/02/03, disponibilidad docente, secciones, aulas, recursos, períodos y reglas académicas.
- **Alcance:** generación de escenarios; mantener separación entre hard constraints y soft preferences.
- **Criterios de aceptación:** ninguna solución viola restricciones obligatorias; preferencias nunca anulan bloqueos; parámetros de duración/hora son efectivos; asignaciones bloqueadas permanecen intactas.
- **Prioridad:** P1.
- **Estado:** Pendiente.
- **Evidencia de cierre:** pendiente de implementación, pruebas y revisión.

---

<!-- ID: TASK-534 | Fuentes: AUDITORIAS/AUDITORIA_COMPLETADAS_TAREA-F7-IMP-04.md -->
### [ ] [TASK-534] Explicar restricciones imposibles y comparar impacto antes/después
- **Hallazgo de origen:** AUD-NG-239 / H5.
- **Severidad:** Alto.
- **Objetivo:** permitir decidir con información completa antes de aplicar un escenario.
- **Acción ejecutable:** guardar causas por oferta/asignación no ubicada; calcular carga docente, utilización de aulas/recursos y períodos libres en horario actual/propuesto; producir diferencias y consecuencias.
- **Archivos/módulos afectados:** backend/academic-service/Code.gs; js/teacher.js; teacher-dashboard.html.
- **Dependencias y riesgos:** DTO de horarios, reportes de carga, recursos y filtros de matriz.
- **Alcance:** diagnóstico y comparación; no publicar ni alterar el escenario.
- **Criterios de aceptación:** cada pendiente indica restricciones concretas; comparación antes/después por docente/aula/recurso y período; datos reproducibles por escenarioId.
- **Prioridad:** P1.
- **Estado:** Pendiente.
- **Evidencia de cierre:** pendiente de implementación, pruebas y revisión.

---

<!-- ID: TASK-538 | Fuentes: AUDITORIAS/AUDITORIA_COMPLETADAS_TAREA-F7-IMP-05.md -->
### [ ] [TASK-538] Definir políticas de carga docente por contrato y jornada
- **Hallazgo de origen:** AUD-NG-240 / H3-H7.
- **Severidad:** Alto.
- **Objetivo:** resolver límites efectivos por docente sin inventar valores institucionales.
- **Acción ejecutable:** modelar contrato, jornada, vigencia, política institucional, límites semanales y separación de horas lectivas/adicionales; distinguir ausencia de política de límite explícito; versionar la regla aplicada.
- **Archivos/módulos afectados:** backend/academic-service/Code.gs; esquema institucional de políticas.
- **Dependencias y riesgos:** Usuarios, expedientes laborales, HorariosLaborales, AnosLectivos y reportes de carga.
- **Criterios de aceptación:** cada docente resuelve una política vigente trazable; sin política aplicable no se aplica un límite inventado; los cambios conservan vigencia e historial.
- **Prioridad:** P1.
- **Estado:** Pendiente.

---

<!-- ID: TASK-539 | Fuentes: AUDITORIAS/AUDITORIA_COMPLETADAS_TAREA-F7-IMP-05.md -->
### [ ] [TASK-539] Corregir el cálculo de carga lectiva por período y estado
- **Hallazgo de origen:** AUD-NG-240 / H4-H5.
- **Severidad:** Alto.
- **Objetivo:** calcular carga semanal solo con asignaciones lectivas vigentes y aplicables.
- **Acción ejecutable:** aplicar anoId/período; definir estados computables; excluir borradores, cancelados e inactivos; resolver frecuencia de sesiones y duplicados; conservar exclusión del bloque editado.
- **Archivos/módulos afectados:** backend/academic-service/Code.gs.
- **Dependencias y riesgos:** HorariosClase, OfertaAcademica, AnosLectivos, PeriodosAcademicos y versiones de horario.
- **Criterios de aceptación:** cambios de año/período no se mezclan; borradores/cancelados no inflan carga oficial; la frecuencia genera minutos semanales reproducibles.
- **Prioridad:** P1.
- **Estado:** Pendiente.

---

<!-- ID: TASK-540 | Fuentes: AUDITORIAS/AUDITORIA_COMPLETADAS_TAREA-F7-IMP-05.md -->
### [ ] [TASK-540] Implementar reglas de jornada, descansos y actividades adicionales
- **Hallazgo de origen:** AUD-NG-240 / H5.
- **Severidad:** Alto.
- **Objetivo:** evaluar carga laboral integral sin confundir horas lectivas y responsabilidades adicionales.
- **Acción ejecutable:** modelar límites diarios, número de sesiones, períodos consecutivos, descansos mínimos, disponibilidad parcial y actividades adicionales; aplicar solo reglas configuradas y vigentes.
- **Archivos/módulos afectados:** backend/academic-service/Code.gs; modelo de políticas y actividades.
- **Dependencias y riesgos:** HorariosLaborales, HorariosClase, calendario, jornada/contrato y responsabilidades institucionales.
- **Criterios de aceptación:** cada regla devuelve el cálculo y causa; descansos/tiempos libres no se contabilizan como docencia; responsabilidades adicionales se muestran separadas; sin política no se inventa una regla.
- **Prioridad:** P1.
- **Estado:** Pendiente.

---

<!-- ID: TASK-546 | Fuentes: AUDITORIAS/AUDITORIA_COMPLETADAS_TAREA-F7-IMP-06.md -->
### [ ] [TASK-546] Aplicar el ciclo de vida y la vigencia temporal del mantenimiento
- **Hallazgo de origen:** AUD-NG-241 / H2-H3.
- **Severidad:** Alta.
- **Objetivo:** impedir asignaciones únicamente durante intervalos reales de indisponibilidad.
- **Acción concreta:** validar fechas y orden del intervalo; definir estados Programado, EnProceso, Completado y Cancelado; comparar fecha/intervalo de clase con mantenimiento; sincronizar estado del espacio sin bloqueos permanentes; conservar historial y actor de cada transición.
- **Archivos/módulos afectados:** backend/academic-service/Code.gs; SedesAulas; MantenimientoAulas.
- **Dependencias:** checkScheduleConflict, saveClassroomMaintenance, getClassroomResources, HorariosClase y calendario.
- **Alcance técnico:** intersección de intervalos, zona horaria institucional, validación de solapamientos y transición segura de estados.
- **Criterios de aceptación:** una asignación dentro del intervalo se rechaza; una asignación fuera del intervalo se permite; los intervalos inválidos se rechazan; completar/cancelar mantenimiento restablece la disponibilidad efectiva sin borrar historial.
- **Prioridad:** P1.
- **Estado:** Pendiente.

---

<!-- ID: TASK-547 | Fuentes: AUDITORIAS/AUDITORIA_COMPLETADAS_TAREA-F7-IMP-06.md -->
### [ ] [TASK-547] Modelar equipamiento y recursos compartidos o exclusivos
- **Hallazgo de origen:** AUD-NG-241 / H4.
- **Severidad:** Alta.
- **Objetivo:** validar que el espacio y los recursos físicos satisfagan las necesidades de cada actividad.
- **Acción concreta:** sustituir el texto libre como única fuente por catálogo de recursos, cantidades, requisitos de actividad, compatibilidad y política de simultaneidad/exclusividad; integrar reservas y disponibilidad al validador.
- **Archivos/módulos afectados:** backend/academic-service/Code.gs; modelo de SedesAulas y catálogo físico de recursos; js/teacher.js.
- **Dependencias:** checkScheduleConflict, getScheduleConflictResolutionAlternatives, HorariosClase y catálogo institucional.
- **Alcance técnico:** relaciones espacio-recurso, requisitos por actividad, unidades disponibles y exclusividad por intervalo.
- **Criterios de aceptación:** un espacio incompatible se rechaza; un recurso exclusivo no se asigna a dos actividades simultáneas; recursos compartibles respetan cantidad disponible; las alternativas cumplen los mismos requisitos.
- **Prioridad:** P1.
- **Estado:** Pendiente.

---

<!-- ID: TASK-549 | Fuentes: AUDITORIAS/AUDITORIA_COMPLETADAS_TAREA-F7-IMP-06.md -->
### [ ] [TASK-549] Consultar ocupación, clases afectadas y alternativas compatibles
- **Hallazgo de origen:** AUD-NG-241 / H3-H4-H6.
- **Severidad:** Alta.
- **Objetivo:** mostrar la utilización real de espacios y permitir resolver indisponibilidades antes de confirmar cambios.
- **Acción concreta:** consultar reservas por día, semana, período y recurso; al crear/reprogramar mantenimiento, enumerar clases futuras afectadas; generar alternativas que validen fecha, capacidad, equipamiento, disponibilidad y exclusividad.
- **Archivos/módulos afectados:** backend/academic-service/Code.gs; js/teacher.js; teacher-dashboard.html.
- **Dependencias:** HorariosClase, MantenimientoAulas, SedesAulas, checkScheduleConflict y getScheduleConflictResolutionAlternatives.
- **Alcance técnico:** consultas temporales, impacto antes/después y alternativas explicables sin mutaciones durante la vista previa.
- **Criterios de aceptación:** la ocupación coincide con reservas vigentes; las clases afectadas se identifican antes de confirmar; ninguna alternativa viola capacidad, equipamiento, mantenimiento o exclusividad.
- **Prioridad:** P1.
- **Estado:** Pendiente.

---

<!-- ID: TASK-552 | Fuentes: AUDITORIAS/AUDITORIA_COMPLETADAS_TAREA-F7-IMP-07.md -->
### [ ] [TASK-552] Normalizar el modelo de programación y la configuración institucional de evaluaciones
- **Hallazgo de origen:** AUD-NG-242 / H2-H3.
- **Severidad:** Alta.
- **Objetivo:** separar la fecha de aplicación de la fecha límite y representar el contexto completo de cada evaluación.
- **Acción ejecutable:** versionar/migrar el esquema de Examenes para incorporar fecha efectiva, hora/duración, año/período, grupo/oferta, tipo evaluativo, docente, aula y recursos; definir contrato de configuración institucional por ámbito sin introducir límites predeterminados no autorizados.
- **Archivos/módulos afectados:** backend/exam-service/Code.gs; backend/academic-service/Code.gs; hojas Examenes y ReglasAcademicas.
- **Dependencias y riesgos:** createExam/updateExam/getAllExams/getStudentExams; getAcademicRules/saveAcademicRule; compatibilidad de filas históricas y referencias de calificaciones.
- **Alcance:** migración no destructiva, identificadores estables, valores explícitos y compatibilidad de lectura con registros anteriores.
- **Criterios de aceptación:** FechaEvaluacion es independiente de FechaLimite; los campos requeridos tienen encabezados/versionado; el tipo distingue ordinario/recuperación/otro; las reglas se consultan por ámbito y no se inventa un límite cuando no existe.
- **Prioridad:** P1.
- **Estado:** Pendiente.
- **Evidencia de cierre:** pendiente.

---

<!-- ID: TASK-553 | Fuentes: AUDITORIAS/AUDITORIA_COMPLETADAS_TAREA-F7-IMP-07.md -->
### [ ] [TASK-553] Implementar el motor configurable de carga, coincidencia y separación entre evaluaciones
- **Hallazgo de origen:** AUD-NG-242 / H1-H2.
- **Severidad:** Alta.
- **Objetivo:** detectar incompatibilidades antes de crear o modificar una evaluación.
- **Acción ejecutable:** ampliar checkExamSchedulingConflict para aplicar límites diarios/por intervalo solo cuando estén configurados, períodos mínimos de separación, tipos evaluativos y ámbito compuesto de grupo (año, período, grado, sección/oferta); excluir el propio registro durante reprogramación y resolver estudiantes/grupos afectados desde fuentes autorizadas.
- **Archivos/módulos afectados:** backend/exam-service/Code.gs; hojas Examenes, OfertaAcademica, Matriculas y ReglasAcademicas.
- **Dependencias y riesgos:** TASK-552; estados de examen, períodos académicos y modelo de matrícula; evitar falsos positivos entre secciones homónimas.
- **Alcance:** un único motor compartido por creación, actualización, simulación y confirmación; no aceptar valores de conteo/grupo no verificados desde el cliente.
- **Criterios de aceptación:** límite ausente no bloquea por un valor inventado; límite configurado se aplica; separación temporal se respeta; solo colisiona el mismo grupo/contexto; se devuelve lista verificable de conflictos y afectados.
- **Prioridad:** P1.
- **Estado:** Pendiente.
- **Evidencia de cierre:** pendiente.

---

<!-- ID: TASK-555 | Fuentes: AUDITORIAS/AUDITORIA_COMPLETADAS_TAREA-F7-IMP-07.md -->
### [ ] [TASK-555] Integrar conflictos de docentes, aulas y recursos físicos en la programación evaluativa
- **Hallazgo de origen:** AUD-NG-242 / H3; depende de los contratos de TASK-552 y amplía las tareas de espacios TASK-545..TASK-551.
- **Severidad:** Alta.
- **Objetivo:** impedir solapamientos de evaluaciones con disponibilidad docente, aulas y recursos reservables.
- **Acción ejecutable:** consultar docente asignado, horario, duración, aula, mantenimiento, reservas y recursos compartidos/exclusivos; validar conflictos por intervalo y grupo; devolver cada causa de incompatibilidad.
- **Archivos/módulos afectados:** backend/exam-service/Code.gs; backend/academic-service/Code.gs; hojas HorariosClase, SedesAulas, MantenimientoAulas y catálogo físico de recursos.
- **Dependencias y riesgos:** TASK-545..TASK-551 y TASK-552..TASK-554; no duplicar el catálogo físico de recursos ni la lógica común de disponibilidad.
- **Alcance:** consumir servicios/contratos comunes y evitar escrituras durante la validación.
- **Criterios de aceptación:** se detecta docente ocupado, aula ocupada/no disponible y recurso insuficiente/exclusivo; la validación no crea ni modifica reservas; las causas se muestran separadas y trazables.
- **Prioridad:** P1.
- **Estado:** Pendiente.
- **Evidencia de cierre:** pendiente.

---

<!-- ID: TASK-605 | Fuentes: AUDITORIAS/AUDITORIA_COMPLETADAS_TAREA-F7-IMP-15.md -->
### [ ] [TASK-605] Unificar la exclusión mutua de todas las mutaciones de horarios y recursos
- **Hallazgo de origen:** AUD-NG-250, secciones 3.1 y 3.6.
- **Severidad:** Alto.
- **Objetivo:** impedir que cualquier escritor relacionado cambie horarios, disponibilidad docente o recursos mientras otra operación está validando y confirmando una asignación incompatible.
- **Acción ejecutable:** centralizar la adquisición/liberación del bloqueo y aplicarla de forma consistente a creación, edición, eliminación, importación, publicación, generación automática, copia, restauración, plantillas, preferencias laborales, recursos y mantenimiento. Evitar rutas públicas que omitan la exclusión; reducir el trabajo dentro de la sección crítica y medir la espera/duración.
- **Archivos/módulos afectados:** `backend/academic-service/Code.gs`; pruebas de regresión relacionadas.
- **Dependencias y riesgos:** LockService, `checkScheduleConflict`, HorariosClase, SedesAulas, HorariosLaborales, MantenimientoAulas, TASK-587, TASK-598 y TAREA-F7-IMP-15. Un bloqueo global excesivo puede afectar operaciones no relacionadas; evaluar alcance y duración sin dejar escritores sin protección.
- **Alcance:** operaciones de planificación de horarios y recursos vinculados; no rediseñar otros servicios fuera de esta tarea.
- **Criterios de aceptación:** todos los escritores del conjunto usan un mecanismo común; dos operaciones concurrentes incompatibles no pueden confirmar ambas; el bloqueo se libera en éxito/error/timeout; el timeout tiene código estable y permite reintentar; se mide duración y no se introducen bloqueos anidados.
- **Prioridad:** P1.
- **Estado:** Pendiente.
- **Evidencia de cierre:** pendiente de implementación, pruebas y revisión.

---

<!-- ID: TASK-607 | Fuentes: AUDITORIAS/AUDITORIA_COMPLETADAS_TAREA-F7-IMP-16.md -->
### [ ] [TASK-607] Implementar el ciclo de vida temporal y la resolución efectiva de sustituciones
- **Hallazgo de origen:** AUD-NG-168 ampliado.
- **Severidad:** Alto.
- **Objetivo:** garantizar que cada sustitución sea efectiva únicamente dentro de su intervalo y que al vencer se restituya la asignación titular para las fechas posteriores, manteniendo historial.
- **Acción ejecutable:** validar fechas obligatorias y ordenadas; definir estados canónicos (Programada/Activa/Vencida/Cancelada o contrato equivalente); resolver sustituto por fecha de la clase en todas las consultas; no elegir la primera fila sin considerar vigencia; persistir/derivar vencimiento de forma consistente; diferenciar sustitución temporal de reasignación permanente; conservar titular y versiones históricas.
- **Archivos/módulos:** `backend/academic-service/Code.gs`, esquema `AsignacionesDocentes`, `getStudentSchedule`, `getIndividualCalendar`, `getTeacherAssignments`, `getCoordinatorOverview`, `syncAcademicScheduleIntegrity`.
- **Dependencias:** AUD-NG-168, TASK-585, TASK-591, TASK-587.
- **Criterios verificables:** antes del inicio se presenta titular; durante el intervalo se presenta sustituto; después del fin vuelve a presentarse titular; un período vacío/invertido se rechaza; los registros históricos no se sobrescriben; todas las vistas usan el mismo resolver y estados; una sustitución cancelada deja de ser efectiva.
- **Prioridad:** P1. **Estado:** Pendiente.

---

<!-- ID: TASK-608 | Fuentes: AUDITORIAS/AUDITORIA_COMPLETADAS_TAREA-F7-IMP-16.md -->
### [ ] [TASK-608] Implementar planificación, previsualización y aplicación multibloque de sustituciones
- **Hallazgo de origen:** AUD-NG-168 ampliado; AUD-NG-250 ampliado.
- **Severidad:** Alto.
- **Objetivo:** localizar todos los bloques/actividades afectados y aplicar una sustitución relacionada a varios horarios sin omitir asignaturas ni crear ofertas ficticias.
- **Acción ejecutable:** aceptar IDs explícitos de horarios/ofertas afectadas; construir una vista previa por bloque con docente titular, grupo, asignatura, aula, período y sustituto; comprobar disponibilidad por fecha/día/hora, carga laboral, jornada/turnos/vacaciones, aula y requisitos académicos; registrar relación sustitución-bloque; confirmar el lote con operación identificable, lock, versión/idempotencia y all-or-none o recuperación/reconciliación; preservar la asignación titular.
- **Archivos/módulos:** `backend/academic-service/Code.gs`, `js/teacher.js`, `teacher-dashboard.html`, `AsignacionesDocentes`, `HorariosClase`.
- **Dependencias:** TASK-605, TASK-606, TAREA-F7-IMP-15, TASK-173, TASK-598, TASK-585, TASK-607.
- **Criterios verificables:** preview no escribe; todos los bloques elegidos aparecen con IDs; cada conflicto identifica el bloque y razón; no se crea una OfertaAcademica como efecto colateral; el lote no deja asignaciones parciales; reintento no duplica; el titular se conserva y la sustitución queda vinculada a cada bloque.
- **Prioridad:** P1. **Estado:** Pendiente.

---

<!-- ID: TASK-613 | Fuentes: AUDITORIAS/AUDITORIA_COMPLETADAS_TAREA-F7-IMP-18.md -->
### [ ] [TASK-613] Definir el modelo canónico y ciclo de vida de las restricciones curriculares
- **Hallazgo de origen:** AUD-NG-255, H2.
- **Severidad:** Alto.
- **Objetivo:** persistir relaciones con tipo, ámbito, vigencia, actor y versiones inequívocas.
- **Acción ejecutable:** definir esquema versionado con asignaturas/plan, tipo, año/período, grado/sección y tipo de actividad/recursos; validar IDs/tipos; implementar alta, edición, desactivación y consulta filtrada; registrar historial inmutable con _verifiedUserId, fecha y motivo; agregar bloqueo/idempotencia y preview.
- **Archivos/módulos afectados:** backend/academic-service/Code.gs; ROLE_PERMISSIONS; validateRolePermission/validateContextualAccess; RestriccionesCurriculares e historial; tests/regression.
- **Dependencias y riesgos:** AUD-NG-001/168/255; TASK-516/567/605/606; CatalogoAsignaturas, PlanAsignaturas, MallaCurricularDist, AnosLectivos y PeriodosAcademicos. Migrar reglas antiguas sin perder su ámbito.
- **Alcance:** contrato y ciclo de vida; no implementar el motor ni la UI completa.
- **Criterios de aceptación:** esquema con vigencia/ámbito; IDs/tipos validados; edición/desactivación autorizadas; historial inmutable y atribuible; contradicciones comparadas en el mismo ámbito; preview sin persistir.
- **Prioridad:** P1.
- **Estado:** Pendiente.
- **Evidencia de cierre:** pendiente de implementación, pruebas de migración/concurrencia/historial y revisión independiente.

---

<!-- ID: TASK-614 | Fuentes: AUDITORIAS/AUDITORIA_COMPLETADAS_TAREA-F7-IMP-18.md -->
### [ ] [TASK-614] Integrar el motor de dependencias curriculares en todas las rutas de planificación
- **Hallazgo de origen:** AUD-NG-254, H1.
- **Severidad:** Alto.
- **Objetivo:** aplicar las cinco clases de relaciones antes de crear, reorganizar, importar, restaurar o publicar horarios.
- **Acción ejecutable:** resolver OfertaID a AsignaturaID/plan/grado/sección/año/período; normalizar HorariosClase; implementar coincidencia, no coincidencia, secuencia, recursos compartidos y separación; evaluar intervalos/ámbitos; ejecutar independientemente de aulaCodigo; devolver bloqueos/advertencias estructurados con ID de regla y explicación; integrar create/edit, generación, importación, copia, plantilla, restore, preview y publicación; fallar de forma cerrada ante errores de configuración.
- **Archivos/módulos afectados:** backend/academic-service/Code.gs; checkScheduleConflict y consumidores de planificación; tests/regression.
- **Dependencias y riesgos:** TASK-613; TASK-519/533/598; AUD-NG-168/236/239/248; F7-IMP-01/04. Evitar confundir ID de oferta con ID de asignatura.
- **Alcance:** motor e integración; no duplicar CRUD ni catálogo.
- **Criterios de aceptación:** casos positivos/negativos por tipo; reglas solo afectan ámbito; publicación revalida; razones identifican regla/asignaturas/horario; ningún error se ignora.
- **Prioridad:** P1.
- **Estado:** Pendiente.
- **Evidencia de cierre:** pendiente de pruebas del motor, rutas y revisión independiente.

---

<!-- ID: TASK-623 | Fuentes: AUDITORIAS/AUDITORIA_COMPLETADAS_TAREA-F7-IMP-22.md -->
### [ ] [TASK-623] Normalizar el contrato de plantillas y la selección de componentes reutilizables
- **Hallazgo de origen:** AUD-NG-266.
- **Severidad/Prioridad:** ALTO/P1.
- **Objetivo y acción:** definir el esquema canónico de HorariosClase y una estructura versionada de plantilla; resolver período/oferta fuente; corregir la extracción de filas; permitir seleccionar distribución semanal, períodos, asignaturas, secciones y preferencias; excluir docentes/aulas/asignaciones por defecto cuando deban revalidarse; impedir guardar una plantilla vacía como éxito.
- **Archivos/módulos:** backend/academic-service/Code.gs, PlantillasHorarios, HorariosClase y contratos de consulta.
- **Dependencias:** AUD-NG-168, AUD-NG-236, AUD-NG-241 y sus tareas de esquema/relaciones canónicas.
- **Criterios verificables:** filas de origen se recuperan con el esquema canónico; la plantilla contiene solo componentes seleccionados; docente/aula no se heredan sin decisión explícita y validación; referencias fuente/período son identificables; una plantilla vacía o incompatible produce error explícito; aplicar no modifica su versión original.
- **Estado:** Pendiente.

---

<!-- ID: TASK-624 | Fuentes: AUDITORIAS/AUDITORIA_COMPLETADAS_TAREA-F7-IMP-22.md -->
### [ ] [TASK-624] Implementar validación, previsualización y confirmación segura de plantillas
- **Hallazgo de origen:** AUD-NG-267.
- **Severidad/Prioridad:** ALTO/P1.
- **Objetivo y acción:** resolver referencias contra catálogos del período destino; comprobar oferta, asignatura, docente, aula, disponibilidad y colisiones de sección; pasar claves canónicas al validador; bloquear la aplicación ante conflictos o referencias faltantes; mostrar propuesta y permitir ajustes antes de confirmar; crear únicamente borradores y mantener publicación como acción separada.
- **Archivos/módulos:** backend/academic-service/Code.gs, checkScheduleConflict, applyScheduleTemplate y controladores UI.
- **Dependencias:** TASK-623, AUD-NG-236, AUD-NG-168, F7-IMP-01/F7-IMP-02.
- **Criterios verificables:** cada referencia faltante se presenta antes de confirmar; conflictos de aula/docente/oferta bloquean la escritura; el resultado de validación contiene detalles reales; el modo preview no muta hojas; ajustes vuelven a validar; confirmar crea borradores con esquema canónico y nunca publica automáticamente.
- **Estado:** Pendiente.

---

<!-- ID: TASK-626 | Fuentes: AUDITORIAS/AUDITORIA_COMPLETADAS_TAREA-F7-IMP-23.md -->
### [ ] [TASK-626] Integrar el flujo de impresión docente con filtros y vista previa
- **Hallazgo de origen:** AUD-NG-270.
- **Severidad/Prioridad:** ALTO/P1.
- **Objetivo y acción:** incorporar en teacher-dashboard.html los controles, modal, vista previa y contenedores que requiere js/teacher.js; permitir seleccionar perspectiva docente/sección/aula, período e intervalo de fechas; cargar solo el conjunto filtrado y autorizado; conectar los eventos sin fallback a imprimir toda la página.
- **Archivos/módulos:** teacher-dashboard.html, js/teacher.js, backend/academic-service/Code.gs, css/style.css.
- **Dependencias:** AUD-NG-246, AUD-NG-247, TASK-584..TASK-589, AUD-NG-161.
- **Criterios verificables:** los nodos existen y están conectados; la selección modifica exactamente el dataset del preview; el documento no contiene filas fuera del filtro; los errores de carga se muestran y no se presentan como horarios vacíos; el control de rol/ámbito se valida en servidor.
- **Estado:** Pendiente.

---

<!-- ID: TASK-648 | Fuentes: AUDITORIAS/AUDITORIA_COMPLETADAS_F8-TASK04.md -->
### [ ] [TASK-648] Incorporar regresión funcional de procesos académicos
- Hallazgo: AUD-NG-293. Severidad: Alto.
- Objetivo: probar flujos de docentes, jornalizaciones, sílabos, eventos, horarios y tareas.
- Acción: fixtures/dobles aislados; invocar contratos y operaciones de cada flujo; validar estados, reglas, errores y persistencia simulada.
- Archivos: suite modular-dashboard; servicios USER/ACADEMIC/TASK/EXAM y DEVELOPER.
- Dependencias/riesgos: reglas académicas, datos sintéticos y contratos.
- Alcance: sin escrituras productivas.
- Aceptación: casos positivos, negativos y límite por flujo; resultados individuales reproducibles.
- Prioridad: P1. Estado: Pendiente.

---

<!-- ID: AUD-NG-171 | Fuentes: Pendientes.md -->
### [ ] [AUD-NG-171] Completar catálogo reutilizable, versionado y relaciones de proyectos interdisciplinarios
- Severidad: Medio (P2).
- Origen: Auditoría TAREA-18 de completadas.md; archivos backend/academic-service/Code.gs, js/teacher.js y teacher-dashboard.html.
- Problema: el backend solo registra filas básicas en RecursosEducativosReutilizables y ProyectosInterdisciplinarios. Los proyectos guardan departamentos como texto, no enlazan RecursoID ni versiones; el año lectivo está fijado en 2026. El campo Version es texto suministrado por el cliente, sin historial ni linaje; manageReusableResource siempre hace appendRow incluso cuando recibe recursoId, por lo que no actualiza ni evita duplicados. El controlador docente busca un modal ausente en teacher-dashboard.html. No se demuestra integración de recursos con actividades publicadas ni preservación de la versión histórica usada.
- Alcance: catálogo con referencias curriculares canónicas (área, asignatura, grado, tema, idioma); filtros efectivos; versionado append-only con relación padre/hija, autor verificado, fecha y estado; proyectos interdisciplinarios con departamentos/áreas por ID, año lectivo, líder verificado y relación explícita a múltiples recursos/versiones; permisos por recurso/proyecto; UI operativa en teacher-dashboard; prevención de duplicados y pruebas de integridad/historial.
- Criterios: un recurso se localiza por todas sus dimensiones; proyecto enlaza varios recursos de varias áreas; cada cambio genera nueva versión sin alterar referencias de actividades históricas; reutilización no duplica archivos Drive ni rompe ACL; autoría y permisos derivan de claims verificados; no existen IDs duplicados ni proyectos huérfanos; pruebas cubren dos áreas, dos docentes, versiones y periodos históricos.
- Relacionadas: AUD-NG-164 (catálogo curricular maestro), AUD-NG-158 (ABAC y actor verificado), TASK-296 (XSS, validación de enlaces y privacidad de Drive).
- Estado: [ ] Pendiente

---

<!-- ID: F8-TASK25 | Fuentes: completadas.md -->
### [ ] [F8-TASK25] Incorporar estadísticas descriptivas y una visualización de la distribución de calificaciones de exámenes
- **ID Anterior:** `[TAREA-F8-OPT-02]`
- **Origen del Hallazgo:** `AUDITORIA_FASE_8_AULA_VIRTUAL_APRENDIZAJE.md` / Tarea F8-OPT-02 (P2 · Analítica de Exámenes)
- **Prioridad:** P2
- **Severidad/Clasificación:** Medio (Ampliación analítica)
- **Archivos Involucrados:**
  - `backend/exam-service/Code.gs`
  - `teacher-dashboard.html`
  - `js/teacher.js`
- **Dependencias Expuestas:** Cuestionarios, resultados de exámenes, libro de calificaciones y permisos docentes
- **Descripción del Alcance:**
  Proporcionar un resumen estadístico descriptivo y un gráfico de distribución de calificaciones por intervalos para cada examen, permitiendo al docente analizar el desempeño del grupo e incluir opcionalmente una curva normal de referencia.

  Requisitos Funcionales:
  1. Filtrar resultados por curso, asignatura, examen, grupo y período académico respetando permisos docentes.
  2. Calcular métricas descriptivas: total de evaluados, pendientes, nota promedio, mediana, mínimo, máximo, desviación estándar y % de aprobación.
  3. Renderizar gráfico de frecuencia por intervalos de puntuación identificando concentración y dispersión.
  4. Incluir curva de distribución normal de referencia únicamente cuando sea estadísticamente pertinente.
  5. Distinguir claramente los datos reales observados de las curvas de referencia.
  6. Garantizar que la generación de estadísticas sea de solo lectura y no altere las calificaciones del libro oficial.
- **Criterios de Aceptación:**
  - CA-F8-016: El informe estadístico y gráfico corresponde exactamente al examen y grupo seleccionado.
  - CA-F8-017: La generación del gráfico de distribución no modifica ni recalcula las notas oficiales.
  - CA-F8-018: Un grupo sin calificaciones muestra un estado vacío comprensible en lugar de un gráfico erróneo.
- **Estado:** Pendiente

---

<!-- ID: F11-TASK17 | Fuentes: AUDITORIAS/AUDITORIA-FASE-11-COMUNICACION-BIENESTAR-SUPERVISION-FINANZAS.md -->
### [ ] [F11-TASK17] Consolidar indicadores de calidad educativa y cumplimiento pedagógico
- **Hallazgo de origen:** sección 3.C.5; existen métricas en `getCurricularAnalyticsReport`, pero falta reporte consolidado de cumplimiento pedagógico.
- **Severidad:** Media. **Objetivo:** disponer de indicadores agregados y trazables sobre planificación y cumplimiento.
- **Acción ejecutable:** definir indicadores, fuentes, fórmulas y periodos; consolidar entregas/revisiones de F11-Task09/10, supervisiones y métricas curriculares en un reporte con filtros autorizados.
- **Archivos/módulos:** `backend/academic-service/Code.gs`, `getCurricularAnalyticsReport`, `PlanificacionesPedagogicas`, `SupervisionPedagógica`.
- **Dependencias/riesgos:** calidad de datos y definiciones institucionales; riesgo de métricas engañosas o comparaciones no homogéneas.
- **Alcance:** agregación y reporte; no inferir calidad docente individual a partir de métricas sin contexto.
- **Criterios de aceptación:** cada indicador tiene fórmula/fuente documentada; los agregados concilian con registros fuente; filtros y permisos se aplican; los resultados pueden reproducirse por periodo.
- **Prioridad:** P2. **Estado:** Pendiente.
- **Evidencia de cierre:** pendiente; el informe describe métricas existentes, pero identifica el consolidado como faltante.

---

<!-- ID: TAREA-F7-IMP-04 | Fuentes: completadas.md -->
### [ ] [TAREA-F7-IMP-04] Incorporar planificación masiva y optimización de horarios
- **Origen del Hallazgo:** `AUDITORIA_FASE_7_PLANIFICACION_HORARIOS_RECURSOS.md` / Tarea F7-IMP-04 (P2 · Planificación Masiva)
- **Prioridad:** P2
- **Severidad/Clasificación:** Medio (Nueva herramienta de planificación avanzada)
- **Archivos Involucrados:**
  - `backend/academic-service/Code.gs`
  - `teacher-dashboard.html`
  - `js/teacher.js`
- **Dependencias Expuestas:** `publishClassSchedules`, `checkScheduleConflict`, `F7-IMP-01`, `F7-IMP-02`, `F7-IMP-03`
- **Descripción del Alcance:**
  Desarrollar un entorno de escenarios de planificación masiva en borrador que permita generar, reorganizar y optimizar conjuntos completos de horarios respetando restricciones obligatorias (disponibilidad docente, exclusividad de aula, jornadas) y evaluando preferencias configurables sin alterar el horario oficial hasta su publicación explícita.

  Requisitos Funcionales:
  1. Permitir preparar un escenario de planificación sin modificar el horario oficial.
  2. Incorporar las clases, asignaturas, secciones, docentes, aulas y períodos que participarán en el escenario.
  3. Utilizar como restricciones obligatorias: disponibilidad docente, exclusividad de aulas y recursos, compatibilidad de jornadas, disponibilidad de las secciones, duración de las clases, restricciones académicas configuradas.
  4. Permitir establecer preferencias, cuando sean pertinentes: reducir períodos libres innecesarios, distribuir la carga docente, evitar concentraciones de clases o evaluaciones, favorecer uso eficiente de aulas, respetar preferencias docentes autorizadas.
  5. Diferenciar las restricciones obligatorias de las preferencias optimizables.
  6. Permitir comparar el escenario propuesto con el horario actual.
  7. Mostrar las asignaciones que no pudieron ubicarse y las razones identificadas.
  8. Permitir bloquear asignaciones que no deban cambiar durante una reorganización.
  9. Recalcular las asignaciones afectadas cuando cambie una restricción.
  10. Permitir guardar un escenario como borrador y retomarlo posteriormente.
  11. Exigir validación y confirmación antes de publicar el resultado.
  12. Registrar los cambios introducidos al aplicar un escenario.
- **Criterios de Aceptación:**
  - CA-F7-24: La generación de un escenario no modifica el horario oficial.
  - CA-F7-25: Ningún escenario puede publicarse si contiene conflictos obligatorios no resueltos.
  - CA-F7-26: Las asignaciones bloqueadas se conservan durante la reorganización.
  - CA-F7-27: Las restricciones imposibles de satisfacer se identifican de forma explícita.
  - CA-F7-28: Las preferencias no sustituyen a las restricciones obligatorias.
  - CA-F7-29: El sistema permite comparar la carga docente y la utilización de recursos antes y después.
  - CA-F7-30: Una ejecución fallida no destruye el escenario anterior ni el horario oficial.
  - CA-F7-31: La publicación requiere una confirmación explícita y una validación final.
- **Estado:** Pendiente

---

<!-- ID: TASK-357 | Fuentes: Pendientes.md ; pendientes/Docente/Pendientes.md -->
### [ ] [TASK-357] Ampliar los indicadores de calidad educativa y cumplimiento pedagógico
- **Origen del Hallazgo:** `AUDITORIA-FASE-11-COMUNICACION-BIENESTAR-SUPERVISION-FINANZAS.md` / Área III (P2)
- **Prioridad:** P2
- **Severidad/Clasificación:** Media (Métricas institucionales)
- **Archivos Involucrados:**
  - `backend/academic-service/Code.gs`
- **Dependencias Expuestas:** IndicadoresCalidad
- **Descripción del Alcance:**
  Consolidar métricas agregadas de cumplimiento de planificaciones, cobertura de contenidos por asignatura y avance del calendario académico.
- **Criterios de Aceptación:**
  - Los indicadores muestran estadísticas globales por nivel/departamento sin exponer datos confidenciales individuales.
- **Estado:** [ ] Pendiente

<!-- Fuente: RECUPERACION/Pendientes_RECUPERADO.md, líneas 13835-13857; clave TASK-382; asignación única: Docente -->

---

<!-- ID: TASK-382 | Fuentes: Pendientes.md ; pendientes/Docente/Pendientes.md -->
### [ ] [TASK-382] Identificación y escaneo de ejemplares mediante códigos QR y códigos de barras
- **Origen del Hallazgo:** `AUDITORIA_FASE_20_BIBLIOTECA_RECURSOS_EDUCATIVOS.md` / Sección E, Sección C (2.2) y Plan de Trabajo P2
- **Prioridad:** P2
- **Severidad/Clasificación:** Media (Agilidad en mostrador de préstamo, reducción de errores de digitación y etiquetado físico)
- **Archivos Involucrados:**
  - `backend/accounting-service/Code.gs`
  - `BibliotecaEjemplares`
  - `dashboard-contabilidad.html`
  - `js/accounting.js`
- **Dependencias Expuestas:** `BibliotecaEjemplares`, `F20-Task01`
- **Descripción del Alcance:**
  Los préstamos y devoluciones requieren teclear manualmente los identificadores de los libros (`LIB-...`), lo que retrasa la atención en horas punta de recreo y propicia errores de captura.
  Requerimientos Funcionales Detallados:
  1. Generación e impresión de etiquetas con código de barras/QR:
     - Generar dinámicamente etiquetas para lomo o portada con el código del ejemplar, título resumido, signatura de estantería y código QR/barra legible.
     - Permitir utilizar lectores ópticos USB o cámaras móviles en el mostrador para escanear el libro y el carné del estudiante, completando el préstamo en menos de 5 segundos.
- **Criterios de Aceptación:**
  - Se pueden imprimir etiquetas adhesivas individuales o por pliego para los ejemplares físicos.
  - El escaneo del código QR en el formulario de préstamo rellena automáticamente el ejemplar y abre la ficha del libro.
- **Estado:** [ ] Pendiente

<!-- Fuente: RECUPERACION/Pendientes_RECUPERADO.md, líneas 14583-14631; clave TASK-406; asignación única: Docente -->

---

<!-- ID: TASK-617 | Fuentes: AUDITORIAS/AUDITORIA_COMPLETADAS_TAREA-F7-IMP-20.md -->
### [ ] [TASK-617] Optimizar consultas de horarios y recursos con filtros de origen y resultados acotados
- **Hallazgos de origen:** AUD-NG-257 y AUD-NG-259.
- **Prioridad:** P2.
- **Objetivo:** reducir filas/columnas transferidas y procesadas por las consultas de planificación, manteniendo el contrato semántico.
- **Acciones:** definir filtros canónicos por año/período, docente, oferta, sede y rango semanal; aplicarlos en la lectura de origen cuando sea viable; leer únicamente columnas necesarias; eliminar recorridos anidados evitables de mantenimientos; incorporar paginación/cursor estable y límites configurables en consultas extensas; alinear informes y vistas con el mismo ámbito temporal.
- **Archivos/módulos:** `backend/academic-service/Code.gs`, `js/teacher.js`, `js/student.js`; hojas HorariosClase, OfertaAcademica, Matriculas, SedesAulas y MantenimientoAulas.
- **Criterios:** una consulta semanal no procesa historial ajeno al año/período; los filtros reducen el conjunto leído; paginar todas las páginas no omite ni duplica filas; el orden es estable; informes y vistas usan el mismo filtro; resultados equivalen funcionalmente al contrato correcto anterior.
- **Dependencias:** TASK-234; AUD-NG-168/236/241. No duplicar correcciones de esquema ni índices ya asignadas a esas auditorías.
- **Estado:** Pendiente.

---

<!-- ID: TAREA-F7-IMP-23 | Fuentes: AUDITORIAS/AUDITORIA_COMPLETADAS_PLAN.md ; completadas.md -->
### [ ] [TAREA-F7-IMP-23] Ampliar las herramientas de impresión y distribución de horarios
- **Dictamen:** NO CUMPLE; se conserva la marca histórica [ ].
- **Criterios:** CA-F7-138 NO CUMPLE; CA-F7-139 NO CUMPLE; CA-F7-140 NO CUMPLE; CA-F7-141 NO CUMPLE; CA-F7-142 NO VERIFICABLE.
- **Hallazgos:** AUD-NG-270..273 nuevos: impresión docente desconectada; estado/período falsos; impresión estudiante sin área imprimible; paginación insuficiente.
- **Tareas ejecutables derivadas:** TASK-626 UI/filtros/preview docente; TASK-627 impresión estudiante y ámbito de matrícula; TASK-628 snapshot con versión y metadatos reales; TASK-629 paginación multipágina.
- **Ampliaciones:** AUD-NG-246/TASK-584..589 para DOM y ámbito; AUD-NG-247 para filtros; AUD-NG-248/TASK-597..602 para exportación CSV/JSON; AUD-NG-161 para pruebas conductuales.
- **Evidencia:** teacher-dashboard.html 1-1475; student-dashboard.html 1-412; teacher.js 592-682/1251-1294; student.js 874-955; style.css 946-971; Code.gs 3403-3427/6718-6770/7986-8070; ChangesLogs registro IMP-23; completadas.md 4658-4688.
- **SHAs:** teacher-dashboard cbb9e6a272a7d8ad33f99727303305d950533e71; student-dashboard 6379ea0ed39d71b89747a0280bb925fdf12202c1; teacher.js c475fce5afcd28fca23e7b64398ad32b17773746; student.js e2888cea60322e49a40b89adadb8010489605dcc; style.css f1ff84312ce70949a58eaa099b2aad0ff0a59cb6; Code.gs df87a2eea9f0ef79d0b966d03fd5bbe432003df5.
- **Pruebas:** inspección manual/estática y Git/blob. No ejecutados navegador, impresión/PDF, CSV real, Apps Script, Sheets productivas, HTTP/OAuth, roles/matrículas reales, Node ni E2E.
- **Siguiente tarea exacta:** TAREA-F7-IMP-24, preferencias de calendario y personalización de vistas.

- **Origen del Hallazgo:** `AUDITORIA_FASE_7_PLANIFICACION_HORARIOS_RECURSOS.md` / Tarea F7-IMP-23 (P3 · Exportación e Impresión)
- **Prioridad:** P3
- **Severidad/Clasificación:** Bajo (Mejora de accesibilidad y distribución de información)
- **Archivos Involucrados:**
  - `teacher-dashboard.html`
  - `student-dashboard.html`
  - `js/teacher.js`
  - `js/student.js`
- **Dependencias Expuestas:** `getClassSchedules`, `getStudentSchedule`, `F7-IMP-02`, `F7-IMP-12`
- **Descripción del Alcance:**
  Incorporar vistas de impresión formateadas CSS `@media print` y exportación limpia para horarios de docentes, secciones y aulas con membrete institucional e identificación explícita de versión publicada o borrador.

  Requisitos Funcionales:
  1. Permitir preparar horarios imprimibles por docente, sección, aula y período.
  2. Permitir seleccionar el intervalo de fechas y los filtros pertinentes.
  3. Mostrar la información necesaria para identificar cada clase.
  4. Diferenciar los horarios vigentes de los borradores.
  5. Evitar incluir información que el usuario no esté autorizado a consultar.
  6. Mantener una distribución legible en páginas impresas.
  7. Permitir exportar los datos en los formatos admitidos.
  8. Mostrar la fecha de generación y el período al que corresponde el documento.
  9. Identificar si el horario exportado corresponde a una versión publicada.
  10. Evitar que los documentos distribuidos presenten cambios pendientes como si fueran oficiales.
- **Criterios de Aceptación:**
  - CA-F7-138: El documento exportado coincide con los filtros y el horario seleccionado.
  - CA-F7-139: La información se presenta de manera legible.
  - CA-F7-140: Los datos restringidos no se incluyen en la exportación.
  - CA-F7-141: El documento permite identificar su período y estado.
  - CA-F7-142: Las modificaciones posteriores no alteran retroactivamente un documento ya generado.
- **Estado:** Pendiente

---

<!-- ID: AUD-NG-105 | Fuentes: Pendientes.md -->
### [ ] [AUD-NG-105] Alinear el contrato de almacenamiento, permisos y lectura del historial académico
- **Origen del Hallazgo:** Auditoria.txt / AUD-NG-105
- **Severidad/Clasificación:** Alto
- **Archivos Involucrados:** backend/academic-service/Code.gs; js/student.js
- **Dependencias Expuestas:** ROLE_PERMISSIONS, saveToAcademicHistory, getAcademicHistory, fetchAcademicHistory.
- **Descripción del Alcance:** saveToAcademicHistory crea IDs hist-XXXX en la primera columna y profesorId en la octava, sin studentId. getAcademicHistory compara verifiedUserId con r[0]. Además, getAcademicHistory está permitido para Alumno, pero no para Estudiante, aunque el dashboard estudiantil invoca la acción. La función también permite que Padre/Tutor/Responsable y Profesor consulten usando estudianteId, grado y sección del payload; validateContextualAccess en ACADEMIC solo restringe Estudiante/Alumno y no valida vínculo familiar ni asignación docente. Si se omiten los filtros, el historial puede quedar sin acotar.
- **Criterios de Aceptación:** Definir si el historial es de asignaciones por grupo o individual; alinear esquema, filtro y permisos; la lectura usa una columna de identidad real o un alcance institucional validado; Estudiante/Alumno solo consultan su historial; Padre/Tutor/Responsable solo consultan estudiantes vinculados activamente; Profesor solo consulta estudiantes de sus asignaciones activas; omitir o manipular estudianteId/grado/sección nunca amplía el acceso.
- **Ampliación C1.73:** Se confirma que getAcademicHistory solo fuerza verifiedUserId para Estudiante/Alumno. La matriz permite la acción a Padre/Tutor/Responsable y Profesor, pero el control contextual académico no comprueba sus relaciones/ámbitos. Se amplía este hallazgo existente; no se crea ID duplicado.
- **Estado:** [ ] Pendiente

---

<!-- ID: AUD-NG-107 | Fuentes: Pendientes.md -->
### [ ] [AUD-NG-107] Aplicar la validación de grado del estudiante antes de autorizar recursos por tema
- **Origen del Hallazgo:** Auditoria.txt / AUD-NG-107
- **Severidad/Clasificación:** Medio
- **Archivos Involucrados:** js/config.js
- **Dependencias Expuestas:** SUBJECT_GRADE_MAP, isContentAuthorized, GLOBAL_SCOPE.
- **Descripción del Alcance:** Cuando contentTopic coincide con TemaActual, isContentAuthorized retorna true antes de ejecutar la validación Tier 2 que compara asignatura y contentGrade con el grado del usuario. Con metadata incompleta, el mapa de grado no se aplica en esa rama.
- **Criterios de Aceptación:** Las restricciones del perfil se aplican antes de cualquier retorno de autorización; un recurso temático de una asignatura ajena al grado se rechaza incluso si el tema coincide; pruebas cubren metadata presente y ausente.
- **Estado:** [ ] Pendiente

---

<!-- ID: AUD-NG-108 | Fuentes: Pendientes.md -->
### [ ] [AUD-NG-108] Aislar la configuración académica por el profesor autenticado
- **Origen del Hallazgo:** Auditoria.txt / AUD-NG-108
- **Severidad/Clasificación:** Crítico
- **Archivos Involucrados:** backend/academic-service/Code.gs
- **Dependencias Expuestas:** ROLE_PERMISSIONS, validateContextualAccess, validateRolePermission, getAcademicConfig, updateAcademicConfig, _verifiedUserId.
- **Descripción del Alcance:** El rol Profesor puede leer y actualizar la configuración, pero getAcademicConfig confía en payload.profesorId y updateAcademicConfig en fullScope.profesorId. El control contextual no vincula esos campos con _verifiedUserId.
- **Criterios de Aceptación:** Para Profesor, el backend deriva profesorId de la sesión y rechaza IDs de terceros; los roles administrativos usan una política explícita; pruebas negativas demuestran que un docente no puede leer ni modificar la configuración de otro.
- **Estado:** [ ] Pendiente

---

<!-- ID: AUD-NG-113 | Fuentes: Pendientes.md -->
### [ ] [AUD-NG-113] Completar la clave Upsert de configuración académica con el parcial
- **Origen del Hallazgo:** Auditoria.txt / AUD-NG-113 (CONF-001).
- **Severidad/Clasificación:** Alto
- **Archivos Involucrados:** `backend/academic-service/Code.gs`; pruebas de regresión de configuración académica.
- **Dependencias Expuestas:** `updateAcademicConfig`, `ConfiguracionAcademica`, `hierarchicalAssignments`, `finalConfigMap`, `saveToAcademicHistory`.
- **Descripción del Alcance:** El Upsert actual busca `oldRow` por profesor, grado, sección, asignatura y tema, pero no incluye el parcial; la clave de `finalConfigMap` tampoco incluye el parcial. Al configurar el mismo contexto en otro parcial puede reutilizarse y sobrescribirse una fila de un periodo distinto. Incorporar el parcial normalizado a la clave de búsqueda y de persistencia, y conservar las filas del mismo profesor que pertenezcan a otros parciales al reconstruir la hoja. Mantener Parcial y Unidad como campos independientes.
- **Criterios de Aceptación:** Dos parciales con el mismo grado/sección/asignatura/tema/profesor generan dos contextos diferenciados; actualizar un parcial modifica exclusivamente su fila; no se pierden filas de otros parciales ni se crean duplicados al repetir la operación; pruebas cubren ruta jerárquica y ruta de producto cartesiano.
- **Estado:** [ ] Pendiente

---

<!-- ID: AUD-NG-115 | Fuentes: Pendientes.md -->
### [ ] [AUD-NG-115] Aplicar el parcial vigente en todos los niveles de navegación docente
- **Origen del Hallazgo:** Auditoria.txt / AUD-NG-115 (NAV-002).
- **Severidad/Clasificación:** Alto
- **Archivos Involucrados:** `js/teacher.js`; `backend/academic-service/Code.gs`; pruebas de regresión de navegación docente.
- **Dependencias Expuestas:** `renderGrados`, `renderSecciones`, `renderAsignaturas`, `window.GLOBAL_SCOPE`, `GranularConfig`, `getAcademicConfig`.
- **Descripción del Alcance:** `renderGrados` usa `GLOBAL_SCOPE.GradoActual`, que el backend construye con filas de todos los parciales del profesor; `renderSecciones` filtra GranularConfig solo por grado. Aplicar el parcial activo también al conjunto de grados y secciones, derivando ambos desde registros de `GranularConfig` cuyo `parcial` coincida con `GLOBAL_SCOPE.ParcialActual`. Mantener el filtro actual de asignaturas por parcial, grado y sección.
- **Criterios de Aceptación:** Con dos parciales que contengan grados/secciones diferentes, la navegación del docente muestra únicamente grados, secciones y asignaturas del parcial activo; cambiar el parcial actualiza los tres niveles; no se recuperan elementos históricos como fallback; pruebas cubren datos multi-parcial.
- **Estado:** [ ] Pendiente

---

<!-- ID: AUD-NG-118 | Fuentes: Pendientes.md -->
### [ ] [AUD-NG-118] Completar navegación jerárquica con secciones dinámicas y salto automático
- **Origen del Hallazgo:** Auditoria.txt / AUD-NG-118 (REQ-EXP-003).
- **Severidad/Clasificación:** Medio
- **Archivos Involucrados:** `js/teacher.js`; `teacher-dashboard.html`; pruebas de regresión de navegación académica.
- **Dependencias Expuestas:** `initAssignmentBuilder`, `window.GLOBAL_SCOPE`, `GranularConfig`, `renderGrados`, `renderSecciones`, `renderAsignaturas`, `pushNav` y `renderCurrentLevel`.
- **Descripción del Alcance:** El constructor de asignaciones presenta secciones fijas A/B/C en lugar de derivarlas de la configuración académica vigente. La navegación observada agrega el nivel Secciones mediante pushNav y no se encontró una condición que omita automáticamente ese nivel cuando el grado tiene una sola sección. Derivar las secciones del contexto configurado y permitir el salto directo a Asignaturas cuando solo exista una sección autorizada, conservando el contexto grado/sección en el estado e historial de navegación.
- **Criterios de Aceptación:** Los grados con una sección pasan directamente a Asignaturas con la sección correcta; los grados con varias secciones muestran el selector; el constructor solo ofrece secciones realmente configuradas para el grado/parcial; atrás/adelante del navegador restaura el contexto; pruebas cubren cero, una y varias secciones.
- **Estado:** [ ] Pendiente

---

<!-- ID: AUD-NG-119 | Fuentes: Pendientes.md -->
### [ ] [AUD-NG-119] Aislar el cierre de año al docente autenticado y sus entregas
- **Origen del Hallazgo:** Auditoria.txt / AUD-NG-119 (REQ-EXP-005).
- **Severidad/Clasificación:** Crítico
- **Archivos Involucrados:** `backend/task-service/Code.gs`; `js/teacher.js`.
- **Dependencias Expuestas:** `closeAcademicYear`, `validateRolePermission`, `validateContextualAccess`, `ROLE_PERMISSIONS`, `Tareas`, `Entregas`, `ConfiguracionAcademica` y DriveApp.
- **Descripción del Alcance:** La acción `closeAcademicYear` está permitida al rol Profesor y recibe `profesorId` desde el payload sin vincularlo a `_verifiedUserId`. Además, el bucle de Entregas elimina todas las filas, sin filtrar por las tareas del profesor. Vincular el cierre granular a la identidad verificada y resolver el propietario de cada entrega mediante su tarea antes de borrar filas o archivos. El cierre global debe quedar reservado a roles administrativos autorizados.
- **Criterios de Aceptación:** Un profesor solo puede cerrar su propio ámbito; no puede enviar el ID de otro docente; el cierre de un docente no elimina entregas, archivos, tareas ni configuración de terceros; solo roles administrativos pueden ejecutar el cierre global; una prueba con dos docentes demuestra aislamiento completo.
- **Estado:** [ ] Pendiente

---

<!-- ID: AUD-NG-121 | Fuentes: Pendientes.md -->
### [ ] [AUD-NG-121] Aplicar en servidor la penalización del 50% por entrega tardía
- **Origen del Hallazgo:** Auditoria.txt / AUD-NG-121 (REQ-EXP-004).
- **Severidad/Clasificación:** Alto
- **Archivos Involucrados:** `backend/task-service/Code.gs`; `js/teacher.js`; pruebas de calificación.
- **Dependencias Expuestas:** `submitAssignment`, `gradeSubmission`, `EntregadaTarde`, `fechaLimite` y cálculo de calificación.
- **Descripción del Alcance:** `submitAssignment` identifica una entrega posterior a `fechaLimite` y cambia su estado a `EntregadaTarde`, pero no aplica el factor del 50%. `gradeSubmission` guarda directamente la calificación enviada por el cliente, sin cálculo ni validación server-side. Implementar la regla en servidor y conservar nota base y nota final para evitar manipulación desde el navegador o aplicación doble.
- **Criterios de Aceptación:** Una entrega a tiempo conserva el 100% de la nota base; una entrega tardía recibe exactamente el 50%; re-calificar no vuelve a reducir la nota; el servidor calcula el resultado independientemente del cliente; pruebas cubren límite horario, zona horaria y reintentos.
- **Estado:** [ ] Pendiente

---

<!-- ID: AUD-NG-122 | Fuentes: Pendientes.md -->
### [ ] [AUD-NG-122] Aplicar ámbito docente en todas las operaciones de asistencia
- **Origen del Hallazgo:** Auditoria.txt / AUD-NG-122 (REQ-EXP-004).
- **Severidad/Clasificación:** Crítico
- **Archivos Involucrados:** `backend/academic-service/Code.gs`; pruebas de seguridad de asistencia.
- **Dependencias Expuestas:** `openAttendanceSession`, `saveClassAttendance`, `bulkApplyAttendanceStatus`, `getClassAttendance`, `saveDailyAttendance`, `getDailyAttendance`, `getBatchAttendanceRecords`, `validateContextualAccess` y `validateAcademicResponsibilityAndScopeAccess`.
- **Descripción del Alcance:** Las acciones de asistencia están permitidas al rol Profesor, pero las funciones reciben grado, sección, sesión y userIds desde el payload sin comprobar que correspondan a asignaciones del docente autenticado. `getDailyAttendance` ignora grado/sección y devuelve todas las filas del día; `getClassAttendance` filtra solo por sesionId y devuelve todo si se omite. Implementar autorización contextual server-side con `_verifiedUserId` y asignaciones docentes para lecturas y escrituras.
- **Criterios de Aceptación:** Un docente solo consulta y modifica sesiones, estudiantes, grados, secciones y asignaturas de su asignación vigente; los filtros se aplican en servidor; se rechazan sesiones ajenas y userIds fuera del grupo; Dirección/Administrador conservan el alcance institucional; pruebas negativas con dos docentes y grupos distintos.
- **Estado:** [ ] Pendiente

---

<!-- ID: AUD-NG-124 | Fuentes: Pendientes.md -->
### [ ] [AUD-NG-124] Validar propiedad y conservar historial de rectificaciones de calificaciones
- **Origen del Hallazgo:** Auditoria.txt / AUD-NG-124 (REQ-EXP-004).
- **Severidad/Clasificación:** Alto
- **Archivos Involucrados:** `backend/task-service/Code.gs`; `backend/exam-service/Code.gs`; pruebas de calificaciones.
- **Dependencias Expuestas:** `getTeacherActivity`, `getTeacherExamActivity`, `gradeSubmission`, `gradeExamSubmission`, `EntregasVersiones`, `EntregasExamen` y `_verifiedUserId`.
- **Descripción del Alcance:** Los endpoints de calificación reciben entregaId y actualizan nota/estado/comentario directamente, sin comprobar que el examen o tarea pertenezca al docente autenticado ni conservar el valor anterior de la calificación. La tabla EntregasVersiones conserva versiones de entregas, pero no las rectificaciones de nota; EntregasExamen tampoco registra historial de cambios de calificación. Vincular la operación al docente propietario y añadir historial append-only de cambios.
- **Criterios de Aceptación:** Un docente no puede calificar entregas de otro docente; cada rectificación conserva valor anterior/nuevo, actor, fecha y motivo; las consultas de actividad usan identidad verificada y ámbito asignado; pruebas cubren cambio de nota y acceso cruzado.
- **Estado:** [ ] Pendiente

---

<!-- ID: AUD-NG-150 | Fuentes: Pendientes.md -->
### [ ] [AUD-NG-150] Reforzar la separación entre guías informativas y tareas evaluables en el servidor
- **Origen del Hallazgo:** Auditoria.txt / AUD-NG-150 (REQ-DOC-004).
- **Severidad/Clasificación:** Alto
- **Archivos Involucrados:** js/teacher.js; js/student.js; backend/task-service/Code.gs; teacher-dashboard.html.
- **Dependencias Expuestas:** tipoRecurso, getStudentTasks, getActivityHtml, createTask, submitAssignment, gradeSubmission, archivoUrl, MaterialesEducativos, hoja Tareas, hoja Entregas.
- **Descripción del Alcance:** Mantener una clasificación inequívoca de tarea evaluable, ejercicios, guía de estudio y material de apoyo. El backend debe impedir crear entregas, borradores, calificaciones o penalizaciones sobre tipos informativos. El DTO estudiantil debe incluir los metadatos de archivo necesarios para mostrar/descargar la guía y separar los recursos informativos de la cola de tareas evaluables. El formulario docente debe ofrecer los tipos admitidos y persistir el discriminador sin depender de payloads arbitrarios.
- **Criterios de Aceptación:** Una guía/material de apoyo se consulta y descarga, pero submitAssignment/saveSubmissionDraft/gradeSubmission rechazan operaciones evaluables para ese tipo. Las tareas y ejercicios evaluables conservan su flujo normal. getStudentTasks devuelve los campos requeridos por el renderer. Pruebas directas de endpoints para cada tipo y verificación de ausencia de entregas/notas/penalizaciones para guías.
- **Estado:** [ ] Pendiente

---

<!-- ID: AUD-NG-151 | Fuentes: Pendientes.md -->
### [ ] [AUD-NG-151] Calcular y validar la fecha límite a partir de la fecha impartida
- **Origen del Hallazgo:** Auditoria.txt / AUD-NG-151 (REQ-DOC-005).
- **Severidad/Clasificación:** Medio
- **Archivos Involucrados:** teacher-dashboard.html; js/teacher.js; backend/task-service/Code.gs.
- **Dependencias Expuestas:** create-task-class-date, create-task-due-date, fechaClase, fechaLimite, createTask, updateTask, hoja Tareas.
- **Descripción del Alcance:** Implementar la sugerencia de fecha límite como el día calendario siguiente a fechaClase, permitir modificación manual y persistir fechaClase junto a fechaLimite. Validar en servidor que ambas fechas sean válidas y que fechaLimite no sea anterior a fechaClase, tanto al crear como al editar una tarea.
- **Criterios de Aceptación:** Al seleccionar fechaClase, el formulario propone el día siguiente; el docente puede modificarlo; el servidor rechaza fecha límite anterior o fecha inválida; fechaClase y fechaLimite sobreviven a recarga. Pruebas de mismo día, día siguiente, cambio manual, fin de mes/año y fechas pasadas.
- **Estado:** [ ] Pendiente

---

<!-- ID: AUD-NG-153 | Fuentes: Pendientes.md -->
### [ ] [AUD-NG-153] Completar las tarjetas estudiantiles con tema, recursos y estados coherentes
- **Origen del Hallazgo:** Auditoria.txt / AUD-NG-153 (REQ-DOC-007).
- **Severidad/Clasificación:** Alto
- **Archivos Involucrados:** student-dashboard.html; js/student.js; backend/task-service/Code.gs; js/api.js.
- **Dependencias Expuestas:** renderSubjectNavigation, getActivityHtml, getStudentTasks, getStudyMaterials, tipoRecurso, tema, parcial, fechaLimite, archivoUrl.
- **Descripción del Alcance:** Completar el DTO de actividades con tema y metadatos de recursos; integrar en las tarjetas por asignatura las guías/materiales y tareas evaluables del parcial correspondiente. Excluir guías informativas de contadores de pendientes, prioridades, estados de vencimiento y penalizaciones. Mostrar por tarjeta título, asignatura, tema, parcial, fechas y estado inequívoco (pendiente, entregada, vencida), conservando la expansión por materia y el aislamiento académico.
- **Criterios de Aceptación:** Las tarjetas contienen todos los campos requeridos; guías y tareas aparecen diferenciadas y solo las tareas evaluables se cuentan como pendientes/vencidas; el enlace de descarga de guía funciona; filtros por parcial/asignatura/grado/sección siguen siendo correctos. Pruebas de guía sin entrega, tarea pendiente, tarea entregada, tarea vencida y cambio de parcial.
- **Estado:** [ ] Pendiente

---

<!-- ID: AUD-NG-158 | Fuentes: Pendientes.md -->
### [ ] [AUD-NG-158] Aplicar autorización contextual a escrituras docentes y conservar historial de fechas límite
- **Origen del Hallazgo:** Auditoria.txt / AUD-NG-158 (REQ-DOC-012).
- **Severidad/Clasificación:** Crítico
- **Archivos Involucrados:** backend/task-service/Code.gs; backend/academic-service/Code.gs; js/api.js; pruebas de seguridad académica.
- **Dependencias Expuestas:** validateRolePermission, validateContextualAccess, getDynamicPermissionsForRole, createTask, updateTask, createStudyMaterial, AsignacionesDocentes, _verifiedUserId, fechaLimite, historial de tareas.
- **Descripción del Alcance:** Aplicar ABAC server-side a todas las escrituras docentes. Derivar profesorId/autorId exclusivamente de la sesión verificada y comprobar que asignatura, grado y sección pertenecen a asignaciones vigentes del docente. Verificar propiedad/ámbito antes de editar o eliminar una tarea/material. Añadir historial append-only de cambios de fecha límite con valor anterior/nuevo, actor verificado, timestamp y motivo. Coordinar con AUD-NG-001/AUD-NG-004 para token y secreto, y con TASK-085/TASK-142 para privacidad documental, sin duplicar esos alcances.
- **Criterios de Aceptación:** Un profesor no puede crear, editar ni eliminar tareas/materiales fuera de sus asignaciones aunque manipule el payload; el servidor deriva identidad y ámbito de claims verificados; updateTask rechaza tareas de otro profesor; cada cambio de fecha límite conserva historial inmutable con actor/fecha/motivo; pruebas negativas con dos docentes y dos secciones, modificación de IDs y múltiples cambios de fecha.
- **Estado:** [ ] Pendiente

---

<!-- ID: AUD-NG-175 | Fuentes: Pendientes.md -->
### [ ] [AUD-NG-175] Corregir el contrato, la sincronización y la validación de los catálogos institucionales
- **Origen del Hallazgo:** Auditoria.txt / AUD-NG-175 (FASE2-03 y revisión de la implementación posterior FASE2-T04).
- **Severidad/Clasificación:** Alto (integridad y consistencia de catálogos institucionales).
- **Archivos Involucrados:** `js/config.js`; `backend/academic-service/Code.gs`; `backend/user-service/Code.gs`; `tests/regression/modular-dashboard-suite.js`.
- **Dependencias Expuestas:** `fetchInstitutionalCatalog`, `registerNewCurricularAreaServiceConfig`, `getInstitutionalCatalog`, `getSubjectCatalog`, `createSubjectCatalogItem`, `validateCatalogReference`, `CatalogoAsignaturas`, `AreasCurricularesExtensiones`, `CACHE_POLICIES`, `SERVICE_VERSIONS`, `getSharedConfigVersion`, `getSharedConfigurationsCatalog`, `fetchApi`.
- **Descripción del Alcance:** Establecer un contrato versionado y coherente para consultar y sincronizar los catálogos institucionales. Corregir el mapeo del estado de asignaturas, filtrar registros inactivos en consultas y validaciones, sincronizar tanto áreas curriculares como asignaturas y evitar que errores de transporte o respuestas inválidas se presenten como consultas exitosas con datos estáticos. La configuración local podrá utilizarse como caché/fallback únicamente si queda identificada como tal y no sustituye silenciosamente la fuente de verdad. La incorporación o actualización de áreas debe conservar el estado y actualizar los metadatos existentes sin reactivar registros deshabilitados.
- **Evidencia C1.31:** `getInstitutionalCatalog` (líneas 3824-3883) mapea `CatalogoAsignaturas` con `estado: r[4]`, aunque el encabezado creado por `getOrCreateSheet` define `CargaHorariaRef` en el índice 4 y `Estado` en el índice 5. También devuelve filas sin filtrar por estado. `validateCatalogReference` (líneas 3885-3915) acepta referencias sin comprobar que el registro esté activo. En `js/config.js`, `fetchInstitutionalCatalog` (líneas 806-835) devuelve `status:"success"` con el catálogo estático si falta `fetchApi`, la respuesta no tiene el formato esperado o la petición falla; solo sincroniza `areasCurriculares` y no actualiza el catálogo de asignaturas. `registerNewCurricularAreaServiceConfig` (líneas 938-965) no sincroniza cambios de metadatos de áreas ya existentes ni filtra áreas inactivas.
- **Criterios de Aceptación:** el campo Estado se obtiene de la columna correcta; áreas/asignaturas inactivas no aparecen como activas ni validan referencias; la respuesta mantiene un esquema y versión explícitos; el cliente sincroniza ambos catálogos; un fallo de red o contrato no se presenta como éxito de la fuente de verdad; los fallbacks se marcan explícitamente como datos locales/no autoritativos; actualizar o desactivar un área se refleja sin duplicados ni reactivación involuntaria; pruebas cubren registros activos/inactivos, referencia inválida, catálogo vacío, respuesta malformada y fallo de transporte.
- **Ampliación C1.37 / FASE2-T04 (fuente de verdad institucional):**
  1. Definir un inventario de catálogos y configuraciones con propietario, fuente autoritativa, lectores, escritores, ámbito (global/institucional/académico/departamental/técnico), esquema, identificador estable y política de conservación. Distinguir constantes técnicas legítimas del cliente de datos y reglas de negocio institucionales.
  2. Evitar que js/config.js sea una segunda fuente editable/autoritaria de capacidades, módulos, responsabilidades, áreas y departamentos. Las copias locales solo podrán ser caché explícita o valores técnicos no institucionales; todos los consumidores deben recibir el mismo contrato y los mismos identificadores.
  3. Corregir el contrato de getInstitutionalCatalog: respuestas uniformes y versionadas para cada catalogType, estado desde la columna real, filtros por estado y ámbito, y metadatos necesarios (incluido departamento cuando aplique). El tipo ALL debe poder validarse sin asumir que data es un array.
  4. Integrar validateCatalogReference en las operaciones de escritura que aceptan referencias (incluidas asignaturas, áreas y relaciones académicas); validar existencia, tipo, estado activo, ámbito y compatibilidad en servidor. No basta con exponer el validador como acción independiente.
  5. Corregir fetchInstitutionalCatalog para sincronizar áreas y asignaturas, actualizar metadatos de elementos existentes y respetar desactivaciones. Los errores de red, contrato, ausencia de fetchApi o respuesta incompleta deben permanecer como error/fallback identificado, nunca como success autoritativo.
  6. Preservar IDs y referencias históricas al renombrar/desactivar entidades; conservar historial de cambios o snapshots cuando la modificación de metadatos/estado pueda cambiar la interpretación de registros antiguos.
  7. Exigir configuraciones institucionales obligatorias y devolver errores identificables cuando falten; no sustituir silenciosamente referencias requeridas por General, IDs inventados, defaults globales o catálogos locales obsoletos.
  8. Permitir filtrado y resolución por departamento, nivel educativo y contexto cuando la regla sea contextual; no descartar departmentId ni mezclar configuraciones académicas con constantes técnicas.
  9. Reutilizar la política de versionado e invalidación ya registrada en TASK-062 (FASE2-T17/T19); no duplicar esa tarea. Reutilizar TASK-046 y AUD-NG-083/AUD-NG-084/AUD-NG-086 para el enrutamiento de fuentes; AUD-NG-158 para el estado de áreas y referencias inactivas.
- **Criterios adicionales de aceptación:**
  - Cada catálogo/configuración compartida tiene fuente, propietario, ámbito, esquema y consumidores documentados.
  - Dos módulos consultan la misma definición vigente y reciben el mismo identificador/estado.
  - La validación se ejecuta dentro de las escrituras backend; un ID inexistente, inactivo, de otro tipo o fuera del ámbito se rechaza.
  - Cambios de nombre conservan ID; desactivaciones no eliminan ni reescriben el significado histórico.
  - Los catálogos locales se marcan como caché/fallback no autoritativo y jamás permiten persistir una referencia sin revalidación del servidor.
  - Los defaults solo se aplican a campos opcionales; la falta de configuración obligatoria produce error identificable.
  - Las pruebas cubren tipos CURRICULAR_AREAS/SUBJECTS/ALL, estado activo/inactivo, ID/código, cambio de nombre, ámbito departamental, respuesta vacía/malformada, caché obsoleta y fallo de transporte.
- **Evidencia C1.37:** js/config.js conserva CAPACITIES_CATALOG, MODULES_CATALOG, RESPONSIBILITIES_CATALOG, CURRICULAR_AREAS_CATALOG y ACADEMIC_DEPARTMENTS_CATALOG como listas locales; fetchInstitutionalCatalog solo sincroniza áreas y devuelve status success con catálogo estático ante ausencia de API, respuesta inválida o error de transporte. registerNewCurricularAreaServiceConfig solo agrega si el ID no existe, no actualiza metadatos ni estado. En Academic, getInstitutionalCatalog (líneas 3824-3883) mapea asignaturas con estado:r[4], aunque el esquema define CargaHorariaRef en índice 4 y Estado en índice 5; no filtra inactivos y el tipo ALL devuelve un objeto mientras los tipos específicos devuelven arrays. validateCatalogReference (3885-3915) solo valida cuando data es array, no comprueba estado y no se invoca desde las escrituras de creación de asignaturas/áreas ni otras operaciones académicas; para ALL falla por la forma del objeto. getSubjectCatalog repite el índice de estado incorrecto. registerCurricularAreaExtension (4084-4145) sobrescribe metadatos/estado de una fila existente y fija Inactivo_PendientePruebas; el endpoint de catálogo omite departmentId. createSubjectCatalogItem genera ASIG- + timestamp y acepta areaAcademica || General. En User, getSharedConfigurationsCatalog (185-200) publica versiones estáticas, no un catálogo persistente de catálogos institucionales. La política de caché/versionado ya está ampliada en TASK-062; no se duplica aquí.
- **Estado:** [ ] Pendiente

---

<!-- ID: T-UX-02 | Fuentes: completadas.md -->
### [ ] [T-UX-02] Soporte Universal Tecla Escape para Cierre de Modales y Restauración de Foco
- **Origen del Hallazgo:** Auditoría de la Fase 3, octubre de 2026 (AUDITORIA_FASE3_EXPERIENCIA_USUARIO_NAVEGACION.md - Área 7)
- **Severidad/Clasificación:** Alto
- **Archivos Involucrados:** `js/ui-common.js`
- **Dependencias Expuestas:** Modales activos en la interfaz.
- **Descripción del Alcance:**
  1. Listener global `keydown` para capturar la tecla Escape (code 27).
  2. Cerrar modales activos ocultando elementos con clase `.hidden`.
- **Criterios de Aceptación:**
  - Presionar Escape cierra modales abiertos de forma limpia.
- **Estado:** Pendiente
- **Origen del Hallazgo:** Auditoría de la Fase 3 (AUDITORIA_FASE3_EXPERIENCIA_USUARIO_NAVEGACION.md - Área 7)

---

<!-- ID: TAREA-08 | Fuentes: completadas.md -->
### [ ] [TAREA-08] Implementar la estructura jerárquica de la malla curricular por áreas, asignaturas y departamentos
- **Origen del Hallazgo:** Auditoría de la Fase 1, octubre de 2026 (AUDITORIA_FASE1_PLANIFICACION_EXPANSION.md - Sección B & K)
- **Severidad/Clasificación:** Alto
- **Archivos Involucrados:** `backend/academic-service/Code.gs`, `js/config.js`, `js/teacher.js`, `teacher-dashboard.html`
- **Dependencias Expuestas:** Configuración académica, catálogo de asignaturas, planes de estudio, oferta académica, matrícula, asignaciones docentes y permisos.
- **Descripción del Alcance:**
  1. Estructura curricular configurable: Institución -> Modelo educativo/programa -> Nivel educativo -> Grado/curso -> Periodo/año lectivo -> Área curricular -> Departamento académico -> Asignatura -> Sección/grupo -> Docente responsable -> Criterios de evaluación.
  2. Catálogo inicial de 12 Áreas Curriculares: 1. Matemáticas y razonamiento cuantitativo; 2. Ciencias naturales; 3. Informática, tecnología y computación; 4. Español, comunicación y literatura; 5. Inglés y lenguas extranjeras; 6. Ciencias sociales y humanidades; 7. Artes y expresión creativa; 8. Educación física, salud y bienestar; 9. Formación en valores y desarrollo personal; 10. Emprendimiento, economía y formación profesional; 11. Agricultura, ambiente y sostenibilidad; 12. Áreas complementarias.
  3. Adaptación a modelos educativos (Currículo Nacional Básico de Honduras, Educación Media, Programas Bilingües, Estándares EE.UU., Modelos mixtos).
  4. Departamentos académicos configurables (Matemáticas, Ciencias, Informática, Español, Inglés, Sociales, Artes, Ed. Física).
  5. Gestión de asignaturas con código único, área, departamento, grado, programa, idioma, carga horaria, créditos, prerrequisitos, estado activo/inactivo.
  6. Integración con estructuras existentes (`CatalogoAsignaturas`, `PlanesEstudio`, `OfertaAcademica`, `AsignacionesDocentes`, `ConfiguracionAcademica`, `HistorialAcademico`, `MallaCurricularDist`).
- **Criterios de Aceptación:**
  - Un administrador autorizado puede crear un área curricular sin modificar el código.
  - Puede crear departamentos y asignarles responsables.
  - Puede crear asignaturas y relacionarlas con áreas, departamentos, grados y programas.
  - Puede configurar planes distintos para educación hondureña y programas bilingües.
  - Una asignatura puede impartirse en diferentes grados sin duplicar su identidad.
  - La plataforma puede representar asignaturas obligatorias y optativas.
  - Las asignaturas y áreas pueden desactivarse sin borrar sus historiales académicos.
  - Los docentes solo pueden gestionar las asignaturas y grupos que tienen asignados.
  - La configuración curricular se refleja correctamente en la oferta académica, los horarios y los paneles de docentes y estudiantes.
  - Las calificaciones históricas no se pierden al reorganizar las áreas.
  - Las áreas y asignaturas nuevas aparecen en los formularios, filtros y reportes correspondientes.
- **Estado:** Pendiente

---

<!-- ID: TAREA-09 | Fuentes: completadas.md -->
### [ ] [TAREA-09] Crear un servicio de Apps Script especializado para cada área curricular
- **Origen del Hallazgo:** Auditoría de la Fase 1, octubre de 2026 (AUDITORIA_FASE1_PLANIFICACION_EXPANSION.md - Sección D & K)
- **Severidad/Clasificación:** Alto
- **Archivos Involucrados:** `backend/academic-service/Code.gs`, `backend/task-service/Code.gs`, `backend/exam-service/Code.gs`, `js/config.js`, `js/api.js`
- **Dependencias Expuestas:** Tarea 08, arquitectura de servicios, autenticación, almacenamiento y modelos de tareas y exámenes.
- **Descripción del Alcance:**
  1. Registrar un servicio de Apps Script especializado para cada área curricular activa (Matemáticas, Informática, Ciencias, Español, Inglés, Sociales, Artes, Ed. Física, etc.).
  2. Responsabilidades comunes: consultar asignaturas/grupos, crear/editar/publicar/programar tareas, adjuntar materiales, recibir entregas, calificar con rúbricas/comentarios, gestionar exámenes con calificación automática/manual e integrar notas al sistema académico.
  3. Especialización pedagógica por área:
     - *Matemáticas:* Editor de expresiones matemáticas, preguntas numéricas/algebraicas, procedimientos paso a paso, tolerancias numéricas configurables, gráficas, rúbricas de procedimiento.
     - *Informática:* Entrega de código fuente/proyectos, editor/evaluador de pseudocódigo, pruebas automatizadas, rúbricas de eficiencia/legibilidad, historial de versiones.
     - *Ciencias:* Informes de laboratorio, hipótesis/conclusiones, análisis de datos/gráficos.
     - *Español y Comunicación:* Entregas de texto extenso, comentarios en línea, rúbricas de redacción/gramática, evaluaciones de comprensión lectora.
     - *Inglés y Lenguas:* Comprensión oral/escrita, vocabulario/gramática, entregas de audio, rúbricas de expresión oral.
     - *Ciencias Sociales:* Análisis de fuentes históricas, mapas, cronologías, ensayos.
     - *Artes:* Imágenes, audio, video, galerías de proyectos, rúbricas creativas.
     - *Educación Física:* Informes de hábitos saludables, rúbricas de desempeño práctico.
  4. Integración y aislamiento con configuración e identificadores estables sin modificar datos de otros servicios libremente.
- **Criterios de Aceptación:**
  - Cada área activa puede asociarse a un servicio de Apps Script propio.
  - Un servicio puede configurarse y probarse sin duplicar todo el backend.
  - Un docente accede únicamente a las tareas y evaluaciones de las asignaturas que tiene asignadas.
  - Las entregas y revisiones conservan su relación con el estudiante y la asignatura.
  - Los errores de un servicio no interrumpen operaciones no relacionadas de otras áreas.
  - Los servicios especializados ofrecen herramientas adecuadas a las características de su área.
  - Las áreas que no necesitan una herramienta específica no reciben controles innecesarios.
  - Las calificaciones se integran correctamente con el historial académico.
  - La desactivación de un área no elimina tareas, entregas ni resultados históricos.
  - Se pueden incorporar áreas nuevas sin reconstruir los servicios comunes.
- **Estado:** Pendiente

---

<!-- ID: TAREA-17 | Fuentes: completadas.md -->
### [ ] [TAREA-17] Incorporar analítica académica por área, asignatura y programa
- **Origen del Hallazgo:** Auditoría de la Fase 1, octubre de 2026 (AUDITORIA_FASE1_PLANIFICACION_EXPANSION.md - Sección B & K)
- **Severidad/Clasificación:** Bajo
- **Archivos Involucrados:** `backend/academic-service/Code.gs`, `js/teacher.js`, `teacher-dashboard.html`
- **Dependencias Expuestas:** Tareas 08, 12 y 13, además de las estructuras de calificaciones.
- **Descripción del Alcance:**
  1. Analítica de distribución de notas, tendencias de rendimiento por parcial y alertas de acompañamiento pedagógico.
  2. Comparativas homogéneas por grado, sección, programa e idioma de enseñanza.
  3. Exclusión explícita de notas pendientes en promedios para evitar distorsiones.
  4. Exportación de informes analíticos para Dirección y coordinadores.
- **Criterios de Aceptación:**
  - Los indicadores coinciden con los datos académicos de origen.
  - Los filtros no mezclan periodos o programas incompatibles.
  - Los resultados pendientes no distorsionan los promedios.
  - Los usuarios solo pueden consultar la información que les corresponde.
  - Los informes identifican los criterios usados para cada comparación.
- **Estado:** Pendiente

---

<!-- ID: TAREA-18 | Fuentes: completadas.md -->
### [ ] [TAREA-18] Ampliar la reutilización de recursos educativos y actividades entre áreas
- **Origen del Hallazgo:** Auditoría de la Fase 1, octubre de 2026 (AUDITORIA_FASE1_PLANIFICACION_EXPANSION.md - Sección B & K)
- **Severidad/Clasificación:** Bajo
- **Archivos Involucrados:** `backend/academic-service/Code.gs`, `js/teacher.js`, `teacher-dashboard.html`
- **Dependencias Expuestas:** Tarea 08, materiales educativos, almacenamiento y servicios curriculares.
- **Descripción del Alcance:**
  1. Catálogo de recursos reutilizables etiquetados por área, materia, grado, tema e idioma.
  2. Proyectos interdisciplinarios compartidos entre departamentos.
  3. Gestión de versiones de materiales sin alterar actividades publicadas en periodos anteriores.
- **Criterios de Aceptación:**
  - Un recurso puede localizarse desde su área o asignatura.
  - Los recursos compartidos conservan sus permisos y relaciones.
  - Las modificaciones no alteran actividades históricas de forma silenciosa.
  - Los docentes pueden reutilizar recursos autorizados sin duplicar archivos innecesariamente.
  - Los proyectos interdisciplinarios pueden relacionar recursos de varias áreas.
- **Estado:** Pendiente

---

<!-- ID: TAREA-19 | Fuentes: completadas.md -->
### [ ] [TAREA-19] Implementar configuración y migración curricular sin pérdida de datos
- **Origen del Hallazgo:** Auditoría de la Fase 1, octubre de 2026 (AUDITORIA_FASE1_PLANIFICACION_EXPANSION.md - Sección B & K)
- **Severidad/Clasificación:** Bajo
- **Archivos Involucrados:** `backend/academic-service/Code.gs`, `js/teacher.js`, `teacher-dashboard.html`
- **Dependencias Expuestas:** Tarea 08, catálogo de asignaturas, historial académico y estructura de almacenamiento.
- **Descripción del Alcance:**
  1. Herramienta de mapeo y equivalencias curriculares para planes anteriores.
  2. Preservación inalterable de códigos de estudiantes, calificaciones históricas y boletines emitidos.
  3. Bucle de pre-validación y reportes de discrepancias antes de ejecutar migraciones.
  4. Mecanismo de reversión (rollback) seguro.
- **Criterios de Aceptación:**
  - Las asignaturas existentes quedan correctamente vinculadas o se reportan como pendientes.
  - No se pierden calificaciones ni relaciones históricas.
  - Las equivalencias curriculares requieren validación cuando no son inequívocas.
  - Las migraciones detectan registros duplicados o huérfanos.
  - Los resultados pueden compararse antes y después de la migración.
  - La reversión recupera el estado anterior cuando sea necesaria.
- **Estado:** Pendiente

---

<!-- ID: TAREA-20 | Fuentes: completadas.md -->
### [ ] [TAREA-20] Formalizar la incorporación de nuevas áreas y servicios curriculares
- **Origen del Hallazgo:** Auditoría de la Fase 1, octubre de 2026 (AUDITORIA_FASE1_PLANIFICACION_EXPANSION.md - Sección B & K)
- **Severidad/Clasificación:** Bajo
- **Archivos Involucrados:** `backend/academic-service/Code.gs`, `js/config.js`
- **Dependencias Expuestas:** Tareas 05, 08 y 09, contratos de servicios y configuración institucional.
- **Descripción del Alcance:**
  1. Plantilla técnica estandarizada para registro de nuevas áreas curriculares y servicios de Apps Script.
  2. Protocolo de pruebas específicas por área previo a su habilitación en producción.
  3. Desactivación segura de áreas preservando historiales y entregas pasadas.
- **Criterios de Aceptación:**
  - Se puede incorporar una nueva área siguiendo un procedimiento documentado.
  - El servicio queda vinculado al área correcta y dispone de permisos adecuados.
  - Los componentes compartidos se reutilizan sin duplicar toda la lógica.
  - La activación de una nueva área no altera los servicios existentes.
  - Las pruebas del servicio se ejecutan antes de habilitarlo para usuarios.
  - Las áreas desactivadas conservan sus registros históricos.
- **Estado:** Pendiente

---

<!-- ID: TASK-406 | Fuentes: Pendientes.md ; pendientes/Docente/Pendientes.md -->
### [ ] [TASK-406] [P2] [Analítica Académica Avanzada - Análisis de Cohortes y Seguimiento Longitudinal de Estudiantes]
- **Componentes Afectados:**
  - `backend/academic-service/Code.gs`
- **Dependencias Expuestas:** Protección histórica existente, DataMart (`F24-Task05`), series históricas (`F24-Task07`), filtros (`F24-Task03`).
- **Capacidades Relacionadas:** F24-A03, F24-005.
- **Problema Detectado:**
  No existe un mecanismo para analizar grupos de estudiantes a lo largo de varios ciclos académicos, lo que limita el estudio de permanencia, rendimiento y evolución institucional.
- **Requisitos Funcionales:**
  1. Incorporar capacidades de agrupación de estudiantes por cohortes históricas.
  2. Permitir definir cohortes según:
     - Año de ingreso a la institución.
     - Ciclo académico de inicio.
     - Nivel educativo de matrícula inicial.
     - Grado inicial.
     - Programa o modalidad académica, cuando corresponda.
  3. Seguir longitudinalmente la evolución de cada cohorte a través de los sucesivos años lectivos.
  4. Consultar y graficar para cada cohorte:
     - Matrícula inicial de la cohorte.
     - Estudiantes que permanecen activos ciclo a ciclo.
     - Traslados de grado o sección.
     - Retiros definitivos registrados.
     - Estudiantes egresados o graduados.
     - Tasa de permanencia porcentual.
     - Evolución del rendimiento académico promedio de la cohorte.
     - Tasa de reprobación acumulada.
  5. Permitir comparar visual y numéricamente dos o más cohortes diferentes.
  6. Diferenciar con precisión estudiantes que se trasladan internamente de aquellos que desertan o abandonan la institución.
  7. Mantener identificadores históricos estables que vinculen al alumno a través de los ciclos.
  8. Respetar estrictamente los permisos RBAC/ABAC sobre la consulta de información individual y anonimizar datos cuando se presenten métricas agregadas.
- **Cambios Necesarios:**
  - Incorporar mecanismos de identificación y etiquetado de cohortes en el modelo de datos.
  - Integrar los registros históricos de matrículas y movimientos de expedientes estudiantiles.
  - Incorporar endpoints de consulta longitudinal (`getStudentCohortLongitudinalAnalytics`).
  - Integrar los resultados analíticos con el DataMart y las vistas de series históricas.
  - Crear componentes visuales de seguimiento matricial de cohortes en la interfaz.
- **Comportamiento Esperado:**
  La institución podrá seleccionar una cohorte de ingreso y seguir su evolución durante diferentes años lectivos, identificando permanencia, rendimiento y movimientos.
- **Criterios de Aceptación:**
  - [ ] Cada estudiante se vincula de manera unívoca con la cohorte correspondiente a su ingreso.
  - [ ] Las promociones o cambios de grado ordinarios no alteran la pertenencia a la cohorte original.
  - [ ] Los traslados internos de sección no se contabilizan erróneamente como deserción.
  - [ ] Los retiros definitivos se contabilizan fidedignamente según su estado y fecha efectiva.
  - [ ] Las cifras agregadas de la cohorte coinciden con los registros históricos individuales de matrícula.
  - [ ] La comparación entre diferentes cohortes utiliza períodos y métricas equivalentes.
  - [ ] Los resultados analíticos históricos permanecen estables ante cambios en la configuración académica actual.
- **Estado:** [ ] Pendiente

<!-- Fuente: RECUPERACION/Pendientes_RECUPERADO.md, líneas 15119-15175; clave TASK-417; asignación única: Docente -->

---

<!-- ID: TASK-417 | Fuentes: Pendientes.md ; pendientes/Docente/Pendientes.md -->
### [ ] [TASK-417] [P2] [SACE - Fortalecimiento de la Generación y Validación de Archivos SACE Oficiales]
- **Componentes Afectados:**
  - `backend/accounting-service/Code.gs`
  - Hojas `PlantillasSACEVerificadas`, `CalificacionesEstudiantes`
- **Estado de Partida:** Completa y verificada; optimización y ampliación controlada.
- **Dependencias Expuestas:** F25-003, F25-004 y F25-017.
- **Capacidades Relacionadas:** F25-008, F25-017.
- **Problema que Resuelve:**
  La generación de archivos SACE ya valida columnas obligatorias, conserva estados no evaluables y aplica la regla de recuperación identificada en la auditoría. No corresponde reconstruir estas capacidades. La mejora consiste en ampliar la administración de plantillas, la validación de datos y la trazabilidad de los archivos generados, evitando que la compatibilidad dependa de una única estructura fija.
- **Requisitos Funcionales:**
  1. Administración ampliada de plantillas SACE:
     - Mantener plantillas independientes por procedimiento oficial (Matrícula inicial, Calificaciones parciales, Cuadro final de rendimiento).
     - Identificar la versión oficial de cada plantilla.
     - Registrar procedencia institucional y fecha de verificación.
     - Identificar campos obligatorios y opcionales.
     - Identificar tipos de datos y valores admitidos por la Secretaría de Educación de Honduras.
     - Detectar cambios de estructura oficial.
     - Permitir desactivar plantillas obsoletas conservando versiones históricas.
  2. Validación académica estricta:
     - Conservar las reglas existentes verificadas: identificación del estudiante (DNI/código SACE), nombre del alumno, calificación ordinaria, calificación de recuperación, estados no evaluables (`Pendiente`, `Exento`, `Ausente`) y cálculo de nota final (`Math.max(ordinaria, recuperacion)`).
     - No convertir automáticamente valores como `Pendiente`, `Exento` o `Ausente` en cero (0).
     - La regla de cálculo de recuperación no debe modificarse sin verificar que corresponde al procedimiento oficial y a la plantilla vigente.
  3. Validaciones adicionales previas a la generación:
     - Identificar estudiantes matriculados sin correspondencia en el cuadro SACE.
     - Detectar identificadores repetidos en el grupo evaluado.
     - Detectar calificaciones fuera de rango (menores a 0 o mayores a 100).
     - Comprobar campos obligatorios completos.
     - Validar que el período académico coincida con el ciclo evaluado.
     - Identificar asignaturas o secciones incompatibles.
     - Advertir sobre registros incompletos mostrando lista de errores antes de generar el archivo final.
  4. Evidencia y trazabilidad de generación:
     - Relacionar cada archivo con plantilla y versión, período académico, asignatura, sección, docente responsable, fecha y hora de generación, datos incluidos y resultado de validación.
- **Cambios Necesarios:**
  1. Ampliar la administración de plantillas verificadas en `PlantillasSACEVerificadas`.
  2. Relacionar plantillas con procedimientos específicos de Secretaría de Educación.
  3. Integrar validaciones de integridad académica en `fillAndExportSACETemplate`.
  4. Incorporar control de estudiantes duplicados y notas fuera de rango.
  5. Incorporar información de procedencia y versión al historial de descargas.
  6. Mantener el formato de salida requerido por cada plantilla oficial.
  7. Evitar modificar las reglas académicas ya verificadas sin necesidad demostrada.
- **Comportamiento Esperado:**
  El personal docente y de secretaría podrá generar cuadros SACE oficiales con validación previa exhaustiva, garantizando que el archivo cumpla las normativas de la Secretaría de Educación sin alterar calificaciones de los estudiantes.
- **Criterios de Aceptación:**
  - [ ] Generar un archivo utilizando la plantilla actualmente verificada y comprobar que se conserva su estructura oficial.
  - [ ] Verificar que los estados no evaluables (`Pendiente`, `Exento`, `Ausente`) permanecen intactos sin transformarse en cero.
  - [ ] Probar calificaciones ordinarias y de recuperación verificando el cálculo de nota final SACE.
  - [ ] Probar valores fuera de rango (< 0 o > 100) y comprobar que son bloqueados con advertencia clara.
  - [ ] Probar estudiantes duplicados en la lista y verificar detección.
  - [ ] Probar estudiantes sin identificación válida y comprobar reporte de inconsistencia.
  - [ ] Comprobar que una plantilla obsoleta genera una advertencia o bloqueo según su nivel de incompatibilidad.
  - [ ] Verificar que el archivo generado queda vinculado a su plantilla, versión y responsable en auditoría.
  - [ ] Comprobar que las 53 pruebas de la suite académica existente continúan aprobadas al 100%.
  - [ ] Verificar que no se presenta el archivo como aceptado por SACE si no se ha realizado una validación oficial de carga.
- **Estado:** [ ] Pendiente

<!-- Fuente: RECUPERACION/Pendientes_RECUPERADO.md, líneas 15400-15462; clave TASK-424; asignación única: Docente -->

---

<!-- ID: TASK-424 | Fuentes: Pendientes.md ; pendientes/Docente/Pendientes.md -->
### [ ] [TASK-424] [P2] [Continuidad Offline - Continuidad Operativa Fuera de Línea y Sincronización Diferida Académica]
- **Componentes Afectados:**
  - `js/api.js`
  - `js/teacher.js`
  - `backend/academic-service/Code.gs`
  - Hojas `RegistrosAsistencia`, `CalificacionesEstudiantes`
  - Almacenamiento local del navegador (`localStorage` / `IndexedDB`)
- **Subcapacidades Relacionadas:** F27-008, F27-006.
- **Estado de Partida:** Implementada parcialmente.
- **Dependencias Expuestas:** Idempotencia (`getIdempotencyPayloadSignature`), sincronización, validación académica y almacenamiento local.
- **Problema Detectado:**
  La plataforma dispone de fallback local en delegaciones interservicios, pero no cuenta con una estrategia estandarizada de funcionamiento fuera de línea para la captura de información académica crítica en el aula. La pérdida de conectividad durante la jornada de clases impide a los docentes registrar asistencias o capturar borradores de calificaciones, aun cuando los datos podrían guardarse localmente y sincronizarse de forma diferida al restablecerse la red.
- **Requisitos Funcionales:**
  1. Operaciones académicas habilitadas fuera de línea:
     - Asistencia: consultar listas descargadas, registrar presentes, ausencias, tardanzas, justificaciones y observaciones permitidas.
     - Calificaciones: consultar nóminas y asignaturas descargadas, capturar calificaciones como borradores locales (`esBorrador: true`) y editar notas locales no sincronizadas.
     - Bloquear operaciones que exijan validación en vivo del servidor (ej. cierre oficial de actas, promociones).
  2. Preparación y descarga de datos locales con conexión activa:
     - Descargar listas de estudiantes, asignaturas autorizadas, horarios y reglas de evaluación para la sesión de trabajo.
  3. Almacenamiento local persistente y seguro:
     - Guardar en almacenamiento estructurado del navegador (`IndexedDB` / `localStorage` cifrado) con metadatos: `operacionLocalId`, `userId`, tipo operación, timestamp de captura local, versión de datos y estado.
     - No depender de variables volátiles en memoria; resistir el cierre o recarga de la página.
  4. Estados de sincronización transparentes en UI:
     - `Guardado local`, `Pendiente de sincronización`, `En proceso`, `Sincronizado`, `Rechazado`, `En conflicto`.
     - Nunca presentar un dato guardado localmente como registrado oficialmente en el sistema hasta recibir confirmación del backend.
  5. Sincronización automática y manual:
     - Detección de recuperación de conectividad (`navigator.onLine` / eventos de red) y disparo de sincronización por lotes.
     - Botón de sincronización manual con indicador de cantidad de operaciones pendientes.
  6. Idempotencia y protección contra duplicados:
     - Cada operación local conserva su identificador único; reintentos no deben crear filas duplicadas en `RegistrosAsistencia` ni en calificaciones.
  7. Validación estricta en servidor antes de aplicar:
     - Validar permisos docentes, correspondencia de grado/sección, estados de períodos (rechazar si el período se cerró mientras estaba desconectado) y rangos numéricos.
     - Conservar por separado la fecha real de captura en aula y la fecha de recepción en servidor.
  8. Detección y resolución de conflictos:
     - Detectar colisiones si otro usuario o proceso modificó la calificación en el servidor durante la desconexión.
     - No aplicar política ciega de "el último gana"; presentar diferencias y solicitar confirmación al docente autorizado.
  9. Aislamiento y seguridad local:
     - Limpiar datos locales al cerrar sesión formal para evitar que otro usuario del mismo dispositivo acceda a información de alumnos ajenos.
- **Cambios Necesarios:**
  - Implementar módulo `OfflineSyncManager` en `js/api.js`.
  - Adaptar formularios de asistencia en `js/teacher.js` para operar en modo offline-first con indicador visual de conectividad.
  - Implementar endpoint en backend `syncOfflineAttendanceAndGrades` con validaciones de período y candados atómicos.
  - Registrar eventos de sincronización diferida en auditoría.
- **Comportamiento Esperado:**
  Un docente puede preparar sus listas y capturar asistencias o borradores de calificaciones sin conexión a internet. Al restablecerse la red, la plataforma sincroniza las operaciones válidas, detecta conflictos y actualiza los registros oficiales sin duplicaciones.
- **Criterios de Aceptación:**
  - [ ] El docente puede consultar listas de alumnos previamente descargadas estando sin conexión a internet.
  - [ ] Es posible registrar asistencias completas de un grupo en modo fuera de línea.
  - [ ] Es posible capturar calificaciones parciales como borradores locales en modo fuera de línea.
  - [ ] Las operaciones pendientes se conservan íntegras tras cerrar y volver a abrir el navegador.
  - [ ] La interfaz gráfica distingue claramente entre datos guardados localmente y registros confirmados oficialmente por el servidor.
  - [ ] Al detectar conexión, el sistema inicia automáticamente la sincronización de tareas pendientes.
  - [ ] La interfaz proporciona un botón funcional para sincronización manual inmediata.
  - [ ] Una operación sincronizada no se duplica en la base de datos ante reintentos de red.
  - [ ] El servidor valida rigurosamente los permisos docentes y períodos académicos antes de persistir.
  - [ ] Una operación capturada para un período que fue cerrado durante la desconexión es rechazada con aviso claro.
  - [ ] Las modificaciones concurrentes entre local y servidor se detectan y presentan como conflicto para revisión.
  - [ ] Se conservan en auditoría la fecha/hora original de captura en el aula y la fecha de sincronización en el servidor.
  - [ ] Una sincronización interrumpida a la mitad puede reanudarse sin pérdida ni duplicación de registros.
  - [ ] Cerrar sesión limpia de forma segura el almacenamiento local para prevenir exposición de datos a terceros.
- **Estado:** [ ] Pendiente
