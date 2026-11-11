# Auditoría de continuidad y revisión local — TASK-636 / C1.331

- Sesión: IMA-GOV-20261109-2201Z-01
- Línea base lógica válida: C1.316 — `31262d5ccbfc46a5f87a5d0fc9c363b177283d9a`
- HEAD físico de publicación: `acc9d02a1982533d694488d89a4ac8165a3f0bb7` (se conserva; no se hace reset ni force-push)
- Rama autorizada: `NG_beta_0.0.0.1_work`
- Rama base protegida: `NG_beta_0.0.0.1` @ `44d9891132332e692dbe2ba8602b41f50a508a59`
- Tarea auditada: TASK-636 — PM-01/P0
- Expediente principal reutilizado: `Auditoría/AUDITORIA_TASK-636_C1.305.md`
- Hallazgo focalizado: AUD-NG-369 — backup/restore y cierre académico.

## 1. Corrección de rumbo / disrupción del plan

Se establece C1.316 como último checkpoint válido para la continuidad lógica. Los checkpoints y estados posteriores (C1.317–C1.330) dejan de ser autoridad para selección de tareas, cierre, dependencias o evidencia de ejecución. Sus commits, blobs y cambios físicos se conservan íntegros; no se revierten ni eliminan. El HEAD físico se mantiene como padre de esta corrección para preservar historia y trabajo. El código presente se puede inspeccionar y volver a verificar, pero ninguna conclusión posterior a C1.316 se acepta sin revalidación independiente.

La normativa de pruebas no bloqueantes se aplica desde esta corrección: pruebas locales reproducibles siguen siendo obligatorias; pruebas que requieren deployment, Apps Script/Sheets/Drive reales, HTTP entre servicios, credenciales externas o infraestructura viva se difieren a `beta_test.txt` y no bloquean el cierre de implementación por su sola ausencia.

## 2. Alcance y evidencia heredada válida

C1.316 identifica TASK-636 como tarea activa PM-01/P0 y registra:
- `backend/task-service/Code.gs` en C1.316: blob `29c187069958eb487461813b67b1d6888e2254bb`.
- `tests/security/task-service-backup-restore-contract.test.js`: blob `1bf4893545e4fe77175a0a89b19531f3a93a4692`.
- Workflow `.github/workflows/task-service-backup-restore-contract.yml`: blob `843f7fa4b0f3f0d43b720c5f281940811506e556`.
- Runs 42659818881 (Node 22) y 42659961195 (Node 24/actions v7): ambos completed/success; el segundo confirma el contrato estático Node.
- `closeAcademicYear` permanece fail-closed con `BACKUP_REQUIRED`; no se ejecutan borrados sin habilitación segura.
- El protocolo incorpora manifiesto/checksum SHA-256, snapshots de hojas, verificación de activos Drive, permisos, lock, journal durable, recuperación confirmada y marcadores deterministas de reanudación.

## 3. Reauditoría bajo la normativa nueva

### AUD-NG-369 — resultado de implementación

La falta de proyecto Apps Script desplegado, Spreadsheet/Drive aislados e interrupciones reales se clasifica como **prueba beta diferida**, no como defecto que bloquee el cierre de implementación. El escenario queda vinculado a BETA-FUNC-007 en `beta_test.txt`, estado Pendiente beta; no se declara PASS. `closeAcademicYear` sigue fail-closed hasta la certificación beta, preservando seguridad y sin ejecutar operaciones destructivas.

### Cobertura local y corrección aplicada en este checkpoint

El contrato anterior verificaba principalmente presencia de cadenas; no parseaba el archivo completo ni ejercitaba helpers puros. Se amplía `tests/security/task-service-backup-restore-contract.test.js` para:
1. Parsear íntegramente `backend/task-service/Code.gs` mediante `vm.Script`.
2. Probar SHA-256 en modo texto y bytes con valores conocidos.
3. Probar snapshot local de hoja con fecha, valores y fórmulas usando fixture/mocks.
4. Probar snapshot de hoja vacía.
5. Mantener todas las guardas estáticas existentes de cierre fail-closed, dispatcher, journal, rollback y recuperación.

Estas pruebas son locales y ejecutables en Node; no requieren servicios desplegados. El workflow existente de la rama de trabajo ejecutará el contrato al publicarse el cambio. El resultado CI se registrará únicamente después de observar el run.

## 4. Estado de TASK-636 y dependencias

