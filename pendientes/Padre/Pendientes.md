# Backlog consolidado — Padre

**Estado operativo del Plan Maestro (reinicio global):** todas las tareas de este backlog quedan en estado `Pendiente` al inicio de la ejecución. Ninguna tarea se considera `Completada`; marcas, etiquetas o declaraciones históricas de cierre son únicamente antecedentes y no acreditan estado vigente. Una tarea solo podrá cambiar de estado tras su implementación y verificación conforme al Plan Maestro.

**Fuentes integradas:** informes de auditoría de `AUDITORIAS/`, `Pendientes.md`, `completadas.md` y los archivos departamentales preexistentes. Los registros con el mismo identificador se reúnen en una sola tarea.

**Integridad:** se conservan los requisitos originales sin resumen ni paráfrasis. Se eliminan líneas exactamente repetidas tras normalizar espacios/capitalización. Los títulos alternativos se conservan como referencia. Las fuentes originales se mantienen sin alteración para trazabilidad.

---

<!-- ID: TASK-085 | Fuentes: Pendientes.md ; pendientes/Secretaria/Pendientes.md -->
### [ ] [TASK-085] [P0] Acceso Seguro y Temporal a Documentos Institucionales Sensibles
- **Orden de Ejecución:** 3
- **Prioridad:** P0 (Crítica)
- **Componentes Afectados:**
  - `backend/user-service/Code.gs` (`generateSecureDocumentAccessUrl`, `verifySecureDocumentAccessUrl`, `revokeDocumentAccessTokens`)
  - `backend/academic-service/Code.gs`
  - Hoja: `TokensAccesoDocumentos`
- **Subcapacidades Relacionadas:** F30-04.
- **Origen del Hallazgo:** `AUDITORIA_FASE_30_CONSOLIDACION_CERTIFICACION_MEJORA_CONTINUA.md` / Sección C (F30-04) y Sección F.
- **Problema Detectado y Riesgos:**
  Los documentos institucionales (boletas de calificaciones oficiales, recibos de pago con datos fiscales SAR, contratos laborales y expedientes confidenciales) almacenados en Google Drive corren riesgo de accesos no autorizados o enlaces públicos compartidos si no se centraliza la autorización mediante tokens criptográficos con tiempo de vida restringido.
- **Requisitos Funcionales y Técnicos Convergentes:**
  1. *Centralización de la autorización de descargas:*
     - Validar antes de entregar cualquier archivo: identidad autenticada, vigencia de sesión, roles RBAC/ABAC, relación legítima con el expediente (estudiante, tutor legal, docente asignado, directivo), estado del documento y alcance institucional.
  2. *Tokens firmados criptográficamente y enlaces efímeros:*
     - Generar URLs temporales con firma HMAC-SHA256 conteniendo: identificador del documento (`docId`), solicitante autenticado (`solicitanteUserId`), operación autorizada (`VIEW`, `DOWNLOAD`), fecha de emisión, fecha de expiración y nonce/JTI único para impedir reutilización no autorizada.
     - Tiempo de expiración configurable: valor inicial de 15 minutos, ajustable por parámetro institucional según el nivel de sensibilidad (`TIEMPO_EXPIRACION_ENLACES_MINUTOS`).
  3. *Blindaje de almacenamiento y privacidad:*
     - Prohibir terminantemente hacer públicos los archivos en Google Drive para facilitar su descarga.
     - No exponer identificadores internos, rutas de Drive ni credenciales de almacenamiento al cliente.
     - Validar que modificar parámetros en la URL (tampering de `docId`) deniegue inmediatamente la entrega.
  4. *Revocación activa y auditoría estricta:*
     - Invalidar tokens automáticamente ante: deshabilitación de cuenta, revocación de roles, baja del documento o detección de comportamiento anómalo.
     - Registrar intentos de descarga, accesos rechazados, expiraciones y revocaciones en bitácora, sanitizando tokens completos y datos sensibles.
- **Criterios de Aceptación:**
  - [ ] Un usuario no autorizado no puede descargar un documento sensible aunque conozca su identificador.
  - [ ] La manipulación del identificador en la URL es rechazada de forma inmediata por el servidor.
  - [ ] Un enlace expirado o revocado genera error de acceso denegado.
  - [ ] La revocación de permisos de un usuario impide nuevas descargas de forma instantánea.
  - [ ] Los archivos en Drive conservan sus permisos privados institucionales.
  - [ ] Los accesos y rechazos quedan registrados en auditoría sin filtrar información sensible o credenciales.
- **Estado:** [ ] Pendiente

<!-- Fuente: RECUPERACION/Pendientes_RECUPERADO.md, líneas 4221-4286; clave TASK-091; asignación única: Secretaria -->

---

