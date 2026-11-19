# Auditoría F8-Task08 / TAREA-AD-02 — Catálogo central de responsabilidades, capacidades y módulos

- **Fecha:** 2026-11-08.
- **ID de sesión operativo:** IMA-AUDIT-20261108-2205Z-01 (identificador documental; no es un ID nativo de ChatGPT).
- **Checkpoint inicial:** C1.267.
- **Checkpoint de cierre:** C1.268.
- **Repositorio:** i-miss-cocaine/IMA.
- **Rama:** NG_beta_0.0.0.1_work.
- **HEAD de partida:** 2c49d44decbdabda0a528133c173e28a50898306; árbol Git 2ab8904e869344951115da9644874e650561c903.
- **Rama base:** NG_beta_0.0.0.1 @ 44d9891132332e692dbe2ba8602b41f50a508a59; comparación inicial: 336 commits adelante, 0 detrás.
- **Tarea auditada:** F8-Task08 / TAREA-AD-02, marcada [X] en completadas.md, líneas 4945–4966.
- **Informe individual previo:** no existe AUDITORIAS/AUDITORIA_COMPLETADAS_F8-TASK08.md en el árbol; se ejecutó auditoría directa.
- **Dictamen:** **NO CUMPLE**. CA-AD-104, CA-AD-105 y CA-AD-106 NO CUMPLEN. La marca [X] histórica se conserva y no se toma como evidencia de cumplimiento.

## 1. Objetivo y criterios

Verificar la existencia de un catálogo central, persistente y consistente de módulos y capacidades; su agrupación en responsabilidades reutilizables; la asignación de responsabilidades a roles y usuarios con ámbitos independientes; la independencia de capacidades compartidas al retirar permisos; y la trazabilidad de creación, modificación y desactivación.

- **CA-AD-104:** una misma capacidad se reutiliza en diferentes roles con permisos y ámbitos independientes.
- **CA-AD-105:** retirar permisos de una responsabilidad no elimina funciones compartidas por otros roles.
- **CA-AD-106:** las asignaciones de roles y responsabilidades registran trazabilidad completa.

## 2. Fuentes, estado y evidencia Git

| Archivo | SHA Git | Sección inspeccionada |
|---|---|---|
| completadas.md | f57f1aef832e81e44fc4f7ec36a852d50e464676 | F8-Task08, líneas 4945–4966 |
| js/config.js | 49ef90807e5b9dfe1379f76d66efdb4ccd2b6cdc | Catálogos, líneas 1–72; contratos de módulos, aprox. 755–803 |
| backend/user-service/Code.gs | 12079dd410aa6d8afbce55a4bc62a79dea605f9f | Catálogo de capacidades/módulos 8928–8966; responsabilidades 8968–9114; asignaciones/ámbitos 9116–9180; roles internos/asignaciones 9631–9808; RBAC 920–970 |
| backend/developer-service/Code.gs | 8aa4bac67cfe5c8c54da51a0784a56fef633e412 | ROLE_PERMISSIONS/dispatcher; catálogo 2224–2259; contratos 2262–2283; multirol 2584–2596 |
| tests/regression/modular-dashboard-suite.js | 0495e1d526a872c33310935a003a83d924d34683 | Líneas 1–61 |
| js/api.js | 6b24f666db30a811a8e9b38d466fc6001cf6dfa9 | fetchApi y enriquecimiento de payload, líneas 1–70 |
| js/ui-common.js | 986938b8a311a41ed4cb3d135b66b6aaea4bed67 | Consumidores de catálogos/roles y dashboard; no se encontró integración de gestión |
| AUDITORIAS/Auditoria.txt | 200fad44daaab20217ec23c48dba934d20fd9f79 | Reconciliación de hallazgos existentes |
| AUDITORIAS/MapaDependencias.md | 99bfb6cd18a8460b2dff327f5b514c0ea6586c77 | Dependencias y trazabilidad |
| AUDITORIAS/AUDITORIA_COMPLETADAS_PLAN.md | a086b54baac1a80209ae89df9ff7b9caf0b4c2aa | Continuidad hasta F8-Task07 |
| AUDITORIAS/Contexto_personal.txt | 384825b0051146abd001e7a9bb02ebf408b51206 | Checkpoint C1.267 y reglas de continuidad |
| METODOLOGIA_DESARROLLO.md | cf796728bb384a32537392df2f9c72a339fa03ee | Procedimiento de auditoría, trazabilidad, checkpoint y publicación |

