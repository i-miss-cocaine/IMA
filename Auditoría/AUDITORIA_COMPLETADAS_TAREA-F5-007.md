# Auditoría técnica — TAREA-F5-007: módulo de entrevistas y evaluaciones de admisión

**Checkpoint:** C1.201  
**Sesión operativa:** IMA-AUDIT-20261107-0255Z (identificador de auditoría, no ID nativo de ChatGPT)  
**Checkpoint de inicio:** C1.200  
**Repositorio:** i-miss-cocaine/IMA  
**Rama auditada:** NG_beta_0.0.0.1_work  
**HEAD auditado:** f481f6950f9d8e9ff51322ce158a4b5e7741db58  
**Árbol auditado:** b10f868d3bc30a95e5f72d1d1f2c24b8167e880c (969 entradas; árbol recursivo completo, truncated=false)  
**Rama base protegida:** NG_beta, SHA 44d9891132332e692dbe2ba8602b41f50a508a59 (sin modificaciones)  
**Dictamen:** **NO CUMPLE**

## 1. Alcance y fuentes

Se buscó primero el informe específico `AUDITORIAS/AUDITORIA_COMPLETADAS_TAREA-F5-007.md` en el árbol de la rama y en el historial de commits alcanzables desde la rama de trabajo. No existe en el árbol y la consulta de historial por esa ruta devolvió una colección vacía. Tampoco se encontró `AUDITORIAS/AUDITORIA_TAREA-F5-007.md` ni el informe de origen `AUDITORIA_FASE_5_ADMISIONES_PORTAL_FAMILIAS.md` en el árbol o en el historial consultado. Por tanto, esta auditoría se realizó desde cero.

Fuentes de requisitos y estado:

- `completadas.md`, SHA `f57f1aef832e81e44fc4f7ec36a852d50e464676`, líneas 2022-2055: TAREA-F5-007 figura como [X] Completada y sus diez criterios de aceptación aparecen marcados [x].
- `ChangesLogs.txt`, SHA `d57cf4bd861b5c3720e60cf83241ed804ff645d9`, líneas 1814-1822: declara la implementación de las dos hojas, cinco endpoints y controladores de interfaz. Es un registro histórico, no evidencia suficiente de que todos los requisitos estén operativos.
- `Pendientes.md`, blob SHA `631b4c2dbf0e86d5704b63625382d73ccb8ceb3c`: la lectura ordinaria de contenidos devolvió cero caracteres, pero la lectura directa del objeto Git recuperó el contenido completo del mismo blob: 1.782.094 caracteres, 20.182 líneas, sin U+FFFD. El tamaño de 1.803.672 bytes coincide con el inventario del checkpoint anterior. No contiene la cadena TAREA-F5-007. No se restauró ni modificó el archivo porque el blob actual pudo recuperarse íntegramente.
- `AUDITORIAS/Auditoria.txt`, SHA de partida `8457eb1dd24d2ff25eea5c827300bc2bbc503a96`: no contenía el hallazgo fuente HALLAZGOS-F5-P1-01 ni una auditoría específica de F5-007.
- `AUDITORIAS/MapaDependencias.md`, SHA de partida `91900e79fa319728f8568f56a5bca8a6272d3a19`: contenía referencias generales a admisiones y a F5-005, pero no un análisis de dependencias específico de F5-007.

**Discrepancia de conteo:** la solicitud de continuidad menciona once requisitos; la fuente vigente `completadas.md` contiene catorce puntos numerados de alcance y diez criterios de aceptación. Para no omitir requisitos, se contrastaron los catorce puntos y los diez criterios presentes en la fuente del repositorio.

## 2. Evidencia técnica inspeccionada

