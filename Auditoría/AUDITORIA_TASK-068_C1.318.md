# INFORME DE AUDITORÍA PREIMPLEMENTACIÓN — TASK-068 (C1.318)

- Sesión: IMA-EXEC-20261109-1650Z-01; checkpoint inicial C1.317.
- Repositorio: i-miss-cocaine/IMA; rama NG_beta_0.0.0.1_work; HEAD auditado 5adf18921f8dd59e05e7f5af6210c48370273af7.
- Rama base protegida: NG_beta_0.0.0.1 @ 44d9891132332e692dbe2ba8602b41f50a508a59.
- Fase PM-01; prioridad P0; orden local 1.
- Requisito íntegro: `pendientes/Dirección/Pendientes.md`, bloque TASK-068.
- Expediente principal único: este informe; no existía informe anterior de TASK-068 en el tree auditado.

## 1. Selección y dependencias
PM-00 está cerrado en los registros vigentes: TASK-637, TASK-638 y TASK-639 aparecen completadas. TASK-068 es P0, orden local 1, dependencia declarada ninguna y base para tareas consumidoras. TASK-636 continúa en ejecución por bloqueo externo de integración, pero no es dependencia declarada de TASK-068 ni se encontró dependencia técnica que impida auditar esta tarea sin tocar sus recursos.

## 2. Requisitos íntegros revisados
1. Hoja persistente CorrespondenciaIdentificadores con 13 campos y unicidad compuesta (sistemaOrigen, tipoEntidad, idOriginalLegado, institucionId).
2. Resolución bidireccional y múltiples referencias externas por registro interno.
3. Coincidencias exactas mediante identificadores confiables; clasificación de confirmada, probable, insuficiente y posible duplicado.
4. Prohibición de fusionar personas por nombre; revisión humana de ambigüedades y conservación de decisiones/IDs originales.
5. Idempotencia de reimportaciones.
6. Criterios: reimportación sin duplicados, múltiples IDs externos, homónimos independientes, revisión humana, bitácora, integridad de relaciones y demostración con al menos dos fuentes.

## 3. Alcance inspeccionado y respaldo Git
- backend/user-service/Code.gs — SHA ac3fe79e26cc9855272409e7169d68e77f53bbab; dispatcher, ROLE_PERMISSIONS, validación RBAC, getOrCreateSheet, findPersonMatches (1641–1683), createPerson (1685–1710), linkPersonAccount (1712–1726), generateInstitutionalId (1728–1765), auditAndReconcileIdentityInconsistencies (4173–4262).
- backend/accounting-service/Code.gs — SHA 38b979d41596b85e888b4a7060b37bbac0840a28; dispatcher, validación RBAC e importDataWithColumnMapping (15360–15414).
- js/persistence.js — SHA 94ac26feb4f7f31f1f3f2a238e164d23be565d94; IndexedDB DB_VERSION 4 y stores.
- js/api.js — SHA d0190f86060f109129a1d59a779cb5dbf82f8ab9.
- tests/regression/academic-grading-suite.js — SHA a22cb3ef376fe09e65c1b17c2f4f5125290bfba6.
- Auditoría/MapaDependencias.md — SHA cbd7e9b5632aebdd127e0dfb5bb86c7cc22d75db.
- Árbol Git recursivo: 1.098 entradas, truncated=false. No hay informe previo TASK-068.

## 4. Estado observado
- No existe hoja/esquema CorrespondenciaIdentificadores ni resolvers resolveInternalIdFromLegacy, resolveLegacyIdFromInternal, resolveUserByLegacyId; tampoco resolveCrossReferenceIdentifier en Accounting-Service.
- findPersonMatches busca identificación exacta, email exacto o nombre completo normalizado; no clasifica ambigüedad con fecha de nacimiento, responsables o historial. No se observó fusión automática.
- createPerson genera PersonaID local sin referencias externas.
- linkPersonAccount cambia Usuarios.PersonaID directamente, sin historial de decisión.
- auditAndReconcileIdentityInconsistencies solo trata delegaciones y adscripciones huérfanas.
- importDataWithColumnMapping solo valida presencia de identificador, cuenta filas y registra AuditoriaMigraciones; no inserta/actualiza entidades, no consulta correspondencias y no garantiza reimportación idempotente.
- IndexedDB DB_VERSION 4 no incluye store de identidades/correspondencias.
- No hay pruebas específicas de TASK-068 en la suite inspeccionada.

