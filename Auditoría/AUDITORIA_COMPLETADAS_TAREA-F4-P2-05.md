# AUDITORÍA DE CUMPLIMIENTO — TAREA-F4-P2-05

**Checkpoint:** C1.190  
**Fecha:** 2026-11-07  
**Repositorio:** i-miss-cocaine/IMA  
**Rama:** `NG_beta_0.0.0.1_work`  
**HEAD de partida verificado:** `6ee8aa685011b86ce92e425c335cbc8500c1326e`  
**Tree SHA de partida verificado:** `b76e7bf7a83952b5890610311fdbd6898cb8cc13`  
**Rama base:** `NG_beta_0.0.0.1`  
**HEAD de rama base:** `44d9891132332e692dbe2ba8602b41f50a508a59`  
**Diferencia:** 257 commits adelante, 0 detrás.  
**ID operativo de sesión/chat:** `IMA-AUDIT-20261107-0025Z` (inicio C1.189; cierre C1.190; sesión cerrada; identificador operativo, no ID nativo de ChatGPT).

**Dictamen: NO CUMPLE.** Los tres documentos existen y contienen las secciones declaradas en ChangesLogs, pero publican plazos y capacidades que no coinciden con los valores por defecto ni con la ejecución real del sistema. La tarea de documentación no puede considerarse completa mientras la política afirme que existen mecanismos automáticos que no están implementados.

## 1. Alcance y fuentes

`completadas.md` (SHA `f57f1aef832e81e44fc4f7ec36a852d50e464676`, líneas 1791-1795) marca TAREA-F4-P2-05 como [X], severidad Medio, archivos `politica-de-privacidad.html`, `politica-de-uso.html` y `politica-financiera.html`.

`ChangesLogs.txt` (SHA `d57cf4bd861b5c3720e60cf83241ed804ff645d9`, líneas 1763-1769) declara:
- 6 meses para bitácoras.
- 30 días para sesiones.
- anonimización tras 2 años de cuentas inactivas.
- conservación permanente de expedientes académicos y registros financieros.
- derechos ARCO.
- sincronización RBAC/ABAC en política de uso.

La fuente original `AUDITORIA_FASE4_IDENTIDAD_PERMISOS_GOBIERNO.md` no está en el árbol. El análisis contrasta el contenido publicado con los defaults y handlers versionados; no constituye opinión legal sobre los plazos que exige la legislación hondureña.

## 2. Evidencia documental

| Documento | SHA | Declaraciones |
|---|---|---|
| `politica-de-privacidad.html` | `8854bae3021e1cdde288709e3fa411b3d6da20c7` | Sección 3 RBAC/ABAC (50); sección 4 retención (52-59); sección 5 ARCO (62-68). |
| `politica-de-uso.html` | `ca252904e9f7ad7301d1793ed07585a92a4c060f` | Sección 7 RBAC/ABAC, retención y ARCO (61-62). |
| `politica-financiera.html` | `bb75dc6b72098b825a18025781346b4252fe33cf` | Conservación permanente de registros financieros/contables (41-42). |

## 3. Contraste con el sistema

### 3.1. Bitácoras: 180 días publicados frente a 365 días por defecto (AUD-NG-145)

La política de privacidad indica 6 meses/180 días para AUDIT_LOGS (línea 55); la política de uso repite 6 meses (línea 62). `getRetentionPolicies` inicializa AUDIT_LOGS en 365 días (USER 2129-2131). El valor de producción depende de la hoja `PoliticasRetencionDatos`, cuyo contenido no está en el repositorio y no fue consultado.

Además, `executeDataRetentionPolicyCheck` interpreta columnas incompatibles con el esquema actual de BitacoraEventos (USER 2218-2237), y `purgeStructuredLogs` elimina todas las filas de LogsSistema sin aplicar antigüedad, preservación legal ni política por categoría (USER 7967-7989). Esto permanece cubierto por AUD-NG-145.

### 3.2. Sesiones: 30 días publicados frente a 90 días por defecto y sin ejecución (AUD-NG-146)

La política publica 30 días para USER_SESSIONS (privacy:56), mientras el default del motor es 90 días (USER 2130-2131). `executeDataRetentionPolicyCheck` no contiene una rama para USER_SESSIONS; no hay trigger time-based ni mecanismo de ejecución periódica en USER, ACADEMIC o ACCOUNTING.

No se encontró una hoja/registro persistente de sesiones que el motor pueda purgar. El token se emite como JWT firmado y la revocación usa CacheService; estos mecanismos no equivalen a un registro de sesiones con retención de 30 días. Se amplía AUD-NG-146.

