# Auditoría de tareas completadas: T-UX-20

- **Fecha:** 2026-11-06.
- **Repositorio:** i-miss-cocaine/IMA.
- **Rama auditada:** `NG_beta_0.0.0.1_work`.
- **HEAD de partida:** b8ff842d07062bb9c01ba6bdb2c7b262234e60ab (C1.62).
- **Rama base protegida:** NG_beta_0.0.0.1, HEAD 44d9891132332e692dbe2ba8602b41f50a508a59.
- **Especificación:** completadas.md, SHA f57f1aef832e81e44fc4f7ec36a852d50e464676.
- **Dictamen:** **NO CUMPLE**. La tarea figura [X], pero no se demuestra adaptación móvil integral y hay defectos concretos en capas y scroll de overlays.

## Requisitos contrastados

T-UX-20 aparece en el bloque de tareas UX y en el registro ampliado de Fase 3. Se contrastaron ambas referencias; el alcance ampliado exige:
1. Adaptar la distribución de cada panel al espacio disponible.
2. Mantener accesibles las acciones principales.
3. Permitir abrir y cerrar el menú lateral.
4. Evitar desbordamientos y controles superpuestos.

Criterios de aceptación:
- Paneles sin superposiciones ni desbordamientos críticos.
- Menú lateral operable con controles táctiles.
- Tablas con datos y acciones importantes accesibles.

## Evidencia técnica

### 1. Distribución responsiva y hojas compartidas

- css/style.css (SHA f1ff84312ce70949a58eaa099b2aad0ff0a59cb6) adapta escala tipográfica hasta 768px, tamaño de controles táctiles en un subconjunto de controles (1013-1021) y muestra la navegación inferior hasta 767px (443-459).
- Varias vistas usan clases Tailwind por breakpoint: dashboard-coordinacion.html (SHA 08de8e4eb150ee9f6aad536ca08e8f76f2e0e896, 39-71 y 113-125), dashboard-cafeteria.html (SHA 12f8c828dd1f8f2c3be34e14d8c9478944c64d04, 40-73), dashboard-secretaria.html (SHA fa0d8c23aace24a6acab2d4956398a7f5e1309b8, 56-100) y dashboard-contabilidad.html (SHA b7653b3bff71829f0f67cf47cb894413c56a444a, 41-83). Esto demuestra adaptación parcial de grids y agrupaciones, no ausencia total de diseño responsivo.
- body aplica overflow-x:hidden (css/style.css:67-78). Esta regla puede ocultar visualmente un desbordamiento en lugar de adaptar el componente que lo provoca; no constituye por sí sola evidencia de que no haya overflow.
- La revisión fue estática y representativa; no se certifica que todas las combinaciones de paneles, datos y viewports funcionen sin solapamientos.

### 2. Menú lateral y disparador móvil

- js/ui-common.js (SHA 986938b8a311a41ed4cb3d135b66b6aaea4bed67), initRoleNavigationMenu (4723-4755), inserta el disparador en #main-header nav si existe; el fallback al contenedor solo ocurre cuando no existe nav.
- En student-dashboard.html, teacher-dashboard.html, dashboard-recursos-humanos.html, dashboard-secretaria.html, dashboard-direccion.html y dashboard-contabilidad.html, el nav del encabezado usa hidden md:flex. El botón creado recibe md:hidden y se agrega dentro de ese nav; por tanto, en móvil el padre lo oculta. El mismo patrón aparece en Cafetería y Tienda.
- dashboard-coordinacion.html tiene encabezado sin nav y usa el fallback; developer-dashboard.html no carga ui-common.js y dynamic-dashboard no tiene #main-header.
- La causa raíz y su corrección ya están documentadas en AUD-NG-186/AUD-NG-194 y TASK-483. No se crea una tarea duplicada.
- openMobileHamburgerDrawer (4760-4890) crea un panel fixed con ancho w-80, scroll vertical interno y cierre por fondo/botón/enlace. No se ejecutaron pruebas táctiles ni se verificó el comportamiento en anchos menores que 320px.

### 3. Tablas, formularios y calendarios

- css/style.css:413-436 limita .table-ima-container a overflow-x:auto; teacher-dashboard.html (SHA cbb9e6a272a7d8ad33f99727303305d950533e71, 161-175) y dashboard-recursos-humanos.html (SHA 406bedbae5a5bb3b5c03e4ea7aaa95ed68aea8ee, 112-130) también usan contenedores de scroll horizontal.
- No se encontró un contrato compartido que convierta las tablas en tarjetas móviles. TASK-429 ya exige esa adaptación y mantiene la cobertura de datos/acciones; no se duplica.
- Los formularios de Teacher/RR. HH./Secretaría presentan grids y flex-wrap en diferentes vistas. TASK-492 mantiene la normalización visual de campos y estados; no se duplica.
- js/teacher.js (SHA c475fce5afcd28fca23e7b64398ad32b17773746, 1220-1249) persiste filtros de categorías del calendario; js/secretary.js (SHA 08a81266957b4c18cc25f8ba6749eac30a8f2c2c, 590-642) abre y envía el modal de eventos. Estos fragmentos no acreditan por sí mismos un calendario responsivo de extremo a extremo.

### 4. Hallazgo AUD-NG-212: barra inferior por encima de modales

