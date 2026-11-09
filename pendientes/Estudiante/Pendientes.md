# Backlog consolidado — Estudiante

**Estado operativo del Plan Maestro (reinicio global):** todas las tareas de este backlog quedan en estado `Pendiente` al inicio de la ejecución. Ninguna tarea se considera `Completada`; marcas, etiquetas o declaraciones históricas de cierre son únicamente antecedentes y no acreditan estado vigente. Una tarea solo podrá cambiar de estado tras su implementación y verificación conforme al Plan Maestro.

**Fuentes integradas:** informes de auditoría de `AUDITORIAS/`, `Pendientes.md`, `completadas.md` y los archivos departamentales preexistentes. Los registros con el mismo identificador se reúnen en una sola tarea.

**Integridad:** se conservan los requisitos originales sin resumen ni paráfrasis. Se eliminan líneas exactamente repetidas tras normalizar espacios/capitalización. Los títulos alternativos se conservan como referencia. Las fuentes originales se mantienen sin alteración para trazabilidad.

---

<!-- ID: TASK-193 | Fuentes: Pendientes.md ; pendientes/Estudiante/Pendientes.md -->
### [ ] [TASK-193] Portal OPAC de consulta y autoservicio para estudiantes y docentes
- **Origen del Hallazgo:** `AUDITORIA_FASE_20_BIBLIOTECA_RECURSOS_EDUCATIVOS.md` / Sección E, Sección C (2.10) y Plan de Trabajo P1
- **Prioridad:** P1
- **Severidad/Clasificación:** Alta (Experiencia de usuario estudiantil, fomento de la lectura escolar y autoservicio digital)
- **Archivos Involucrados:**
  - `dashboard-estudiante.html`
  - `dashboard-profesor.html`
  - `js/student.js`
  - `js/teacher.js`
  - `backend/accounting-service/Code.gs` (`getLibraryBooks`, `getLibraryLoans`, `reserveLibraryBook`)
- **Dependencias Expuestas:** `getLibraryBooks`, `getLibraryLoans`, `reserveLibraryBook`, `F20-Task01`
- **Descripción del Alcance:**
  Los estudiantes y profesores no disponen de una vista amigable donde buscar libros en el catálogo escolar, verificar en qué estantería se encuentran físicamente, consultar la fecha límite de sus préstamos activos o solicitar la reserva de un libro prestado.
  Requerimientos Funcionales Detallados:
  1. Buscador bibliográfico escolar (OPAC):
     - Buscador intuitivo con filtros por título, autor, materia y disponibilidad.
     - Tarjetas de libros con portada, descripción, número de ejemplares disponibles y ubicación en la biblioteca.
  2. Panel personal de préstamos del usuario:
     - Listado de libros que el estudiante tiene actualmente en su poder con la fecha de devolución prevista y semáforo de vencimiento (verde: a tiempo, amarillo: vence hoy, rojo: atrasado).
     - Botón de solicitar renovación si las reglas lo permiten.
     - Botón de reservar si el libro no tiene ejemplares disponibles en estantería.
- **Criterios de Aceptación:**
  - Los alumnos y docentes pueden buscar y localizar obras en el catálogo desde su portal personal.
  - Cada usuario visualiza únicamente sus propios préstamos y fechas de entrega.
  - La interfaz se adapta limpiamente a dispositivos móviles y computadoras.
- **Estado:** [ ] Pendiente

<!-- Fuente: RECUPERACION/Pendientes_RECUPERADO.md, líneas 10034-10075; clave TASK-255; asignación única: Estudiante -->

---