## 5. Hallazgos
### AUD-NG-377 — CRÍTICO/P0 — Ausencia de fuente central y resolución bidireccional
Evidencia: blobs de User-Service/Accounting-Service anteriores; no hay hoja ni resolvers. Impacto: IDs legados no se relacionan de forma persistente, con riesgo de duplicación y referencias inconsistentes. Defecto dentro de TASK-068; sin tarea derivada.

### AUD-NG-378 — CRÍTICO/P0 — Importador sin correspondencias ni persistencia idempotente
Evidencia: Accounting-Service importDataWithColumnMapping líneas 15360–15414 solo cuenta filas y registra auditoría. Impacto: no acredita migración ni reimportación sin duplicados. Defecto dentro de TASK-068; sin tarea derivada.

### AUD-NG-379 — ALTO/P1 — Vinculación sin historial de decisión
Evidencia: User-Service linkPersonAccount líneas 1712–1726 cambia PersonaID sin bitácora append-only de actor, motivo, referencia externa y decisión. Impacto: trazabilidad incompleta. Defecto dentro de TASK-068; sin tarea derivada.

## 6. Restricciones de seguridad
- Nombre/email/similitud no serán claves únicas de persona.
- Solo identificadores de origen confiables, entidad e institución coincidentes y ausencia de conflicto permiten confirmar automáticamente.
- Coincidencias ambiguas quedan pendientes; revisión por Secretaría/Administrador con identidad verificada.
- Unicidad compuesta bajo LockService; conflictos se rechazan, nunca se sobrescriben.
- Decisiones append-only; se preservan IDs originales y no se fusionan personas automáticamente.
- Importación debe fallar cerrada si no puede resolver/registrar correspondencia. No declarar migración exitosa por la mera presencia de un identificador.
- Caché local no será fuente de verdad.

## 7. Plan de implementación
1. Contrato persistente y validación de cabeceras; bitácora append-only; rechazar esquemas incompatibles.
2. Alta idempotente bajo lock y resolvers bidireccionales.
3. Clasificación de coincidencias; datos no exclusivos solo generan candidatos de revisión.
4. Revisión/vinculación restringida por claims verificados, con actor, fecha, motivo y valores anterior/nuevo.
5. Integración de importador con resolver y persistencia real; si falta contrato de destino, bloquear explícitamente.
6. Pruebas de reimportación, múltiples fuentes, homónimos, conflictos, ambigüedad y relaciones.
7. IndexedDB solo como caché derivada, aislada y reconstruible.

## 8. Dictamen
TASK-068 no cumple actualmente los criterios. Auditoría preimplementación concluida; tarea En ejecución, no Completada. No se modificó código ni se ejecutaron pruebas runtime, Apps Script, Sheets, navegador, HTTP o E2E. No se usaron datos productivos. No se crean tareas derivadas. Revisiones futuras se anexan a este expediente conforme a §19.6.

## 9. Próxima acción
Implementar contrato persistente/resolvers con lock, historial append-only, revisión humana y pruebas aisladas; luego integrar Accounting-Service. Antes de editar código, cumplir respaldo local íntegro y verificar mecanismo de publicación.


---

## 10. Implementación parcial y revisión interna — C1.319

### Respaldo alternativo aplicado
No se pudo crear copia local. Se aplicó §3.14.1 (respaldo Git histórico) antes de editar. HEAD de partida `ede1d05d833661b39407a09870879330cf60c3b4`; commit padre `5adf18921f8dd59e05e7f5af6210c48370273af7`; árbol de partida `8e4804cb6c240ddd69da2dd60542687037a5789a`. Blobs íntegros, publicados y recuperables:
- `METODOLOGIA_DESARROLLO.md`: `640426b96d07cdccfe36b4a0c5f00715f22cda05`; `git show ede1d05d833661b39407a09870879330cf60c3b4:METODOLOGIA_DESARROLLO.md`.
- `backend/user-service/Code.gs`: `ac3fe79e26cc9855272409e7169d68e77f53bbab`; `git show ede1d05d833661b39407a09870879330cf60c3b4:backend/user-service/Code.gs`.
- `backend/accounting-service/Code.gs`: `38b979d41596b85e888b4a7060b37bbac0840a28`; `git show ede1d05d833661b39407a09870879330cf60c3b4:backend/accounting-service/Code.gs`.
Las lecturas fueron completas (92.668, 429.611 y 713.779 caracteres). El historial publicado permite recuperar cada versión sin depender del archivo editado.

