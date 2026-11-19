# Auditoría F8-Task12 / TAREA-AD-07 — Consola administrativa de roles, responsabilidades y dashboards

- Fecha: 2026-11-08.
- ID de sesión operativo: IMA-AUDIT-20261108-2320Z-01 (identificador documental; no es ID nativo de ChatGPT).
- Checkpoint inicial: C1.271.
- Checkpoint de cierre previsto: C1.272.
- Repositorio: i-miss-cocaine/IMA.
- Rama de trabajo: NG_beta_0.0.0.1_work.
- HEAD de partida verificado: 551f8868e51b8a99cf0d98d8f57a0180fd6063ef.
- Rama base protegida indicada en C1.271: NG_beta_0.0.1 @ 44d9891132332e692dbe2ba8602b41f50a508a59; comparación actual: 340 commits adelante, 0 detrás. La rama base no se modificó.
- Tarea auditada: F8-Task12 / TAREA-AD-07, marcada [X] en completadas.md, líneas 5046–5067.
- Informe individual previo: no existe AUDITORIAS/AUDITORIA_COMPLETADAS_F8-TASK12.md en el árbol de la rama; se ejecutó la auditoría directamente.
- Dictamen global: **NO CUMPLE**.
- CA-AD-116: NO CUMPLE.
- CA-AD-117: NO CUMPLE.

## 1. Objetivo y criterios de aceptación

Verificar que administradores autorizados puedan crear, editar, consultar, activar y desactivar roles y responsabilidades; asociar responsabilidades, capacidades y ámbitos; previsualizar el dashboard sin conceder permisos ni exponer datos; conservar las configuraciones históricas; recuperar la última configuración válida ante errores; y que el servidor rechace configuraciones inválidas antes de guardarlas como activas.

- CA-AD-116: administradores autorizados pueden configurar nuevos roles sin modificar archivos HTML fuente.
- CA-AD-117: configuraciones inválidas son rechazadas en el servidor antes de guardarse como activas.

## 2. Fuentes, continuidad e integridad documental

| Fuente | SHA | Inspección |
|---|---|---|
| completadas.md | f57f1aef832e81e44fc4f7ec36a852d50e464676 | F8-Task12 [X], líneas 5046–5067 |
| Pendientes.md actual | 676a3f798715f0cdd7d4bc75768472545b8465ee | blob actual recuperado directamente; lectura convencional 0 caracteres |
| Pendientes.md histórico solicitado | 631b4c2dbf0e86d5704b63625382d73ccb8ceb3c | blob histórico recuperado y comparado |
| dashboard-direccion.html | fefaa3bf7884288aef563cfb8aaf244e6cea8b7c | botón de consola y modal de roles |
| dashboard-secretaria.html | fa0d8c23aace24a6acab2d4956398a7f5e1309b8 | encabezado, scripts, controles administrativos y ausencia de acceso/modal de roles |
| js/secretary.js | 08a81266957b4c18cc25f8ba6749eac30a8f2c2c | controlador F8-Task12, líneas 455–515 |
| backend/user-service/Code.gs | 12079dd410aa6d8afbce55a4bc62a79dea605f9f | catálogo de capacidades/responsabilidades, persistencia, asignaciones, autenticación y dispatcher |
| AUDITORIAS/AUDITORIA_COMPLETADAS_F8-TASK11.md | 81b2b9c3047cf249a8c96535f33f7647b0d2635d | antecedentes F8-Task11 y tareas existentes |
| AUDITORIAS/Auditoria.txt | c45bef96e425eb8b6a72552b014a44456a282fae | hallazgos hasta AUD-NG-324 |
| AUDITORIAS/MapaDependencias.md | f9c9010d038251eb2e82403125d62aeb3e555e59 | dependencias y hallazgos F8 previos |
| AUDITORIAS/AUDITORIA_COMPLETADAS_PLAN.md | d32a060e68ae1c8ce556b0018ca374950ea6a5ba | continuidad y tareas derivadas hasta F8-Task11 |
| AUDITORIAS/Contexto_personal.txt | cbd1eb2839e99829a173625524be62f002239132 | reglas prioritarias y checkpoint C1.271 |
| METODOLOGIA_DESARROLLO.md | cf796728bb384a32537392df2f9c72a339fa03ee | gates, auditoría manual, commit único y checkpoints |

### Recuperación e inventario de Pendientes.md

La lectura ordinaria de Pendientes.md devolvió 0 caracteres. Se recuperó el blob actual de la rama y también el blob histórico indicado por el usuario.

