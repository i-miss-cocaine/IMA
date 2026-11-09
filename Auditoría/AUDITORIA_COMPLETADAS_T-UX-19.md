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


---

## Tareas ejecutables derivadas de los hallazgos

> Los hallazgos AUD-NG-210/AUD-NG-211 se reconcilian con tareas existentes. TASK-258 es la remediación transversal; TASK-484 conserva la validación conductual UX; TASK-492/TASK-493 y TASK-130/AUD-NG-169/AUD-NG-181 mantienen sus alcances específicos. No se crean IDs duplicados.

### [TASK-258] Corregir las barreras transversales de accesibilidad y navegación
- **Hallazgo de origen:** AUD-NG-210 (ALTO/P1); parte de AUD-NG-211 (ALTO/P1).
- **Severidad:** Alta. **Objetivo:** permitir el uso de flujos principales mediante teclado y tecnologías de asistencia, con foco visible, orden lógico y controles con nombres accesibles.
- **Acción ejecutable:** hacer que menús se abran y cierren por teclado y actualicen `aria-expanded`; incorporar skip links funcionales; impedir que el foco quede oculto bajo cabeceras fijas; verificar contraste de foco en temas y estados; completar preferencias `prefers-contrast: more` y movimiento reducido; ampliar auditoría de nombres accesibles a controles/enlaces/SVG; sustituir nombres genéricos por etiquetas específicas; asociar labels, ayudas y errores; crear live announcer persistente; completar foco inicial, confinamiento y retorno de foco en diálogos.
- **Archivos/módulos:** `index.html`, `student-dashboard.html`, `teacher-dashboard.html`, demás vistas de panel; `css/style.css`; `js/ui-common.js` (`auditAndFixAccessibility`, `trackModalFocus`, diálogos y anuncios); componentes de menú y formularios.
- **Dependencias/riesgos:** TASK-492 para contrato de campos; TASK-493 para modal compartido; TASK-130 para ayudas; AUD-NG-169 para barreras en paneles académicos; AUD-NG-181 para Escape/restauración de foco. Riesgo de regresiones de navegación y accesibilidad parcial por revisar solo controles nativos.
- **Alcance:** navegación, foco, semántica y preferencias transversales; no duplicar las tareas especializadas de campos, modal o ayudas.
- **Criterios de aceptación:** flujos principales completables con Tab/Shift+Tab/Enter/Escape; menús operables por teclado con estado ARIA actualizado; skip link visible al enfocarse y funcional; foco nunca oculto por cabecera; nombres accesibles específicos para controles e iconos; labels/errores relacionados semánticamente; live announcements operativos; diálogos con foco inicial, confinamiento y retorno; preferencias de contraste/movimiento respetadas; revisión WCAG 2.2 AA con evidencias por vista y rol.
- **Prioridad:** P1. **Estado:** Pendiente de ejecución/revalidación.
- **Evidencia de cierre:** pendiente; el informe documenta menús hover-only, skip link ausente en vistas revisadas, semántica incompleta y helper que no cubre SVG/nombres/diálogos de forma suficiente.

### [TASK-484] Incorporar pruebas conductuales de accesibilidad a la suite UX
- **Hallazgo de origen:** AUD-NG-211; insuficiencia de `runUXSuiteTests` y UX-02.
- **Severidad:** Alta. **Objetivo:** verificar el comportamiento real de teclado, foco, nombres accesibles, formularios y anuncios, no solo la existencia de helpers.
- **Acción ejecutable:** ampliar la suite UX con escenarios de teclado para menús y diálogos; comprobar orden/visibilidad/restauración de foco; calcular/verificar nombres accesibles de controles e iconos; validar asociaciones label/error y live regions; cubrir preferencias de contraste y movimiento; ejecutar casos sobre vistas representativas por rol y registrar resultados reproducibles.
- **Archivos/módulos:** `js/ui-common.js` (`runUXSuiteTests`); `tests/regression/` y pruebas de interfaz existentes; vistas HTML representativas.
- **Dependencias/riesgos:** TASK-258 aporta el comportamiento a validar; TASK-492/TASK-493/TASK-130 cubren componentes relacionados. Riesgo de falsos positivos si la suite solo comprueba presencia de funciones o atributos estáticos.
- **Alcance:** pruebas automatizadas/conductuales de accesibilidad; no reemplaza auditoría manual con lector de pantalla ni certificación WCAG independiente.
- **Criterios de aceptación:** pruebas fallan ante menú no operable por teclado, foco perdido/oculto, nombre accesible ausente, label/error desconectado o live region inexistente; se ejecutan sobre vistas representativas; resultados incluyen caso, vista, rol y evidencia; los casos no se limitan a `typeof function`.
- **Prioridad:** P1 (derivada de los hallazgos ALTO/P1). **Estado:** Pendiente de ejecución/revalidación.
- **Evidencia de cierre:** pendiente; UX-02 verifica presencia de `trackModalFocus` y la suite no acredita navegación completa, WCAG ni comportamiento real.

### Reconciliación y límites
- **AUD-NG-210:** se conserva en TASK-258 y AUD-NG-181; no crear una segunda tarea de foco/Escape.
- **AUD-NG-211:** TASK-258 y TASK-484 mantienen accesibilidad transversal y pruebas; TASK-492 cubre campos, TASK-493 modal y TASK-130 ayudas; AUD-NG-169 conserva barreras específicas de paneles académicos.
- **Pruebas:** solo inspección estática/manual de vistas y helpers representativos; no se ejecutaron navegadores, lectores de pantalla, medición de contraste, zoom, navegación completa ni suites automatizadas.
- **Estado:** T-UX-19 permanece NO CUMPLE; la normalización no constituye certificación WCAG ni cierre de tareas.
