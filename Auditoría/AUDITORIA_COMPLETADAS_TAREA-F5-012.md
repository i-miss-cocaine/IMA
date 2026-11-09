# AUDITORÍA TÉCNICA - TAREA-F5-012: seguimiento de aspirantes en el Portal Familiar

- **Repositorio:** `i-miss-cocaine/IMA`
- **Rama auditada:** `NG_beta_0.0.0.1_work`
- **HEAD de partida:** `edde10f41e00ea2d266a508605b8454606caa378`
- **Árbol de partida:** `a72f9b7719477a3ed8d45012773586bcd683de16`
- **Rama base protegida:** `NG_beta_0.0.0.1`, SHA `44d9891132332e692dbe2ba8602b41f50a508a59`
- **Checkpoint de inicio:** C1.207
- **Checkpoint de cierre:** C1.208
- **ID operativo de sesión:** `IMA-AUDIT-20261107-1444Z` (identificador de auditoría, no ID nativo de ChatGPT)
- **Fecha de auditoría:** 2026-11-07
- **Dictamen:** **NO CUMPLE**

## 1. Búsqueda documental, continuidad y fuentes

Se buscó `AUDITORIAS/AUDITORIA_COMPLETADAS_TAREA-F5-012.md` en el árbol actual y en el historial consultable de la rama. No existe. Tampoco existe una variante `AUDITORIAS/AUDITORIA_TAREA-F5-012.md`. La consulta de historial por la ruta individual devolvió cero commits. El informe de origen citado, `AUDITORIA_FASE_5_ADMISIONES_PORTAL_FAMILIAS.md`, tampoco aparece en el árbol ni en el historial consultado. La lista de `AUDITORIAS/` contiene informes individuales hasta F5-011, sin F5-012.

**Origen no verificable:** `completadas.md` cita `Auditoria.txt` (HALLAZGOS-F5-P0-01) y el informe de fase anterior. El identificador exacto `HALLAZGOS-F5-P0-01` no aparece en el `AUDITORIAS/Auditoria.txt` vigente (SHA `0aade9edf851121dc4c3aef031ded25a65512921`). Sí aparece el nombre del informe de fase como referencia histórica, pero el archivo fuente no está disponible. `ChangesLogs.txt` (SHA `5b5cff1926b73a05d1b92087a7bf4b2db75326ff`, líneas 1868-1878) declara que el selector y el panel familiar fueron implementados; esa declaración histórica no sustituye la comprobación del código y contradice el HTML actual.

**Requisitos y estado administrativo:** `completadas.md` SHA `f57f1aef832e81e44fc4f7ec36a852d50e464676`, líneas 2197-2232. La tarea está marcada [X] Completada y contiene 13 puntos de alcance y 8 criterios [x]. Se contrastaron todos contra el código vigente. No se modifica la marca histórica de completada durante una auditoría.

**Pendientes.md:** lectura ordinaria de la rama devolvió 0 caracteres, pero el SHA es `631b4c2dbf0e86d5704b63625382d73ccb8ceb3c`. Se leyó directamente el blob Git: 1,782,094 caracteres, 1 líneas, sin U+FFFD. Inventario de encabezados: 693 IDs, 693 únicos (509 TASK y 184 AUD-NG), sin duplicados; último ID de encabezado: `TASK-511`. No existe entrada directa TAREA-F5-012. Dependencias ya registradas relevantes: AUD-NG-002, AUD-NG-036, AUD-NG-145, AUD-NG-161, AUD-NG-222, TASK-140, TASK-142, TASK-146 y TASK-153.

**Precedencia de instrucciones:** la sección 3.4 de `METODOLOGIA_DESARROLLO.md` (SHA `cf796728bb384a32537392df2f9c72a339fa03ee`) indica que Pendientes.md queda fuera del flujo. La instrucción específica vigente del usuario exige consultar Pendientes.md y completadas.md y establece prioridad para las reglas de la tarea actual; por ello se consultó el blob íntegro, sin modificarlo. La auditoría sigue siendo exclusivamente manual y documental.