### Cambios realizados
- Se incorporó la regla de respaldo alternativo por historial Git en §3.14.1, FASE 3 y §19.4 A.3.
- User-Service: hoja `CorrespondenciaIdentificadores` con 13 columnas; hoja `HistorialDecisionesIdentidad`; unicidad lógica compuesta por origen/tipo/ID legado/institución; alta idempotente bajo ScriptLock; resolvers bidireccionales que solo devuelven correspondencias confirmadas; revisión humana con motivo y bitácora append-only; resolución por ID legado; RBAC exclusivo para Secretaría y Administrador; clasificación de coincidencias sin calibración ficticia ni fusión automática; vinculación de cuenta con verificación de Persona y registro compensable.
- La institución se obtiene de Script Properties `IMA_INSTITUTION_ID`; no se acepta del navegador.
- Accounting-Service: `resolveCrossReferenceIdentifier` consulta el contrato compartido y solo acepta estado CONFIRMADA. El importador devuelve `DESTINATION_WRITER_NOT_CONFIGURED` y no declara éxito ni filas migradas sin un escritor de destino específico.

### Límites y bloqueos
- `IMA_INSTITUTION_ID` debe configurarse en Script Properties de ambos proyectos Apps Script con el identificador institucional canónico acordado.
- No se encontró contrato verificable de persistencia por `destinoModulo`; por seguridad no se escriben hojas destino supuestas. AUD-NG-378 permanece abierto.
- No se ejecutó Apps Script, Sheets real, pruebas de dos fuentes ni concurrencia. TASK-068 sigue En ejecución.


## 11. Seguimiento C1.320 — caché y API cliente
- IndexedDB v5 incorpora identity_mapping_cache y helpers para lectura, alta confirmada y limpieza institucional.
- js/api.js expone seis wrappers para el contrato User-Service.
- El test estático se amplía para compilar los dos JS cliente y verificar store, regla confirmed-only y wrappers.
- Sin pruebas de navegador/IndexedDB runtime, Apps Script ni Sheets. AUD-NG-378 sigue abierto; TASK-068 En ejecución.


## 12. Seguimiento C1.321 — endurecimiento de identidad
- Se separan helpers de lectura no mutante y creación de hojas solo en rutas de escritura con lock.
- reviewLegacyIdentifierMapping valida existencia del destino para persona/usuario; otros tipos se rechazan hasta contar con validador de módulo.
- Se sanitiza texto libre de bitácora y se calcula hash de registro en backend.
- Sin Apps Script/Sheets runtime; AUD-NG-378 permanece abierto y TASK-068 En ejecución.


## 13. Seguimiento C1.322 — catálogo de destinos verificables
- Se verificó estáticamente el SPREADSHEET_ID común de USER y ACADEMIC y los encabezados canónicos de las siete hojas que habilitan la validación de destino.
- Se amplía identityTargetExists_ a persona, usuario/cuenta, estudiante, responsable, asignatura, matrícula y documento; empleado/curso quedan sin confirmación hasta hallar contrato verificable.
- Sin pruebas de Sheets real. No se crea escritor de importación por inferencia; AUD-NG-378 sigue abierto.


## 14. Seguimiento C1.323 — dictamen de escritor de destino
- Auditoría estática de ACCOUNTING/ACADEMIC: no hay transporte interservicio activo en ACCOUNTING; los writers existentes son workflows de admisión/matrícula con precondiciones y efectos colaterales.
- No se encontró un writer genérico que preserve todas las relaciones e idempotencia requeridas. La escritura directa sería riesgosa; el importador permanece fail-closed.
- AUD-NG-378 abierto. Se requiere contrato explícito por entidad, con clave idempotente, invariantes, transacción/compensación y pruebas aisladas.


