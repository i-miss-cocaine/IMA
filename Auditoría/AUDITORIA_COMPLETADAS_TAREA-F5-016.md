# AUDITORÍA TÉCNICA - TAREA-F5-016: accesibilidad WCAG 2.2 AA y adaptación móvil de admisiones

- **Repositorio:** i-miss-cocaine/IMA
- **Rama auditada:** NG_beta_0.0.0.1_work
- **Último checkpoint autorizado por el usuario:** C1.210
- **HEAD de referencia de C1.210:** 8ab2fdf7e1825f04a977ff9ac93f52bcb41ae641
- **Árbol de referencia de C1.210:** 15b91e7c081d502a237db4def3ec9b8572ea5553
- **HEAD real de la rama al iniciar esta iteración:** 70350a196fe3d944dba0e1a23d8e02e29fe8e7a5 (el commit existente contiene la entrada C1.211; no se adopta como checkpoint autorizado ni se reescribe el historial)
- **Rama base protegida:** NG_beta_0.0.0.1
- **HEAD de rama base:** 44d9891132332e692dbe2ba8602b41f50a508a59
- **Comparación previa:** 279 commits adelante y 0 detrás.
- **Checkpoint de inicio:** C1.210
- **Checkpoint de cierre:** C1.212
- **Sesión operativa:** IMA-AUDIT-20261107-1708Z (identificador operativo, no ID nativo de ChatGPT)
- **Fecha:** 2026-11-07
- **Dictamen técnico:** **NO CUMPLE**

## 1. Búsqueda documental, fuente y continuidad

Se comprobó la ruta AUDITORIAS/AUDITORIA_COMPLETADAS_TAREA-F5-016.md en el árbol recursivo de NG_beta_0.0.0.1_work: no existe. La consulta del historial de commits para esa ruta devolvió cero resultados. Se realiza la auditoría desde cero.

**Fuente de requisitos:** completadas.md, SHA f57f1aef832e81e44fc4f7ec36a852d50e464676, líneas 2321-2351. La tarea contiene 11 requisitos y 6 criterios de aceptación, todos marcados [x], con estado administrativo [X] Completada. La marca se conserva como dato histórico y no acredita cumplimiento técnico.

**Origen citado:** Auditoria.txt (HALLAZGOS F5: HALLAZGOS-F5-P3-01) y AUDITORIA_FASE_5_ADMISIONES_PORTAL_FAMILIAS.md (Subcapacidad 5.14, Brecha P3-01). El identificador HALLAZGOS-F5-P3-01 no aparece en el registro vigente Auditorias/Auditoria.txt y el informe de fase no está en el árbol de la rama. No se usa el ChangesLogs como sustituto de una auditoría.

**ChangesLogs.txt:** SHA 5b5cff1926b73a05d1b92087a7bf4b2db75326ff, líneas 1902-1904. Declara únicamente que goToStep incorpora foco en el primer control, aria-current, barra de progreso y llamada a auditAndFixAccessibility. Se contrastó esa declaración con la implementación real.

**Pendientes.md:** la lectura convencional devuelve 0 caracteres, pero el blob SHA 631b4c2dbf0e86d5704b63625382d73ccb8ceb3c se recuperó y leyó íntegramente: 1.782.094 caracteres, 20.182 líneas y cero caracteres U+FFFD. No contiene una entrada literal F5-016. TASK-258 permanece [ ] Pendiente y cubre la accesibilidad transversal; TASK-484 permanece [ ] Pendiente y cubre las pruebas conductuales UX. No se modificó Pendientes.md.

**Continuidad de rama:** el HEAD real de NG_beta_0.0.0.1_work es 70350a196fe3d944dba0e1a23d8e02e29fe8e7a5. El commit existente asociado a C1.211 se preserva como antecedente Git, pero C1.210 continúa siendo el último checkpoint que el usuario autorizó como referencia. Se verificó que admision.html, js/ui-common.js, css/style.css y las dos suites de regresión tienen los mismos SHA en C1.210 y en el HEAD real; por tanto, el código auditado no cambió entre ambos árboles. No se hizo reset, force-push ni modificación de la rama base.

## 2. Evidencia técnica y respaldos