El informe individual de F8-Task08 no está en el árbol de la rama. La tarea se marca [X], pero se inspeccionaron las implementaciones y las pruebas en lugar de aceptar esa marca como validación.

### Revisión de Pendientes.md y duplicados

La lectura normal de Pendientes.md devolvió 0 caracteres. Se recuperó el blob que está referenciado por el árbol Git actual: SHA 676a3f798715f0cdd7d4bc75768472545b8465ee, 1.786.011 caracteres, 20.224 líneas y 0 caracteres U+FFFD. Se confirmó que el archivo del HEAD apunta a ese mismo blob. Se consultaron las entradas TASK-488, TASK-501, TASK-505 y TASK-636, y se verificó que los IDs nuevos TASK-661 a TASK-665 no aparecen allí. No se restauró ni modificó Pendientes.md.

## 3. Evidencia técnica

### 3.1 Catálogo de capacidades y módulos duplicado en tres capas

En js/config.js, líneas 1–72, existen arreglos globales CAPACITIES_CATALOG, MODULES_CATALOG y RESPONSIBILITIES_CATALOG. Los getters getCentralCapabilitiesCatalog() y getInstitutionalResponsibilitiesCatalog() devuelven directamente esos arreglos locales; no consultan un repositorio central ni sincronizan el catálogo de roles/capacidades/módulos desde un servicio.

En backend/user-service/Code.gs, líneas 8928–8966, getCentralCapabilitiesCatalog() vuelve a declarar ocho capacidades y trece módulos como arreglos locales y devuelve success. No consulta ni persiste hojas de catálogo de capacidades o módulos.

En backend/developer-service/Code.gs, líneas 2224–2259, existe otra implementación de getCentralCapabilitiesCatalog() que vuelve a declarar las mismas ocho capacidades y trece módulos. Tampoco lee ni escribe un catálogo persistente. Los tres arreglos pueden divergir con cambios independientes.

La función getCentralConfigAndContractCatalog(), USER/DEVELOPER contract map, describe acciones y versiones de servicios; no es un catálogo maestro de capacidades y módulos ni resuelve sus relaciones con responsabilidades.

### 3.2 Inconsistencias entre los módulos declarados y los módulos referenciados

MODULES_CATALOG declara trece moduleId. La responsabilidad RESP_CONSULTA_ESTUDIANTIL, en js/config.js, referencia:
- mod_mi_horario_estudiante
- mod_mis_tareas_entregas
- mod_mis_calificaciones
- mod_mi_asistencia

Ninguno de esos cuatro identificadores aparece en MODULES_CATALOG ni en el arreglo de módulos devuelto por USER/DEVELOPER. Por tanto, la responsabilidad apunta a módulos sin definición en el catálogo.

La definición DYNAMIC_DASHBOARD_MODULE_CONTRACTS cubre seis módulos, mientras MODULES_CATALOG declara trece. Los siete restantes carecen de contrato de integración en ese mapa. No se acredita que todos los módulos del catálogo tengan servicio destino, acción de lectura/escritura, capacidades requeridas y ruta operativa.

### 3.3 Catálogo de responsabilidades: persistencia parcial y fallback engañoso

En USER Code.gs, líneas 8968–9032, getInstitutionalResponsibilitiesCatalog() consulta la hoja ResponsabilidadesInstitucionales y filtra los registros activos. Si no encuentra responsabilidades activas —incluido el caso en que todas fueron desactivadas— devuelve tres responsabilidades codificadas (Coordinación, Planificación y Supervisión) con status success.

Esto mezcla datos persistidos con datos de fallback y hace que una institución sin responsabilidades activas parezca disponer de tres responsabilidades vigentes. El cliente no puede distinguir un catálogo realmente persistido de una respuesta por defecto.

