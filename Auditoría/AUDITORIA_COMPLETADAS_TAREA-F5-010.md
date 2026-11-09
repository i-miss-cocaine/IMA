# Auditoría técnica - TAREA-F5-010: control consistente de capacidad, reservas y matrículas

**Checkpoint:** C1.204  
**Sesión operativa:** IMA-AUDIT-20261107-0325Z (ID operativo, no ID nativo de ChatGPT)  
**Repositorio:** i-miss-cocaine/IMA  
**Rama auditada:** NG_beta_0.0.0.1_work  
**HEAD auditado:** 1f321a54dc3fd6a19bdcf20e841b7ff4f3dbf471  
**Árbol auditado:** 99970a2ca6bb238f1d0429ad6b1f32323cd4b254  
**Rama base protegida:** NG_beta_0.0.0.1 (44d9891132332e692dbe2ba8602b41f50a508a59; sin cambios)  
**Dictamen:** **NO CUMPLE**

## 1. Búsqueda documental y fuentes

Se comprobó el árbol recursivo de la rama y el historial de commits para:
- `AUDITORIAS/AUDITORIA_COMPLETADAS_TAREA-F5-010.md`
- `AUDITORIAS/AUDITORIA_TAREA-F5-010.md`

No se encontró ninguna de las dos rutas en el árbol ni commits que las hubieran creado o modificado. El informe específico se genera desde cero.

**Requisitos:** `completadas.md`, SHA `f57f1aef832e81e44fc4f7ec36a852d50e464676`, bloque TAREA-F5-010 (12 requisitos y 9 criterios de aceptación); figura como [X] Completada. Se contrastó el bloque completo con el código, no con el estado declarado.

**Historial:** `ChangesLogs.txt`, SHA `d57cf4bd861b5c3720e60cf83241ed804ff645d9`; se consultó el historial disponible como contexto, sin tratar descripciones de cambios como prueba de comportamiento.

**Backlog:** `Pendientes.md` blob SHA `631b4c2dbf0e86d5704b63625382d73ccb8ceb3c`, recuperado mediante lectura directa del blob porque la lectura ordinaria devolvía vacío. Se leyó el contenido íntegro (1.782.094 caracteres, 20.182 líneas, sin U+FFFD). No se modificó ni restauró el archivo. No hay una entrada directa TAREA-F5-010, pero sí `TASK-477` asociada a `AUD-NG-179`, que incluye expresamente el fallo de timeout de LockService en `checkEnrollmentCapacity`. Se amplía esa tarea existente, sin duplicar IDs globales.

## 2. Evidencia inspeccionada

| Archivo | SHA | Rango/elemento |
|---|---|---|
| `backend/academic-service/Code.gs` | `daf1883ec0b8d4f0ff2bc673af8a4e8c5bbd03fc` | `getOrCreateSheet` 84-155; esquema OfertaAcademica 111; RBAC 168-230; doPost 671-690 y dispatch 880-884; `createAcademicOffer` 6101-6121; `updateAdmissionStatus` 1928-2050; `checkEnrollmentCapacity` 11025-11115; `getEnrollmentCapacityReport` 11117-11138; `createStudentEnrollment` 11140-11240; `registerStudentEnrollment` 704; `convertAdmissionToStudent` 2156-2316; `renewStudentEnrollment` 11251-11265; `changeStudentSection` 11273-11350; `recordStudentWithdrawal` 11750-11824 |
| `js/secretary.js` | `08a81266957b4c18cc25f8ba6749eac30a8f2c2c` | disparador de consulta 176-188; panel `loadAdmissionCapacityStatus` 1404-1455 |
| `dashboard-secretaria.html` | `fa0d8c23aace24a6acab2d4956398a7f5e1309b8` | contenedor de capacidad 188-194 |
| `tests/regression/academic-grading-suite.js` | `3433b707edd4a2f35c68368a3172932adc2a3b32` | búsqueda de casos de capacidad/admisión/matrícula; no se hallaron pruebas específicas |
| `tests/regression/modular-dashboard-suite.js` | `0495e1d526a872c33310935a003a83d924d34683` | revisión complementaria de cobertura de interfaz |

## 3. Hallazgos

### H1 - CRÍTICO/P0: el timeout de LockService se ignora en el cálculo de capacidad
En `checkEnrollmentCapacity` (11030-11035), si `tryLock(5000)` devuelve false, el código continúa leyendo hojas y devuelve `status: success`. Solo libera cuando `hasLock` es true. Esto presenta un snapshot no protegido como si fuera válido y contradice el control de concurrencia declarado. Se relaciona directamente con `TASK-477 / AUD-NG-179`.

