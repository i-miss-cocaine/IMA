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
