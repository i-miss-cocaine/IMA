# AUDITORÍA FUNCIONAL, TÉCNICA Y DOCUMENTAL — FASE 34

**Fase:** 34 — Bandejas de entrada y salida, revisión y firmas
**Área:** Gestión documental, bandejas departamentales y personales, revisión de expedientes, firmas electrónicas, autorizaciones y flujos de aprobación interdepartamentales.
**Fecha de Evaluación:** 2026-10-31
**Estado General:** Implementada Parcialmente con Brechas Críticas en Bandejas de Salida y Aislamiento Docente Contextual

---

## A. IDENTIFICACIÓN Y ALCANCE

### 1. Propósito y Objetivos
Evaluar integralmente las capacidades de recepción, distribución interna, asignación, consulta, revisión, aprobación, firma, envío y seguimiento de documentos y solicitudes institucionales en la Plataforma Integral de Gestión Educativa.
La evaluación abarca tanto los documentos y trámites generados internamente (solicitudes administrativas, excusas estudiantiles, autorizaciones parentales, formularios dinámicos) como los documentos externos adjuntados por los usuarios (archivos PDF, imágenes de justificantes médicos, autorizaciones escaneadas y constancias).

### 2. Alcance Previsto y Efectivo
- **Bandejas de Entrada Personales y Departamentales:** Verificación de `getDepartmentalWorkInbox`, `getAdministrativeRequests`, segregación por departamento (`Secretaría`, `Orientación`, `Dirección`), estados de trámite y acceso según rol.
- **Bandejas de Salida y Control de Entregas:** Rastro de solicitudes y comunicaciones despachadas por usuarios o departamentos, acuses de recibo y verificación de entrega formal vs. simple lectura.
- **Búsqueda, Filtros y Organización:** Filtros multicriterio por estudiante, fecha, estado, prioridad y departamento.
- **Asignación y Distribución de Responsables:** Asignación individual/departamental, reasignación y trazabilidad de traspaso de expedientes.
- **Revisión, Comentarios y Observaciones:** Segregación estricta entre observaciones públicas (visibles al padre/estudiante) y notas administrativas internas en `processWorkflowDecision` y `reviewAttendanceJustification`.
- **Firmas Electrónicas y Aprobaciones Autenticadas:** Análisis del marco de firma electrónica bajo la legislación hondureña (Decreto 149-2013 y Acuerdo Ejecutivo 041-2014), verificando si los mecanismos existentes (`registerDocumentSignature`, tokens `VERIF-XXXX`, CUV) constituyen aprobación interna o firma electrónica con valor legal probatorio.
- **Ciclo de Vida Documental y Estados:** Máquina de estados (`Enviada`, `En Revisión`, `Requiere Corrección`, `Aprobada`, `Rechazada`, `Firmado`, `Resuelto`).
- **Seguridad, IDOR y Acceso Contextual (ABAC):** Validación de que padres solo accedan a solicitudes de sus hijos vinculados y que docentes solo intervengan en justificaciones o expedientes de sus secciones asignadas.

### 3. Escenario Integral Obligatorio de Prueba
Se evaluó el recorrido de extremo a extremo:
1. *Padre/Tutor:* Inicia sesión, selecciona a su hijo y remite una excusa estudiantil adjuntando fotografía o constancia médica (`submitStudentAbsenceJustification`).
2. *Sistema:* Registra la solicitud en `SolicitudesTramites`, vincula `estudianteId`, `userId` y `adjuntoUrl`.
3. *Bandeja Departamental:* Secretaría / Orientación visualiza la solicitud en `getDepartmentalWorkInbox`.
4. *Secretaría:* Abre la solicitud, examina adjuntos y emite decisión u observación (`reviewAbsenceJustification` / `processWorkflowDecision`).
5. *Docentes Asignados:* Consulta por parte de los docentes de las clases afectadas para tomar conocimiento y registrar conformidad.
6. *Notificación y Cierre:* El padre consulta el estado actualizado y las observaciones públicas; la justificación impacta automáticamente la asistencia (`RegistrosAsistencia`).

---

## B. INVENTARIO REAL Y COMPONENTES IDENTIFICADOS