### H2 - CRÍTICO/P0: la consulta de capacidad mezcla secciones y el alta de oferta no respeta el esquema canónico
El esquema creado por `getOrCreateSheet` (111) define OfertaAcademica como [OfertaID, AnoID, SedeID, Grado, Seccion, AsignaturaID, PlanID, Modalidad, CapacidadMax, Estado, CodigoClase]. Sin embargo, `createAcademicOffer` (6101-6112) agrega [OfertaID, AnoID, Grado, Seccion, AsignaturaID, PlanID, Estado], desplazando campos respecto de esos encabezados y sin persistir CapacidadMax en su columna. El cálculo lee r[8] y r[9] como capacidad/estado, por lo que las ofertas creadas por ese endpoint no suministran esos valores de forma coherente. Además, cuando no encuentra oferta, el cálculo usa capacidad 35 y estado Activa por defecto, permitiendo aparentar cupos en una sección no configurada.

### H3 - CRÍTICO/P0: las reservas admitidas no se segmentan por sección
`checkEnrollmentCapacity` filtra las solicitudes Admitida por año y grado (11062-11080), pero no por sección. Como consecuencia, una reserva de un aspirante puede descontarse en la sección A aunque vaya a matricularse en B, o viceversa. La ruta `updateAdmissionStatus` llama al cálculo sin enviar sección (aprox. 2009-2015), por lo que usa la sección A predeterminada. La pantalla `loadAdmissionCapacityStatus` (1412) también envía solo año y grado y no permite verificar una sección concreta. El control no satisface la dimensión año/grado/sección.

### H4 - ALTO/P1: la caducidad solo cambia el conteo, no el estado ni el historial de la reserva
Se calcula un umbral fijo/configurable en días naturales (11053-11056) usando la fecha de solicitud como respaldo si no encuentra una marca de decisión Admitida en observaciones (11069-11074). Una reserva expirada solo incrementa `reservasExpiradas`; no cambia la solicitud a un estado Expirada, no libera una entidad de reserva persistente ni genera un evento de liberación. Tampoco se acredita la regla solicitada de cinco días hábiles. Por tanto, la liberación no es un proceso durable ni auditable.

### H5 - CRÍTICO/P0: existen rutas de matrícula que eluden el control de capacidad
`registerStudentEnrollment` (704) se despacha directamente y escribe/actualiza `Matriculas` y cargos sin lock ni llamada a `checkEnrollmentCapacity`. La ruta más nueva `createStudentEnrollment` (11140-11240) sí consulta capacidad, pero admite `skipLock` internamente y su verificación llama `checkEnrollmentCapacity(... skipLock: true)`; el wrapper elimina `skipLock` solo cuando `isInternalCall` es falso, pero la bandera `isInternalCall` proviene del payload. El control no está centralizado en todas las rutas de alta/renovación. La conversión usa su propio lock y verifica cupo, pero la comprobación conserva los defectos de H1-H3.

### H6 - ALTO/P1: la reserva se valida en algunos cambios de estado, pero no se prueba ni se aplica con una política completa
`updateAdmissionStatus` consulta capacidad antes de marcar Admitida, y `convertAdmissionToStudent` vuelve a comprobar antes de convertir. No obstante, ambas rutas omiten o predeterminan sección en ciertos callsites y aceptan `forceCapacityOverride` desde payload. `respondToWaitlistSlot` puede cambiar a Admitida por otra ruta y depende de ese control incompleto. No se encontró una máquina de estados de reserva separada que sincronice plaza ofrecida, aceptada, admitida, convertida y matrícula confirmada como una única transición.

### H7 - CRÍTICO/P0: la excepción de sobrecupo no está autenticada como autorización de Dirección
`checkEnrollmentCapacity` considera suficiente el booleano `forceCapacityOverride` (11087-11092), y registra `CAPACITY_OVERRIDE_AUTHORIZED` sin validar firma, identidad/rol de Dirección, autorización asociada ni motivo obligatorio. `createStudentEnrollment`, `convertAdmissionToStudent`, `updateAdmissionStatus` y `changeStudentSection` reciben o consultan el mismo booleano. La directiva global `OVERBOOKING_ALLOWED` también habilita sobrecupo sin evidencia de firma por decisión. El nombre del evento no prueba autorización real.