## Seguimiento C1.324 — AUD-NG-380: validación completa del esquema destino
- **Auditoría de continuidad:** revisión focalizada de la implementación publicada en C1.323 y de `identityTargetExists_`; se reutiliza el expediente principal `Auditoría/AUDITORIA_TASK-068_C1.318.md` conforme a §19.6, sin auditoría duplicada.
- **Hallazgo AUD-NG-380 — MEDIO/P2:** la confirmación de una correspondencia solo comprobaba la primera celda del encabezado destino. Una hoja con la columna de ID correcta y el resto del esquema incompatible podía superar la validación.
- **Resolución:** registro explícito de los siete esquemas destino verificados (Personas, Usuarios, ExpedientesEstudiantes, ResponsablesTutores, CatalogoAsignaturas, Matriculas y DocumentosEstudiante); aliases usuario/user/cuenta comparten esquema Usuarios. `identityTargetExists_` compara el encabezado completo y continúa siendo de solo lectura/fail-closed.
- **Pruebas añadidas:** contrato Node extrae y ejecuta la función con hojas simuladas; cubre tipos/aliases, esquema válido, columna incompatible, hoja ausente, ID vacío y tipo no soportado. Se comprueba sincronización con encabezados canónicos USER/ACADEMIC.
- **Archivos:** `backend/user-service/Code.gs`, `tests/security/identity-mapping-contract.test.js`, este expediente y registros de checkpoint. MapaDependencias no se modifica: no cambian las dependencias ni el grafo entre módulos.
- **Estado:** AUD-NG-380 corregido en código; CI pendiente de resultado posterior al commit. AUD-NG-378 sigue abierto: no hay escritor de destino ni importación real. TASK-068 permanece En ejecución.
- **Limitación:** no hay runtime Apps Script/Sheets aislado ni configuración verificada de `IMA_INSTITUTION_ID`; no se ejecutaron pruebas reales de persistencia, dos fuentes, concurrencia ni navegador.


## Seguimiento C1.325 — AUD-NG-381: corrección del harness de pruebas C1.324
- Revisión focalizada del commit C1.324: el código de producción mantiene la validación completa de esquemas, pero el nuevo test contenía escapes dobles en la expresión regular de extracción y en el separador de código pasado a VM; el bloque de prueba no podía ejecutarse correctamente.
- Se corrige únicamente el harness: regex con clases `[\\s\\S]` y separador de línea `\n` válidos en el propio archivo JavaScript. Se conserva la cobertura dinámica de esquemas válidos/incompatibles, aliases, hoja ausente, ID vacío y tipo no soportado.
- No se altera código de producción ni el alcance funcional. El run C1.324 `42672140762` permanecía queued al iniciar esta revisión; no se declara resultado. El nuevo CI del commit C1.325 debe confirmar la ejecución.
- Expediente principal único: este informe; AUD-NG-381 se registra en Auditoria.txt y se vincula a TASK-068 existente, sin crear tarea duplicada.


## Seguimiento C1.326 — resolución definitiva del extractor de pruebas AUD-NG-381
- **Evidencia CI:** run C1.324 `42672140762` falló por regex de extracción mal escapada; run C1.325 `42672511038` falló por el paréntesis de función doblemente escapado. Ambos logs muestran SyntaxError antes de ejecutar los casos de validación.
- **Causa raíz:** la expresión regular del harness era innecesariamente compleja y propensa a escapes defectuosos. El código de producción de C1.324 no presenta error reportado por estos runs.
- **Corrección C1.326:** se elimina el regex y se extrae el bloque por índices de texto (`indexOf`/ `slice`), y el fragmento VM se separa mediante `String.fromCharCode(10)`. Se conserva la cobertura de casos sin modificar código de producción.
- **Estado:** AUD-NG-381 permanece abierto hasta obtener CI completed/success; no se declara PASS. Reutiliza este expediente y TASK-068 existente; sin auditoría ni tarea duplicada.


