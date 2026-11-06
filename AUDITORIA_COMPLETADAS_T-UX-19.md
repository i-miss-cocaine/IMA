# Auditoría de completadas.md: T-UX-19

- Fecha: 2026-11-06
- Repositorio: i-miss-cocaine/IMA
- Rama: NG_beta_0.0.0.1_work
- HEAD de partida: 88886e8b313129e84f35989cb13f061274c7d12b (C1.61)
- Dictamen: **NO CUMPLE**. La tarea figura [X], pero los criterios de accesibilidad no están demostrados y hay barreras en navegación, foco, nombres accesibles y formularios.

## Criterios de la tarea
Evaluación WCAG 2.2 AA; navegación por teclado; foco visible y orden lógico; nombres accesibles para controles/iconos; asociación correcta de etiquetas y errores. Criterios de aceptación: flujos principales utilizables sin ratón, foco visible/lógico y nombres accesibles para iconos funcionales.

## Evidencia estática

1. **Menús y teclado**
   - `index.html:25-60`, `student-dashboard.html:25-60` y `teacher-dashboard.html:25-60`: menús principales desplegados con `group-hover`; no se observa apertura equivalente por foco de teclado. En Inicio se declara `aria-expanded="false"` estático, sin actualización observada del estado.
   - `css/style.css:970-988` contiene estilo `.skip-link`, pero no se encontró un enlace de salto al inicio del body de las vistas de Inicio y Estudiante revisadas.
   - No se encontró `scroll-margin` en `css/style.css` para evitar que el foco quede oculto bajo la cabecera fija.

2. **Foco y preferencias**
   - `css/style.css:996-1010` ofrece `:focus-visible` de 3 px. Es una base positiva, pero no se midió contraste por tema ni se probó sobre todos los controles.
   - `css/style.css:1033-1046` contiene `prefers-contrast: high` y `prefers-reduced-motion: reduce`; TASK-258 solicita además el valor `more`.
   - La regla de objetivos de 44 px solo cubre un subconjunto de controles.

3. **Nombres accesibles y helper**
   - `js/ui-common.js:5240-5299`, `auditAndFixAccessibility()`, recorre principalmente botones y enlaces con role=button; no verifica el nombre accesible calculado ni cubre de forma general enlaces/controles personalizados.
   - El fallback «Acción de interfaz» es genérico y no describe la función concreta.
   - La lectura `icon.className.indexOf(...)` puede fallar cuando el icono es SVG, pues `className` puede ser SVGAnimatedString. Caso representativo: botón `close-profile-modal` de `student-dashboard.html:75-90`, con SVG sin nombre accesible.
   - El helper no asocia labels/errores, no crea un live announcer y no implementa confinamiento ni foco inicial de diálogo.
   - `renderSharedDetailViewModal()`, `js/ui-common.js:5303-5365`, establece role=dialog/aria-modal, pero no conecta el título mediante aria-labelledby ni gestiona el foco completo.

4. **Formularios**
   - `student-dashboard.html:82-105`: etiquetas del perfil no usan `for` ni envuelven explícitamente los controles.
   - `dashboard-recursos-humanos.html:185-230`: varios campos de incidencia dependen del placeholder/tipo y carecen de etiqueta visible asociada.
   - En los fragmentos representativos no se observó un patrón consistente `aria-describedby`/`aria-invalid` que vincule el error con su campo.
   - TASK-492 cubre el contrato visual/funcional de campos y coordina la semántica label/control/error; no duplicar ese alcance.

5. **Anuncios y pruebas**
   - CSS contiene estilos para elementos `[aria-live]`, pero eso no crea el contenedor persistente requerido por TASK-258.
   - `runUXSuiteTests()`, `js/ui-common.js:1843-1936`, solo prueba UX-01..UX-09; UX-02 comprueba la existencia de trackModalFocus, no el comportamiento completo de teclado/foco ni WCAG.
   - El listener Escape/restauración de foco ya se rastrea en AUD-NG-181; no duplicar.

## Hallazgos y reconciliación
- **AUD-NG-210 (ALTO/P1):** menús dependientes de hover sin apertura por foco, estado expandido no actualizado, ausencia de skip link operativo en vistas revisadas y falta de garantía de foco no oculto bajo header. Relacionado con TASK-258 y AUD-NG-181.
- **AUD-NG-211 (ALTO/P1):** helper de accesibilidad parcial y susceptible a excepción con SVG, nombres genéricos, falta de relación label/error, live announcer y foco de diálogo. Relacionado con TASK-258, AUD-NG-169, TASK-492, TASK-493, TASK-130 y TASK-484.
- TASK-258 es la tarea correctiva transversal pendiente para foco, teclado, modales, ARIA live y preferencias de contraste/movimiento.
- AUD-NG-169 ya registra barreras en paneles académicos; AUD-NG-181 cubre Escape/restauración; TASK-492 campos; TASK-493 modal compartido; TASK-130 ayudas/descripciones; TASK-484 pruebas UX-01..09. No se crea tarea duplicada ni se modifica Pendientes.md.

## Archivos y evidencia
- `js/ui-common.js`: SHA `986938b8a311a41ed4cb3d135b66b6aaea4bed67`.
- `css/style.css`: SHA `f1ff84312ce70949a58eaa099b2aad0ff0a59cb6`.
- `index.html`: SHA `cd742047cdc4948259dd721119429b04f78330ca`.
- `student-dashboard.html`: SHA `6379ea0ed39d71b89747a0280bb925fdf12202c1`.
- `teacher-dashboard.html`: SHA `cbb9e6a272a7d8ad33f99727303305d950533e71`.
- `dashboard-recursos-humanos.html`: SHA `406bedbae5a5bb3b5c03e4ea7aaa95ed68aea8ee`.
- `dashboard-secretaria.html`: SHA `fa0d8c23aace24a6acab2d4956398a7f5e1309b8`.

## Límites de verificación
Inspección estática/manual de especificación, CSS, helpers y vistas representativas. No se ejecutaron navegación Tab/Shift+Tab/Enter/Escape en navegador, NVDA/JAWS/VoiceOver, medición de contraste, zoom, pruebas de formularios en runtime ni suites automatizadas. La cobertura no equivale a certificación exhaustiva de todas las vistas.

## Cierre
T-UX-19: **NO CUMPLE**. Código y tests sin modificaciones. `completadas.md`, `Pendientes.md`, `METODOLOGIA_DESARROLLO.md` y `ChangesLogs.txt` intactos. Progreso: 60/183 identificadores auditados; 123 pendientes. Siguiente: **T-UX-20 - Completar la adaptación móvil y el comportamiento responsivo**.