### H8 - ALTO/P1: el endpoint consolidado de capacidad no está expuesto
`getEnrollmentCapacityReport` existe (11118-11138), pero no se encontró un caso de dispatch en `doPost` ni una concesión correspondiente en ROLE_PERMISSIONS. El reporte llama a `checkEnrollmentCapacity` con `skipLock: true` y construye grado/sección desde columnas de oferta; por ello no es un endpoint accesible de forma consistente ni está protegido por snapshot.

### H9 - ALTO/P1: las pruebas de regresión no cubren la capacidad F5-010
Las suites inspeccionadas no contienen pruebas de capacidad por año/grado/sección, reserva admitida, expiración, conversión sin doble conteo, rechazo/cancelación, sección cerrada, bloqueo de matrícula concurrente, timeout de lock, sobrecupo autorizado ni reconciliación de reportes. La existencia de funciones no sustituye las pruebas conductuales.

## 4. Matriz de los 12 requisitos

| # | Requisito | Resultado |
|---:|---|---|
| 1 | Capacidad máxima por año lectivo, grado y sección en OfertaAcademica | PARCIAL (columna prevista, alta de oferta desalineada y sin capacidad) |
| 2 | Restar matrículas activas y solicitudes Admitida no vencidas | NO (reservas sin filtro de sección; H3) |
| 3 | Distinguir Admitida, reservada, oferta aceptada y matrícula confirmada | PARCIAL (estados dispersos; sin transición/reserva canónica) |
| 4 | Regla configurable de caducidad de reservas | PARCIAL (umbral de días naturales y sin expiración durable) |
| 5 | Evitar doble contabilización al convertir reserva en matrícula | PARCIAL (Convertida deja de contarse, pero falta atomicidad y prueba) |
| 6 | Verificar capacidad al admitir y convertir | PARCIAL (existe verificación, pero sección/bypass/lock incompletos) |
| 7 | Proteger cálculo con LockService | NO (timeout ignorado y rutas de alta eluden el control) |
| 8 | Endpoint con capacidad, confirmados, reservados y libres | PARCIAL (función existe, dispatch/RBAC ausentes) |
| 9 | Liberar reserva al cancelar, rechazar o expirar | PARCIAL (cambio de estado libera conteo; expiración no cambia estado ni audita) |
| 10 | Bloquear reservas en secciones cerradas/no abiertas | PARCIAL (verificación existe, pero oferta/alta/schema desalineados y fallback abierto) |
| 11 | Historial de reservas/liberaciones en bitácora | NO (no hay eventos explícitos y completos del ciclo de reserva) |
| 12 | Política configurable de sobrecupo con firma de Dirección | NO (booleano cliente-controlable; sin autorización firmada) |

## 5. Matriz de los 9 criterios de aceptación

| # | Criterio | Resultado |
|---:|---|---|
| 1 | Sección llena bloquea Admitida y conversión | PARCIAL (validación presente, sección y bloqueo defectuosos) |
| 2 | Aspirantes Admitida reducen cupos inmediatamente | PARCIAL (cuenta por grado, no sección) |
| 3 | Conversión transforma reserva en matrícula sin doble descuento | PARCIAL (estado Convertida excluido, sin atomicidad demostrada) |
| 4 | Cancelación/expiración libera cupo en tiempo real | PARCIAL (cancelación por estado; expiración solo se omite del conteo) |
| 5 | Dos peticiones simultáneas del último cupo: un ganador | NO (timeout ignorado; rutas bypass; sin pruebas) |
| 6 | Conversión recalcula y valida antes de confirmar | PARCIAL (recalcula, pero snapshot/callsite defectuosos) |
| 7 | Reporte coincide con matrículas activas + reservas | NO (conteo por sección incorrecto y reporte sin dispatch) |
| 8 | Cambios de capacidad no modifican decisiones previas | SÍ (el cálculo no reescribe estados de admisión existentes; no implica validez del conteo) |
| 9 | Sobrecupo requiere forceCapacityOverride autorizado y auditado por Dirección | NO (flag sin autenticación/firma) |

## 6. Tareas ejecutables derivadas de los hallazgos

Las tareas se mantienen dentro de este informe. No crear IDs globales duplicados. Cada ficha identifica hallazgo, severidad, alcance, dependencias, archivos, criterios, prioridad y estado.