### 3.3. Expedientes académicos y registros financieros: permanente publicado frente a defaults 10/7 años (AUD-NG-146)

La política de privacidad indica conservación permanente de STUDENT_EXPEDIENTS y FINANCIAL_RECORDS (líneas 58-59); la política financiera repite permanencia legal (línea 42). Los defaults del motor son 3650 días (10 años) para expedientes y 2555 días (7 años) para finanzas, ambos con acción ARCHIVE (USER 2132-2133).

El ejecutor no archiva registros ni mueve datos: para ambas categorías solo incrementa `itemsEvaluated` e `itemsArchived` una vez por política (2254-2257). Se amplía AUD-NG-146/TASK-499. No se afirma cuál sea la obligación legal correcta; el hallazgo es la inconsistencia interna entre documentos y defaults/implementación.

### 3.4. Cuentas inactivas: 730 días declarados, pero anonimización incompleta (AUD-NG-220)

El plazo de 730 días coincide con el default INACTIVE_USERS (USER 2134). Sin embargo, la ejecución usa `uRows[j][12] || uRows[j][11]` como lastAccess (2244-2246). loginUser guarda el contador de intentos fallidos en columna 12 y el último acceso en columna 13 (2507-2508, 2537-2538). Si falta la fecha de último acceso, el contador numérico se convierte en fecha, pudiendo tratar la cuenta como antigua desde 1970.

La rutina solo sustituye nombre, correo y teléfono (2247-2249); conserva userId, personaId, hash de contraseña y relaciones académicas/financieras. No aplica legal hold por registro. Se revalida AUD-NG-220/TASK-500.

### 3.5. Derechos ARCO: módulo anunciado sin interfaz ni ejecución (AUD-NG-223)

La política anuncia un módulo para acceso, rectificación, cancelación/exportación y oposición (privacy:62-68). USER tiene handlers para registrar una solicitud, consultar solicitudes y cambiar su estado (1986-2117), pero no ejecuta acceso/exportación, rectificación, eliminación ni oposición. No hay panel ARCO ni archivo de UI dedicado en el árbol; solo existe la página informativa de privacidad.

Se amplía AUD-NG-223/TASK-503; no se crea ID duplicado.

### 3.6. RBAC/ABAC: afirmación documental más amplia que el enforcement actual (AUD-NG-222)

La política de privacidad (50) y la política de uso (62) afirman controles RBAC/ABAC rigurosos. La auditoría C1.79 ya documentó validadores contextuales divergentes y caminos fail-open en los cinco microservicios. Se revalida AUD-NG-222 sin duplicar.

## 4. Reconciliación

- **AUD-NG-145:** plazos y purga de bitácoras.
- **AUD-NG-146/TASK-499:** defaults, categorías, ejecución/archivo, falta de trigger y USER_SESSIONS.
- **AUD-NG-220/TASK-500:** fecha de inactividad, anonimización incompleta y preservación legal.
- **AUD-NG-222/TASK-502:** enforcement RBAC/ABAC.
- **AUD-NG-223/TASK-503:** panel y ejecución efectiva de derechos ARCO.
- No se crea ningún AUD-NG ni TASK nuevo.

## 5. Tareas ejecutables derivadas de los hallazgos

Se conserva el dictamen **NO CUMPLE** y los IDs existentes. La normalización no implementa ni cierra vulnerabilidades.

### [AUD-NG-145] Corregir bitácora central, sanitización, trazabilidad y retención

- **Hallazgo:** AUD-NG-145. La política publica 180 días para AUDIT_LOGS frente al default USER de 365; el motor interpreta columnas incompatibles con BitacoraEventos; purgeStructuredLogs elimina LogsSistema sin antigüedad ni preservación. También hay DTO/filtros desalineados, fuentes de trazabilidad inconsistentes, logs simulados y sanitización incompleta de PII.
- **Prioridad:** Alto/P1.
- **Acción ejecutable:** definir esquema canónico versionado para LogsSistema, BitacoraEventos y BitacoraTrazabilidad; alinear escritores, lectores, DTO y filtros; retirar muestras ficticias; paginar desde la consulta; sanitizar PII, RTN, cuentas, identificadores, mensajes y errorDetails; corregir el motor de retención para leer columnas reales y aplicar reglas por fuente/categoría, fecha, severidad y legal hold; eliminar la purga indiscriminada; reconciliar los plazos publicados con la política aprobada y la configuración productiva; escapar contextualmente los datos renderizados en UI.
- **Archivos:** USER, ACADEMIC, DEVELOPER Code.gs; js/developer.js, js/api.js, js/ui-common.js; LogsSistema, BitacoraEventos y BitacoraTrazabilidad.
- **Aceptación:** esquema y DTO únicos; filtros/paginación reales; ningún log ficticio; sanitización probada en todos los campos; retención por fuente idempotente y con legal hold; ausencia de borrado global; plazos aprobados y configuración efectiva documentados; pruebas de esquema, filtros, PII, retención, errores y XSS.
- **Estado:** Pendiente. AUD-NG-145 conserva su identificador; no se crea duplicado.