| Archivo | SHA | Secciones/rangos revisados |
|---|---|---|
| `backend/academic-service/Code.gs` | `daf1883ec0b8d4f0ff2bc673af8a4e8c5bbd03fc` | `getOrCreateSheet` 84-156, en especial esquemas 148-150; RBAC 168-224; dispatch 847-852; validación contextual/RBAC 465-583; módulo 1594-1747; `updateAdmissionStatus` 1928-2012; `generateInstitutionalId` 2107-2145. |
| `js/secretary.js` | `08a81266957b4c18cc25f8ba6749eac30a8f2c2c` | apertura del modal 137-180; entrevistas 359-453; evaluaciones 1459-1518. |
| `dashboard-secretaria.html` | `fa0d8c23aace24a6acab2d4956398a7f5e1309b8` | secciones de entrevistas/evaluaciones 268-296. |
| `js/api.js` | `6b24f666db30a811a8e9b38d466fc6001cf6dfa9` | `fetchApi` 11-65. |
| `js/auth.js` | `8444dd085a3186106d2db7005b61ef934d3c22d8` | construcción de `currentUser` tras login 130-165. |
| `tests/regression/academic-grading-suite.js` | `3433b707edd4a2f35c68368a3172932adc2a3b32` | 404 líneas; sin referencias a los endpoints o controladores F5-007. |
| `tests/regression/modular-dashboard-suite.js` | `0495e1d526a872c33310935a003a83d924d34683` | 61 líneas; sin referencias a los endpoints o controladores F5-007. |

La revisión fue estática y manual de las funciones, llamadas, matrices de permisos, persistencia y renderizadores señalados. No se ejecutó el servicio Apps Script ni se usaron datos productivos.

## 3. Matriz de los catorce puntos de alcance

| # | Requisito | Resultado | Evidencia y brecha |
|---:|---|---|---|
| 1 | Crear hojas `EntrevistasAdmision` y `EvaluacionesAdmision` con esquema | **Cumple** | `getOrCreateSheet` declara ambos esquemas en Code.gs 148-150. |
| 2 | Implementar cinco endpoints de entrevistas/evaluaciones | **Parcial** | Los cinco endpoints existen y están despachados (847-852; 1594-1747), pero carecen de validaciones de pertenencia, autorización por recurso, estados válidos y operaciones completas. |
| 3 | Agendar entrevistas individuales o grupales | **Parcial** | Se agenda una solicitud individual con fecha, horas, evaluador, lugar/enlace y modalidad (1595-1642). No existe estructura ni operación de entrevista grupal; tampoco se comprueba en backend que `solicitudId` exista. |
| 4 | Gestionar Programada, Confirmada, Reprogramada, Completada, Cancelada y No_Asistio | **Parcial** | La creación fija Programada; `recordInterviewOutcome` acepta cualquier cadena como estado, sin máquina de estados ni lista permitida (1671-1689). La interfaz solo ofrece Completada y No_Asistio. |
| 5 | Detectar y bloquear solapamientos del evaluador | **Parcial** | Hay comparación de intervalos y exclusión de Cancelada (1605-1619), pero la lectura, comprobación y append no están dentro de un lock. Dos solicitudes simultáneas pueden superar la misma comprobación. |
| 6 | Reprogramar/cancelar, registrar motivo y notificar | **No cumple** | No hay endpoint ni controlador de reprogramación/cancelación. No se preserva una cita anterior mediante un evento de reprogramación ni se notifican participantes desde este módulo. |
| 7 | Evaluar con escala numérica o cualitativa, rúbrica y dictamen pedagógico | **Parcial** | El backend recibe `puntajeNum`, `escalaQual`, `rubricaJSON` y observaciones (1691-1722), pero la interfaz solo pide puntaje numérico, dictamen y observaciones (1492-1507), sin enviar escala cualitativa ni rúbrica. No hay validación robusta de rango, escala o catálogo de dictámenes. |
| 8 | Diferenciar cita programada, entrevista realizada y evaluación calificada | **Parcial** | Entrevistas y evaluaciones se guardan en hojas distintas y el modal las muestra separadas (1645-1747; secretary.js 359-397 y 1459-1490). No existe ciclo independiente de programación de evaluaciones ni una transición controlada que vincule la realización con su calificación. |
| 9 | Restringir expedientes a evaluadores asignados | **No cumple** | `getAdmissionInterviews` filtra por `evaluadorUserId` suministrado por el cliente, pero permite omitirlo y devolver todas las entrevistas; `getAdmissionEvaluations` no filtra por evaluador. No se compara la identidad verificada con el evaluador asignado ni con la solicitud. |
| 10 | Consolidar notas de examen y observaciones en modal | **Parcial** | El modal carga y presenta listas de entrevistas y evaluaciones (secretary.js 176-180; 359-397; 1459-1490; HTML 268-296). No se calcula un resumen consolidado de resultados ni se acredita integridad/autoría de las notas. |
| 11 | Definir evaluaciones obligatorias según grado/nivel | **No cumple** | La obligatoriedad se decide mediante confirmación manual en la interfaz (1501) y se persiste como booleano por registro. No existe catálogo/regla por grado o nivel. |
| 12 | Bloquear Admitida ante evaluaciones obligatorias pendientes o reprobadas | **Parcial / fail-open** | `updateAdmissionStatus` bloquea filas existentes marcadas obligatorias cuyo dictamen sea Pendiente o Reprobado (1996-2003). Si no hay filas para una evaluación requerida, el arreglo está vacío y la solicitud puede avanzar. No verifica el conjunto requerido por grado. |
| 13 | Excepciones autorizadas con firma digital y justificación de Dirección | **No cumple** | No existe endpoint, interfaz, entidad, verificación de firma ni registro de excepción para omitir una evaluación obligatoria. |
| 14 | Múltiples entrevistas/evaluaciones sin sobrescribir registros anteriores | **Parcial** | La programación y la evaluación usan appendRow, por lo que admiten múltiples filas. Sin embargo, el resultado de una entrevista actualiza la misma fila y concatena observaciones; no conserva un historial estructurado e inmutable de cada transición. La consulta no ordena explícitamente por fecha. |

