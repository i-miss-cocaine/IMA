# AUDITORÍA COMPLETADA — TAREA-F5-004
## Formulario público de admisión y conexión con el backend

- **Repositorio:** `i-miss-cocaine/IMA`
- **Rama:** `NG_beta_0.0.0.1_work`
- **HEAD auditado:** `52faca33ad74a8de9fd25b5357957468d4c3e096`
- **Tree SHA:** `44de50370c4d31c7f1f7b079739165391eb6f9b8`
- **Fecha:** 2026-11-07
- **ID operativo de sesión/chat:** `IMA-AUDIT-20261107-0155Z` (identificador operativo, no ID nativo de ChatGPT).
- **Informe específico:** no existe en el árbol ni en el historial de la rama; se crea desde cero.
- **Dictamen:** **NO CUMPLE**.
- **Alcance:** interfaz pública, conexión API, validación cliente/servidor, oferta académica, consentimiento ARCO, seguimiento, privacidad, XSS, accesibilidad y comportamiento responsivo.

## 1. Existencia del informe y antecedentes

El árbol recursivo de la rama de trabajo contiene 966 entradas y `truncated=false`. No existe `AUDITORIAS/AUDITORIA_COMPLETADAS_TAREA-F5-004.md`; la consulta de historial Git para esa ruta devolvió cero commits. Tampoco se encontró el informe histórico citado `AUDITORIA_FASE_5_ADMISIONES_PORTAL_FAMILIAS.md` en el árbol ni en el historial consultado. Las versiones histórica y actual de `Auditoria.txt`, incluida la variante acentuada `Auditoría.txt`, no contienen `TAREA-F5-004` ni `HALLAZGOS-F5-P0-01`.

La reconstrucción del alcance procede de:
- `completadas.md`, SHA `f57f1aef832e81e44fc4f7ec36a852d50e464676`, líneas 1920-1944: define los doce requisitos de la tarea y marca históricamente todos los criterios como completados.
- `ChangesLogs.txt`, SHA `d57cf4bd861b5c3720e60cf83241ed804ff645d9`, líneas 1783-1791: declara la creación de `admision.html`, las funciones cliente, y enlaces desde `index.html` y `login.html`.
- La marca histórica `[X] Completada` no se considera prueba de cumplimiento vigente; se cotejó contra el código actual.

## 2. Evidencia inspeccionada

| Archivo | SHA | Alcance |
|---|---|---|
| `admision.html` | `45b84c80d22d2e8dab75852e65847bae6425db44` | Formulario, cuatro pasos, campos, consentimiento, seguimiento, modal, validaciones, autosave, consulta de ofertas y renderizado de resultados; 773 líneas. |
| `js/student.js` | `e2888cea60322e49a40b89adadb8010489605dcc` | `submitPublicAdmissionRequest` 3148-3184 y `getPublicAdmissionStatus` 3186-3194. |
| `js/api.js` | `6b24f666db30a811a8e9b38d466fc6001cf6dfa9` | `fetchApi` 11-181; payload, autorización, reintentos y fallback de lecturas. |
| `js/auth.js` | `8444dd085a3186106d2db7005b61ef934d3c22d8` | Enrutamiento post-login; no incorpora entrada al formulario público. |
| `js/ui-common.js` | `986938b8a311a41ed4cb3d135b66b6aaea4bed67` | `auditAndFixAccessibility` 5248-5300. |
| `index.html` | `cd742047cdc4948259dd721119429b04f78330ca` | Navegación desktop/móvil; no referencia `admision.html`. |
| `login.html` | `3b2e1e8d12a90552ac7b7d584294463a3e8e8f15` | Enlaces y navegación de acceso; no referencia `admision.html`. |
| `backend/academic-service/Code.gs` | `daf1883ec0b8d4f0ff2bc673af8a4e8c5bbd03fc` | `PUBLIC_ACTIONS` 265; `saveAdmissionDraft` 1433; `getAdmissionDraft` 1482; `getPublicAdmissionStatus` 1510-1543; `createAdmissionRequest` 984-1110; `getAcademicOffers` 6061-6099; RBAC 524-583. |
| `css/style.css` | `f1ff84312ce70949a58eaa099b2aad0ff0a59cb6` | Estilos globales; no se ejecutó prueba visual en navegador. |
| `politica-de-privacidad.html` | `8854bae3021e1cdde288709e3fa411b3d6da20c7` | Aviso institucional y derechos ARCO. |
| `tests/regression/academic-grading-suite.js` | `3433b707edd4a2f35c68368a3172932adc2a3b32` | Sin pruebas específicas del formulario público. |
| `tests/regression/modular-dashboard-suite.js` | `0495e1d526a872c33310935a003a83d924d34683` | Sin pruebas específicas del formulario público. |