<!-- ID: F11-TASK05 | Fuentes: AUDITORIAS/AUDITORIA-FASE-11-COMUNICACION-BIENESTAR-SUPERVISION-FINANZAS.md ; Pendientes.md ; pendientes/Secretaria/Pendientes.md -->
### [ ] [F11-TASK05] Unificar confirmaciones de lectura y autorizaciones familiares

**Otros títulos originales:**
- Desarrollar el motor de confirmaciones de lectura, respuestas y solicitudes de autorización
- **Hallazgo de origen:** sección 1.C.4; existen flujos de aprobación, pero falta un motor unificado de autorizaciones familiares y firma de consentimientos.
- **Severidad:** Alta. **Objetivo:** obtener y conservar consentimientos familiares verificables vinculados a cada trámite.
- **Acción ejecutable:** extender el flujo de aprobaciones para emitir solicitudes a tutores validados, registrar lectura, decisión, fecha, versión del consentimiento y evidencia de firma; permitir revocación/corrección conforme a reglas institucionales.
- **Archivos/módulos:** `backend/user-service/Code.gs`, `SolicitudesAutorizacion`, `ApprovalWorkflows`, `saveApprovalWorkflow`, `processWorkflowDecision`.
- **Dependencias/riesgos:** identidad y relación tutor-estudiante, notificaciones e integridad de evidencias; riesgo de aceptar consentimientos de personas no vinculadas.
- **Alcance:** autorizaciones familiares y confirmaciones asociadas; no sustituye firmas o requisitos legales externos no especificados en el informe.
- **Criterios de aceptación:** solo tutores autorizados pueden consentir; cada decisión queda asociada a trámite, versión, actor y marca temporal; la lectura no se confunde con aprobación; el historial es consultable y no se altera retroactivamente.
- **Prioridad:** P1. **Estado:** Pendiente.
- **Evidencia de cierre:** pendiente; el informe describe aprobación parcial y ausencia del motor unificado.
- **Origen del Hallazgo:** `AUDITORIA-FASE-11-COMUNICACION-BIENESTAR-SUPERVISION-FINANZAS.md` / Área I (P1)
- **Prioridad:** P1
- **Severidad/Clasificación:** Alta (Autorizaciones familiares)
- **Archivos Involucrados:**
  - `backend/user-service/Code.gs`
- **Dependencias Expuestas:** ConfirmacionesLectura, SolicitudesAutorizacion
- **Descripción del Alcance:**
  Gestionar el ciclo de vida de solicitudes de autorización para permisos/actividades (Pendiente, Leído, Aceptado, Rechazado, Vencido), vinculando las respuestas con el apoderado o tutor legal responsable.
- **Criterios de Aceptación:**
  - La autorización registra timestamp y usuario responsable, impidiendo modificaciones extemporáneas.
- **Estado:** Pendiente

<!-- Fuente: RECUPERACION/Pendientes_RECUPERADO.md, líneas 129-143; clave F11-Task06; asignación única: Secretaria -->

---

<!-- ID: TASK-157 | Fuentes: Pendientes.md ; pendientes/Contabilidad/Pendientes.md -->
### [ ] [TASK-157] Sistema de billetera familiar, anticipos y créditos a favor
- **Origen del Hallazgo:** `AUDITORIA_FASE_15_PAGOS_COBROS_FACTURACION.md` / Sección E (Brecha E.4) y Sección J (P1)
- **Prioridad:** P1
- **Severidad/Clasificación:** Alta (Experiencia de usuario, gestión de anticipos y trazabilidad familiar)
- **Archivos Involucrados:**
  - `backend/accounting-service/Code.gs`
  - `backend/user-service/Code.gs`
  - `BilleteraSaldoFavor`
  - `CreditoFamiliarMovimientos`
  - `CargosEstudiante`
  - `PagosAbonos`
  - `js/student.js`
- **Dependencias Expuestas:** `BilleteraSaldoFavor`, `CreditoFamiliarMovimientos`, `CargosEstudiante`, `PagosAbonos`, Portal Familiar
- **Descripción del Alcance:**
  Los excedentes de pagos, anticipos y créditos derivados de devoluciones no cuentan con un sistema de almacenamiento y aplicación estructurado.
  Requerimientos Funcionales Detallados:
  1. Crear la entidad y hoja `BilleteraSaldoFavor` con: `WalletID`, `FamilyID`, `UserIdResponsable`, `SaldoDisponible`, `SaldoReservado`, `Moneda`, `Estado`, `FechaCreacion`, `UltimaActualizacion`.
  2. Crear el libro de movimientos independiente `BilleteraMovimientos` con: `MovimientoID`, `WalletID`, `TipoMovimiento` (`Credito`, `Debito`, `Reserva`, `Reverso`), `Monto`, `SaldoAnterior`, `SaldoNuevo`, `PagoOrigenID`, `CargoDestinoID`, `ReembolsoID`, `Fecha`, `UsuarioResponsable`, `Observaciones`.
  3. Implementar las funciones: `creditFamilyWallet`, `getFamilyWalletBalance`, `getFamilyWalletStatement`, `applyWalletBalanceToCharges`, y `reverseWalletMovement`.
  4. Permitir generar saldo a favor mediante: Sobrepagos, pagos anticipados, devoluciones convertidas en crédito, reasignaciones autorizadas y ajustes administrativos justificados.
  5. Permitir aplicar el crédito: A un hijo específico, a varios hijos de la misma familia, a mensualidades futuras, a cargos extraordinarios o a obligaciones seleccionadas manualmente.
  6. Incorporar preferencias parametrizables para aplicación automática: Aplicar primero a cargos vencidos; aplicar primero a la mensualidad más antigua; aplicar a todos los hijos o al beneficiario seleccionado; exigir autorización antes de utilizar créditos en determinados conceptos.
  7. Mantener un historial completo de aplicaciones y reversos inmutable.
  8. Mostrar el saldo disponible en el portal familiar (`student.js`), diferenciándolo visualmente de los saldos pendientes.
