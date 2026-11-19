# Auditoría TAREA-F4-P0-04 - Registro de intentos fallidos y protección contra ataques

**Checkpoint:** C1.75  
**Repositorio:** i-miss-cocaine/IMA  
**Rama:** NG_beta_0.0.0.1_work  
**Fecha:** 2026-11-06  
**ID operativo de sesión:** IMA-AUDIT-20261106-1138Z (inicio C1.71; sesión abierta)

## Dictamen

**NO CUMPLE.** La implementación tiene registro parcial de resultados de login y un bloqueo por cinco contraseñas incorrectas, pero no completa el contrato de bitácora requerido ni ofrece protección robusta frente a intentos paralelos y abuso del bloqueo de cuentas.

La tarea está marcada [X] en completadas.md, pero esa marca no constituye evidencia de cumplimiento. El documento original AUDITORIA_FASE4_IDENTIDAD_PERMISOS_GOBIERNO.md, citado como fuente del hallazgo, no aparece en el árbol actual; el dictamen se limita a la descripción disponible en completadas.md y a la evidencia del código versionado.

## Evidencia inspeccionada

- backend/user-service/Code.gs SHA 12079dd410aa6d8afbce55a4bc62a79dea605f9f.
- completadas.md SHA f57f1aef832e81e44fc4f7ec36a852d50e464676.
- Pendientes.md SHA 2ff2362b0e07451fb9a6895415181371019cfdc7.
- Inspección manual de loginUser (2479-2554), logoutUser (2455-2476), sanitizePayloadForLog (50-70), logStructuredEvent (327-352), getSecurityAndComplianceDashboardData (4453-4545), recordTraceabilityLog (4548-4573), registerAndDispatchEvent (4618-4698) y getPaginatedAuditLogReport (4243-4364).

## Hallazgos y comportamiento observado

### 1. Registro de login incompleto y desconectado de las bitácoras de seguridad

- loginUser registra LOGIN_FAILED y LOGIN_SUCCESS mediante logStructuredEvent. logoutUser registra LOGOUT_SUCCESS por el mismo mecanismo.
- logStructuredEvent escribe en LogsSistema (327-347), no en BitacoraEventos ni BitacoraTrazabilidad.
- getSecurityAndComplianceDashboardData obtiene eventos exclusivamente de BitacoraEventos y calcula failedLoginsCount/successfulLoginsCount desde row[2] (4458-4507). Por tanto, los registros de login que quedan en LogsSistema no alimentan esos contadores ni la lista del tablero.
- loginUser no llama a recordTraceabilityLog. Esta función escribe en BitacoraTrazabilidad (4548-4573). El nombre BitacoraTraceability usado por getPaginatedAuditLogReport no coincide con el nombre de escritura.
- registerAndDispatchEvent escribe un esquema de diez columnas diferente al DTO que getSecurityAndComplianceDashboardData y getPaginatedAuditLogReport interpretan. Esta incompatibilidad ya pertenece a AUD-NG-145 y no se crea un hallazgo duplicado.
- La entrada sin identifier o password retorna en la línea 2481 sin evento de auditoría.
- logStructuredEvent suprime los errores de escritura en catch (348-351); la operación de autenticación puede continuar aunque el registro no haya quedado persistido.
- El payload de login registra identifier y userId (2502, 2540, 2552). sanitizePayloadForLog solo enmascara claves que parecen credenciales (50-70), no correo, nombre ni identificadores personales.

**Reconciliación:** ampliar AUD-NG-145. No crear un hallazgo nuevo para la integración de bitácoras, la redacción de PII o la trazabilidad.

### 2. Protección anti-fuerza bruta insuficiente

- loginUser lee el contador en row[11], calcula currentFailed + 1 y escribe la columna 12 (2536-2539).
- Al alcanzar cinco intentos cambia directamente el estado de la cuenta a Bloqueada (2542-2545).
- No hay LockService ni sección crítica alrededor de la lectura, incremento y escritura del contador. Dos o más solicitudes simultáneas pueden leer el mismo contador y sobrescribir incrementos; esto requiere prueba concurrente para cuantificarlo, pero la ausencia de exclusión mutua es visible estáticamente.
- El umbral solo cubre contraseña incorrecta de una cuenta existente. No hay ventana temporal, espera progresiva ni limitación por origen confiable.
- El bloqueo persiste hasta una transición administrativa a Activa; el flujo loginUser no establece caducidad o recuperación automática. Cinco intentos anónimos contra una cuenta conocida pueden producir denegación de servicio.
- Las solicitudes sin credenciales retornan antes de registrar o contabilizar el intento. Los identificadores inexistentes se registran en LogsSistema, pero no se limitan por una política de frecuencia por origen.

