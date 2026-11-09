# Auditoría de cierre — TASK-068
**Checkpoint:** C1.363  
**Sesión:** IMA-GOV-20261109-2201Z-01  
**Baseline lógico:** C1.316 — `31262d5ccbfc46a5f87a5d0fc9c363b177283d9a`  
**Rama exclusiva:** `NG_beta_0.0.0.1_work`  
**HEAD de cierre:** `a8eb2ee352b9f4dbbdfc9a2f234ce60e290a3a88`  
**Estado:** Completada — implementación local verificada

## 1. Dictamen
TASK-068 satisface los requisitos y criterios de aceptación locales. Las pruebas que necesitan deployments, servicios vivos y dos fuentes reales se mantienen en BETA-FUNC-008, Pendiente beta; no son condición de cierre de implementación conforme a §21.5. No se afirma certificación de despliegue.

## 2. Implementación validada
- Hoja `CorrespondenciaIdentificadores` con esquema canónico, inicialización first-use, validación fail-closed y clave compuesta por fuente, tipo, ID legado e institución.
- Registro idempotente, detección de conflictos y resolución bidireccional. Varias fuentes confirmadas pueden referenciar el mismo ID interno sin duplicar la entidad.
- Clasificador conservador: coincidencia exacta pendiente de confirmación, probable, posible duplicado e insuficiente; contradicciones en identificación nacional, código institucional o fecha de nacimiento descartan candidatos. No existe fusión automática.
- Revisión humana, rechazo/confirmación con motivo y `HistorialDecisionesIdentidad`; inicialización segura de la hoja de auditoría.
- UI de Secretaría/Administrador para buscar candidatos, registrar referencias, confirmar/rechazar, consultar historial y vincular cuenta-Persona. RBAC explícito y validación server-side.
- `linkPersonAccount` exige motivo de al menos 10 caracteres en backend y audita el vínculo.
- Caché IndexedDB de solo correspondencias confirmadas, clave institucional y limpieza acotada a institución.
- `auditAndReconcileIdentityInconsistencies` incluye integridad de correspondencias: esquema, claves duplicadas, filas incompletas y destinos inexistentes; reporta para revisión humana, sin auto-fusión ni auto-fix de mappings.
- Importadores/writers propietarios: USER, ACADEMIC y ACCOUNTING. ACCOUNTING soporta empleado (`ExpedientesLaborales`) y curso (`CatalogoCursosCapacitacion`) mediante writer local; todos con upsert, idempotencia, conflicto y compensación.
- Protección de relaciones académicas, familiares y administrativas por IDs internos estables; pruebas locales verifican matrícula/Usuario/Persona, relaciones familiares y adscripciones por UserId.

## 3. Criterios de aceptación
1. Reimportación idempotente sin duplicados: PASS local.
2. Varias referencias externas al mismo ID interno: PASS local.
3. Homónimos con RNE/identificación diferente o fecha de nacimiento distinta permanecen separados: PASS local.
4. Registros sin identificador confiable pueden someterse a revisión: PASS local.
5. Coincidencias ambiguas sin fusión automática: PASS local.
6. Historial de decisiones auditable: PASS local.
7. Relaciones académicas, familiares y administrativas conservan sus IDs: PASS local.
8. Resolución desde al menos dos fuentes: PASS local.

## 4. Evidencia CI
Ejecuciones de la suite de contratos de identidad y transporte:
- C1.349 — run 42714376588: success.
- C1.350 — run 42714860009: success.
- C1.352 — run 42715176076: success.
- C1.353 — run 42715322689: success.
- C1.355 — run 42715614599: success.
- C1.356 — run 42715880749: success.
- C1.358 — run 42716471988: success.
- C1.359 — run 42716679171: success.
- C1.360 — run 42716865176: success.
- C1.361 — run 42717056863: success.
- C1.362 — run 42717289902: success.

Los fallos intermedios C1.351, C1.354 y C1.357 fueron de fixtures/aserciones locales, documentados en sus checkpoints y corregidos en los commits siguientes; las ejecuciones corregidas anteriores finalizaron success.

## 5. Pruebas diferidas
`BETA-FUNC-008` / `AUD-NG-378` queda **Pendiente beta**: transporte HMAC entre deployments aislados, importación real de dos fuentes, persistencia/journal/compensación y comprobación de recursos vivos. No se ejecutó deployment, Apps Script runtime, HTTP real ni Sheets/Drive reales. No hay PASS beta ni evidencia simulada.

## 6. Siguiente continuidad
TASK-636 continúa En ejecución. El próximo trabajo retoma la auditoría local de sus alcances AUD-NG-001/002/306/368/370/371; AUD-NG-369 y BETA-FUNC-007 siguen como pruebas beta diferidas donde corresponda.

## 7. Integridad de ramas
Se publicó exclusivamente en `NG_beta_0.0.0.1_work`. La rama protegida `NG_beta_0.0.0.1` no se modifica. C1.316 sigue siendo el último checkpoint válido para continuidad lógica; los cambios posteriores se conservan físicamente y solo se aceptaron tras revalidación independiente.
