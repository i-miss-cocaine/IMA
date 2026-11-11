# Auditoría técnica UNI-U01 — registro y aislamiento runtime de tenants

**Expediente principal:** AUD-NG-384  
**Tarea derivada:** TASK-696 · Dirección · PM-02 · P0  
**Sesión:** IMA-EXEC-20261110-1108Z-01  
**Fecha:** 2026-11-10  
**Rama auditada:** `NG_beta_0.0.0.1_work`  
**Commit auditado:** 2b9275c25a8e8ff0cc720c269588118a56529568 (C1.405)  
**Rama base:** `NG_beta_0.0.0.1` @ 44d9891132332e692dbe2ba8602b41f50a508a59

## 1. Requisito y alcance

Fuente íntegra: `Auditoría/PLAN-IMA-001_UNIDADES_FUNCIONALES.md`, apartado **UNI-U01 — Tenants, instituciones y sedes**. Requisitos: tenant como frontera de seguridad; instituciones y sedes subordinadas; grupos opcionales; estado, país, zona horaria, módulos y contexto explícito en sesión/API. Aceptación: dos tenants aislados; tenant obligatorio en lecturas, escrituras, búsquedas, archivos, exports y jobs; IDs manipulados no cruzan datos; suspensión bloquea operaciones sin borrar historia.

Auditoría estática focalizada de la cadena de identidad, sesión, cliente API, autorización y despacho de USER/ACADEMIC/ACCOUNTING/TASK/EXAM, además del resolver de fuentes de datos. No se modificó código ni se accedió a datos productivos. No se auditó exhaustivamente cada handler de negocio; se evaluó si existe una frontera transversal capaz de imponer el requisito.

## 2. Continuidad y reutilización de evidencia

- TASK-694 y TASK-695 permanecen completadas únicamente como investigación/diseño y planificación documental.
- TASK-153/T153-S01 conserva el bloqueo C1.403: falta una decisión institucional verificable sobre la autoridad del catálogo departamental. No se reabrió ni se repitió esa auditoría.
- F29-TASK17 sigue Pendiente (P0): migración de roles/permisos y relaciones contextuales. No implementa por sí sola un registro ni un contexto runtime de tenant.
- F37-TASK10 sigue Pendiente (P1): pruebas interdepartamentales con dos sedes/departamentos; no equivale a fixtures de dos tenants.
- Se revisaron los requisitos completos de TASK-694, TASK-695, TASK-153, F29-TASK17 y F37-TASK10, además de UNI-U01. Se reutilizan las auditorías F29/F37 como evidencia vigente: no se reauditan ni se duplica su expediente. No se localizó un índice independiente de informes en el árbol; se consultaron `Auditoria.txt`, `tareas_auditoria.txt` y los informes originales F29/F37.

## 3. Evidencia técnica

### 3.1 Sesión y cliente

- `backend/user-service/Code.gs:1087-1163`: `generateSessionToken` firma `userId`, `email`, `role`, `accountState`, `iat`, `exp` y `sessionId`. No incorpora `tenantId`, `institutionId` ni versión de membresía.
- `backend/user-service/Code.gs:1105-1163`, y verificadores equivalentes de ACADEMIC, ACCOUNTING, TASK y EXAM: se valida identidad/rol/estado de cuenta, no pertenencia activa a un tenant.
- `js/api.js:14-62`: `fetchApi` propaga el token firmado y los campos de compatibilidad `requesterUserId/requesterRole`; no establece contexto de tenant.
- `backend/user-service/Code.gs:5`, `backend/academic-service/Code.gs:5`, `backend/accounting-service/Code.gs:5`, `backend/task-service/Code.gs:5` y `backend/exam-service/Code.gs:5`: los cinco servicios usan un `SPREADSHEET_ID` fijo por despliegue, no derivado de una membresía autenticada.

### 3.2 Identidad institucional y ámbitos

- `backend/user-service/Code.gs:1667-1671`: `getIdentityInstitutionId_()` obtiene un único `IMA_INSTITUTION_ID` desde Script Properties.
- `backend/user-service/Code.gs:9508-9608`: `getUserContextScope` combina la sesión verificada y ámbitos por usuario/rol con ese identificador institucional global. Esto es contexto departamental/institucional de una instalación, no resolución de tenant ni membresía multi-tenant.

### 3.3 Autorización, despacho y persistencia

- Los `doPost` inspeccionados en USER, ACADEMIC, ACCOUNTING, TASK y EXAM validan token/RBAC y despachan acciones, pero no ejecutan una resolución/validación transversal de tenant antes del handler. Las listas de acciones públicas requieren una política tenant explícita; el bypass RBAC no constituye aislamiento.
- `backend/accounting-service/Code.gs:14897-14941`: `resolveSpreadsheetSource` resuelve por `dominioArea` y `anoLectivo`; no filtra por tenant/institución. Si no encuentra partición, devuelve el Spreadsheet principal por defecto. No es un resolver multi-tenant fail-closed.
- No se encontró evidencia de un contexto tenant obligatorio común para cachés, archivos, exports, jobs o webhooks. La cobertura individual de cada handler/consumidor queda **No verificable** en esta auditoría focalizada.

