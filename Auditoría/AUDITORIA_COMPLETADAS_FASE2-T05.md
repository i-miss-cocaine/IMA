# Auditoría de tareas completadas - FASE2-T05

**Fecha:** 2026-11-05  
**Repositorio:** i-miss-cocaine/IMA  
**Rama:** NG_beta_0.0.0.1_work  
**HEAD de partida:** eddcef8ca734ba8736d975348b52e6fd28475722  
**Rama base:** NG_beta_0.0.0.1 (44d9891132332e692dbe2ba8602b41f50a508a59, sin cambios)  
**Tarea:** FASE2-T05 - Unificar y validar el sistema de identificadores institucionales  
**Estado histórico:** completadas.md conserva la marca [X]; esta auditoría verifica el código actual y no altera el registro histórico.

## Dictamen

**CUMPLE PARCIALMENTE; no satisface los criterios de aceptación.** Existen mecanismos secuenciales, una función UUID, un validador, una rutina de colisiones y un CUV documental. Sin embargo, no constituyen un sistema institucional unificado: la lógica secuencial está duplicada entre USER y ACADEMIC; los bloqueos no coordinan servicios independientes; varias escrituras académicas desactivan el bloqueo; los identificadores de personas y documentos siguen usando generadores ad hoc; el validador declara válido cualquier valor no vacío; la auditoría de colisiones cubre cuatro tablas; y las relaciones PersonaID/UserId/ExpedienteID no se verifican de forma consistente.

La emisión documental de ACCOUNTING conserva deficiencias ya registradas en C1.37/C1.32. Se mantienen TASK-118 y TASK-351 como tareas de remediación y AUD-NG-059, AUD-NG-061 y AUD-NG-161 como referencias existentes. No se crea un AUD-NG duplicado.

## Fuentes y SHAs

- completadas.md: SHA f57f1aef832e81e44fc4f7ec36a852d50e464676; FASE2-T05 aparece marcada [X] y contiene diez requisitos y ocho criterios de aceptación.
- Pendientes.md: la lectura convencional devolvió 0 caracteres; blob del HEAD SHA 4bddbc2f2198d6e144c46674b79589207f624c21, recuperado desde el objeto Git de NG_beta_0.0.0.1_work. Contenido completo: 1,609,995 caracteres y 19,154 líneas.
- backend/accounting-service/Code.gs: SHA 38b979d41596b85e888b4a7060b37bbac0840a28.
- backend/academic-service/Code.gs: SHA daf1883ec0b8d4f0ff2bc673af8a4e8c5bbd03fc.
- backend/user-service/Code.gs: SHA 12079dd410aa6d8afbce55a4bc62a79dea605f9f.
- Auditoria.txt: SHA 52605639225e886b5871f210e061ffb6f0d49029; MapaDependencias.md: SHA 02c308ab4498749901d67d204bddf4cae513e9cd.
- AUDITORIA_COMPLETADAS_PLAN.md: SHA 987965c526b797b2c5872db595c18d43acf97fb0; Contexto_personal.txt: SHA 779062120ec682b839e387c06bcb8e17a3e2797c.
- Auditorías previas: AUDITORIA_COMPLETADAS_FASE2-T03.md SHA d8d06219dff5270b0c56a4352a2f36dca97bc703; AUDITORIA_COMPLETADAS_FASE2-T04.md SHA f5c7aa7a9a8beb08b0bc1a215a058f401f5d1a7e.

## Contraste de los diez requisitos

