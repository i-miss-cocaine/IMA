# Auditoría de tareas completadas - T-UX-13

**Fecha:** 2026-11-05  
**Repositorio:** i-miss-cocaine/IMA  
**Rama de trabajo:** NG_beta_0.0.0.1_work  
**Rama base protegida:** NG_beta_0.0.0.1  
**HEAD de partida:** f681b2dc4e324fc3aca1018706edd6dc6ce40221  
**Árbol de partida:** 2013892f3ceef7cc85ed4ca64508f19cea1e49c9  
**Tarea:** T-UX-13 - Completar el menú lateral específico de cada panel  
**Estado histórico:** [X] Completada en completadas.md (dos apariciones: líneas 695 y 1584).  
**Progreso anterior:** 53/183 identificadores auditados.  
**Progreso tras esta tarea:** 54/183.

## Dictamen

**NO CUMPLE.** La implementación actual no proporciona un menú lateral de escritorio ni una navegación lateral específica por rol. El único menú común es un drawer móvil estático que presenta los mismos enlaces a todos los usuarios; la función solo utiliza el rol para elegir un acordeón inicial y no filtra rutas autorizadas. Además, el botón hamburguesa se inserta dentro de `#main-header nav` cuando existe. En ocho dashboards ese nav está oculto en móvil (`hidden md:flex`), mientras el propio botón tiene `md:hidden`; por tanto, el control queda oculto en móvil por su padre y oculto en escritorio por su propia clase. En Coordinación, donde no existe nav, el fallback inserta el botón en el contenedor y sí queda disponible en móvil. Developer no carga el módulo compartido y el dashboard dinámico carece del ID de encabezado que el inicializador busca.

El drawer tampoco indica la ruta activa ni expone el estado de los acordeones a tecnologías asistivas. Las acciones inmediatas se mezclan con enlaces de navegación, el acceso a gráficas está implementado como enlace `javascript:void(0)`, y no existe manejo de Escape ni gestión del foco al abrir/cerrar. La navegación estática horizontal de algunos dashboards no reemplaza el menú lateral común ni garantiza rutas limitadas por rol.

## Reconciliación histórica y tareas posteriores

- La tarea T-UX-13 aparece dos veces en `completadas.md`: la primera versión completa (líneas 695-721) define menú lateral por panel, separación entre opciones comunes y exclusivas, separación de navegación/acciones, sección activa, teclado/táctil y presentación móvil; la segunda (línea 1584) es una entrada abreviada sin alcance ni criterios adicionales. Se audita la versión ampliada y se conserva la duplicada sin modificar el archivo.
- T-UX-09 también aparece en dos registros (líneas 624 y 1560). La auditoría previa C1.49 registró AUD-NG-186 y originó TASK-483.
- **AUD-NG-186 / TASK-483** ya cubre el drawer genérico, falta de rutas por rol, ausencia de sidebar desktop, dashboards con encabezados alternativos y falta de transición/accesibilidad. No se crea una tarea duplicada. Esta auditoría agrega AUD-NG-194 como evidencia adicional del disparador móvil inaccesible y del estado activo/semántica incompletos, y amplía TASK-483.
- T-UX-19 (accesibilidad) y T-UX-20 (adaptación móvil) son tareas relacionadas posteriores. No sustituyen el menú específico por rol ni resuelven la inserción del disparador en un contenedor oculto.
- T-UX-10/UX-09 solo comprueba la existencia de `openMobileHamburgerDrawer` y `toggleRoleMenuAccordionSection`; no valida la visibilidad del disparador, rutas, roles, estado activo ni comportamiento de teclado/táctil.
- T-UX-11/TASK-485 y TASK-486 cubren historial y conservación de estado de vistas; no sustituyen el menú lateral ni la matriz de navegación.
- La auditoría original referenciada en `completadas.md` (`AUDITORIA_FASE3_EXPERIENCIA_USUARIO_NAVEGACION.md`) no aparece en el árbol actual de la rama; la especificación verificable utilizada es la tarea ampliada de `completadas.md` y la evidencia histórica AUD-NG-186 de `Auditoria.txt`.

## Evidencia por componente

### 1. Inicialización y disparador móvil

Archivo: `js/ui-common.js`, SHA `986938b8a311a41ed4cb3d135b66b6aaea4bed67`.