## 2. Evidencia técnica y archivos examinados

| Archivo | SHA | Ámbito y rangos examinados |
|---|---|---|
| `student-dashboard.html` | `6379ea0ed39d71b89747a0280bb925fdf12202c1` | Estructura del panel, líneas 115-145 y carga de scripts (398+). No contiene los IDs familiares citados. |
| `js/student.js` | `e2888cea60322e49a40b89adadb8010489605dcc` | Guard de rol (líneas 27-35); selector familiar (180-250); panel de seguimiento (252-350); invocación del selector (745). |
| `backend/user-service/Code.gs` | `12079dd410aa6d8afbce55a4bc62a79dea605f9f` | ROLE_PERMISSIONS (926+); getGuardianApplicants (3583-3622); getFamilyConsolidatedSummary (3629-3695). |
| `backend/academic-service/Code.gs` | `df87a2eea9f0ef79d0b966d03fd5bbe432003df5` | PUBLIC_ACTIONS (265); validateContextualAccess (465-523); getAdmissionDraft (1482-1508); getPublicAdmissionStatus (1510-1545); getAdmissionInterviews (1645-1667); ROLE_PERMISSIONS (240-270); getStudentDocuments (10829-10890); dispatcher doPost (671-900). |
| `backend/accounting-service/Code.gs` | `38b979d41596b85e888b4a7060b37bbac0840a28` | getAdmissionFinancialStatus (2339-2397) y createAdmissionCharge (2398+). |
| `tests/regression/academic-grading-suite.js` | `a22cb3ef376fe09e65c1b17c2f4f5125290bfba6` | Búsqueda de casos específicos de F5-012 y sus endpoints. |
| `tests/regression/modular-dashboard-suite.js` | `0495e1d526a872c33310935a003a83d924d34683` | Búsqueda de casos específicos de F5-012 y sus endpoints. |
| `ChangesLogs.txt` | `5b5cff1926b73a05d1b92087a7bf4b2db75326ff` | Registro histórico de implementación, líneas 1868-1878. |

Se revisaron además los informes F5-006, F5-007, F5-008, F5-009 y F5-011 para evitar duplicar tareas existentes y coordinar dependencias.

## 3. Hallazgos

### H1 - CRÍTICO/P0: el Portal Familiar no es accesible desde la interfaz desplegada

`js/student.js` redirige a `login.html` si la ruta es `student-dashboard` y el rol no es `Estudiante` o `Alumno` (líneas 27-35). Sin embargo, `getGuardianApplicants` está concedido en USER a Padre, Tutor y Responsable, no a Estudiante/Alumno (ROLE_PERMISSIONS, líneas 926-1015). El selector invoca esa acción desde el mismo dashboard estudiantil (líneas 184-205 y 745). Por tanto, el rol autorizado para consultar aspirantes no puede acceder a esa página y el rol que sí puede acceder no tiene permiso para consultar aspirantes.

Además, el HTML vigente no contiene `family-student-switcher-container`, `family-student-switcher`, `family-applicant-tracking-container` ni `family-consolidated-summary-container`. El selector retorna inmediatamente cuando no encuentra sus nodos (líneas 184-189). La búsqueda de la raíz tampoco encontró un dashboard familiar separado. La funcionalidad descrita en ChangesLogs no está montada en la interfaz actual.

**Impacto:** el flujo no puede ser usado por una familia desde el portal publicado, aunque existan funciones JavaScript y un endpoint backend.

### H2 - CRÍTICO/P0: getGuardianApplicants no comprueba una relación familiar/solicitud verificada y devuelve PII excesiva

USER `getGuardianApplicants` (3583-3622) deriva el ID de sesión verificado para Padre/Tutor/Responsable, pero filtra solicitudes por igualdad del correo del usuario contra `r[10]` o por `includes(uid)` sobre `r[8]`, que es `nombreResponsable`. No consulta `RelacionesFamiliares`, una invitación aceptada ni una relación activa vinculada a la solicitud. La coincidencia de correo no demuestra por sí sola representación legal ni vínculo específico del aspirante; el fallback de subcadena sobre un nombre no es un identificador estable.