1. **Inventario de identificadores por entidad:** parcial. Los servicios usan IDs secuenciales, timestamps, valores aleatorios, UUID y códigos CUV, pero no existe un registro autoritativo completo de tipo, propietario, ámbito, formato, vigencia y consumidores.
2. **Separación de clave interna, correlativo, identificador externo y CUV:** parcial. Se declaran algunas categorías y existe generateInstitutionalUUID, pero los contratos y persistencias no las separan uniformemente. En documentos, docId, correlativo, targetEntityId y CUV conviven en un esquema inconsistente.
3. **Permanencia de la identidad:** parcial. registerUser conserva el UserId al actualizar el perfil, pero createPerson genera PER- + Date.now(); ACADEMIC genera Persona y Usuario desde secuencias distintas y ACCOUNTING usa DOC-EM- + timestamp. No hay una regla canónica aplicada a todas las entidades críticas.
4. **Unicidad, generación y colisiones:** no cumple. USER y ACADEMIC duplican generateInstitutionalId y actualizan la misma hoja SecuenciasIDs con LockService local de cada servicio; no se acredita un bloqueo compartido entre deployments independientes. ACADEMIC admite skipLock y varias rutas lo envían aun sin adquirir un bloqueo exterior. No hay comprobación global de prefijos, entidades o referencias duplicadas.
5. **Nombres, correos y filas como identidad permanente:** parcial. UserId y PersonaID existen como columnas, pero findPersonMatches usa identificación, correo y nombre para localizar coincidencias; createPerson no verifica duplicados y linkPersonAccount no valida la existencia de la Persona ni una relación previa. El correo se consulta para evitar registros repetidos en registerUser, pero la consulta y el append no forman una sección crítica única.
6. **Relaciones entre personas, cuentas, familias, matrículas, documentos y transacciones:** no cumple. convertAdmissionToStudent genera PersonaID y UserId, escribe el expediente y utiliza el UserId para registrar matrícula, pero no crea ni comprueba una fila correspondiente en Personas/Usuarios dentro del flujo inspeccionado. registerStudentEnrollment persiste matrícula/cargos sin validar que el UserId exista en Usuarios.
7. **Referencias históricas ante desactivación o corrección:** parcial. Hay estados y registros de historial en algunos flujos, pero no existe una política transversal que preserve y valide las referencias a entidades desactivadas, fusionadas o corregidas.
8. **Detección y resolución segura de duplicados:** no cumple. auditInstitutionalIdentifierCollisions solo revisa CatalogoAsignaturas, HistorialAcademico, CalificacionesEstudiantes y OfertaAcademica, inspecciona la primera columna y reporta duplicados/vacíos; no recorre el modelo completo ni resuelve duplicados conservando relaciones e historial.
9. **Relación entre identificadores internos y CUV:** no cumple integralmente. ACCOUNTING emite docId con timestamp, correlativo y CUV por separado; el correlativo toma el máximo de todas las filas sin filtrar año. El CUV aleatorio tiene fallback por timestamp sin revalidar unicidad, y verifySchoolDocumentByCUV no comprueba duplicidad ni hash binario actual. Estos puntos ya se vinculan a TASK-118, TASK-351, AUD-NG-059 y AUD-NG-161.
10. **Minimización de datos públicos:** no cumple. verifySchoolDocumentByCUV permanece en PUBLIC_ACTIONS y devuelve datosJSON, IDs internos, URL/ID de Drive y observaciones; si hay firmas, incluye firmanteId, tokenVerificacion, ipOrigen y signatureHash. Tampoco verifica estadoDoc antes de responder success. Se mantiene TASK-351 y AUD-NG-061 para el certificado probatorio.

## Hallazgos técnicos

### USER - modelo Personas/Cuentas

- getOrCreateSheet (872-873) define Personas y Usuarios con PersonaID y UserId separados.
- createPerson (1663-1687) genera PersonaID con PER- + Date.now(), no llama al generador secuencial y no comprueba identificación/correo duplicados antes de appendRow.
- linkPersonAccount (1690-1704) verifica que exista la cuenta en Usuarios, pero escribe personaId en la columna 10 sin consultar Personas, comprobar unicidad de la relación ni conservar una validación del vínculo anterior.
- generateInstitutionalId (1706-1743) utiliza SecuenciasIDs y ScriptLock. registerUser (2393-2452) lo usa para USR-, pero la comprobación de email y el append no quedan protegidos por un mismo lock/idempotencia persistente.

### ACADEMIC - generador, validación y relaciones

