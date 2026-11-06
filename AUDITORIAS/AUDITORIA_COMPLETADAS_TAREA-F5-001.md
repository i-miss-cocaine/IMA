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