- HEAD de partida consultado: 551f8868e51b8a99cf0d98d8f57a0180fd6063ef.
- Blob actual del árbol de la rama: 676a3f798715f0cdd7d4bc75768472545b8465ee.
- Blob histórico solicitado: 631b4c2dbf0e86d5704b63625382d73ccb8ceb3c.
- Blob actual: 1.807.629 bytes; 1.786.011 caracteres; 20.224 líneas; 0 caracteres U+FFFD; 515 IDs TASK-NNN únicos; máximo TASK-636.
- Blob histórico: 1.803.672 bytes; 1.782.094 caracteres; 20.182 líneas; 0 caracteres U+FFFD; 511 IDs TASK-NNN únicos; máximo TASK-511.
- El blob actual contiene 42 líneas y cuatro IDs únicos adicionales. Ambos contenidos se recuperaron íntegramente desde Git.
- Estados completados/pendientes: no se cuantifican porque el formato de estados del backlog no permite un conteo fiable sin interpretar cada registro.
- Decisión: conservar el blob actual 676a3f79… porque es la versión posterior que ya pertenece al HEAD de la rama y contiene más información. No restaurar el blob histórico anterior ni modificar Pendientes.md.

## 3. Evidencia técnica

### 3.1 La consola visual es un catálogo de solo lectura, no una interfaz administrativa

**dashboard-direccion.html, líneas 45–55 y 420–439**
- Existe el botón btn-role-config-admin en el encabezado.
- Existe modal-role-responsibility-config, cuyo contenido inicial es únicamente un contenedor con mensaje de carga.
- El modal no declara formulario de creación/edición, campos para rol, responsabilidad, módulo, capacidad o ámbito, botones de guardar/desactivar/activar, ni controles de vista previa.

**dashboard-secretaria.html, líneas 28–40 y sección de scripts/modales**
- El encabezado ofrece gestión de usuarios y cierre de sesión, pero no botón btn-role-config-admin.
- No existe el modal de configuración de roles y responsabilidades en esta página.
- La página carga secretary.js, pero sin el botón ni el contenedor del modal el controlador F8-Task12 no queda accesible desde el dashboard de Secretaría.

**js/secretary.js, líneas 455–515**
- El listener conecta btn-role-config-admin con openRoleResponsibilityConfigModal.
- openRoleResponsibilityConfigModal solo abre el modal y llama loadRoleConfigAdminData.
- loadRoleConfigAdminData consulta getCentralCapabilitiesCatalog y getInstitutionalResponsibilitiesCatalog mediante Promise.all.
- El HTML generado enumera responsabilidades y capacidades. No renderiza controles de edición, altas, desactivación, asignación de ámbitos ni acciones de guardado.
- Aunque el catálogo de capacidades también devuelve módulos, el controlador consume resCaps.capacidades y no utiliza resCaps.modulos.
- No invoca saveInstitutionalResponsibility, manageInternalRoleCatalog, assignRoleScope ni una operación equivalente de escritura.
- No hay una operación UI que configure la asociación rol-responsabilidad-módulo-capacidad-ámbito.

**Conclusión:** hay una entrada visual y un catálogo consultable, pero no un CRUD administrativo utilizable. La capacidad de configurar roles sin editar HTML fuente no está implementada en esta consola. CA-AD-116 NO CUMPLE.

### 3.2 No existe vista previa aislada del dashboard

- El modal de dashboard-direccion.html, líneas 420–439, solo contiene role-config-admin-content.
- El controlador secretary.js, líneas 468–515, solo consulta y presenta listas de responsabilidades y capacidades.
- No existe en este flujo una selección de rol de prueba, un modo de previsualización, un renderer de dashboard de prueba ni una acción que permita validar la presentación sin modificar permisos reales.
- Tampoco se demuestra aislamiento de datos en una vista previa, porque la vista previa no está implementada.

**Conclusión:** el requisito de previsualizar el dashboard sin conceder permisos reales ni exponer datos no se cumple. CA-AD-116 NO CUMPLE.

### 3.3 El servidor no valida la integridad de una responsabilidad antes de guardarla como activa

**backend/user-service/Code.gs, líneas 8970–9032**
- getInstitutionalResponsibilitiesCatalog lee las filas activas de ResponsabilidadesInstitucionales.
- Cuando no encuentra responsabilidades activas, devuelve tres responsabilidades hardcodeadas como Activas: Coordinación Académica, Planificación y Horarios y Supervisión Docente.
- Este fallback no representa una recuperación de la última configuración válida ni distingue una configuración vacía de una configuración de ejemplo. Reconfirma AUD-NG-311; no se crea un hallazgo duplicado.