<!-- ID: TASK-258 | Fuentes: AUDITORIAS/AUDITORIA_COMPLETADAS_T-UX-02.md ; AUDITORIAS/AUDITORIA_COMPLETADAS_T-UX-19.md ; Pendientes.md ; pendientes/Estudiante/Pendientes.md -->
### [ ] [TASK-258] [F28-T05] [P1] Sistema Integral de Accesibilidad Visual, Foco Universal y Navegación por Teclado (WCAG 2.2 AA/AAA)
- **Hallazgo de origen:** AUD-NG-181; ampliación de TASK-258. No crear TASK-479 para este mismo alcance.
- **Severidad:** Alto.
- **Objetivo:** garantizar que cualquier modal/drawer se cierre correctamente y restaure el foco sin romper overlays anidados.
- **Acción ejecutable:** sustituir la lista fija de IDs por un contrato genérico de overlays; cerrar solo el modal superior al pulsar Escape; mantener una pila de activadores; aplicar focus trap y devolver foco al activador visible; registrar listeners una sola vez y retirarlos al desmontar componentes.
- **Archivos/módulos afectados:** js/ui-common.js y consumidores/plantillas HTML de modales y drawers.
- **Dependencias y riesgos:** AUD-NG-169 para accesibilidad general; evitar cerrar todos los overlays o enfocar elementos dentro de padres ocultos.
- **Alcance:** ciclo de vida de modal/drawer, foco y teclado.
- **Criterios de aceptación:** todos los overlays declarados se cierran con Escape; en anidamiento se cierra solo el superior; foco permanece dentro del diálogo y vuelve al activador correcto; listeners no se duplican; pruebas DOM cubren overlays con/sin role, clase modal y data-modal.
- **Prioridad:** P1.
- **Estado:** Pendiente.
- **Evidencia de cierre:** pruebas automatizadas de teclado, foco, anidamiento y desmontaje.
- **Hallazgo de origen:** AUD-NG-210 (ALTO/P1); parte de AUD-NG-211 (ALTO/P1).
- **Severidad:** Alta. **Objetivo:** permitir el uso de flujos principales mediante teclado y tecnologías de asistencia, con foco visible, orden lógico y controles con nombres accesibles.
- **Acción ejecutable:** hacer que menús se abran y cierren por teclado y actualicen `aria-expanded`; incorporar skip links funcionales; impedir que el foco quede oculto bajo cabeceras fijas; verificar contraste de foco en temas y estados; completar preferencias `prefers-contrast: more` y movimiento reducido; ampliar auditoría de nombres accesibles a controles/enlaces/SVG; sustituir nombres genéricos por etiquetas específicas; asociar labels, ayudas y errores; crear live announcer persistente; completar foco inicial, confinamiento y retorno de foco en diálogos.
- **Archivos/módulos:** `index.html`, `student-dashboard.html`, `teacher-dashboard.html`, demás vistas de panel; `css/style.css`; `js/ui-common.js` (`auditAndFixAccessibility`, `trackModalFocus`, diálogos y anuncios); componentes de menú y formularios.
- **Dependencias/riesgos:** TASK-492 para contrato de campos; TASK-493 para modal compartido; TASK-130 para ayudas; AUD-NG-169 para barreras en paneles académicos; AUD-NG-181 para Escape/restauración de foco. Riesgo de regresiones de navegación y accesibilidad parcial por revisar solo controles nativos.
- **Alcance:** navegación, foco, semántica y preferencias transversales; no duplicar las tareas especializadas de campos, modal o ayudas.
- **Criterios de aceptación:** flujos principales completables con Tab/Shift+Tab/Enter/Escape; menús operables por teclado con estado ARIA actualizado; skip link visible al enfocarse y funcional; foco nunca oculto por cabecera; nombres accesibles específicos para controles e iconos; labels/errores relacionados semánticamente; live announcements operativos; diálogos con foco inicial, confinamiento y retorno; preferencias de contraste/movimiento respetadas; revisión WCAG 2.2 AA con evidencias por vista y rol.
- **Prioridad:** P1. **Estado:** Pendiente de ejecución/revalidación.
- **Evidencia de cierre:** pendiente; el informe documenta menús hover-only, skip link ausente en vistas revisadas, semántica incompleta y helper que no cubre SVG/nombres/diálogos de forma suficiente.
- **Tipo:** Optimización Funcional y Cumplimiento Normativo.
- **Componentes Afectados:**
  - `js/ui-common.js` (`auditAndFixAccessibility`, trampeo de foco en modales)
  - Hojas de estilos y clases utilitarias de Tailwind
  - Componentes de formularios, modales, tablas y barras de navegación
- **Subcapacidades Relacionadas:** A01, A02, A03, A04, A05.
- **Estado de Partida:** Implementada parcialmente (Reglas dinámicas operativas, pero faltan indicadores de foco reforzados, atajos globales y estándares estrictos WCAG 2.2).
- **Dependencias:** [F28-T01], estructura del DOM, modales y diálogos interactivos.
- **Problema Detectado y Riesgos:**
  Aunque existen auditorías automáticas de atributos ARIA, los anillos de foco predeterminados del navegador resultan insuficientes en pantallas con luz solar intensa o para usuarios con debilidad visual. Asimismo, usuarios que navegan exclusivamente mediante teclado o tecnologías de asistencia sufren fatiga al carecer de atajos globales, o experimentan pérdidas de foco detrás de modales y encabezados pegajosos (*sticky headers*).