En js/config.js se declara una lista estática de cinco responsabilidades, mientras el fallback del backend contiene tres. Las dos fuentes no son equivalentes. La responsabilidad estudiantil contiene los cuatro moduleId huérfanos identificados arriba.

### 3.4 Persistencia de capacidades, módulos y relaciones

saveInstitutionalResponsibility(), USER Code.gs líneas 9034–9114, guarda en la hoja ResponsabilidadesInstitucionales los campos ResponsibilityID, nombre, descripción, ModulosJSON, CapacidadesJSON, estado, creador y fecha de actualización. La persistencia se limita a las listas JSON incluidas en cada responsabilidad.

No se observa en estas funciones una tabla maestra persistente para las capacidades ni para los módulos, ni validación referencial que compruebe que cada moduleId y capacityId enviado exista, esté activo y corresponda al catálogo. La función solo valida que exista name; acepta módulos/capacidades arbitrarios y serializa los valores recibidos.

La existencia de nombres de hojas como Roles, Capacidades, ResponsabilidadCapacidades, RolResponsabilidades y RegistroModulos en el inventario/configuración de hojas del servicio Developer no demuestra que el modelo se cree, se mantenga o sea consumido. Los endpoints inspeccionados no usan esas relaciones como fuente efectiva.

### 3.5 Asignación de roles, responsabilidades y ámbitos

USER Code.gs, líneas 9116–9180, assignRoleScope() persiste userId, roleId, scopeType y scopeValues en AsignacionesAmbitosRoles. Sin embargo, no enlaza un responsibilityId ni capacidades. Su actualización busca por userId + scopeType y no incluye roleId en la clave de búsqueda; una asignación para otro rol con el mismo tipo de ámbito puede actualizar la fila existente en lugar de mantener una relación independiente.

DEVELOPER Code.gs, líneas 2584–2596, manageUserMultiRolePermissions() exige userId y devuelve roles y assignedAreas recibidos (o valores por defecto). No escribe en SpreadsheetApp, no crea relaciones, no valida roles/capacidades/ámbitos y no registra auditoría. La respuesta success no representa una asignación persistida.

Por tanto, no existe una relación funcional completa rol ↔ responsabilidad ↔ capacidad ↔ módulo ↔ ámbito que permita reutilizar la misma capacidad con permisos independientes por rol y alcance. La presencia de IDs compartidos en arreglos estáticos no acredita esa independencia.

### 3.6 Trazabilidad de cambios y desactivaciones

saveInstitutionalResponsibility() invoca recordEntityChangeLog(), pero cuando actualiza una responsabilidad el objeto anterior enviado al registro contiene únicamente name; no incluye los módulos, capacidades ni estado previos. El nuevo objeto sí contiene módulos, capacidades y estado. No queda un snapshot completo de la configuración anterior.

En USER Code.gs, manageInternalRoleCatalog(), líneas 9631–9728, las acciones activar/desactivar cambian el estado y fecha de actualización y retornan success inmediatamente. Esa rama no registra logStructuredEvent ni un historial de transición con estado anterior/nuevo, actor y motivo.

getInternalRoleAssignments() consulta asignaciones, pero la función multirol de Developer no persiste los cambios que dice realizar. No se puede acreditar trazabilidad completa de las asignaciones de rol/responsabilidad ni referencias históricas completas al desactivar.

### 3.7 Pruebas existentes

tests/regression/modular-dashboard-suite.js, líneas 1–61, comprueba existencia de archivos y presencia de nombres/cadenas en config.js y Developer Code.gs. No comprueba consistencia entre catálogos, validez de IDs, reutilización de capacidades, independencia por rol/ámbito, preservación de permisos compartidos ni historial de desactivación.

La suite runModularAndDynamicDashboardsRegressionSuite() en Developer contiene una prueba de catálogo que solo verifica status success y que modulos sea un arreglo. Su prueba multirol invoca manageUserMultiRolePermissions() y considera suficiente que devuelva status success; como la función simplemente refleja el payload, la prueba puede pasar sin persistencia real. La respuesta global de la suite puede seguir siendo status success aunque haya casos fallidos, mientras todasPruebasPasaron informa el resultado booleano.