El DTO devuelve identificación, fecha de nacimiento, teléfono, correo, observaciones y expedienteId, además de estado y código. No separa observaciones públicas de notas internas ni minimiza los datos para el seguimiento familiar.

**Impacto:** un correo compartido/reutilizado puede asociar solicitudes no vinculadas formalmente y el endpoint expone datos personales innecesarios. Reconfirma y amplía F5-009 H11/F5-009-A03; no crear un ID global duplicado. Relacionar con AUD-NG-036 y AUD-NG-222.

### H3 - CRÍTICO/P0: getStudentDocuments permite consultas documentales fuera del vínculo familiar

ACADEMIC concede `getStudentDocuments` a Padre, Tutor y Responsable en ROLE_PERMISSIONS (líneas 240-270). `validateContextualAccess` (465-523) solo obtiene `studentId`, `estudianteId`, `targetUserId` o `userId`; no valida `solicitudId` ni `expedienteId`. La función `getStudentDocuments` (10829-10890) acepta ambos identificadores directamente, filtra por el valor suministrado y, si se omiten, devuelve todas las filas. El DTO incluye `driveFileId`, `driveUrl`, observaciones y el historial de versiones con URLs/IDs.

**Impacto:** un familiar autenticado con permiso para la acción puede manipular solicitudId/expedienteId o omitir filtros para consultar metadatos y enlaces documentales ajenos. Es un defecto de autorización estático verificable; no se realizó una llamada HTTP ni se descargó un documento real. Reconciliar con F5-006-A01/A03, TASK-142/TASK-153, TASK-140, TASK-146 y AUD-NG-222.

### H4 - ALTO/P1: el panel sustituye el control familiar por una consulta pública de estado

En `js/student.js`, `renderApplicantTrackingPanel` (aprox. líneas 252-350) intenta primero `getGuardianApplicants`; si el ID no aparece en la lista, llama a ACADEMIC `getPublicAdmissionStatus` con ese `solicitudId`. La acción está en `PUBLIC_ACTIONS` (línea 265), por lo que `validateRolePermission` la autoriza sin token. La función (1510-1545) busca por código o DNI y devuelve nombres, apellidos, fecha, año, grado, estado y también `expedienteId`.

El endpoint público puede servir a un flujo público separado, pero no constituye una comprobación de que el aspirante esté vinculado al tutor. El fallback permite que el panel presente una solicitud que no fue autorizada por la lista familiar y expone un identificador interno de expediente.

**Impacto:** el control de propiedad exigido por F5-012 no se cumple. Reconciliar con AUD-NG-002 y F5-008-A04; no eliminar el flujo público sin diseñar una capacidad opaca y limitada para su uso legítimo.

### H5 - CRÍTICO/P0: recuperación de borradores por correo sin prueba de propiedad

ACADEMIC incluye `getAdmissionDraft` en `PUBLIC_ACTIONS` (línea 265). La función (1482-1508) acepta `draftKey` o `emailResponsable`, busca el primer borrador activo coincidente y devuelve `draftData` íntegro sin exigir sesión ni demostrar posesión de una capacidad secreta. Conocer el correo del responsable basta para seleccionar el borrador si coincide con la hoja.

La interfaz familiar no invoca `getAdmissionDraft` ni `saveAdmissionDraft`, por lo que no implementa la reanudación solicitada. El defecto de autorización ya está cubierto por AUD-NG-002; esta auditoría añade la evidencia del flujo F5-012 y no crea duplicado.

### H6 - ALTO/P1: no hay integración familiar de documentos, entrevistas, pruebas ni solicitudes de información

`js/student.js` solo consulta `getGuardianApplicants` y el estado público. No invoca `getStudentDocuments`, `uploadStudentDocument`, `getAdmissionInterviews`, `getAdmissionEvaluations`, ni un endpoint de observaciones públicas/solicitudes de información adicional. El rol familiar no tiene `uploadStudentDocument` ni `getAdmissionInterviews` en la matriz estática ACADEMIC. El panel solo renderiza una línea de tiempo aproximada y un contenedor financiero F5-013.

