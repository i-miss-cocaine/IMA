# Informe de auditoría - Lote F2

**Fecha:** 2026-11-04  
**Repositorio:** i-miss-cocaine/IMA  
**Rama de trabajo:** `NG_beta_0.0.0.1_work`

## Alcance

Se revisaron REQ-EXP-016 a REQ-EXP-019, incluyendo cambios posteriores en USER, DEVELOPER, ACADEMIC y las interfaces de docente/desarrollador. Revisión estática, sin pruebas productivas.

## REQ-EXP-016 - Noticias institucionales
**Estado: Cumple parcialmente.** El backend permite crear y consultar noticias, y el rol Secretaría aparece en la matriz. Sin embargo, existe una segunda declaración de `getNews` que devuelve `noticias`, mientras las interfaces esperan `data`; el renderizador espera estado `Activo` y `fechaExpiracion`, pero el backend usa `Activa` y `fechaFin`. El formulario no envía audiencia, grado, sección ni fechas de vigencia, por lo que las publicaciones se crean globales y sin expiración. La consulta pública no filtra audiencia cuando no recibe grado/sección. Además, el frontend compara `Secretaria` y el backend define `Secretaría`. Hallazgo AUD-NG-143.

## REQ-EXP-017 - Health checks
**Estado: Cumple parcialmente.** El cliente mide latencia round-trip mediante ping, pero solo monitoriza USER, ACADEMIC, TASK y EXAM. USER/ACADEMIC tienen ping; TASK/EXAM no. DEVELOPER no tiene ping y su `getServiceHealthDiagnostics` devuelve PASS fijo. ACCOUNTING tiene ping, pero no está monitorizado y su URL es placeholder. Hallazgo AUD-NG-144.

## REQ-EXP-018 - Logs estructurados
**Estado: Cumple parcialmente.** USER/ACADEMIC persisten eventos en LogsSistema y enmascaran credenciales. Pero el viewer envía filtros con nombres distintos a los que el backend lee y espera campos españoles mientras el backend devuelve inglés. La sanitización no enmascara PII ni datos financieros. DEVELOPER/`getCentralizedLogs` devuelve dos registros de muestra hardcodeados y el botón de resolver no persiste nada; developer.js también muestra fallback logs ficticios. Hallazgo AUD-NG-145.

## REQ-EXP-019 - Respaldos y restauración
**Estado: Cumple parcialmente.** ACADEMIC tiene `createSystemBackup`, `listSystemBackups`, `verifyBackupIntegrity` y `restoreSystemBackup`. Sin embargo, el checksum es un hash aritmético de 32 bits, no SHA-256; la validación usa una condición que acepta cualquier checksum no vacío; restore no llama a verifyBackupIntegrity; el UI envía `confirmationCode` y omite `confirmed`, aunque el backend exige `confirmCode` y `confirmed`. No se encontraron triggers programados ni política de retención. El panel developer.js usa wrappers USER que no corresponden a acciones backend y muestra un backup ficticio como exitoso. Hallazgo AUD-NG-146.

## Tareas derivadas

- AUD-NG-143: corregir contrato de noticias, audiencia, vigencia y permisos de Secretaría.
- AUD-NG-144: completar health checks ping-pong para todos los microservicios reales.
- AUD-NG-145: conectar bitácora central real, filtros y sanitización de datos sensibles.
- AUD-NG-146: completar respaldo seguro: SHA-256 real, validación previa, restauración y retención.

## Pruebas y límites

No se ejecutaron pruebas de interfaz, ping de servicios, sanitización ni restauración real. La revisión se limita a código versionado y no demuestra estado de despliegue en Apps Script.

## Continuidad

- REQ-EXP-016 a REQ-EXP-019 inspeccionadas.
- No se modificó código fuente, `completadas_legacy.md` ni `ChangesLogs.txt`.
- Siguiente lote: G (REQ-EXP-020 en adelante y tareas DOC).