- **Requisitos Funcionales y Técnicos Convergentes:**
  1. *Sistema Visual de Foco de Alto Contraste (Cumplimiento WCAG 2.2 Criterio 2.4.11 y 2.4.13):*
     - Establecer indicador de foco visible de alto contraste universal: anillo de foco reforzado (`outline: 3px solid #2563eb; outline-offset: 2px; box-shadow: 0 0 0 4px rgba(37,99,235,0.25)` o clases Tailwind `focus-visible:ring-4 focus-visible:ring-blue-600 focus-visible:ring-offset-2`).
     - *Foco no oculto:* Garantizar mediante CSS (`scroll-margin-top: 5rem`) que ningún control enfocado quede tapado u oculto detrás de la barra superior fija (*header*) o drawers flotantes.
     - Diferenciación visual estricta entre el estado de foco (`focus`), estado activo (`active`) y estado seleccionado/marcado (`selected`/`checked`).
     - El indicador de foco debe mantener un ratio de contraste mínimo de 3:1 respecto a los colores de fondo adyacentes tanto en tema claro como en tema oscuro.
  2. *Navegación por Teclado y Atajos Globales No Invasivos:*
     - Implementar atajos de teclado estandarizados documentados en la plataforma:
       - `Alt + M`: Abrir / alternar menú lateral de navegación.
       - `Alt + S`: Abrir buscador global / omnibox de la institución.
       - `Alt + H`: Ir al inicio / dashboard principal del rol activo.
       - `Alt + A`: Abrir panel de ayuda de accesibilidad y listado de atajos.
       - `Escape`: Cerrar cualquier ventana modal, drawer o menú desplegable activo, retornando el foco exactamente al elemento interactivo que lo originó.
     - *Protección contra colisiones:* Los atajos deben deshabilitarse automáticamente cuando el usuario esté escribiendo dentro de campos de entrada de texto (`<input>`, `<textarea>`, `<select>` o `contenteditable`).
     - Evitar colisionar con atajos nativos del navegador o sistemas operativos (no usar combinaciones destructivas con `Ctrl`).
  3. *Trampeo y Enfoque Seguro en Ventanas Modales:*
     - Al abrir un modal, desplazar inmediatamente el foco al primer elemento interactivo o título con `tabindex="-1"`.
     - Confinar el tabulador dentro del modal abierto evitando que el usuario navegue por elementos del fondo inactivo.
  4. *Regiones ARIA Vivas y Anuncios Dinámicos:*
     - Disponer de un contenedor persistente accesible en el DOM: `<div id="aria-live-announcer" class="sr-only" role="status" aria-live="polite" aria-atomic="true"></div>`.
     - Emitir mensajes textuales claros cuando ocurran cambios de estado dinámicos (ej. "Borrador guardado", "3 operaciones sincronizadas", "Buscando resultados...", "Error en el campo fecha").
  5. *Modo de Alto Contraste y Respeto de Preferencias del Sistema:*
     - Soportar consultas de medios `@media (prefers-contrast: more)` y `@media (prefers-reduced-motion: reduce)`.
     - Si el usuario prefiere movimiento reducido, desactivar automáticamente animaciones de transición, desvanecimientos y desplazamientos suaves.
- **Criterios de Aceptación:**
  - [ ] Todos los controles interactivos (botones, enlaces, inputs, selects, pestañas) presentan un indicador de foco claramente visible al navegar con la tecla Tab.
  - [ ] El elemento enfocado nunca queda oculto detrás de barras pegajosas fijas.
  - [ ] Los atajos de teclado (`Alt+M`, `Alt+S`, `Escape`) funcionan predeciblemente sin interferir con la digitación regular de textos.
  - [ ] Los modales confinan el foco correctamente y devuelven el foco al cerrarse.
  - [ ] Las operaciones críticas pueden completarse íntegramente utilizando exclusivamente el teclado y lectores de pantalla (NVDA/JAWS/VoiceOver).
- **Estado:** [ ] Pendiente
- **Ampliación de evidencia C1.44 / T-UX-02 (2026-11-05):** **AUD-NG-181** documenta que el manejador Escape de `js/ui-common.js:87-143` cierra solo los IDs incluidos en la lista fija o elementos que coincidan con `[role="dialog"]`, `.modal` o `[data-modal]`; no detecta todos los overlays `.fixed.inset-0`. Casos confirmados fuera de ambos selectores: `index.html:391` (`news-detail-modal`, abierto por `js/index-ui.js:868-895`), `dashboard-direccion.html:421` (`modal-role-responsibility-config`, abierto por `js/secretary.js:462-465`) y `dashboard-direccion.html:442` (`modal-academic-analytics`, abierto por `js/secretary.js:808-813`). Escape no cierra esos diálogos; el visor de noticias conserva además `document.body.style.overflow='hidden'` hasta su cierre propio. La restauración depende de una única variable global `lastActiveElementBeforeModal`; solo hay seis puntos de captura en ui-common.js (157, 1630, 4938, 5315, 5469 y 5618), mientras otros abridores como openDocumentReader (2628), openContextualHelpModal (3086), openReportIssueModal (3748), openMyTicketsModal (3889), openAdminTicketsModal (4074), openAnalyticsChartModal (4604) y openMobileHamburgerDrawer (aprox. 4755) no capturan el activador. El listener oculta simultáneamente todos los diálogos detectados, sin pila/topmost; en modales anidados puede enfocar un activador que queda dentro de un contenedor también oculto. Además, setupCommonUI registra el listener dentro de su función (92) y se ejecuta automáticamente en ui-common.js:3490, pero vuelve a invocarse desde js/index-ui.js:11 y desde los inicializadores DOMContentLoaded de teacher-dashboard.html:1469 y student-dashboard.html:401; no hay guard de registro único, por lo que se acumulan manejadores keydown en esas páginas. runUXSuiteTests (1861-1867) solo comprueba que trackModalFocus exista, no simula Escape ni valida cierre/restauración y puede producir un falso PASS. **Reconciliar con TASK-258**, que ya exige Escape universal, retorno exacto del foco, confinamiento de foco y navegación por teclado; no duplicar el alcance de accesibilidad general de AUD-NG-169.