**Impacto:** faltan lista/estado de documentos, botón de sustitución, citas con fecha/hora/lugar/enlace/instrucciones, resultados de pruebas y observaciones públicas. Coordinar con F5-006-A01/A03 y F5-007-A02/A05.

### H7 - ALTO/P1: estados, errores y conversión no representan el ciclo real

La línea de tiempo de `renderApplicantTrackingPanel` se deriva únicamente de `estadoSolicitud`; no consulta estados documentales, citas ni evaluaciones. `Rechazada` no activa la etapa de decisión y no se modelan explícitamente Retirada/Reabierta. `getGuardianApplicants` no filtra solicitudes `Convertida`, de modo que una solicitud convertida puede continuar apareciendo como aspirante mientras el usuario ya figura en estudiantes vinculados.

En `initFamilyStudentSwitcher`, cada error de `getGuardianStudents` y `getGuardianApplicants` se transforma en `{data: []}`; no se diferencia falta de permisos, error del servidor y ausencia real de registros. No existe control de actualización específico; la carga se ejecuta en DOMContentLoaded. El criterio de actualización por recarga solo podría cumplirse si existieran el contenedor y el rol correcto, que hoy faltan.

### H8 - ALTO/P1: interpolación de datos de aspirantes sin escape contextual

El selector construye `optionsHtml` con `innerHTML` e interpola `st.nombre`, `ap.nombresAspirante`, `apellidosAspirante`, `solicitudId`, grado y estado sin escape (js/student.js, 204-230). El panel vuelve a interpolar nombre, código, grado, año y estado en `innerHTML` (aprox. 270-340); solo intenta escapar `observaciones`, y el mensaje de error también se concatena en HTML. Estos campos proceden de datos persistidos de solicitudes/usuarios.

**Impacto:** riesgo de XSS almacenado/reflejado si el panel se monta y recibe datos controlados. La interfaz actualmente no contiene los nodos requeridos y no se ejecutó prueba de navegador; por ello se registra como riesgo estático condicionado, no como explotación reproducida. Coordinar con F5-007-A05 y la tarea existente de XSS UI aplicable; no duplicar hallazgos globales.

### H9 - MEDIO/P2: separación financiera parcialmente demostrada, no certificada extremo a extremo

USER `getFamilyConsolidatedSummary` agrega cargos únicamente para estudiantes obtenidos mediante `getGuardianStudents` y compara el ID de cargo con el `userId` del estudiante (líneas 3630-3695). ACCOUNTING `getAdmissionFinancialStatus` filtra cargos por `solicitudId` (líneas 2339-2397). Esto separa los dos lectores por identificadores distintos y reduce el riesgo de que un cargo de admisión se sume al saldo de un estudiante activo.

Sin embargo, ambos flujos consultan la hoja `CargosEstudiante`; no se observa en estos lectores un discriminador explícito de tipo de entidad ni se ejecutó una prueba con fixtures de ambos tipos. Se clasifica PARCIAL, sin afirmar una mezcla real. La ausencia del Portal Familiar también impide verificar visualmente la separación.

### H10 - ALTO/P1: no hay pruebas conductuales específicas de F5-012

Las dos suites de `tests/regression/` revisadas no contienen referencias a TAREA-F5-012, `getGuardianApplicants`, `renderApplicantTrackingPanel`, `getPublicAdmissionStatus`, `getAdmissionDraft` o `getStudentDocuments`. No se demuestra aislamiento entre dos familias, manipulación de IDs, consulta documental, recuperación de borrador, entrevistas, errores, conversión, XSS ni separación financiera. Reconciliar con AUD-NG-161; no crear duplicado.

### H11 - MEDIO/P2: trazabilidad de origen incompleta

El informe de fase citado y el identificador HALLAZGOS-F5-P0-01 no están disponibles en las fuentes indicadas. ChangesLogs conserva una declaración de implementación, pero no aporta evidencia reproducible ni reemplaza el informe faltante. Este hallazgo no invalida el análisis del código actual; limita la verificación del origen histórico.