| Archivo | SHA de respaldo | Secciones/rangos examinados |
|---|---|---|
| completadas.md | f57f1aef832e81e44fc4f7ec36a852d50e464676 | TAREA-F5-016, líneas 2321-2351; 11 requisitos/6 criterios. |
| ChangesLogs.txt | 5b5cff1926b73a05d1b92087a7bf4b2db75326ff | Declaración F5-016, líneas 1902-1904. |
| admision.html | 45b84c80d22d2e8dab75852e65847bae6425db44 | Stepper y formulario (57-294); scripts cargados (372-378); inicialización y tabs (380-412); validateStep/goToStep/updateSummaryCard (414-517); envío (539-585); modal y cierre (647-655); inicialización final (760-769). |
| js/ui-common.js | 986938b8a311a41ed4cb3d135b66b6aaea4bed67 | trackModalFocus y listener Escape (87-144); setupCommonUI/autoinicialización (6 y 3487-3494); runUXSuiteTests UX-02 (1861-1867); auditAndFixAccessibility (5244-5300). |
| css/style.css | f1ff84312ce70949a58eaa099b2aad0ff0a59cb6 | escala móvil y body overflow-x (63-78); breakpoints globales (116-165); navegación móvil (443-459); focus y estados select (794-800); skip-link/focus-visible/objetivos táctiles/contraste/movimiento reducido (970-1064). |
| tests/regression/academic-grading-suite.js | a22cb3ef376fe09e65c1b17c2f4f5125290bfba6 | Archivo completo; no contiene referencias ni pruebas F5-016, goToStep, stepper o WCAG de admisiones. |
| tests/regression/modular-dashboard-suite.js | 0495e1d526a872c33310935a003a83d924d34683 | Archivo completo; no contiene referencias ni pruebas F5-016, goToStep, stepper o WCAG de admisiones. |
| AUDITORIAS/Auditoria.txt | 697f82228ff72f8656843809c098d32b848bfb94 | AUD-NG-211, líneas 5994-6000; F5-004 y T-UX-19, líneas 7033-7043. |
| AUDITORIAS/MapaDependencias.md | a51510c1ba43232f9f00239ad6dde407e55c8d4d | Dependencias de accesibilidad, helper, formularios y F5-011..F5-015; líneas 1107, 1519-1521 y secciones finales. |
| AUDITORIAS/AUDITORIA_COMPLETADAS_T-UX-19.md | f8be1dbc8c1caabafdb23493a37ce4f3eb19e707 | Hallazgos transversales AUD-NG-210/211 y tareas TASK-258/TASK-484. |
| AUDITORIAS/AUDITORIA_COMPLETADAS_T-UX-20.md | 81dd4b239c8e8fcdc8ec7c5fcbb615a714e12d25 | Limitaciones de responsividad, T-UX-20, TASK-494 y pruebas móviles no ejecutadas. |
| AUDITORIAS/AUDITORIA_COMPLETADAS_TAREA-F5-004.md | 475815185489830eef2e7c51856bedbadd6c0e3d | Hallazgo de errores de admisión no asociados y modal sin foco, líneas de accesibilidad y cierre. |
| Pendientes.md (blob) | 631b4c2dbf0e86d5704b63625382d73ccb8ceb3c | Lectura íntegra recuperada: 1.782.094 caracteres/20.182 líneas/sin U+FFFD; TASK-258 y TASK-484 pendientes. |
| AUDITORIAS/Contexto_personal.txt | 26848c6bd18582befea98cf059284679d2692645 | Rama inicial obsoleta en línea 41 y checkpoints acumulativos hasta C1.211. |
| AUDITORIAS/AUDITORIA_COMPLETADAS_PLAN.md | be33d212132fb598d766b8415d80c9f9182c894a | Continuidad hasta C1.211; siguiente tarea F5-016. |

## 3. Matriz de requisitos y criterios