| Componente | Archivo / Fuente | Función Principal | Estado / Hallazgo |
|---|---|---|---|
| Bandeja Departamental | `backend/user-service/Code.gs` | `getDepartmentalWorkInbox(payload)` | Funcional básica. Filtra en `SolicitudesTramites` por departamento asignado. |
| Bandeja Personal / Consultas | `backend/user-service/Code.gs` | `getAdministrativeRequests(payload)` | Funcional con protección IDOR para Estudiantes y Padres vinculados. |
| Justificaciones de Asistencia (User) | `backend/user-service/Code.gs` | `submitStudentAbsenceJustification`, `getStudentAbsenceJustifications`, `reviewAbsenceJustification` | Registra en `SolicitudesTramites` con prefijo `JUST-`. |
| Justificaciones de Asistencia (Academic) | `backend/academic-service/Code.gs` | `submitAttendanceJustification`, `reviewAttendanceJustification` | Registra en `JustificacionesAsistencia` e impacta `RegistrosAsistencia`. Existe dualidad de almacenamiento. |
| Motor de Decisiones de Trámite | `backend/user-service/Code.gs` | `processWorkflowDecision(payload)` | Registra en `RevisionesDecisionesTramite` diferenciando notas internas y públicas. |
| Historial de Flujo y Firmas | `backend/user-service/Code.gs` | `getWorkflowHistory(payload)` | Retorna decisiones (`RevisionesDecisionesTramite`) y firmas (`FirmasConformidades`). |
| Registro de Firmas / Conformidades | `backend/user-service/Code.gs` | `registerDocumentSignature(payload)` | Registra en `FirmasConformidades` generando token pseudo-aleatorio `VERIF-`. |
| Solicitudes de Autorización Parental | `backend/user-service/Code.gs` | `submitAuthorizationRequest`, `getAuthorizationRequests`, `respondToAuthorizationRequest` | Maneja ciclo de vida (`Pendiente`, `Aceptado`, `Rechazado`, `Vencido`) con bloqueo extemporáneo. |
| Mensajería Interna | `backend/user-service/Code.gs` | `getInternalMessages`, `sendInternalMessage`, `closeConversationThread` | Registra en `ConversacionesMensajes` con lectura básica. |
| Bandeja Docente de Tareas | `js/teacher.js` | `fetchEntregasRecientes()` | Vista cliente para calificar entregas de aula virtual (no integrada con trámites institucionales). |

---

## C. EVALUACIÓN DETALLADA POR SUBCAPACIDAD (F34-01 A F34-12)

### F34-01. Bandejas de entrada personales y departamentales
- **Estado:** Implementada Parcialmente.
- **Implementación Real:** `getDepartmentalWorkInbox` en `user-service` permite consultar solicitudes dirigidas a `Secretaría`, `Dirección` u `Orientación`.
- **Brechas:**
  1. No existe una bandeja unificada personal que consolide en una sola vista las solicitudes donde el usuario es el responsable asignado nominalmente.
  2. No existen indicadores de documentos vencidos o próximos a vencer calculados contra un SLA institucional.
  3. No hay soporte para bandejas docentes de trámites (los docentes solo tienen bandeja académica de tareas de aula en `fetchEntregasRecientes`).

### F34-02. Bandejas de salida y control de entregas
- **Estado:** Defectuosa / Ausente en Servicios Formales.
- **Implementación Real:** Los usuarios pueden consultar sus trámites enviados mediante `getAdministrativeRequests`, pero no existe un concepto formal de *Bandeja de Salida Departamental* donde Secretaría o Dirección rastreen documentos despachados hacia padres, estudiantes u otras dependencias.
- **Brechas:**
  1. No se distingue entre "Envío solicitado", "Entregado a la casilla", "Abierto/Leído" y "Recibido formalmente".
  2. No se genera acuse de recibo formal con hash cuando un destinatario abre o recibe un documento oficial despachado.

### F34-03. Búsqueda, filtros y organización
- **Estado:** Requiere Mejoras.
- **Implementación Real:** `getAdministrativeRequests` admite filtrado básico por `userId` y `estudianteId`.
- **Brechas:**
  1. Falta soporte para filtros combinados por rango de fechas, prioridad (`Alta`, `Normal`, `Urgente`), tipo de trámite y estado en la llamada a backend.
  2. En frontend, no hay controles de paginación ni ordenamiento reactivo en bandejas de trámites.

### F34-04. Asignación y distribución de responsables
- **Estado:** Implementada Parcialmente.
- **Implementación Real:** `processWorkflowDecision` permite especificar `siguienteAsignadoA`, y `updateRequestStatus` permite modificar `asignadoA`.
- **Brechas:**
  1. No se registra el historial de reasignaciones (quién reasignó a quién, cuándo y por qué motivo).
  2. No existe validación para impedir la asignación a usuarios inactivos o que ya no pertenecen al departamento.
  3. No se soporta asignación múltiple (revisión concurrente o colegiada).