- generateInstitutionalId (2107-2154) acepta skipLock desde payload. El generador lee/incrementa SecuenciasIDs y libera el lock solo si lo adquirió.
- createAdmissionRequest es una acción pública. doPost (675-676) elimina skipLock solo cuando isInternalCall es falso; ambos campos proceden del payload y no se observa validación de isInternalCall como una afirmación interna firmada. La combinación skipLock=true/isInternalCall=true permite conservar el bypass. La causa de bypass y la suite de concurrencia se reconcilian con AUD-NG-161, no se duplica.
- Además de flujos que ya mantienen un lock exterior (createAdmissionRequest y convertAdmissionToStudent), saveAdmissionDraft (1461), scheduleAdmissionInterview (1622), saveAdmissionEvaluation (1701), addToWaitlist (1786) y uploadStudentDocument (10682) llaman al generador con skipLock=true sin adquirir previamente un lock visible en esas funciones.
- convertAdmissionToStudent (2156-2380) genera Expediente, CódigoEstudiante, Persona, Usuario, RelacionFamiliar, Invitación, Matrícula y Movimiento. El PersonaID se guarda en ExpedientesEstudiantes, pero no se crea el registro Personas correspondiente. Si no se recibe userId, se genera un USR- que se entrega a registerStudentEnrollment sin crear ni validar la cuenta en Usuarios. Si el generador no devuelve generatedId, el flujo usa constantes fijas EXP-000001, STU-000001, PER-000001, USR-000001, REL-000001, INV-000001, MAT-000001 y MOV-000001; createAdmissionRequest contempla ADM-000001. Estos fallbacks no validan unicidad. La detección de expediente duplicado compara PersonaID recién generado o busca la identificación con includes en la columna Observaciones, no en un campo dedicado.
- generateInstitutionalUUID (3329-3348) fabrica un UUID v4 con Math.random(), no persiste ni verifica unicidad y no se encontró consumidor distinto del despacho del endpoint.
- validateInstitutionalIdentifier (3750-3775) identifica algunos prefijos, pero devuelve isValidFormat:true para cualquier identificador no vacío; no consulta la entidad, el estado, la unicidad ni el verificador CUV.
- auditInstitutionalIdentifierCollisions (3778-3815) solo revisa cuatro tablas y la primera columna; no detecta referencias huérfanas ni colisiones cruzadas de Personas, Usuarios, Expedientes, Matrículas, Documentos y SecuenciasIDs.

### ACCOUNTING - documentos y CUV

- getOrCreateSheet inicializa DocumentosEscolaresEmitidos con ocho encabezados (182), mientras generateSchoolDocument (15040-15149) escribe quince campos y verifySchoolDocumentByCUV lee hasta el índice 14.
- docId se forma con DOC-EM- + año + Date.now() (15083), no utiliza el generador canónico ni comprueba unicidad persistente.
- El correlativo obtiene el máximo de la columna 13 sin filtrar año (15072-15082). El CUV usa Math.random() con seis dígitos y un fallback CUV-año-timestamp que no vuelve a comprobar unicidad (15090-15104).
- verifySchoolDocumentByCUV (15151-15235) busca la primera coincidencia, no valida estadoDoc ni recalcula hash binario y expone datos personales/metadatos internos. Estos hallazgos ya están registrados en AUD-NG-059/AUD-NG-061 y TASK-351.

## Criterios de aceptación

| Criterio | Resultado | Evidencia |
|---|---|---|
| Cada entidad crítica tiene clave y regla de unicidad | Parcial | Existen claves, pero coexisten generadores secuenciales, timestamp y aleatorios sin registro autoritativo. |
| Dos personas pueden compartir nombre sin confundirse | Parcial | Hay PersonaID/UserId, pero createPerson no aplica detección de duplicados y el modelo no valida vínculos. |
| Cambiar nombre/correo no cambia identidad interna | Parcial | registerUser conserva UserId; no hay regla equivalente uniforme para todas las entidades. |
| Repetir operación no crea segunda entidad lógica | No cumple | createPerson y registerUser carecen de reserva/idempotencia transaccional integral; hay escrituras parciales. |
| Referencia inexistente/incompatible se rechaza | No cumple | Validador superficial y linkPersonAccount no comprueba Personas. |
| Relaciones sobreviven a cambios descriptivos | No cumple | El flujo de conversión puede crear referencias Persona/User sin sus registros maestros. |
| CUV detecta inexistencia o alteración | No cumple integralmente | La consulta localiza el CUV, pero no coteja hash binario, estado ni duplicidad. |
| Corrección de duplicados preserva relaciones e historial | No cumple | La rutina solo reporta cuatro tablas; no existe procedimiento integral de fusión/reconciliación. |