**Nuevo hallazgo:** AUD-NG-218 (Crítico/P0), con TASK-497, limitado a atomicidad del contador y controles antiabuso. No se duplica el alcance de auditoría central de AUD-NG-145.

### 3. Estado de cuenta y logout: hallazgos existentes

- El bloqueo automático modifica directamente la hoja Usuarios y no pasa por manageAccountState ni demuestra invalidación/propagación de acct_state_. Se amplía AUD-NG-005.
- logoutUser sigue aceptando identificadores del payload sin derivar obligatoriamente el objetivo de claims verificados; ese problema ya está registrado en AUD-NG-159 y no se duplica aquí.

## Reconciliación de hallazgos

- **AUD-NG-145:** ampliar con el desacoplamiento entre LogsSistema, BitacoraEventos y BitacoraTrazabilidad, ausencia de trazabilidad de login, retorno temprano sin registro, fallo de escritura silenciado y PII sin redacción.
- **AUD-NG-005:** ampliar con el cambio automático a Bloqueada que no invalida ni propaga el estado.
- **AUD-NG-159:** mantener el alcance de logout/revocación.
- **AUD-NG-218 / TASK-497:** nuevo alcance para atomicidad, ventana, rate limiting y bloqueo abusivo.

## Pruebas

**Ejecutadas:** inspección estática/manual de funciones y referencias; comparación de SHA de los archivos consultados.

**No ejecutadas:** llamadas HTTP a deployments, pruebas reales de Sheets, concurrencia/paralelismo, medición de rate limiting, IP/origen, persistencia de bitácoras, recuperación de bloqueos, multiusuario ni suites automatizadas. No se afirma comportamiento runtime no observado.

## Progreso y continuidad

- Progreso de lista maestra: 72/183 identificadores auditados; 111 pendientes.
- Siguiente tarea oficial: TAREA-F4-P1-01 - Implementar el motor transversal de delegaciones de seguridad y permisos temporales.
- Archivos documentales de esta iteración: Auditoria.txt, MapaDependencias.md, AUDITORIA_COMPLETADAS_PLAN.md, Contexto_personal.txt, Pendientes.md y este informe.
- Sin modificación: código fuente, completadas.md, ChangesLogs.txt y METODOLOGIA_DESARROLLO.md.

## Tareas ejecutables derivadas de los hallazgos

> Derivadas de la inspección estática de TAREA-F4-P0-04. Se conserva el dictamen **NO CUMPLE** y el estado [X] de `completadas.md`. No se afirma que los intentos paralelos hayan sido reproducidos ni que el bloqueo haya sido explotado en un deployment.

### AUD-NG-145 — Integrar eventos de autenticación con bitácoras consistentes y datos saneados (ALTO)

- [ ] Definir un DTO canónico de evento de autenticación con nombres de campos, tipos, severidad, timestamp, servicio, acción, resultado, código, correlación y actor seudonimizado; usar el mismo contrato en `logStructuredEvent`, `BitacoraEventos`, `BitacoraTrazabilidad`, lectores API y UI.
- [ ] Unificar el origen persistente que consume `getSecurityAndComplianceDashboardData` con el que escribe `loginUser`/`logoutUser`; evitar que LOGIN_FAILED/LOGIN_SUCCESS queden solo en `LogsSistema` mientras el tablero lee `BitacoraEventos`.
- [ ] Conectar el login/logout a la trazabilidad requerida sin duplicar eventos ni confundir `BitacoraTrazabilidad` con `BitacoraTraceability`; documentar nombre, columnas, esquema, paginación y filtros de cada almacén.
- [ ] Registrar intentos sin identificador/contraseña y errores de validación tempranos con un resultado/código seguro, sin persistir el secreto ni permitir que la omisión de credenciales eluda las métricas antiabuso.
- [ ] Redactar o seudonimizar identificadores personales del payload (correo, nombre, userId/personaId y datos financieros); conservar solo lo necesario para correlación e investigación. No registrar contraseñas, tokens, cookies, secretos ni payloads completos.
- [ ] Eliminar el silenciamiento total de fallos de escritura en `logStructuredEvent`: aplicar una política explícita de persistencia/reintento/cola y alertar cuando un evento de seguridad no pueda almacenarse. El flujo de autenticación no debe reportar una auditoría confirmada si el evento no se persistió.
- [ ] Retirar muestras hardcodeadas y fallbacks que puedan presentarse como eventos reales; los registros sintéticos deben estar identificados inequívocamente como datos de demostración.
- [ ] Añadir pruebas de contrato para escritura/lectura del mismo evento, filtros, DTO, paginación, fallo de persistencia, datos ausentes, redacción de PII y ausencia de eventos simulados en producción.
- **Criterio de aceptación:** cada intento de autenticación produce un evento persistido, consultable y correlacionable bajo un esquema único; el tablero muestra solo datos reales y los registros no exponen credenciales ni PII innecesaria. AUD-NG-145 conserva además sus hallazgos más amplios sobre DTO/filtros/logs.

