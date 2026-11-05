# Auditoría TAREA-14

Fecha: 2026-11-05  
Rama: NG_beta_0.0.0.1_work  
Dictamen: **CUMPLE PARCIALMENTE**.

## Alcance y evidencia revisada

Requisito [TAREA-14] de completadas.md: vista unificada de tareas pendientes/vencidas/entregadas/revisadas para estudiantes; bandeja docente priorizada; navegación a tareas/entregas/expediente autorizado; estado de sincronización offline y recuperación de errores; formularios adaptativos por tipo/área; WCAG 2.2 AA y controles táctiles responsivos.

Archivos inspeccionados:
- student-dashboard.html (SHA 6379ea0ed39d71b89747a0280bb925fdf12202c1).
- teacher-dashboard.html (SHA cbb9e6a272a7d8ad33f99727303305d950533e71).
- js/student.js (SHA e2888cea60322e49a40b89adadb8010489605dcc).
- js/teacher.js (SHA c475fce5afcd28fca23e7b64398ad32b17773746).
- js/ui-common.js (SHA 986938b8a311a41ed4cb3d135b66b6aaea4bed67).
- Dependencias de persistencia/transporte revisadas: js/api.js (SHA 6b24f666db30a811a8e9b38d466fc6001cf6dfa9), js/persistence.js (SHA 94ac26feb4f7f31f1f3f2a238e164d23be565d94).

Los siete archivos revisados tienen el mismo SHA en NG_beta_0.0.0.1 y NG_beta_0.0.0.1_work; no hay correcciones posteriores de estos módulos en la rama de trabajo.

## Evidencia de cumplimiento parcial

- El panel del estudiante consolida tareas y exámenes, muestra tarjetas por asignatura, distingue estados de entrega y presenta alertas de vencimiento para actividades sin entrega.
- Existe caché local del panel estudiantil aislada por userId. PersistenceManager también resuelve su clave por usuario activo, por lo que no se identificó una fuga entre cuentas en las claves examinadas.
- El panel docente combina entregas de tareas y exámenes en una navegación jerárquica por grado, sección, asignatura y estudiante; los detalles permiten revisar entregas.
- Existen skeleton screens, navegación responsive, tabs, filtros y manejo visual de errores.
- ui-common.js incluye un indicador online/offline, IndexedDB, queueOfflineAction, syncOfflineQueue y un modal para conflictos.

## Incumplimientos y defectos