### F5-010-A01 - Unificar esquema y escritura de OfertaAcademica
- **Hallazgos:** H2 (CRÍTICO/P0), H8 (ALTO/P1).
- **Objetivo/acción:** usar un mapa de columnas derivado de encabezados; alinear creación, consulta, reporte, horario y capacidad; persistir capacidad máxima y estado sin desplazar columnas.
- **Archivos/módulos:** `backend/academic-service/Code.gs`; `tests/regression/academic-grading-suite.js`; `AUDITORIAS/MapaDependencias.md`.
- **Dependencias:** ninguna; habilita A02 y A06.
- **Alcance:** compatibilidad de lectura con el esquema legacy de siete columnas; agregar columnas opcionales faltantes solo al crear ofertas; no reordenar ni sobrescribir datos existentes; validar capacidad entera positiva y estado permitido; versionar caché.
- **Criterios verificables:** (1) una oferta nueva conserva exactamente ID/año/sede/grado/sección/asignatura/plan/modalidad/capacidad/estado/código; (2) lectura devuelve los mismos valores; (3) encabezados legacy se leen sin confundir grado, sección o estado; (4) esquema incompleto falla explícitamente; (5) lectores de coordinación, horarios, matrícula y analítica usan el mismo mapa.
- **Prioridad:** P0.
- **Estado:** **En ejecución** (código preparado; pendiente verificación de persistencia real y revisión externa).

### F5-010-A02 - Corregir cálculo dimensional de ocupación
- **Hallazgos:** H3 (CRÍTICO/P0), H6 (ALTO/P1).
- **Objetivo/acción:** asociar cada reserva a una sección inequívoca y calcular confirmados/reservados por año, grado y sección, sin mezclar grupos.
- **Archivos/módulos:** `backend/academic-service/Code.gs`; UI de Secretaría cuando corresponda.
- **Dependencias:** A01; modelo de reservas F5-008.
- **Alcance:** definir la fuente de sección para solicitudes sin sección; filtrar las matrículas y reservas con la misma clave académica; impedir defaults silenciosos que trasladen reservas entre secciones.
- **Criterios verificables:** dos secciones del mismo grado tienen conteos independientes; una reserva sin sección se rechaza o queda en estado no asignado sin descontar cupo; los conteos coinciden con fixtures de matrícula y admisión.
- **Prioridad:** P0.
- **Estado:** Pendiente.

### F5-010-A03 - Hacer atómica la operación de cupo
- **Hallazgos:** H1 (CRÍTICO/P0), H5 (CRÍTICO/P0), H6 (ALTO/P1).
- **Objetivo/acción:** centralizar reserva y matrícula bajo un único bloqueo obligatorio; abortar si no se obtiene; retirar bypass controlables por cliente.
- **Archivos/módulos:** `backend/academic-service/Code.gs`; ampliar `TASK-477 / AUD-NG-179` y `AUD-NG-234 / TASK-514`.
- **Dependencias:** A01 y A02; rutas de admisión, conversión, renovación, traslado y lista de espera.
- **Alcance:** proteger el ciclo completo lectura-validación-escritura; integrar rutas legacy y nuevas; no aceptar `skipLock` o `isInternalCall` del cliente como autorización interna.
- **Criterios verificables:** timeout produce error sin escritura; dos peticiones por el último cupo producen un único ganador; todas las rutas de alta aplican el mismo control; reintentos no duplican matrícula.
- **Prioridad:** P0.
- **Estado:** Pendiente; ampliar ID existente TASK-477, no crear duplicado.

### F5-010-A04 - Implementar ciclo de vida durable de reservas
- **Hallazgos:** H4 (ALTO/P1), H6 (ALTO/P1).
- **Objetivo/acción:** persistir ofrecida, aceptada, Admitida, expirada, cancelada, rechazada y convertida con fecha, motivo y liberación idempotente.
- **Archivos/módulos:** `backend/academic-service/Code.gs`; integración con lista de espera F5-008 y notificaciones F5-011.
- **Dependencias:** A02 y A03.
- **Alcance:** definir expiración en días hábiles o naturales y zona horaria; registrar transiciones; liberar y promover siguiente aspirante sin doble conteo.
- **Criterios verificables:** cada transición deja estado y evento persistidos; una reserva expirada deja de ocupar cupo una sola vez; cancelación/rechazo libera inmediatamente; conversión transforma reserva en matrícula sin doble descuento.
- **Prioridad:** P1.
- **Estado:** Pendiente.

