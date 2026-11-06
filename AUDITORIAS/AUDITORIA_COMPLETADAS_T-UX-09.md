# Auditoría de tareas completadas - T-UX-09

**Fecha:** 2026-11-05  
**Repositorio:** i-miss-cocaine/IMA  
**Rama de trabajo:** NG_beta_0.0.0.1_work  
**HEAD de partida:** dc01a689afd8a3ce01851493399310e95d12575f  
**Árbol de partida:** 57f43b9321ddd4666617360b52297d47a60daaf4  
**Tarea:** T-UX-09 - Menú Lateral Responsivo Específico por Rol con Colapso Móvil Suave  
**Estado en completadas.md:** [X] Completada

## Dictamen

**CUMPLE PARCIALMENTE.** Existe un drawer móvil reutilizable, un botón hamburguesa que se inyecta en varios encabezados y un acordeón que permite abrir una sección y cerrar las hermanas. Sin embargo, el contenido no es específico por rol: los tres grupos y sus enlaces se generan para todos los usuarios; el rol solo determina cuál grupo se abre inicialmente. La ruta desktop de sidebar apunta a IDs que no están presentes en los dashboards inspeccionados. Además, varios dashboards no reciben el botón común y la apertura/cierre no implementa una transición real del panel.

## Evidencia funcional

### Acordeón y drawer móvil

- `js/ui-common.js:4710-4721`: `toggleRoleMenuAccordionSection` alterna la clase `hidden` de la sección indicada y oculta las secciones hermanas. La función existe y su comportamiento nominal está implementado.
- `js/ui-common.js:4723-4755`: `initRoleNavigationMenu` obtiene el rol desde el objeto `currentUser` almacenado en localStorage/sessionStorage, intenta asociar un control desktop y crea o conecta el botón móvil.
- `js/ui-common.js:4757-4890`: `openMobileHamburgerDrawer` crea un drawer en el body, permite cerrar al pulsar el fondo, contiene tres grupos de acordeón y vuelve a mostrar el drawer si ya existe.
- `js/ui-common.js:4917-4924`: el inicializador común programa `initRoleNavigationMenu` tras DOMContentLoaded.

**Resultado:** la capacidad básica de mostrar/ocultar el drawer y alternar acordeones está presente.

### Menú realmente específico por rol

**Resultado: NO CUMPLE.**

- `openMobileHamburgerDrawer` construye siempre los tres grupos:
  - Académico & Clases: enlaces a student-dashboard.html y teacher-dashboard.html, además de gráficas.
  - Gestión & Secretaría: enlaces a dashboard-contabilidad.html, dashboard-recursos-humanos.html y políticas.
  - Servicios & Unidades: enlaces a dashboard-tienda.html y dashboard-cafeteria.html.
- No hay ramas que filtren la lista de enlaces según el rol. Todos los grupos permanecen en el HTML del drawer para cualquier usuario.
- El bloque `defaultSectionId` solo selecciona el grupo que se expande inicialmente. Las coincidencias de rol se limitan a admin, director, secretaría, contabilidad, recursos humanos y rh; roles como Coordinador y Desarrollador no tienen un grupo propio.
- El drawer no incluye rutas para dashboard-coordinacion.html, dashboard-direccion.html, dashboard-secretaria.html ni developer-dashboard.html. Por ejemplo, el dashboard de Coordinación puede recibir el botón móvil por tener `#main-header`, pero el drawer no ofrece su propia ruta.
- El rol se obtiene de almacenamiento cliente y se usa para presentación; no existe una matriz de navegación por rol en esta función. La visibilidad del menú no debe sustituir la autorización de cada ruta en servidor.

### Cobertura en dashboards y navegación desktop

**Resultado: PARCIAL.**

- En los dashboards de cafetería, contabilidad, coordinación, dirección, recursos humanos, secretaría, tienda, estudiante y docente se encontró `js/ui-common.js` y `#main-header`; el helper puede insertar el botón móvil en el nav o contenedor del encabezado.
- `dashboard-coordinacion.html` tiene `#main-header`, pero no un elemento `nav`; el helper cae en el contenedor del encabezado y agrega el botón móvil. El drawer resultante no incluye la ruta de Coordinación.
- `developer-dashboard.html` no carga `js/ui-common.js` y no contiene `#main-header`, nav, aside ni control hamburguesa en el archivo inspeccionado; no recibe el menú compartido.
- `app/html/dashboards/dynamic-dashboard.html` carga `ui-common.js`, pero su header no tiene id `main-header`; el selector utilizado por `initRoleNavigationMenu` no encuentra el punto de inserción del botón.
- `initRoleNavigationMenu` busca `#btn-desktop-sidebar-toggle` y alterna `#desktop-sidebar-container`. Ninguno de esos IDs aparece en los 11 dashboards principales inspeccionados. En varias páginas existe navegación horizontal en el encabezado, pero no el sidebar desktop que este código intenta controlar. Por tanto, esa rama no tiene un control/contendor real al cual conectarse.