## 3. Hallazgos

### H1. Los borradores públicos permiten exponer expedientes personales completos y se guardan antes del consentimiento
**Clasificación: CRÍTICO / P0 — nuevo AUD-NG-235**

`PUBLIC_ACTIONS` (265) incluye `saveAdmissionDraft` y `getAdmissionDraft`, por lo que ambas operaciones no requieren sesión autenticada. La página activa el autosave al cargar (760-768) y lo dispara después de cambios en cualquier campo (671-715). A los tres segundos, guarda los datos en `localStorage` (681-689) y, si existe email o DNI, envía el JSON completo a `saveAdmissionDraft` (691-709). Esto sucede mientras la persona todavía está en los pasos 1-3; el aviso y checkbox ARCO aparecen únicamente en el paso 4 (261-274).

`saveAdmissionDraft` (1433 en adelante) almacena el JSON completo en `BorradoresAdmision`, usando como clave el email o la identificación. `getAdmissionDraft` (1482-1508) permite buscar por `draftKey` o `emailResponsable` y devuelve `draftData` íntegro sin comprobar control del correo, token de un solo uso, identidad ni autorización. Un tercero que conozca o adivine el correo/DNI puede consultar datos del menor y del responsable. No se encontró límite de intentos ni caducidad de acceso en esta función.

Además, el borrador local conserva DNI, fecha de nacimiento, nombres, teléfono, email y observaciones en el navegador. `restoreAdmissionDraftOnLoad` carga la primera clave `ngca_admission_draft_*` que encuentre, sin selección de titular ni vencimiento visible; en un dispositivo compartido puede restaurar datos de otra familia.

El consentimiento no se incluye en el payload de envío y no se persiste como evidencia verificable. La recopilación y sincronización del borrador preceden a la aceptación. Esto incumple el requisito de consentimiento informado antes de recopilar datos de menores y expone PII.

### H2. El endpoint público de seguimiento permite enumeración y devuelve datos personales e identificadores internos
**Clasificación: CRÍTICO / P0 — AUD-NG-235**

`getPublicAdmissionStatus` está en `PUBLIC_ACTIONS` (265). La búsqueda acepta indistintamente código de seguimiento o DNI (1511-1524); no exige ambos factores ni una verificación adicional. No se observa rate limit, control de intentos o prueba de posesión del correo/teléfono. Los códigos ADM son secuenciales y previsibles, según el generador revisado en TAREA-F5-003.

La respuesta marcada como `sanitizedRequest` incluye nombres y apellidos del aspirante, fecha, año, grado, estado y `expedienteId` interno (1530-1542). El comentario de sanitización no coincide con el DTO real: nombres y expedienteId siguen siendo datos personales/internos. Un código secuencial conocido o adivinado permite consultar información de otro aspirante. El endpoint devuelve el primer match encontrado y no diferencia una búsqueda autenticada de una anónima.

La interfaz indica “Código de Seguimiento o DNI” (302, 307-310), reforzando que basta uno solo. La respuesta del backend tampoco incluye `nombreResponsable`, `canalIngreso` ni `observaciones`, aunque el frontend intenta mostrarlos (615-627); el contrato está desalineado y esos campos aparecen vacíos o como valores por defecto.

### H3. El renderizado de resultados utiliza HTML sin escapar datos controlables por el usuario
**Clasificación: CRÍTICO / P0 — AUD-NG-235**

`handleTrackStatus` construye `resContainer.innerHTML` con `found.solicitudId`, `found.estadoSolicitud`, `found.nombresAspirante`, `found.apellidosAspirante` y `found.gradoSolicitado` (598-630). Estos datos provienen del backend y varios se originan en la solicitud pública; no se codifican como texto. En el resultado “no encontrado”, también interpola directamente `trackVal` (632-638). Un aspirante puede almacenar contenido HTML/script en campos que luego se insertan como HTML al consultar el estado, y una entrada de búsqueda puede reflejarse sin escapar.

