# AUDITORÍA DE CUMPLIMIENTO — TAREA-F5-001

**Checkpoint de producto:** C1.96  
**Fecha:** 2026-11-06  
**Repositorio:** i-miss-cocaine/IMA  
**Rama:** `NG_beta_0.0.0.1_work`  
**HEAD de partida:** `b8853d63f36ee38cae39c950501ab74a819fbc33`  
**Tree SHA de partida:** `61dfa7bbf5bd31afafafeea1e53c21215ef743f0`  
**Rama base:** `NG_beta_0.0.0.1`  
**HEAD de rama base:** `44d9891132332e692dbe2ba8602b41f50a508a59`  
**Diferencia:** 158 commits adelante, 0 detrás.  
**ID operativo de sesión/chat:** `IMA-AUDIT-20261106-1644Z` (esta sesión inició en C1.86; C1.87-C1.92 intermedios; C1.93-C1.95 fueron checkpoints metodológicos de otras sesiones; C1.96 es la auditoría de producto actual).

**Dictamen: NO CUMPLE.** Aunque los criterios de aceptación aparecen marcados [x], el flujo actual no crea/valida los registros maestros de Persona/Usuario, puede conceder una relación familiar verificada sin prueba de titularidad, permite bypasses de documentos/capacidad desde el payload y marca la solicitud como convertida antes de completar matrícula/cargos/documentos.

## 1. Alcance y fuentes

`completadas.md` (SHA `f57f1aef832e81e44fc4f7ec36a852d50e464676`, líneas 1824-1858) marca TAREA-F5-001 como [X], severidad Crítico, con 12 requisitos y 14 criterios de aceptación marcados.

`ChangesLogs.txt` (SHA `d57cf4bd861b5c3720e60cf83241ed804ff645d9`, líneas 1566-1578) declara que se reestructuró convertAdmissionToStudent con validación de estado, capacidad, LockService, IDs institucionales, transferencia de tutor, cargos, idempotencia y auditoría.

La fuente `AUDITORIA_FASE_5_ADMISIONES_PORTAL_FAMILIAS.md` no está en el árbol actual. Se consultaron los informes históricos `AUDITORIA_COMPLETADAS_FASE2-T05.md` y `AUDITORIA_COMPLETADAS_FASE2-T06.md` para reconciliar TASK-118, AUD-NG-129 y AUD-NG-161; no se duplican esos hallazgos.

## 2. Evidencia inspeccionada

| Archivo | SHA | Bloques |
|---|---|---|
| `backend/academic-service/Code.gs` | `daf1883ec0b8d4f0ff2bc673af8a4e8c5bbd03fc` | PUBLIC_ACTIONS 265; ROLE_PERMISSIONS 168-224; doPost 640-695; createAdmissionRequest 984-1095; convertAdmissionToStudent 2156-2385; checkEnrollmentCapacity 11026-11115; getStudentDocuments 10708-10795; registerStudentEnrollment 12670-12755. |
| `backend/user-service/Code.gs` | `12079dd410aa6d8afbce55a4bc62a79dea605f9f` | headers Personas/Usuarios/RelacionesFamiliares 872-890; createLinkInvitation/acceptLinkInvitation 3334-3425; getGuardianStudents 3470-3550. |
| `backend/accounting-service/Code.gs` | `38b979d41596b85e888b4a7060b37bbac0840a28` | Se comprobó que convertAdmissionToStudent no llama al servicio ACCOUNTING. |
| `tests/regression/academic-grading-suite.js` | `3433b707edd4a2f35c68368a3172932adc2a3b32` | Búsqueda dirigida de conversión/compensación. |
| `tests/regression/modular-dashboard-suite.js` | `0495e1d526a872c33310935a003a83d924d34683` | Búsqueda dirigida de conversión/compensación. |

## 3. Hallazgos

### 3.1. La relación familiar puede quedar verificada sin demostrar titularidad (ampliación AUD-NG-036)

`createAdmissionRequest` está en `PUBLIC_ACTIONS` (Academic 265), por lo que la solicitud puede ser enviada sin sesión. El campo emailContacto procede del formulario y no hay verificación de propiedad del correo.

