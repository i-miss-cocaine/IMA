# Auditoría técnica - TAREA-F5-008: listas de espera con prelación y asignación controlada de plazas

**Checkpoint:** C1.202  
**Sesión operativa:** IMA-AUDIT-20261107-0313Z (identificador operativo, no ID nativo de ChatGPT)  
**Checkpoint de inicio:** C1.201  
**Repositorio:** i-miss-cocaine/IMA  
**Rama auditada:** NG_beta_0.0.0.1_work  
**HEAD auditado:** 81f3c565fadc9114372cb993bb00c51082e8b56f  
**Árbol auditado:** 38f88c9ce610472ea58c568b06a9a16876435e1f (970 entradas; truncated=false)  
**Rama base protegida:** NG_beta_0.0.0.1, SHA 44d9891132332e692dbe2ba8602b41f50a508a59 (sin modificaciones)  
**Dictamen:** **NO CUMPLE**

## 1. Búsqueda documental y fuentes

Se comprobó primero el árbol de la rama y el historial Git de las rutas:
- `AUDITORIAS/AUDITORIA_COMPLETADAS_TAREA-F5-008.md`
- `AUDITORIAS/AUDITORIA_TAREA-F5-008.md`
- `AUDITORIA_FASE_5_ADMISIONES_PORTAL_FAMILIAS.md`
- `AUDITORIAS/AUDITORIA_FASE_5_ADMISIONES_PORTAL_FAMILIAS.md`

Ninguna existe en el árbol ni tiene commits alcanzables en el historial consultado. La búsqueda de rutas del árbol por F5-008, waitlist, lista de espera y el informe de fase tampoco devolvió coincidencias. La auditoría se realiza desde cero y este archivo es el informe nuevo.

**Fuente de requisitos:** `completadas.md`, SHA `f57f1aef832e81e44fc4f7ec36a852d50e464676`, líneas 2057-2089. TAREA-F5-008 está marcada [X] Completada, contiene 12 puntos de alcance y 10 criterios de aceptación [x]. La fuente histórica no contiene once requisitos: se revisaron los doce puntos y los diez criterios existentes.

**Registro histórico de implementación:** `ChangesLogs.txt`, SHA `d57cf4bd861b5c3720e60cf83241ed804ff645d9`, líneas 1824-1833, declara la tabla, cinco endpoints y controladores de UI. Es una declaración histórica y no demuestra por sí sola el comportamiento.