`fetchAcademicOffers` también construye opciones con `innerHTML` e inserta el valor `o.grado` recibido del backend (741-753). Se requiere usar `textContent`/nodos DOM o escape contextual, y aplicar una política de contenido adecuada; la sanitización de entrada no sustituye la codificación de salida.

### H4. La consulta de ofertas no funciona como catálogo público fiable ni limita los grados a ofertas activas
**Clasificación: ALTO / P1**

La página llama a `getAcademicOffers` con `anoId: '2026'` fijo (741-743), aunque el formulario permite elegir 2026 o 2027 (199-202). No vuelve a consultar cuando cambia el año. El endpoint `getAcademicOffers` (6061-6099) no figura en `PUBLIC_ACTIONS` (265); `validateRolePermission` rechaza una acción protegida sin `sessionToken`/authToken/token (524-538). `fetchApi` (39-58) no adjunta un token de sesión al payload, y un visitante público no tiene sesión autenticada. Por tanto, la llamada anónima no está autorizada.

Cuando la respuesta no es `success`, `fetchAcademicOffers` no informa al usuario ni limpia las opciones estáticas; el selector conserva Décimo/Undécimo/Duodécimo como opciones predeterminadas (207-211). Si la consulta sí devolviera datos, el frontend agrega todos los grados sin comprobar `estado` (748-752), y el backend no filtra por oferta activa (6078-6091). Tampoco se selecciona una oferta concreta, sección ni `ofertaId`; solo se envía el grado. El backend no vuelve a validar que ese grado/oferta esté disponible para el año elegido.

### H5. Requisitos documentales solo están codificados de forma estática y el formulario no representa la oferta real
**Clasificación: ALTO / P1**

`updateDocumentRequirementsList` (502-539) contiene dos listas fijas: una para Décimo y otra compartida por Undécimo/Duodécimo. No consulta un catálogo institucional ni la oferta/programa/plan seleccionado. La pantalla cambia la lista según el grado, pero no acredita requisitos dinámicos por programa u oferta vigente. La selección académica solo guarda año y grado; no incluye sección ni identificador de oferta.

### H6. El formulario recoge parentesco y consentimiento, pero los descarta antes de crear la solicitud
**Clasificación: ALTO / P1**

La interfaz captura `parentescoResponsable` (156-162) y exige `consentimientoArco` (270-274). Sin embargo, `handleAdmissionSubmit` construye su propio payload (541-572) y no incluye ninguno de esos dos campos. La función auxiliar `window.submitPublicAdmissionRequest` (3148-3184) tampoco incluye parentesco ni consentimiento; además, la página no la invoca y llama directamente a `fetchApi` (568).

El backend `createAdmissionRequest` (984-1110) no desestructura ni persiste parentesco o consentimiento. La solicitud oficial queda sin relación declarada del responsable y sin prueba durable de aceptación del aviso, aunque la UI haya marcado la casilla. El selector de parentesco tampoco tiene opción vacía inicial: Madre aparece seleccionada por defecto, por lo que `required` no obliga a una elección consciente.

### H7. Las validaciones relevantes se ejecutan principalmente en cliente y no se repiten en el servidor
**Clasificación: CRÍTICO / P0**

`validateStep` (414-450) valida DNI de 13 dígitos, fecha, nombre del responsable, email básico y teléfono de al menos 8 dígitos. La validación telefónica no exige exactamente ocho dígitos nacionales ni comprueba de forma estricta el prefijo +504. La función auxiliar de `student.js` añade validación de DNI/teléfono, pero no es utilizada por la página.

El endpoint público `createAdmissionRequest` valida como obligatorios principalmente nombres, apellidos y grado; no vuelve a validar formato de DNI, fecha de nacimiento, teléfono, email, responsable, parentesco, consentimiento ni oferta activa. Una petición directa puede saltarse el JavaScript y registrar datos incompletos o inválidos. El requisito de validación cliente y servidor no se cumple.

