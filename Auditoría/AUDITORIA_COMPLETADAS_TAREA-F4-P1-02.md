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

## Tareas ejecutables derivadas de los hallazgos

> Derivadas de la inspección estática de TAREA-F4-P1-02. Se conserva el dictamen **NO CUMPLE** y el estado [X] de `completadas.md`. No se ejecutaron políticas sobre datos productivos ni se verificaron triggers/deployments.

### AUD-NG-146 — Completar el motor operativo de retención, archivo y ejecución programada (CRÍTICO)

- [ ] Convertir `saveRetentionPolicy` en un contrato validado: categoría de catálogo cerrado, `diasRetencion` entero positivo dentro de límites aprobados, zona horaria, fecha de corte, estado, ámbito de datos, legal hold y versión de política. Rechazar categorías desconocidas y valores negativos, fraccionarios o excesivos.
- [ ] Implementar ramas funcionales para todas las categorías declaradas: `AUDIT_LOGS`, `USER_SESSIONS`, `STUDENT_EXPEDIENTS`, `FINANCIAL_RECORDS` y `INACTIVE_USERS`; cada rama debe recorrer registros reales, aplicar filtros temporales correctos y reportar contadores derivados de operaciones efectivamente realizadas.
- [ ] Implementar `USER_SESSIONS` con criterios verificables de expiración/revocación y preservar la evidencia mínima necesaria para seguridad y cumplimiento; no confundir sesiones activas, revocadas y expiradas.
- [ ] Para `STUDENT_EXPEDIENTS` y `FINANCIAL_RECORDS`, sustituir los incrementos ficticios de `itemsArchived` por archivo real, paginado e idempotente. Definir destino, integridad, referencias, permisos de lectura/restauración y política de conservación; nunca eliminar datos financieros o académicos por una simulación de archivo.
- [ ] Implementar `PRESERVE_LEGAL` como una restricción ejecutable: consultar un registro autoritativo de preservación legal, bloquear purga/anonimización de elementos sujetos a retención y registrar quién aplicó o levantó la reserva, cuándo y con qué autoridad.
- [ ] Corregir la lectura de bitácoras para usar el timestamp y la severidad definidos por el DTO/esquema real de `BitacoraEventos`; no interpretar EventID como fecha ni ServicioOrigen como severidad. Coordinar el esquema con AUD-NG-145.
- [ ] Reemplazar `purgeStructuredLogs` (que elimina todas las filas de `LogsSistema`) por una purga selectiva con fecha de corte, categoría, legal hold, paginación, auditoría y retención mínima. No ejecutar purgas globales por defecto.
- [ ] Implementar triggers temporales programados con control de duplicados, exclusión mutua, idempotencia, límites de ejecución, reanudación por cursor y registro de cada corrida. Documentar propietario, zona horaria, frecuencia, instalación, actualización y desinstalación del trigger.
- [ ] Habilitar ejecución coordinada en los servicios que poseen los datos (USER, ACADEMIC y ACCOUNTING) mediante un orquestador verificable; no declarar que USER archivó registros de otro proyecto sin una operación real y confirmada.
- [ ] Añadir modo de simulación/dry-run que muestre conteos y muestras seudonimizadas, previsualización de elementos afectados y aprobación antes de operaciones irreversibles. Registrar inicio, resultado, errores, cursor y resumen de cada lote.
- [ ] Añadir pruebas controladas para cada categoría, fechas límite, zona horaria, paginación, legal hold, reanudación, reintentos, duplicados, permisos, fallo parcial y recuperación. Verificar que `itemsEvaluated`/`itemsArchived` coincidan con filas procesadas/archivadas reales.
- **Criterio de aceptación:** cada categoría realiza la operación definida sobre registros reales de prueba; la ejecución programada es observable y reanudable; el legal hold impide acciones incompatibles; ningún contador reporta archivos que no existen. No confundir el motor de retención con respaldos binarios/restauración de TASK-151/152.

### AUD-NG-145 — Alinear retención de bitácoras con el esquema y las garantías de auditoría (ALTO)