Durante la conversión, si ese correo coincide con una cuenta de Usuarios, se crea una fila en RelacionesFamiliares con estado `Verificada` directamente (Academic 2280-2305), sin token, confirmación ni prueba de que el titular del correo sea el responsable legal. `getGuardianStudents` entrega vínculos con estado Verificada/Activa/Aprobada (USER 3470-3550), por lo que el vínculo puede conceder acceso a esa cuenta.

Existe una ruta con token `createLinkInvitation`/`acceptLinkInvitation` (USER 3334-3425), pero convertAdmissionToStudent la evita para cuentas existentes. Para correos sin cuenta, genera un token y lo guarda en InvitacionesVinculacion, pero no lo envía ni lo devuelve al responsable. No se encontró la directiva MANDATORY_TUTOR_TOKEN_VERIFICATION. Se amplía AUD-NG-036.

### 3.2. La solicitud se marca Convertida antes de terminar matrícula/cargos/documentos (nuevo AUD-NG-232)

La función escribe estado `Convertida` y expedienteId en SolicitudesAdmision antes de migrar documentos y llamar a registerStudentEnrollment (Academic 2320-2350). Después registra MovimientosEstudiante. Si registerStudentEnrollment o el append de movimientos falla, el estado ya permanece Convertida. No hay catch de compensación ni rollback; el finally solo libera el lock (2385).

En el reintento, la primera condición devuelve `isAlreadyConverted` con expedienteId y no reanuda matrícula, cargos, documentos o movimiento. La migración de documentos captura errores y continúa, pudiendo devolver success con documentos no vinculados. La matrícula y los cargos se escriben en operaciones separadas (registerStudentEnrollment 12670-12755), problema ya cubierto parcialmente por AUD-NG-129.

### 3.3. Flags del payload pueden omitir estado, documentos y capacidad (nuevo AUD-NG-233)

`allowIncompleteOverride` se combina con la constante opcional y se evalúa por truthiness (2169). No se encontró definición de `ALLOW_INCOMPLETE_ADMISSION_CONVERSION`; la excepción dinámica institucional no está implementada. Un string `"false"` es truthy y permite pasar la validación de estado y documentos, incluso para solicitudes que no están Admitida.

`forceCapacityOverride` se evalúa también por truthiness (2198-2200/Academic 11090). Está disponible a los roles que pueden convertir, incluyendo Secretaría, sin permiso separado, motivo ni política institucional verificada.

La validación documental solo filtra filas existentes con estado Pendiente/Rechazado (2180-2184). Si no hay documentos, la respuesta no tiene documents o faltan tipos obligatorios, la función no detecta la ausencia y continúa.

`checkEnrollmentCapacity` (11026-11115) usa capacidad 35 y estado Activa cuando no encuentra una fila en OfertaAcademica (11043-11045), y no aborta si `tryLock(5000)` devuelve false (11035-11038). Por tanto, la disponibilidad no falla cerrada ante oferta no configurada o lock no adquirido.

### 3.4. Registros maestros e identificadores siguen incompletos (revalidación TASK-118)

La conversión genera targetPersonaId y targetUserId, pero no inserta ni valida las filas correspondientes en Personas/Usuarios. Pasa targetUserId a registerStudentEnrollment sin comprobar que exista en Usuarios. Conserva fallbacks fijos EXP-000001/STU-000001/PER-000001/USR-000001/REL-000001/INV-000001/MAT-000001/MOV-000001; createAdmissionRequest contempla ADM-000001. registerStudentEnrollment usa MAT-Date.now y CRG-Date.now-random. Esto ya está documentado en TASK-118/FASE2-T05; se revalida sin duplicar.

### 3.5. Matrícula/cargos y monto inicial no cumplen la configuración institucional (ampliación AUD-NG-129)

Si no existe MONTO_MATRICULA_2026/MONTO_MATRICULA_ORDINARIA o el valor resulta cero, el flujo asigna 1500 como importe predeterminado (Academic 2331-2340), contradiciendo el requisito de no utilizar importes arbitrarios.

registerStudentEnrollment está expuesta como acción a Director, Subdirector, Secretaría, Secretaria y Contador (ROLE_PERMISSIONS 168-224), pero no verifica cupos ni adquiere lock propio; la ruta escribe matrícula y cargos por separado. Se amplía AUD-NG-129. El timeout de checkEnrollmentCapacity se reconcilia también con AUD-NG-179, y las pruebas de concurrencia con AUD-NG-161.