## 4. Hallazgos

### H1. Las llamadas protegidas del módulo no transmiten el token de sesión
**Severidad: CRÍTICO / P0. Reconciliación: ampliar AUD-NG-001; no crear ID duplicado.**

Los controladores de entrevistas y evaluaciones invocan `window.fetchApi` (secretary.js 367, 419-420, 446 y 1466, 1505). `js/auth.js` construye `currentUser` con userId, nombre, email y rol, pero omite `result.data.sessionToken` (138-159). `js/api.js` solo añade requesterUserId/requesterRole y serializa el payload sin sessionToken (47-50). `validateRolePermission` exige token para acciones no públicas (524-583); las cinco acciones F5-007 no están en PUBLIC_ACTIONS (línea 265). En consecuencia, las llamadas de este módulo heredan el bloqueo crítico de AUD-NG-001. No se ejecutó HTTP real, por lo que se documenta la incompatibilidad estática del contrato, no un resultado runtime.

### H2. La programación no valida la solicitud ni admite entrevistas grupales
**Severidad: ALTO / P1.**

`scheduleAdmissionInterview` exige que exista un valor `solicitudId`, pero no consulta `SolicitudesAdmision` para validar su existencia/estado y guarda un solo ID por fila (1595-1642). La interfaz obtiene un solo `currentActiveSolicitudId` (399-420). No hay identificador de grupo ni lista de solicitudes participantes. La fecha, hora de inicio/fin y modalidad tampoco se validan semánticamente.

### H3. El ciclo de vida de las citas está incompleto y permite estados arbitrarios
**Severidad: ALTO / P1.**

La creación siempre guarda Programada. `recordInterviewOutcome` escribe directamente cualquier valor recibido en la columna Estado, sin lista permitida ni validación de transición (1671-1689). El cliente ofrece solo Completar y No Asistió (382-386); no existen flujos de Confirmada, Reprogramada o Cancelada, ni motivo obligatorio ni notificación a participantes. No se preserva la cita original mediante un registro de evento.

### H4. La comprobación de conflictos y la generación de IDs no son atómicas
**Severidad: ALTO / P1. Reconciliación: ampliar AUD-NG-234/TASK-514 y revisar AUD-NG-006.**