- **Criterios de Aceptación:**
  - Un sobrepago genera crédito en la billetera por el excedente exacto.
  - El saldo disponible de la billetera nunca puede ser negativo.
  - Una aplicación reduce simultáneamente el crédito disponible y la deuda del cargo correspondiente.
  - No se puede consumir dos veces el mismo crédito (protección de concurrencia).
  - Se pueden aplicar fondos a diferentes hijos de la misma familia con autorización válida.
  - Una reversión restituye el saldo original de la billetera.
  - El estado de cuenta familiar refleja con transparencia los movimientos y saldo actual de la billetera.
- **Estado:** [ ] Pendiente

<!-- Fuente: RECUPERACION/Pendientes_RECUPERADO.md, líneas 6722-6759; clave TASK-158; asignación única: Contabilidad -->

---

<!-- ID: TASK-158 | Fuentes: Pendientes.md ; pendientes/Contabilidad/Pendientes.md -->
### [ ] [TASK-158] Liquidación atómica y distribución inteligente de pagos conjuntos multihijo
- **Origen del Hallazgo:** `AUDITORIA_FASE_15_PAGOS_COBROS_FACTURACION.md` / Sección E (Brecha E.5) y Sección J (P1)
- **Prioridad:** P1
- **Severidad/Clasificación:** Alta (Integridad de saldos entre hermanos y recaudación unificada)
- **Archivos Involucrados:**
  - `backend/user-service/Code.gs`
  - `backend/accounting-service/Code.gs`
  - `DistribucionPagosConjuntos`
  - `PagosAbonos`
  - `CargosEstudiante`
  - `MovimientosCajaBancos`
  - `js/student.js`
  - `js/accounting.js`
- **Dependencias Expuestas:** `DistribucionPagosConjuntos`, `PagosAbonos`, `CargosEstudiante`, `ComprobantesPago`, `MovimientosCajaBancos`
- **Descripción del Alcance:**
  El backend permite registrar distribuciones familiares mediante `submitJointFamilyPayment`, pero falta completar el proceso de aprobación y liquidación de todas las obligaciones involucradas como una operación financiera atómica y consistente.
  Requerimientos Funcionales Detallados:
  1. Completar la integración bidireccional entre `submitJointFamilyPayment` y `reviewPaymentVoucher`.
  2. Permitir registrar un único pago familiar que cubra: varios hijos, varios cargos de un mismo hijo, mensualidades de diferentes períodos, cargos extraordinarios y diferentes conceptos de cobro.
  3. Crear una vista de distribución que muestre importe total recibido, asignación por hijo, cargos seleccionados, saldos anteriores, importe aplicado, saldos restantes y excedentes.
  4. Incorporar distribución automática con criterios configurables: primero obligaciones vencidas, cargos más antiguos, prioridad por estudiante o distribución proporcional.
  5. Permitir distribución manual y modificación por el contador previa a la aprobación.
  6. Ejecutar la aprobación de manera atómica: validar distribuciones, verificar estado pendiente de cargos, confirmar coincidencia de importes (+/- 0.01), registrar abonos individuales en `PagosAbonos`, actualizar estado de cargos en `CargosEstudiante`, asentar el movimiento único en `MovimientosCajaBancos` y marcar comprobante como `Aprobado`.
  7. Resiliencia y compensación: si falla alguna operación en una hoja, aplicar compensación idempotente para no dejar pagos a medias.
  8. Permitir transferir excedentes no asignados a la billetera familiar (`BilleteraSaldoFavor`).
  9. Asignar identificador único global de la operación familiar (`PAGO-FAM-...`).
- **Criterios de Aceptación:**
  - Un comprobante familiar puede liquidar cargos de tres o más hijos en una sola acción.
  - Cada abono generado queda vinculado al estudiante y cargo correspondiente en `PagosAbonos`.
  - La suma de los abonos coincide exactamente con el importe distribuido.
  - No se puede aprobar dos veces el mismo comprobante conjunto.
  - Un fallo durante el proceso no deja pagos contabilizados parcialmente.
  - El libro de caja registra una única recepción de dinero por el importe total.
  - La distribución puede consultarse y auditarse en el portal familiar y en el panel contable.