No se ejecutó Node ni Apps Script. El examen de estas pruebas fue estático/manual; no se afirma que la suite haya sido ejecutada.

## 4. Hallazgos

### AUD-NG-307 — Catálogo no central: capacidades y módulos duplicados en cliente y dos servicios
- **Severidad:** ALTO/P1.
- **Criterio relacionado:** requisito funcional 1; CA-AD-104.
- **Evidencia:** config.js:1–72; USER Code.gs:8928–8966; DEVELOPER Code.gs:2224–2259.
- **Descripción:** las mismas listas se mantienen en tres ubicaciones, sin un origen persistente único. Los getters del cliente leen arreglos locales y ambos servicios construyen su propia respuesta estática.
- **Impacto:** divergencia de capacidades, nombres, módulos y servicios; cambios que no se propagan; dashboard y backend pueden interpretar catálogos diferentes.
- **Estado:** confirmado.

### AUD-NG-308 — Referencias huérfanas y ausencia de validación referencial de módulos/capacidades
- **Severidad:** ALTO/P1.
- **Criterio relacionado:** requisito funcional 1; CA-AD-104.
- **Evidencia:** config.js:1–72 y aprox. 755–803; USER Code.gs:8968–9114; USER/DEVELOPER Code.gs catálogos estáticos.
- **Descripción:** cuatro IDs de la responsabilidad estudiantil no existen en el catálogo de módulos; solo seis de trece módulos tienen contrato dinámico; saveInstitutionalResponsibility acepta listas arbitrarias sin validar IDs ni estado.
- **Impacto:** responsabilidades pueden apuntar a módulos inexistentes o sin contrato; permisos configurados pueden no corresponder a funciones reales.
- **Estado:** confirmado.

### AUD-NG-309 — No existe relación persistente efectiva entre roles, responsabilidades, capacidades y ámbitos
- **Severidad:** CRÍTICO/P0.
- **Criterios relacionados:** CA-AD-104 y CA-AD-105.
- **Evidencia:** USER Code.gs:9116–9180; DEVELOPER Code.gs:2584–2596; USER Code.gs:8968–9114.
- **Descripción:** assignRoleScope solo almacena roleId y scope, sin responsibilityId/capabilities; manageUserMultiRolePermissions devuelve el payload sin persistirlo. Las capacidades repetidas en arreglos no se traducen en asignaciones independientes ni en revocación aislada por rol.
- **Impacto:** no se puede garantizar que una capacidad compartida conserve la autorización de otros roles al retirar una responsabilidad; las asignaciones múltiples pueden ser solo respuestas aparentes.
- **Estado:** confirmado.

### AUD-NG-310 — Auditoría incompleta de modificaciones y desactivaciones
- **Severidad:** ALTO/P1.
- **Criterio relacionado:** CA-AD-106.
- **Evidencia:** USER Code.gs:9034–9114 y 9631–9728; DEVELOPER Code.gs:2584–2596.
- **Descripción:** el snapshot anterior de responsabilidad solo conserva el nombre; la rama activar/desactivar de roles internos actualiza estado/fecha y retorna sin registrar evento; la función multirol no persiste ni audita.
- **Impacto:** no se puede reconstruir quién cambió módulos/capacidades, qué valores fueron retirados, qué rol/ámbito quedó vigente ni la secuencia de asignaciones.
- **Estado:** confirmado.

### AUD-NG-311 — El catálogo devuelve responsabilidades predeterminadas cuando no hay ninguna activa
- **Severidad:** ALTO/P1.
- **Criterio relacionado:** requisito funcional 5; CA-AD-105/106.
- **Evidencia:** USER Code.gs:8968–9032; config.js:32–72.
- **Descripción:** cuando la hoja no tiene filas activas, getInstitutionalResponsibilitiesCatalog devuelve tres responsabilidades hardcodeadas con estado Activa y status success. La respuesta no informa que es fallback ni distingue catálogo vacío de catálogo configurado.
- **Impacto:** desactivar todas las responsabilidades no produce un catálogo vacío/denegado; pueden reaparecer capacidades predeterminadas y ocultarse la ausencia de configuración real.
- **Estado:** confirmado.

## 5. Matriz de aceptación