<!-- Fuente: RECUPERACION/Pendientes_RECUPERADO.md, líneas 12229-12258; clave TASK-330; asignación única: Estudiante -->

---

<!-- ID: TASK-330 | Fuentes: Pendientes.md ; pendientes/Estudiante/Pendientes.md -->
### [ ] [TASK-330] [P1] Orientación automática de primera visita y aprendizaje progresivo por función
- **Prioridad:** P1 (Alta / Importante)
- **Orden de Ejecución:** 6 (Onboarding contextual y adopción progresiva)
- **Componentes Afectados:**
  - `js/ui-common.js` (`startInteractiveGuide`, `checkAndTriggerOnboardingGuide`)
  - Dashboards: `teacher-dashboard.html`, `student-dashboard.html`, `dashboard-direccion.html`
- **Subcapacidades Relacionadas:** F38-08, F38-11.
- **Origen del Hallazgo:** `AUDITORIA_FASE_38_AYUDA_CONTEXTUAL_METADATOS_APRENDIZAJE.md` / Sección C (F38-08, F38-11) y Matriz CAR-F38-08, CAR-F38-11.
- **Problema Detectado y Riesgos:**
  Las guías interactivas actuales solo se inician si el usuario abre manualmente el modal de soporte y presiona "Iniciar Guía Paso a Paso". Nuevos docentes o estudiantes que ingresan por primera vez no son orientados de forma proactiva, derivando en desorientación y consultas repetitivas a soporte.
- **Requerimientos Funcionales y Técnicos Convergentes:**
  1. *Detección y presentación progresiva no invasiva:*
     - Al cargar un módulo o panel por primera vez, consultar el estado de aprendizaje en el servidor; si la guía está en estado `Pendiente`, desplegar el tour paso a paso de forma discreta en la esquina inferior.
     - Mostrar la orientación solo tras cargar completamente la vista, sin bloquear el dashboard ni cubrir campos que requieran interacción inmediata.
     - Permitir cerrar o descartar la guía en cualquier momento con un solo clic.
     - No iniciar varios tours simultáneamente ni acumular secuencias molestas al iniciar sesión.
  2. *Conservación de guías existentes y segmentación por rol:*
     - Conservar plenamente las guías existentes (`studentSubmission`, `teacherReview` y diseñador de plantillas).
     - Las instrucciones presentadas deben corresponder a los permisos reales verificados del rol activo.
- **Criterios de Aceptación:**
  - [ ] Un usuario nuevo recibe la orientación correspondiente al acceder por primera vez a una función.
  - [ ] Cerrar o descartar la guía permite continuar trabajando de inmediato sin bloqueos.
  - [ ] Los usuarios recurrentes no vuelven a recibir el tour automáticamente en visitas posteriores.
  - [ ] No aparecen múltiples tours simultáneos en pantalla.
  - [ ] Las guías existentes continúan disponibles desde el modal de asistencia interactiva.
- **Dependencias:** F38-Task02, F38-Task05.
- **Estado:** [ ] Pendiente

<!-- Fuente: RECUPERACION/Pendientes_RECUPERADO.md, líneas 12259-12290; clave TASK-331; asignación única: Estudiante -->

---

<!-- ID: TASK-331 | Fuentes: Pendientes.md ; pendientes/Estudiante/Pendientes.md -->
### [ ] [TASK-331] [P1] Administración de preferencias, reconsulta y restablecimiento de guías
- **Prioridad:** P1 (Alta / Importante)
- **Orden de Ejecución:** 7 (Gobernanza de preferencias y recuperación de tutoriales)
- **Componentes Afectados:**
  - `js/ui-common.js`, `js/config.js`
  - Modal de opciones de usuario (`#modal-user-settings`)
  - `backend/user-service/Code.gs` (`resetUserHelpPreferences`)
- **Subcapacidades Relacionadas:** F38-10.
- **Origen del Hallazgo:** `AUDITORIA_FASE_38_AYUDA_CONTEXTUAL_METADATOS_APRENDIZAJE.md` / Sección C (F38-10) y Matriz CAR-F38-10.
- **Problema Detectado y Riesgos:**
  Si un usuario descartó una guía por prisa y posteriormente desea volver a consultarla o reactivar las orientaciones para aprender un módulo complejo, no dispone de un botón para reiniciar los tutoriales en sus opciones personales sin tener que limpiar la caché completa del navegador.
- **Requerimientos Funcionales y Técnicos Convergentes:**
  1. *Consola de aprendizaje en perfil de usuario:*
     - Incorporar en el modal de configuración de usuario una sección "Ayuda y Aprendizaje".
     - Listar las guías disponibles según sus permisos con su estado (`No Consultada`, `Completada`, `Descartada`).
     - Permitir abrir cualquier guía bajo demanda con el botón "Volver a Consultar".
  2. *Restablecimiento granular o general:*
     - Permitir restablecer los consejos de una función específica o restablecer todas las guías institucionales.
     - Exigir confirmación informando claramente el alcance de la acción antes de ejecutarla.
     - Actualizar atómicamente el estado en el servidor y sincronizarlo con otros dispositivos.
     - Garantizar que el restablecimiento no altere configuraciones académicas, datos personales ni confirmaciones obligatorias de seguridad.