### F34-05. Revisión, comentarios y observaciones
- **Estado:** Completa y Verificada en Backend.
- **Implementación Real:** `processWorkflowDecision` segrega estrictamente `observacionesInternas` y `observacionesPublicas`. `RevisionesDecisionesTramite` almacena ambos campos y sólo expone `observacionesPublicas` al solicitante externo.
- **Fortaleza:** Excelente separación de privacidad.
- **Brechas Menores:** No existe un mecanismo formal para marcar un campo o archivo específico como "Observado para subsanación" sin devolver todo el trámite.

### F34-06. Firmas electrónicas y aprobaciones autenticadas
- **Estado:** Implementada Parcialmente / Requiere Calificación Jurídica.
- **Implementación Real:** `registerDocumentSignature` genera un registro con `tokenVerificacion` (`VERIF-XXXXXXXX`) vinculado a `solicitudId`, `documentoId` y `firmanteId`.
- **Análisis Legal (Decreto 149-2013 de Honduras):**
  - La función actual constituye una **Aprobación o Conformidad Digital Interna** basada en sesión autenticada.
  - No cumple con los requisitos de una **Firma Electrónica Avanzada** (no utiliza criptografía asimétrica PKI con certificado digital emitido por prestador de servicios de certificación acreditado, ni genera firma CAdES/PAdES embebida en el binario PDF).
  - El sistema no debe publicitarse como "Firma Electrónica Legalmente Certificada" sin advertir que opera como consentimiento electrónico institucional interno.

### F34-07. Estados y ciclo de vida documental
- **Estado:** Completa y Verificada.
- **Implementación Real:** `processWorkflowDecision` maneja transiciones ordenadas: `APROBADO` -> `Aprobada`, `RECHAZADO` -> `Rechazada`, `DEVUELTO_CORRECCION` -> `Requiere Corrección`. `reviewAttendanceJustification` valida estados permitidos en una lista blanca estricta.

### F34-08. Notificaciones y seguimiento
- **Estado:** Implementada Parcialmente.
- **Implementación Real:** Integración básica con `createUserNotification` al ingresar trámites en `submitAdministrativeRequest`.
- **Brechas:**
  1. No se emite notificación multicanal (Email/WhatsApp) automática al solicitante cuando Secretaría cambia el estado a `Requiere Corrección` o `Aprobada`.
  2. No hay agrupación de notificaciones informativas para evitar saturación de la bandeja del usuario.

### F34-09. Trazabilidad y registro de actividad
- **Estado:** Completa y Verificada.
- **Implementación Real:** `RevisionesDecisionesTramite` almacena timestamp ISO, IP del revisor, decisión y notas. Además, `logStructuredEvent` audita las operaciones en `RegistroEventos`.

### F34-10. Integridad, conservación y protección documental
- **Estado:** Requiere Mejoras.
- **Implementación Real:** Los adjuntos se almacenan como URLs de Google Drive (`https://drive.google.com/uc?id=...`).
- **Brechas:**
  1. No se calcula ni almacena el hash SHA-256 del archivo adjunto al momento de la recepción.
  2. Si un usuario sustituye el archivo en Google Drive, el sistema no detecta la alteración de la evidencia que motivó la decisión administrativa.

### F34-11. Permisos, privacidad y acceso contextual (ABAC)
- **Estado:** Completa y Verificada para Familias / Requiere Mejoras para Docentes.
- **Implementación Real:** `getStudentAbsenceJustifications` valida mediante `getGuardianStudents` que el padre sólo consulte a sus hijos vinculados, bloqueando intentos de acceso con error 403 (`AUTH_PERMISSION_DENIED`).
- **Brecha:** Los docentes no tienen un endpoint contextual para consultar las justificaciones de ausencia exclusivamente de los alumnos matriculados en sus asignaturas.

### F34-12. Integración transversal y consistencia de datos
- **Estado:** Defectuosa (Dualidad Arquitectónica).
- **Hallazgo Crítico:** Existen dos flujos independientes para excusas estudiantiles:
  1. `backend/user-service/Code.gs` (`submitStudentAbsenceJustification` y `reviewAbsenceJustification`), que escribe en `SolicitudesTramites`.
  2. `backend/academic-service/Code.gs` (`submitAttendanceJustification` y `reviewAttendanceJustification`), que escribe en `JustificacionesAsistencia` y es el **único** que actualiza `RegistrosAsistencia` a estado `Justificada = true`.
- **Impacto:** Si un padre presenta la excusa por el módulo de Secretaría/Trámites de `user-service`, la aprobación de Secretaría no actualiza las listas de asistencia del docente en `academic-service`.

---

## D. MATRIZ MAESTRA DE CARACTERÍSTICAS (CAR-F34)