## Reconciliación

- Ampliar TASK-118 con duplicación del generador, alcance real de LockService, rutas académicas que omiten el lock, identidad ad hoc de Persona y documento, y referencias PersonaID/UserId/ExpedienteID que no se validan.
- Mantener TASK-351 para minimización y vigencia de la verificación pública CUV.
- Mantener AUD-NG-059 para hash SHA-256 de los bytes del documento definitivo; AUD-NG-061 para persistencia/validez del certificado probatorio; AUD-NG-161 para pruebas conductuales de colisión, bypass skipLock y concurrencia.
- No crear AUD-NG nuevo ni duplicar AUD-NG-059, AUD-NG-061 o AUD-NG-161.

## Pruebas y limitaciones

Inspección estática/manual de los bloques y funciones indicados. No se ejecutaron Apps Script, HTTP, pruebas de concurrencia real, suites automatizadas, consultas ni escrituras en Sheets/Drive productivos. No se usaron datos productivos. No se modificó código fuente ni completadas.md.

## Progreso

- Identificadores auditados: **41/183**; 142 pendientes.
- Última tarea auditada: FASE2-T05.
- Siguiente tarea: FASE2-T06 - Corregir y formalizar la concurrencia y la consistencia entre servicios. Antes de auditarla, reconciliar el alcance ya documentado en C1.33/FASE2-05 y AUD-NG-161 para no repetirlo.


### Revalidación C1.96 / TAREA-F5-001
- Se revalida TASK-118 con el código actual: convertAdmissionToStudent genera PersonaID/UserId, pero no crea ni valida registros en Personas/Usuarios; registerStudentEnrollment persiste matrícula con UserId sin verificarlo; siguen presentes fallbacks fijos y MAT/CRG timestamp/aleatorios.
- Evidencia actual: ACADEMIC Code.gs SHA daf1883ec0b8d4f0ff2bc673af8a4e8c5bbd03fc, convertAdmissionToStudent 2156-2385 y registerStudentEnrollment 12670-12755; USER Code.gs SHA 12079dd410aa6d8afbce55a4bc62a79dea605f9f.
- No se crea ID duplicado. La corrección sigue dentro de TASK-118.


---

## Tareas ejecutables derivadas de los hallazgos

> Se formalizan únicamente tareas existentes identificadas en la reconciliación de esta auditoría y en MapaDependencias.md. No se crean nuevos AUD-NG ni TASK. Las marcas históricas [X] de FASE2-T05 no equivalen a cierre técnico.