| Requisito | Resultado | Evidencia y evaluación |
|---|---|---|
| 1. Stepper de seis pasos (aspirante, responsable, selección académica, documentos, revisión/consentimiento, confirmación/comprobante). | **NO CUMPLE** | admision.html solo contiene cuatro nodos y cuatro secciones: Aspirante, Responsable, Académico y Confirmación. No existen pasos independientes de documentos y comprobante dentro del stepper. |
| 2. Barra de progreso elástica y clara. | **PARCIAL** | La barra visual cambia su width en goToStep, pero calcula el porcentaje sobre cuatro pasos y carece de role=progressbar, aria-valuemin/max/now y descripción del paso actual para tecnologías de asistencia. |
| 3. Navegación hacia pasos anteriores sin perder información. | **CUMPLE ESTÁTICAMENTE** | Los pasos 2, 3 y 4 ofrecen botones Anterior y los controles permanecen en el DOM al ocultar/mostrar secciones. No se ejecutó prueba de navegador. |
| 4. Resaltar pasos con campos incompletos o errores. | **NO CUMPLE** | Los nodos solo distinguen pasos anteriores, actual y futuros. validateStep no marca el nodo como incompleto ni con error; el paso 3 no tiene validación personalizada. |
| 5. Resumen antes de confirmación. | **CUMPLE ESTÁTICAMENTE** | summary-card y updateSummaryCard muestran aspirante, identificación, responsable, contacto y grado al entrar al paso 4. |
| 6. Errores claros junto a cada control y foco automático. | **PARCIAL** | Hay spans de error en campos de los pasos 1 y 2. No hay errores equivalentes para todos los controles del paso 3; los mensajes no se enlazan con aria-describedby ni aria-invalid y validateStep no enfoca el primer control inválido. El foco de goToStep va al primer control del paso, no al error. |
| 7. Deshabilitar envío y mostrar spinner. | **CUMPLE ESTÁTICAMENTE** | handleAdmissionSubmit deshabilita btn-submit-admission y cambia el contenido a spinner antes del fetch; finally lo reactiva. No se ejecutó prueba de doble clic. |
| 8. Diseño responsivo desde 320px. | **PARCIAL / NO VERIFICADO EN RUNTIME** | Hay viewport meta, grids de una/dos columnas y breakpoints globales. No hay reglas específicas del formulario que acrediten todos los estados a 320px; body usa overflow-x:hidden, lo que puede ocultar desbordamientos en vez de resolverlos. No se ejecutaron viewports móviles. |
| 9. WCAG 2.2 AA: teclado, contraste, ARIA y restauración de foco. | **NO CUMPLE** | Existe focus-visible global y labels for en los controles principales, pero faltan semántica del stepper/progreso, asociación de errores, anuncio de cambios, foco correcto del error y ciclo accesible del modal. Se identifican textos de bajo contraste. |
| 10. Ejecutar auditAndFixAccessibility automáticamente al renderizar vistas. | **NO CUMPLE** | La única llamada de admision.html ocurre dentro de goToStep. No se invoca al render inicial ni desde switchTab. El helper no es una auditoría WCAG completa. |
| 11. Compatibilidad con lectores de pantalla. | **NO CUMPLE** | Los labels visibles son una base positiva, pero el progreso no tiene semántica, no se anuncian cambios de paso/errores, los mensajes no se asocian a campos y el modal carece de nombre accesible y gestión de foco completa. |

**Criterios de aceptación:**
1. Stepper fluido: parcial; hay navegación secuencial y botones de retroceso, pero solo cuatro pasos y sin estado de error.
2. Conservación al retroceder: cumple estáticamente; los valores permanecen en los controles del DOM.
3. Spinner y prevención de doble clic: cumple estáticamente; el botón se deshabilita durante el fetch.
4. Adaptación 320px+: no verificable; el CSS es parcialmente responsivo, pero no hubo prueba visual/conductual.
5. Teclado y lectores de pantalla: no cumple; la navegación nativa existe, pero la semántica y los anuncios dinámicos son incompletos.
6. Auditoría en tiempo real sin contraste/ARIA ausentes: no cumple; el helper no comprueba contraste ni la mayoría de los atributos semánticos y hay valores de contraste insuficientes.

## 4. Hallazgos técnicos

### H1 - El flujo implementa cuatro pasos en lugar de los seis definidos
- **Severidad:** Alta / P1.
- **Evidencia:** admision.html:71-97 define step-node-1 a step-node-4; las secciones form-step-1 a form-step-4 abarcan aspirante, responsable, selección académica y resumen/consentimiento (102-294). No existen pasos diferenciados de requisitos documentales ni de confirmación/comprobante.
- **Impacto:** el flujo no coincide con el alcance funcional; la barra de progreso y los estados de navegación representan una secuencia distinta a la especificada.