**backend/user-service/Code.gs, líneas 9034–9114**
- saveInstitutionalResponsibility requiere únicamente name.
- modules y capabilities aceptan arreglos vacíos por defecto.
- estado acepta cualquier valor de payload y, si no se proporciona, se guarda como Activa.
- No valida que cada moduleId exista en el catálogo central.
- No valida que cada capacityId exista, que las capacidades sean compatibles con los módulos ni que la relación tenga integridad referencial.
- No valida el conjunto permitido de estados, duplicidad semántica ni consistencia de la configuración antes de persistirla.
- Por tanto, una responsabilidad sin módulos ni capacidades, o con identificadores arbitrarios, puede llegar a guardarse con estado Activa.
- doPost sí ejecuta validateRolePermission antes del dispatcher (líneas 1351–1373); esta puerta de autenticación/autorización externa existe y no se confunde con la validación de contenido que falta en saveInstitutionalResponsibility.
- El dispatcher contiene las rutas de consulta/guardado de responsabilidades y asignaciones; la presencia de la ruta no acredita validación de negocio.

**Conclusión:** el servidor no rechaza de forma suficiente una configuración inválida antes de guardarla como activa. CA-AD-117 NO CUMPLE.

### 3.4 La edición sobrescribe la configuración anterior y no existe recuperación de última versión válida

**backend/user-service/Code.gs, líneas 9058–9101**
- Cuando responsibilityId ya existe, saveInstitutionalResponsibility actualiza la misma fila y reemplaza nombre, descripción, módulos, capacidades, estado, actor y fecha.
- No crea una versión inmutable, snapshot, número de versión ni referencia a una configuración anterior.
- recordEntityChangeLog registra como valores anteriores solo el nombre; no conserva el conjunto previo de módulos, capacidades y estado que permitiría reconstruir la configuración completa.
- No se encontró en el flujo inspeccionado una operación de restauración o rollback a la última versión válida.
- No se observó eliminación física en este endpoint; sin embargo, la ausencia de borrado no sustituye el versionado ni la recuperación requeridos.

**Conclusión:** editar una responsabilidad puede destruir la configuración activa anterior como estado recuperable. La preservación histórica y la recuperación ante errores no están implementadas.

### 3.5 Las responsabilidades no quedan vinculadas desde esta consola a roles y ámbitos efectivos

- saveInstitutionalResponsibility persiste responsibilityId, nombre, descripción, módulos, capacidades y estado; no registra una relación con un roleId.
- loadRoleConfigAdminData solo consulta y muestra catálogos; no llama a assignRoleScope ni a una operación que vincule un rol con una responsabilidad.
- assignRoleScope es un endpoint separado. Su upsert busca por userId + scopeType y no incluye roleId en la clave de coincidencia (líneas 9116–9160), cuestión ya identificada en AUD-NG-313.
- getUserDynamicDashboardConfig mantiene una asignación hardcodeada de módulos por rol (líneas 9254–9300), en vez de demostrar que consuma las responsabilidades que presenta esta consola.
- Estos elementos reconfirman AUD-NG-309, AUD-NG-313 y AUD-NG-321; se amplían las tareas existentes TASK-663 y TASK-667, sin duplicar hallazgos ya registrados.

## 4. Hallazgos

### AUD-NG-325 — La consola administrativa solo consulta catálogos y no permite CRUD de roles/responsabilidades
- Severidad/Prioridad: ALTO/P1.
- Criterio: CA-AD-116.
- Evidencia: dashboard-direccion.html:45–55 y 420–439; dashboard-secretaria.html:28–40; js/secretary.js:455–515.
- Descripción: el botón abre un modal que consulta dos catálogos y representa listas estáticas. No hay formulario, operaciones de escritura, selección de módulos, asignación de capacidades/ámbitos ni acciones de activar/desactivar. Secretaría tampoco tiene botón ni modal.
- Impacto: un administrador no puede completar la configuración desde la interfaz; la existencia de endpoints backend aislados no satisface el flujo administrativo solicitado.
- Reconciliación: amplía TASK-505 (consola y ciclo de vida), TASK-663 (relaciones) y TASK-665 (pruebas funcionales).