### [TASK-118] Unificar el sistema institucional de identificadores y validar relaciones
- **Hallazgo de origen:** requisitos 1..8; duplicidad de generadores USER/ACADEMIC; identidad ad hoc; relaciones PersonaID/UserId/ExpedienteID incompletas; referencias huérfanas.
- **Severidad:** Crítica. **Objetivo:** disponer de un generador institucional autoritativo y reglas verificables de identidad, unicidad, vigencia y relaciones entre entidades.
- **Acción ejecutable:** centralizar la generación de IDs y retirar generadores duplicados; impedir que flags de payload como `skipLock` o `isInternalCall` eludan el bloqueo; sustituir IDs de timestamp/aleatorios/fallback constantes en entidades críticas; validar existencia y unicidad de PersonaID/UserId/ExpedienteID y vínculos antes de persistir; ampliar auditoría de colisiones y referencias a todas las entidades críticas; establecer tratamiento de entidades desactivadas, fusionadas o corregidas.
- **Archivos/módulos:** `backend/user-service/Code.gs`; `backend/academic-service/Code.gs`; `backend/accounting-service/Code.gs`; `SecuenciasIDs`; `Personas`; `Usuarios`; `ExpedientesEstudiantes`; `Matriculas`; `DocumentosEscolaresEmitidos`.
- **Dependencias/riesgos:** coordinación entre deployments y servicios; LockService local no garantiza exclusión global entre proyectos; riesgo de referencias huérfanas, colisiones, migración de IDs históricos y escrituras parciales.
- **Alcance:** identidad institucional y relaciones; preservar claves históricas y referencias, con migración controlada y trazable.
- **Criterios de aceptación:** un único contrato de generación por tipo/entidad; ninguna ruta pública controla bypass de lock; IDs no dependen de timestamp/aleatorio/fallback constante; referencias inexistentes o incompatibles se rechazan; relaciones Persona/Cuenta/Expediente/Matrícula/Documento se verifican; auditoría detecta duplicados y huérfanos en todas las tablas acordadas; pruebas de concurrencia real, reintentos y migración.
- **Prioridad:** P0 (brechas de unicidad e integridad críticas). **Estado:** Pendiente de ejecución/revalidación.
- **Evidencia de cierre:** pendiente; la auditoría documenta generadores duplicados, rutas que omiten locks, IDs ad hoc, fallbacks fijos y relaciones no verificadas.

### [TASK-039] Vincular la huella SHA-256 a los bytes del documento definitivo
- **Hallazgo de origen:** AUD-NG-059; requisito 9; emisión y verificación CUV.
- **Severidad:** Crítica. **Objetivo:** demostrar integridad del archivo emitido y detectar alteraciones posteriores, no solo conservar un hash de metadatos.
- **Acción ejecutable:** generar/obtener el PDF definitivo; calcular SHA-256 sobre sus bytes; persistir hash asociado a versión/archivo; recuperar el binario durante verificación CUV y recalcular hash; bloquear o marcar como alterado si falta el archivo o el hash no coincide.
- **Archivos/módulos:** `backend/accounting-service/Code.gs`; `computeDocumentSHA256`; `generateSchoolDocument`; `verifySchoolDocumentByCUV`; `DocumentosEscolaresEmitidos`; almacenamiento Drive.
- **Dependencias/riesgos:** generación y custodia real del PDF; TASK-351 para estado/privacidad CUV; riesgo de confundir hash de metadatos con integridad binaria.
- **Alcance:** integridad del binario final y su versión exacta; SHA-256 no prueba por sí solo autoría ni validez legal de una firma.
- **Criterios de aceptación:** el PDF existe como archivo persistido; hash calculado sobre bytes; hash se conserva por versión; verificación vuelve a calcular y comparar; alteración, ausencia o sustitución genera rechazo/alerta; pruebas de corrupción y re-subida.
- **Prioridad:** P0. **Estado:** Pendiente de ejecución/revalidación.
- **Evidencia de cierre:** pendiente; el informe indica hash de metadatos y referencia Drive sintética, sin recálculo de bytes del PDF.

