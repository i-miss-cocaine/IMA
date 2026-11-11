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

## Tareas ejecutables derivadas de los hallazgos

> Derivadas de la inspección estática de TAREA-F4-P1-01. Se conserva el dictamen **NO CUMPLE** y el estado [X] del registro maestro. Las tareas no se consideran ejecutadas por su formalización documental.

### AUD-NG-219 / TASK-498 — Aplicar autoridad, ámbito y límites al motor de delegaciones de seguridad (ALTO/P1)

- [ ] Definir un catálogo explícito de acciones delegables, con clasificación de riesgo y restricciones por rol. Rechazar acciones desconocidas, comodines globales (`*`) y permisos que no estén declarados como delegables.
- [ ] Validar al crear una delegación que el delegante autenticado tenga autoridad vigente para conceder cada acción y el ámbito solicitado; el delegado debe existir, estar activo y ser elegible para recibirla. No permitir que los campos del payload sustituyan al actor verificado.
- [ ] Aplicar `ambito` en los tres helpers USER, ACADEMIC y ACCOUNTING. Cada autorización debe comprobar conjuntamente actor delegado, acción, recurso/estudiante/área/servicio dentro del ámbito, estado y ventana temporal. La coincidencia de acción por sí sola no autoriza.
- [ ] Definir precedencia inequívoca entre matriz dinámica y delegación. Una denegación explícita o una restricción obligatoria no puede ser sobrepuesta por una delegación, salvo excepción formal y acotada que esté representada en política y auditada.
- [ ] Impedir delegaciones en cadena por defecto: una persona que recibió una delegación no puede volver a delegar esa autoridad. Si se habilita una excepción futura, deberá preservar delegante original, cadena completa, profundidad máxima y autorización explícita; no inferir autoridad desde `_verifiedUserId` o `_delegatedFrom` del payload.
- [ ] Validar fechas en creación y en cada decisión de autorización: una delegación futura debe quedar Pendiente/Programada, una vencida Expirada y una revocada sin efecto inmediato. No depender de que alguien consulte primero `getSecurityDelegations` para actualizar su estado.
- [ ] Normalizar estados y fechas en almacenamiento; rechazar rangos inválidos, fechas ambiguas, acciones duplicadas y ámbitos vacíos o excesivos. Registrar quién concedió, a quién, qué acciones, qué ámbito, cuándo y bajo qué autoridad.
- [ ] Crear pruebas negativas/positivas en USER, ACADEMIC y ACCOUNTING: acción fuera de catálogo, comodín, delegante sin autoridad, destino inactivo, recurso fuera de ámbito, denegación dinámica, delegación futura, vencida, revocada, cadena, y suplantación de identidad.
- **Criterio de aceptación:** los tres servicios autorizan solo cuando coinciden acción, ámbito, actor y vigencia, y la autoridad del delegante está demostrada. No hay comodines arbitrarios, escalamiento por cadena ni override implícito de denegaciones.

### AUD-NG-160 — Sincronizar cachés y revocación de delegaciones entre servicios (ALTO/P1)

- [ ] Unificar el contrato de caché de delegaciones consumido por USER, ACADEMIC y ACCOUNTING; documentar claves, propietario, TTL, versión y datos que contiene cada entrada.
- [ ] Al crear, revocar, expirar o modificar una delegación, invalidar/actualizar la entrada correspondiente en los tres ScriptCache independientes mediante el mecanismo de propagación confiable ya requerido por AUD-NG-005. La confirmación de USER no debe implicar propagación exitosa sin ACK de los servicios afectados.
- [ ] Hacer que los helpers revaliden estado, fechaInicio y fechaFin en cada hit de caché o utilicen una versión/lease que no permita autorizar con una delegación expirada o revocada. El TTL de 300 segundos no debe ser la única garantía de vigencia.
- [ ] Evitar que la consulta de `getSecurityDelegations` sea la responsable de marcar expiración; el estado efectivo debe calcularse de forma determinista al autorizar y persistirse mediante una transición idempotente cuando corresponda.
- [ ] Tratar fallos parciales de invalidación: registrar servicios pendientes, reintentar, impedir concesiones/revocaciones inconsistentes según política de riesgo y exponer el estado real de propagación.
- [ ] Añadir pruebas con cachés calientes/frías y tres proyectos separados: alta, revocación, expiración por tiempo, evento duplicado, servicio desconectado, reintento y autorización inmediatamente posterior al cambio.
- **Criterio de aceptación:** una delegación revocada o vencida deja de autorizar en los tres servicios dentro del SLA; una delegación nueva no queda oculta por caché obsoleta; cada transición tiene evidencia de propagación.

### Interfaz de gestión — ciclo de vida de delegaciones

- [ ] Incorporar en la interfaz administrativa controles funcionales para crear, listar, consultar detalle y revocar delegaciones; no presentar un contador o texto informativo como si existiera gestión operativa.
- [ ] Mostrar y editar solo los campos permitidos por la política: delegado, acciones delegables, ámbito, fecha de inicio y fin; validar en cliente para usabilidad y repetir todas las validaciones en backend.
- [ ] Presentar estado real (Programada, Activa, Expirada, Revocada), delegante, vigencia, alcance y resultado de propagación; distinguir revocación solicitada de revocación confirmada.
- [ ] Restringir los controles según autoridad del actor; no exponer la UI como mecanismo para eludir el catálogo de acciones ni el ámbito autorizado.
- [ ] Añadir pruebas de interfaz y contrato API para creación, listado, filtros, detalle, revocación, errores de autorización, expiración y propagación parcial.
- **Criterio de aceptación:** el ciclo de gestión completo funciona con permisos de backend verificables y refleja el estado persistido/propagado, no datos simulados ni contadores desconectados.

### Reconciliación y límites

- AUD-NG-217 conserva el alcance general de IDOR/ABAC; AUD-NG-219 se limita a la autoridad y semántica del motor de delegaciones.
- AUD-NG-160 conserva vigencia de privilegios y cachés; aquí se amplía específicamente a cachés de delegaciones en USER/ACADEMIC/ACCOUNTING. AUD-NG-005 sigue siendo responsable del mecanismo transversal de propagación de eventos de seguridad.
- TASK-228, TASK-282 y TASK-311 siguen siendo workflows/responsabilidades, no sustitutos del motor de permisos.
- La observación del filtro `statusFilter` y el contador de delegaciones queda reservada para TAREA-F4-P1-09, según el informe; no se incorpora a este bloque.
- No se crean otros IDs. No se modifican código, pruebas ni estados maestros en esta iteración documental.
