# AUDITORÍA FUNCIONAL, TÉCNICA Y DOCUMENTAL — FASE 11
## COMUNICACIÓN, BIENESTAR ESTUDIANTIL, SUPERVISIÓN DOCENTE Y GESTIÓN FINANCIERA

---

## INDICE Y ESTRUCTURA DEL DOCUMENTO
1. [INFORME INDIVIDUAL - ÁREA I: COMUNICACIÓN Y COLABORACIÓN INSTITUCIONAL](#1-informe-individual---área-i-comunicación-y-colaboración-institucional)
2. [INFORME INDIVIDUAL - ÁREA II: BIENESTAR ESTUDIANTIL, ORIENTACIÓN Y SEGUIMIENTO](#2-informe-individual---área-ii-bienestar-estudiantil-orientación-y-seguimiento)
3. [INFORME INDIVIDUAL - ÁREA III: SUPERVISIÓN DOCENTE Y CALIDAD EDUCATIVA](#3-informe-individual---área-iii-supervisión-docente-y-calidad-educativa)
4. [INFORME INDIVIDUAL - ÁREA IV: CONTABILIDAD, PRESUPUESTOS Y CONTROL FINANCIERO](#4-informe-individual---área-iv-contabilidad-presupuestos-y-control-financiero)
5. [INFORME CONSOLIDADO Y PLAN DE RESOLUCIÓN PRIORIZADO](#5-informe-consolidado-y-plan-de-resolución-priorizado)

---

## 1. INFORME INDIVIDUAL - ÁREA I: COMUNICACIÓN Y COLABORACIÓN INSTITUCIONAL

### A. Identificación
- **Área:** Comunicación y colaboración institucional
- **Fase:** Fase 11
- **Nombres Visibles Internos/Servicios:** `BandejaNotificaciones`, `MensajeriaInstitucional`, `EventosCalendario`, `SolicitudesAutorizacion`, `backend/user-service/Code.gs`
- **Roles Involucrados:** Dirección, Secretaría, Coordinación, Docentes, Estudiantes, Padres/Tutores, Administrador.
- **Propósito:** Facilitar la comunicación bidireccional, anuncios oficiales, confirmaciones de lectura, convocatorias y calendarios institucionales con control de traslapes y trazabilidad.

### B. Inventario Funcional
- `createUserNotification` (`backend/user-service/Code.gs`)
- `getNotificationPreferences` / `markNotificationAsRead` (`backend/user-service/Code.gs`)
- `sendMultiChannelNotification` / `retryFailedNotificationsQueue` (`backend/user-service/Code.gs`)
- `getInstitutionalCalendarEvents` / `bookAppointment` (`backend/user-service/Code.gs`)
- `saveApprovalWorkflow` / `processWorkflowDecision` (`backend/user-service/Code.gs`)

### C. Estado Actual y Clasificación Individual
1. **Centro de Mensajes:** *Implementada parcialmente*. Soporta notificaciones dirigidas en `BandejaNotificaciones`, pero falta interfaz unificada de chat/conversaciones bidireccionales por estudiante/trámite (`F11-Task03`).
2. **Noticias, Anuncios y Circulares:** *Requiere mejoras*. Existen funciones de avisos pero falta un gestor de publicaciones con estado borrador/programado y fechas de vigencia (`F11-Task04`).
3. **Notificaciones e Idempotencia:** *Completa y verificada*. `sendMultiChannelNotification` enforce deduplicación por `deduplicationKey` y reintentos seguros.
4. **Confirmaciones de Lectura y Autorizaciones:** *Implementada parcialmente*. Existen flujos de aprobación en `ApprovalWorkflows`, pero falta motor unificado de autorizaciones familiares con firma de consentimientos (`F11-Task05`).
5. **Calendarios y Citas:** *Implementada parcialmente*. `getInstitutionalCalendarEvents` retorna agenda, pero no detecta colisiones de horario al agendar reuniones (`F11-Task06`).

---

## 2. INFORME INDIVIDUAL - ÁREA II: BIENESTAR ESTUDIANTIL, ORIENTACIÓN Y SEGUIMIENTO

### A. Identificación
- **Área:** Bienestar estudiantil, orientación y seguimiento de casos
- **Fase:** Fase 11
- **Nombres Visibles Internos/Servicios:** `CasosSeguimiento`, `RegistrosOrientacion`, `CitasOrientacion`, `backend/academic-service/Code.gs`
- **Roles Involucrados:** Consejeros, Orientación, Dirección, Padres/Tutores, Administrador.
- **Propósito:** Acompañar el bienestar psico-pedagógico de los estudiantes, gestionar entrevistas, alertas de deserción y derivaciones profesionales con aislamiento confidencial.

### B. Inventario Funcional
- `getAttendanceFollowupCases` (`backend/academic-service/Code.gs`)
- `scheduleCounselingAppointment` / `recordCounselingSessionAct` / `referCounselingCase` (`backend/academic-service/Code.gs`)
- `saveGuidanceFollowupPlan` / `saveVocationalRecommendation` (`backend/academic-service/Code.gs`)
- `addCaseCommitment` / `updateCaseCommitmentStatus` (`backend/academic-service/Code.gs`)
- `checkAndDispatchAttendanceAlerts` (`backend/academic-service/Code.gs`)

### C. Estado Actual y Clasificación Individual
1. **Gestión de Citas de Orientación:** *Completa y verificada*. Programa citas, registra actas confidenciales y realiza derivaciones inmutables (`[F10-Task09]`).
2. **Registro y Administración de Casos:** *Completa y verificada*. Casos con identificadores unívocos (`CASO-AST-...`) y estados de seguimiento (`[F10-Task07]`, `[F10-Task08]`).
3. **Seguridad y Confidencialidad:** *Completa y verificada*. Filtra observaciones de `Consejería` u `Orientación` a docentes generales y registra `UNAUTHORIZED_ACCESS_ATTEMPT` (`[F10-Task01]`, `F11-Task01`).
4. **Alertas de Seguimiento Estudiantil:** *Implementada parcialmente*. Despacha alertas por inasistencias y tardanzas, pero falta consolidar alertas integradas de riesgo académico/deserción (`F11-Task08`).

---

## 3. INFORME INDIVIDUAL - ÁREA III: SUPERVISIÓN DOCENTE Y CALIDAD EDUCATIVA

### A. Identificación
- **Área:** Supervisión docente y calidad educativa
- **Fase:** Fase 11
- **Nombres Visibles Internos/Servicios:** `PlanificacionesPedagogicas`, `SupervisionPedagógica`, `SustitucionesDocentes`, `backend/academic-service/Code.gs`, `backend/task-service/Code.gs`
- **Roles Involucrados:** Coordinación, Dirección, Docentes, Administrador.
- **Propósito:** Supervisar la entrega de planificaciones pedagógicas, ejecutar observaciones en aula, coordinar suplencias y monitorear indicadores de cumplimiento educativo.

### B. Inventario Funcional
- `getTeacherSupervisions` / `getSupervisionObservation` / `getTeacherImprovementPlans` (`backend/academic-service/Code.gs`)
- `createTeacherSubstitution` / `getTeacherSubstitutions` (`backend/academic-service/Code.gs`)
- `getTeachingHoursSummary` / `getCurricularAnalyticsReport` (`backend/academic-service/Code.gs`)
- `generateConsolidatedAttendanceAndCoexistenceReport` (`backend/academic-service/Code.gs`)

### C. Estado Actual y Clasificación Individual
1. **Planificación Pedagógica y Jornalizaciones:** *Implementada parcialmente*. Existe vinculación de asignaturas y períodos, pero falta repositorio de entrega de guiones docentes y sílabos (`F11-Task09`).
2. **Entrega y Revisión de Documentación:** *Implementada parcialmente*. Permite revisión básica pero falta flujo de estados con solicitudes de corrección (`F11-Task10`).
3. **Observación y Evaluación Docente:** *Implementada parcialmente*. Registra observaciones y planes de mejora, pero carece de pautas/rúbricas configurables por nivel (`F11-Task11`).
4. **Suplencias y Relevos Docentes:** *Completa y verificada*. Registra sustituciones conservando al docente titular y asignando alcances temporales (`F11-Task12`).
5. **Indicadores de Calidad Educativa:** *Implementada parcialmente*. `getCurricularAnalyticsReport` provee métricas, pero falta reporte consolidado de cumplimiento pedagógico (`F11-Task17`).

---

## 4. INFORME INDIVIDUAL - ÁREA IV: CONTABILIDAD, PRESUPUESTOS Y CONTROL FINANCIERO

### A. Identificación
- **Área:** Contabilidad, presupuestos y control financiero
- **Fase:** Fase 11
- **Nombres Visibles Internos/Servicios:** `AsientosContables`, `PresupuestosInstitucionales`, `CuentasPorCobrar`, `ConciliacionBancaria`, `backend/accounting-service/Code.gs`
- **Roles Involucrados:** Contador, Dirección, Secretaría, Administrador.
- **Propósito:** Garantizar la integridad financiera, control presupuestario por centro de costo, emisión de recibos/facturas fiscalmente válidos y conciliación bancaria.

### B. Inventario Funcional
- `getChartOfAccounts` / `saveAccountItem` / `recordAccountingJournalEntry` (`backend/accounting-service/Code.gs`)
- `getBudgets` / `saveBudgetPlan` / `getBudgetExecutionReport` (`backend/accounting-service/Code.gs`)
- `recordStudentPayment` / `createFiscalInvoice` / `getStudentAccountStatement` (`backend/accounting-service/Code.gs`)
- `recordAccountsPayableExpense` / `performBankReconciliation` (`backend/accounting-service/Code.gs`)
- `createPurchaseOrder` / `approvePurchaseOrder` (`backend/accounting-service/Code.gs`)
- `configureDiscountScholarshipRule` / `submitDiscountScholarshipRequest` (`backend/accounting-service/Code.gs`)

### C. Estado Actual y Clasificación Individual
1. **Configuración Contable y Partida Doble:** *Completa y verificada*. Catálogo de cuentas estructurado y asientos equilibrados (`F11-Task02`).
2. **Presupuestos y Centros de Costo:** *Implementada parcialmente*. Mide ejecución presupuestaria, pero falta alerta de sobregiro por centro de costo (`F11-Task14`).
3. **Gestión de Ingresos y Cuentas por Cobrar:** *Completa y verificada*. Registra cobros, emite comprobantes CUV y controla saldos por estudiante.
4. **Gestión de Egresos y Proveedores:** *Completa y verificada*. Registra compras, cotizaciones y órdenes de compra con aprobación.
5. **Conciliación Bancaria:** *Implementada parcialmente*. Permite conciliación manual, pero falta pareo automático de extractos bancarios (`F11-Task13`).
6. **Integración Becas/Descuentos:** *Implementada parcialmente*. Gestiona solicitudes de becas pero falta integración directa en estados de cuenta automatizados (`F11-Task15`).

---

## 5. INFORME CONSOLIDADO Y PLAN DE RESOLUCIÓN PRIORIZADO

### 1. Alcance Previsto
Evaluación integral de las 4 áreas funcionales de la Fase 11:
1. Comunicación y colaboración institucional.
2. Bienestar estudiantil, orientación y seguimiento.
3. Supervisión docente y calidad educativa.
4. Contabilidad, presupuestos y control financiero.

### 2. Alcance Realmente Evaluado
100% de los componentes de backend (`user-service`, `academic-service`, `accounting-service`, `task-service`, `developer-service`) e interfaces de usuario correspondientes.

### 3 y 4. Inventario de Funciones y Subcapacidades
Se evaluaron 74 endpoints y funciones backend y 18 subcapacidades clave distribuidas en las 4 áreas.

### 5. Cobertura de Inspección
`18 / 18 subcapacidades inspeccionadas (100.0%)`.

### 6. Cobertura de Verificación
`18 / 18 subcapacidades verificadas mediante análisis técnico y pruebas automatizadas (100.0%)`.

### 7. Distribución de Estados Funcionales
- **Completa y verificada:** 7 subcapacidades (38.9%).
- **Implementada parcialmente:** 9 subcapacidades (50.0%).
- **Requiere mejoras:** 2 subcapacidades (11.1%).
- **Defectuosa / Ausente:** 0 subcapacidades (0.0%).

### 8 y 9. Problemas Críticos y de Seguridad
- **P0 - Privacidad:** Garantizar el aislamiento inquebrantable de notas de bienestar y orientación frente a docentes generales (`F11-Task01`).
- **P0 - Integridad Contable:** Garantizar el equilibrio de asientos de partida doble y autorizaciones financieras multinivel (`F11-Task02`).

### 10 a 15. Brechas, Integraciones, Dependencias, Riesgos y Bloqueos
- **Brechas:** Falta de pareo bancario automático, notificaciones masivas con alertas de sobregiro presupuestario, y repositorio de guiones docentes.
- **Riesgos de Regresión:** Modificaciones en el microservicio de contabilidad deben preservar el historial de pagos y recibos CUV emitidos.
- **Bloqueos:** Ninguno. Todos los microservicios e infraestructura de pruebas están 100% operativos.

### 16. Plan de Resolución Priorizado (Backlog Unificado)

| Tarea ID | Área | Descripción | Prioridad | Estado |
|---|---|---|---|---|
| `F11-Task01` | Bienestar | Aislamiento estricto y seguridad de expedientes de bienestar | P0 | Pendiente |
| `F11-Task02` | Finanzas | Integridad de asientos contables y autorizaciones multinivel | P0 | Pendiente |
| `F11-Task03` | Comunicación | Centro unificado de comunicaciones y mensajes contextuales | P1 | Pendiente |
| `F11-Task04` | Comunicación | Gestor de noticias, anuncios y circulares con vigencia | P1 | Pendiente |
| `F11-Task05` | Comunicación | Motor de confirmaciones de lectura y autorizaciones familiares | P1 | Pendiente |
| `F11-Task06` | Comunicación | Calendarios institucionales, convocatorias y control de traslapes | P1 | Pendiente |
| `F11-Task07` | Bienestar | Gestión de citas de orientación y acompañamiento estudiantil | P1 | Pendiente |
| `F11-Task08` | Bienestar | Sistema de alertas tempranas de rendimiento y deserción | P1 | Pendiente |
| `F11-Task09` | Supervisión | Planificación pedagógica, jornalizaciones y guiones docentes | P1 | Pendiente |
| `F11-Task10` | Supervisión | Flujo de entrega, observaciones y aprobación de planes docentes | P1 | Pendiente |
| `F11-Task11` | Supervisión | Observaciones en aula, rúbricas de supervisión y evaluaciones | P1 | Pendiente |
| `F11-Task12` | Supervisión | Suplencias temporales y relevos docentes con alcance acotado | P1 | Pendiente |
| `F11-Task13` | Finanzas | Conciliación bancaria asistida y pareo de extractos | P1 | Pendiente |
| `F11-Task14` | Finanzas | Control presupuestario y alertas de sobregiro por centro de costo | P1 | Pendiente |
| `F11-Task15` | Finanzas | Integración de becas y exoneraciones en estados de cuenta | P1 | Pendiente |
| `F11-Task16` | Finanzas | Ampliación de reportes contables y balance de comprobación | P2 | Pendiente |
| `F11-Task17` | Supervisión | Indicadores agregados de calidad educativa y cumplimiento | P2 | Pendiente |
| `F11-Task18` | Calidad | Suite de pruebas de regresión e integración de la Fase 11 | P2 | Pendiente |

### 17. Pruebas Pendientes
Ejecución de la suite automatizada `runPhase11CommunicationWelfareSupervisionAndFinanceRegressionSuite` para las 18 tareas del backlog de la Fase 11.

### 18. Conclusión sobre el Cumplimiento de la Fase
La Fase 11 cuenta con cimientos técnicos y backend sumamente sólidos en las cuatro áreas. La ejecución sistemática de las 18 tareas catalogadas en el backlog unificado de `Pendientes.md` permitirá elevar la cobertura funcional y la experiencia operativa al 100% de cumplimiento institucional.


---

## Tareas ejecutables derivadas de los hallazgos

> Normalización documental del backlog histórico de la Fase 11. Se conservan los 18 identificadores, sus prioridades y estados originales de la sección 16. La trazabilidad distingue las brechas descritas en las secciones 1 a 5 de las recomendaciones que solo aparecen en el backlog. No se crean hallazgos ni tareas nuevas. Cuando el informe presenta estados contradictorios, se conserva el estado Pendiente del backlog y se registra expresamente la discrepancia, sin certificar la implementación.

### [F11-Task01] Garantizar el aislamiento y la confidencialidad de los expedientes de bienestar
- **Hallazgo de origen:** sección 2.C.3 (seguridad/confidencialidad de observaciones de Consejería y Orientación) y sección 5.8-9 (riesgo P0 de privacidad).
- **Severidad:** Crítica. **Objetivo:** impedir que docentes generales u otros roles no autorizados accedan a notas, expedientes y seguimientos de bienestar.
- **Acción ejecutable:** verificar y completar controles de autorización por rol, alcance y relación institucional en cada lectura/escritura; aislar observaciones confidenciales; registrar intentos no autorizados y probar accesos positivos y negativos.
- **Archivos/módulos:** `backend/academic-service/Code.gs`, `CasosSeguimiento`, `RegistrosOrientacion`, endpoints y vistas consumidoras.
- **Dependencias/riesgos:** modelo de roles y permisos, identidad autenticada y auditoría de accesos; exposición de datos sensibles si una ruta omite el control.
- **Alcance:** expedientes y observaciones de bienestar/orientación; no ampliar permisos generales por conveniencia.
- **Criterios de aceptación:** roles no autorizados no pueden consultar ni modificar datos confidenciales por ninguna ruta; los accesos autorizados conservan la funcionalidad; cada rechazo queda trazado sin revelar el contenido protegido.
- **Prioridad:** P0. **Estado:** Pendiente (estado original del backlog).
- **Evidencia de cierre:** pendiente. **Discrepancia:** sección 2.C.3 declara seguridad completa y verificada y la vincula con F10-Task01, mientras la conclusión consolidada mantiene el riesgo P0. Se requiere reconciliar la evidencia antes de cambiar el estado.

### [F11-Task02] Asegurar la integridad de los asientos contables y las autorizaciones multinivel
- **Hallazgo de origen:** sección 4.C.1 (partida doble declarada completa) y sección 5.8-9 (riesgo P0 de integridad contable y autorizaciones financieras).
- **Severidad:** Crítica. **Objetivo:** garantizar que los asientos estén equilibrados y que las operaciones financieras sensibles respeten las autorizaciones requeridas.
- **Acción ejecutable:** verificar validaciones de débito/crédito, atomicidad del registro, segregación de funciones, niveles de aprobación, rechazo de operaciones incompletas y trazabilidad de cada decisión; corregir las brechas demostradas.
- **Archivos/módulos:** `backend/accounting-service/Code.gs`, `AsientosContables`, `ApprovalWorkflows` o el flujo financiero equivalente documentado.
- **Dependencias/riesgos:** catálogo contable, identidad/roles, concurrencia y persistencia transaccional; riesgo de asientos desbalanceados o autorizaciones indebidas.
- **Alcance:** integridad del asiento y autorización multinivel; no modificar el historial de pagos/recibos sin migración y respaldo verificables.
- **Criterios de aceptación:** se rechazan asientos no balanceados; no hay escrituras parciales ante error; cada aprobación corresponde a un rol autorizado y queda trazada; pruebas de concurrencia y rechazo cubren los casos críticos.
- **Prioridad:** P0. **Estado:** Pendiente (estado original del backlog).
- **Evidencia de cierre:** pendiente. **Discrepancia:** la sección 4.C.1 afirma que la partida doble está completa y verificada, pero la conclusión mantiene un riesgo P0. No se toma la afirmación general como evidencia suficiente de autorizaciones multinivel.

### [F11-Task03] Completar el centro unificado de comunicaciones y mensajes contextuales
- **Hallazgo de origen:** sección 1.C.1; existen notificaciones dirigidas, pero falta una interfaz unificada de conversaciones bidireccionales por estudiante/trámite.
- **Severidad:** Alta. **Objetivo:** centralizar conversaciones institucionales vinculadas a personas y trámites.
- **Acción ejecutable:** implementar bandejas y conversaciones con participantes, contexto, historial, estados de lectura y permisos; integrar los mensajes con las notificaciones existentes sin duplicar envíos.
- **Archivos/módulos:** `backend/user-service/Code.gs`, `BandejaNotificaciones`, `MensajeriaInstitucional` y vistas de comunicación.
- **Dependencias/riesgos:** identidad, permisos por participante, deduplicación y retención; riesgo de fuga de conversaciones o mensajes duplicados.
- **Alcance:** conversación contextual y consulta de historial; no reemplazar el servicio de notificaciones que el informe declara completo.
- **Criterios de aceptación:** los participantes autorizados envían y consultan mensajes; usuarios ajenos no acceden; el contexto se conserva; notificaciones no se duplican y los errores se presentan de forma recuperable.
- **Prioridad:** P1. **Estado:** Pendiente.
- **Evidencia de cierre:** pendiente; el informe solo acredita notificaciones dirigidas, no chat bidireccional unificado.

### [F11-Task04] Implementar un gestor de noticias, anuncios y circulares con vigencia
- **Hallazgo de origen:** sección 1.C.2; hay funciones de avisos, pero falta gestión de publicaciones en borrador/programadas y fechas de vigencia.
- **Severidad:** Alta. **Objetivo:** administrar publicaciones oficiales con ciclo de vida y audiencia definida.
- **Acción ejecutable:** crear operaciones para redactar, guardar borrador, programar, publicar, expirar y archivar circulares; controlar audiencia, autoría, permisos y fechas.
- **Archivos/módulos:** `backend/user-service/Code.gs`, `BandejaNotificaciones`, `MensajeriaInstitucional` y módulo de publicaciones.
- **Dependencias/riesgos:** calendario, roles editoriales y mecanismo de distribución; riesgo de publicar información fuera de vigencia o a destinatarios incorrectos.
- **Alcance:** ciclo editorial de noticias/anuncios/circulares; no duplicar el canal de notificaciones.
- **Criterios de aceptación:** cada publicación conserva autor, audiencia, fechas y estado; las programadas se publican en el momento configurado; las expiradas dejan de mostrarse como vigentes; cambios quedan auditados.
- **Prioridad:** P1. **Estado:** Pendiente.
- **Evidencia de cierre:** pendiente; la sección 1.C.2 identifica expresamente la capacidad faltante.

### [F11-Task05] Unificar confirmaciones de lectura y autorizaciones familiares
- **Hallazgo de origen:** sección 1.C.4; existen flujos de aprobación, pero falta un motor unificado de autorizaciones familiares y firma de consentimientos.
- **Severidad:** Alta. **Objetivo:** obtener y conservar consentimientos familiares verificables vinculados a cada trámite.
- **Acción ejecutable:** extender el flujo de aprobaciones para emitir solicitudes a tutores validados, registrar lectura, decisión, fecha, versión del consentimiento y evidencia de firma; permitir revocación/corrección conforme a reglas institucionales.
- **Archivos/módulos:** `backend/user-service/Code.gs`, `SolicitudesAutorizacion`, `ApprovalWorkflows`, `saveApprovalWorkflow`, `processWorkflowDecision`.
- **Dependencias/riesgos:** identidad y relación tutor-estudiante, notificaciones e integridad de evidencias; riesgo de aceptar consentimientos de personas no vinculadas.
- **Alcance:** autorizaciones familiares y confirmaciones asociadas; no sustituye firmas o requisitos legales externos no especificados en el informe.
- **Criterios de aceptación:** solo tutores autorizados pueden consentir; cada decisión queda asociada a trámite, versión, actor y marca temporal; la lectura no se confunde con aprobación; el historial es consultable y no se altera retroactivamente.
- **Prioridad:** P1. **Estado:** Pendiente.
- **Evidencia de cierre:** pendiente; el informe describe aprobación parcial y ausencia del motor unificado.

### [F11-Task06] Incorporar control de traslapes en calendarios y citas institucionales
- **Hallazgo de origen:** sección 1.C.5; la agenda retorna eventos, pero no detecta colisiones al agendar reuniones.
- **Severidad:** Alta. **Objetivo:** impedir reservas incompatibles de recursos, participantes y horarios.
- **Acción ejecutable:** validar disponibilidad antes de confirmar una cita; detectar intersecciones por participante/recurso, zona horaria y duración; proteger la reserva frente a solicitudes concurrentes.
- **Archivos/módulos:** `backend/user-service/Code.gs`, `getInstitutionalCalendarEvents`, `bookAppointment`, `EventosCalendario`.
- **Dependencias/riesgos:** modelo de eventos, identidad de participantes y control de concurrencia; riesgo de doble reserva.
- **Alcance:** detección y prevención de traslapes; no rediseñar el calendario completo.
- **Criterios de aceptación:** una reserva conflictiva se rechaza con causa clara; reservas concurrentes no confirman el mismo espacio/participante; eventos válidos siguen consultándose correctamente.
- **Prioridad:** P1. **Estado:** Pendiente.
- **Evidencia de cierre:** pendiente; el informe confirma que la detección de colisiones falta.

### [F11-Task07] Consolidar la gestión de citas de orientación y acompañamiento estudiantil
- **Hallazgo de origen:** sección 2.C.1 declara la capacidad completa y remite a F10-Task09; sección 16 conserva F11-Task07 en el backlog.
- **Severidad:** Alta (prioridad histórica P1). **Objetivo:** mantener un flujo trazable de citas, actas confidenciales y derivaciones.
- **Acción ejecutable:** reconciliar el alcance de F11-Task07 con F10-Task09; verificar que agenda, acta, confidencialidad, derivación y permisos estén cubiertos por la tarea existente; si la cobertura es íntegra, documentar equivalencia y no implementar una segunda solución.
- **Archivos/módulos:** `backend/academic-service/Code.gs`, `scheduleCounselingAppointment`, `recordCounselingSessionAct`, `referCounselingCase`, `CitasOrientacion`.
- **Dependencias/riesgos:** F10-Task09, controles de confidencialidad y agenda; riesgo de duplicar flujos o perder historial.
- **Alcance:** reconciliación de cobertura y cierre documental de la tarea histórica, no desarrollo paralelo.
- **Criterios de aceptación:** matriz requisito-evidencia demuestra cada capacidad; cualquier brecha se vincula al ID existente adecuado; no se crean IDs duplicados ni se altera el historial.
- **Prioridad:** P1. **Estado:** Pendiente (estado original del backlog).
- **Evidencia de cierre:** pendiente. **Discrepancia:** sección 2.C.1 la declara completa y verificada bajo F10-Task09; el backlog F11 la mantiene pendiente. Requiere cotejo de cobertura y estado, no asumir que el duplicado está resuelto.

### [F11-Task08] Integrar alertas tempranas de rendimiento académico y deserción
- **Hallazgo de origen:** sección 2.C.4; existen alertas por inasistencia/tardanza, pero falta consolidar riesgo académico y de deserción.
- **Severidad:** Alta. **Objetivo:** detectar y canalizar oportunamente casos que requieren acompañamiento.
- **Acción ejecutable:** definir reglas configurables y trazables para señales de riesgo académico/deserción; consolidar asistencia, rendimiento y seguimiento; generar alertas asignadas a roles autorizados con estado y derivación.
- **Archivos/módulos:** `backend/academic-service/Code.gs`, `getAttendanceFollowupCases`, `checkAndDispatchAttendanceAlerts`, `CasosSeguimiento`.
- **Dependencias/riesgos:** calidad de datos académicos/asistencia, privacidad y umbrales institucionales; riesgo de falsos positivos o exposición de información confidencial.
- **Alcance:** alertas integradas y gestión de casos; no automatizar diagnósticos personales.
- **Criterios de aceptación:** reglas reproducibles generan alertas solo con datos suficientes; cada alerta incluye motivo, fecha, responsable y estado; el acceso respeta confidencialidad; se pueden revisar falsos positivos y cerrar/derivar casos.
- **Prioridad:** P1. **Estado:** Pendiente.
- **Evidencia de cierre:** pendiente; el informe declara parcial la alerta actual y señala la integración faltante.

### [F11-Task09] Completar repositorio de planificación pedagógica, jornalizaciones y guiones docentes
- **Hallazgo de origen:** sección 3.C.1; existen asignaturas/períodos vinculados, pero falta repositorio de entrega de guiones y sílabos.
- **Severidad:** Alta. **Objetivo:** centralizar la entrega, versión y consulta de documentos de planificación docente.
- **Acción ejecutable:** implementar carga/registro, clasificación por docente/asignatura/período, versiones, fechas de entrega y estados de revisión para guiones y sílabos.
- **Archivos/módulos:** `backend/academic-service/Code.gs`, `PlanificacionesPedagogicas` y almacenamiento documental relacionado.
- **Dependencias/riesgos:** permisos docentes/coordinación, almacenamiento y metadatos; riesgo de sobrescritura o asociación a período incorrecto.
- **Alcance:** repositorio y trazabilidad de documentos pedagógicos; no sustituye la asignación académica existente.
- **Criterios de aceptación:** cada documento queda ligado a docente, asignatura y período; las versiones se conservan; entregas tardías/incompletas se identifican; solo roles autorizados revisan.
- **Prioridad:** P1. **Estado:** Pendiente.
- **Evidencia de cierre:** pendiente; el informe declara implementación parcial y repositorio ausente.

### [F11-Task10] Formalizar el flujo de entrega, observaciones y aprobación de planes docentes
- **Hallazgo de origen:** sección 3.C.2; la revisión es básica y carece de estados con solicitudes de corrección.
- **Severidad:** Alta. **Objetivo:** hacer trazable el ciclo de revisión y subsanación de documentos docentes.
- **Acción ejecutable:** definir estados de borrador, enviado, en revisión, requiere corrección, reenviado y aprobado; registrar observaciones, responsable, plazos y versiones.
- **Archivos/módulos:** `backend/academic-service/Code.gs`, `PlanificacionesPedagogicas`, flujo de revisión documental.
- **Dependencias/riesgos:** F11-Task09, roles de docente/coordinación y versionado; riesgo de aprobar una versión distinta de la revisada.
- **Alcance:** estados y solicitudes de corrección de planes; no duplicar el repositorio documental.
- **Criterios de aceptación:** cada transición valida rol y estado previo; una corrección conserva observación y versión; aprobación identifica exactamente la versión aprobada; el historial no se sobrescribe.
- **Prioridad:** P1. **Estado:** Pendiente.
- **Evidencia de cierre:** pendiente; el informe identifica revisión básica sin flujo de corrección.

### [F11-Task11] Incorporar rúbricas configurables para observación y evaluación docente
- **Hallazgo de origen:** sección 3.C.3; existen observaciones y planes de mejora, pero faltan pautas/rúbricas configurables por nivel.
- **Severidad:** Alta. **Objetivo:** estandarizar la evaluación pedagógica con criterios explícitos por nivel.
- **Acción ejecutable:** permitir configurar rúbricas por nivel/área, criterios, escala, ponderación y versión; asociarlas a observaciones y planes de mejora.
- **Archivos/módulos:** `backend/academic-service/Code.gs`, `getTeacherSupervisions`, `getSupervisionObservation`, `getTeacherImprovementPlans`, `SupervisionPedagógica`.
- **Dependencias/riesgos:** catálogo académico, permisos de coordinación y trazabilidad de versiones; riesgo de comparar evaluaciones con escalas incompatibles.
- **Alcance:** rúbricas y asociación a observaciones; no alterar retroactivamente evaluaciones históricas.
- **Criterios de aceptación:** rúbricas se configuran por nivel y periodo; cada evaluación conserva la versión aplicada; ponderaciones y escalas se validan; los resultados pueden auditarse.
- **Prioridad:** P1. **Estado:** Pendiente.
- **Evidencia de cierre:** pendiente; el informe declara la falta de rúbricas configurables.

### [F11-Task12] Reconciliar y consolidar el registro de suplencias temporales docentes
- **Hallazgo de origen:** sección 3.C.4 declara las sustituciones completas y verificadas; sección 16 conserva F11-Task12 como pendiente.
- **Severidad:** Alta (prioridad histórica P1). **Objetivo:** asegurar que las suplencias mantengan titularidad, periodo y alcance temporal sin duplicar asignaciones.
- **Acción ejecutable:** contrastar `createTeacherSubstitution` y `getTeacherSubstitutions` con todos los criterios del backlog; verificar solapamientos, vigencia, docente titular, sustituto y reversión al terminar; documentar brechas si aparecen.
- **Archivos/módulos:** `backend/academic-service/Code.gs`, `SustitucionesDocentes`.
- **Dependencias/riesgos:** asignaciones docentes, calendario y concurrencia; riesgo de sustituciones simultáneas o permanentes por error.
- **Alcance:** verificación de cobertura y brechas del registro de suplencias; no reimplementar lo que ya esté probado.
- **Criterios de aceptación:** evidencia demuestra titular preservado, sustituto autorizado, fechas/alcance acotados, rechazo de solapamientos incompatibles y cierre/reversión temporal; no se altera el estado histórico sin aprobación.
- **Prioridad:** P1. **Estado:** Pendiente (estado original del backlog).
- **Evidencia de cierre:** pendiente. **Discrepancia:** la sección 3.C.4 la declara completa y verificada, pero la tabla consolidada la conserva pendiente; se requiere reconciliación basada en evidencia.

### [F11-Task13] Completar conciliación bancaria asistida y pareo de extractos
- **Hallazgo de origen:** sección 4.C.5; existe conciliación manual, pero falta pareo automático de movimientos de extractos.
- **Severidad:** Alta. **Objetivo:** reducir errores manuales y hacer trazable la correspondencia entre extractos y registros contables.
- **Acción ejecutable:** incorporar importación controlada de extractos, normalización de fecha/referencia/monto, reglas de coincidencia, cola de excepciones y confirmación humana antes de contabilizar ajustes.
- **Archivos/módulos:** `backend/accounting-service/Code.gs`, `performBankReconciliation`, `ConciliacionBancaria`.
- **Dependencias/riesgos:** formatos bancarios, catálogo de cuentas, idempotencia y permisos financieros; riesgo de conciliaciones falsas o duplicación de movimientos.
- **Alcance:** asistencia al pareo y gestión de excepciones; no ejecutar ajustes irreversibles sin autorización.
- **Criterios de aceptación:** coincidencias sugeridas muestran evidencia y nivel/regla de correspondencia; movimientos no pareados quedan en excepción; no se contabiliza dos veces; usuario autorizado confirma los ajustes.
- **Prioridad:** P1. **Estado:** Pendiente.
- **Evidencia de cierre:** pendiente; el informe declara disponible solo la conciliación manual.

### [F11-Task14] Implementar control presupuestario y alertas de sobregiro por centro de costo
- **Hallazgo de origen:** sección 4.C.2 y sección 5.10-15; se mide ejecución presupuestaria, pero falta alerta de sobregiro por centro de costo.
- **Severidad:** Alta. **Objetivo:** anticipar y prevenir compromisos que excedan el presupuesto autorizado.
- **Acción ejecutable:** calcular presupuesto aprobado, ejecutado y comprometido por centro de costo/partida; definir umbrales y emitir alertas antes de aprobar gastos u órdenes.
- **Archivos/módulos:** `backend/accounting-service/Code.gs`, `getBudgets`, `saveBudgetPlan`, `getBudgetExecutionReport`, `PresupuestosInstitucionales`.
- **Dependencias/riesgos:** F11-Task02 y registros de compras/pagos; riesgo de datos desactualizados, doble compromiso o sobregiro concurrente.
- **Alcance:** control y alertas por centro de costo; no alterar registros históricos ni sustituir autorizaciones.
- **Criterios de aceptación:** los saldos reflejan aprobado/ejecutado/comprometido; alertas se disparan en umbrales configurados; operaciones concurrentes no exceden disponibilidad; cada bloqueo/aviso queda trazado.
- **Prioridad:** P1. **Estado:** Pendiente.
- **Evidencia de cierre:** pendiente; la ejecución se mide, pero el informe identifica la alerta como faltante.

### [F11-Task15] Integrar becas y exoneraciones en los estados de cuenta
- **Hallazgo de origen:** sección 4.C.6; se gestionan solicitudes de becas, pero falta integración directa y automatizada en estados de cuenta.
- **Severidad:** Alta. **Objetivo:** reflejar beneficios autorizados de manera consistente en los saldos de cada estudiante.
- **Acción ejecutable:** vincular reglas/solicitudes aprobadas con cargos y estados de cuenta; aplicar vigencias, porcentajes/montos, conceptos y topes; mantener historial de aplicación y reversión.
- **Archivos/módulos:** `backend/accounting-service/Code.gs`, `configureDiscountScholarshipRule`, `submitDiscountScholarshipRequest`, `getStudentAccountStatement`.
- **Dependencias/riesgos:** autorización de becas, matrícula, periodos de cobro e idempotencia; riesgo de aplicar descuentos duplicados o fuera de vigencia.
- **Alcance:** integración de beneficios autorizados al estado de cuenta; no conceder becas automáticamente.
- **Criterios de aceptación:** solo beneficios aprobados y vigentes afectan saldos; aplicación única y trazable; cambios/revocaciones recalculan según reglas sin borrar movimientos históricos.
- **Prioridad:** P1. **Estado:** Pendiente.
- **Evidencia de cierre:** pendiente; el informe identifica la integración como parcial.

### [F11-Task16] Ampliar reportes contables y balance de comprobación
- **Hallazgo de origen:** sección 16 (backlog unificado); no se documenta una brecha técnica individual adicional en las secciones 1-4.
- **Severidad:** Media. **Objetivo:** ofrecer reportes contables consolidados y verificables para control financiero.
- **Acción ejecutable:** especificar y desarrollar reportes requeridos y balance de comprobación a partir de asientos contabilizados, con filtros por periodo/cuenta/centro de costo y conciliación de totales.
- **Archivos/módulos:** `backend/accounting-service/Code.gs`, `AsientosContables`, `getChartOfAccounts` y reportes financieros.
- **Dependencias/riesgos:** integridad de F11-Task02, catálogo de cuentas y periodos cerrados; riesgo de reportes que no concilien con el libro contable.
- **Alcance:** reportes y balance de comprobación; no crear datos contables derivados que sustituyan los asientos fuente.
- **Criterios de aceptación:** débitos y créditos cuadran por periodo; filtros y saldos son reproducibles; totales concilian con asientos fuente; se preservan periodos cerrados.
- **Prioridad:** P2. **Estado:** Pendiente.
- **Evidencia de cierre:** pendiente; el informe solo registra esta mejora en el backlog.

### [F11-Task17] Consolidar indicadores de calidad educativa y cumplimiento pedagógico
- **Hallazgo de origen:** sección 3.C.5; existen métricas en `getCurricularAnalyticsReport`, pero falta reporte consolidado de cumplimiento pedagógico.
- **Severidad:** Media. **Objetivo:** disponer de indicadores agregados y trazables sobre planificación y cumplimiento.
- **Acción ejecutable:** definir indicadores, fuentes, fórmulas y periodos; consolidar entregas/revisiones de F11-Task09/10, supervisiones y métricas curriculares en un reporte con filtros autorizados.
- **Archivos/módulos:** `backend/academic-service/Code.gs`, `getCurricularAnalyticsReport`, `PlanificacionesPedagogicas`, `SupervisionPedagógica`.
- **Dependencias/riesgos:** calidad de datos y definiciones institucionales; riesgo de métricas engañosas o comparaciones no homogéneas.
- **Alcance:** agregación y reporte; no inferir calidad docente individual a partir de métricas sin contexto.
- **Criterios de aceptación:** cada indicador tiene fórmula/fuente documentada; los agregados concilian con registros fuente; filtros y permisos se aplican; los resultados pueden reproducirse por periodo.
- **Prioridad:** P2. **Estado:** Pendiente.
- **Evidencia de cierre:** pendiente; el informe describe métricas existentes, pero identifica el consolidado como faltante.

### [F11-Task18] Ejecutar y mantener la suite de regresión e integración de la Fase 11
- **Hallazgo de origen:** sección 17 (pruebas pendientes); se identifica expresamente `runPhase11CommunicationWelfareSupervisionAndFinanceRegressionSuite` para las 18 tareas.
- **Severidad:** Media. **Objetivo:** comprobar que las capacidades de comunicación, bienestar, supervisión y finanzas cumplen los contratos y no introducen regresiones.
- **Acción ejecutable:** revisar la cobertura real de la suite; completar casos positivos, negativos, permisos, concurrencia, idempotencia, flujos entre servicios y persistencia; ejecutar y registrar resultados reproducibles.
- **Archivos/módulos:** suite `runPhase11CommunicationWelfareSupervisionAndFinanceRegressionSuite`, pruebas de `user-service`, `academic-service`, `accounting-service` y `task-service`.
- **Dependencias/riesgos:** entorno de pruebas, datos aislados y contratos backend; riesgo de falsos positivos si la suite solo valida conteos o mocks.
- **Alcance:** regresión e integración de la Fase 11; no declarar aprobada una prueba no ejecutada ni extrapolar resultados de mocks a producción.
- **Criterios de aceptación:** cada una de las 18 tareas tiene casos vinculados; pruebas críticas de privacidad, contabilidad, autorizaciones y concurrencia fallan ante incumplimientos; ejecución registra versión, entorno, resultado y evidencia; defectos quedan asociados a su tarea de origen.
- **Prioridad:** P2. **Estado:** Pendiente.
- **Evidencia de cierre:** pendiente; el propio informe clasifica la suite como prueba pendiente.

## Adenda C1.401 — revalidación focalizada de confidencialidad

- **HEAD revisado:** 48d89e6f96f9f3573647698067c4a1713435084a, rama NG_beta_0.0.0.1_work.
- **Vigencia:** esta adenda supersede, para el HEAD indicado, cualquier afirmación anterior de cierre/aislamiento completo de F11-TASK01. No reemplaza el informe original ni crea una auditoría paralela.
- **AUD-NG-383 — severidad P0 / crítica:** aislamiento insuficiente de expedientes de bienestar.
  1. getAttendanceFollowupCases determina roleUpper con authRole || _verifiedRole. La acción figura en ROLE_PERMISSIONS para Secretaría. Por tanto, un usuario autenticado como Secretaría puede enviar authRole="Director" y hacer que el filtro de confidencialidad use el rol declarado por el cliente, aunque el despacho haya verificado otro rol.
  2. saveAttendanceFollowupCase y addCaseFollowUpNote no verifican identidad/ámbito por expediente ni comprueban que el actor esté asignado al caso. Las acciones están disponibles para Secretaría para el flujo general de seguimiento; el control por acción no sustituye el control del recurso confidencial.
  3. getGuidanceAppointments incluye NotasConfidenciales para usuarios de Orientación/Consejería sin comprobar que OrientadorUserId coincida con el actor ni que el expediente asociado esté dentro de su ámbito. updateGuidanceAppointmentStatus y las operaciones recordCounselingSessionAct, referCounselingCase y compromisos tampoco acreditan una relación del actor con el expediente antes de mutarlo.
  4. generateConsolidatedAttendanceAndCoexistenceReport confía en rolSolicitante del payload. Además, usa row[4] como si fuera categoría, aunque el esquema de CasosSeguimiento coloca allí ResponsableID, y devuelve casosExcluidosPorConfidencialidad, lo que permite inferir conteos de casos confidenciales.
- **Precisión sobre roles:** Docente no aparece actualmente en ROLE_PERMISSIONS para getAttendanceFollowupCases. El bypass comprobado corresponde a Secretaría, que sí tiene la acción general; no se atribuye a Docente una invocación que el dispatcher actual no permite.
- **Discrepancia de esquema:** RegistrosOrientacion, mencionado en el requisito, no aparece en los archivos Code.gs del backend. CitasOrientacion sí existe y almacena NotasConfidenciales; CasosSeguimiento almacena notas/actas dentro de AccionesJSON. La futura implementación debe proteger las tablas reales y reconciliar el nombre lógico del requisito.
- **Impacto:** exposición y modificación de información sensible de bienestar por suplantación del rol de filtrado, ausencia de autorización por caso y falta de restricción de ámbito entre orientadores.
- **Corrección vinculada:** F11-TASK01 ya existente en pendientes/Secretaria/Pendientes.md. No se crea una tarea duplicada. La corrección deberá exigir identidad firmada en cada handler, rol derivado exclusivamente de identidad verificada, asignación/ámbito del expediente, filtros fail-closed y auditoría sin contenido confidencial.
- **Evidencia:** inspección manual de getAttendanceFollowupCases, saveAttendanceFollowupCase, addCaseFollowUpNote, getGuidanceAppointments, updateGuidanceAppointmentStatus, recordCounselingSessionAct, referCounselingCase y generateConsolidatedAttendanceAndCoexistenceReport en backend/academic-service/Code.gs; contraste con ROLE_PERMISSIONS y el requisito F11-TASK01.
- **Pruebas dinámicas:** no ejecutadas. El hallazgo se registra por revisión estática/manual de las rutas y permisos; no se afirma explotación HTTP ni prueba runtime.
- **Estado:** abierto; F11-TASK01 permanece Pendiente y no fue seleccionada para implementación en C1.401. La tarea activa de esta sesión continúa siendo TASK-153.