| Criterio | Dictamen | Justificación |
|---|---|---|
| CA-AD-104 | NO CUMPLE | No hay relación persistente rol-responsabilidad-capacidad-ámbito. Los catálogos estáticos repiten IDs, pero no prueban permisos independientes por rol y alcance. |
| CA-AD-105 | NO CUMPLE | No existe asignación efectiva que permita demostrar revocación aislada; el fallback puede devolver responsabilidades predeterminadas cuando no queda ninguna activa. |
| CA-AD-106 | NO CUMPLE | El registro anterior de responsabilidad es parcial, la desactivación de rol interno no registra evento y la función multirol no persiste ni audita. |

## 6. Tareas ejecutables derivadas de los hallazgos de la auditoría

Se verificó que TASK-661 a TASK-665 no aparecen en el blob actual de Pendientes.md ni en los registros consultados. TASK-488, TASK-501, TASK-505 y TASK-636 ya existen y se mantienen como dependencias; no se duplican sus alcances de dashboard, RBAC y token.

### TASK-661 — Crear fuente única y persistente de capacidades y módulos
- **Hallazgo:** AUD-NG-307.
- **Severidad/Prioridad:** ALTO/P1.
- **Objetivo:** reemplazar los arreglos duplicados por un catálogo maestro versionado y persistente.
- **Archivos/componentes:** USER Code.gs, DEVELOPER Code.gs, js/config.js, servicios consumidores.
- **Dependencias:** autenticación/roles; contratos de módulos; almacenamiento institucional.
- **Alcance:** definir IDs estables, operaciones, servicios, estados y versiones; mantener una única fuente autoritativa; exponer lecturas autorizadas; sincronizar o eliminar copias locales; distinguir catálogo vacío/error de valores de fallback.
- **Aceptación:** ambos servicios y el frontend obtienen el mismo catálogo; actualizar una entrada se refleja en todos los consumidores; no hay listas duplicadas como fuentes autoritativas; errores/ausencia no devuelven un catálogo alternativo con status success.
- **Estado:** Pendiente.

### TASK-662 — Validar integridad referencial de módulos, capacidades y contratos
- **Hallazgo:** AUD-NG-308.
- **Severidad/Prioridad:** ALTO/P1.
- **Objetivo:** impedir que una responsabilidad se guarde con módulos/capacidades inexistentes o inactivos.
- **Archivos/componentes:** USER Code.gs, js/config.js, contratos de módulos y pruebas.
- **Dependencias:** TASK-661.
- **Alcance:** validar tipo, formato, unicidad y estado de cada ID; comprobar que todo módulo tenga contrato/servicio/acciones/capacidades coherentes; resolver los cuatro IDs huérfanos de la responsabilidad estudiantil; rechazar referencias desconocidas sin guardar parcialmente.
- **Aceptación:** todas las referencias de responsabilidades existen en los catálogos; todos los módulos publicables tienen contrato operativo; una referencia inválida devuelve error y no modifica datos; pruebas cubren IDs desconocidos, inactivos y duplicados.
- **Estado:** Pendiente.

### TASK-663 — Persistir relaciones reutilizables rol-responsabilidad-capacidad-módulo-ámbito
- **Hallazgo:** AUD-NG-309.
- **Severidad/Prioridad:** CRÍTICO/P0.
- **Objetivo:** implementar relaciones muchos-a-muchos con independencia de permisos y ámbitos.
- **Archivos/componentes:** USER Code.gs, DEVELOPER Code.gs, tablas/hojas de relaciones, motor RBAC, dashboard y asignaciones.
- **Dependencias:** TASK-661, TASK-662, TASK-501, TASK-505 y TASK-488.
- **Alcance:** persistir rol-responsabilidad, responsabilidad-capacidad y asignaciones de usuario con roleId, responsibilityId, moduleId, operation/capacityId y scope; evitar que una actualización por userId+scopeType sobrescriba otra relación de rol; revocar solo la relación seleccionada; recalcular permisos efectivos sin borrar definiciones compartidas.
- **Aceptación:** una misma capacidad se asigna a dos roles con permisos/ámbitos diferentes; retirar una relación no altera la otra; múltiples roles/responsabilidades quedan persistidos y recuperables; fallos de escritura no devuelven éxito.
- **Estado:** Pendiente.