### AUD-NG-218 / TASK-497 — Hacer atómico el contador de intentos y prevenir abuso del bloqueo (CRÍTICO/P0)

- [ ] Proteger la secuencia leer-contar-escribir del contador de intentos fallidos con exclusión mutua/operación atómica apropiada para Google Apps Script y la hoja Usuarios; volver a leer el contador dentro de la sección crítica y no sobrescribir incrementos concurrentes.
- [ ] Definir el contador y los límites por cuenta con ventana temporal explícita: intentos dentro de una ventana, expiración del contador, enfriamiento progresivo y política de restablecimiento tras autenticación válida. No mantener un bloqueo permanente por cinco intentos sin recuperación definida.
- [ ] Incorporar rate limiting adicional por origen confiable y señales de abuso, sin confiar ciegamente en `X-Forwarded-For` u otros encabezados controlables por el cliente. Definir cómo se obtiene la IP/origen en el entorno real y qué hacer cuando no está disponible.
- [ ] Aplicar límites también a identificadores inexistentes y solicitudes con credenciales ausentes/malformadas, evitando que un atacante pueda eludir el control usando nombres de usuario no registrados o solicitudes incompletas.
- [ ] Evitar que un tercero pueda bloquear indefinidamente una cuenta conocida: diferenciar limitación temporal, desafío adicional y bloqueo administrativo; definir recuperación segura y notificación al titular sin revelar si una cuenta existe.
- [ ] Mantener respuestas externas genéricas que no permitan enumerar usuarios; registrar internamente códigos diferenciados y contadores seudonimizados para detectar fuerza bruta distribuida, password spraying y abuso de bloqueo.
- [ ] Definir límites configurables y auditables (umbral, ventana, enfriamiento, origen, excepciones administrativas) con valores validados; evitar valores arbitrarios o modificables desde el payload público.
- [ ] Añadir pruebas concurrentes controladas que lancen solicitudes simultáneas contra una cuenta de prueba y verifiquen que cada intento se contabiliza exactamente una vez; cubrir umbral, ventana expirada, enfriamiento, login correcto, usuario inexistente, credenciales ausentes, orígenes múltiples y recuperación.
- **Criterio de aceptación:** no se pierden incrementos concurrentes; el límite temporal funciona de forma reproducible; un tercero no puede imponer un bloqueo permanente a una cuenta ajena; y los controles limitan abuso por cuenta/origen sin filtrar existencia de usuarios.

### AUD-NG-005 — Propagar el bloqueo automático y mantener coherente el estado de cuenta (ALTO)

- [ ] Hacer que el bloqueo automático por intentos fallidos utilice la misma transición de estado autoritativa que `manageAccountState` o una operación equivalente; no escribir directamente el estado en Usuarios sin invalidar `acct_state_<userId>`.
- [ ] Emitir el evento de cambio de estado hacia los cinco microservicios y aplicar invalidación/bloqueo en sus almacenes de seguridad según el contrato y los criterios ya registrados en C1.174.
- [ ] Asegurar que el estado Bloqueada se refleje en USER, ACADEMIC, ACCOUNTING, EXAM y TASK dentro del SLA de revocación; reactivación administrativa debe retirar el bloqueo/versión obsoleta de manera controlada.
- [ ] Añadir pruebas de caché caliente/fría, bloqueo automático, propagación parcial, reintento de evento y reactivación; comprobar que no se permite una operación protegida con estado anterior cacheado.
- **Criterio de aceptación:** el bloqueo automático invalida el estado cacheado y se propaga a todos los servicios; ninguna sesión mantiene acceso después del SLA acordado.

### Reconciliación y límites

- AUD-NG-145 conserva la auditoría central, DTO, filtros, redacción y trazabilidad; este informe añade el flujo específico de eventos LOGIN/LOGOUT y su consumo por el tablero.
- AUD-NG-005 conserva invalidación/propagación del estado; este informe añade el origen de bloqueo automático por fuerza bruta.
- AUD-NG-159 conserva la autorización de logout/revocación de sesión; no se duplica aquí.
- AUD-NG-218/TASK-497 es el único identificador nuevo para atomicidad y antiabuso; no crear un hallazgo adicional para el mismo contador.
- No ejecutar pruebas runtime ni modificar código en esta iteración documental. La concurrencia, rate limiting, persistencia y recuperación quedan pendientes de verificación controlada.
