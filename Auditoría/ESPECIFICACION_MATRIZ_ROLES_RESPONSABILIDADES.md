# Especificación funcional — Matriz configurable de normas, responsabilidades y acceso por rol

**Estado:** propuesta normativa/arquitectónica pendiente de ratificación institucional y revisión legal hondureña.  
**Rama:** `NG_beta_0.0.0.1_work`. **Checkpoint:** C1.412.  
**Alcance:** diseño de reglas; no activa permisos ni crea asignaciones productivas.

## 1. Principios

1. Roles, responsabilidades, autoridad, ámbitos, tipos documentales y operaciones se administran desde IMA; nunca se fijan nombres personales como titulares estáticos en reglas, código o plantillas.
2. La autorización se concede a un rol vigente, en ámbito concreto y para operación específica. La identidad autenticada de quien ejecuta la acción permanece separada en auditoría protegida.
3. Se aplican mínimo privilegio, necesidad de conocer, segregación de funciones y denegación por defecto.
4. Autoría, creación, carga o emisión no confieren automáticamente acceso posterior, propiedad, custodia, aprobación, firma ni facultad de delegar.
5. La autoría puede proponer un rol responsable solo entre candidatos elegibles calculados por la matriz. La plataforma valida; si requiere aprobación, no se activa hasta que se apruebe.
6. Una asignación individual no puede ampliar la política máxima ni habilitar roles excluidos.
7. Las políticas tienen versión, vigencia, aprobación, historial, pruebas y reversión. Los cambios no reescriben la atribución histórica.

## 2. Catálogos configurables

Administración normativa autorizada gestiona:
- Roles: Titular Institucional/Representante Legal, Dirección, Secretaría, Asistencia de Dirección, Asistencia de Secretaría, Contaduría, Asistencia de Contaduría, Docencia y otros aprobados.
- Responsabilidades: titular funcional, propietario institucional, custodio, autor, registrador, revisor, aprobador, firmante y responsable de corrección.
- Recursos: expediente académico, expediente de personal, documento institucional, acta, certificación, desempeño por asignatura, expediente financiero y otros tipos clasificados.
- Operaciones: listar, consultar, crear, cargar, editar, corregir, clasificar, proponer/asignar responsable, revisar, aprobar, firmar, descargar, exportar, compartir, archivar, retener, eliminar según política y administrar reglas.
- Ámbitos: institución/tenant, sede, nivel, período, grupo/sección, estudiante, asignatura, expediente y documento.
- Membresías/delegaciones: rol, ámbito, vigencia, estado, motivo, aprobación, suplencia, revocación y evidencia.

Existir en el catálogo no concede acceso: se requiere membresía vigente, ámbito válido y política aplicable.

## 3. Matriz de roles y límites

| Rol | Alcance permitido | Límites |
|---|---|---|
| Titular Institucional / Representante Legal | Máxima responsabilidad institucional y representación legal únicamente cuando exista nombramiento o poder válido; supervisión, decisiones reservadas y aprobación de políticas institucionales | No es desarrollador ni administrador técnico por defecto. No debe usar autoridad legal para eludir segregación, auditoría o controles financieros. |
| Dirección | Dirección y supervisión operativa/académica dentro de facultades configuradas | No obtiene acceso técnico irrestricto ni control financiero universal. |
| Secretaría | Registro, gestión y custodia documental de expedientes académicos/administrativos y documentos oficiales conforme a política | Sin acceso financiero detallado por defecto. |
| Asistencia de Dirección | Solo tareas y operaciones delegadas, con ámbito y vencimiento | No hereda automáticamente aprobación final, firma ni delegación. |
| Asistencia de Secretaría | Registro, consulta y preparación documental delegados | Sin certificación, aprobación final, firma o administración de permisos salvo facultad expresa. |
| Contaduría | Documentos y operaciones financieras/contables estrictamente necesarios | No accede por defecto a desempeño académico, orientación, disciplina, salud o expedientes completos de personal. |
| Asistencia de Contaduría | Tareas financieras delegadas y acotadas por operación, ámbito, vigencia y, cuando aplique, monto | Sin aprobación final, firma, conciliación o liberación de pagos por defecto. |
| Docencia | Desempeño de estudiantes únicamente en asignaturas, grupos/secciones y períodos oficialmente asignados | No accede al expediente global del alumno, otras asignaturas, finanzas, datos familiares, disciplina, salud o expedientes de empleados. |
| Padre/madre/representante | Ninguna responsabilidad ni autoridad interna. Portal externo limitado a información del estudiante representado cuando proceda legalmente | Excluido de custodia, asignación interna, revisión, aprobación, firma, administración y expedientes ajenos. |
| Alumno/estudiante | Ninguna responsabilidad ni autoridad interna. Portal externo limitado a sus propios datos publicables conforme a ley y política | Excluido de expedientes ajenos, documentos internos, asignación de responsables, aprobación y administración. |
| Otro empleado sin rol habilitado | Sin acceso a antecedentes protegidos por defecto; solo acceso operativo mínimo definido por política separada ratificada | Condición de empleado, autoría, carga de archivo o conocimiento de URL no concede acceso. |

La matriz es un límite inicial. Puede restringirse más, nunca ampliarse individualmente fuera de política. Otros roles de empleados quedan denegados para estos recursos hasta su incorporación y aprobación formal.