## 4. Matriz de los 13 puntos de alcance

| # | Requisito | Resultado | Evidencia resumida |
|---:|---|---|---|
| 1 | Conmutar entre hijos matriculados y postulantes | NO | No hay nodos HTML; página restringida a Estudiante/Alumno. |
| 2 | Bloquear IDs de aspirantes ajenos en backend | NO | getGuardianApplicants no verifica relación activa; fallback público; getStudentDocuments acepta IDs arbitrarios. |
| 3 | Distinguir aspirantes y estudiantes visualmente | NO | No existe selector/markup familiar. |
| 4 | Mostrar estado real de documentos, citas y decisiones | NO | No hay consultas familiares de documentos/entrevistas/evaluaciones. |
| 5 | Reflejar cambios al actualizar el portal | NO | No hay portal montado ni control de actualización; carga solo al inicio. |
| 6 | Mostrar errores descriptivos sin confundirlos con datos vacíos | NO | Errores convertidos en listas vacías. |
| 7 | Mostrar observaciones públicas y solicitudes de información | NO | Se devuelve observaciones sin separar público/interno; no hay flujo de requerimientos. |
| 8 | Retomar solicitudes/borradores | NO | No hay integración UI; getAdmissionDraft es público e inseguro. |
| 9 | Aceptar/rechazar ofertas de vacantes | NO | No hay UI ni llamada; ya cubierto por F5-008-A04/A05. |
| 10 | Separar expediente aspirante de alumno activo | PARCIAL | Lectores financieros filtran por IDs distintos, pero usan CargosEstudiante y no hay verificación E2E. |
| 11 | Aislamiento IDOR por aspirante vinculado | NO | Sin vínculo explícito en getGuardianApplicants; endpoint documental acepta solicitudId/expedienteId. |
| 12 | Distinguir sin información, sin permisos y error servidor | NO | Los catch convierten fallos a data vacía. |
| 13 | No atribuir cobros de admisión como deuda de alumno activo | PARCIAL | Consulta familiar filtra por userId y la de admisión por solicitudId; falta prueba con datos aislados y discriminador explícito. |

## 5. Criterios de aceptación

| # | Criterio | Resultado |
|---:|---|---|
| 1 | Tutor autenticado conmuta entre hijos matriculados y postulantes | NO |
| 2 | Modificar IDs para consultar aspirantes ajenos es bloqueado en backend | NO |
| 3 | Solicitudes distinguidas visualmente de matrículas | NO |
| 4 | Panel muestra estado real de documentos, citas y decisiones | NO |
| 5 | Cambios de admisiones se reflejan al actualizar el portal | NO |
| 6 | Errores descriptivos y distintos de ausencia de datos | NO |
| 7 | Interfaz guía pasos exactos de admisión | NO |
| 8 | Aspirante convertido pasa automáticamente a estudiantes matriculados | NO |

## 6. Pruebas, limitaciones y dictamen

**Ejecutado:** comprobación de rama/HEAD/base; búsqueda de informe individual y de fase en árbol e historial; lectura de completadas.md; lectura íntegra del blob de Pendientes.md; contraste de ChangesLogs; inspección manual de los flujos y permisos USER/ACADEMIC/ACCOUNTING, HTML, JavaScript, endpoints, datos devueltos y suites; reconciliación con F5-006/007/008/009/011 y AUD-NG-002/036/145/161/222, TASK-140/142/146/153.

**No ejecutado:** Apps Script runtime; llamadas HTTP; Google Sheets/Drive productivos; navegador; pruebas con cuentas familiares reales; descarga/carga de documentos; envío de notificaciones; triggers; pruebas concurrentes; XSS dinámico; pruebas de IDs cruzados; suites automatizadas. No se afirma explotación, fuga real ni resultado runtime.

