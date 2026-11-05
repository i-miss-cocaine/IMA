AUDITORÍA DE TAREAS COMPLETADAS - T-UX-26
FECHA: 2026-11-05
REPOSITORIO: i-miss-cocaine/IMA
RAMA: NG_beta_0.0.0.1_work
HEAD DE PARTIDA: 8667e741dcd19ca84834f727b673f617e4f3ec41
================================================================

DICTAMEN: CUMPLE PARCIALMENTE. Las tres funciones solicitadas existen en js/ui-common.js, pero la capacidad no está integrada en los paneles principales revisados ni se demuestra que reciba eventos reales. La navegación no demuestra apertura del registro concreto y el almacenamiento local no está aislado por identidad.

REQUISITOS DE T-UX-26
1. Identificar si ya existe una función equivalente: CUMPLE PARCIALMENTE. Existe un bloque dedicado etiquetado [T-UX-26]; no se halló una implementación anterior equivalente en los fragmentos revisados.
2. Mostrar elementos recientes pertinentes para cada rol: NO CUMPLE. getRecentActivity filtra por igualdad del campo role y GLOBAL; ADMIN y DIRECCION omiten el filtro. No se encontró integración del renderizador en los dashboards principales revisados, por lo que no se demuestra una vista real por rol.
3. Distinguir actividad informativa de tareas pendientes: CUMPLE PARCIALMENTE. El modelo type admite INFORMATIVA/TAREA_PENDIENTE y la UI presenta etiquetas/iconos distintos, pero no hay productores encontrados que conecten los eventos reales ni integración con la bandeja de trabajo.
4. Regresar a registros consultados recientemente si continúan disponibles: CUMPLE PARCIALMENTE. El clic llama a switchActiveView(targetView, true, {targetId}); switchActiveView verifica que exista el contenedor targetView, pero no consume targetId para seleccionar/restaurar el registro. No se valida que el registro siga disponible ni que el usuario conserve permiso.

EVIDENCIA TÉCNICA
- js/ui-common.js SHA 986938b8a311a41ed4cb3d135b66b6aaea4bed67, líneas 1701-1833: define RECENT_ACTIVITY_CACHE_KEY, recordRecentActivity, getRecentActivity y renderContextualRecentActivity.
- recordRecentActivity persiste hasta 50 elementos en localStorage bajo una única clave INSTITUTIONAL_RECENT_ACTIVITY_LOG_V1. El objeto no contiene authUserId ni institucionId.
- getRecentActivity filtra por role/GLOBAL; ADMIN y DIRECCION omiten el filtro. Ordena por timestamp y limita resultados, sin validación robusta de estructura/fecha.
- renderContextualRecentActivity inserta title y description mediante innerHTML sin escape contextual.
- La navegación solo cambia a targetView y pasa targetId en stateParams. switchActiveView no procesa targetId para localizar el registro específico.
- En los dashboards principales revisados (dashboard-direccion, dashboard-coordinacion, dashboard-secretaria, dashboard-contabilidad, teacher-dashboard, student-dashboard, developer-dashboard e index) no se encontraron llamadas a recordRecentActivity ni renderContextualRecentActivity. Las búsquedas del repositorio por los tres símbolos tampoco devolvieron usos externos.
- ChangesLogs.txt contiene una entrada de octubre de 2026 que declara la implementación de estas funciones en líneas 1690-1830 y marca T-UX-26 completada; el registro de cambios no acredita integración o pruebas.
- tests/regression/modular-dashboard-suite.js SHA 0495e1d526a872c33310935a003a83d924d34683 no contiene pruebas que mencionen T-UX-26, actividad reciente o los símbolos.
- T-UX-27 agrega renderUIProgressSkeleton en otra sección de ui-common.js; no corrige el bloque de actividad reciente. La versión de ui-common.js revisada coincide con la ya registrada en el checkpoint C1.18/FASE2-T18.

CALIDAD Y RIESGOS
- La implementación está encapsulada en tres funciones, pero no forma una funcionalidad visible de extremo a extremo.
- La clave global de localStorage permite contaminación entre cuentas que comparten navegador. El filtro por rol no sustituye el aislamiento por usuario/institución. Se amplía TASK-067.
- El uso de innerHTML con title/description exige escape contextual o inserción como texto.
- El targetId no es consumido por switchActiveView; la acción no prueba la reapertura del registro concreto.
- No existe prueba automatizada identificable para el flujo.

RECONCILIACIÓN
- Hallazgo nuevo AUD-NG-173: integración real de la vista, productores de eventos, navegación a registro concreto, validación de contenido y pruebas.
- Ampliar TASK-067 con aislamiento de INSTITUTIONAL_RECENT_ACTIVITY_LOG_V1 por authUserId/institucionId.
- TASK-221 permanece como fuente de verdad de las tareas accionables; no duplicar su bandeja ni su ciclo de estados.
- No modificar completadas.md ni ChangesLogs.txt. No se modifica código fuente.

PRUEBAS Y LIMITACIONES
- Inspección estática/manual de js/ui-common.js, los dashboards principales listados, ChangesLogs.txt y tests/regression/modular-dashboard-suite.js.
- No se ejecutaron pruebas de navegador, multiusuario ni Apps Script; no se usaron datos productivos.
- El inventario de llamadas externas se contrastó con búsquedas del repositorio y los dashboards principales, pero no se ejecutó la aplicación completa. El dictamen no equivale a certificación dinámica.
================================================================