### 3.6. No hay pruebas específicas (ampliación AUD-NG-161)

No se encontraron pruebas para conversión, reintento tras fallo, documento obligatorio ausente, overrides, verificación de tutor, sección no configurada ni compensación en los dos archivos regression revisados. Se amplía AUD-NG-161.

## 4. Reconciliación de hallazgos existentes

- **AUD-NG-036:** vínculo familiar verificado sin token/identidad comprobada.
- **AUD-NG-129:** unificación matrícula/cargos, monto institucional y control de cupos.
- **TASK-118:** Persona/Usuario, IDs y referencias maestras.
- **AUD-NG-161:** pruebas reales de concurrencia/reintentos.
- **AUD-NG-179:** fallo de adquisición de lock no debe continuar como éxito; revalidado en checkEnrollmentCapacity.
- No se duplican estos hallazgos.

## 5. Tareas ejecutables derivadas de los hallazgos

### TASK-512 — AUD-NG-232: Hacer recuperable la conversión distribuida de admisión
- **Hallazgo:** la solicitud queda Convertida antes de terminar matrícula/cargos/documentos/movimiento; una falla deja estado parcial y el reintento retorna como completado sin reanudar.
- **Severidad:** Alta (P1).
- **Objetivo:** asegurar que una conversión solo se considere completa cuando todas sus entidades y efectos hayan quedado persistidos, y que una falla pueda reanudarse o compensarse.
- **Acciones concretas:** implementar máquina de estados por etapa; persistir IDs de expediente/matrícula/cargo/movimiento; comprobar cada resultado; no marcar Convertida hasta completar; implementar saga/compensación; hacer que la migración documental falle cerrada; registrar eventos de antes/después por etapa.
- **Archivos/módulos:** backend/academic-service/Code.gs; SolicitudesAdmision; ExpedientesEstudiantes; DocumentosEstudiante; Matriculas; CargosEstudiante; MovimientosEstudiante.
- **Dependencias/riesgos:** AUD-NG-129, TASK-118, AUD-NG-161; riesgo de duplicados y expedientes parcialmente activos.
- **Alcance:** conversión completa, reintentos, recuperación y auditoría de cada etapa.
- **Criterios de aceptación:** fallos inyectados después de expediente, relación, documento, matrícula, cargo y movimiento; cada reintento completa o compensa sin duplicados; nunca devuelve success con etapas incompletas; el estado final y los IDs quedan persistidos.
- **Prioridad/estado:** P1 · Pendiente.
- **Evidencia de cierre requerida:** pruebas automatizadas de fallo/reintento, historial de etapas y verificación de datos antes/después.

### TASK-513 — AUD-NG-233: Aplicar controles estrictos de documentos, capacidad y excepciones
- **Hallazgo:** flags del payload permiten omitir estado, documentos y capacidad; documentos ausentes pasan; una oferta inexistente se trata como capacidad 35/Activa.
- **Severidad:** Alta (P1).
- **Objetivo:** impedir que el cliente decida excepciones y asegurar que la admisión falle cerrada cuando no pueda comprobar requisitos o cupos.
- **Acciones concretas:** mover overrides a política de servidor; exigir booleanos estrictos; registrar motivo/actor/autoridad; validar todos los tipos documentales obligatorios; abortar si no existe OfertaAcademica; abortar si LockService no se adquiere.
- **Archivos/módulos:** backend/academic-service/Code.gs; getStudentDocuments; checkEnrollmentCapacity; configuración institucional.
- **Dependencias/riesgos:** AUD-NG-036, AUD-NG-129, AUD-NG-161; riesgo de admisiones sin requisitos o sobrecupo.
- **Alcance:** estado de solicitud, documentos, capacidad y autorización de excepciones.
- **Criterios de aceptación:** strings como "false" se rechazan como tipos inválidos; ausencia de documentos/configuración/hoja falla cerrada; solo rol autorizado y política institucional puede aplicar excepción; todas las excepciones dejan evidencia.
- **Prioridad/estado:** P1 · Pendiente.
- **Evidencia de cierre requerida:** pruebas de estado no admitido, documentos ausentes/rechazados, flags mal tipados, sección no configurada, timeout y matriz de permisos.