| ID | Característica | Estado | Brecha Principal | Prioridad | Acción Recomendada |
|---|---|---|---|---|---|
| CAR-F34-01 | Bandeja Departamental Centralizada | Implementada Parcialmente | Sin soporte SLA ni conteo de vencimientos | P1 | Agregar métricas de antigüedad y SLA |
| CAR-F34-02 | Bandeja de Salida con Acuse de Recibo | Ausente | No registra acuses de entrega formal | P0 | Implementar tabla y servicio de envíos/entregas |
| CAR-F34-03 | Unificación de Flujo de Excusas | Defectuosa | Dualidad `user-service` vs `academic-service` | P0 | Unificar backend para que toda excusa actualice asistencia |
| CAR-F34-04 | Consulta Docente de Excusas por Asignatura | Ausente | Docente no puede ver justificaciones de sus alumnos | P0 | Crear endpoint ABAC para docentes |
| CAR-F34-05 | Hash de Integridad Criptográfica en Adjuntos | Requiere Mejoras | Adjuntos en Drive sin validación SHA-256 | P0 | Computar y almacenar SHA-256 al subir evidencias |
| CAR-F34-06 | Calificación Legal de Firmas Institucionales | Implementada Parcialmente | Tokens internos no equivalen a firma avanzada | P1 | Documentar alcance legal conforme a Dec. 149-2013 |
| CAR-F34-07 | Trazabilidad de Reasignación de Responsables | Implementada Parcialmente | No guarda historial de traspasos | P1 | Crear bitácora de reasignaciones |
| CAR-F34-08 | Notificaciones Reactivas por Cambio de Estado | Implementada Parcialmente | No dispara avisos al requerir correcciones | P1 | Conectar con `sendMultiChannelNotification` |
| CAR-F34-09 | Paginación y Filtros Multicriterio en UI | Requiere Mejoras | Búsqueda limitada en cliente | P2 | Incorporar barra de filtros reactivos |
| CAR-F34-10 | Vista Móvil Optimizada para Bandejas | Requiere Mejoras | Tablas anchas con desbordamiento horizontal | P2 | Adaptar tarjetas responsivas para smartphones |

---

## E. CRITERIOS DE ACEPTACIÓN Y CASOS DE PRUEBA

| Escenario de Prueba | Resultado Esperado | Resultado Observado | Estado |
|---|---|---|---|
| **PT-F34-01: Envío de excusa con adjunto** | Solicitud creada con ID, fecha, adjunto y estado 'Enviada' | Solicitud creada exitosamente en `SolicitudesTramites` | **Aprobado** |
| **PT-F34-02: Aislamiento IDOR Padre-Hijo** | Padre solo consulta solicitudes de sus hijos vinculados | `getGuardianStudents` bloquea con 403 a hijos no vinculados | **Aprobado** |
| **PT-F34-03: Segregación Notas Internas** | Padre no ve notas internas de Secretaría | Solo se retorna `observacionesPublicas` | **Aprobado** |
| **PT-F34-04: Sincronización con Asistencia** | Aprobación de excusa justifica inasistencia en aula | Solo ocurre si se procesa vía `academic-service`; falla si se procesa en `user-service` | **Defectuoso** |
| **PT-F34-05: Bandeja de Salida Institucional** | Emisor consulta estado de entrega y lectura del receptor | No existe endpoint de salida departamental | **No Aprobado** |
| **PT-F34-06: Consulta Docente de Justificaciones** | Docente ve excusas de sus alumnos asignados | Endpoint ausente; docente no tiene acceso a solicitudes | **No Aprobado** |
| **PT-F34-07: Integridad Criptográfica de Adjuntos** | Sustitución de archivo en Drive es detectada por hash | No se registra hash; alteración pasa inadvertida | **No Aprobado** |
| **PT-F34-08: Firma y Conformidad Digital** | Firma vincula usuario, documento y genera token verificable | Registrado en `FirmasConformidades` con token `VERIF-` | **Aprobado** |

---

## F. PLAN DE RESOLUCIÓN PRIORIZADO

### Bloque P0: Integridad, Sincronización y Acceso Seguro (Crítico)
1. **[F34-Task01] Unificación del ciclo de vida de justificaciones de asistencia y sincronización con listas de clase:**
   - Converger `submitStudentAbsenceJustification` / `reviewAbsenceJustification` con el motor de `academic-service` para que cualquier justificación aprobada por Secretaría o Dirección actualice automáticamente las sesiones y registros en `RegistrosAsistencia` (`Justificada = true`).
2. **[F34-Task02] Bandeja de salida institucional y registro de acuses de entrega y lectura:**
   - Crear el servicio `getDepartmentalOutbox` y la estructura `EntregasDocumentales` para rastrear documentos emitidos, destinatarios, fecha de entrega y fecha de lectura/apertura formal.