### H8. Los errores de servidor no se asocian a campos y algunos mensajes pueden revelar datos de terceros
**Clasificación: ALTO / P1**

Los errores locales tienen spans ocultables, pero no se enlazan a sus controles mediante `aria-describedby`, no se actualiza `aria-invalid` y no usan `role=alert`/`aria-live` (112-131, 152-176, 414-450). Los errores del backend se muestran con `alert()` genérico (574-580); no se ubican junto al campo afectado. El formulario conserva los valores ante error porque solo se ejecuta `reset()` cuando la respuesta es exitosa (568-580), lo que sí satisface parcialmente el requisito de preservar los datos.

El mensaje de duplicidad del backend puede incluir el nombre de una solicitud existente; la página lo muestra directamente. No se debe revelar información personal para informar una posible coincidencia.

### H9. La interfaz de seguimiento puede interpretar un fallo de red como “solicitud no encontrada”
**Clasificación: MEDIO / P1**

`fetchApi` devuelve una estructura de fallback `status: success, data: [], isFallback: true` para acciones cuyo nombre empieza por `get` tras fallos de red (155-181). `getPublicAdmissionStatus` empieza por `get`; `handleTrackStatus` trata cualquier `status === 'success'` sin `found` como una búsqueda sin coincidencias (602-638). Un fallo de conexión puede mostrarse como “No se encontró ninguna solicitud”, en vez de distinguirse de un resultado real vacío. El panel debe revisar `isFallback` y presentar error de conectividad.

### H10. El portal no está enlazado desde la navegación pública anunciada en el changelog
**Clasificación: MEDIO / P2**

`ChangesLogs.txt` afirma que `index.html` y `login.html` recibieron enlaces directos al formulario. En las versiones actuales de ambos archivos no aparece `admision.html`, “Admisiones” ni un enlace de solicitud para aspirantes. Tampoco se encontró referencia a `admision.html` en `js/ui-common.js`. La página existe y tiene un enlace de regreso a Inicio, pero el acceso depende de conocer la URL directamente; la integración de navegación declarada no está presente.

### H11. La accesibilidad tiene mejoras parciales, pero no acredita WCAG 2.2 AA
**Clasificación: ALTO / P1 — ampliación de T-UX-19**

La página usa etiquetas `label for`, controles nativos, un stepper con `aria-current` y foco al primer control del paso nuevo (110-131, 453-500). Sin embargo:
- los errores no están asociados a los controles y no se anuncian a lectores de pantalla;
- si una validación falla, no se mueve el foco al primer campo inválido;
- las pestañas de solicitud/seguimiento no exponen roles/estado seleccionado;
- el modal de confirmación carece de nombre accesible y manejo de foco/retorno;
- `auditAndFixAccessibility` (ui-common.js 5248-5300) añade roles `dialog` y `aria-modal`, pero no implementa la trampa de foco descrita en su comentario ni corrige la asociación de errores.

Hay mejoras parciales, pero no evidencia de auditoría WCAG 2.2 AA ni pruebas de teclado/lector de pantalla.

### H12. La adaptación responsiva está codificada, pero no se ha verificado en ejecución
**Clasificación: MEDIO / P2 — ampliación de T-UX-20**

`admision.html` usa viewport y clases responsivas `md:`/grillas adaptables (6, 49, 108-110, 148-150, 196-197, 252-258, 308-310). Esto respalda intención de escritorio/móvil, pero no se ejecutaron pruebas en 320px, móvil real, zoom 200/400%, orientación, desbordamiento horizontal ni teclado virtual. Se considera implementación parcial, no aceptación verificada.

## 4. Reconciliación de tareas existentes