El handler lee la agenda, busca solapamiento y luego inserta la cita sin adquirir LockService (1601-1638). La generación de ID invoca `generateInstitutionalId` con `skipLock: true` (1622); el generador omite el lock cuando recibe ese parámetro (2107-2145). Dos solicitudes concurrentes pueden observar la misma agenda libre y crear citas solapadas; también pueden competir por la secuencia de IDs. La prueba estática demuestra ausencia de sección crítica, pero no se ejecutó concurrencia real.

### H5. No existe autorización ABAC por evaluador asignado
**Severidad: CRÍTICO / P0.**

`getAdmissionInterviews` acepta `evaluadorUserId` del payload y solo filtra por él cuando el cliente lo envía; si se omite, devuelve todas las entrevistas (1645-1669). `getAdmissionEvaluations` filtra únicamente por solicitudId (1724-1747). `recordInterviewOutcome` localiza por entrevistaId y actualiza sin comparar el actor autenticado con el evaluador guardado (1671-1689). `saveAdmissionEvaluation` toma el ID verificado para registrar al evaluador, pero no verifica que esté asignado a esa solicitud (1701-1717). RBAC estático incluye estas acciones para Director/Secretaría/Secretaria, pero no sustituye el control por recurso; Profesor tampoco tiene estos permisos en la matriz estática (168-224), y los permisos dinámicos tampoco incorporan en estos handlers una comprobación de pertenencia. El requisito de acceso exclusivo de evaluadores asignados no está implementado.

### H6. La interfaz no permite escala cualitativa ni adjuntar rúbricas y el backend no valida el contrato
**Severidad: ALTO / P1.**

Aunque el backend acepta escalaQual y rubricaJSON (1691-1717), el formulario usa prompts para un puntaje numérico y no envía esos dos campos (1492-1507). No se valida que puntajeNum sea numérico y esté en rango, ni que dictamen pertenezca al conjunto permitido. El almacenamiento de campos no prueba que el usuario pueda adjuntar/seleccionar una rúbrica o registrar una evaluación cualitativa.

### H7. La obligatoriedad no se deriva del grado y el bloqueo de admisión falla abierto
**Severidad: CRÍTICO / P0.**

La interfaz pregunta manualmente si cada evaluación es obligatoria (1501); no consulta una política por grado/nivel. En `updateAdmissionStatus`, el bloqueo examina solo evaluaciones ya existentes (1996-2003). Si una evaluación requerida nunca fue creada, no hay fila Pendiente/Reprobado que active el rechazo y el flujo permite continuar. El control debe comparar contra un catálogo completo de evaluaciones requeridas y fallar de forma segura cuando falten datos o configuración.

### H8. No existe el mecanismo de excepción con firma digital de Dirección
**Severidad: ALTO / P1.**

No se encontró acción, tabla, campo de firma, verificación criptográfica ni interfaz para registrar una excepción de evaluación obligatoria con justificación y autorización de Dirección. No puede acreditarse el requisito por la mera existencia del campo de observaciones.

### H9. La bitácora no registra de forma completa y confiable quién realizó cada operación
**Severidad: ALTO / P1. Reconciliación: ampliar AUD-NG-145.**

La programación y el guardado de evaluación llaman a logStructuredEvent (1640 y 1719), pero pasan `payload.authRole`, no el rol verificado ni un identificador de actor confiable. El esquema de LogsSistema registra rol, no actorUserId. `recordInterviewOutcome` no genera evento de auditoría. La fila de entrevista no guarda quién programó ni conserva cada transición como evento independiente. No se acredita la trazabilidad de programación, realización, evaluación y modificación que exigen los criterios.

### H10. Los paneles insertan datos de entrevistas y evaluaciones en innerHTML sin escape
**Severidad: CRÍTICO / P0. Reconciliación: ampliar AUD-NG-235.**

`loadAdmissionInterviews` interpola fecha, horas, estado, evaluador, modalidad, lugar/enlace y observaciones en innerHTML (369-390). `loadAdmissionEvaluations` interpola tipo, dictamen, puntaje, escala, evaluador y observaciones (1468-1483). Son valores almacenados y potencialmente controlables por usuarios; no se aplica escape contextual uniforme ni construcción DOM segura. Se amplía AUD-NG-235, ya detectado en la consola F5-005.