- css/style.css:443-459 declara .mobile-bottom-nav como fixed, z-index:2100 y display:flex en viewports de hasta 767px.
- index.html (SHA cd742047cdc4948259dd721119429b04f78330ca): profile-modal usa z-[70] (217-260); mobile-bottom-nav aparece en 301-324.
- student-dashboard.html (SHA 6379ea0ed39d71b89747a0280bb925fdf12202c1): profile-modal usa z-[60] (74-115), voucher-modal z-[70] (240-275), submission-modal z-[60] (281-310) y mobile-bottom-nav aparece desde 327.
- La barra inferior tiene un nivel de apilamiento superior a esos overlays. Puede cubrir la zona inferior de un modal e interceptar acciones táctiles. No se observó un contrato que la oculte o la haga inerte mientras el diálogo está abierto.
- **AUD-NG-212 (MEDIO/P2):** superposición de la navegación inferior fija sobre modales móviles. Nuevo alcance, no cubierto por TASK-483 (drawer) ni TASK-493 (modal compartido de detalle).

### 5. Hallazgo AUD-NG-213: formularios modales sin scroll interno

- student-dashboard.html:74-115 (perfil) y 240-275 (comprobante) no declaran max-height ni overflow-y interno en el panel.
- index.html:217-260 (perfil) presenta el mismo patrón.
- Como contraste, student-dashboard.html:281-310 (entrega) declara max-h-[90vh] y un contenedor overflow-y-auto; index.html:391-425 (noticia) limita la altura y desplaza el contenido internamente.
- La diferencia deja los formularios extensos expuestos a exceder el alto disponible en teléfonos pequeños, con acciones fuera de la zona visible. Se registra como riesgo respaldado por estructura estática; no como fallo reproducido en navegador.
- **AUD-NG-213 (MEDIO/P2):** falta de límite de altura y scroll interno en modales de perfil/comprobante. Nuevo alcance, distinto de TASK-493, que se limita al modal compartido de detalle y su seguridad/acciones.

## Hallazgos y reconciliación

- **AUD-NG-212 (MEDIO/P2):** barra inferior con z-index 2100 por encima de modales con z-index 60/70/80.
- **AUD-NG-213 (MEDIO/P2):** formularios de perfil/comprobante sin max-height ni scroll interno, frente a otros modales que sí lo implementan.
- TASK-483 conserva disparador móvil, rutas por rol y drawer.
- TASK-429 conserva tablas móviles, paginación y modo tarjetas.
- TASK-492 conserva el contrato visual de campos.
- TASK-493 conserva seguridad, acciones, IDs y ciclo de vida del modal compartido de detalle.
- TASK-258 conserva foco y accesibilidad; TASK-484 conserva las pruebas conductuales UX.
- Se crea TASK-494 para jerarquía de capas, scroll responsivo y pruebas de overlays generales. No se modifica el estado de tareas históricas ni completadas.md.

## Pruebas y límites

- Ejecutado: inspección estática/manual de especificación, hojas compartidas, inicializador/drawer, tablas y modales de vistas representativas, y reconciliación con backlog/hallazgos históricos.
- No ejecutado: navegador/DOM real; viewports 320x568, 360x640 o 390x844; orientación horizontal; interacción táctil; medición de stacking/scroll; zoom; lectores de pantalla; suites automatizadas.
- No se afirma que T-UX-20 haya pasado pruebas visuales o conductuales. El dictamen se apoya en defectos estáticos verificables y cobertura incompleta.

## SHAs de respaldo

- js/ui-common.js: 986938b8a311a41ed4cb3d135b66b6aaea4bed67.
- css/style.css: f1ff84312ce70949a58eaa099b2aad0ff0a59cb6.
- index.html: cd742047cdc4948259dd721119429b04f78330ca.
- student-dashboard.html: 6379ea0ed39d71b89747a0280bb925fdf12202c1.
- teacher-dashboard.html: cbb9e6a272a7d8ad33f99727303305d950533e71.
- dashboard-recursos-humanos.html: 406bedbae5a5bb3b5c03e4ea7aaa95ed68aea8ee.
- dashboard-secretaria.html: fa0d8c23aace24a6acab2d4956398a7f5e1309b8.
- dashboard-direccion.html: fefaa3bf7884288aef563cfb8aaf244e6cea8b7c.
- dashboard-contabilidad.html: b7653b3bff71829f0f67cf47cb894413c56a444a.
- dashboard-coordinacion.html: 08de8e4eb150ee9f6aad536ca08e8f76f2e0e896.
- dashboard-cafeteria.html: 12f8c828dd1f8f2c3be34e14d8c9478944c64d04.
- dashboard-tienda.html: 60fb5c399b527f7d3a6e764332d8496e17643d5c.
- developer-dashboard.html: 2b69f1bf7ffbbe4902e81de14d6315cedb035a1e.
- app/html/dashboards/dynamic-dashboard.html: 765a45e5666c24c430e841cb70c3d71d03cf9074.
- js/teacher.js: c475fce5afcd28fca23e7b64398ad32b17773746.
- js/secretary.js: 08a81266957b4c18cc25f8ba6749eac30a8f2c2c.
- Pendientes.md: blob vigente 02fbac8e167b6dccb81b160e3cb0a4fc711c329d, recuperado directamente desde Git Database API (1,708,053 bytes, 19,669 líneas).
- METODOLOGIA_DESARROLLO.md: 607490e58a1c4566d367450fd44481d4fbe003fc.

## Cierre

- **Resultado:** T-UX-20 NO CUMPLE.
- **Hallazgos nuevos:** AUD-NG-212 y AUD-NG-213.
- **Tarea nueva:** TASK-494.
- **Código fuente y tests:** sin modificaciones.
- **completadas.md / METODOLOGIA_DESARROLLO.md / ChangesLogs.txt:** sin modificaciones.
- **Progreso:** 61/183 identificadores auditados; 122 pendientes.
- **Siguiente tarea:** T-UX-21 - Completar el indicador de frescura de datos y los estados de sincronización.