- **Estado:** [ ] Pendiente

<!-- Fuente: RECUPERACION/Pendientes_RECUPERADO.md, líneas 6760-6794; clave TASK-159; asignación única: Contabilidad -->

---

<!-- ID: TASK-163 | Fuentes: Pendientes.md ; pendientes/Contabilidad/Pendientes.md -->
### [ ] [TASK-163] Automatización de notificaciones de cargos, vencimientos, pagos y obligaciones familiares
- **Origen del Hallazgo:** `AUDITORIA_FASE_15_PAGOS_COBROS_FACTURACION.md` / Sección B (B.9) y Sección J (P1)
- **Prioridad:** P1
- **Severidad/Clasificación:** Alta (Comunicación institucional familiar y reducción de morosidad)
- **Archivos Involucrados:**
  - `backend/accounting-service/Code.gs`
  - `backend/user-service/Code.gs`
  - `BandejaNotificaciones`
  - `js/student.js`
  - `dashboard-contabilidad.html`
- **Dependencias Expuestas:** `sendMultiChannelNotification`, `BandejaNotificaciones`, `RelacionesFamiliares`, `permisoFinanciero`
- **Descripción del Alcance:**
  No todos los eventos financieros generan comunicaciones automáticas. En particular, la creación de nuevos cargos y vencimientos próximos no están conectados completamente con avisos multicanal a las familias.
  Requerimientos Funcionales Detallados:
  1. Notificaciones automáticas para eventos financieros clave: generación de mensualidad, cargo extraordinario, aviso preventivo de vencimiento, vencimiento acaecido, inicio de mora, recargo aplicado, recepción de comprobante, aprobación de pago, rechazo con motivo, recibo CUV disponible, factura fiscal emitida, acreditación a billetera y reembolsos.
  2. Recordatorios preventivos configurables: disparar avisos automáticos a los 5, 3 y 1 día antes de la fecha límite de pago.
  3. Enrutamiento por permisos: validar `permisoFinanciero` en `RelacionesFamiliares` para que solo los responsables autorizados reciban información financiera de sus hijos.
  4. Canales de comunicación: bandeja interna, correo electrónico y notificaciones push/PWA.
  5. Plantillas y contenido: nombre del estudiante, concepto, período, importe, fecha de vencimiento, saldo pendiente, enlace autenticado y pasos para reportar pago.
  6. Deduplicación y resiliencia: registrar clave de deduplicación (`deduplicationKey`), reintentos seguros y garantía de que una falla en el servidor de correo nunca revierta la transacción financiera.
  7. Preferencias familiares: permitir al tutor definir canales preferidos y consultar el buzón histórico.
- **Criterios de Aceptación:**
  - La generación de una mensualidad genera la notificación al tutor legal con permiso financiero.
  - Los recordatorios preventivos se despachan conforme al cronograma configurado.
  - Un apoderado sin permiso financiero no recibe alertas con montos de saldos.
  - La aprobación o rechazo de un comprobante notifica de inmediato al tutor.
  - Un error temporal de correo no afecta la persistencia del pago registrado en el backend.
  - Los reintentos de notificación no producen mensajes duplicados a la familia.
- **Estado:** [ ] Pendiente

<!-- Fuente: RECUPERACION/Pendientes_RECUPERADO.md, líneas 6926-6958; clave TASK-164; asignación única: Contabilidad -->

---

<!-- ID: TASK-168 | Fuentes: Pendientes.md ; pendientes/Contabilidad/Pendientes.md -->
### [ ] [TASK-168] Reasignación administrativa de pagos y corrección de distribuciones
- **Origen del Hallazgo:** `AUDITORIA_FASE_15_PAGOS_COBROS_FACTURACION.md` / Sección B (B.5) y Sección J (P1)
- **Prioridad:** P1
- **Severidad/Clasificación:** Alta (Flexibilidad operativa y resolución de pagos mal aplicados)
- **Archivos Involucrados:**
  - `backend/accounting-service/Code.gs`
  - `PagosAbonos`
  - `CargosEstudiante`
  - `DistribucionPagosConjuntos`
  - `BilleteraSaldoFavor`