1. **La bandeja docente priorizada no está integrada.** fetchEntregasRecientes está definida en js/teacher.js, pero teacher-dashboard.html no contiene op-table-body/op-table-head y no se encontró ninguna llamada a la función. Por tanto no existe una bandeja accesible desde la interfaz. Además, la función consulta solo TASK/getTeacherActivity (no exámenes) y ordena por fecha de entrega registrada (item.fecha), no por vencimiento/prioridad de revisión.
2. **Filtros del docente no representan por sí solos sus asignaciones autorizadas.** renderGrados, renderSecciones y renderAsignaturas usan GLOBAL_SCOPE.GradoActual/GranularConfig, que es configuración académica general, no una lista de asignaciones vigentes derivada del docente. El listado de estudiantes se solicita con grado/sección. El servidor debe aplicar ABAC y la UI debe construir filtros desde el ámbito docente verificado; coordinar con AUD-NG-158.
3. **Orden inconsistente en el panel del estudiante.** La tarjeta de asignatura ordena pendientes por fecha límite ascendente; expandSubject vuelve a ordenar todas las actividades en descendente. El defecto coincide con AUD-NG-126, que ya está registrado como pendiente; no se crea una tarea duplicada.
4. **Caché local no se conserva visualmente ante fallo remoto.** fetchAllActivities renderiza datos de caché, pero si las solicitudes remotas fallan, su catch sustituye tasksList por una pantalla de error/reintento. fetchTeacherActivity hace lo mismo con submissionsTableBody aunque previamente haya renderizado cache_profesor_data. La vista cacheada no permanece disponible en modo offline y no se explica qué datos son locales/desactualizados.
5. **La cola offline no está conectada al flujo académico ni al cliente API.** queueOfflineAction no es invocada desde student.js, teacher.js ni api.js para guardar entregas, calificaciones o formularios académicos. syncOfflineQueue depende de window.sendApiRequest; no se encontró esa implementación en los archivos de transporte/persistencia/UI revisados, y api.js no encola las mutaciones al fallar la red. Por tanto, la cola existente no garantiza recuperación de operaciones académicas.
6. **Resolución de conflictos solo simula éxito.** resolveConflictChoice oculta el modal y muestra un mensaje de “Conflicto Resuelto”, pero no actualiza ni elimina la entrada de sync_queue, no aplica la versión local/servidor ni reenvía la operación. processQueueItems deja errores ordinarios como PENDING sin registrar causa, contador de intentos, próxima ejecución o estado visible. La interfaz comunica una resolución que no ocurrió.
7. **Indicador de conexión impreciso y efímero.** updateOnlineBadge usa navigator.onLine como prueba de “Conexión Estable”, aunque solo refleja el estado de red reportado por el navegador y no la disponibilidad de servicios. El indicador online desaparece después de cuatro segundos; el badge no usa role=status/aria-live ni muestra pendientes, errores o última sincronización.
8. **Accesibilidad de controles interactivos insuficiente.** renderSubjectNavigation crea tarjetas div con onclick para expandir asignaturas, sin rol semántico, tabindex ni activación por teclado. renderManagementTable y la navegación jerárquica usan filas tr clicables. Los dos HTML revisados no contienen atributos aria-*; el estado dinámico de conexión/conflicto no se anuncia a lectores de pantalla. Escape global y algunos labels existen, pero no demuestran WCAG 2.2 AA. No se encontraron pruebas de teclado, lector de pantalla, contraste, foco visible ni tamaño de objetivos táctiles.
9. **Formulario adaptativo limitado.** updateCreateTaskUIState solo habilita título/editor al elegir un tipo y muestra el selector de asociación cuando el tipo es Crédito Extra. No adapta los campos, criterios, instrucciones ni validaciones según el área curricular y las distintas modalidades de actividad que contempla el requisito.
10. **Navegación al expediente y revisión sigue siendo principalmente jerárquica.** El docente debe navegar por grados/secciones/asignaturas/alumnos para llegar a entregas; la bandeja de prioridad no está conectada. El acceso al expediente depende de la consulta de datos de alumnos y asignaciones, que debe ser restringida server-side a través de AUD-NG-002/AUD-NG-158.

## Hallazgo nuevo

**AUD-NG-169 - Integrar la bandeja docente y asegurar accesibilidad funcional en los paneles académicos.** Medio (P2). Alcance: conectar una bandeja de revisiones visible y operativa para tareas y exámenes; priorizar por vencimiento/antigüedad según reglas explícitas; navegación semántica por teclado; etiquetas y estados accesibles; formularios adaptados por tipo/área; pruebas WCAG 2.2 AA y táctiles. La sincronización offline se mantiene en TASK-065; el orden de actividades en AUD-NG-126; los filtros/consultas autorizadas en AUD-NG-158.

## Ampliaciones de tareas existentes (sin duplicar)

- **AUD-NG-126:** confirmar y conservar la corrección del orden tarjeta/vista expandida; el defecto continúa presente en TAREA-14.
- **AUD-NG-158:** filtrar grados, secciones, asignaturas y alumnos desde asignaciones docentes verificadas; no confiar solo en GLOBAL_SCOPE ni en profesorId enviado por el cliente.
- **TASK-065:** integrar queueOfflineAction con las mutaciones académicas, implementar transporte real para syncOfflineQueue, reintentos/estados y resolución efectiva de conflictos; no mostrar éxito antes de aplicar la elección.
- **TASK-129/TASK-130:** coordinar el cumplimiento de tooltips y ayudas de formularios con el requisito global WCAG, sin considerar esas tareas parciales como certificación de accesibilidad de los paneles.

## Calidad y límites

Calidad insuficiente: la vista del estudiante y la navegación docente tienen funcionalidades útiles, pero la bandeja de revisión no es accesible, el modo offline no recupera de forma fiable las operaciones académicas, la resolución de conflictos es simulada y hay fallas de semántica/teclado. La interfaz es parcialmente responsive, pero no se demuestra WCAG 2.2 AA. Revisión estática/manual; no se ejecutaron pruebas de navegador, dispositivos táctiles, lectores de pantalla, red desconectada, sincronización real ni despliegue. No se modificó código fuente, completadas.md, completadas_legacy.md ni ChangesLogs.txt.