### [TASK-040] Persistir y validar el certificado de finalización y expediente probatorio
- **Hallazgo de origen:** AUD-NG-061; requisito 9; flujo de firmas y verificación CUV.
- **Severidad:** Crítica. **Objetivo:** emitir un certificado probatorio persistente y coherente con el estado real, las firmas y la versión exacta del documento.
- **Acción ejecutable:** persistir el certificado como artefacto inmutable con ID/versionado; invocar su generación al completar el flujo; determinar estado final con una máquina de estados explícita; verificar orden y estado de cada firmante; vincular certificado al hash binario y versión documental; permitir consultar su vigencia sin reconstruirlo únicamente en memoria.
- **Archivos/módulos:** `backend/user-service/Code.gs`; `generateSignatureAuditCertificate`; `registerDocumentSignature`; `FirmasConformidades`; `SolicitudesTramites`; `backend/accounting-service/Code.gs`; `verifySchoolDocumentByCUV`.
- **Dependencias/riesgos:** TASK-039 para hash del binario; TASK-351 para exposición CUV; riesgo de declarar completado un trámite pendiente/cancelado/vencido o presentar metadatos como certificado conservado.
- **Alcance:** certificado de finalización y expediente probatorio; no atribuir validez legal avanzada sin mecanismo de firma y análisis aplicables.
- **Criterios de aceptación:** certificado se crea y persiste al cumplirse condiciones de finalización; contiene secuencia/identidad/fecha/estado y hash de la versión exacta; estados Pendiente, Cancelada, Rechazada o Vencida no se etiquetan como exitosos; verificación consulta el artefacto persistido; alteración invalida comprobación.
- **Prioridad:** P0. **Estado:** Pendiente de ejecución/revalidación.
- **Evidencia de cierre:** pendiente; la auditoría detecta objeto en memoria, ausencia de persistencia y clasificación incorrecta de estados.

### [TASK-351] Restringir y minimizar la verificación pública de documentos CUV
- **Hallazgo de origen:** requisito 10; exposición en `verifySchoolDocumentByCUV`; reconciliación CUV.
- **Severidad:** Crítica. **Objetivo:** permitir verificación pública limitada sin exponer datos personales, identificadores internos, URLs de Drive, tokens ni metadatos de firma.
- **Acción ejecutable:** definir DTO público mínimo; retirar `datosJSON`, IDs internos, `driveFileId`, `driveUrl`, observaciones sensibles, `firmanteId`, `tokenVerificacion`, `ipOrigen` y `signatureHash`; verificar estado documental vigente y unicidad del CUV antes de responder; diferenciar vigente, revocado, anulado, sustituido, inexistente y alterado; registrar consultas sin filtrar secretos.
- **Archivos/módulos:** `backend/accounting-service/Code.gs`; `PUBLIC_ACTIONS`; `validateRolePermission`; `doPost`; `verifySchoolDocumentByCUV`; `DocumentosEscolaresEmitidos`; `FirmasConformidades`.
- **Dependencias/riesgos:** TASK-039/TASK-040 para integridad y certificado; política de privacidad institucional; riesgo de exposición de PII, tokens y enlaces portadores.
- **Alcance:** respuesta pública del verificador CUV; mantener datos probatorios completos solo en rutas autenticadas y autorizadas.
- **Criterios de aceptación:** respuesta pública contiene solo estado, emisor y datos mínimos aprobados; no incluye tokens, IDs internos, URL/ID Drive ni PII no necesaria; rechaza CUV duplicado, inválido o de documento no vigente; pruebas anónimas de minimización y estados.
- **Prioridad:** P0. **Estado:** Pendiente de ejecución/revalidación.
- **Evidencia de cierre:** pendiente; la auditoría documenta exposición de datosJSON, IDs, URL/Drive y datos de firma, además de ausencia de validación suficiente de estado.

### Reconciliación y límites
- **AUD-NG-059:** se mantiene en TASK-039 (integridad SHA-256 de bytes).
- **AUD-NG-061:** se mantiene en TASK-040 (certificado persistente y clasificación correcta de estados).
- **AUD-NG-161:** conserva la deficiencia de pruebas con falsos positivos; esta auditoría no recupera un ID TASK independiente para ese hallazgo, por lo que no se inventa. Sus pruebas de unicidad/concurrencia deberán coordinarse con TASK-118 y con el registro existente de AUD-NG-161.
- **TASK-118/TASK-351:** conservan identidad institucional y privacidad/verificación CUV, respectivamente.
- **Pruebas:** inspección estática/manual; no se ejecutaron Apps Script, HTTP, concurrencia real, suites automatizadas ni operaciones en Sheets/Drive productivos.
- **Estado:** FASE2-T05 cumple parcialmente; la marca histórica [X] no se interpreta como cierre de las brechas aquí documentadas.