- Líneas 4710-4721: `toggleRoleMenuAccordionSection` alterna la clase `hidden` en el acordeón seleccionado y oculta los hermanos. No actualiza `aria-expanded`, `aria-controls` ni estado activo.
- Líneas 4723-4755: `initRoleNavigationMenu` lee `currentUser.rol` desde almacenamiento del cliente y usa `Estudiante` como valor por defecto. No consulta una matriz de permisos ni deriva opciones desde permisos efectivos.
- Líneas 4732-4738: el control desktop solo se conecta si encuentra `#btn-desktop-sidebar-toggle` y `#desktop-sidebar-container`. No se encontró ninguno de esos IDs en los 11 dashboards principales revisados.
- Líneas 4740-4754: el disparador móvil se agrega a `#main-header nav` si existe; solo si no existe ese nav se agrega a `#main-header .container`. El botón recibe la clase `md:hidden`.
- Los encabezados de Dirección, Recursos Humanos, Contabilidad, Estudiante, Docente, Secretaría, Cafetería y Tienda tienen un `nav` con `hidden md:flex`. El botón queda dentro de un padre oculto en móvil; en escritorio el propio `md:hidden` lo oculta. El disparador no es visible en ninguno de esos dos tamaños.
- El encabezado de Coordinación no tiene `nav`; el fallback utiliza el contenedor y el botón puede mostrarse en móvil.
- `developer-dashboard.html` no carga `js/ui-common.js` ni usa `#main-header`; no ejecuta este menú común.
- `app/html/dashboards/dynamic-dashboard.html` carga `ui-common.js`, pero su encabezado no tiene `id="main-header"`; el inicializador no encuentra un destino para insertar el disparador.

### 2. Contenido y filtrado por rol

Archivo: `js/ui-common.js`, líneas 4757-4890.

- `openMobileHamburgerDrawer` genera tres grupos estáticos: Académico & Clases, Gestión & Secretaría, Servicios & Unidades.
- Todos los roles reciben los mismos enlaces. No hay filtro por rol, permisos, unidad o dashboard actual.
- El rol solo se utiliza para seleccionar `defaultSectionId`: algunos roles que contienen admin/director/secretar/contad/recursos/rh abren Gestión; los demás abren Académico. Coordinador, Desarrollador, EncargadoTienda y EncargadoCafeteria no tienen tratamiento específico.
- Los enlaces existentes llevan a Estudiante, Docente, Contabilidad, Recursos Humanos, Tienda y Cafetería, además de políticas. No aparecen las rutas principales de Coordinación, Dirección, Secretaría ni Desarrollador.
- La acción “Gráficas de Rendimiento” es un `a href="javascript:void(0)"` que abre un modal, aunque T-UX-13 exige separar navegación de acciones inmediatas. Debe representarse como botón.
- El botón “Reportar Problema” sí es un botón de acción y no una ruta.
- El nombre del rol se concatena en el HTML del drawer mediante `innerHTML`; no se aplica codificación contextual a ese valor obtenido de almacenamiento cliente.

### 3. Estado activo y accesibilidad

- El drawer no marca la ruta actual en sus enlaces; no se establece `aria-current="page"` ni una clase activa por dashboard.
- Los botones de acordeón no declaran `aria-expanded` ni `aria-controls`; la función de alternancia solo cambia `hidden`.
- El disparador móvil sí declara `aria-label`, pero no sincroniza `aria-expanded` ni referencia el drawer mediante `aria-controls`.
- El drawer no declara rol modal ni `aria-modal`; no mueve el foco al abrir, no atrapa el foco, no gestiona Escape y no devuelve el foco al disparador al cerrar. El contenido de fondo permanece en el orden de tabulación.
- Los enlaces y botones nativos son enfocables por teclado, pero eso no demuestra un flujo completo y controlable del drawer con teclado.
- El botón de cierre y el clic sobre el fondo añaden `hidden` inmediatamente. No existe una transición real asociada a `animate-fade-in`.
- `css/style.css`, SHA `f1ff84312ce70949a58eaa099b2aad0ff0a59cb6`, líneas 175-201: define `.mobile-menu-backdrop`, `.animate-fade-in-up` y `.animate-fade-in-left`; no define `.animate-fade-in`, que es la clase que el drawer asigna. El acordeón alterna `hidden` sin transición.
- `css/style.css`, líneas 1053-1063, sí contiene una regla global `prefers-reduced-motion: reduce`. Esto no corrige la ausencia de transición efectiva ni el estado accesible del menú.

### 4. Navegación desktop y dashboards

- `initRoleNavigationMenu` contiene un listener de colapso desktop, pero ninguno de los 11 dashboards inspeccionados contiene `btn-desktop-sidebar-toggle` o `desktop-sidebar-container`. No hay sidebar desktop funcional.
- Algunos dashboards sí tienen navegación horizontal propia, con enlaces codificados directamente en HTML y en algunos casos estilos visuales para la página actual. Esos menús no constituyen un sidebar compartido, no cubren todas las páginas y no aplican una matriz dinámica por rol.
- Dirección, RH, Contabilidad y Secretaría muestran enlaces horizontales cruzados a otros paneles. La visibilidad de esas rutas no se deriva de los permisos del usuario.
- Estudiante y Docente tienen navegación horizontal propia con `nav class="hidden md:flex"`; tampoco tienen un disparador móvil independiente fuera de ese contenedor.
- Coordinación tiene encabezado alternativo sin nav y depende del fallback de inserción en `.container`.
- Developer y dynamic-dashboard no quedan integrados al menú compartido por las causas descritas arriba.

## Hallazgo y tarea asociada