## 6. Pruebas y límites

**Ejecutado:** inspección estática de solicitud pública, permisos de conversión, generación de IDs, vínculos, validación documental, capacidad, matrícula/cargos, estados, rutas de invitación y pruebas regression.

**No ejecutado:** Apps Script runtime, ejecución real de conversión, pruebas de correo/token, fallo inyectado, concurrencia, consulta de datos productivos, ni suites automatizadas. No se modificó código ni pruebas.

## 7. Resultado y continuidad

- **Dictamen:** NO CUMPLE.
- **Progreso:** 90/183 identificadores auditados; 93 restantes.
- **Última tarea auditada:** C1.96 / TAREA-F5-001.
- **Siguiente tarea exacta:** TAREA-F5-002 — Implementar una máquina de estados y reglas de transición para las solicitudes.
- **Archivos documentales actualizados:** AUDITORIAS/Auditoria.txt, AUDITORIAS/Auditoría.txt (copia histórica), AUDITORIAS/MapaDependencias.md, AUDITORIAS/AUDITORIA_COMPLETADAS_PLAN.md, AUDITORIAS/Contexto_personal.txt, informes históricos FASE2-T05/T06 y este informe.
- **Archivos preservados:** código fuente, pruebas, completadas.md, ChangesLogs.txt, METODOLOGIA_DESARROLLO.md, Pendientes.md (sin modificar) y copias raíz ya retiradas por el checkpoint C1.95.
- **Commit de cierre:** el commit que contiene este checkpoint; SHA final se verifica después de publicar.

## 8. Normalización de tareas ejecutables y ampliaciones verificadas (C1.194)

Esta sección amplía las tareas 5.1 y 5.2 ya definidas arriba. No sustituye ni duplica sus identificadores. Los hallazgos se cotejaron de nuevo contra los blobs actuales de ACADEMIC y USER; las brechas siguen presentes.

### 8.1. Tarea existente ampliada — AUD-NG-036: identidad y vínculo familiar verificable
- **Referencia:** hallazgo 3.1; convertAdmissionToStudent crea RelacionesFamiliares con estado Verificada por coincidencia de email; para correo sin cuenta almacena token pero no lo entrega. getGuardianStudents confía en los estados Verificada/Activa/Aprobada. La ruta existente acceptLinkInvitation no exige siempre _verifiedUserId, pues admite userIdResponsable del payload como alternativa.
- **Severidad/prioridad:** Crítica / P0 (conservar la clasificación vigente de AUD-NG-036).
- **Objetivo:** impedir que la coincidencia de un correo declarado por un tercero conceda acceso familiar. Separar la verificación de titularidad de la cuenta de la acreditación/autorización del vínculo legal.
- **Archivos/módulos afectados:** backend/academic-service/Code.gs (convertAdmissionToStudent, permisos y router); backend/user-service/Code.gs (createLinkInvitation, acceptLinkInvitation, getGuardianStudents); servicio de notificaciones y hoja InvitacionesVinculacion.
- **Dependencias:** TASK-512 para la orquestación recuperable de conversión; AUD-NG-161 para pruebas; contrato de identidad autenticada del servicio USER.
- **Acciones ejecutables:**
  1. Eliminar la creación automática de relaciones con estado Verificada basada únicamente en email coincidente. La conversión debe crear una invitación pendiente o una relación provisional sin permisos sensibles.
  2. Para cuentas existentes y nuevas, emitir una invitación de un solo uso por canal verificado. No guardar tokens sin entregar ni devolverlos al flujo de admisión como si el vínculo estuviera completado.
  3. En acceptLinkInvitation, exigir identidad autenticada derivada de _verifiedUserId; resolver el correo desde el registro USER autenticado y no confiar en userIdResponsable/userEmail suministrados por el cliente.
  4. Comprobar token, destinatario, vencimiento, estado y expediente; consumir el token y crear el vínculo como una operación idempotente y serializada. Un fallo al crear el vínculo no debe dejar la invitación consumida sin una recuperación explícita.
  5. Mantener separadas la prueba de control del correo/cuenta y la verificación de patria potestad, tutela o autorización legal cuando la política institucional requiera esa evidencia. Un token de email no demuestra por sí solo la relación jurídica.
  6. Aplicar mínimo privilegio a los permisos de la relación y auditar emisor, destinatario autenticado, expediente, alcance concedido, evidencia y fecha; no registrar tokens en bitácoras.