- **Criterios de Aceptación:**
  - [ ] El usuario puede volver a consultar una guía descartada desde su panel de preferencias.
  - [ ] Restablecer una guía individual no afecta el estado de las demás.
  - [ ] Confirmar el restablecimiento actualiza el servidor y vuelve a habilitar los disparadores de primera visita.
  - [ ] Cancelar la confirmación conserva inalteradas las preferencias de usuario.
  - [ ] Las confirmaciones críticas continúan funcionando independientemente de estas preferencias.
- **Dependencias:** F38-Task05, F38-Task06.
- **Estado:** [ ] Pendiente

<!-- Fuente: RECUPERACION/Pendientes_RECUPERADO.md, líneas 15349-15394; clave TASK-422; asignación única: Estudiante -->

---

<!-- ID: TASK-422 | Fuentes: AUDITORIAS/AUDITORIA_COMPLETADAS_FASE2-T07.md ; AUDITORIAS/AUDITORIA_COMPLETADAS_T-UX-25.md ; Pendientes.md ; pendientes/Estudiante/Pendientes.md -->
### [ ] [TASK-422] [P2] [Preferencias de Usuario - Ampliar la Administración de Preferencias Personales sin Permitir Conflictos Institucionales]
- **Hallazgo de origen:** FASE2-T07, sección de preferencias.
- **Severidad:** Medio.
- **Objetivo:** hacer que las preferencias persistidas gobiernen categorías, canales y frecuencia de notificación.
- **Acción ejecutable:** reemplazar valores fijos de getNotificationPreferences por la configuración del usuario; hacer que el despachador consulte preferencias y canales; definir excepciones para avisos institucionales obligatorios.
- **Archivos/módulos afectados:** backend/user-service/Code.gs y despachador de notificaciones.
- **Dependencias y riesgos:** TASK-474 y TASK-475.
- **Alcance:** preferencias y jerarquía de configuración.
- **Criterios de aceptación:** preferencias guardadas se aplican por usuario; avisos obligatorios siguen entregándose; cambios de preferencia se reflejan en el siguiente despacho.
- **Prioridad:** P2.
- **Estado:** Pendiente.
- **Evidencia de cierre:** pruebas por categoría, canal y excepción.
- **Tipo:** tarea existente ampliada; no crear tarea paralela.
- **Hallazgo/severidad:** AUD-NG-216, MEDIO/P2; preferencias personales/por rol no se guardan/restauran, backend parcial y permisos incompletos.
- **Objetivo:** preferencias persistentes separadas de defaults institucionales, con autorización y restablecimiento.
- **Acción:** ampliar esquema versionado por usuario; persistir opciones soportadas (idioma, formato, tema y widgets definidos); enlazar controles de rol a carga/guardado o retirarlos; implementar reset a defaults; corregir permisos; resolver token mediante AUD-NG-001.
- **Archivos:** js/ui-common.js, backend/user-service/Code.gs, ROLE_PERMISSIONS y ajustes de dashboards.
- **Dependencias:** AUD-NG-001 (token), AUD-NG-202/TASK-429 (vistas guardadas), TASK-430 (sistema visual).
- **Alcance:** preferencias personales, herencia institucional, controles por rol, persistencia y reset; no incluye vistas guardadas de tablas.
- **Criterios:** preferencias sobreviven nuevo inicio/cambio de dispositivo; personales prevalecen sin alterar defaults institucionales; reset restaura defaults; cada control visible persiste o se identifica como no configurable; matriz de roles segura; identidad deriva del token; pruebas de persistencia/herencia/reset/roles.
- **Prioridad:** P2. **Estado:** conservar el de TASK-422.
- **Evidencia:** pendiente; no se probaron sesiones reales ni persistencia en Sheets.
- **Componentes Afectados:**
  - `backend/user-service/Code.gs`
  - Hojas `PreferenciasNotificacion`, `ConfiguracionVisualGlobal`, `PreferenciasUsuario`
  - `js/ui-common.js`
- **Subcapacidades Relacionadas:** F26-001, F26-002, F26-014.
- **Estado de Partida:** Preferencias visuales y de notificaciones implementadas; ampliar únicamente las preferencias que estén ausentes y sean compatibles con el modelo jerárquico.
- **Dependencias Expuestas:** `PreferenciasNotificacion`, `ConfiguracionVisualGlobal`, motor de precedencia (`F26-Task01`) y formateador regional (`F26-Task02`).
- **Problema Detectado:**
  La plataforma dispone de preferencias individuales de notificaciones y visualización, pero estas deben integrarse de manera coherente con la configuración institucional y departamental. Se necesita distinguir claramente qué puede personalizar cada usuario y qué parámetros deben permanecer bajo control institucional.