- **AUD-NG-235 (nuevo):** confidencialidad de endpoints públicos de admisión, acceso a borradores, seguimiento no enumerable y prevención de XSS por renderizado inseguro. No existía este identificador en Auditoria.txt, MapaDependencias.md, completadas.md ni ChangesLogs.txt.
- **AUD-NG-006:** extender idempotencia a reintentos del formulario, persistencia de la clave entre recargas y recuperación del resultado original.
- **TASK-118:** coordinar IDs de seguimiento con el formato y la unicidad institucional; no duplicar F5-003.
- **AUD-NG-145:** sanitización de mensajes/logs con PII y normalización de errores públicos.
- **AUD-NG-161:** pruebas conductuales de envío, duplicados, seguridad de endpoints, XSS, consentimiento, fallos de red y accesibilidad.
- **T-UX-19:** ampliar accesibilidad de formularios, errores, pestañas y modal.
- **T-UX-20:** verificar el formulario en tamaños móviles y zoom, sin declarar cumplido solo por clases CSS.
- **AUD-NG-036:** coordinar el dato de parentesco/responsable con la integridad de identidad y vínculos; no sustituye la validación de tutela legal.
- **TAREA-F5-004:** mantiene su alcance de integración cliente/backend y debe permanecer Pendiente hasta cumplir los criterios de aceptación. No se modifica el registro histórico `completadas.md`.

## 5. Tareas ejecutables derivadas

### AUD-NG-235 — Proteger el portal público de admisiones y evitar exposición/XSS
- **Hallazgos:** H1, H2 y H3.
- **Severidad:** CRÍTICO / P0.
- **Objetivo:** impedir que visitantes no autorizados lean borradores o datos de otros aspirantes y evitar ejecución de HTML/script suministrado por usuarios.
- **Acciones:** eliminar acceso público directo a `getAdmissionDraft` o exigir token aleatorio de un solo uso y verificación de control del correo; no usar email/DNI como credencial; requerir código más segundo factor verificado para consulta; limitar intentos y aplicar rate limit; devolver DTO mínimo sin nombres ni expedienteId; añadir expiración y revocación de borradores; no sincronizar datos de menores antes del consentimiento; usar textContent/DOM seguro y escape contextual en resultados y opciones.
- **Archivos:** `backend/academic-service/Code.gs`, `admision.html`, `js/student.js`, `js/api.js`.
- **Criterios:** un usuario no puede recuperar un borrador ajeno con email/DNI; código secuencial por sí solo no revela datos; intentos repetidos se limitan; DTO público solo expone estado y campos mínimos; payload HTML se muestra como texto y no ejecuta; ningún dato se sincroniza antes de consentimiento.
- **Prioridad/estado:** P0 · Pendiente.
- **Evidencia de cierre:** pruebas de autorización/anti-enumeración, XSS almacenado/reflejado y verificación del contenido persistido.

### Ampliación — TAREA-F5-004: completar el contrato del formulario público
- **Hallazgos:** H4-H8 y H10.
- **Severidad:** CRÍTICO / P0.
- **Objetivo:** enviar una solicitud completa y válida, asociada a una oferta activa y con consentimiento registrado.
- **Acciones:** exponer un catálogo público seguro de ofertas activas por año; recargarlo al cambiar el año; seleccionar y enviar `ofertaId`/sección; quitar grados estáticos por defecto; obtener requisitos desde configuración por programa; enviar y persistir parentesco y consentimiento (versión, fecha, aceptación); validar todos los campos en servidor; exigir oferta vigente; mostrar errores junto al campo y mantener datos; enlazar la página desde index/login; eliminar duplicación de submit handlers o hacer que la página use un único wrapper.
- **Archivos:** `admision.html`, `js/student.js`, `js/api.js`, `index.html`, `login.html`, ACADEMIC `Code.gs`.
- **Dependencias:** AUD-NG-235, AUD-NG-006, TASK-118, AUD-NG-036, AUD-NG-145 y AUD-NG-161.
- **Criterios:** el visitante ve solo ofertas activas del año elegido; servidor rechaza datos inválidos o una oferta no vigente; parentesco y consentimiento quedan persistidos; error de servidor nunca se presenta como éxito; los errores se anuncian y los datos válidos se conservan; el acceso público está enlazado desde inicio y login.
- **Prioridad/estado:** P0 · Pendiente.
- **Evidencia de cierre:** pruebas API directas sin JavaScript, envío válido/inválido, cambio de año, consentimiento y reintentos.