**Origen declarado:** TAREA-F5-008 remite a HALLAZGOS-F5-P1-01 y al informe de fase ausente. La cadena HALLAZGOS-F5-P1-01 no aparece en el `AUDITORIAS/Auditoria.txt` actual (SHA `58919c126108e53f0f913af9e075fe62f2a185e8)); no se puede reconstruir el hallazgo original desde esa bitácora. Se registra la falta de fuente sin inventar su contenido.

**Pendientes.md:** la lectura ordinaria de la ruta sigue devolviendo contenido vacío. Por la instrucción expresa de esta auditoría, se consultó el blob Git actual SHA `631b4c2dbf0e86d5704b63625382d73ccb8ceb3c`: 1.782.094 caracteres, 20.182 líneas, sin U+FFFD (1.803.672 bytes según el checkpoint previo). No contiene TAREA-F5-008 ni un bloque propio de la tarea; sí contiene en la línea 5364 una advertencia previa de que `addToWaitlist` usa `skipLock=true` al generar ID sin lock exterior visible. No se modifica ni restaura porque el blob actual está íntegro; la discrepancia está en el método de lectura ordinario.

**Tareas relacionadas existentes, no duplicadas:**
- TAREA-F5-010: control de capacidad, reservas y matrículas (completadas.md, alrededor de líneas 2126-2160); su alcance ya exige plazas reservadas, lock y control de cupos.
- TAREA-F5-011: notificaciones automáticas, incluyendo oferta/liberación de plaza (alrededor de líneas 2162-2205).
- TAREA-F5-012: seguimiento del aspirante en Portal Familiar, con aceptación/rechazo de vacante e IDOR (alrededor de líneas 2206-2250).
- AUD-NG-001: sesión/token; AUD-NG-179: lock timeout de capacidad; AUD-NG-234/TASK-514: bypass de lock/transiciones; AUD-NG-145: bitácora; AUD-NG-161: pruebas; AUD-NG-233/TASK-513: controles fail-closed/capacidad. Se amplían donde corresponda; no se crean identificadores globales duplicados.

## 2. Respaldo e inventario de evidencia

Se registraron los SHA originales como respaldo inmutable de los archivos auditados. No se modificó código ni se creó una copia dentro de la rama.

| Archivo | SHA de respaldo | Rango/elemento inspeccionado |
|---|---|---|
| `backend/academic-service/Code.gs` | `daf1883ec0b8d4f0ff2bc673af8a4e8c5bbd03fc` | esquema 84-156 (ListaEsperaAdmision 152-153); roles 168-260; validación contextual/RBAC 465-590; doPost y bloqueo de skipLock 675-700; dispatch 825-930; logging 52-77; endpoints waitlist 1750-1925; transición de admisión 1928-2050; generador de ID 2107-2148; capacidad 11025-11114. |
| `js/secretary.js` | `08a81266957b4c18cc25f8ba6749eac30a8f2c2c` | carga de expediente 176-188; UI waitlist 1521-1638. |
| `dashboard-secretaria.html` | `fa0d8c23aace24a6acab2d4956398a7f5e1309b8` | sección de waitlist 253-266; carga de scripts 312-317. |
| `js/api.js` | `6b24f666db30a811a8e9b38d466fc6001cf6dfa9` | fetchApi 1-90; enriquecimiento requesterUserId/requesterRole sin sessionToken. |
| `js/auth.js` | `8444dd085a3186106d2db7005b61ef934d3c22d8` | construcción de currentUser; omite conservar sessionToken (revisión C1.201/AUD-NG-001). |
| `backend/user-service/Code.gs` | `12079dd410aa6d8afbce55a4bc62a79dea605f9f` | permisos de familia/roles 920-980; sendMultiChannelNotification 4818-4893. |
| `student-dashboard.html` | `6379ea0ed39d71b89747a0280bb925fdf12202c1` | shell del portal familiar. |
| `js/student.js` | `e2888cea60322e49a40b89adadb8010489605dcc` | selector familiar 179-223; panel de seguimiento de aspirante 264-345. |
| `tests/regression/academic-grading-suite.js` | `3433b707edd4a2f35c68368a3172932adc2a3b32` | suite completa; no contiene pruebas waitlist. |
| `tests/regression/modular-dashboard-suite.js` | `0495e1d526a872c33310935a003a83d924d34683` | suite completa; no contiene pruebas waitlist. |

El árbol de `tests/` contiene únicamente esas dos suites de regresión. Ninguna incluye casos para ListaEsperaAdmision, addToWaitlist, getWaitlist, reorderWaitlist, offerWaitlistSlot o respondToWaitlistSlot.

## 3. Flujo técnico observado

1. `dashboard-secretaria.html` incorpora el contenedor `#modal-adm-waitlist-container` y un botón Incorporar (253-266).
2. Al abrir un expediente, `js/secretary.js` ejecuta `loadAdmissionWaitlistStatus(found.solicitudId)` (176-182).
3. `loadAdmissionWaitlistStatus` llama `getWaitlist({})`, descarga la lista completa y localiza en cliente el registro del expediente; no aplica filtros por año, grado ni vacantes (1521-1562).
4. `promptAddToWaitlist` pide tres criterios mediante confirmaciones y envía `addToWaitlist` (1564-1592).
5. `offerWaitlistSlotAction` solicita horas y llama `offerWaitlistSlot`; `reorderWaitlistAction` solicita posición y justificación y llama `reorderWaitlist` (1594-1638).
6. `Code.gs` despacha cinco endpoints (853-857). Las operaciones persisten en `ListaEsperaAdmision`, creada por `getOrCreateSheet` (152-153).
7. `respondToWaitlistSlot` existe en backend y se despacha, pero no hay botón ni flujo de respuesta en el portal familiar inspeccionado.
8. La capacidad se calcula en `checkEnrollmentCapacity` (11025-11114), pero las operaciones de lista de espera no invocan ese control al ofrecer/reservar plaza.

## 4. Matriz de los doce puntos de alcance

| # | Requisito | Resultado | Evidencia |
|---:|---|---|---|
| 1 | Crear ListaEsperaAdmision y cuatro endpoints requeridos | **Parcial** | La hoja y add/get/reorder/offer existen; además existe respondToWaitlistSlot. La presencia de endpoints no acredita su contrato. |
| 2 | Ingresar solicitudes En_Espera con grado, año, fecha, posición y criterios | **No cumple** | addToWaitlist no valida el estado actual; cambia directamente SolicitudesAdmision a En_Espera. Guarda fecha de ingreso al registro, no la fecha de postulación como criterio de desempate. |
| 3 | Configurar y calcular automáticamente prelación institucional | **No cumple** | Pesos 50/30/40/10 están hardcodeados y criterios vienen del cliente. El puntaje no determina la posición: se asigna cantidad de filas En_Espera + 1. No hay configuración institucional ni desempate por fecha. |
| 4 | Autorizar y auditar reordenamiento manual | **Parcial** | RBAC limita la acción a perfiles administrativos, y exige justificación de 10 caracteres. No valida posición entera/rango/duplicidad/grupo, no recalcula el resto, y el actor calculado no se usa en el log. |
| 5 | Filtrar lista por año, grado y disponibilidad de plazas | **Parcial** | getWaitlist admite filtros de año/grado/estado, pero no disponibilidad/capacidad. UI llama sin filtros y muestra solo el registro del expediente abierto. |
| 6 | Gestionar seis estados de oferta | **No cumple** | Se escriben En_Espera, Plaza_Ofrecida, Oferta_Aceptada y Oferta_Rechazada. No hay transición que escriba Oferta_Expirada o Retirada; la retirada de SolicitudesAdmision no sincroniza el registro waitlist. |
| 7 | Plazo de caducidad configurable y expiración automática | **No cumple** | offerWaitlistSlot almacena FechaExpiracionOferta; no existe worker/trigger/endpoint de expiración en el módulo. respondToWaitlistSlot no comprueba la fecha ni rechaza una respuesta vencida. |
| 8 | Notificar automáticamente a la familia al ofrecer vacante | **No cumple** | offerWaitlistSlot no invoca sendMultiChannelNotification ni un servicio de eventos. El servicio genérico existe en USER Code.gs, pero no está conectado a esta operación. |
| 9 | Rechazo/expiración libera plaza y ofrece al siguiente | **No cumple** | El rechazo solo cambia el estado de la fila. No libera una reserva identificada ni selecciona/notifica al siguiente aspirante. No hay proceso de expiración. |
| 10 | Impedir reserva simultánea de una plaza para varios aspirantes | **No cumple** | No existe VacanteID/OfertaID en la fila waitlist, no hay comprobación de capacidad y offer/respond no adquieren LockService. |
| 11 | Aceptación cambia solicitud a Admitida y requiere formalizar matrícula | **Parcial** | En respuesta Aceptar se llama updateAdmissionStatus(Admitida), pero primero se marca Oferta_Aceptada. Si la transición/capacidad falla, no hay rollback de ese estado; tampoco existe transacción atómica entre ambas hojas. |
| 12 | Trazabilidad completa de movimientos | **No cumple** | add/reorder/offer generan logs de evento; respond no registra evento. No hay tabla de historial de ofertas/transiciones, ni actorUserId en el esquema LogsSistema. Los cambios de estado sobrescriben la fila. |

## 5. Hallazgos detallados

### H1. Las acciones protegidas de waitlist no reciben token de sesión
**Severidad: CRÍTICO / P0. Reconciliación: ampliar AUD-NG-001; no duplicar.**

Los controladores llaman fetchApi para los endpoints de lista de espera (secretary.js 1528, 1579, 1599 y 1625). fetchApi añade requesterUserId/requesterRole, pero no sessionToken (api.js 1-90). auth.js no conserva sessionToken en currentUser según evidencia de C1.201. En ACADEMIC, getWaitlist/add/reorder/offer/respond no son PUBLIC_ACTIONS; validateRolePermission exige token y devuelve Sin Credenciales de Sesión si falta (524-544). Por tanto, el flujo cliente no cumple el contrato de autenticación de las acciones protegidas. Se amplía AUD-NG-001.

### H2. El ingreso no valida elegibilidad ni verifica los criterios de prelación
**Severidad: ALTO / P1.**

addToWaitlist solo verifica que solicitudId exista (1750-1763). No exige estado En_Espera ni valida transición permitida; escribe En_Espera directamente en SolicitudesAdmision (1805-1806), eludiendo updateAdmissionStatus y sus controles/historial. criteriosJSON se recibe del cliente y se convierte directamente a puntaje fijo (1774-1780), sin verificar hermanos matriculados, condición de exalumno o vínculo de empleado. Tampoco consulta configuración institucional. La fecha guardada es la hora de alta en la lista (1801), no la fecha de postulación como criterio de prelación.

### H3. La posición no se calcula por prioridad y puede duplicarse
**Severidad: ALTO / P1.**

La posición se asigna con sameGroup.length + 1 (1782-1784); el puntaje calculado no participa en la ordenación. getWaitlist ordena solo por posicion (1844), sin puntaje ni fecha. sameGroup cuenta únicamente En_Espera, excluyendo Plaza_Ofrecida; al ofrecer un cupo, una nueva entrada puede recibir una posición ya usada. No se recalculan posiciones después de aceptación/rechazo/retirada.

### H4. El reordenamiento manual no mantiene integridad de la cola
**Severidad: ALTO / P1.**

reorderWaitlist exige una justificación de 10 caracteres, pero solo escribe nuevaPosicion en una fila y guarda la justificación en una sola columna (1849-1873). No valida entero positivo en backend, rango de la cola, grupo año/grado, unicidad ni estado activo; tampoco desplaza posiciones de otros aspirantes. Calcula actorUserId en 1870 pero no lo incorpora al log ni a un historial. logStructuredEvent guarda rol y payload, no actorUserId (52-77).

### H5. La oferta no identifica ni comprueba una vacante real
**Severidad: CRÍTICO / P0. Reconciliación: ampliar TAREA-F5-010 y AUD-NG-179.**

offerWaitlistSlot recibe solo esperaId/horasVigencia (1876-1898). No identifica OfertaID/Seccion/VacanteID, no consulta OfertaAcademica ni checkEnrollmentCapacity, no comprueba que exista cupo ni que el aspirante sea el primero elegible. La hoja ListaEsperaAdmision no tiene columna para identificar la plaza asignada (152-153). TAREA-F5-010 calcula capacidad por año/grado/sección y cuenta matrículas y solicitudes Admitida, pero no contabiliza Plaza_Ofrecida como reserva; además checkEnrollmentCapacity continúa aunque tryLock(5000) devuelva false (11030-11036), defecto ya relacionado con AUD-NG-179. Las ofertas no se encuentran dentro de una sección crítica compartida con el control de capacidad.

### H6. La reserva no es atómica y puede duplicarse bajo concurrencia
**Severidad: CRÍTICO / P0. Reconciliación: ampliar AUD-NG-234/TASK-514 y AUD-NG-179.**

addToWaitlist realiza lectura, detección de duplicado, cálculo de posición y appendRow sin lock (1754-1806); además genera ID con skipLock:true (1786), eludiendo el lock interno de generateInstitutionalId (2107-2148). offerWaitlistSlot y respondToWaitlistSlot también leen/escriben sin LockService (1880-1896; 1905-1924). Dos solicitudes simultáneas pueden superar la misma comprobación, asignar posiciones/IDs conflictivos o recibir ofertas para la misma capacidad. El middleware de idempotencia solo ayuda si el cliente envía clave; los controladores inspeccionados no envían idempotencyKey/idempotencyToken.

### H7. La máquina de estados, caducidad y liberación automática están incompletas
**Severidad: CRÍTICO / P0.**

offerWaitlistSlot puede ofrecer un registro sin comprobar que esté En_Espera, que no tenga oferta activa ni que corresponda al primer puesto; parseInt permite plazos negativos o arbitrarios y solo persiste la fecha (1887-1894). respondToWaitlistSlot no valida que el estado actual sea Plaza_Ofrecida, que la respuesta sea exactamente Aceptar/Rechazar ni que la fecha siga vigente (1901-1924). No se encontró un proceso programado de expiración. El rechazo solo escribe Oferta_Rechazada; no libera/reserva una plaza ni selecciona al siguiente. updateAdmissionStatus no sincroniza el estado de ListaEsperaAdmision al retirar/rechazar la solicitud, por lo que un registro waitlist puede permanecer elegible después de que su solicitud cambie de estado. No se escriben Oferta_Expirada ni Retirada.

### H8. Aceptar una oferta puede dejar estados contradictorios
**Severidad: ALTO / P1.**

respondToWaitlistSlot escribe Oferta_Aceptada antes de llamar updateAdmissionStatus(Admitida) (1915-1918). Si updateAdmissionStatus rechaza la transición por capacidad, evaluaciones u otra guarda, el estado waitlist ya quedó aceptado y no se revierte; tampoco se ejecuta el último update de timestamp. No hay transacción/compensación entre ListaEsperaAdmision y SolicitudesAdmision. La transición a Admitida existe parcialmente, pero no se acredita la consistencia del compromiso ni la formalización posterior.

### H9. La familia no puede consultar su posición ni responder desde el portal
**Severidad: CRÍTICO / P0. Reconciliación: ampliar TAREA-F5-012 y AUD-NG-001.**

En ROLE_PERMISSIONS de ACADEMIC, getWaitlist y respondToWaitlistSlot se conceden a Director/Secretaría/Secretaria/Administrador; Padre, Tutor y Responsable no tienen esas acciones (168-240). La UI familiar (student.js 264-345) muestra estado general del trámite y etapa En_Espera, pero no llama getWaitlist, no presenta posición relativa, no presenta oferta/vencimiento ni botones aceptar/rechazar. Tampoco existe un endpoint familiar de waitlist con filtrado por solicitud vinculada al tutor. El endpoint administrativo getWaitlist devuelve todos los aspirantes filtrados solo por parámetros generales, no por la identidad/relación del solicitante. No se cumple la consulta exclusiva de la propia solicitud y falta el flujo de respuesta familiar previsto también por TAREA-F5-012.

### H10. La interfaz administrativa no presenta una lista de espera gestionable
**Severidad: ALTO / P1.**

dashboard-secretaria.html solo contiene un panel dentro del expediente abierto (253-266). loadAdmissionWaitlistStatus pide getWaitlist({}) y selecciona una coincidencia en cliente (1521-1562); no existe vista global con filtros por año, grado y disponibilidad. Los botones solo permiten incorporar, ofrecer o reordenar el registro actual. No se presenta una cola priorizada real ni un selector de vacante.

### H11. Notificaciones y bitácora no cubren todos los movimientos
**Severidad: ALTO / P1. Reconciliación: ampliar TAREA-F5-011 y AUD-NG-145.**

addToWaitlist, reorderWaitlist y offerWaitlistSlot llaman logStructuredEvent; respondToWaitlistSlot no lo hace (1808, 1871, 1896, 1901-1924). El esquema LogsSistema registra rol, pero no actorUserId (Code.gs 52-77). La función de log captura y silencia errores, por lo que el endpoint puede confirmar la operación sin garantizar que el registro haya quedado persistido. El historial de oferta, rechazo, expiración, aceptación y liberación se sobrescribe en una fila y no existe una entidad de eventos waitlist. El motor sendMultiChannelNotification existe en USER Code.gs (4818-4893), pero offerWaitlistSlot/respondToWaitlistSlot no lo invocan. TAREA-F5-011 exige explícitamente avisar ofertas y liberaciones de plazas.

### H12. No hay pruebas conductuales específicas de lista de espera
**Severidad: ALTO / P1. Reconciliación: ampliar AUD-NG-161.**

Las dos suites presentes en tests/regression no incluyen waitlist ni referencias a sus cinco endpoints. No hay pruebas de elegibilidad, precedencia, desempates, reordenamiento, oferta del primero, cupo inexistente, concurrencia, expiración, retiro, IDOR familiar, aceptación fallida, notificación, bitácora ni reintentos. No se ejecutaron las suites porque la metodología exige inspección manual en fase de auditoría y no se dispone de runtime Apps Script/Sheets productivo.

## 6. Evaluación de los diez criterios de aceptación

| Criterio marcado [x] | Dictamen |
|---|---|
| Solo solicitudes elegibles entran | **No cumple:** solo se valida existencia; se fuerza En_Espera desde cualquier estado. |
| Posición transparente según prelación | **No cumple:** puntaje fijo y posición por conteo; no se ordena por puntaje/fecha. |
| Reordenamiento justificado y auditado | **Parcial:** justificación y log de rol; no se recalcula la cola ni se registra actor confiable/historial completo. |
| Plaza asignada a un solo aspirante | **No cumple:** no hay identidad de vacante, lock ni reserva en capacidad. |
| Rechazo/expiración libera y ofrece al siguiente | **No cumple:** rechazo solo cambia estado; no hay expiración automática ni siguiente aspirante. |
| Aceptación actualiza a Admitida | **Parcial:** llama updateAdmissionStatus, pero antes marca Oferta_Aceptada sin rollback si falla. |
| Concurrencia no duplica reserva | **No cumple:** operaciones de lista sin lock y skipLock en ID. |
| Retiradas salen y no reciben ofertas | **No cumple:** no se sincroniza Retirada y offerWaitlistSlot no valida estado de solicitud. |
| Familia consulta solo posición propia | **No cumple:** roles familiares sin getWaitlist y portal sin posición; no hay endpoint de consulta propia. |
| Historial completo de ofertas/vencimientos/aceptaciones | **No cumple:** se sobrescriben estados; respond no registra evento y no existe historial de ofertas. |

Las diez marcas [x] de completadas.md no corresponden a la evidencia del código inspeccionado.

## 7. Tareas ejecutables derivadas de los hallazgos

### F5-008-A01: elegibilidad, criterios institucionales y orden determinista de prelación
- **Hallazgos:** H2, H3, H4.
- **Severidad:** ALTO / P1.
- **Objetivo/acción:** validar estado permitido de la solicitud en servidor; verificar criterios desde fuentes institucionales confiables; mover ponderaciones a configuración versionada; usar puntaje y fecha de postulación como orden determinista; recalcular posiciones del grupo completo ante ingreso, retiro, oferta, aceptación, rechazo y cambio autorizado; hacer reordenamiento manual consistente con justificación y autorización.
- **Archivos/módulos:** backend/academic-service/Code.gs; js/secretary.js; dashboard-secretaria.html; configuración institucional.
- **Dependencias:** SolicitudesAdmision; ListaEsperaAdmision; criterios institucionales; TAREA-F5-002 máquina de estados.
- **Criterios verificables:** estado no elegible rechazado sin mutación; criterios no pueden ser falsificados por payload; pesos se leen de configuración; empates resueltos por fecha y clave estable; posiciones únicas/contiguas por año/grado; reordenar una entrada recalcula las demás y conserva justificación/actor.
- **Prioridad:** P1. **Estado:** Pendiente.

### F5-008-A02: reserva atómica de vacante integrada al control de capacidad
- **Hallazgos:** H5, H6.
- **Severidad:** CRÍTICO / P0.
- **Objetivo/acción:** identificar vacante por OfertaID/año/grado/sección; comprobar cupo real y estado de oferta; seleccionar al primer aspirante elegible; reservar la plaza y actualizar waitlist bajo una única sección crítica compartida con matrículas/admisiones; eliminar skipLock en generación de IDs o exigir lock exterior verificable; tratar timeout como fallo cerrado.
- **Archivos/módulos:** backend/academic-service/Code.gs; OfertaAcademica; ListaEsperaAdmision; SolicitudesAdmision; SecuenciasIDs.
- **Dependencias:** TAREA-F5-010; AUD-NG-179; AUD-NG-234/TASK-514; AUD-NG-233/TASK-513.
- **Criterios verificables:** una vacante tiene identificador único; oferta no se crea sin capacidad positiva y sección abierta; dos operaciones concurrentes para la última plaza producen un solo ganador; timeout no continúa; no hay doble reserva entre oferta waitlist y solicitud Admitida/matrícula; IDs únicos.
- **Prioridad:** P0. **Estado:** Pendiente.

### F5-008-A03: máquina de estados, expiración automática y promoción del siguiente aspirante
- **Hallazgos:** H7, H8.
- **Severidad:** CRÍTICO / P0.
- **Objetivo/acción:** validar transiciones En_Espera -> Plaza_Ofrecida -> Oferta_Aceptada/Oferta_Rechazada/Oferta_Expirada/Retirada; fijar plazos dentro de límites institucionales; procesar expiraciones con mecanismo programado idempotente; liberar la reserva y seleccionar/ofrecer al siguiente; sincronizar cualquier rechazo/retirada de SolicitudesAdmision con la lista; aplicar aceptación y transición a Admitida en una operación recuperable.
- **Archivos/módulos:** backend/academic-service/Code.gs; servicio programado/trigger; ListaEsperaAdmision; SolicitudesAdmision.
- **Dependencias:** TAREA-F5-010; TAREA-F5-011; máquina de estados TAREA-F5-002; AUD-NG-006/AUD-NG-234/TASK-514.
- **Criterios verificables:** estados/transiciones inválidos rechazados; respuesta vencida no aceptada; expiración cambia estado y libera una sola reserva; siguiente aspirante es seleccionado según orden vigente; retirada impide nuevas ofertas; fallo parcial no deja Oferta_Aceptada sin Admitida ni doble reserva; reintento idempotente.
- **Prioridad:** P0. **Estado:** Pendiente.

### F5-008-A04: consulta y respuesta familiar con aislamiento por solicitud
- **Hallazgos:** H1, H9.
- **Severidad:** CRÍTICO / P0.
- **Objetivo/acción:** añadir endpoints familiares para consultar solo la posición relativa de solicitudes vinculadas y responder una oferta; comprobar token, relación tutor-solicitud y estado de la oferta en servidor; añadir posición, vencimiento, instrucciones y botones aceptar/rechazar al panel familiar; impedir que la UI use un ID arbitrario como autorización.
- **Archivos/módulos:** backend/academic-service/Code.gs; backend/user-service/Code.gs; js/api.js; js/auth.js; js/student.js; student-dashboard.html.
- **Dependencias:** AUD-NG-001; TAREA-F5-012; aislamiento IDOR/relaciones familiares; TAREA-AD-03/AUD-NG-153 si aplica.
- **Criterios verificables:** token ausente/expirado denegado; tutor A no consulta solicitud de tutor B aunque cambie IDs; endpoint devuelve solo posición relativa y datos de la propia oferta; tutor autorizado puede aceptar/rechazar una oferta vigente; una oferta vencida o ajena no se puede responder; el portal distingue error de permiso de error de servidor.
- **Prioridad:** P0. **Estado:** Pendiente.

### F5-008-A05: notificaciones de oferta/liberación y trazabilidad íntegra
- **Hallazgos:** H7, H8, H11.
- **Severidad:** ALTO / P1.
- **Objetivo/acción:** conectar oferta, aceptación, rechazo, expiración, liberación y retiro al motor de notificaciones; deduplicar por evento/solicitud/vacante; registrar actorUserId verificado, rol, estado anterior/nuevo, fecha, motivo, VacanteID y correlationId; conservar historial append-only y no confirmar operación si la política de auditoría exige un registro durable ausente.
- **Archivos/módulos:** backend/academic-service/Code.gs; backend/user-service/Code.gs; ListaEsperaAdmision; LogsSistema/BitacoraTraceability; panel de notificaciones.
- **Dependencias:** TAREA-F5-011; AUD-NG-145; servicio sendMultiChannelNotification.
- **Criterios verificables:** familia recibe oferta individual con plazo/enlace; rechazo/expiración notifica liberación y el nuevo ofrecimiento; deduplicación evita correos repetidos; cada movimiento tiene actor y correlationId; historial anterior no se sobrescribe; fallos de envío quedan en cola/reintento sin perder la transacción.
- **Prioridad:** P1. **Estado:** Pendiente.

### F5-008-A06: vista administrativa global y filtros de lista de espera
- **Hallazgos:** H5, H10.
- **Severidad:** ALTO / P1.
- **Objetivo/acción:** crear vista de cola completa con filtros por año, grado, estado y disponibilidad real; mostrar orden, puntaje, fecha de postulación, vacante y vencimiento; habilitar ofrecer solo al primero elegible y reordenar solo mediante flujo autorizado.
- **Archivos/módulos:** dashboard-secretaria.html; js/secretary.js; backend/academic-service/Code.gs.
- **Dependencias:** F5-008-A01/A02; TAREA-F5-010.
- **Criterios verificables:** filtros server-side; datos consistentes con capacidad; la acción ofrecer se bloquea para entradas no elegibles/no primeras; la UI refleja estados y errores sin asumir éxito.
- **Prioridad:** P1. **Estado:** Pendiente.

### F5-008-A07: pruebas de regresión de prelación, cupos, familia y ciclo de vida
- **Hallazgos:** H1-H11.
- **Severidad:** ALTO / P1 (con casos P0 para seguridad/concurrencia).
- **Objetivo/acción:** cubrir endpoints y UI con pruebas positivas/negativas, autorización, manipulación de payload, carreras de último cupo, expiración, reintentos, fallos entre hojas, notificaciones, historial y XSS/IDOR.
- **Archivos/módulos:** tests/regression/academic-grading-suite.js; tests/regression/modular-dashboard-suite.js; backend/academic-service/Code.gs; backend/user-service/Code.gs; js/secretary.js; js/student.js.
- **Dependencias:** F5-008-A01 a A06; AUD-NG-161.
- **Criterios verificables:** tests reproducibles por criterio; carrera concurrente demuestra un único ganador; prueba tutor ajeno denegado; expiración y liberación llevan al siguiente; fallos inyectados no dejan estados parciales; notificación deduplicada; resultados con evidencia, no PASS incondicional.
- **Prioridad:** P1. **Estado:** Pendiente.

**Reconciliación de tareas existentes:** ampliar AUD-NG-001 (token), AUD-NG-179 (lock timeout en capacidad), AUD-NG-234/TASK-514 (skipLock, atomicidad/transiciones), AUD-NG-145 (actor/historial), AUD-NG-161 (pruebas), AUD-NG-233/TASK-513 (capacidad fail-closed). Coordinar TAREA-F5-010 (reservas/cupos), TAREA-F5-011 (notificaciones de oferta/liberación) y TAREA-F5-012 (portal familiar/IDOR/aceptación-rechazo). No crear IDs globales duplicados. F5-008-A01 a A07 son subtareas locales de este informe.

## 8. Pruebas, limitaciones y dictamen

**Ejecutado:** verificación de rama/HEAD/árbol; búsqueda de informe en árbol e historial; contraste de completadas.md y ChangesLogs; recuperación directa del blob Pendientes.md; inspección manual de esquema, permisos, sesión, endpoints, capacidad, notificaciones, portal familiar, UI administrativa y suites.

**No ejecutado:** Apps Script runtime; HTTP; Google Sheets productivo; navegador; pruebas con familias reales; concurrencia real; triggers; envío de correo; cola de reintentos; ejecución automatizada de suites. No se afirma haber validado esos comportamientos en runtime.

**Dictamen final: TAREA-F5-008 NO CUMPLE.** Existe una implementación parcial de tabla, endpoints y controles administrativos, pero no existe una cola ordenada por prelación real, reserva identificada y atómica, expiración automática, liberación/promoción del siguiente, acceso familiar aislado ni historial completo. Las marcas [x] históricas de aceptación no están respaldadas por el código auditado.

**Archivos documentales de esta iteración:** este informe, `AUDITORIAS/Auditoria.txt`, `AUDITORIAS/MapaDependencias.md`, `AUDITORIAS/AUDITORIA_COMPLETADAS_PLAN.md` y `AUDITORIAS/Contexto_personal.txt`.

**Archivos no modificados:** `backend/academic-service/Code.gs`; `backend/user-service/Code.gs`; `js/secretary.js`; `dashboard-secretaria.html`; `js/api.js`; `js/auth.js`; `js/student.js`; `student-dashboard.html`; suites de pruebas; `completadas.md`; `Pendientes.md`; `ChangesLogs.txt`; `METODOLOGIA_DESARROLLO.md`; rama base.

**Siguiente tarea:** TAREA-F5-009 - vinculación familiar y permisos granulares por tutor. Antes de auditarla, comprobar informe e historial Git en la rama actual.