3. **[F34-Task03] Acceso contextual docente (ABAC) a justificaciones y resoluciones de sus estudiantes:**
   - Implementar `getTeacherStudentJustifications(payload)` permitiendo a los docentes consultar las justificaciones de estudiantes inscritos en sus secciones sin exponer expedientes ajenos ni notas administrativas privadas.
4. **[F34-Task04] Aseguramiento criptográfico de adjuntos y evidencias documentales:**
   - Registrar el hash SHA-256 de cada archivo adjunto al momento de la recepción para impedir sustituciones silenciosas en almacenamiento externo.

### Bloque P1: Automatización, Notificaciones y Distribución (Alto)
5. **[F34-Task05] Historial estructurado de asignaciones, reasignaciones y traspasos:**
   - Registrar en bitácora quién asignó el expediente, a qué responsable o departamento, con qué motivo y en qué fecha.
6. **[F34-Task06] Notificaciones multicanal reactivas por cambio de estado de trámite:**
   - Despachar avisos automatizados por correo o mensajería interna cuando una solicitud pase a `Requiere Corrección`, `Aprobada` o `Rechazada`.
7. **[F34-Task07] Delimitación y advertencia legal sobre firmas electrónicas:**
   - Incorporar en el visor de documentos y certificados la leyenda legal expresa indicando que las conformidades registradas constituyen aprobación digital institucional bajo políticas internas y señalar los trámites que requieran firma avanzada según el Decreto 149-2013.

### Bloque P2: Optimización de Interfaz y Usabilidad (Mejora)
8. **[F34-Task08] Consola unificada de bandejas con filtros avanzados y diseño responsivo:**
   - Implementar en la interfaz de Secretaría y Dirección una barra de filtros multicriterio (por fecha, estado, prioridad y estudiante) y tarjetas móviles para smartphones.

---

## G. COBERTURA CUANTITATIVA Y CONCLUSIÓN

- **Total de Subcapacidades Evaluadas:** 12 (F34-01 a F34-12)
- **Inspección de Código y Arquitectura:** 100%
- **Pruebas de Escenarios Ejecutadas:** 8
- **Distribución de Estados Funcionales:**
  - *Completa y Verificada:* 3 (25.0%)
  - *Implementada Parcialmente:* 4 (33.3%)
  - *Requiere Mejoras:* 2 (16.7%)
  - *Defectuosa:* 1 (8.3%)
  - *Ausente:* 2 (16.7%)
- **Cobertura de Verificación Satisfactoria:** 58.3%
- **Dictamen:** **NO APROBADA PARA CERTIFICACIÓN FINAL** debido a la desconexión entre la aprobación de justificaciones en `user-service` y el registro de asistencia en `academic-service`, la carencia de bandeja de salida con acuses de recibo y la falta de acceso contextual para que los docentes consulten las excusas de sus alumnos.

---

## Tareas ejecutables derivadas de los hallazgos

> Normalización de las ocho tareas descritas en el plan F (F34-Task01..F34-Task08), conservando prioridades P0/P1/P2. Se amplía la tarea de consola con las brechas CAR-F34-09/10 de filtros y móvil. Auditoria.txt registra un backlog histórico de 11 tareas, pero solo describe los ocho primeros IDs; F34-Task09..F34-Task11 no tienen título ni criterios recuperables en el informe o la bitácora. No se inventa su contenido.

### [F34-Task01] Unificar ciclo de vida de justificaciones y sincronización con asistencia
- **Hallazgo de origen:** F34-12, F34-07 y PT-F34-04; dualidad entre user-service y academic-service.
- **Severidad:** Crítica / P0. **Objetivo:** garantizar que toda justificación aprobada actualice el registro oficial de asistencia sin importar el canal de presentación.
- **Acción ejecutable:** unificar el flujo de presentación/revisión o crear una operación interservicio canónica; al aprobar, actualizar `RegistrosAsistencia` con `Justificada=true`, conservar la justificación y el evento de decisión; hacer la operación idempotente y reconciliable.
- **Archivos/módulos:** `backend/user-service/Code.gs` (`submitStudentAbsenceJustification`, `reviewAbsenceJustification`); `backend/academic-service/Code.gs` (`submitAttendanceJustification`, `reviewAttendanceJustification`); `SolicitudesTramites`, `JustificacionesAsistencia`, `RegistrosAsistencia`.
- **Dependencias/riesgos:** F33-Task01/03, AUD-NG-006 (idempotencia), AUD-NG-158 (contexto/ámbito); riesgo de doble aprobación, actualización parcial o marcar justificada una sesión incorrecta.
- **Alcance:** una fuente de verdad y sincronización de estado; no mantener dos flujos que puedan divergir ni sobrescribir correcciones históricas.
- **Criterios de aceptación:** una justificación tiene ID estable y vínculo a alumno/sesión/periodo; aprobación en cualquier interfaz actualiza asistencia; operación idempotente; rechazo/revocación conserva historial; errores generan estado reconciliable; pruebas de ambos canales, duplicados, periodos y concurrencia.
- **Prioridad:** P0. **Estado:** Pendiente.
- **Evidencia de cierre:** pendiente; PT-F34-04 falla cuando la excusa se tramita desde user-service porque no actualiza `RegistrosAsistencia`.