### Ampliación — AUD-NG-006: reintento idempotente del formulario
- **Hallazgos:** H9 y relación con H1/H4.
- **Acciones:** conservar la misma clave en borrador local de forma segura; no regenerarla al recargar mientras la operación esté pendiente; recuperar resultado original; distinguir fallo de red de resultado vacío; no emitir nueva solicitud cuando la respuesta anterior sea desconocida.
- **Criterios:** pérdida de respuesta seguida de recarga y reenvío no duplica solicitud y recupera el mismo `solicitudId`; fallback de red nunca se interpreta como “no encontrado”.
- **Prioridad/estado:** P1 · Pendiente.

### Ampliación — AUD-NG-145: privacidad de mensajes y logs
- **Hallazgos:** H1, H2 y H8.
- **Acciones:** no devolver nombre de tercero en errores de duplicidad; no registrar payload completo; redacción de DNI, nombres, correo, teléfono y observaciones; usar códigos públicos genéricos y correlationId.
- **Criterios:** logs y respuestas de error no contienen PII ajena; la familia recibe orientación para resolver coincidencia sin datos de terceros.
- **Prioridad/estado:** P1 · Pendiente.

### Ampliación — T-UX-19 / T-UX-20: accesibilidad y responsividad del formulario
- **Hallazgos:** H11 y H12.
- **Acciones:** asociar errores con `aria-describedby`, establecer `aria-invalid`, usar `role=alert`/live regions; enfocar primer campo inválido; definir roles/estado de pestañas; nombrar el diálogo, gestionar foco y Escape; probar teclado, lector de pantalla, contraste y zoom; verificar 320px, 375px, tablet y escritorio.
- **Criterios:** completar flujo con teclado y lector de pantalla; errores anunciados; foco contenido/restaurado en modal; sin solapamientos ni scroll horizontal a los anchos definidos.
- **Prioridad/estado:** P1 · Pendiente.

### Ampliación — AUD-NG-161: pruebas de regresión del portal público
- **Hallazgos:** H1-H12.
- **Acciones:** pruebas de API anónima, acceso cruzado a borradores, consulta por código/DNI, rate limit, XSS, oferta activa, año seleccionado, consentimiento, parentesco, validación server-side, reintento tras pérdida de respuesta, fallos de red, WCAG y viewport.
- **Criterios:** pruebas reproducibles de navegador y backend; no limitarse a búsqueda textual o presencia de handlers.
- **Prioridad/estado:** P1 · Pendiente.

## 6. Pruebas y límites

**Ejecutado:** lectura estática/manual de la página y sus handlers; cotejo de los payloads cliente/backend; revisión de PUBLIC_ACTIONS/RBAC; inspección de save/get draft y status; revisión de getAcademicOffers; búsqueda de enlaces en index/login/ui-common; lectura de política ARCO; revisión de los dos archivos de regresión y del historial/registro documental.

**No ejecutado:** navegador real, pruebas HTTP, lector de pantalla, teclado completo, axe/WAVE, pruebas móviles, XSS dinámico, enumeración, rate limit, almacenamiento productivo, envío de correo, consentimiento legal en producción ni Apps Script runtime.

**Archivos documentales de esta iteración:** este informe, Auditoria.txt, MapaDependencias.md, AUDITORIA_COMPLETADAS_PLAN.md y Contexto_personal.txt. No se modifica código, pruebas, completadas.md, ChangesLogs.txt, Pendientes.md, metodología ni rama base.

## 7. Dictamen y continuidad

**TAREA-F5-004: NO CUMPLE.** La página existe y tiene diseño responsivo, pasos, campos, checkbox ARCO y modal de confirmación; el flujo conserva datos ante error y solo muestra éxito cuando el backend devuelve `status: success`. Sin embargo, la conexión de ofertas no es pública ni dinámica por año; el parentesco y consentimiento se descartan; la validación server-side es insuficiente; el autosave transmite datos de menores antes del consentimiento; los endpoints públicos permiten recuperar borradores y consultar datos personales; hay renderizado inseguro con `innerHTML`; faltan enlaces desde index/login y no se acredita WCAG 2.2 AA.

**Progreso histórico:** el conjunto original mantiene 91/183 identificadores auditados. Se añade AUD-NG-235 como hallazgo nuevo, que deberá incorporarse al recuento global en la reconciliación de identificadores.

**Siguiente tarea oficial:** TAREA-F5-005 — crear la consola administrativa de revisión y decisión de admisiones. Verificar primero si existe su informe y revisar su historial antes de iniciar.
