# Auditoría de tareas completadas - T-UX-02

**Fecha:** 2026-11-05  
**Repositorio:** i-miss-cocaine/IMA  
**Rama:** NG_beta_0.0.0.1_work  
**HEAD de partida:** 462131e176e7d7c9e1b9b215efbe3db8f7bbe906  
**Rama base:** NG_beta_0.0.0.1 (44d9891132332e692dbe2ba8602b41f50a508a59, sin cambios)  
**Tarea:** T-UX-02 - Soporte Universal Tecla Escape para Cierre de Modales y Restauración de Foco  
**Estado en completadas.md:** [X] Completada

## Dictamen

**CUMPLE PARCIALMENTE.** En `js/ui-common.js` existe un listener global `keydown` que reconoce Escape y oculta un conjunto de modales por ID o por selectores ARIA/clases. Sin embargo, no cubre todos los overlays reales, la captura/restauración de foco solo está conectada a una parte de los abridores y el mecanismo no gestiona una pila de modales. La prueba UX-02 únicamente verifica la existencia de una función y puede aprobar una implementación que falla en comportamiento real.

## Alcance histórico

La entrada completa de `completadas.md` declara:
1. Listener global `keydown` para capturar Escape (code 27).
2. Cerrar modales activos ocultando elementos con clase `.hidden`.
Criterio: presionar Escape cierra modales abiertos de forma limpia.

El título de la tarea incluye restauración de foco. Se consideró además el alcance explícito y más amplio ya pendiente en TASK-258, que requiere retorno al activador, confinamiento del foco y navegación por teclado. La segunda aparición resumida de T-UX-02 en completadas.md conserva el mismo ID; no se contó como tarea independiente.

## Evidencia técnica

### 1. Listener y selección de modales

- `js/ui-common.js:87-90` define `window.trackModalFocus`, que guarda el activador en una única variable global: `window.lastActiveElementBeforeModal`.
- `js/ui-common.js:92-143` registra el listener. Reconoce `e.key === 'Escape'` o `e.keyCode === 27`.
- `activeModals` (95-119) contiene una lista fija de IDs. Después, el selector (127-131) añade nodos visibles que tengan `[role="dialog"]`, `.modal` o `[data-modal]`.
- No existe una regla genérica para cualquier overlay `.fixed.inset-0` ni un contrato de registro de modales; por ello, los overlays que no siguen las convenciones quedan fuera.

### 2. Modales abiertos que Escape no detecta

- `index.html:391` declara `#news-detail-modal` como overlay `.fixed.inset-0` con clase `.hidden`, sin `role="dialog"`, clase `.modal` ni `data-modal`. Tampoco aparece en la lista fija de IDs.
- `js/index-ui.js:868-895` abre ese modal quitando `.hidden` y asigna `document.body.style.overflow = 'hidden'`. El cierre propio restablece el scroll, pero el listener Escape no encuentra el modal; al pulsar Escape permanece abierto y el scroll sigue bloqueado.
- `dashboard-direccion.html:421` declara `#modal-role-responsibility-config` con `.fixed.inset-0` y `.hidden`, sin role/clase/data-modal y fuera de la lista fija. `js/secretary.js:462-465` lo abre retirando `.hidden`.
- `dashboard-direccion.html:442` declara `#modal-academic-analytics` con el mismo patrón; `js/secretary.js:808-813` lo abre retirando `.hidden`.
- Ninguno de esos tres overlays es cerrado por Escape con el selector actual. Esto contradice el alcance universal y el criterio de cierre limpio.

### 3. Restauración de foco incompleta

- Los únicos puntos de captura de foco identificados dentro de ui-common.js son los abridores de perfil (157), configuración de dashboard (1630), omnibox (4938), vista de detalle compartida (5315), administración de usuarios (5469) y panel de seguridad (5618).
- Otros abridores de modales de la misma biblioteca no invocan `trackModalFocus`: `openDocumentReader` (2628-2672), `openContextualHelpModal` (3086-3137), `openReportIssueModal` (3748-3757), `openMyTicketsModal` (3889-3893), `openAdminTicketsModal` (4074-4078), `openAnalyticsChartModal` (4604-4635) y `openMobileHamburgerDrawer` (aprox. 4755-4847).
- La restauración (137-141) solo intenta enfocar `lastActiveElementBeforeModal` si existe y sigue en el DOM. No verifica que el elemento esté visible ni que sus ancestros no hayan quedado ocultos.
- El handler oculta todos los diálogos detectados en una misma pulsación; no identifica el modal superior ni conserva una pila. En un flujo anidado, el activador guardado puede estar dentro de un modal padre que también se oculta. El foco termina dirigido a un nodo oculto o no se restaura.
- Los cierres ordinarios de varios modales no limpian ni actualizan la referencia global, por lo que puede persistir un activador obsoleto y reutilizarse en un Escape posterior.

### 4. Registro repetido del listener