### Colapso y transición móvil

**Resultado: NO CUMPLE plenamente.**

- El backdrop recibe la clase `animate-fade-in`, pero `css/style.css` no define una regla exacta para `.animate-fade-in`; sí define `.animate-fade-in-up` y `.animate-fade-in-left` (líneas 195-201).
- El panel interior no tiene clases de transición/transformación. Cerrar el drawer o un enlace añade `hidden` directamente; el acordeón también usa `classList.toggle('hidden')`. El contenido aparece/desaparece de forma inmediata.
- `css/style.css:175-190` define `.mobile-menu-backdrop` y su transición, pero el drawer generado no utiliza esa clase.
- Los botones del acordeón no actualizan `aria-expanded` ni enlazan su sección con `aria-controls`. Esto también se relaciona con los criterios ampliados de accesibilidad de T-UX-13/TASK-253.

## Pruebas y cobertura real

- `runUXSuiteTests`, UX-09, `js/ui-common.js:1918-1926`, solo comprueba que `openMobileHamburgerDrawer` y `toggleRoleMenuAccordionSection` sean funciones. No abre el drawer, no comprueba su contenido por rol, no activa los acordeones y no verifica rutas ni transiciones.
- Se inspeccionaron los 11 dashboards principales enumerados en el informe, además de los archivos compartidos `js/ui-common.js` y `css/style.css`.
- No se ejecutaron navegador, DOM real, pruebas táctiles, pruebas de teclado ni suites automatizadas. No se afirma validación runtime.

## Reconciliación con tareas posteriores y backlog

- **T-UX-13** amplía expresamente el menú por panel: separar opciones comunes/exclusivas, enlazar rutas reales, mostrar sección activa, permitir teclado/táctil y abrir/cerrar en móvil. La implementación observada tampoco demuestra esos criterios para el drawer compartido; deberá auditarse formalmente T-UX-13 en su turno.
- **T-UX-20** amplía la adaptación móvil de paneles y menú. No se declara auditada aquí.
- **T-UX-10** contiene UX-09, pero la prueba es solo de presencia de funciones; no valida los criterios conductuales.
- **TASK-253** contempla un drawer responsive como parte de la accesibilidad/PWA y **TASK-430** contempla coherencia visual del sidebar. Son referencias relacionadas, pero no sustituyen la matriz funcional de rutas por rol ni corrigen el contenido genérico observado.
- Se crea **AUD-NG-186 / TASK-483** para la brecha concreta de navegación por rol, cobertura de dashboards y comportamiento de colapso. No se altera el estado histórico de T-UX-09 ni T-UX-13.

## Calidad

- A favor: el drawer se inserta en `document.body`, el clic en el fondo lo cierra y el acordeón evita mantener abiertas varias secciones hermanas.
- En contra: el menú es estático, no conserva la separación de roles, omite destinos institucionales, no está integrado en todos los dashboards, la rama desktop no encuentra sus elementos y el cierre es inmediato.
- La función usa `innerHTML` para generar el drawer e interpola el rol guardado en cliente. No se encontró evidencia de explotación cross-user en este flujo; se recomienda tratar el rol como texto y no como HTML al corregirlo.

## Hallazgo

- **AUD-NG-186 (MEDIO/P2):** drawer genérico, cobertura incompleta de dashboards y colapso sin transición/desktop sidebar funcional.
- **TASK-483:** completar el menú lateral responsivo y específico por rol en todos los dashboards.
- Código fuente sin modificaciones. `completadas.md` y sus estados históricos permanecen intactos.

## SHAs de respaldo

- `js/ui-common.js`: 986938b8a311a41ed4cb3d135b66b6aaea4bed67.
- `css/style.css`: f1ff84312ce70949a58eaa099b2aad0ff0a59cb6.
- `completadas.md`: f57f1aef832e81e44fc4f7ec36a852d50e464676.
- `METODOLOGIA_DESARROLLO.md`: 214e8221bd076c4e89012636c105bffd5ca36467.
- `Pendientes.md` origen de esta iteración: b52b2dc96f0c869387a59514b4a53f56ea0ca983.
- `Auditoria.txt` origen: f2733a438e74a9602735bda9094ac0b2acec0902.
- `MapaDependencias.md` origen: e15bc3a8aa90ab19026cb4c761c41ed769b4bd5f.
- `AUDITORIA_COMPLETADAS_PLAN.md` origen: e9091e98f32cd0add926a3a840dd763632847ecc.
- `Contexto_personal.txt` origen: 162a57bd71503e9f7a6b6f6a5a1346280561a548.

## Progreso y continuidad

- T-UX-09: **CUMPLE PARCIALMENTE**.
- Hallazgo nuevo: AUD-NG-186.
- Tarea nueva: TASK-483.
- Progreso acumulado: **50/183 identificadores auditados; 133 pendientes**.
- Siguiente tarea: **T-UX-10 - Completar la verificación funcional y automatizar las pruebas de experiencia de usuario**.