- **Dependencias Expuestas:** `reassignPaymentAllocation`, `PagosAbonos`, `CargosEstudiante`
- **Descripción del Alcance:**
  El sistema permite registrar pagos, pero no dispone de un procedimiento administrativo controlado para reasignar abonos aplicados al cargo o al estudiante equivocado.
  Requerimientos Funcionales Detallados:
  1. Implementar la función `reassignPaymentAllocation` en `backend/accounting-service/Code.gs`.
  2. Permitir seleccionar: pago original, cargo de origen, cargo de destino, monto a reasignar, justificación obligatoria y usuario autorizador.
  3. Validaciones de seguridad: verificar que el abono exista y esté aplicado; comprobar que el monto no exceda el disponible; validar que el cargo destino exista y pertenezca al mismo estudiante o a un hermano con relación familiar autorizada.
  4. Reversión y reasignación limpia: actualizar el cargo de origen (restituyendo el saldo pendiente) y aplicar al cargo destino sin duplicar el movimiento de ingreso de efectivo en el libro de caja ni alterar el recibo global.
  5. Posibilidad de transferir saldos no reasignados directamente a la billetera familiar.
  6. Auditoría inmutable de la reasignación con registro de diffs contables.
- **Criterios de Aceptación:**
  - Una reasignación de pago no duplica los ingresos en caja ni en reportes contables.
  - El cargo de origen recupera exactamente su saldo pendiente no cubierto.
  - El cargo de destino recibe el abono correspondiente actualizando su estado a `Parcial` o `Pagado`.
  - Se rechaza cualquier intento de reasignar más dinero del efectivamente liquidado en el pago.
  - La operación queda registrada con trazabilidad completa de origen y destino.
- **Estado:** [ ] Pendiente

<!-- Fuente: RECUPERACION/Pendientes_RECUPERADO.md, líneas 7276-7313; clave TASK-174; asignación única: Contabilidad -->

---

<!-- ID: TASK-194 | Fuentes: Pendientes.md ; pendientes/Docente/Pendientes.md -->
### [ ] [TASK-194] Notificaciones multicanal de vencimientos y disponibilidad de reservas
- **Origen del Hallazgo:** `AUDITORIA_FASE_20_BIBLIOTECA_RECURSOS_EDUCATIVOS.md` / Sección E, Sección C (2.6, 2.10) y Plan de Trabajo P1
- **Prioridad:** P1
- **Severidad/Clasificación:** Alta (Reducción de morosidad en biblioteca, aviso oportuno de reservas disponibles y comunicación familiar)
- **Archivos Involucrados:**
  - `backend/accounting-service/Code.gs` (nueva función `checkAndDispatchLibraryAlerts`)
  - `backend/user-service/Code.gs` (`sendMultiChannelNotification`)
  - `BibliotecaPrestamos`
  - `BibliotecaReservas`
- **Dependencias Expuestas:** `sendMultiChannelNotification`, `BibliotecaPrestamos`, `BibliotecaReservas`
- **Descripción del Alcance:**
  No se emiten recordatorios previos al vencimiento de un préstamo bibliotecario ni se notifica automáticamente a un estudiante cuando el libro que reservó ha sido devuelto y está listo para ser retirado en el mostrador.
  Requerimientos Funcionales Detallados:
  1. Recordatorios preventivos de devolución:
     - Evaluación diaria de préstamos próximos a vencer: despachar aviso institucional 24 horas antes de la fecha límite de entrega.
     - Aviso de mora al día siguiente del vencimiento con instrucciones para la devolución inmediata.
  2. Notificación de reserva disponible:
     - Al procesar la devolución de un ejemplar que posee reservas pendientes en `BibliotecaReservas`, asignar el ejemplar a la primera reserva en cola y enviar notificación inmediata al estudiante beneficiario indicando el plazo límite para retirarlo (ej. 48 horas).
     - Si expira el plazo sin que el alumno retire el libro, liberar la reserva y notificar al siguiente en la lista de espera.
- **Criterios de Aceptación:**
  - El sistema envía notificación previa antes de que venza el plazo de entrega del libro.
  - Al devolver un libro reservado, el solicitante en lista de espera recibe el aviso de disponibilidad.
  - Las alertas utilizan claves de deduplicación diaria para evitar mensajes repetitivos.
- **Estado:** [ ] Pendiente

<!-- Fuente: RECUPERACION/Pendientes_RECUPERADO.md, líneas 8031-8055; clave TASK-195; asignación única: Docente -->

---

<!-- ID: TASK-197 | Fuentes: Pendientes.md ; pendientes/Secretaria/Pendientes.md -->
### [ ] [TASK-197] Portal administrativo, operativo y familiar de transporte escolar
- **Origen del Hallazgo:** `AUDITORIA_FASE_21_TRANSPORTE_SERVICIOS_COMPLEMENTARIOS.md` / Sección E (PT-21-28), Sección C (1.18) y Plan de Implementación TAREA 09
- **Prioridad:** P1
- **Severidad/Clasificación:** Alta (Interfaces adaptadas por perfil, usabilidad móvil para choferes y experiencia familiar)
- **Archivos Involucrados:**
  - `dashboard-contabilidad.html`
  - `dashboard-director.html`
  - `dashboard-padres.html`
  - `js/accounting.js`
  - `js/portal-padres.js`