## Seguimiento C1.327 — CI y bloqueo del transporte de importación (AUD-NG-378)
- **CI del contrato de identidad:** run `42672774951`, job `129349656231`, Node `v24.22.2`, completed/success. El log confirma: `TASK-068 identity mapping contract: syntax, canonical schemas, and isolated destination-validation cases passed.` AUD-NG-381 queda resuelto como defecto del harness; los runs fallidos 42672140762 y 42672511038 permanecen como evidencia histórica.
- **Revisión de transporte:** ACCOUNTING `doPost` y USER `doPost` solo reciben `{action,payload}` y ejecutan `validateRolePermission`; el helper `verifyInterServiceEnvelope` no está conectado a una ruta interservicio en USER. ACCOUNTING no contiene `UrlFetchApp.fetch` ni lee `USER_SERVICE_URL`; ninguno de los servicios lee `IMA_INTERSERVICE_HMAC_SECRET`.
- **Riesgo de autenticación:** `getAuthTokenSecret` usa como fallback una derivación determinista de `SPREADSHEET_ID + "_MASTER_AUTH_HMAC_SECRET"`. No debe utilizarse como secreto dedicado para un nuevo canal entre servicios. El nuevo canal requiere secreto aleatorio dedicado en Script Properties, compartido únicamente por los proyectos aislados y nunca versionado.
- **Bloqueo real de AUD-NG-378:** no se dispone de contrato de endpoint de importación autenticado, URL de despliegue USER/ACADEMIC verificable ni proyecto/fixture Apps Script aislado. El árbol Git no contiene `appsscript.json` ni `.clasp.json`; el único `manifest.json` es ajeno a la configuración Apps Script. No se puede comprobar el estado de Script Properties ni las deployments remotas desde este repositorio.
- **Decisión de seguridad:** no escribir directamente en las hojas compartidas desde ACCOUNTING. Los `ScriptLock` de proyectos Apps Script independientes no coordinan exclusión mutua entre sí; una escritura cruzada podría competir con USER/ACADEMIC y dejar mapeos o relaciones parciales. Tampoco se deben reutilizar handlers de admisión/matrícula como writers genéricos.
- **Prerequisitos para reanudar:** despliegues de prueba identificados para USER y ACADEMIC; `USER_SERVICE_URL` y endpoint/action explícito; `IMA_INTERSERVICE_HMAC_SECRET` fuerte en Script Properties de los proyectos participantes; `IMA_INSTITUTION_ID` en los proyectos aislados; contrato de actor/rol, replay, idempotencia, propietario de escritura y compensación; Spreadsheet fixtures aislados con dos fuentes.
- **Alcance:** AUD-NG-378 sigue abierto. No se crea AUD ni TASK duplicada; se amplía el hallazgo original dentro de TASK-068. TASK-068 permanece En ejecución.

## Seguimiento C1.328 — continuidad y bloqueo de AUD-NG-378
- HEAD de partida verificado: 431fdff7c695f0507a96e533b391cb69ff9fdb62; rama base 44d9891132332e692dbe2ba8602b41f50a508a59; comparación de ramas: ahead 404 / behind 0. C1.327 es el commit actual; no hubo cambios posteriores que requieran repetir la auditoría.
- Se consultó el resultado del workflow Identity mapping contract: run 42672774951, job 129349656231, completed/success. AUD-NG-381 queda resuelto; los runs fallidos anteriores permanecen como historial.
- Revisión focalizada de TASK-068: sin cambios de código y sin hallazgos nuevos. AUD-NG-378 continúa abierto; el writer sigue fail-closed. TASK-068 pasa a Bloqueada, no completada.
- No están acreditados deployments/endpoint de prueba USER/ACADEMIC, IMA_INTERSERVICE_HMAC_SECRET en Script Properties, IMA_INSTITUTION_ID aislado ni fixtures de Spreadsheet. No se escriben hojas compartidas ni se inventan secretos/URLs.
- La cola PM-01 no se puede completar conforme a §6.1: el backlog Otros y su ruta de recuperación devuelven 0 caracteres por GitHub Contents API, aunque sus blobs existen. Se documenta recuperación con git show desde el HEAD de partida; no se crea un hallazgo ni tarea duplicados por esta limitación.
- Se reutiliza este expediente único y TASK-068. No se audita el informe ni se crea un informe nuevo. Sin pruebas nuevas ni cambios de código.