### F5-010-A05 - Proteger autorización de sobrecupo
- **Hallazgos:** H7 (CRÍTICO/P0).
- **Objetivo/acción:** sustituir el booleano cliente-controlable por autorización verificable de Dirección, con actor, firma/credencial institucional, motivo y correlación.
- **Archivos/módulos:** `backend/academic-service/Code.gs`; servicio de identidad/firma si aplica.
- **Dependencias:** A03 y contratos de identidad institucional.
- **Alcance:** fail-closed ante ausencia de autorización; no confiar en `forceCapacityOverride` aislado ni en constante global como firma; registrar autorización verificable.
- **Criterios verificables:** usuario sin rol o sin firma válida no puede exceder cupo; autorización válida queda vinculada a la operación y su auditoría.
- **Prioridad:** P0.
- **Estado:** Pendiente.

### F5-010-A06 - Exponer reporte consolidado seguro
- **Hallazgos:** H3 (CRÍTICO/P0), H8 (ALTO/P1).
- **Objetivo/acción:** registrar dispatch/RBAC para el reporte, consultar snapshot consistente y conectar la UI con año/grado/sección reales.
- **Archivos/módulos:** `backend/academic-service/Code.gs`, `js/secretary.js`, `dashboard-secretaria.html`.
- **Dependencias:** A01-A03.
- **Alcance:** distinguir sección inexistente, cerrada y cupo cero; reportar capacidad, matrículas activas, reservas vigentes, expiradas y libres.
- **Criterios verificables:** endpoint accesible solo a roles autorizados; cifras reconciliadas con datos canónicos; la UI muestra la sección seleccionada y errores sin inventar capacidad.
- **Prioridad:** P1.
- **Estado:** Pendiente.

### F5-010-A07 - Bitácora y reconciliación de cupos
- **Hallazgos:** H4 (ALTO/P1), H7 (CRÍTICO/P0).
- **Objetivo/acción:** registrar reserva, aceptación, expiración, cancelación, rechazo, conversión, liberación y override con actor/fecha/causa.
- **Archivos/módulos:** `backend/academic-service/Code.gs`; ampliar `AUD-NG-145`.
- **Dependencias:** A03-A05.
- **Alcance:** bitácora append-only y proceso de reconciliación no destructivo entre solicitudes, reservas y matrículas.
- **Criterios verificables:** cada cambio de ocupación tiene un evento correlacionado; la reconciliación detecta duplicados, huérfanos y diferencias sin modificar datos automáticamente.
- **Prioridad:** P1.
- **Estado:** Pendiente.

### F5-010-A08 - Suite de regresión aislada
- **Hallazgos:** H1-H8 (CRÍTICO/P0 y ALTO/P1).
- **Objetivo/acción:** cubrir esquema, capacidad, reservas, expiración, concurrencia, conversión, permisos y reportes sin tocar hojas productivas.
- **Archivos/módulos:** `tests/regression/academic-grading-suite.js` y/o suite dedicada de capacidad; ampliar `AUD-NG-161`.
- **Dependencias:** A01-A07.
- **Alcance:** mocks/fixtures aislados de Sheets, LockService, CacheService y reloj; pruebas de estados y fallos.
- **Criterios verificables:** casos de límite, sección A/B, último cupo concurrente, timeout, expiración, cancelación, conversión sin doble conteo, override no autorizado y reporte reconciliado.
- **Prioridad:** P1.
- **Estado:** Pendiente; ampliar ID existente AUD-NG-161.

## 7. Pruebas y limitaciones

**Ejecutado:** verificación de rama/HEAD/árbol; búsqueda del informe en árbol e historial; lectura del bloque de requisitos [X] en completadas.md; lectura íntegra del blob Pendientes.md; inspección estática/manual de esquema, endpoints, callsites, RBAC, UI y suites; contraste de índices de columnas con el esquema creado por `getOrCreateSheet`.

**No ejecutado:** runtime de Apps Script, HTTP, Google Sheets/Drive productivo, navegador, concurrencia real, timeout inducido, triggers de expiración, firma digital real, suites automatizadas ni despliegue. No se afirma que esos escenarios se hayan reproducido dinámicamente.

**Cambios de código/pruebas:** ninguno en esta fase. Este checkpoint cierra la auditoría documental y deja las tareas ejecutables registradas; la implementación se realizará en los pasos de desarrollo posteriores.

## 8. Dictamen

**TAREA-F5-010: NO CUMPLE.** Hay funciones y controles parciales, pero el control de capacidad no es consistente por sección ni está cerrado frente a concurrencia y rutas alternativas; la expiración no es durable/auditable, el override no prueba autorización de Dirección y el reporte consolidado no está expuesto. El estado [X] de `completadas.md` no queda respaldado por la implementación inspeccionada.