### H2 - El progreso y el estado de los pasos no son semánticos ni reflejan errores
- **Severidad:** Alta / P1.
- **Evidencia:** el contenedor del stepper solo tiene aria-label genérico (72); los nodos son div sin semántica de lista/pasos. La barra stepper-progress-bar solo actualiza width (75, 497-499), sin role=progressbar ni valores ARIA. aria-current se establece dentro de goToStep, por lo que el paso inicial no lo recibe al renderizar. Los nodos solo reflejan anterior/actual/futuro, nunca incompleto/error.
- **Impacto:** un lector de pantalla no obtiene una representación fiable del avance ni del estado de validación.

### H3 - Validación parcial, errores sin asociación y ausencia de foco en el primer error
- **Severidad:** Alta / P1.
- **Evidencia:** validateStep (414-450) solo implementa validaciones personalizadas para pasos 1 y 2. goToStep (454-457) valida únicamente el paso actual al avanzar; no existe rama de validación para el paso 3. Los spans err-* no se relacionan mediante aria-describedby y los controles no reciben aria-invalid. Cuando la validación falla, la función retorna sin enfocar el campo inválido. Los campos del paso 3 dependen de required nativo y pueden estar ocultos al enviar desde el paso 4.
- **Impacto:** errores difíciles de localizar, ausencia de feedback semántico y riesgo de bloqueo en campos requeridos ocultos.

### H4 - Hay textos pequeños cuyo contraste no alcanza WCAG AA
- **Severidad:** Alta / P1.
- **Evidencia:** admision.html usa text-gray-400 en indicadores y ayudas de 10-11px y text-red-500 en mensajes de error de tamaño pequeño (por ejemplo, líneas 79-85, 112-131, 124, 168-176). Con la paleta Tailwind predeterminada, #9ca3af sobre blanco ofrece aproximadamente 2.54:1 y #ef4444 sobre blanco aproximadamente 3.76:1. Ambos quedan por debajo del mínimo 4.5:1 para texto normal; el tamaño aplicado no es texto grande.
- **Impacto:** baja legibilidad para personas con visión reducida y fallo del criterio de contraste, aunque exista una preferencia global de alto contraste.

### H5 - auditAndFixAccessibility no verifica WCAG y no se ejecuta en el render inicial
- **Severidad:** Alta / P1.
- **Evidencia:** js/ui-common.js:5248-5300 solo recorre botones/enlaces con role=button, asigna aria-label heurístico, añade role/aria-modal a ciertos overlays y conserva borradores de un modal distinto. No calcula contraste, no comprueba nombres accesibles calculados, no vincula labels/errores, no valida progreso/aria-current ni crea anuncios ARIA. Devuelve únicamente scannedElements/fixesApplied. En admision.html la única invocación está en goToStep (505-508); el DOMContentLoaded inicial solo llama setupCommonUI y updateDocumentRequirementsList (384-387), y switchTab no invoca la auditoría.
- **Impacto:** la llamada declarada en ChangesLogs no equivale a una auditoría WCAG ni garantiza ejecución al renderizar la vista.

### H6 - El modal de confirmación no gestiona su ciclo de foco ni su nombre accesible
- **Severidad:** Alta / P1.
- **Evidencia:** showAdmissionModal/closeAdmissionModal (647-655) solo alternan clases. El modal no declara aria-labelledby ni un nombre accesible. auditAndFixAccessibility puede añadir role=dialog y aria-modal tras la navegación de paso, pero no mueve el foco al modal, no confina Tab, no marca el fondo como inerte y no registra el activador mediante trackModalFocus. El cierre no restaura explícitamente el foco. El listener Escape global solo puede devolverlo a lastActiveElementBeforeModal si otro flujo lo dejó correctamente capturado.
- **Impacto:** el usuario de teclado/lector puede permanecer detrás del diálogo o perder el contexto al cerrarlo.