TASK-636 permanece **En ejecución**, no Completada. La razón ya no es la falta de deployment para AUD-NG-369. El expediente C1.305 conserva otros alcances de seguridad de TASK-636/AUD-NG-001/002/306/368/370/371 cuya cobertura y cierre deben verificarse focalizadamente contra el código y los criterios originales; no se los declara resueltos por la ejecución del contrato de backup. No se crea auditoría paralela ni IDs de hallazgo duplicados.

AUD-NG-369: implementación de backup/restore preparada con pruebas locales contractuales; integración/recuperación operacional real queda Pendiente beta (BETA-FUNC-007). No se habilita `closeAcademicYear` antes de la evidencia beta.

## 5. Selección de la siguiente tarea

Se selecciona TASK-068 — PM-01/P0, orden local 1, requisito `pendientes/Dirección/Pendientes.md`, dependencia declarada ninguna. La selección es independiente de TASK-636: el requisito de TASK-068 no declara a TASK-636 como prerrequisito y no se identificó dependencia técnica que impida avanzar sin modificar los recursos de TASK-636. Se auditará el requisito completo y se revalidará el código actualmente presente sin confiar en C1.317–C1.330 ni en sus dictámenes. El siguiente commit se reservará para la iteración de TASK-068.

## 6. Límites

No se ejecutaron Apps Script runtime, Sheets/Drive reales, deployment, HTTP, E2E ni pruebas beta. No se usaron datos reales. No se declara completada TASK-636 ni PASS beta. La rama base protegida permanece intacta.


## Revisión focalizada C1.332 — corrección del harness
- Se detectó que el extractor de funciones y los separadores VM estaban codificados como secuencia literal \\n, por lo que los nuevos casos locales no eran ejecutables correctamente.
- Se corrige mediante String.fromCharCode(10). No cambia el código de producción ni el dictamen funcional.
- La ejecución CI posterior a publicación determinará PASS/FAIL; hasta entonces el test no se declara aprobado.


## Revisión focalizada C1.333 — extractor balanceado
- CI run 42708635543 falló en el extractor del helper, antes de ejecutar los casos unitarios. Se registró el fallo; no es defecto del código de producto.
- Se reemplaza el patrón de cierre por conteo balanceado de llaves, ignorando strings y comentarios. Producción sin cambios.
- Se requiere observar el run del commit C1.333 antes de aceptar los nuevos casos locales como PASS.


## Revisión focalizada C1.334 — fixture de fecha aislado
- CI run 42708759124 superó la extracción balanceada y el parseo, pero falló porque el objeto Date del fixture provenía del contexto Node principal y no era instancia del Date del VM.
- El fixture se crea dentro del contexto VM. No hay cambios en producción. Se requiere CI nuevo.


## Revisión focalizada C1.335 — contexto Date del VM
- CI run 42708904660 falló en la aserción de snapshot: el fixture Date se creó en un contexto VM distinto al usado por el helper.
- Se pasa snapshotContext explícitamente al crear la fecha; producción sin cambios. Se requiere un nuevo CI exitoso.



## Verificación CI posterior — C1.337
- Run 42709000536, commit e6fbc4561ddd11c2105ab728433ba5f914f375b8: completed/success.
- Pasaron parseo Node de backend/task-service/Code.gs, contrato estático, SHA-256 texto/bytes y snapshots locales con fixtures, incluida hoja vacía.
- Los runs anteriores 42708635543, 42708759124 y 42708904660 fallaron durante la construcción del harness; quedaron corregidos en C1.334. El resultado aprobado es el run 42709000536.
- AUD-NG-369 conserva BETA-FUNC-007 Pendiente beta; el éxito local no certifica Apps Script/Sheets/Drive real ni habilita closeAcademicYear.



## Confirmación de continuidad C1.338
- Se ratifica run 42709000536, commit e6fbc4561ddd11c2105ab728433ba5f914f375b8: completed/success. El contrato Task-Service ejecutó parseo Node de Code.gs, SHA-256 texto/bytes, snapshot con fecha/valores y hoja vacía.
- Los fallos previos del harness se conservan en el historial; no se ocultan ni se consideran fallos de producción. El último run del contrato Task-Service es satisfactorio.
- BETA-FUNC-007 sigue Pendiente beta; closeAcademicYear sigue BACKUP_REQUIRED hasta evidencia real en beta aislada.