### [F34-Task02] Crear bandeja de salida departamental y acuses de entrega/lectura
- **Hallazgo de origen:** F34-02 y CAR-F34-02; PT-F34-05 no aprobado.
- **Severidad:** Crítica / P0. **Objetivo:** rastrear documentos enviados por Secretaría/Dirección y distinguir solicitud de envío, entrega, apertura y recepción formal.
- **Acción ejecutable:** crear `EntregasDocumentales` y `getDepartmentalOutbox` con documento, destinatario, emisor, departamento, canal, fecha, estado, acuse, hash y correlación; registrar entrega/apertura solo con evidencia verificable.
- **Archivos/módulos:** `backend/user-service/Code.gs`, `DocumentosEscolaresEmitidos`, `EntregasDocumentales`, bandejas de Secretaría/Dirección y notificaciones.
- **Dependencias/riesgos:** TASK-221/TASK-318 (bandejas), TASK-227 (eventos workflow), TASK-316 (canales); riesgo de afirmar lectura por simple apertura de enlace o exponer documentos a destinatarios equivocados.
- **Alcance:** bandeja de salida y acuses; no confundir entrega técnica con lectura humana ni con aceptación legal.
- **Criterios de aceptación:** estados diferenciados; destinatario/actor verificados; acuse con timestamp y hash del documento exacto; reintentos idempotentes; revocación/expiración de enlaces; filtros por departamento y documento; pruebas de entrega fallida, apertura, destinatario incorrecto y duplicados.
- **Prioridad:** P0. **Estado:** Pendiente.
- **Evidencia de cierre:** pendiente; no existe endpoint formal de salida ni registro de acuses.

### [F34-Task03] Implementar acceso contextual ABAC docente a justificaciones de sus estudiantes
- **Hallazgo de origen:** F34-11 y CAR-F34-04; PT-F34-06 no aprobado.
- **Severidad:** Crítica / P0. **Objetivo:** permitir al docente consultar solo justificaciones de estudiantes matriculados en sus asignaturas/secciones vigentes.
- **Acción ejecutable:** crear `getTeacherStudentJustifications` con identidad derivada de sesión verificada; validar asignación docente, oferta, grupo, periodo y relación con el estudiante; excluir notas internas y datos familiares no necesarios.
- **Archivos/módulos:** `backend/academic-service/Code.gs`, `ROLE_PERMISSIONS`, `AsignacionesDocentes`, `MatriculasEstudiantes`, justificaciones y `backend/user-service/Code.gs`.
- **Dependencias/riesgos:** AUD-NG-105/108/158, AUD-NG-217/TASK-496 cuando corresponda; riesgo de IDOR o acceso a alumnos fuera de asignación.
- **Alcance:** consulta docente de justificaciones; no habilitar acceso a expedientes completos ni observaciones internas administrativas.
- **Criterios de aceptación:** contexto se deriva del token; asignación y matrícula vigentes verificadas server-side; filtros por año/periodo; respuesta minimizada; denegación fail-closed ante relación ausente; pruebas multi-docente, sección ajena, periodo vencido y usuario manipulado.
- **Prioridad:** P0. **Estado:** Pendiente.
- **Evidencia de cierre:** pendiente; la auditoría confirma que no existe endpoint contextual docente.

### [F34-Task04] Añadir hash SHA-256 a adjuntos y evidencias documentales
- **Hallazgo de origen:** F34-10 y CAR-F34-05; PT-F34-07 no aprobado.
- **Severidad:** Crítica / P0. **Objetivo:** detectar sustituciones o alteraciones de archivos almacenados en Drive después de su recepción.
- **Acción ejecutable:** calcular SHA-256 sobre bytes del archivo al subirlo; guardar hash, tamaño, MIME, propietario, timestamp y referencia; verificar hash al consultar, descargar o incorporar el archivo a una decisión.
- **Archivos/módulos:** `backend/academic-service/Code.gs` (`uploadStudentDocument`), `backend/user-service/Code.gs`, `SolicitudesTramites`, `DocumentosEstudiante`, `FirmasConformidades` y Drive.
- **Dependencias/riesgos:** F31-Task09 (seguridad de adjuntos), F29-Task11/15 (integridad y transferencia), TASK-296 (enlaces Drive seguros); riesgo de calcular hash sobre URL/metadatos en lugar de bytes.
- **Alcance:** integridad binaria de adjuntos; no afirmar antivirus ni autenticidad del autor a partir del hash.
- **Criterios de aceptación:** SHA-256 de bytes; verificación previa a uso/descarga; discrepancia bloquea el uso y genera incidente; hash ligado al documento/versión; ACL privada; pruebas de sustitución, corrupción, archivo eliminado y re-subida legítima.
- **Prioridad:** P0. **Estado:** Pendiente.
- **Evidencia de cierre:** pendiente; los adjuntos tienen URLs privadas, pero no se calcula ni conserva hash SHA-256.