- **Dependencias Expuestas:** `getTransportRoutes`, `getTransportAssignments`, `F21-Task01`, `F21-Task02`, `F21-Task05`
- **Descripción del Alcance:**
  El transporte escolar carece de interfaces visuales dedicadas en los dashboards escolares.
  Requerimientos Funcionales Detallados:
  1. Panel administrativo: gestión de flota, personal, rutas, paradas, cupos, incidencias y reportes.
  2. Vista móvil para conductor y acompañante: diseño táctil ligero con lista de paradas del viaje, estudiantes a recoger/entregar, botones rápidos de abordaje/descenso y botón de reporte de incidencias.
  3. Portal familiar: consulta para cada hijo de su ruta, parada, horario previsto, chofer/unidad asignada, estado del viaje y notificaciones.
- **Criterios de Aceptación:**
  - Cada rol accede únicamente a las pantallas y controles autorizados.
  - La interfaz móvil de conductores es ágil y utilizable en campo.
  - Las familias consultan exclusivamente la información de sus propios hijos sin fugas de datos.
- **Estado:** [ ] Pendiente

<!-- Fuente: RECUPERACION/Pendientes_RECUPERADO.md, líneas 8143-8171; clave TASK-199; asignación única: Secretaria -->

---

<!-- ID: TASK-203 | Fuentes: Pendientes.md ; pendientes/Docente/Pendientes.md -->
### [ ] [TASK-203] Control de asistencia y participación en servicios complementarios
- **Origen del Hallazgo:** `AUDITORIA_FASE_21_TRANSPORTE_SERVICIOS_COMPLEMENTARIOS.md` / Sección E (PT-21-42), Sección C (1.17) y Plan de Implementación TAREA 15
- **Prioridad:** P1
- **Severidad/Clasificación:** Alta (Asistencia a actividades extracurriculares, talleres, clubes y raciones de cafetería)
- **Archivos Involucrados:**
  - `backend/academic-service/Code.gs` (nueva función `recordActivityAttendance`)
  - Hoja `ServiciosAsistencia`
  - `ActividadesExtracurriculares`
- **Dependencias Expuestas:** `ActividadesExtracurriculares`, `F21-Task15`
- **Descripción del Alcance:**
  Las actividades extracurriculares carecen de un mecanismo interactivo para que los monitores o docentes pasen lista por sesión y los padres consulten la asistencia.
  Requerimientos Funcionales Detallados:
  1. Registro de asistencia por sesión:
     - Identificar alumnos inscritos en la actividad.
     - Registrar: presente, ausente, tardanza, ausencia justificada y retiro anticipado con fecha, hora y responsable.
     - Evitar asistencias duplicadas y permitir consulta de historial individual desde el portal de padres.
- **Criterios de Aceptación:**
  - Los encargados de club o taller registran asistencia por sesión.
  - Solo se pueden registrar estudiantes formalmente inscritos.
  - Los padres pueden consultar el récord de asistencia de sus hijos.
- **Estado:** [ ] Pendiente

<!-- Fuente: RECUPERACION/Pendientes_RECUPERADO.md, líneas 8451-8476; clave TASK-211; asignación única: Docente -->

---

<!-- ID: TASK-210 | Fuentes: Pendientes.md ; pendientes/Contabilidad/Pendientes.md -->
### [ ] [TASK-210] Consolidación de cafetería y tienda con estados de cuenta familiares
- **Origen del Hallazgo:** `AUDITORIA_FASE_21_TRANSPORTE_SERVICIOS_COMPLEMENTARIOS.md` / Sección E, Sección C (1.14) y Plan de Implementación TAREA 30
- **Prioridad:** P1
- **Severidad/Clasificación:** Alta (Consolidación financiera, prevención de doble cobro y conciliación de consumos)
- **Archivos Involucrados:**
  - `backend/accounting-service/Code.gs` (`processFamilyCreditPurchase`, `createCafeteriaOrder`, `createStoreOrder`)
  - `CafeteriaPedidos`
  - `TiendaOrdenes`
  - `CargosEstudiante`
- **Dependencias Expuestas:** `CafeteriaPedidos`, `TiendaOrdenes`, `CargosEstudiante`, `F15-Task01`
- **Descripción del Alcance:**
  La cafetería, tienda y crédito familiar operan correctamente pero falta consolidar sus consumos con la facturación institucional para evitar discrepancias o dobles cobros.
  Requerimientos Funcionales Detallados:
  1. Consolidación financiera de consumos:
     - Conservar las reglas de crédito familiar autorizadas por PIN de tutores.
     - Vincular cada consumo con el estudiante y responsable financiero.
     - Consolidar los cargos en el estado de cuenta escolar impidiendo que una compra ya deducida del crédito familiar vuelva a generar un cargo manual en colegiatura.
     - Gestionar anulaciones y devoluciones con reversión del saldo de crédito familiar.