### TASK-664 — Completar historial auditable de roles, responsabilidades y asignaciones
- **Hallazgo:** AUD-NG-310.
- **Severidad/Prioridad:** ALTO/P1.
- **Objetivo:** registrar historial íntegro e inmutable de creación, actualización, asignación, revocación, activación y desactivación.
- **Archivos/componentes:** USER Code.gs, DEVELOPER Code.gs, registro de cambios y esquema de auditoría.
- **Dependencias:** TASK-663 y sistema de eventos/auditoría.
- **Alcance:** guardar actor derivado de token verificado, fecha, entidad/ID, acción, motivo, estado anterior y posterior completos, roles, capacidades, módulos y ámbitos; preservar versiones históricas al desactivar; auditar cambios de estado antes de retornar.
- **Aceptación:** cada operación deja un evento consultable; el snapshot anterior y nuevo contiene todos los campos relevantes; una desactivación conserva el ID y el historial; no se confía en actor/rol suministrado libremente por el cliente.
- **Estado:** Pendiente.

### TASK-665 — Añadir regresión funcional para el catálogo y las relaciones
- **Hallazgo:** AUD-NG-307 a AUD-NG-311.
- **Severidad/Prioridad:** ALTO/P1.
- **Objetivo:** probar comportamiento real y no solo presencia de nombres/cadenas.
- **Archivos/componentes:** tests/regression/modular-dashboard-suite.js, suite Developer, USER Code.gs y catálogo.
- **Dependencias:** TASK-661 a TASK-664.
- **Alcance:** pruebas de consistencia cross-service/frontend; referencias inválidas; capacidad compartida con permisos/ámbitos independientes; revocación aislada; catálogo vacío y desactivación total; snapshots de auditoría; fallo de persistencia.
- **Aceptación:** pruebas fallan ante cualquiera de las regresiones descritas; no consideran suficiente un status success de una función que no persiste; el resultado global es error si falla un caso; incluir evidencia de ejecución real en entorno de prueba.
- **Estado:** Pendiente.

## 7. Pruebas y límites

- **Inspección manual:** completadas.md; catálogos de config.js, USER y DEVELOPER; contratos de módulos; persistencia de responsabilidades; asignación de ámbitos; catálogo/roles internos; función multirol; dispatcher y permisos; pruebas de regresión; dependencias y hallazgos anteriores.
- **Pruebas ejecutadas:** inspección de código y documentación, revisión del árbol Git, comprobación de inexistencia del informe, recuperación del blob actual de Pendientes.md, comparación de ramas y verificación de IDs.
- **No ejecutadas:** Node, navegador/DOM, Apps Script runtime, HTTP, pruebas reales de Google Sheets, múltiples roles/usuarios, revocación, persistencia y E2E.
- **Limitaciones:** no hay acceso al despliegue Apps Script ni a los datos de las hojas productivas; no se puede certificar si las hojas contienen datos reales ni si hay integraciones externas no versionadas.
- **Código fuente:** sin modificaciones.
- **Archivos maestros de tareas:** completadas.md y Pendientes.md sin modificaciones; la marca [X] histórica se conserva.
- **Rama base:** sin modificaciones.
- **Dictamen final:** NO CUMPLE en CA-AD-104, CA-AD-105 y CA-AD-106.

## 8. Continuidad

- **Última tarea auditada:** F8-Task08 / TAREA-AD-02.
- **Checkpoint inicial:** C1.267.
- **Checkpoint de cierre:** C1.268.
- **Siguiente tarea exacta:** F8-Task09 — gestión del ámbito de actuación de los roles.
- **Próxima acción:** verificar si existe AUDITORIAS/AUDITORIA_COMPLETADAS_F8-TASK09.md; si falta, auditar directamente USER Code.gs, ACADEMIC Code.gs, ui-common.js y las asignaciones para comprobar ámbitos por responsabilidad, jerarquías académicas, vigencia temporal, aislamiento en lectura/escritura y denegación por defecto.
- **Commit de cierre:** SHA final confirmado consultando HEAD después de publicar.