### [F34-Task05] Registrar historial de asignaciones, reasignaciones y traspasos
- **Hallazgo de origen:** F34-04 y CAR-F34-07.
- **Severidad:** Alta / P1. **Objetivo:** conocer quién asignó o reasignó cada expediente, a quién, cuándo y por qué motivo.
- **Acción ejecutable:** crear bitácora append-only de asignaciones con solicitud, actor, responsable anterior/nuevo, departamento, motivo, timestamp, estado y origen de la regla; validar que el responsable esté activo y pertenezca al ámbito; permitir revisión colegiada cuando corresponda.
- **Archivos/módulos:** `backend/user-service/Code.gs`, `processWorkflowDecision`, `updateRequestStatus`, `FlujosAprobacion`, `SolicitudesTramites` y nueva hoja `HistorialAsignacionesTramites`.
- **Dependencias/riesgos:** F30-Task08 (delegación temporal), F33-Task05 (distribución dinámica), AUD-NG-024 (identidad del revisor); riesgo de asignar a usuarios inactivos o perder trazabilidad.
- **Alcance:** historial y validación de asignaciones; no sustituir el motor de workflow ni permitir que el cliente asigne responsables arbitrarios.
- **Criterios de aceptación:** cada traspaso append-only; actor derivado de sesión; responsable activo/ámbito validado; motivo obligatorio; asignación múltiple/collegiada con reglas explícitas; pruebas de usuario inactivo, departamento ajeno, delegación vencida y reasignación concurrente.
- **Prioridad:** P1. **Estado:** Pendiente.
- **Evidencia de cierre:** pendiente; el backend permite reasignar, pero no conserva historial ni valida todos los casos de pertenencia/actividad.

### [F34-Task06] Enviar notificaciones multicanal reactivas por cambio de estado
- **Hallazgo de origen:** F34-08 y CAR-F34-08.
- **Severidad:** Alta / P1. **Objetivo:** informar al solicitante cuando el trámite requiere corrección, se aprueba o se rechaza.
- **Acción ejecutable:** conectar transiciones autorizadas del workflow con `sendMultiChannelNotification`; incluir estado, acción requerida, fecha límite y enlace seguro; agrupar notificaciones y deduplicar por solicitud/versión/estado/destinatario.
- **Archivos/módulos:** `backend/user-service/Code.gs`, `processWorkflowDecision`, `createUserNotification`, `sendMultiChannelNotification`, `SolicitudesTramites` y preferencias.
- **Dependencias/riesgos:** TASK-316 (multicanal/preferencias/reintentos), TASK-227 (eventos workflow), TASK-064 (cuotas); riesgo de revelar observaciones internas o enviar avisos duplicados.
- **Alcance:** notificación de transiciones al solicitante; no enviar notas internas ni tratar el envío como prueba de recepción.
- **Criterios de aceptación:** evento solo tras commit de transición; contenido público minimizado; deduplicación; canal según preferencias/consentimiento; reintentos y fallos visibles; pruebas de corrección/aprobación/rechazo, cambio repetido y cuota agotada.
- **Prioridad:** P1. **Estado:** Pendiente.
- **Evidencia de cierre:** pendiente; existe notificación básica al crear trámite, pero no se despachan avisos multicanal reactivos ante cambios de estado.