### 3.4 Tareas existentes y no equivalencia

- F29-TASK17 cubre migración de roles, permisos mínimos y relaciones contextuales; permanece Pendiente y no especifica el registro/guard runtime.
- F37-TASK10 exige 32 escenarios interdepartamentales con dos sedes/departamentos; permanece Pendiente y no demuestra aislamiento entre dos tenants.
- TASK-153 cubre ownership/ámbitos departamentales y sigue bloqueada por la fuente institucional pendiente. No debe ampliarse por inferencia ni usarse como sustituto del tenant boundary.

## 4. Matriz de cumplimiento UNI-U01

| Criterio | Resultado | Evidencia / límite |
|---|---|---|
| Registro y ciclo de vida de tenants | **No evidenciado en el alcance inspeccionado** | No se identificó registro runtime de tenants ni suspensión por tenant. |
| Instituciones/sedes subordinadas a tenant | **Parcial** | Existe un ID institucional global; no una jerarquía tenant→institución→sede resuelta por sesión. |
| Contexto explícito firmado en sesión/API | **Ausente** | Claims y payload API no contienen contexto tenant verificable. |
| Guard server-side en todos los servicios | **Ausente a nivel transversal** | Los entrypoints revisados no aplican tenant guard común; handlers individuales no fueron auditados exhaustivamente. |
| Enrutamiento y partición por tenant | **Parcial/insuficiente** | Resolver por dominio/año con fallback global; no satisface aislamiento. |
| Archivos, exports, jobs, cachés y webhooks tenant-scoped | **No verificable** | Sin contexto tenant común demostrado en la frontera. |
| Suspensión que bloquee operaciones y preserve historia | **No verificable / sin registro tenant** | No existe entidad tenant observada cuyo estado pueda aplicarse transversalmente. |
| Pruebas negativas con dos tenants | **No ejecutadas** | F37-TASK10 prueba sedes/departamentos, no dos tenants. |

## 5. Hallazgo y riesgo

**AUD-NG-384 — CRÍTICO / P0 — Falta de frontera runtime multi-tenant.**

La plataforma dispone de autenticación firmada y controles RBAC/ámbitos, pero la identidad de sesión no porta un tenant verificable y los entrypoints/resolvers inspeccionados no aplican aislamiento tenant transversal. El identificador institucional global y el enrutamiento con fallback al Spreadsheet principal no satisfacen UNI-U01.

**Riesgo:** si se habilitan múltiples tenants sobre estos servicios sin una frontera adicional, no existe evidencia suficiente para garantizar que consultas, mutaciones o recursos compartidos queden confinados a un tenant. La revisión no reproduce ni afirma una fuga real entre instituciones; esa comprobación requiere un entorno sandbox con dos tenants sintéticos.

## 6. Tarea derivada y puertas

Se crea **TASK-696**, PM-02/P0, para implementar el registro y aislamiento runtime de tenants, con criterios detallados en `pendientes/Dirección/Pendientes.md`. Dependencias declaradas por UNI-U01: TASK-694, TASK-153, F29-TASK17 y F37-TASK10. TASK-694 está completada como diseño; las otras tres conservan estados no satisfechos. TASK-696 queda **Bloqueada / no elegible para implementación** hasta resolver las dependencias y la puerta PM-01. No se modifica ownership, se migran datos ni se relaja fail-closed.

## 7. Limitaciones y pruebas

Inspección estática manual de los contratos y entrypoints citados; sin acceso a filas productivas, Drive real ni configuración de despliegue. No se ejecutaron pruebas unitarias, contratos, Apps Script, HTTP/E2E, navegador, migraciones ni escenarios con dos tenants. Ningún resultado dinámico se declara PASS.

## 8. Snapshot de código y requisitos auditados

- USER: `85d12dad06826fdc37660f47d92e6976ff28bfe7`
- ACADEMIC: `6c7ff36bb1ff314917bb85497a23c303a0dcf397`
- ACCOUNTING: `15b01bef8a7bcdac9624219bca6f5085a5f8a827`
- TASK: `dfc6974d48a76a06b60728e016bcd482fa8c8757`
- EXAM: `2f63a244e360d7c062b6da0cff901b1e730803ec`
- `js/api.js`: `c54d23ad1fc84add9e204a0233d824a2bfcc8ed3`
- `js/auth.js`: `51a7e01fea0d70a3de7f71c58f46145fa04b4a4e`
- UNI-U01: `Auditoría/PLAN-IMA-001_UNIDADES_FUNCIONALES.md`, blob `885d0e5ed67ed97c81ef1b77686276d9627f3be1`
- F29: `Auditoría/AUDITORIA_FASE_29_MIGRACION_Y_TRANSICION.md`, blob `5f232e1f3f70ab181d0eb0aac2c4fb84eab88f04`
- F37: `Auditoría/AUDITORIA_FASE_37_AISLAMIENTO_DATOS_ASIGNACION_DEPARTAMENTOS.md`, blob `92133fdaddf34dafe9c7e327064b0f4674c9ac9e`

**Estado de auditoría:** alcance focalizado evaluado; hallazgo registrado; siguiente acción documentada. Este informe es el expediente principal único de AUD-NG-384.