- **Requisitos Funcionales:**
  1. Preferencias individuales personalizables autorizadas:
     - Idioma de la interfaz de usuario (español, inglés).
     - Formato personal de presentación de fechas (sin alterar valores en base de datos).
     - Preferencias visuales de paleta de colores y temas contrastados.
     - Disposición y orden de los widgets en el dashboard dinámico.
     - Categorías y canales de notificación activos (in-app, correo).
     - Frecuencia y agrupación de avisos opcionales.
     - No permitir personalización individual de parámetros institucionales obligatorios (moneda oficial, reglas fiscales, años lectivos).
  2. Herencia de valores predeterminados:
     - Si el usuario no tiene una preferencia explícita configurada, heredar el valor del departamento o de la institución.
     - Opción en la interfaz para restablecer preferencias individuales y recuperar valores heredados.
  3. Administración y persistencia segura:
     - Guardar preferencias en hoja `PreferenciasUsuario` vinculadas a `userId`.
     - Recuperar preferencias al iniciar sesión y aplicarlas sin afectar a otros usuarios.
     - Conservar preferencias entre sesiones y en almacenamiento local de navegador.
  4. Separación estricta de presentación y operación:
     - Una preferencia de presentación no debe modificar cálculos financieros, nombres de registros ni reglas de negocio.
- **Cambios Necesarios:**
  - Integrar `PreferenciasNotificacion` y configuraciones visuales bajo la entidad común de preferencias.
  - Crear interfaz modal amigable para personalización individual en `modal-dashboard-settings`.
  - Incorporar botón de "Restablecer a valores institucionales".
  - Implementar validación en servidor para rechazar intentos de personalizar parámetros reservados.
- **Comportamiento Esperado:**
  Cada usuario puede personalizar las opciones permitidas y conservarlas entre sesiones. Cuando no establece una preferencia, recibe el valor heredado correspondiente. Ninguna personalización individual modifica la configuración institucional.
- **Criterios de Aceptación:**
  - [ ] Cambiar una preferencia personal y comprobar que persiste al iniciar una nueva sesión.
  - [ ] Comprobar que la preferencia individual no modifica la configuración de otros usuarios concurrentes.
  - [ ] Restablecer la preferencia y comprobar que recupera automáticamente el valor institucional heredado.
  - [ ] Cambiar el valor institucional y verificar que los usuarios sin excepciones personales reciben el nuevo valor.
  - [ ] Comprobar que las preferencias personales no alteran cálculos financieros, fechas almacenadas ni permisos de acceso.
  - [ ] Intentar modificar una preferencia no permitida mediante petición directa y comprobar que el servidor la rechaza.
  - [ ] Verificar que las preferencias visuales y de notificación existentes continúan funcionando sin regresiones.
- **Ampliación de evidencia (C1.42 / FASE2-T07, 2026-11-05):** `getNotificationPreferences` (backend/user-service/Code.gs:4973-4984) devuelve valores fijos. `getUserSettings`/`saveUserSettings` sí consultan y persisten `PreferenciasNotificacion` (aprox. 7645-7715), pero `sendMultiChannelNotification` (4818-4935) no consulta esas preferencias ni aplica el parámetro `canal`. Debe definirse y probarse la precedencia entre preferencias opcionales y comunicaciones institucionales obligatorias, sin permitir que una preferencia personal suprima acciones críticas.
- **Estado:** [ ] Pendiente

- **Ampliación C1.68 / T-UX-25 (2026-11-06):**
  - **AUD-NG-216 (MEDIO/P2):** la interfaz de configuración presenta preferencias de usuario y opciones por rol, pero el contrato de persistencia no las implementa de extremo a extremo.
  - js/ui-common.js: loadUserSettingsInModal (1674-1700) llama getUserSettings; saveDashboardSettingsModal (2439-2498) solo recoge categorías de notificaciones, canal y frecuencia. No recoge ni persiste los controles creados por renderRoleSettingsInModal (2214+); dichos controles vuelven a valores hardcodeados cada vez que se renderiza el modal. No existe acción de restablecer preferencias individuales a valores institucionales.
  - backend/user-service/Code.gs: getUserSettings/saveUserSettings (7649-7735 aprox.) leen/escriben únicamente PreferenciasNotificacion (categorías, inAppEnabled, canal y frecuencia); devuelven uiTheme: light por defecto, pero no lo recuperan ni lo guardan, y no implementan preferencias de idioma, formato de fecha, paleta personal o disposición de widgets en PreferenciasUsuario.
  - ROLE_PERMISSIONS autoriza getUserSettings/saveUserSettings a Administrador, Desarrollador y Director, pero no a Profesor, Estudiante, Secretaría, Contador, Empleado, Coordinador ni demás roles que ven la pestaña personal. Además, fetchApi todavía no adjunta el token requerido (AUD-NG-001); resolver solo el token no resolverá la matriz de permisos.
  - **Criterios adicionales:** (1) separar explícitamente preferencias personales, departamentales e institucionales; (2) persistir por identidad verificada y recuperar al iniciar sesión; (3) implementar herencia de defaults institucionales y restablecimiento individual; (4) persistir solo opciones de rol permitidas y validar en servidor; (5) aplicar idioma/formato/tema/layout de widgets al panel y restaurarlos entre sesiones/dispositivos; (6) permitir a cada rol acceder a sus preferencias personales sin otorgar permisos de administración; (7) no alterar políticas institucionales obligatorias ni datos/valores de negocio.
  - **Relaciones y límites:** AUD-NG-001 cubre propagación del token; AUD-NG-202/TASK-429 cubre vistas guardadas de tablas (filtros, orden, aislamiento y ámbito); TASK-422 conserva la administración jerárquica de preferencias personales; TASK-430 cubre el sistema visual general. No crear tarea paralela para preferencias.