- **Alcance explícito:** vínculo tutor-estudiante originado durante la conversión y aceptación de invitaciones; no rediseñar el portal familiar completo.
- **Criterios de aceptación:** coincidencia de email sin token nunca produce estado Verificada ni acceso; aceptación sin identidad autenticada falla; correo autenticado distinto al destinatario falla; token vencido/reutilizado falla; reintentos no duplican relaciones ni consumen invitaciones incorrectamente; la verificación de vínculo legal se acredita separadamente cuando corresponda.
- **Estado:** Pendiente. Ampliación documental; sin implementación ni pruebas runtime.

### 8.2. Tarea existente ampliada — AUD-NG-129: matrícula, cargos y monto institucional
- **Referencia:** hallazgos 3.2 y 3.5; registerStudentEnrollment escribe/actualiza Matriculas y luego inserta cargos sin lock propio ni transacción recuperable; genera MAT- por timestamp y CRG- por timestamp/aleatorio; la detección de cargo existente compara usuario y concepto sin ámbito de matrícula/período. La conversión usa 1500 como fallback cuando no encuentra monto institucional y el endpoint registerStudentEnrollment está permitido a roles que no tienen necesariamente el flujo de admisión/capacidad.
- **Severidad/prioridad:** Alta / P1 (conservar la clasificación vigente de AUD-NG-129).
- **Objetivo:** unificar la matrícula inicial y sus cargos en un flujo idempotente, con autorización, capacidad y parámetros institucionales validados en servidor.
- **Archivos/módulos afectados:** backend/academic-service/Code.gs (convertAdmissionToStudent, registerStudentEnrollment, checkEnrollmentCapacity, ROLE_PERMISSIONS); hojas Matriculas, CargosEstudiante, OfertaAcademica, ParametrosInstitucionales y SecuenciasIDs.
- **Dependencias:** TASK-512 para recuperación multi-etapa; TASK-513 y AUD-NG-179/TASK-477 para capacidad/lock; TASK-118 para IDs; AUD-NG-161 para pruebas.
- **Acciones ejecutables:**
  1. Definir un único servicio de dominio para registrar matrícula y cargos; aplicar autorización por operación y no permitir que una acción legacy omita validación de capacidad o controles requeridos.
  2. Verificar que userId existe, está activo y corresponde al expediente/Persona antes de matricular. No crear matrículas huérfanas.
  3. Adquirir bloqueo válido o utilizar un mecanismo de reserva/operación idempotente; serializar la comprobación de duplicados y escrituras de matrícula/cargos. No continuar si falla el control de concurrencia.
  4. Persistir una clave de idempotencia y una relación explícita entre cada cargo, matrícula, usuario y período. Evitar deduplicar solo por userId + concepto, que puede confundir cargos de períodos distintos; actualizar la instantánea de cargos durante el lote.
  5. Sustituir IDs timestamp/aleatorios por el generador institucional canónico, sin fallback fijo ni identificadores no verificados.
  6. Obtener el monto desde parámetros institucionales vigentes y validados. Si no existe, es inválido o es cero cuando cero no está permitido, abortar y solicitar configuración; eliminar el fallback arbitrario de 1500.
  7. Definir recuperación/compensación para fallos entre matrícula y cargos; la respuesta no puede declarar éxito mientras falte una etapa.
- **Alcance explícito:** matrícula y cargos generados por admisión; conservar separadas las tareas de pagos, contabilidad y emisión documental ya asignadas a otros IDs.
- **Criterios de aceptación:** no existe matrícula sin usuario/expediente válido; reintentos no duplican matrícula ni cargos; cargos de distintos períodos no se colisionan; falla de lock no escribe; falta de parámetro no genera importe inventado; fallo entre escrituras deja operación recuperable y no un éxito parcial; los permisos y cupos se comprueban en todas las rutas públicas.
- **Estado:** Pendiente. Ampliación documental; sin implementación ni pruebas runtime.