**Dictamen final: TAREA-F5-012 NO CUMPLE.** La función de consulta y parte del renderizado existen, pero el Portal Familiar no está disponible en la interfaz actual; la combinación de roles impide el flujo; la relación del aspirante no se verifica; existen rutas públicas y documentales sin alcance familiar suficiente; faltan documentos, entrevistas, borradores y ofertas; y no hay pruebas conductuales que respalden los criterios marcados [x].

**Alcance de esta iteración:** auditoría y documentación exclusivamente. No se implementaron las tareas derivadas ni se modificaron archivos de código o pruebas.

## 7. Tareas ejecutables derivadas de los hallazgos

Las siguientes subtareas son locales a TAREA-F5-012. No se crean IDs globales nuevos cuando ya existe una tarea que cubre la misma causa. Todas quedan Pendientes.

### F5-012-A01 - Habilitar una entrada real al Portal Familiar y montar el selector

- **Hallazgo de origen:** H1.
- **Severidad:** Crítico.
- **Objetivo/acción:** crear/recuperar la ruta y el markup familiar real; permitir acceso a Padre/Tutor/Responsable con sesión vigente; separar el contexto familiar del dashboard de estudiante y montar los contenedores/selector antes de invocar sus controladores.
- **Archivos/módulos:** student-dashboard.html o nueva ruta familiar autorizada; js/student.js o controlador familiar dedicado; js/auth.js; js/api.js.
- **Dependencias:** ROLE_PERMISSIONS USER; sesión autenticada; getGuardianStudents/getGuardianApplicants; F5-009-A06.
- **Alcance:** no relajar el guard de estudiante para hacer pasar familiares; no convertir una cuenta familiar en cuenta de estudiante ni sobrescribir claims de sesión.
- **Criterios de aceptación:** Padre, Tutor y Responsable autorizados acceden a la ruta familiar; Estudiante/Alumno conserva su dashboard; los IDs DOM existen y los controladores se ejecutan; el selector muestra por separado matriculados y aspirantes; no se cambia la identidad autenticada al seleccionar un registro.
- **Prioridad:** P0.
- **Estado:** Pendiente.
- **Evidencia de cierre:** pendiente.

### F5-012-A02 - Verificar vínculo activo del tutor con cada solicitud y minimizar el DTO

- **Hallazgos de origen:** H2 y H4.
- **Severidad:** Crítico.
- **Objetivo/acción:** reemplazar la coincidencia por correo/subcadena de nombre por una relación verificable solicitud-tutor (invitación aceptada, custodia/relación vigente y alcance específico); derivar el actor de claims; denegar solicitudes ajenas aunque se manipule solicitudId; devolver únicamente campos necesarios y observaciones marcadas explícitamente como públicas.
- **Archivos/módulos:** backend/user-service/Code.gs; backend/academic-service/Code.gs; modelo de SolicitudesAdmision/RelacionesFamiliares; js/student.js.
- **Dependencias:** F5-009-A01/A03; AUD-NG-036; AUD-NG-222; AUD-NG-002; getGuardianApplicants/getPublicAdmissionStatus.
- **Alcance:** no usar emailResponsable, nombreResponsable, userId de payload ni código de seguimiento como prueba de representación legal. El endpoint público debe permanecer separado y usar una capacidad pública limitada si el negocio lo requiere.
- **Criterios de aceptación:** tutor A solo recibe solicitudes vinculadas activamente a A; tutor B no puede consultar datos de A cambiando cualquier ID; correo compartido no concede vínculo; DTO familiar omite identificación/fechaNacimiento y notas internas; los intentos denegados quedan auditados.
- **Prioridad:** P0.
- **Estado:** Pendiente.
- **Evidencia de cierre:** pendiente.

### F5-012-A03 - Corregir autorización documental y habilitar sustitución segura