<!-- Fuente: RECUPERACION/Pendientes_RECUPERADO.md, líneas 15468-15501; clave TASK-426; asignación única: Estudiante -->

---

<!-- ID: TASK-255 | Fuentes: Pendientes.md ; pendientes/Estudiante/Pendientes.md -->
### [ ] [TASK-255] [F28-T02] [P1] Implementación Integral de PWA: Manifiesto, Instalación y Ciclo de Vida del Service Worker
- **Tipo:** Ampliación de Infraestructura y Resiliencia Offline.
- **Componentes Afectados:**
  - `manifest.json` (nuevo archivo en raíz del proyecto)
  - `sw.js` (Service Worker en raíz para control de ámbito `/`)
  - Cabeceras HTML en vistas principales (`index.html`, `app/html/*.html`, dashboards)
  - `js/ui-common.js` (registro del Service Worker y control de instalación)
- **Subcapacidades Relacionadas:** M01, M02, O01, O03, R03.
- **Estado de Partida:** Requiere mejoras (Existe IndexedDB para datos, pero falta PWA formal y Service Worker para recursos estáticos).
- **Dependencias:** [F28-T01], arquitectura de recursos estáticos, IndexedDB, contexto HTTPS seguro.
- **Problema Detectado y Riesgos:**
  Actualmente, si un usuario pierde la conexión antes de cargar la plataforma en su navegador móvil, el navegador arroja la pantalla de error nativa ("Sin conexión a Internet") porque no existe un Service Worker que sirva los recursos estáticos (HTML, CSS, JS, fuentes e iconos). Asimismo, los usuarios móviles no disponen de una experiencia de instalación nativa (PWA instalable en pantalla de inicio con ventana propia e icono institucional).
- **Requisitos Funcionales y Técnicos Convergentes:**
  1. *Manifiesto de Aplicación Web (`manifest.json`):*
     - Definir configuración completa: `name: "Plataforma Integral de Gestión Educativa"`, `short_name: "Gestión Educativa"`, `description: "Sistema institucional de gestión académica, administrativa y financiera"`.
     - `start_url: "./index.html"`, `scope: "./"`, `display: "standalone"`, `orientation: "any"`.
     - `theme_color: "#1e3a8a"` (azul institucional PowerSchool / Moodle), `background_color: "#f8fafc"`.
     - Iconografía institucional adaptable (*maskable* y estándar): proveer iconos en resoluciones 192x192, 512x512 y SVG vectorial, utilizando recursos institucionales reales, sin iconos temporales o genéricos.
     - Vincular `<link rel="manifest" href="manifest.json">` y meta tags de Apple Touch (`apple-touch-icon`, `mobile-web-app-capable`) en todos los archivos HTML.
  2. *Registro y ciclo de vida del Service Worker (`sw.js`):*
     - Registrar el Service Worker desde `ui-common.js` al iniciar la aplicación en contextos seguros (HTTPS o localhost).
     - Capturar y manejar errores de registro de forma silenciosa sin interrumpir la experiencia de usuario.
     - Controlar eventos `install` (precarga de shell estático), `activate` (limpieza atómica de cachés obsoletas `v1`, `v2`) y `message` (`skipWaiting`).
     - Prevención de desincronización: Evitar que versiones incompatibles de HTML, CSS y JS se ejecuten simultáneamente; ante una nueva versión disponible, emitir un banner discreto: "Nueva versión institucional disponible. [Actualizar]".
  3. *Estrategia de Caché Segmentada y Segura:*
     - *Caché Estática Inmutable (`Cache-First`):* Hojas de estilo Tailwind compiladas, fuentes tipográficas, iconos FontAwesome, logotipo institucional e imágenes del layout.
     - *Caché Dinámica de Interfaz (`Network-First` con Fallback a Caché):* Archivos HTML principales y JavaScript de lógica (`ui-common.js`, `api.js`, dashboards). Si falla la red, servir la última versión funcional en caché.
     - *Pantalla de contingencia offline:* Si se solicita una ruta HTML que no está en caché y no hay conexión, servir `app/html/offline-fallback.html` informando el estado sin conexión y permitiendo acceso a las funciones locales disponibles en IndexedDB.
     - *Exclusión estricta de caché de red:* Excluir tajantemente del `CacheStorage` las peticiones POST hacia Google Apps Script o endpoints de backend dinámicos, las cuales se gestionan única y exclusivamente a través de la cola persistente `sync_queue` de IndexedDB.
  4. *Experiencia de Instalación y Detección de Modo Standalone:*
     - Escuchar el evento `beforeinstallprompt`, almacenar el evento diferido y mostrar botón/opción accesible en el menú: "Instalar aplicación en dispositivo".
     - Detectar cuando la aplicación ya se ejecuta en modo standalone (`display-mode: standalone` o `window.navigator.standalone === true`) para optimizar la interfaz (eliminar prompts redundantes, ajustar espaciados de notch/safe-areas en iOS y Android).