### H7 - La adaptación a 320px no está demostrada
- **Severidad:** Media / P2.
- **Evidencia:** existen viewport meta y clases responsive/grid; css/style.css aplica overflow-x:hidden al body (67-78), breakpoints generales y estilos focus/motion. No se encontraron pruebas del formulario a 320px, 360px, orientación horizontal o zoom. overflow-x:hidden puede ocultar un desbordamiento sin corregir su origen.
- **Impacto:** no se puede certificar el requisito 100% responsivo ni descartar solapamientos/controles inaccesibles en pantallas reducidas.

### H8 - No hay pruebas conductuales específicas de F5-016
- **Severidad:** Alta / P1.
- **Evidencia:** tests/regression/academic-grading-suite.js y modular-dashboard-suite.js no contienen referencias a F5-016, goToStep, stepper, auditAndFixAccessibility ni pruebas de accesibilidad del formulario. No se encontró suite dedicada de admisiones.
- **Impacto:** los criterios de navegación, foco, validación, doble envío, lector de pantalla y viewports no tienen regresión reproducible. TASK-484 ya cubre pruebas UX conductuales y debe ampliarse, no duplicarse.

## 5. Reconciliación de hallazgos y dependencias

- **AUD-NG-211 (ALTO/P1) se amplía por referencia:** ya registra que auditAndFixAccessibility es parcial y no asocia labels/errores ni crea un live announcer. Se añade el caso concreto de admisiones: progreso sin semántica, errores err-* no relacionados, contraste de text-gray-400/text-red-500 y helper invocado solo al cambiar de paso. No se crea un AUD-NG nuevo.
- **TASK-258 permanece como remediación transversal pendiente:** cubre foco, teclado, modal, anuncios ARIA, contraste y preferencias del sistema. Incorporar en su alcance la instancia de admisiones, sin crear otra tarea global de accesibilidad.
- **TASK-484 permanece como suite conductual pendiente:** incorporar casos del formulario público (pasos, validación, errores, foco, progreso, modal y viewports), sin crear un framework de pruebas duplicado.
- **TASK-492** mantiene el contrato semántico de campos/estados; **TASK-493** mantiene el modal compartido; **TASK-130** conserva las ayudas descriptivas; **AUD-NG-181** conserva Escape/restauración de foco. No absorber sus objetivos.
- **T-UX-19** y **T-UX-20** ya fueron auditadas como NO CUMPLE. Esta auditoría se limita al formulario público de admisión y no reabre el alcance general de todos los dashboards.
- **TASK-494** conserva capas y scroll de overlays móviles; coordinar solo si la prueba del modal de admisión detecta una interferencia real.

## 6. Pruebas y límites de verificación

**Ejecutado:** inspección estática/manual de los 11 requisitos y 6 criterios; revisión de admision.html, ui-common.js, style.css y las dos suites; comparación de SHA entre el árbol de C1.210 y el HEAD actual; consulta de árbol e historial de la ruta del informe; búsqueda en Auditoria.txt y lectura íntegra del blob Pendientes.md; cálculo de contraste de los colores Tailwind citados.

**No ejecutado:** navegador real; Tab/Shift+Tab/Enter/Escape; NVDA/JAWS/VoiceOver; comprobación del árbol de accesibilidad; pruebas de 320x568, 360x640, 390x844, orientación horizontal y zoom; medición automatizada/visual de contraste en todos los estados; Apps Script/HTTP; suites automatizadas. No se afirma que las pruebas dinámicas hayan pasado.

## 7. Dictamen

**TAREA-F5-016: NO CUMPLE.** Se conserva su estado administrativo [X] en completadas.md, sin modificarlo. Hay implementación parcial útil (navegación anterior, resumen, deshabilitación/spinner y focus-visible global), pero el stepper no corresponde a los seis pasos requeridos y las brechas de validación, contraste, semántica, anuncios, gestión de foco, auditoría y pruebas impiden aceptar los criterios WCAG 2.2 AA y de lectores de pantalla.

---

## 8. Tareas ejecutables derivadas de los hallazgos

> Todas las tareas siguientes son locales a esta auditoría. AUD-NG-211, TASK-258 y TASK-484 se amplían por referencia; no se crean IDs globales duplicados.

