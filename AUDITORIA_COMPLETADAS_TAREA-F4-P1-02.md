# Auditoría TAREA-F4-P1-02 - Motor automático de retención, archivo y anonimización

**Checkpoint:** C1.77  
**Repositorio:** i-miss-cocaine/IMA  
**Rama:** NG_beta_0.0.0.1_work  
**Fecha:** 2026-11-06  
**ID operativo de sesión:** IMA-AUDIT-20261106-1138Z (inicio C1.71; sesión abierta)

## Dictamen

**NO CUMPLE.** El motor existe únicamente en USER y no tiene ejecución programada verificable. Algunas categorías no se procesan; el archivo de expedientes y finanzas solo se contabiliza sin mover registros; la anonimización de cuentas inactivas puede ejecutarse con una fecha incorrecta, conserva identificadores y no respeta preservación legal.

La tarea está marcada [X] en completadas.md, pero la marca no acredita cumplimiento. El documento original AUDITORIA_FASE4_IDENTIDAD_PERMISOS_GOBIERNO.md, citado como fuente del hallazgo, no aparece en el árbol actual; el dictamen se limita a la descripción oficial y al código versionado.

## Evidencia inspeccionada

- backend/user-service/Code.gs SHA 12079dd410aa6d8afbce55a4bc62a79dea605f9f.
- backend/academic-service/Code.gs SHA daf1883ec0b8d4f0ff2bc673af8a4e8c5bbd03fc.
- backend/accounting-service/Code.gs SHA 38b979d41596b85e888b4a7060b37bbac0840a28.
- USER: getRetentionPolicies (2120-2150), saveRetentionPolicy (2153-2200), executeDataRetentionPolicyCheck (2203-2273), purgeStructuredLogs (7967-7989).
- No se encontró ScriptApp.newTrigger/timeBased en USER, ACADEMIC o ACCOUNTING. executeDataRetentionPolicyCheck solo aparece en el dispatcher y la función USER.

## Incumplimientos

### 1. El motor no se ejecuta automáticamente ni cubre las categorías declaradas

getRetentionPolicies define AUDIT_LOGS, USER_SESSIONS, STUDENT_EXPEDIENTS, FINANCIAL_RECORDS e INACTIVE_USERS. USER_SESSIONS no tiene rama de ejecución. STUDENT_EXPEDIENTS y FINANCIAL_RECORDS solo incrementan itemsEvaluated/itemsArchived una vez por política, sin recorrer ni archivar registros. PRESERVE_LEGAL es aceptada por saveRetentionPolicy, pero no tiene rama ejecutora. saveRetentionPolicy no valida diasRetencion como entero positivo ni restringe categoria a un catálogo conocido. No hay trigger programado ni invocación desde ACADEMIC/ACCOUNTING.

### 2. La política de bitácoras sigue sin leer el esquema real (hallazgo existente)

executeDataRetentionPolicyCheck evalúa new Date(row[0] || row[1]) y row[2] como severidad. En BitacoraEventos, row[0] es EventID, row[1] TipoEvento y row[2] ServicioOrigen. Como EventID es no vacío, se intenta parsear el ID como fecha y no el timestamp real; ServicioOrigen tampoco es severidad. La política no purga registros según antigüedad. purgeStructuredLogs elimina todas las filas de LogsSistema sin fecha de corte ni preservación legal.

**Reconciliación:** mantener este alcance en AUD-NG-145; no crear un hallazgo nuevo de bitácoras.

### 3. Anonimización productiva insegura e incompleta

En INACTIVE_USERS, lastAccess se calcula con uRows[j][12] || uRows[j][11]. El índice 12 corresponde al último acceso; el índice 11 corresponde al contador de intentos fallidos. Si no existe fecha de último acceso, el contador numérico se convierte en fecha (por ejemplo, 0 equivale al inicio de 1970), y la cuenta puede considerarse inactiva durante más de 730 días sin evidencia válida.

La operación sustituye solo nombre, correo y teléfono. El correo construido como anon_<userId>@ngca.edu conserva el identificador original; también permanecen userId, personaId, hash de contraseña y otros campos vinculables. No actualiza registros relacionados de ACADEMIC/ACCOUNTING y no consulta preservacionLegal antes de anonimizar.

**Nuevo hallazgo:** AUD-NG-220 (Alto/P1) y TASK-500 para anonimización productiva. TASK-081 cubre conjuntos de prueba, no cuentas reales.

## Reconciliación

- **AUD-NG-145:** retención de bitácoras, esquema incompatible y purga indiscriminada de LogsSistema.
- **AUD-NG-146 / TASK-499:** ampliar el motor operativo de retención/archivo; no duplicar respaldos binarios/restauración de TASK-151/152.
- **AUD-NG-220 / TASK-500:** anonimización de cuentas productivas, fecha fallback incorrecta, identificadores conservados y preservación legal ignorada.
- **TASK-081:** anonimización de datos de prueba, no producción.
- **TASK-398 / TASK-456:** archivo de trámites/documentos, no motor transversal de datos.

## Pruebas

**Ejecutadas:** inspección estática/manual, búsqueda de llamadas y triggers en los tres backends, comparación de SHA.

**No ejecutadas:** triggers, deployments, peticiones HTTP, operaciones reales de archivo/purga/anonimización, validación de legal hold, pruebas multiusuario ni suites automatizadas.

## Progreso y continuidad

- Progreso: 74/183 identificadores auditados; 109 pendientes.
- Siguiente tarea: TAREA-F4-P1-03 - Implementar la matriz dinámica de permisos y su aplicación transversal.
- Sin modificación: código fuente, completadas.md, ChangesLogs.txt y METODOLOGIA_DESARROLLO.md.