- **AUD-NG-194 (MEDIO/P2):** el disparador móvil de navegación se inserta dentro de un `nav.hidden.md:flex` en ocho dashboards, pero el botón usa `md:hidden`; por ello queda oculto en móvil por el padre y en escritorio por su propia clase. Coordinación es el único dashboard estándar revisado sin nav y usa el fallback. Developer no carga el módulo y dynamic-dashboard no expone `#main-header`. Además, el drawer carece de estado activo accesible y mezcla una acción inmediata con enlaces.
- **Tarea asociada:** TASK-483 (existente, pendiente). Se amplía su evidencia y aceptación; no se crea otro ID de tarea para duplicar el alcance.
- Se conserva AUD-NG-186 como hallazgo original sobre menú genérico, rutas faltantes y desktop no funcional.

## SHAs de respaldo

- `completadas.md`: f57f1aef832e81e44fc4f7ec36a852d50e464676.
- `Pendientes.md` blob vigente recuperado del HEAD de trabajo: 42999b169766bbfd10a2d3de02fc40fc937fc620.
- `js/ui-common.js`: 986938b8a311a41ed4cb3d135b66b6aaea4bed67.
- `css/style.css`: f1ff84312ce70949a58eaa099b2aad0ff0a59cb6.
- `dashboard-direccion.html`: fefaa3bf7884288aef563cfb8aaf244e6cea8b7c.
- `dashboard-recursos-humanos.html`: 406bedbae5a5bb3b5c03e4ea7aaa95ed68aea8ee.
- `dashboard-contabilidad.html`: b7653b3bff71829f0f67cf47cb894413c56a444a.
- `student-dashboard.html`: 6379ea0ed39d71b89747a0280bb925fdf12202c1.
- `teacher-dashboard.html`: cbb9e6a272a7d8ad33f99727303305d950533e71.
- `dashboard-secretaria.html`: fa0d8c23aace24a6acab2d4956398a7f5e1309b8.
- `dashboard-coordinacion.html`: 08de8e4eb150ee9f6aad536ca08e8f76f2e0e896.
- `developer-dashboard.html`: 2b69f1bf7ffbbe4902e81de14d6315cedb035a1e.
- `app/html/dashboards/dynamic-dashboard.html`: 765a45e5666c24c430e841cb70c3d71d03cf9074.
- `dashboard-cafeteria.html`: 12f8c828dd1f8f2c3be34e14d8c9478944c64d04.
- `dashboard-tienda.html`: 60fb5c399b527f7d3a6e764332d8496e17643d5c.
- `Auditoria.txt` antes: 140d24451ba70fe0d8c1aa6275a3512da96bf1de.
- `MapaDependencias.md` antes: 4f489ee2d449133a18ee54561058a5881479fd23.
- `AUDITORIA_COMPLETADAS_PLAN.md` antes: aa7023d8366a24511698596e7e94e1fe3a6b7894.
- `Contexto_personal.txt` antes: fcfdda4782d9848dcceb9bebe3b98684702d5ea0.

## Pruebas y límites

- Ejecutado: inspección estática/manual de la tarea ampliada, los dos registros duplicados, el drawer, inicializador, acordeones, estilos relacionados y encabezados/estructura de los 11 dashboards.
- No ejecutado: navegador, DOM real, interacción de teclado/táctil, pruebas de viewport, lectores de pantalla ni suites automatizadas.
- No se modificó código fuente. No se modificó `completadas.md`, `ChangesLogs.txt` ni `METODOLOGIA_DESARROLLO.md`.
- Dictamen limitado a evidencia estática; la imposibilidad de observar el DOM/runtime se mantiene explícita.

## Tareas ejecutables derivadas de los hallazgos

### [TASK-483] Ampliar menú responsivo con disparador visible y semántica accesible
- **Hallazgo de origen:** AUD-NG-194; ampliación de AUD-NG-186/TASK-483.
- **Severidad:** Medio.
- **Objetivo:** garantizar que el menú pueda abrirse desde móvil y que el estado de navegación sea perceptible y accesible.
- **Acción ejecutable:** mover el disparador fuera de nav.hidden.md:flex o ubicarlo en un contenedor visible en móvil; cargar el módulo en Developer y exponer el encabezado requerido en dashboard dinámico; actualizar aria-expanded/aria-controls y estado activo; distinguir enlaces de acciones inmediatas; preservar la matriz de rutas por rol.
- **Archivos/módulos afectados:** js/ui-common.js, dashboards HTML, Developer y dashboard dinámico.
- **Dependencias y riesgos:** AUD-NG-186/TASK-483; T-UX-19 y T-UX-20 son referencias relacionadas, no sustituyen este alcance.
- **Alcance:** ampliación de TASK-483, no crear una tarea paralela.
- **Criterios de aceptación:** disparador visible y operable en los 11 dashboards revisados; menú carga para Developer/dynamic-dashboard; estado activo y semántica ARIA correctos; teclado/táctil permiten navegar; las rutas visibles respetan el rol.
- **Prioridad:** P2.
- **Estado:** Pendiente.
- **Evidencia de cierre:** pruebas por dashboard, rol y viewport móvil/escritorio.