- El listener se instala dentro de `window.setupCommonUI` (92), sin bandera de inicialización ni retirada previa.
- El propio archivo autoejecuta `setupCommonUI` al DOMContentLoaded (3490-3493).
- Además, `js/index-ui.js:11`, `teacher-dashboard.html:1469` y `student-dashboard.html:401` llaman nuevamente a `setupCommonUI` desde sus inicializadores DOMContentLoaded.
- En esas páginas se registran varios listeners keydown equivalentes. Una pulsación puede ejecutar repetidamente el cierre y la restauración de foco.
- Existe además otro listener keydown para Ctrl/Cmd+K y Escape del omnibox en `js/ui-common.js:5073-5085`, con una segunda ruta de cierre para el mismo modal.

### 5. Prueba UX-02 insuficiente

- `runUXSuiteTests` (1846-1867) marca UX-02 como PASS si `typeof window.trackModalFocus === 'function'`.
- No emite un evento Escape, no abre ni cierra un modal, no verifica que los overlays se oculten, no comprueba el foco final, no prueba anidamiento ni identifica listeners duplicados.
- El resultado puede ser PASS aunque Escape no cierre varios modales y el foco se pierda.

## Contraste de requisitos y aceptación

| Requisito / criterio | Resultado | Evidencia |
|---|---|---|
| Listener global keydown para Escape | Parcial | Existe, pero se registra dentro de setupCommonUI y puede duplicarse. |
| Cerrar modales activos usando .hidden | Parcial | Cierra lista fija y patrones ARIA; deja fuera overlays reales sin esos marcadores. |
| Escape cierra modales abiertos limpiamente | No cumple universalmente | news-detail-modal y dos modales de dashboard no son detectados. |
| Restaurar foco al activador | Parcial | Solo seis abridores capturan foco; referencia global sin pila. |
| Comportamiento limpio con modales anidados | No cumple | Cierra todos a la vez y puede enfocar un activador dentro de un padre oculto. |
| Prueba funcional UX-02 | No cumple | Solo verifica existencia de trackModalFocus. |

## Reconciliación de hallazgos y tareas

- **Hallazgo nuevo AUD-NG-181 (ALTO):** cierre Escape incompleto, restauración de foco no universal y registro duplicado de listeners.
- **TASK-258:** ya contiene el alcance correcto: Escape para cualquier modal/drawer, retorno exacto al activador, focus trap y navegación por teclado. Se amplía su evidencia y criterios; no se crea TASK-479.
- **AUD-NG-169:** mantiene su alcance de accesibilidad general de paneles docentes/estudiantes; se referencia sin duplicar.
- No se modifican estados de tareas existentes ni `completadas.md`.

## Calidad de implementación

La solución centraliza parte del comportamiento, pero depende de una lista manual de IDs, convenciones de marcado inconsistentes y una única variable global de foco. No maneja diálogos anidados, no garantiza el foco de retorno y registra listeners repetidos. La prueba automatizada verifica presencia de símbolo en lugar de comportamiento. La calidad es insuficiente para aceptar la capacidad universal descrita por el título.

## Pruebas y límites

- Inspección estática/manual de `js/ui-common.js` y consumidores concretos en HTML/JS.
- No se ejecutó navegador, KeyboardEvent real, prueba DOM automatizada, lector de pantalla ni dispositivos móviles.
- No se ejecutaron Apps Script, HTTP, triggers, despliegues ni operaciones productivas.
- No se modificó código fuente, `completadas.md`, `ChangesLogs.txt` ni `METODOLOGIA_DESARROLLO.md`.

## SHAs de respaldo

- `js/ui-common.js`: 986938b8a311a41ed4cb3d135b66b6aaea4bed67.
- `index.html`: cd742047cdc4948259dd721119429b04f78330ca.
- `js/index-ui.js`: c637535e8cc84f02aa18631bc964ff7ef545722e.
- `dashboard-direccion.html`: fefaa3bf7884288aef563cfb8aaf244e6cea8b7c.
- `js/secretary.js`: 08a81266957b4c18cc25f8ba6749eac30a8f2c2c.
- `teacher-dashboard.html`: cbb9e6a272a7d8ad33f99727303305d950533e71.
- `student-dashboard.html`: 6379ea0ed39d71b89747a0280bb925fdf12202c1.
- `completadas.md`: f57f1aef832e81e44fc4f7ec36a852d50e464676.
- `METODOLOGIA_DESARROLLO.md`: 214e8221bd076c4e89012636c105bffd5ca36467.
- `Pendientes.md` recuperado del blob del HEAD de partida: 093007608b9c1fdd550305bb8e16ef966c6c4201.

## Progreso y continuidad

- Identificadores auditados: **45/183**; 138 pendientes.
- Última tarea auditada: T-UX-02.
- Próxima tarea exacta según completadas.md: **T-UX-03 - Módulo de Protección contra Pérdida de Cambios No Guardados en Formularios**.