### F5-016-A01 - Completar el stepper de seis pasos y su semántica de progreso
- **Hallazgo de origen:** H1 y H2.
- **Severidad:** Alta / P1.
- **Objetivo:** alinear el flujo real con los seis pasos exigidos y comunicar el avance a usuarios visuales y tecnologías de asistencia.
- **Acción concreta:** separar requisitos documentales, revisión/consentimiento y confirmación/comprobante en los pasos definidos; mantener datos entre transiciones; representar el stepper como estructura semántica; exponer el paso actual y el porcentaje mediante role=progressbar y atributos ARIA actualizados.
- **Archivos/módulos:** admision.html (markup del stepper, form-step-1..n, goToStep, updateSummaryCard).
- **Dependencias/riesgos:** conservar la lógica de envío, campos y resumen; coordinar TASK-258 para semántica/ARIA. Riesgo de pérdida de datos al dividir secciones.
- **Alcance:** únicamente el flujo público de admisión; no modificar el portal familiar ni otros dashboards.
- **Criterios de aceptación:** existen los seis pasos especificados; navegación siguiente/anterior conserva todos los valores; el paso actual y el avance se anuncian correctamente; el progreso visual y accesible coincide con el paso real.
- **Prioridad:** P1. **Estado:** Pendiente.

### F5-016-A02 - Completar validación por paso y estado visual de errores
- **Hallazgo de origen:** H2 y H3.
- **Severidad:** Alta / P1.
- **Objetivo:** impedir avanzar con datos inválidos y permitir localizar y corregir cada error.
- **Acción concreta:** validar todos los pasos antes de avanzar/enviar; marcar el nodo del paso con error/incompleto; aplicar aria-invalid y aria-describedby; enfocar el primer control inválido y mostrar el error junto a él; evitar que required nativo bloquee el envío desde un control oculto.
- **Archivos/módulos:** admision.html (validateStep, goToStep, controles y spans err-*).
- **Dependencias/riesgos:** TASK-492 para el contrato de campos y TASK-130 para ayuda descriptiva; evitar duplicar mensajes o contradecir validaciones del backend.
- **Alcance:** campos del formulario de admisión y sus estados; no modificar reglas de negocio del backend.
- **Criterios de aceptación:** cada paso valida sus controles; no se avanza con errores; el paso se marca visualmente; cada mensaje queda enlazado al control; el foco se desplaza al primer error; no hay errores ocultos inaccesibles.
- **Prioridad:** P1. **Estado:** Pendiente.

### F5-016-A03 - Completar navegación por teclado, anuncios y ciclo de foco del modal
- **Hallazgo de origen:** H2, H3 y H6.
- **Severidad:** Alta / P1.
- **Objetivo:** asegurar que cambios de paso, validaciones y confirmación sean comprensibles y operables con teclado/lector de pantalla.
- **Acción concreta:** anunciar el cambio de paso y errores mediante una región aria-live persistente; proporcionar nombre accesible al stepper y al diálogo; mover foco al diálogo al abrirlo; confinar Tab dentro del modal; soportar Escape según el contrato común y devolver el foco al disparador correcto al cerrar.
- **Archivos/módulos:** admision.html (stepper, errores, showAdmissionModal/closeAdmissionModal); js/ui-common.js (integración con trackModalFocus y ciclo de diálogo).
- **Dependencias/riesgos:** TASK-258, AUD-NG-181 y TASK-493. No implementar un segundo gestor global de modales.
- **Alcance:** el formulario y modal de confirmación de admisión; reutilizar componentes comunes.
- **Criterios de aceptación:** todos los pasos son navegables con Tab/Shift+Tab/Enter; el lector anuncia paso, progreso, errores y estado de envío; el modal tiene nombre, foco inicial, confinamiento y retorno; el fondo no recibe foco mientras el diálogo está abierto.
- **Prioridad:** P1. **Estado:** Pendiente.