### 8.3. Tarea existente ampliada — TASK-118: identidad maestra y generación institucional de IDs
- **Referencia:** hallazgo 3.4; la conversión genera PersonaID/UserId pero no crea ni comprueba las filas correspondientes en Personas y Usuarios; conserva fallbacks fijos para EXP/STU/PER/USR/REL/INV/MAT/MOV y la matrícula usa IDs timestamp/aleatorios.
- **Severidad/prioridad:** Alta / P1 (conservar clasificación vigente de TASK-118).
- **Objetivo:** garantizar identidad persistente y referencias válidas antes de crear expediente, matrícula, relación familiar o documento.
- **Archivos/módulos afectados:** backend/academic-service/Code.gs (generateInstitutionalId, convertAdmissionToStudent, registerStudentEnrollment); backend/user-service/Code.gs (generadores y operaciones Personas/Usuarios); hojas Personas, Usuarios, ExpedientesEstudiantes, RelacionesFamiliares, Matriculas, CargosEstudiante y SecuenciasIDs.
- **Dependencias:** AUD-NG-161; TASK-512; AUD-NG-036 y AUD-NG-129.
- **Acciones ejecutables:**
  1. Establecer el orden canónico de creación/recuperación de Persona y Usuario; crear o localizar las entidades maestras mediante claves verificadas y evitar crear duplicados.
  2. No utilizar IDs generados como si fueran registros maestros existentes. Confirmar persistencia y lectura de Persona/Usuario antes de insertar el expediente o matrícula.
  3. Eliminar fallbacks constantes y los generadores timestamp/Math.random de las entidades cubiertas. Si el generador no devuelve un ID válido, abortar antes de cualquier escritura dependiente.
  4. Unificar el contrato de generación, prefijos, unicidad y control de concurrencia entre servicios; los locks locales de proyectos Apps Script diferentes no deben presentarse como exclusión mutua global.
  5. Verificar tipo, existencia, estado y pertenencia de cada referencia PersonaID/UserId/ExpedienteID antes de persistir relaciones y matrículas.
  6. Mantener trazabilidad entre identidad original, cuenta, expediente y migraciones; las fusiones/correcciones deben conservar referencias históricas.
- **Alcance explícito:** identidades Persona/Usuario y referencias creadas por conversión/matrícula; no duplicar TASK-351/AUD-NG-059/AUD-NG-061 sobre CUV, hash y certificados.
- **Criterios de aceptación:** cada PersonaID/UserId utilizado corresponde a una fila maestra única y válida; no hay IDs fijos ni temporales en rutas críticas; fallo de generación no deja registros huérfanos; pruebas de colisión/concurrencia entre productores; integridad referencial verificable antes y después de la conversión.
- **Estado:** Pendiente. Ampliación documental; sin implementación ni pruebas runtime.

### 8.4. Tarea existente ampliada — AUD-NG-161: pruebas conductuales de admisión, matrícula y recuperación
- **Referencia:** hallazgo 3.6 y verificación de hallazgos 3.1-3.5; búsqueda dirigida en tests/regression/academic-grading-suite.js y tests/regression/modular-dashboard-suite.js no encontró casos de convertAdmissionToStudent, TASK-512, TASK-513, overrides, invitaciones, capacidad o matrícula.
- **Severidad/prioridad:** conservar clasificación vigente de AUD-NG-161.
- **Objetivo:** reemplazar verificaciones nominales por pruebas aisladas que ejecuten operaciones reales simuladas y validen efectos persistidos, fallos y reintentos.
- **Archivos/módulos afectados:** tests/regression/academic-grading-suite.js, tests/regression/modular-dashboard-suite.js o suite específica tests/regression/admission-conversion-suite.js; fixtures ACADEMIC/USER.
- **Dependencias:** contratos de TASK-512, TASK-513, AUD-NG-036, AUD-NG-129, TASK-118 y AUD-NG-179/TASK-477.
- **Acciones ejecutables:** crear fixtures de solicitud admitida/no admitida, tutor con cuenta/sin cuenta, documentos completos/ausentes/rechazados/inaccesibles, oferta configurada/ausente/cerrada, usuario/Persona existente/ausente, cargos previos y parámetros monetarios; inyectar fallos después de cada etapa; ejecutar reintentos y dos operaciones concurrentes; probar booleanos y tipos inválidos en overrides; comprobar permisos y token; validar hojas y bitácora antes/después.
- **Alcance explícito:** pruebas conductuales aisladas de los flujos de conversión y matrícula; no afirmar que las suites actuales son suficientes por contener nombres de funciones o cadenas.
- **Criterios de aceptación:** cada caso afirma estado final, filas y relaciones creadas, IDs, cargos, documentos, invitaciones, auditoría y ausencia de duplicados; incluye fallos de lock, fallos parciales y pérdida de respuesta; fixtures no tocan datos productivos y se limpian aun ante error; la suite falla ante un resultado incorrecto y comunica el caso concreto.
- **Estado:** Pendiente. Ampliación documental; no se ejecutaron suites.