- **Criterios de Aceptación:**
  - [ ] El manifiesto web cumple las especificaciones W3C y pasa las validaciones de Lighthouse PWA.
  - [ ] Los navegadores compatibles (Chrome, Edge, Safari iOS, Firefox Mobile) reconocen la plataforma como PWA instalable.
  - [ ] Al abrir la aplicación en modo avión sin conexión previa de red, la interfaz principal y los dashboards cargan exitosamente desde la caché del Service Worker.
  - [ ] Las actualizaciones de código en el servidor renuevan la caché sin dejar recursos huérfanos ni eliminar operaciones pendientes de IndexedDB.
  - [ ] Se verifica el comportamiento en Android, iOS y navegadores de escritorio.
- **Estado:** [ ] Pendiente

<!-- Fuente: RECUPERACION/Pendientes_RECUPERADO.md, líneas 10176-10220; clave TASK-258; asignación única: Estudiante -->

---

<!-- ID: TASK-426 | Fuentes: Pendientes.md ; pendientes/Estudiante/Pendientes.md -->
### [ ] [TASK-426] [F28-T06] [P2] Sistema de Preferencias Individuales de Visualización y Personalización de Accesibilidad
- **Tipo:** Optimización Funcional y Personalización.
- **Componentes Afectados:**
  - `js/ui-common.js` (gestor de temas y preferencias de accesibilidad)
  - `dashboard-*.html` (modal/panel de ajustes de accesibilidad)
  - Backend `user-service` (persistencia de preferencias en perfil de usuario)
- **Subcapacidades Relacionadas:** A01, A04, A05, P01.
- **Estado de Partida:** Implementada parcialmente.
- **Dependencias:** [F28-T05], perfil de usuario y almacenamiento local.
- **Problema Detectado y Riesgos:**
  Actualmente, las configuraciones visuales (como modo oscuro) se almacenan de manera local y básica. No existe un panel integral donde usuarios con diversas capacidades visuales o cognitivas puedan ajustar de forma persistente y personalizada la visualización del sistema a sus necesidades específicas.
- **Requisitos Funcionales y Técnicos Convergentes:**
  1. *Panel Integral de Accesibilidad y Preferencias Visuales:*
     - Incorporar selector accesible en la barra superior o menú de usuario para configurar:
       - *Tamaño de Fuente Relativo:* Normal (100%), Grande (115%), Muy Grande (130%) aplicado mediante clases dinámicas sobre la raíz `html` sin romper las cuadrículas ni truncar textos.
       - *Contraste de Interfaz:* Estándar, Alto Contraste (bordes reforzados y fondos de máxima distinción), o Escala de Grises.
       - *Reducción de Movimiento:* Forzar desactivación de animaciones.
       - *Densidad de Información:* Compacta (para secretaría y contabilidad con tablas densas) o Cómoda/Espaciada (para lectura relajada o dispositivos táctiles).
       - *Tema Visual:* Claro, Oscuro, o Sincronizado con el Sistema Operativo.
       - *Tipografía de Fácil Lectura:* Opción para activar tipografía con mayor espaciado o apta para dislexia (ej. OpenDyslexic / Atkinson Hyperlegible).
  2. *Persistencia y Sincronización Multi-Dispositivo:*
     - Almacenar las preferencias en `localStorage` para aplicación instantánea durante el arranque del shell.
     - Sincronizar automáticamente las preferencias con el backend (`user-service` en la hoja `UsuariosConfiguracion`) cuando haya conexión, permitiendo que un docente o alumno mantenga su configuración visual al cambiar de equipo.
  3. *Restablecimiento y Aislamiento:*
     - Disponer de botón "Restablecer valores predeterminados".
     - Las preferencias de un usuario no deben afectar la sesión de otros usuarios en el mismo equipo.
- **Criterios de Aceptación:**
  - [ ] Las preferencias se aplican en tiempo real al modificarse en el panel sin requerir recarga completa de la página.
  - [ ] El escalado de fuentes no trunca textos ni solapa botones en ningún dashboard.
  - [ ] Las preferencias se conservan entre sesiones y se sincronizan en la nube para el usuario autenticado.
- **Estado:** [ ] Pendiente