### F5-016-A04 - Corregir contraste y convertir el helper en auditoría verificable
- **Hallazgo de origen:** H4 y H5.
- **Severidad:** Alta / P1.
- **Objetivo:** eliminar los falsos positivos de accesibilidad y detectar de forma efectiva las barreras de admisión.
- **Acción concreta:** reemplazar combinaciones de texto con contraste inferior al umbral; ampliar auditAndFixAccessibility para informar incumplimientos reales de contraste, nombres, relaciones de campos, progreso, estados y regiones vivas; ejecutarlo al render inicial y tras cada render/cambio relevante; no declarar conformidad solo por contar elementos.
- **Archivos/módulos:** admision.html; js/ui-common.js (auditAndFixAccessibility); css/style.css.
- **Dependencias/riesgos:** ampliar AUD-NG-211 y TASK-258; coordinar TASK-492. La auditoría dinámica debe evitar modificar DOM de forma que cambie el comportamiento funcional.
- **Alcance:** vista pública de admisión y helper compartido requerido por ella; no certificar vistas no probadas.
- **Criterios de aceptación:** texto normal cumple 4.5:1 y componentes/foco no textual cumplen el umbral aplicable; el helper devuelve fallos identificables y no falsos PASS; se ejecuta al render inicial y tras cambios; las pruebas confirman la corrección.
- **Prioridad:** P1. **Estado:** Pendiente.

### F5-016-A05 - Verificar y corregir la adaptación móvil desde 320px
- **Hallazgo de origen:** H7.
- **Severidad:** Media / P2.
- **Objetivo:** demostrar que el formulario completo puede usarse sin desbordamientos, solapamientos ni controles inaccesibles en pantallas pequeñas.
- **Acción concreta:** probar el formulario en 320, 360 y 390px, tablet y escritorio, orientación vertical/horizontal y zoom; corregir stepper, botones, textos y contenedores; no utilizar overflow-x:hidden como sustituto de resolver desbordamientos.
- **Archivos/módulos:** admision.html; css/style.css.
- **Dependencias/riesgos:** T-UX-20 y TASK-494 para patrones responsivos/overlays; no duplicar su alcance global.
- **Alcance:** formulario y modal público de admisión.
- **Criterios de aceptación:** no hay scroll horizontal no intencional ni elementos superpuestos; todos los controles y acciones siguen visibles/usables a 320px; el modal puede desplazarse y cerrarse; se documentan capturas/mediciones reproducibles.
- **Prioridad:** P2. **Estado:** Pendiente.

### F5-016-A06 - Incorporar pruebas conductuales específicas del formulario de admisión
- **Hallazgo de origen:** H3, H5, H6, H7 y H8.
- **Severidad:** Alta / P1.
- **Objetivo:** impedir regresiones de navegación, validación, accesibilidad y adaptación móvil.
- **Acción concreta:** ampliar la suite existente TASK-484 o integrarla en el mecanismo de regresión para probar los seis pasos, avance/retroceso, campos incompletos, asociación/foco de errores, progreso ARIA, modal/Escape/retorno de foco, doble envío, estados de carga y viewports 320px+ con datos sintéticos.
- **Archivos/módulos:** tests/regression/; admision.html; js/ui-common.js; css/style.css.
- **Dependencias/riesgos:** TASK-484, TASK-258 y AUD-NG-161. No crear una suite UX paralela ni llamar servicios productivos.
- **Alcance:** pruebas conductuales del formulario de admisión, separadas de pruebas de negocio del backend.
- **Criterios de aceptación:** los casos positivos, negativos y límite son reproducibles; cada caso informa PASS/FAIL/SKIPPED/BLOCKED; se verifica DOM/foco/ARIA y viewport; los mocks no escriben datos reales; las pruebas se pueden repetir sin dejar listeners/timers/DOM contaminado.
- **Prioridad:** P1. **Estado:** Pendiente.

## 9. Archivos y estado de la iteración

- **Archivos documentales modificados:** AUDITORIAS/AUDITORIA_COMPLETADAS_TAREA-F5-016.md (nuevo); AUDITORIAS/Auditoria.txt; AUDITORIAS/MapaDependencias.md; AUDITORIAS/AUDITORIA_COMPLETADAS_PLAN.md; AUDITORIAS/Contexto_personal.txt.
- **Sin modificar:** admision.html; js/ui-common.js; css/style.css; tests/*; completadas.md; Pendientes.md; ChangesLogs.txt; METODOLOGIA_DESARROLLO.md; AUDITORIAS/README.md; rama base.
- **Proceso:** auditoría/documentación exclusivamente; no se implementaron las seis tareas derivadas. Un único commit consolidado incluirá los cinco archivos documentales y el checkpoint C1.212.