### [F34-Task07] Delimitar legalmente las conformidades digitales y firmas avanzadas
- **Hallazgo de origen:** F34-06 y CAR-F34-06; análisis del Decreto 149-2013 de Honduras.
- **Severidad:** Alta / P1. **Objetivo:** evitar que un token interno de aprobación se presente como firma electrónica avanzada certificada.
- **Acción ejecutable:** mostrar leyenda legal en visor/constancias que identifique la conformidad como aprobación digital institucional; clasificar trámites que exigen firma avanzada; definir integración futura con certificados PKI/CAdES/PAdES solo mediante proveedor/acreditación apropiados.
- **Archivos/módulos:** `backend/user-service/Code.gs`, `registerDocumentSignature`, `FirmasConformidades`, visor de documentos, plantillas y portal CUV.
- **Dependencias/riesgos:** F31-Task07/13, F33-Task07, F40 seguridad documental; riesgo de afirmaciones legales incorrectas o confusión entre consentimiento y firma certificada.
- **Alcance:** clasificación, advertencia y gobernanza legal; no declarar cumplimiento de firma avanzada ni implementar PKI sin análisis jurídico/técnico.
- **Criterios de aceptación:** leyenda clara y visible; catálogo de trámites con nivel de firma requerido; conformidad ligada a usuario/documento/hash; aprobación de texto por asesoría legal; rutas que requieren firma avanzada bloqueadas o derivadas al proveedor autorizado; pruebas de presentación y auditoría.
- **Prioridad:** P1. **Estado:** Pendiente.
- **Evidencia de cierre:** pendiente; la auditoría concluye que el token actual es conformidad digital interna, no firma avanzada PKI.

### [F34-Task08] Crear consola unificada de bandejas con filtros avanzados y diseño responsivo
- **Hallazgo de origen:** F34-01/F34-03 y CAR-F34-01/CAR-F34-09/CAR-F34-10.
- **Severidad:** Media / P2. **Objetivo:** ofrecer a Secretaría y Dirección una vista operativa de entradas y salidas con filtros, vencimientos y uso móvil.
- **Acción ejecutable:** unificar bandejas personales/departamentales y salida; incorporar filtros combinados por fecha, estado, prioridad, tipo, estudiante y responsable; paginación/ordenamiento server-side; indicadores SLA y tarjetas responsivas para móviles.
- **Archivos/módulos:** dashboards Secretaría/Dirección, `js/ui-common.js`, `backend/user-service/Code.gs`, `getDepartmentalWorkInbox`, `getAdministrativeRequests`, `getDepartmentalOutbox`.
- **Dependencias/riesgos:** TASK-221/TASK-318 (bandejas), TASK-279 (SLA), F33-Task04 (consola de trámites); riesgo de duplicar bandejas existentes o filtrar datos interdepartamentales.
- **Alcance:** experiencia de bandeja y filtros; no sustituir autorización server-side ni depender de filtrado solo en cliente.
- **Criterios de aceptación:** filtros combinados server-side; paginación/orden estable; SLA calculado con calendario institucional; estados de carga/error; vista móvil sin desbordamiento; permisos por rol/departamento; pruebas de volumen, accesibilidad, multirol y datos cruzados.
- **Prioridad:** P2. **Estado:** Pendiente.
- **Evidencia de cierre:** pendiente; la matriz identifica filtros limitados, ausencia de paginación/orden y tablas que desbordan en móvil.

### Reconciliaciones y discrepancias transversales de Fase 34
- **F34-Task01:** unificar la fuente de verdad de justificaciones; no mantener el flujo paralelo que deja asistencia sin actualizar.
- **F34-Task02:** la bandeja de salida y acuse de recepción no quedan cubiertos por la bandeja de entrada general TASK-221/TASK-318; coordinar, no duplicar.
- **F34-Task03:** ampliar ABAC contextual docente sin reabrir el acceso familiar ya verificado.
- **F34-Task04:** coordinar hash con F31-Task09/F40 y almacenamiento Drive; no confundir hash con antivirus.
- **F34-Task05:** coordinar historial de asignación con F30-Task08/F33-Task05; conservar evento de reasignación.
- **F34-Task06:** ampliar TASK-316/TASK-227; notificación no equivale a acuse formal.
- **F34-Task07:** distinguir conformidad interna de firma avanzada según análisis legal; no hacer declaraciones de certificación no demostradas.
- **F34-Task08:** reúne CAR-F34-09 y CAR-F34-10; no crear tareas separadas para filtros y móvil.
- **Discrepancia histórica:** Auditoria.txt indica un backlog de 11 IDs F34-Task01..F34-Task11, con prioridades P0 para 01-04, P1 para 05-09 y P2 para 10-11; el informe actual describe solo F34-Task01..F34-Task08. No se recuperaron títulos/criterios de Task09..Task11 en la bitácora. Se conservan como IDs históricos sin descripción recuperable; no se inventan ni se consulta Pendientes.md.
- **Subcapacidades completas preservadas:** F34-05/07/09 y parte de F34-11 se mantienen según el informe; no se reejecutaron pruebas.
- **Estado global:** F34-Task01..F34-Task08 permanecen pendientes de ejecución/revalidación; F34-Task09..Task11 quedan como referencias históricas sin descripción recuperable.