### AUD-NG-326 — No existe vista previa de dashboard sin conceder permisos ni exponer datos
- Severidad/Prioridad: ALTO/P1.
- Criterio: CA-AD-116 y requisito funcional de previsualización.
- Evidencia: dashboard-direccion.html:420–439; js/secretary.js:462–515.
- Descripción: el modal no contiene controles ni renderer de previsualización; el controlador solo carga catálogos y genera listas.
- Impacto: no se puede revisar el dashboard resultante de una configuración antes de activarla ni demostrar que la vista previa esté aislada de permisos y datos reales.
- Reconciliación: amplía TASK-505, TASK-488 y TASK-665; no se crea una tarea genérica de dashboard separada.

### AUD-NG-327 — saveInstitutionalResponsibility permite persistir configuraciones incompletas o referencialmente inválidas como activas
- Severidad/Prioridad: ALTO/P1.
- Criterio: CA-AD-117.
- Evidencia: USER Code.gs:9034–9114; dispatcher doPost:1351–1373.
- Descripción: la validación de negocio exige únicamente name; modules/capabilities pueden estar vacíos o contener IDs arbitrarios; estado no se restringe y por defecto es Activa. No se validan módulos, capacidades, relaciones ni estado antes de escribir.
- Impacto: el servidor puede aceptar una responsabilidad activa que no tiene módulos/capacidades válidos y que no puede producir un dashboard autorizado y coherente.
- Límite: doPost sí ejecuta validateRolePermission antes del dispatcher; el hallazgo se refiere a validación del contenido de configuración, no a ausencia total de autenticación de la ruta.
- Reconciliación: amplía TASK-662 (integridad referencial/contratos), TASK-661 (catálogo único) y TASK-665 (pruebas negativas).

### AUD-NG-328 — La actualización destruye el estado anterior y no hay versionado ni rollback de configuración válida
- Severidad/Prioridad: ALTO/P1.
- Criterio: requisitos funcionales de conservación histórica y recuperación.
- Evidencia: USER Code.gs:9058–9101; getInstitutionalResponsibilitiesCatalog:8970–9032.
- Descripción: la edición reemplaza la misma fila; el log de cambios conserva únicamente el nombre anterior, no la configuración íntegra; no hay número de versión, snapshot ni endpoint de restauración. El fallback de catálogo presenta tres defaults como activos si no existen responsabilidades activas, pero no recupera la última versión válida.
- Impacto: un error de edición o activación no puede revertirse con evidencia íntegra y el fallback puede ocultar la ausencia de una configuración válida.
- Reconciliación: amplía TASK-505, TASK-661, TASK-664 y TASK-665. El fallback reconfirma AUD-NG-311 y no se duplica.

## 5. Matriz de aceptación

| Requisito / criterio | Dictamen | Justificación |
|---|---|---|
| CRUD visual de roles y responsabilidades | NO CUMPLE | El modal solo consulta y muestra catálogos. |
| Asociación de módulos, capacidades y ámbitos | NO CUMPLE | No hay controles ni operaciones de escritura desde la consola; la relación rol-responsabilidad sigue sin integrarse. |
| Previsualización aislada | NO CUMPLE | No existe vista previa ni renderer de prueba. |
| Conservación histórica y recuperación | NO CUMPLE | La edición sobrescribe la fila y no existe rollback a versión válida. |
| Prohibición de eliminación física | PARCIAL / NO ACREDITADO | El endpoint revisado no elimina filas físicamente, pero no ofrece un ciclo de vida completo ni historial recuperable. |
| CA-AD-116 | NO CUMPLE | No se puede configurar desde la interfaz ni previsualizar el resultado. |
| CA-AD-117 | NO CUMPLE | El servidor no valida IDs, relaciones, colecciones ni estado antes de guardar como Activa. |

## 6. Tareas ejecutables derivadas de los hallazgos de la auditoría

Se consultaron completadas.md, Pendientes.md recuperado desde el blob actual de la rama, el plan, el mapa y los hallazgos previos. No se crea un TASK-NNN nuevo: las causas raíz ya están cubiertas por tareas existentes y crear otra tarea duplicaría alcances.

### Tareas existentes ampliadas

