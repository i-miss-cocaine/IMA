# Auditoría de tareas completadas: T-UX-21

- **Fecha:** 2026-11-06.
- **ID de sesión de auditoría/chat:** IMA-AUDIT-20261106-0254Z (inicio C1.63; sesión abierta; cierre pendiente).
- **Repositorio:** i-miss-cocaine/IMA.
- **Rama:** NG_beta_0.0.0.1_work.
- **HEAD de partida:** deba6d99ba00e6b4bcfb49d012762c7df12d1abc.
- **Dictamen:** **NO CUMPLE**.

## Especificación y antecedentes
T-UX-21 está marcada [X] en completadas.md, SHA f57f1aef832e81e44fc4f7ec36a852d50e464676. Exige fecha/hora de última actualización efectiva, estados actualizado/desactualizado/pendiente/error, acción manual aplicable y renovación del timestamp únicamente tras sincronización confirmada.
T-UX-04 ya fue auditada en C1.46. Su informe AUDITORIA_COMPLETADAS_T-UX-04.md (SHA 1d09e3a560ede58283adf4e09d547b84c2da2a58) registró AUD-NG-183/TASK-480. La tarea TASK-480 permanece pendiente en Pendientes.md, blob SHA 02c0beadb4bcb01fd54546759b6c529b27fd2113, y contiene los ocho puntos correctivos que cubren también la ampliación T-UX-21. Se confirma la persistencia de los defectos; no se crea tarea ni hallazgo duplicado.

## Evidencia técnica
- js/ui-common.js SHA 986938b8a311a41ed4cb3d135b66b6aaea4bed67: renderDataFreshnessBadge abre en 5438 y no cierra hasta 5789.
- Si lastUpdatedTimestamp es falsy, el renderer utiliza new Date() (aprox. 5446); no valida de forma segura fechas inválidas/futuras. Esto fabrica una apariencia de frescura sin fuente confirmada.
- El botón de actualización se crea siempre; el listener solo se instala si onRefreshCallback es función. Sin callback el botón queda visible pero inerte.
- El callback considera fallo solo success === false. Undefined u otros valores se aceptan como éxito; si updatedTimestamp no se entrega, la marca se renueva con new Date().toISOString(). Una excepción o ausencia de respuesta puede dejar el spinner activo.
- No se implementan de forma explícita y completa los estados actualizado, desactualizado, pendiente y error, ni un umbral de antigüedad documentado.
- La búsqueda de referencias en 15 archivos JS y 12 vistas HTML representativas no encontró invocaciones externas del badge. En ui-common.js aparecen su definición, el test nominal UX-04 y la llamada recursiva interna.
- Los helpers window.openUserManagementAdministrationModal (línea 5468) y window.openSecurityAndComplianceDashboardModal (5617) siguen declarados dentro del cuerpo de renderDataFreshnessBadge. No se registran globalmente durante la carga normal del script.
- dashboard-direccion.html SHA fefaa3bf7884288aef563cfb8aaf244e6cea8b7c, líneas 188-198, y dashboard-secretaria.html SHA fa0d8c23aace24a6acab2d4956398a7f5e1309b8, líneas 330-331, invocan esos helpers solo si typeof window... === "function"; sus botones pueden no ejecutar ninguna acción antes de que el badge sea invocado.
- UX-04 en ui-common.js 1879-1885 solo verifica typeof; no comprueba inserción, timestamp, estados, callback, éxito/fallo, timeout ni registro global de helpers.

## Criterios y dictamen
- Timestamp real confirmado: **FAIL** (no hay integración externa ni fuente real suministrada).
- Timestamp ausente/inválido/futuro seguro: **FAIL** (se usa hora actual cuando falta; no se valida).
- Cuatro estados distinguibles: **FAIL**.
- Actualización manual con confirmación explícita: **FAIL**.
- Fallo/rechazo/excepción/ausencia de respuesta conserva timestamp y libera spinner: **FAIL** por contrato permisivo y ausencia de manejo integral.
- Helpers administrativos registrados al cargar: **FAIL**.
- UX-04 conductual: **FAIL** (solo presencia de función).

## Reconciliación
AUD-NG-183/TASK-480 ya cubre el cierre del renderer, registro de helpers, integración del badge, timestamps reales, entradas ausentes/inválidas/futuras, cuatro estados, contrato estricto del callback, excepciones/timeout, conexión con recargas reales y pruebas conductuales. No se crea duplicado ni se modifica Pendientes.md.

## Pruebas y límites
Ejecutado: inspección estática/manual de la especificación, código, límites de función, prueba UX-04, consumidores administrativos y búsqueda de referencias en 15 JS/12 HTML representativos.
No ejecutado: navegador/DOM real, pruebas de callbacks, promesas, timeouts, fallos de red, Apps Script, sincronización real ni suites automatizadas. No se afirma resultado runtime.

## Cierre
T-UX-21: **NO CUMPLE**. Código/tests, completadas.md, Pendientes.md y ChangesLogs.txt sin modificaciones. Progreso: 62/183; 121 pendientes. Siguiente: T-UX-22 - Corregir el significado y el comportamiento del indicador de estado en línea.

## Tareas ejecutables derivadas de los hallazgos

### [TASK-480] Ampliación: indicador de frescura y sincronización efectiva
- **Tipo:** tarea existente ampliada; no crear ID nuevo.
- **Hallazgo:** AUD-NG-183 y ampliación T-UX-21: timestamps no verificados, estados incompletos, callback permisivo y helpers administrativos no registrados globalmente.
- **Severidad/prioridad/estado:** conservar severidad y prioridad oficiales de TASK-480; Pendiente según reconciliación.
- **Objetivo:** presentar frescura basada en datos confirmados y separar estados de sincronización.
- **Acción:** no fabricar timestamps; validar fechas ausentes/inválidas/futuras; definir actualizado/desactualizado/pendiente/error; exigir callback y éxito explícitos; preservar timestamp ante fallo/rechazo/excepción/timeout; liberar spinner; registrar helpers globalmente e integrar consumidores reales.
- **Archivos:** js/ui-common.js, js/api.js y dashboards administrativos consumidores.
- **Dependencias:** AUD-NG-001 (token), AUD-NG-144 (health checks), TASK-484 (pruebas UX).
- **Alcance:** renderer de frescura, callback, helpers y ciclo de actualización; no sustituye monitor general de microservicios.
- **Criterios:** (1) timestamp procede de sincronización confirmada; (2) fechas inválidas no se muestran frescas; (3) cuatro estados diferenciados; (4) botón solo operativo con callback; (5) solo éxito explícito renueva timestamp; (6) fallos conservan timestamp y liberan spinner; (7) helpers disponibles tras carga normal; (8) pruebas de estados/transiciones.
- **Evidencia de cierre:** pendiente; sin pruebas runtime.