- **Hallazgos de origen:** H3 y H6.
- **Severidad:** Crítico.
- **Objetivo/acción:** comprobar en servidor la relación del titular con solicitud/expediente en cada consulta y carga; rechazar filtros ausentes; no devolver enlaces Drive directos; habilitar solo la sustitución del documento propio y conservar versionado/historial.
- **Archivos/módulos:** backend/academic-service/Code.gs; js/student.js/controlador familiar; student-dashboard.html/ruta familiar; DocumentosEstudiante; HistorialVersionesDocumentos.
- **Dependencias:** F5-006-A01/A03; TASK-142/TASK-153; TASK-140; TASK-146; AUD-NG-222.
- **Alcance:** ampliar tareas existentes, no duplicar el control documental global. La familia solo puede cargar formatos/categorías permitidos y consultar estados de su solicitud.
- **Criterios de aceptación:** solicitudId/expedienteId ajenos o ausentes se rechazan; un familiar ve solo documentos de aspirantes vinculados; sustitución conserva versión previa y estado; el DTO no expone driveFileId/driveUrl sin proxy autorizado; accesos denegados quedan registrados.
- **Prioridad:** P0.
- **Estado:** Pendiente.
- **Evidencia de cierre:** pendiente.

### F5-012-A04 - Exponer citas, pruebas y comunicaciones familiares con alcance por solicitud

- **Hallazgos de origen:** H6 y H7.
- **Severidad:** Alto.
- **Objetivo/acción:** crear lecturas familiares acotadas para entrevistas/pruebas, fecha, hora, modalidad, lugar/enlace e instrucciones; separar observaciones públicas de notas internas y permitir responder solicitudes de información adicional.
- **Archivos/módulos:** backend/academic-service/Code.gs; backend/user-service/Code.gs; js/student.js/controlador familiar; interfaz familiar.
- **Dependencias:** F5-007-A02/A05; AUD-NG-001; AUD-NG-036; AUD-NG-145.
- **Alcance:** no conceder a familiares acceso a evaluaciones internas, rúbricas privadas ni datos del evaluador que no sean necesarios.
- **Criterios de aceptación:** solo el tutor vinculado consulta citas de su solicitud; no se devuelven entrevistas globales cuando falta solicitudId; fechas/horas/instrucciones coinciden con el registro; observaciones internas nunca se muestran; solicitudes adicionales permiten responder y conservan trazabilidad.
- **Prioridad:** P1.
- **Estado:** Pendiente.
- **Evidencia de cierre:** pendiente.

### F5-012-A05 - Integrar recuperación de borradores con propiedad verificable

- **Hallazgo de origen:** H5.
- **Severidad:** Crítico.
- **Objetivo/acción:** retirar getAdmissionDraft/saveAdmissionDraft de PUBLIC_ACTIONS cuando lean/escriban datos privados; recuperar borrador por usuario autenticado o capacidad opaca de alta entropía, limitada, revocable y vinculada al borrador.
- **Archivos/módulos:** backend/academic-service/Code.gs; admision.html; js/student.js/controlador familiar; js/api.js.
- **Dependencias:** AUD-NG-002; TAREA-F5-015; sesión/claims verificados.
- **Alcance:** no utilizar el correo como secreto ni devolver draftData por conocer emailResponsable.
- **Criterios de aceptación:** correo ajeno no recupera borradores; token ausente/expirado/revocado se rechaza; titular recupera solo su borrador; la interfaz permite continuar sin duplicar solicitudes; se auditan accesos denegados.
- **Prioridad:** P0.
- **Estado:** Pendiente.
- **Evidencia de cierre:** pendiente.

### F5-012-A06 - Renderizar de forma segura y distinguir estados, permisos y errores

- **Hallazgos de origen:** H7 y H8.
- **Severidad:** Alto.
- **Objetivo/acción:** sustituir interpolaciones de datos en innerHTML por textContent/nodos DOM o escape contextual obligatorio; normalizar la línea de tiempo desde estados documentales, entrevistas, decisiones y matrícula; distinguir sin información, falta de permisos y fallo del servidor; añadir actualización explícita o estrategia de refresco coherente.
- **Archivos/módulos:** js/student.js/controlador familiar; student-dashboard.html/ruta familiar; tests de seguridad UI.
- **Dependencias:** AUD-NG-145; F5-007-A05; F5-009-A06.
- **Alcance:** los errores no se convierten en arrays vacíos; no ocultar una denegación como ausencia de aspirantes.
- **Criterios de aceptación:** cadenas HTML/atributos de evento se muestran como texto; estados Rechazada, Retirada, Reabierta, En_Espera, Admitida y Convertida se representan sin ambigüedad; errores HTTP/RBAC y datos vacíos tienen estados distintos; actualización obtiene datos nuevos sin mezclar solicitudes.
- **Prioridad:** P1.
- **Estado:** Pendiente.
- **Evidencia de cierre:** pendiente.