- [ ] Integrar el motor de retención con el DTO canónico y la fuente persistente de eventos definida en el bloque C1.175; leer timestamp, tipo, severidad y servicio desde sus columnas/campos correctos.
- [ ] Definir periodos de conservación diferenciados por clase de evento y obligación legal; excluir eventos sujetos a legal hold y conservar trazabilidad de cada purga.
- [ ] Asegurar que la purga no elimine registros de `LogsSistema` sin fecha de corte, clasificación y autorización; manejar filas malformadas en cuarentena en lugar de interpretarlas como antiguas.
- [ ] Añadir pruebas con timestamps válidos/ausentes, EventID no temporal, severidades, límites de fecha, legal hold, datos corruptos y consulta posterior del registro de purga.
- **Criterio de aceptación:** la retención elimina o archiva solo eventos que superan el plazo autorizado, preserva evidencia bajo legal hold y mantiene coherencia entre escritura, lectura, panel y auditoría de purga.

### AUD-NG-220 / TASK-500 — Corregir anonimización de cuentas productivas y preservar obligaciones legales (ALTO/P1)

- [ ] Corregir la selección de `lastAccess`: utilizar exclusivamente el campo/columna de último acceso definido por el esquema; si falta o es inválido, no sustituirlo por el contador de intentos fallidos ni inferir antigüedad desde un número. Marcar el registro para revisión o aplicar una política explícita de dato desconocido.
- [ ] Definir y validar el criterio de inactividad con fecha confiable, umbral aprobado, zona horaria y exclusiones; distinguir cuenta sin último acceso, cuenta nunca activada, cuenta suspendida y cuenta inactiva.
- [ ] Consultar `preservacionLegal` antes de anonimizar y comprobar obligaciones académicas, financieras, fiscales, contractuales y de auditoría. Un legal hold activo debe impedir la anonimización de campos/registros protegidos hasta su levantamiento autorizado.
- [ ] Diseñar una transformación de anonimización real: retirar o sustituir nombre, correo, teléfono, userId/personaId y otros identificadores directos o indirectos según el alcance legal; no generar `anon_<userId>@...` ni conservar el identificador original en un campo visible.
- [ ] Resolver las referencias cruzadas de ACADEMIC y ACCOUNTING para evitar que los registros relacionados reidentifiquen al titular o queden huérfanos. Definir qué datos deben conservarse por obligación y cuáles pueden anonimizarse, seudonimizarse o eliminarse.
- [ ] Si se necesita conservar correlación, usar un token aleatorio/pseudónimo sin derivación reversible pública y almacenar la tabla de correspondencia separada, cifrada y con acceso restringido; documentar el procedimiento de destrucción de esa correspondencia cuando sea legalmente posible.
- [ ] Ejecutar la operación en lotes idempotentes con dry-run, aprobación, snapshot/backup verificado, bitácora de cambios y plan de rollback cuando la operación sea reversible. Nunca procesar masivamente sin vista previa y límites de seguridad.
- [ ] Añadir pruebas con fecha ausente, fecha inválida, contador alto, último acceso reciente/antiguo, legal hold, usuario con historial académico/financiero, relaciones cruzadas, reintento y fallo parcial. Verificar que el proceso no usa la columna de intentos como fecha ni conserva identificadores prohibidos.
- **Criterio de aceptación:** solo se anonimiza una cuenta cuya inactividad esté demostrada y no tenga preservación legal incompatible; los identificadores directos/indirectos se tratan conforme a política, y los registros relacionados mantienen integridad sin permitir reidentificación no autorizada.

### Reconciliación y límites

- AUD-NG-146 mantiene motor de retención/archivo; TASK-151/152 continúan siendo responsables de respaldos binarios, integridad y restauración, sin sustituir la retención lógica.
- AUD-NG-145 mantiene DTO, filtros, privacidad y trazabilidad de logs; aquí se amplía su lectura/purga conforme al esquema real.
- AUD-NG-220/TASK-500 es el alcance nuevo para anonimización de cuentas productivas; TASK-081 se limita a datos de prueba y TASK-398/TASK-456 a trámites/documentos.
- No se crean otros IDs. No se modifican código, pruebas, estados maestros ni datos productivos en esta iteración documental.