## 4. Regla estricta para Docencia

El permiso exige simultáneamente: membresía vigente en Docencia; asignación oficial vigente a la asignatura; grupo/sección, sede y período coincidentes; estudiante perteneciente a ese grupo; recurso clasificado como desempeño de esa asignatura; y operación permitida. Si una condición falta, expiró o no coincide, se deniega. Ser docente de una asignatura no permite ver notas de otras asignaturas del mismo estudiante ni su expediente completo. Al cambiar la carga académica, el alcance futuro se actualiza sin alterar autoría histórica.

## 5. Autoría y propuesta de responsable

Al registrar un documento, la persona autora puede clasificarlo, indicar ámbito/expediente y proponer un rol responsable, custodio o revisor entre los candidatos elegibles. IMA debe excluir automáticamente a representantes, alumnos, empleados sin rol habilitado y roles ajenos al dominio documental. Debe diferenciar autor, responsable funcional, propietario institucional, custodio, aprobador y firmante; guardar propuesta, validación, aprobación/rechazo, rol final, actor, vigencia y versión de regla. La autoría no concede privilegios ni permite autoasignarse aprobación final cuando exista incompatibilidad.

## 6. Flujos iniciales por tipo documental

- **Expediente académico oficial:** Secretaría registra/custodia; Dirección supervisa o aprueba cuando proceda; Docencia solo gestiona desempeño de su asignatura; portal externo para estudiante/representante solo con alcance legalmente permitido.
- **Desempeño por asignatura:** Docente asignado consulta/registra únicamente su asignatura y grupo; Secretaría/Dirección solo con política explícita; Contaduría excluida.
- **Expediente financiero:** Contaduría gestiona; Asistencia ejecuta tareas delegadas; aprobaciones/pagos segregados; Docencia, alumnado y representantes excluidos.
- **Expediente de personal:** acceso limitado a roles administrativos expresamente aprobados; Contaduría solo a componentes necesarios de nómina/contabilización si se aprueba y es legal.
- **Documento institucional general:** Secretaría registra/custodia; Dirección aprueba cuando corresponda; asistencia ejecuta tareas delegadas; Titular Institucional interviene en decisiones reservadas.

Son perfiles propuestos, no declaración de autoridad ya vigente ni sustituto de ratificación.

## 7. Controles de plataforma

- Decisión de autorización en servidor para UI, API, endpoints, búsquedas, reportes, exportaciones, descargas, enlaces y vistas previas.
- Validación de tenant, institución, sede, período, asignatura, grupo, relación con estudiante, recurso y operación en cada solicitud.
- Denegación por defecto y no revelación de existencia de expedientes a usuarios no autorizados.
- Revocación efectiva al expirar membresía/delegación; invalidación de cachés/sesiones conforme al diseño de identidad.
- Segregación entre creación, revisión, aprobación, firma, pagos y administración de reglas.
- Bloqueo de escalamiento por ID/URL/parámetros/API.
- Auditoría protegida: actor autenticado, rol efectivo, ámbito, recurso, operación, resultado, fecha/hora, versión de política, delegación y motivo.
- Excepciones de emergencia temporales, justificadas, aprobadas, alertadas y revisadas; nunca acceso universal silencioso.

## 8. Administración de políticas

Borradores solo por rol autorizado; publicación con aprobación separada; validación de conflictos, roles excluidos, ámbitos excesivos, incompatibilidades y pruebas; versión y vigencia; aplicación prospectiva por defecto; retroactividad solo con fundamento y aprobación; simulación previa, historial y reversión. Si no existe responsable/aprobador elegible, el flujo queda pendiente y se escala sin asignación automática.

## 9. Pruebas de aceptación

1. Padre/madre/representante y alumno no aparecen como candidatos a autoridad/responsabilidad interna.
2. Empleado sin rol habilitado no abre expedientes mediante ID o URL.
3. Contaduría no consulta evaluaciones ni expedientes académicos por defecto.
4. Asistencia de Contaduría no libera pagos ni aprueba operaciones reservadas sin facultad separada.
5. Asistentes de Dirección/Secretaría no heredan facultades superiores sin delegación explícita.
6. Docente solo accede a asignaturas, grupos y períodos asignados; se deniega otra asignatura del mismo alumno.
7. Expiración de asignación docente revoca acceso futuro y preserva trazabilidad histórica.
8. Autoría no concede acceso ni aprobación; el autor solo propone roles elegibles.
9. Cambiar ocupante no reescribe documentos históricos.
10. UI, API, búsqueda, descarga, exportación y URL directa aplican la misma matriz.
11. Falta de asignación o aprobación válida bloquea el flujo.
12. No hay autoasignación, elevación de privilegios ni conflictos de segregación.

## 10. Ratificación y límites

Requiere ratificación de la autoridad institucional competente y asesoría legal hondureña sobre derechos de estudiantes/representantes, datos de menores, expedientes, privacidad, conservación, obligaciones laborales y contables. T153-S01 sigue bloqueada hasta que se documente la autoridad institucional y fuente canónica. Esta propuesta no declara oficial el organigrama, no crea roles/membresías/permisos reales y no modifica código, esquemas ni datos productivos. Pruebas no ejecutadas.