### H11. No hay pruebas conductuales específicas del módulo
**Severidad: ALTO / P1. Reconciliación: ampliar AUD-NG-161.**

Las suites `academic-grading-suite.js` y `modular-dashboard-suite.js` no contienen pruebas de los cinco endpoints ni de los controladores F5-007. No se acreditan pruebas de token, acceso por evaluador, existencia de solicitud, grupos, conflictos concurrentes, estados, reprogramación/cancelación, rúbricas, políticas por grado, excepciones, transición a Admitida, historial ni XSS.

## 5. Revisión de los diez criterios de aceptación

| Criterio declarado [x] | Resultado de auditoría |
|---|---|
| Agendar entrevista vinculada a solicitud existente | Parcial: la UI parte del modal, pero el backend no valida que el ID exista. |
| Reprogramar conservando fecha original en bitácora | No cumple: no existe flujo de reprogramación. |
| Rechazar solapamientos | Parcial: detección estática sin lock; hay carrera concurrente. |
| Evaluación programada no aparece completada hasta registrar nota | No cumple: no existe entidad/estado de evaluación programada; solo se inserta al guardar la nota. |
| Notas/observaciones conservadas e integradas al expediente | Parcial: se almacenan y muestran en modal, pero no hay resumen consolidado ni autoría fiable. |
| Evaluadores no autorizados no pueden calificar/modificar entrevistas ajenas | No cumple: no hay ABAC por evaluador asignado; tampoco se ofrece el acceso funcional limitado al evaluador asignado. |
| Múltiples evaluaciones acumuladas cronológicamente | Parcial: appendRow conserva filas, pero no se ordena explícitamente ni se conserva historial de cambios de entrevista. |
| Evaluaciones obligatorias pendientes bloquean Admitida | Parcial: solo bloquea filas existentes Pendiente/Reprobado; permite ausencia de evaluación requerida. |
| Excepciones registran usuario y motivo | No cumple: no hay flujo de excepción ni firma digital. |
| Auditoría registra quién programa/realiza/evalúa/modifica | No cumple: actor no verificado/incompleto y falta evento en recordInterviewOutcome. |

Las diez marcas históricas [x] de completadas.md no se corresponden con la evidencia del código actual.

## 6. Tareas ejecutables derivadas de los hallazgos

### TAREA NUEVA — F5-007-A01: completar programación, estados y concurrencia de entrevistas
- **Hallazgos:** H2, H3 y H4.
- **Severidad:** ALTO / P1.
- **Objetivo/acción:** validar solicitud existente y estado; soportar entrevistas individuales y grupales; validar fechas/horas/modalidad; implementar máquina de estados; permitir confirmar, reprogramar y cancelar con motivo; conservar cita/fecha anterior como evento; notificar a participantes; proteger detección de solapamientos, generación de IDs e inserción dentro de una sección crítica no eludible.
- **Archivos/módulos:** backend/academic-service/Code.gs; js/secretary.js; dashboard-secretaria.html; pruebas de regresión.
- **Dependencias:** SolicitudesAdmision; EntrevistasAdmision; servicio de notificaciones; LockService/SecuenciasIDs; AUD-NG-234/TASK-514 y AUD-NG-006.
- **Criterios verificables:** ID de solicitud inexistente rechazado; entrevista grupal enlaza todos los participantes; transiciones inválidas rechazadas; reprogramación conserva cita original y motivo; cancelación libera el horario; notificación verificable; dos reservas concurrentes del mismo evaluador no pueden solaparse ni duplicar ID.
- **Prioridad:** P1.
- **Estado:** Pendiente.