### [AUD-NG-146 / TASK-499] Implementar retención y archivo real, validado y programado

- **Hallazgo:** AUD-NG-146/TASK-499. USER_SESSIONS no se procesa; STUDENT_EXPEDIENTS y FINANCIAL_RECORDS solo incrementan contadores sin archivar; se aceptan días/categorías inválidos; PRESERVE_LEGAL no se ejecuta; no hay triggers time-based. La política promete 30 días para sesiones frente al default 90, y conservación permanente de expedientes/finanzas frente a defaults de 10/7 años.
- **Prioridad:** AUD-NG-146 Crítico; TASK-499 P1.
- **Acción ejecutable:** validar categorías, días positivos y acciones; implementar ejecución real para USER_SESSIONS, STUDENT_EXPEDIENTS y FINANCIAL_RECORDS; archivar datos y relaciones con metadatos, permisos de solo lectura y consulta histórica; aplicar legal hold por registro; separar logs (AUD-NG-145), respaldos (TASK-151/152), archivo Drive (TASK-456) y trámites (TASK-398); programar triggers reales con lotes reanudables, exclusión mutua, idempotencia y reportes; conciliar plazos con PoliticasRetencionDatos. No atribuir defaults a producción sin leer la hoja.
- **Archivos:** USER, ACADEMIC y ACCOUNTING Code.gs; PoliticasRetencionDatos y repositorios de sesiones/expedientes/finanzas.
- **Aceptación:** ejecución demostrable por categoría; USER_SESSIONS tratado según política aprobada; itemsArchived coincide con registros archivados; legal hold respetado; relaciones/metadatos preservados; triggers auditables; lotes reanudables sin duplicación/pérdida; pruebas de fallos, concurrencia, archivo y consulta histórica.
- **Estado:** Pendiente.

### [AUD-NG-220 / TASK-500] Corregir anonimización de cuentas inactivas

- **Hallazgo:** AUD-NG-220/TASK-500. Si falta lastAccess, se usa failedAttempts como fecha; solo se cambian nombre/correo/teléfono, conservando userId, personaId, hash y relaciones; no se verifica preservación legal ni se coordinan los servicios académicos/financieros.
- **Prioridad:** Alto/P1.
- **Acción ejecutable:** usar solo fechas válidas de último acceso/creación; nunca convertir failedAttempts en fecha; enviar a revisión registros sin fecha confiable; consultar legal hold; transformar irreversiblemente identificadores directos/indirectos; conservar integridad referencial con pseudónimos estables o correspondencia separada, cifrada y restringida cuando sea legalmente necesaria; coordinar USER/ACADEMIC/ACCOUNTING e invalidar sesiones/cachés; auditar sin exponer PII.
- **Archivos:** USER, ACADEMIC y ACCOUNTING Code.gs; Usuarios y relaciones académicas/financieras.
- **Aceptación:** sin fecha confiable no hay anonimización automática; failedAttempts nunca se usa como fecha; legal hold excluye registros; no hay reidentificación desde campos operativos; relaciones consistentes; pruebas de fechas ausentes/inválidas, legal hold, reidentificación, sesiones y fallos parciales.
- **Estado:** Pendiente.

### [AUD-NG-222 / TASK-502] Centralizar autorización contextual RBAC/ABAC fail-closed

- **Hallazgo:** AUD-NG-222/TASK-502. La política afirma controles RBAC/ABAC rigurosos, pero los cinco microservicios conservan validadores divergentes y rutas fail-open; no existe contrato común para relaciones familiares, asignaciones docentes, áreas y ámbitos.
- **Prioridad:** Alto/P1.
- **Acción ejecutable:** definir contrato contextual versionado por acción/recurso; derivar identidad desde claims verificados; validar relaciones familiares activas, asignaciones docentes, áreas y ámbitos; no confiar en IDs/contexto de autorización del cliente; aplicar política antes del handler en USER, ACADEMIC, ACCOUNTING, TASK y EXAM; denegar ante atributos requeridos ausentes, errores de lectura, fuentes no disponibles o contratos inválidos; mantener excepciones administrativas explícitas y auditadas.
- **Archivos:** USER, ACADEMIC, ACCOUNTING, TASK y EXAM Code.gs y pruebas/contratos de integración.
- **Aceptación:** pruebas positivas/negativas de estudiante propio/ajeno, familiar vinculado/no, docente asignado/no, coordinador dentro/fuera de ámbito, campos ausentes, hoja ausente/vacía y error de lectura; política equivalente en cinco servicios; no hay bypass por payload incompleto ni error de consulta.
- **Límites:** AUD-NG-105/106/108/128/130/136/217 y AUD-NG-002 conservan superficies específicas; AUD-NG-160 cubre vigencia/cachés; AUD-NG-221/TASK-501 cubre dimensiones de matriz.
- **Estado:** Pendiente.