### F5-012-A07 - Cerrar el ciclo de conversión y la separación financiera de aspirantes

- **Hallazgos de origen:** H7 y H9.
- **Severidad:** Alto.
- **Objetivo/acción:** al convertir una solicitud, retirarla de la categoría de aspirantes y asociar el estudiante al vínculo familiar validado; definir discriminador inequívoco de cargo de admisión frente a cargo de matrícula y conservar ambos historiales sin mezclarlos.
- **Archivos/módulos:** backend/academic-service/Code.gs; backend/user-service/Code.gs; backend/accounting-service/Code.gs; modelo SolicitudesAdmision/RelacionesFamiliares/CargosEstudiante.
- **Dependencias:** TAREA-F5-001; F5-009-A01/A03; TAREA-F5-013; F5-018; F5-008-A04/A05.
- **Alcance:** la respuesta de lista de espera/oferta ya está cubierta por F5-008-A04/A05; coordinarla sin crear tarea duplicada. Esta subtarea se limita a la clasificación y transferencia familiar/financiera.
- **Criterios de aceptación:** solicitud Convertida aparece una sola vez en estudiantes matriculados; relación familiar conserva el tutor correcto; cargo por solicitud no se suma al saldo de userId del alumno; cargo de matrícula se muestra en la cuenta del alumno; fixtures con ambos tipos no producen contaminación cruzada.
- **Prioridad:** P1.
- **Estado:** Pendiente.
- **Evidencia de cierre:** pendiente.

### F5-012-A08 - Suite conductual de seguimiento familiar y pruebas negativas IDOR

- **Hallazgos de origen:** H1-H10.
- **Severidad:** Alto (casos de autorización y datos documentales P0).
- **Objetivo/acción:** añadir pruebas aisladas para acceso por rol, vínculos activos, selector, datos personales, documentos, sustituciones, entrevistas, borradores, ofertas, conversión, estados, errores, XSS y separación financiera.
- **Archivos/módulos:** tests/regression/academic-grading-suite.js; tests/regression/modular-dashboard-suite.js o suite familiar dedicada; backend USER/ACADEMIC/ACCOUNTING; js/student.js.
- **Dependencias:** F5-012-A01 a A07; AUD-NG-161; F5-006-A01/A03; F5-007-A02/A05; F5-008-A04/A05; F5-009-A03.
- **Alcance:** fixtures aislados; nunca utilizar hojas, cuentas, correos o documentos productivos.
- **Criterios de aceptación:** dos familias cruzadas; manipulación de solicitudId/expedienteId y omisión de filtros; email compartido; borrador por email ajeno; estados y errores diferenciados; pruebas XSS por cada campo; conversión sin duplicidad; cargos de admisión separados; ningún PASS si el caso no se ejecuta.
- **Prioridad:** P1.
- **Estado:** Pendiente.
- **Evidencia de cierre:** pendiente.

**Reconciliación sin duplicados:** ampliar AUD-NG-002 (acciones públicas/borradores), AUD-NG-036 (relación legal del tutor), AUD-NG-222 (autorización contextual), AUD-NG-145 (bitácora/PII), AUD-NG-161 (pruebas), TASK-140/TASK-142/TASK-146/TASK-153 (seguridad y acceso documental). Coordinar F5-006-A01/A03, F5-007-A02/A05, F5-008-A04/A05 y F5-009-A01/A03/A06/A08. No crear IDs globales nuevos. Las ocho subtareas F5-012-A01..A08 son locales a este informe.