### TAREA NUEVA — F5-007-A02: autorización por evaluador asignado y sesión autenticada
- **Hallazgos:** H1 y H5.
- **Severidad:** CRÍTICO / P0.
- **Objetivo/acción:** resolver la propagación del sessionToken ampliando AUD-NG-001; derivar el actor exclusivamente del token verificado; filtrar entrevistas/evaluaciones por asignación del evaluador en servidor; impedir que el cliente elija un evaluador ajeno o suprima el filtro; validar pertenencia de entrevista, evaluación y solicitud antes de leer/modificar.
- **Archivos/módulos:** js/auth.js; js/api.js; backend/academic-service/Code.gs; ROLE_PERMISSIONS/MatrizPermisosRoles; pruebas de regresión.
- **Dependencias:** sesión USER/ACADEMIC; AUD-NG-001; asignaciones de evaluadores; AUD-NG-153/TAREA-AD-03 cuando corresponda a ámbitos y aislamiento.
- **Criterios verificables:** sin token/token inválido se rechaza; evaluador A solo consulta/modifica expedientes asignados a A; cambiar evaluadorUserId en payload no amplía acceso; Secretaría/Dirección conservan permisos explícitos; las pruebas cubren acceso cruzado.
- **Prioridad:** P0.
- **Estado:** Pendiente.

### TAREA NUEVA — F5-007-A03: políticas de evaluación por grado y bloqueo fail-closed de admisión
- **Hallazgo:** H7.
- **Severidad:** CRÍTICO / P0.
- **Objetivo/acción:** definir catálogo versionado de evaluaciones obligatorias por grado/nivel y vigencia; comparar el conjunto requerido con evaluaciones existentes; impedir Admitida si falta alguna, está Pendiente o Reprobada; denegar si el catálogo o consulta falla; no confiar en esObligatoria enviado por cliente.
- **Archivos/módulos:** backend/academic-service/Code.gs; configuración académica; pruebas.
- **Dependencias:** grado/nivel de SolicitudesAdmision; EvaluacionesAdmision; AUD-NG-233/TASK-513 para guardas fail-closed y AUD-NG-161 para pruebas.
- **Criterios verificables:** cada grado devuelve un conjunto determinista; falta de evaluación requerida bloquea; pendiente/reprobada bloquea; solo todas las obligatorias aprobadas permiten avanzar; fallo de configuración/hoja deniega sin mutación.
- **Prioridad:** P0.
- **Estado:** Pendiente.

### TAREA NUEVA — F5-007-A04: evaluación cualitativa, rúbricas y excepciones firmadas
- **Hallazgos:** H6 y H8.
- **Severidad:** ALTO / P1.
- **Objetivo/acción:** permitir escala numérica y cualitativa; adjuntar/seleccionar rúbricas y dictamen pedagógico; validar rangos, escalas y dictámenes; crear flujo de excepción que exija firma digital verificable, usuario de Dirección autorizado, motivo y alcance de la excepción; conservar historial de evaluaciones.
- **Archivos/módulos:** backend/academic-service/Code.gs; js/secretary.js; dashboard-secretaria.html; almacenamiento de rúbricas/firmas; pruebas.
- **Dependencias:** EvaluacionesAdmision; catálogo por grado; identidad verificada; servicio de firma institucional.
- **Criterios verificables:** UI transmite rúbrica y escala seleccionada; backend valida todo valor; firma inválida/no autorizada se rechaza; excepción registra firmante, fecha, motivo y evaluación afectada; registros anteriores permanecen íntegros.
- **Prioridad:** P1.
- **Estado:** Pendiente.

### TAREA NUEVA — F5-007-A05: trazabilidad completa y renderizado seguro del módulo
- **Hallazgos:** H9 y H10.
- **Severidad:** CRÍTICO / P0 para XSS; ALTO / P1 para trazabilidad.
- **Objetivo/acción:** registrar actorUserId verificado, rol, acción, entidad, estado anterior/nuevo, motivo y correlationId para cada programación, cambio de estado, reprogramación, cancelación y evaluación; hacer que el fallo de auditoría no se silencie; reemplazar interpolaciones inseguras por textContent/nodos DOM o escape contextual y validar enlaces.
- **Archivos/módulos:** backend/academic-service/Code.gs; js/secretary.js; dashboard-secretaria.html.
- **Dependencias:** LogsSistema/bitácora institucional; AUD-NG-145; AUD-NG-235.
- **Criterios verificables:** cada mutación produce evento con actor autenticado y correlación; evento ausente impide declarar éxito cuando la política exija auditoría; payloads HTML/event handlers se muestran como texto y nunca se ejecutan; URLs no confiables no se convierten en enlaces.
- **Prioridad:** P0 para salida segura; P1 para bitácora.
- **Estado:** Pendiente.