### [AUD-NG-223 / TASK-503] Implementar panel y flujo end-to-end de derechos ARCO

- **Hallazgo:** AUD-NG-223/TASK-503. USER registra solicitudes y cambia estados, pero no ejecuta acceso/exportación, rectificación, eliminación ni oposición/restricción; no existe panel de titular/representante ni bandeja administrativa; faltan datos de titular representado, verificación, evidencia, plazo, decisión y resultado.
- **Prioridad:** Alto/P1.
- **Acción ejecutable:** implementar panel de titulares/representantes y bandeja autorizada; distinguir solicitante, titular y representante, verificar identidad/vínculo/alcance; registrar tipo, alcance, recepción, responsable, plazo, estado, decisión, sistemas afectados, operaciones y evidencia; definir máquina de estados y prohibir Completada sin resultado verificable. Ejecutar ACCESO/EXPORTACIÓN sin datos de terceros; RECTIFICACIÓN con integridad referencial; ELIMINACIÓN con legal hold y conservación; OPOSICIÓN/RESTRICCIÓN con aplicación o decisión motivada. Asegurar autorización contextual, minimización de PII y coherencia entre política e implementación. La interpretación legal de plazos/excepciones requiere aprobación competente.
- **Archivos:** USER Code.gs, js/ui-common.js, dashboards autorizados, politica-de-privacidad.html, SolicitudesDerechosPrivacidad e integraciones necesarias.
- **Aceptación:** panel de titular y bandeja administrativa; representación verificada; aislamiento por titular; transiciones auditadas; Completada exige evidencia; cinco derechos con ejecución real; legal hold respetado; fallos no reportados como éxito; pruebas de titular/representante, permisos, exportación, estados y fallos parciales.
- **Dependencias:** AUD-NG-222/TASK-502 autorización; AUD-NG-145 trazabilidad/sanitización; AUD-NG-146/TASK-499 retención/legal hold; AUD-NG-220/TASK-500 anonimización.
- **Estado:** Pendiente.

## 6. Pruebas y limitaciones

**Ejecutadas:** inspección de las tres políticas y secciones citadas; cotejo estático con USER Code.gs y handlers de retención/anonimización/ARCO; búsqueda de triggers en USER/ACADEMIC/ACCOUNTING; búsqueda de UI/dashboards para ARCO; reconciliación de AUD-NG-145/146/220/222/223 y TASK-499/500/502/503 con Auditoria.txt, MapaDependencias.md, plan y Pendientes.md restaurado; lectura de reglas 15-17 de METODOLOGIA_DESARROLLO.md; verificación de HEAD/árbol y SHAs documentales.

**No ejecutadas:** lectura de hoja productiva PoliticasRetencionDatos, ejecución del motor/triggers, acceso a datos reales, pruebas productivas de purga/anonimización, panel ARCO en navegador, validación legal externa, despliegues Apps Script ni suites automatizadas. No se modificaron código, políticas legales ni pruebas. No se afirma comportamiento runtime.

## 7. Resultado y continuidad

- **Dictamen:** NO CUMPLE (preservado).
- **Progreso:** 86/183 identificadores auditados; 97 pendientes. La normalización documental no incrementa el conteo.
- **Última tarea normalizada:** TAREA-F4-P2-05.
- **Siguiente tarea exacta:** TAREA-F4-P3-01 - Implementar informes periódicos de revisión de privilegios y cuentas.
- **Archivos modificados en esta iteración:** este informe y `AUDITORIAS/Contexto_personal.txt`.
- **Archivos no modificados:** código fuente, pruebas, Pendientes.md, completadas.md, Auditoria.txt, MapaDependencias.md, AUDITORIA_COMPLETADAS_PLAN.md, ChangesLogs.txt, METODOLOGIA_DESARROLLO.md, políticas legales y rama base.
- **Publicación:** un único commit consolidado, árbol construido sobre el árbol completo verificado del HEAD de partida.
- **Commit de cierre:** el commit que contiene este checkpoint.