- **Criterios de Aceptación:**
  - Toda compra autorizada se asienta una sola vez en el estado de cuenta o crédito familiar.
  - Se impiden cobros duplicados por el mismo consumo.
  - Los reportes de ventas coinciden exactamente con los movimientos registrados.
- **Requisitos de autorización y experiencia (decisión de producto C1.725):**
  - Mantener autenticación de credenciales al iniciar sesión y sesión persistente en el dispositivo; no exigir reingreso por consultas, transacciones ni actualizaciones ordinarias.
  - Definir un máximo configurable de sesiones/dispositivos activos por usuario y una política clara al alcanzar el límite.
  - Evitar verificaciones costosas o redundantes por acción; reutilizar el contexto de sesión validado y conservar controles esenciales de servidor ligeros, sin reautenticación visible por operación.
  - Incorporar PIN familiar separado para que un padre/madre/tutor autorizado apruebe el uso o autorización del crédito. El alumno no puede autoaprobar su propio crédito. No confundir este PIN con la autenticación de inicio de sesión.
  - El PIN no se almacena en texto claro. Aún debe definirse si la aprobación se realiza por compra o al autorizar un cupo, y el procedimiento de recuperación/cambio.
- **Auditoría de preparación C1.723:** los callsites actuales no implementan validación PIN, ownership del responsable, idempotencia financiera persistente ni reversión coordinada de crédito. Sin cambios de código en C1.723/C1.725.
- **Configuración de aprobación familiar (decisión C1.726):** desde Configuración → Opciones del Rol del panel del padre/tutor se podrá seleccionar la modalidad `POR_COMPRA` (cada pedido requiere aprobación explícita del tutor mediante PIN antes de aplicar el débito) o `POR_CUPO` (el tutor usa el PIN al autorizar/activar el cupo; las compras posteriores se permiten dentro de los límites aprobados sin solicitar el PIN en cada compra). La preferencia se guarda y aplica en servidor, asociada al tutor; no se confía en valores enviados por el estudiante ni en almacenamiento local del navegador. Si falta una configuración válida o la autorización no puede verificarse, el débito se deniega. El alumno nunca puede aprobar su propio consumo ni modificar la política del tutor.
- **PIN:** permanece separado de la sesión de inicio; nunca se almacena en texto claro. El procedimiento exacto de alta, cambio y recuperación del PIN se definirá dentro de la implementación segura sin habilitar vías de autoaprobación.
- **Implementación parcial C1.727:** modalidad POR_COMPRA/POR_CUPO persistida por tutor autenticado desde Opciones del Rol; validación server-side de rol y relación familiar; autorización de cupo limitada al tutor vinculado; lectura de autorizaciones aislada por tutor/estudiante; límites positivos y escritura serializada. Mientras el flujo PIN no esté implementado y verificado, los tres puntos de entrada de débito por crédito familiar rechazan la operación (fail-closed). No se marca completada la tarea.

- **Estado:** [ ] Pendiente; modalidad configurable definida, implementación financiera y de PIN pendiente.


<!-- Fuente: RECUPERACION/Pendientes_RECUPERADO.md, líneas 9572-9642; clave TASK-245; asignación única: Contabilidad -->

---

<!-- ID: TASK-211 | Fuentes: Pendientes.md ; pendientes/Docente/Pendientes.md -->
### [ ] [TASK-211] Ampliación del sistema de actividades extracurriculares y sus servicios asociados
- **Origen del Hallazgo:** `AUDITORIA_FASE_21_TRANSPORTE_SERVICIOS_COMPLEMENTARIOS.md` / Sección E, Sección C (1.14) y Plan de Implementación TAREA 31
- **Prioridad:** P1
- **Severidad/Clasificación:** Alta (Gestión integral de clubes, deportes, tutorías, cupos y cobros asociados)
- **Archivos Involucrados:**
  - `backend/academic-service/Code.gs` (`saveExtracurricularActivity`, `getExtracurricularActivities`)
  - `backend/accounting-service/Code.gs`
  - `ActividadesExtracurriculares`
  - `ServiciosInscripciones`
- **Dependencias Expuestas:** `ActividadesExtracurriculares`, `ServiciosInscripciones`, `CargosEstudiante`
- **Descripción del Alcance:**
  Las actividades extracurriculares registran metadatos pero carecen de gestión de inscripciones formales, cupos, listas de espera y vinculación con cobros de mensualidad.
  Requerimientos Funcionales Detallados:
  1. Ciclo completo de actividades extracurriculares:
     - Configurar sesiones, horarios, docentes responsables, cupos máximos y tarifas de inscripción.
     - Gestionar inscripciones desde el portal familiar con autorización de los padres.
     - Vincular con `CargosEstudiante` para generar el cargo por membresía de taller o club deportivo.
     - Permitir asociar actividades con transporte extraordinario para partidos o presentaciones fuera de sede.