### TAREA NUEVA — F5-007-A06: pruebas de regresión conductual de entrevistas y evaluaciones
- **Hallazgo:** H11.
- **Severidad:** ALTO / P1.
- **Objetivo/acción:** añadir pruebas positivas, negativas y concurrentes para todos los requisitos, endpoints, estados, autorización, políticas por grado, rúbricas, excepciones, auditoría, notificaciones y renderizado seguro.
- **Archivos/módulos:** tests/regression/academic-grading-suite.js; tests/regression/modular-dashboard-suite.js; backend/academic-service/Code.gs; js/secretary.js.
- **Dependencias:** tareas F5-007-A01 a A05; AUD-NG-161.
- **Criterios verificables:** casos aislados y reproducibles; evidencia de resultados; pruebas concurrentes reales/simuladas con barrera; denegaciones por acceso cruzado; pruebas XSS por cada campo renderizado; no basta con comprobar presencia de funciones.
- **Prioridad:** P1.
- **Estado:** Pendiente.

**Reconciliación de identificadores existentes:** ampliar AUD-NG-001 (sessionToken), AUD-NG-234/TASK-514 (concurrencia y transiciones), AUD-NG-145 (actor/bitácora), AUD-NG-235 (XSS) y AUD-NG-161 (pruebas). Coordinar TAREA-AD-03/AUD-NG-153 para el aislamiento por asignación/ámbito y AUD-NG-233/TASK-513 para el bloqueo fail-closed. No crear IDs globales duplicados. Las seis tareas F5-007-A01 a A06 son subtareas locales derivadas de este informe.

## 7. Pruebas, limitaciones y dictamen

**Ejecutado:** verificación de rama/HEAD/árbol; búsqueda del informe en árbol e historial; lectura del requisito marcado completado y de los registros de cambios; recuperación directa del blob de Pendientes.md; inspección manual de esquemas, dispatch, RBAC, token, endpoints, guardas de admisión, controladores, modal y suites.

**No ejecutado:** Apps Script runtime; llamadas HTTP; acceso a hojas productivas; navegador; pruebas con usuarios/evaluadores reales; concurrencia; correo/notificaciones; firma digital; pruebas XSS dinámicas; ejecución de suites automatizadas. No se afirma haber probado estos comportamientos.

**Dictamen final: TAREA-F5-007 NO CUMPLE.** Existe una base parcial (hojas, endpoints, programación individual, almacenamiento de evaluaciones y paneles de consulta), pero no satisface el contrato de autenticación, el aislamiento por evaluador, el ciclo de vida de citas, la concurrencia segura, la política por grado, las excepciones firmadas ni la trazabilidad completa. La marca histórica de completado debe considerarse no verificada y no acredita conformidad funcional.

**Archivos documentales de esta iteración:** este informe, `AUDITORIAS/Auditoria.txt`, `AUDITORIAS/MapaDependencias.md`, `AUDITORIAS/AUDITORIA_COMPLETADAS_PLAN.md` y `AUDITORIAS/Contexto_personal.txt`.

**Archivos no modificados:** `backend/academic-service/Code.gs`, `js/secretary.js`, `dashboard-secretaria.html`, `js/api.js`, `js/auth.js`, suites de pruebas, `completadas.md`, `Pendientes.md`, `ChangesLogs.txt`, `METODOLOGIA_DESARROLLO.md` y rama base.

**Siguiente tarea:** TAREA-F5-008 — listas de espera con orden de prelación y asignación controlada de plazas. Antes de auditarla, comprobar informe e historial de Git en la rama actual.