### 8.5. Tarea existente ampliada — AUD-NG-179 / TASK-477: fallo cerrado ante timeout de lock
- **Referencia:** hallazgo 3.3; checkEnrollmentCapacity llama tryLock(5000) sin comprobar el booleano y continúa calculando cupos/retorna status success aunque no haya adquirido el lock. El informe FASE2-T06 ya asigna este defecto a AUD-NG-179/TASK-477.
- **Severidad/prioridad:** Alta / P1 (conservar clasificación vigente).
- **Objetivo:** evitar decisiones de capacidad basadas en lecturas no serializadas y prevenir que una operación declare éxito tras no adquirir su bloqueo requerido.
- **Archivos/módulos afectados:** backend/academic-service/Code.gs (checkEnrollmentCapacity, convertAdmissionToStudent, createStudentEnrollment); pruebas de concurrencia.
- **Dependencias:** TASK-513 para política de capacidad y oferta; AUD-NG-129 para matrícula; AUD-NG-161 para pruebas conductuales; TASK-118 para bypasses de lock.
- **Acciones ejecutables:**
  1. Comprobar el resultado de cada adquisición tryLock; si devuelve false, abortar con error/código de conflicto explícito antes de leer o escribir datos que requieran sección crítica.
  2. Definir una separación clara entre función pública que adquiere lock y helper interno que opera bajo un lock ya adquirido, evitando depender de re-adquisiciones implícitas o de un skipLock controlado por el cliente.
  3. Permitir omisión de lock solo en llamadas internas cuya procedencia se autentique en el servidor; no confiar en isInternalCall o skipLock enviado libremente por el payload.
  4. Garantizar releaseLock en finally y que el resultado diferencie cálculo completado, conflicto por lock, oferta no configurada y error de lectura.
  5. Coordinar la validación de capacidad con la escritura de matrícula para que no exista una ventana entre consulta de cupo y confirmación.
- **Alcance explícito:** fallo de adquisición y consistencia del cálculo de cupos en ACADEMIC; la ausencia de oferta y capacidad predeterminada se remedia bajo TASK-513, sin duplicar ese alcance.
- **Criterios de aceptación:** tryLock=false nunca produce respuesta success ni permite escrituras; bypass cliente rechazado; dos conversiones simultáneas no superan capacidad; lock liberado ante excepciones; respuesta de conflicto permite reintento seguro; pruebas verifican estado real de hojas.
- **Estado:** Pendiente. Ampliación documental; sin implementación ni pruebas runtime.

### 8.6. Matriz final de asignación sin duplicados
- Hallazgo 3.1 → ampliar AUD-NG-036; pruebas bajo AUD-NG-161; orquestación bajo TASK-512.
- Hallazgo 3.2 → TASK-512; escrituras matrícula/cargos bajo AUD-NG-129; identidad y IDs bajo TASK-118.
- Hallazgo 3.3 → TASK-513 y AUD-NG-179/TASK-477; no crear otra tarea de cupos/lock.
- Hallazgo 3.4 → TASK-118; no crear otro ID de identidad.
- Hallazgo 3.5 → ampliar AUD-NG-129; no crear una segunda tarea de matrícula/cargos.
- Hallazgo 3.6 → ampliar AUD-NG-161; no crear una tarea de pruebas paralela.
- **Identificadores nuevos creados en C1.194:** ninguno. Se conservan TASK-512/TASK-513 ya registrados y se formalizan ampliaciones a cinco tareas existentes.
- **Resultado:** exclusivamente documental. No se cambió código ni pruebas; ningún hallazgo se declara resuelto.