- **Criterios de Aceptación:**
  - Las actividades controlan cupos máximos de inscripción.
  - Las inscripciones pagadas generan el cargo en el estado de cuenta del estudiante.
  - Los padres pueden consultar y gestionar las actividades de sus hijos.
- **Estado:** [ ] Pendiente

<!-- Fuente: RECUPERACION/Pendientes_RECUPERADO.md, líneas 8633-8681; clave TASK-216; asignación única: Docente -->

---

<!-- ID: TASK-346 | Fuentes: Pendientes.md ; pendientes/Secretaria/Pendientes.md -->
### [ ] [TASK-346] [P1] Implementar revisión automática de permisos obsoletos y accesos residuales (F40-14)
- **Prioridad:** P1 (Alta / Importante)
- **Orden de Ejecución:** 16 (Gobernanza de identidades y depuración de accesos)
- **Componentes Afectados:**
  - `backend/user-service/Code.gs` (`auditObsoletePermissions`, `revokeResidualAccess`)
  - `backend/academic-service/Code.gs`
  - Hoja de Cálculo: `AuditoriaPermisosResiduales`
- **Subcapacidades Relacionadas:** F40-18.
- **Origen del Hallazgo:** `AUDITORIA_FASE_40_SEGURIDAD_DOCUMENTAL_TRAZABILIDAD_Y_CONSERVACION.md` / Secciones C (F40-18) y Especificación Técnica ChatGPT/Jules.
- **Problema Detectado y Riesgos:**
  No se detectan permisos que deberían revocarse cuando un usuario cambia de departamento, finaliza contrato laboral, egresa un alumno o concluye una delegación temporal, dejando accesos residuales activos indefinidamente.
- **Requerimientos Funcionales y Técnicos Convergentes:**
  1. *Detección de eventos institucionales de desvinculación:*
     - Relacionar permisos con eventos: Desvinculación laboral, Cambio de departamento, Cambio de rol, Fin de contrato, Egreso de estudiante, Cambio de tutor legal, Vencimiento de autorización temporal.
     - Identificar permisos directos, heredados y excepcionales en Drive y en la aplicación.
     - Generar alertas cuando cambie una relación institucional y persistan accesos incompatibles.
  2. *Flujo de revocación controlada:*
     - Revocación automática únicamente en permisos cuya política lo autorice expresamente.
     - En casos ambiguos, generar tarea de revisión para la autoridad responsable.
     - Preservar intactos los registros históricos de auditoría y autoría de documentos del usuario desvinculado.
- **Criterios de Aceptación:**
  - [ ] Desvincular un empleado identifica y lista todos sus permisos documentales asociados.
  - [ ] Cambios de rol recalculan y restringen accesos que ya no correspondan a sus nuevas funciones.
  - [ ] Permisos temporales finalizados dejan de dar acceso automáticamente.
  - [ ] La revocación de accesos no altera la trazabilidad histórica ni elimina documentos creados por el usuario.
- **Dependencias:** F40-Task01, F40-Task03.
- **Estado:** [ ] Pendiente

<!-- Fuente: RECUPERACION/Pendientes_RECUPERADO.md, líneas 12751-12780; clave TASK-348; asignación única: Secretaria -->

---

<!-- ID: TASK-392 | Fuentes: Pendientes.md ; pendientes/Dirección/Pendientes.md -->
### [ ] [TASK-392] Configuración centralizada de servicios complementarios institucionales
- **Origen del Hallazgo:** `AUDITORIA_FASE_21_TRANSPORTE_SERVICIOS_COMPLEMENTARIOS.md` / Sección C (1.14) y Plan de Implementación TAREA 32
- **Prioridad:** P2
- **Severidad/Clasificación:** Media (Arquitectura reutilizable de servicios escolares, parametrización y escalabilidad)
- **Archivos Involucrados:**
  - `backend/accounting-service/Code.gs`
  - Hoja `ServiciosCatalogoInstitucional`
- **Dependencias Expuestas:** `CafeteriaMenu`, `TiendaProductos`, `ActividadesExtracurriculares`
- **Descripción del Alcance:**
  Los servicios escolares se crearon como funciones aisladas, dificultando la incorporación de nuevas ofertas (tutorías, club de robótica, seguro médico opcional) sin reescribir código.
  Requerimientos Funcionales Detallados:
  1. Catálogo maestro de servicios complementarios:
     - Configurar servicios con categoría, modalidad (recurrente, por consumo, por evento), cupos, responsables, tarifas y reglas de autorización familiar.
     - Permitir habilitar o pausar servicios por período lectivo conservando la información histórica.
- **Criterios de Aceptación:**
  - Se pueden parametrizar nuevos servicios complementarios desde la plataforma.
  - Los servicios existentes continúan funcionando con plena compatibilidad.
- **Estado:** [ ] Pendiente

<!-- Fuente: RECUPERACION/Pendientes_RECUPERADO.md, líneas 14173-14205; clave TASK-396; asignación única: Dirección -->
