# Auditoría TAREA-F4-P1-01 - Motor transversal de delegaciones de seguridad

**Checkpoint:** C1.76  
**Repositorio:** i-miss-cocaine/IMA  
**Rama:** NG_beta_0.0.0.1_work  
**Fecha:** 2026-11-06  
**ID operativo de sesión:** IMA-AUDIT-20261106-1138Z (inicio C1.71; sesión abierta)

## Dictamen

**NO CUMPLE.** El backend persiste delegaciones y los servicios USER, ACADEMIC y ACCOUNTING las consultan, pero el permiso se concede por acción sin aplicar el ámbito declarado. Tampoco se valida de forma suficiente la autoridad del delegante ni se impiden delegaciones en cadena. El archivo de UI incluido en el alcance no ofrece el ciclo de gestión de delegaciones.

La tarea está marcada [X] en completadas.md. La marca no demuestra cumplimiento. La fuente original AUDITORIA_FASE4_IDENTIDAD_PERMISOS_GOBIERNO.md, citada en completadas.md, no aparece en el árbol actual; el dictamen se limita al título/archivos oficiales y a la evidencia del código vigente.

## Evidencia inspeccionada

- backend/user-service/Code.gs SHA 12079dd410aa6d8afbce55a4bc62a79dea605f9f.
- backend/academic-service/Code.gs SHA daf1883ec0b8d4f0ff2bc673af8a4e8c5bbd03fc.
- backend/accounting-service/Code.gs SHA 38b979d41596b85e888b4a7060b37bbac0840a28.
- js/ui-common.js SHA 986938b8a311a41ed4cb3d135b66b6aaea4bed67.
- Los tres servicios usan el mismo SPREADSHEET_ID y consultan la hoja DelegacionesSeguridad; cada helper mantiene su caché de script.
- Funciones revisadas: USER createSecurityDelegation (1746-1800), getSecurityDelegations (1803-1859), revokeSecurityDelegation (2276-2315), hasActiveDelegationForAction (1165-1210), validateRolePermission (1253-1295); ACADEMIC hasActiveDelegationForAction (624-669) y validateRolePermission (524-583); ACCOUNTING hasActiveDelegationForAction (525-570) y validateRolePermission (445-484); UI openUserManagementAdministrationModal (5467-5614) y openSecurityAndComplianceDashboardModal (5616-5750).

## Incumplimientos

### 1. El campo ambito no limita la autorización

createSecurityDelegation almacena ambito en la hoja, pero los tres helpers de autorización no leen ese campo. La decisión de delegación se basa en delegadoUserId, estado, fechas y accionesAutorizadas. Por tanto, una delegación registrada para un ámbito concreto puede autorizar la acción en otros recursos/ámbitos, si el handler no añade una comprobación independiente.

### 2. Acciones arbitrarias, comodín y autoridad del delegante

createSecurityDelegation valida que existan delegadoUserId, accionesAutorizadas, fechaInicio y fechaFin y que el rango temporal sea válido. No valida que el delegante pueda conceder cada acción, que el usuario destino exista/esté activo, ni que las acciones pertenezcan a una lista delegable. El helper acepta "*" como autorización para cualquier acción. La acción administrativa se filtra mediante validateRolePermission y ROLE_PERMISSIONS/dynamic_permissions_matrix, pero el handler no aplica límites propios a la concesión.

### 3. La delegación puede sobreponerse a una denegación dinámica

En USER, ACADEMIC y ACCOUNTING, validateRolePermission consulta hasActiveDelegationForAction después de evaluar la matriz dinámica. Cuando dynamicCheck devuelve false, no retorna inmediatamente: una delegación coincidente puede terminar autorizando la acción. Esto podría ser una excepción válida si está diseñada y limitada explícitamente, pero el código no exige una política de override ni valida el ámbito concedido.

### 4. Delegación en cadena y pérdida de identidad original

Si una delegación concede createSecurityDelegation, el helper puede autorizar esa acción al delegado. createSecurityDelegation toma payload._verifiedUserId como nuevo delegante y no comprueba payload._delegatedFrom ni impide cadenas. La nueva fila puede registrar al delegado intermedio como delegante y perder la cadena que originó la facultad de delegar.

### 5. Invalidación interservicio incompleta (hallazgo existente)

USER:createSecurityDelegation/revokeSecurityDelegation eliminan active_delegations_<userId> únicamente del ScriptCache USER. ACADEMIC y ACCOUNTING tienen sus propios ScriptCache y TTL de 300 segundos. La revocación puede dejar una autorización almacenada temporalmente y una nueva delegación puede tardar en estar disponible. getSecurityDelegations cambia la hoja a Expirada cuando se consulta, pero no invalida los caches; las entradas cacheadas no guardan fechas y los helpers no revalidan vigencia en cada hit.

**Reconciliación:** esta parte amplía AUD-NG-160; no se crea otro hallazgo para caché/expiración.

### 6. UI sin ciclo de gestión de delegaciones

En js/ui-common.js, openUserManagementAdministrationModal consulta el directorio y permite cambiar estado de cuentas; no ofrece crear, listar ni revocar delegaciones. openSecurityAndComplianceDashboardModal muestra un contador de delegaciones, pero no invoca createSecurityDelegation, getSecurityDelegations ni revokeSecurityDelegation. El texto del modal que menciona delegaciones no está respaldado por controles funcionales.

## Reconciliación de hallazgos

- **AUD-NG-160:** ampliar por cachés de delegación independientes en ACADEMIC/ACCOUNTING y falta de invalidación interservicio.
- **AUD-NG-217 / TAREA-F4-P1-04:** conservar el alcance general de IDOR y autorización contextual ABAC; la nueva tarea se limita al ámbito y autoridad del mecanismo de delegación.
- **AUD-NG-219 / TASK-498:** nuevo alcance para validar delegante/destino/acciones, aplicar ambito, impedir cadenas no autorizadas y completar UI.
- **TASK-228, TASK-282 y TASK-311:** corresponden a delegaciones de workflows/responsabilidades y no sustituyen el motor de permisos de seguridad.

## Observación diferida

getSecurityAndComplianceDashboardData pasa statusFilter: "ACTIVA" a getSecurityDelegations, pero getSecurityDelegations solo lee el parámetro estado. El contador activeDelegationsCount puede incluir delegaciones expiradas o revocadas. Se reserva para TAREA-F4-P1-09, que audita el panel de seguridad.

## Pruebas

**Ejecutadas:** inspección estática/manual de funciones, call sites, permisos y cachés; comparación de SHA.

**No ejecutadas:** despliegues, llamadas HTTP, pruebas de datos reales, pruebas multiusuario, cachés calientes/frías, revocación interservicio ni suites automatizadas.

## Progreso y continuidad

- Progreso: 73/183 identificadores auditados; 110 pendientes.
- Siguiente tarea: TAREA-F4-P1-02 - Implementar el motor automático de retención, archivo y anonimización de datos.
- Sin modificación: código fuente, completadas.md, ChangesLogs.txt y METODOLOGIA_DESARROLLO.md.