- TASK-505 — Consola administrativa y ciclo de vida: implementar CRUD real de roles/responsabilidades; edición y desactivación lógica; selección de módulos, capacidades y ámbitos; formularios accesibles; previsualización aislada; recuperación/versionado de configuración.
- TASK-661 — Catálogo central persistente: eliminar el fallback de responsabilidades de ejemplo como si fueran configuraciones activas; distinguir catálogo vacío, error de fuente y configuración válida.
- TASK-662 — Integridad de catálogo y contratos: validar en backend moduleId/capacityId, referencias, compatibilidad, tipos, estado permitido, obligatoriedad y consistencia antes de guardar/activar.
- TASK-663 — Relaciones muchos-a-muchos: persistir y consumir relaciones rol-responsabilidad-capacidad-módulo-ámbito, sin listas hardcodeadas por rol.
- TASK-664 — Trazabilidad: registrar snapshots completos antes/después, actor verificado, versión, motivo, transición y correlación; permitir reconstruir el estado histórico.
- TASK-667 / TASK-668 — Asignaciones y resolución de ámbitos: vincular el ámbito al usuario y rol correctos, mantener claves no colisionantes y vigencia/jerarquía verificables.
- TASK-665 — Regresión funcional: probar CRUD, denegación de roles no autorizados, referencias inválidas, activación, previsualización sin efectos, desactivación lógica, conservación de versiones, rollback y recuperación.
- TASK-501 / TASK-666 — Autorización: mantener el enforcement server-side por acción, capacidad y ámbito; la interfaz no puede conceder permisos.
- TASK-636 — Identidad: vincular actor y configuración a la identidad autenticada/verificada, no a valores de rol o usuario proporcionados libremente por el cliente.
- TASK-488 — Dashboards dinámicos: consumir las relaciones persistentes y permitir validar la composición antes de activar.

### Tareas ya cubiertas; no duplicar

- AUD-NG-309 ya registra la ausencia de relaciones persistentes rol-responsabilidad-capacidad-módulo-ámbito: ampliar TASK-663.
- AUD-NG-311 ya registra el fallback de responsabilidades hardcodeadas: ampliar TASK-661.
- AUD-NG-313 ya registra la colisión de upsert por userId + scopeType: ampliar TASK-667.
- AUD-NG-321 ya registra contratos incompletos y no consumidos: ampliar TASK-662/TASK-663.
- No se crea otra tarea genérica de RBAC, autenticación, auditoría, catálogo ni pruebas.

## 7. Pruebas y límites

- Inspección manual realizada: completadas.md:5046–5067; dashboard-direccion.html:45–55 y 420–439; dashboard-secretaria.html:28–40 y scripts/modales; secretary.js:455–515; USER Code.gs:8970–9160, 9254–9300, dispatcher/doPost:1351–1373 y rutas de responsabilidades; informes F8-Task08..11; Auditoria.txt, MapaDependencias.md, plan y contexto.
- Recuperación Git realizada: blob actual 676a3f798715f0cdd7d4bc75768472545b8465ee y blob histórico 631b4c2dbf0e86d5704b63625382d73ccb8ceb3c; ambos íntegros, comparados y sin U+FFFD.
- Comparación de rama: HEAD 551f8868e51b8a99cf0d98d8f57a0180fd6063ef confirmado idéntico a NG_beta_0.0.0.1_work; comparación con base 44d9891132332e692dbe2ba8602b41f50a508a59: 340 commits adelante, 0 detrás.
- No ejecutados: Node, Apps Script runtime, HTTP, navegador/DOM, cuentas reales, Google Sheets productivas, previsualización interactiva, rollback runtime ni E2E.
- Límites: no hay acceso al deployment Apps Script ni a hojas productivas; el dictamen se basa en código y estructura versionada.
- Código fuente: sin modificaciones.
- Completadas.md y Pendientes.md: sin modificaciones.
- Rama base: sin modificaciones.

## 8. Continuidad

- Última tarea auditada: F8-Task12 / TAREA-AD-07.
- Checkpoint inicial: C1.271.
- Checkpoint de cierre previsto: C1.272.
- Siguiente tarea exacta: F8-Task13 — definir y aplicar una estructura modular de carpetas, marcada [X] en completadas.md líneas 5071–5093.
- Próxima acción: verificar si existe AUDITORIAS/AUDITORIA_COMPLETADAS_F8-TASK13.md; si falta, auditar directamente docs/architecture/folder-structure.md y backend/developer-service/Code.gs contra CA-MOD-103/104, verificando estructura real, index.htm en raíz, referencias/recursos, clasp/despliegue y exposición de archivos sensibles.
- Commit de cierre: se confirmará consultando HEAD después de publicar el único commit que contiene este informe y el checkpoint.
