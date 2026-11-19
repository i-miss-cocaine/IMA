# AUDITORÍA TÉCNICA - TAREA-F5-015: guardado automático de borradores y recuperación de solicitudes

- **Repositorio:** i-miss-cocaine/IMA
- **Rama auditada:** NG_beta_0.0.0.1_work
- **HEAD de partida:** 8ab2fdf7e1825f04a977ff9ac93f52bcb41ae641
- **Árbol de partida:** 15b91e7c081d502a237db4def3ec9b8572ea5553
- **Rama base protegida:** NG_beta_0.0.0.1
- **HEAD de rama base:** 44d9891132332e692dbe2ba8602b41f50a508a59
- **Checkpoint de inicio:** C1.210
- **Checkpoint de cierre:** C1.211
- **Sesión operativa:** IMA-AUDIT-20261107-1627Z (identificador operativo de auditoría, no ID nativo de ChatGPT)
- **Fecha:** 2026-11-07
- **Dictamen técnico:** **NO CUMPLE**

## 1. Búsqueda documental, fuente y continuidad

Se consultó la ruta `AUDITORIAS/AUDITORIA_COMPLETADAS_TAREA-F5-015.md` en `NG_beta_0.0.0.1_work`: no existe en el árbol recursivo de la rama. La consulta del historial de commits limitada a esa ruta devolvió cero resultados. La auditoría se realizó desde cero.

**Fuente de requisitos:** `completadas.md`, SHA `f57f1aef832e81e44fc4f7ec36a852d50e464676`, líneas 2294-2317. TAREA-F5-015 contiene 10 requisitos y 6 criterios de aceptación, todos marcados [x], con estado administrativo [X] Completada. La marca se conserva; no se toma como prueba técnica.

**Origen citado por la tarea:** `Auditoria.txt` (HALLAZGOS F5: HALLAZGOS-F5-P2-02) y `AUDITORIA_FASE_5_ADMISIONES_PORTAL_FAMILIAS.md` (Subcapacidad 5.2, Brecha P2-02). El informe de fase no aparece en el árbol y su ruta tampoco tiene commits en el historial de la rama. No se localizó el identificador HALLAZGOS-F5-P2-02 en el registro vigente `AUDITORIAS/Auditoria.txt`. Se utilizó como evidencia adicional la declaración de implementación en `ChangesLogs.txt`, pero el contraste determinante se hizo contra el código actual.

**ChangesLogs.txt:** SHA `5b5cff1926b73a05d1b92087a7bf4b2db75326ff`, líneas 1893-1900. Declara creación de `BorradoresAdmision`, handlers `saveAdmissionDraft`/`getAdmissionDraft`, alta en `PUBLIC_ACTIONS`/dispatcher, consumo al enviar, guardado híbrido local/servidor y restauración. Se verificó la existencia de esos elementos, pero no el cumplimiento funcional, de seguridad ni de recuperación entre dispositivos.

**Pendientes.md:** la lectura convencional devuelve 0 caracteres. Se recuperó el blob histórico exacto SHA `631b4c2dbf0e86d5704b63625382d73ccb8ceb3c`: 1.782.094 caracteres, 20.182 líneas y cero caracteres U+FFFD. No se modificó ni restauró el archivo. El inventario mantiene `AUD-NG-002` en estado [ ] Pendiente; su alcance incluye expresamente retirar `saveAdmissionDraft`/`getAdmissionDraft` de `PUBLIC_ACTIONS`, derivar el sujeto de claims verificados y comprobar propiedad/capacidad opaca del borrador. Este hallazgo de seguridad se amplía por referencia, sin crear un ID global duplicado.

**Ramas:** HEAD de trabajo verificado en `8ab2fdf7e1825f04a977ff9ac93f52bcb41ae641`; HEAD de base `44d9891132332e692dbe2ba8602b41f50a508a59`. Comparación previa: 278 commits adelante y 0 detrás. Árbol recursivo de trabajo: SHA `15b91e7c081d502a237db4def3ec9b8572ea5553`, 977 entradas, no truncado.

## 2. Evidencia técnica y respaldos

Los SHA corresponden a los archivos consultados en la rama auditada. La inspección fue estática; no se modificó código.

| Archivo | SHA de respaldo | Secciones/rangos examinados |
|---|---|---|
| completadas.md | f57f1aef832e81e44fc4f7ec36a852d50e464676 | TAREA-F5-015, líneas 2294-2317; 10 requisitos/6 criterios. |
| backend/academic-service/Code.gs | df87a2eea9f0ef79d0b966d03fd5bbe432003df5 | getOrCreateSheet y encabezado BorradoresAdmision (84-120); PUBLIC_ACTIONS (265); validateRolePermission (524-583); doPost/dispatcher/catch (671-977); createAdmissionRequest y consumo del borrador (984-1110); saveAdmissionDraft/getAdmissionDraft (1432-1507). |
| admision.html | 45b84c80d22d2e8dab75852e65847bae6425db44 | scripts cargados (373-378); formulario/campos (100-294); submit (545-585); indicador y autosave/restauración (664-739); inicialización/listeners (760-769). |
| js/api.js | 6b24f666db30a811a8e9b38d466fc6001cf6dfa9 | fetchApi, enriquecimiento de payload, respuesta JSON, reintentos y fallback (11-181). |
| js/student.js | e2888cea60322e49a40b89adadb8010489605dcc | archivo completo; no contiene saveAdmissionDraft, getAdmissionDraft ni los identificadores del flujo de borradores F5-015. |
| js/ui-common.js | 986938b8a311a41ed4cb3d135b66b6aaea4bed67 | setupUnsavedChangesProtection (5371-5430); helper existe, pero admision.html no lo invoca. |
| tests/regression/academic-grading-suite.js | a22cb3ef376fe09e65c1b17c2f4f5125290bfba6 | Archivo completo; no contiene F5-015, saveAdmissionDraft, getAdmissionDraft ni BorradoresAdmision. |
| tests/regression/modular-dashboard-suite.js | 0495e1d526a872c33310935a003a83d924d34683 | Archivo completo; no contiene F5-015, saveAdmissionDraft, getAdmissionDraft ni BorradoresAdmision. |
| ChangesLogs.txt | 5b5cff1926b73a05d1b92087a7bf4b2db75326ff | Declaración F5-015, líneas 1893-1900. |
| Pendientes.md (blob histórico) | 631b4c2dbf0e86d5704b63625382d73ccb8ceb3c | Lectura íntegra recuperada; AUD-NG-002 incluye explícitamente los dos handlers de borradores. |
| METODOLOGIA_DESARROLLO.md | cf796728bb384a32537392df2f9c72a339fa03ee | Reglas de auditoría, tareas derivadas, commit único, checkpoints y publicación controlada (§§3-4, 15-17). |
| AUDITORIAS/Auditoria.txt | 914f650ebaede4c38ef6fefc5c1f24e0d3c35001 | Antecedentes de AUD-NG-002 y checkpoint C1.210. |
| AUDITORIAS/MapaDependencias.md | 04c33bf199a0f9d94a6fff045630266885128c91 | Dependencias previas y secciones F5-011 a F5-014. |
| AUDITORIAS/AUDITORIA_COMPLETADAS_PLAN.md | 6a58d8895d0e60a642c5646900ec080425d7672d | Continuidad hasta C1.210. |
| AUDITORIAS/Contexto_personal.txt | 22980c7d2ca4188288d1e6028b41c1e0ff448615 | Checkpoint C1.210 y reglas de continuidad/publicación. |

## 3. Hallazgos técnicos

### H1 - Exposición y modificación pública de borradores sin identidad ni propiedad verificadas
- **Severidad:** Crítica / P0.
- **Evidencia:** `PUBLIC_ACTIONS` incluye `saveAdmissionDraft` y `getAdmissionDraft` (Code.gs:265). `validateRolePermission` retorna autorización inmediata para cualquier acción de esa lista, antes de validar token o claims (524-525). `saveAdmissionDraft` acepta `draftKey`/`emailResponsable` y actualiza o crea una fila sin verificar titularidad (1433-1479); `getAdmissionDraft` busca con esos valores y devuelve `draftData` completo (1482-1506).
- **Impacto:** conocer o adivinar el correo/DNI/clave de un responsable permite consultar o sobrescribir información personal del aspirante y su familia sin demostrar control de la cuenta. Los datos incluyen información de menores.
- **Reconciliación:** AUD-NG-002 ya cubre expresamente este caso y permanece pendiente en Pendientes.md. No se crea una tarea global duplicada.

### H2 - La restauración desde la nube no está conectada al formulario
- **Severidad:** Alta / P1.
- **Evidencia:** el backend declara y despacha `getAdmissionDraft` (Code.gs:845, 1482-1506), pero en `admision.html` no existe llamada a `fetchApi('ACADEMIC', 'getAdmissionDraft', ...)`. `restoreAdmissionDraftOnLoad` solo consulta `localStorage` (717-739).
- **Impacto:** el borrador guardado en `BorradoresAdmision` no se recupera al entrar desde otro dispositivo, navegador o perfil. El componente en la nube funciona como escritura sin un flujo de lectura utilizable por la interfaz.

### H3 - La copia local no es inmediata y puede perder cambios al cerrar la página
- **Severidad:** Alta / P1.
- **Evidencia:** `triggerAdmissionAutoSave` espera 3 segundos y solo después ejecuta `localStorage.setItem` (admision.html:683-715). La tarea pide copia local inmediata y debounce de 5 segundos para la sincronización. No hay vaciado del temporizador en `pagehide`/`beforeunload`. Aunque `setupUnsavedChangesProtection` existe en ui-common.js, admision.html no lo invoca.
- **Impacto:** cerrar o recargar durante la ventana de debounce puede perder lo escrito desde el último guardado. La protección auxiliar no sustituye la persistencia inmediata ni está inicializada en esta página.

### H4 - Clave local compartida y selección de borrador incorrecta
- **Severidad:** Alta / P1.
- **Evidencia:** la clave usa correo o DNI en texto claro; antes de disponer de ellos utiliza el literal común `draft_local` (admision.html:688-695). La restauración toma `keys[0]` sin vincularlo a una identidad, comparar fechas ni elegir el más reciente (719-735).
- **Impacto:** distintos aspirantes que usan el mismo navegador pueden sobrescribir o restaurar un borrador ajeno; pueden persistir claves antiguas cuando cambia el correo/DNI y la primera clave no necesariamente representa el último borrador.

### H5 - Datos personales sin protección local ni limpieza al terminar
- **Severidad:** Alta / P1.
- **Evidencia:** se serializa el formulario completo en JSON dentro de `localStorage` (admision.html:691-696). El formulario contiene DNI, fecha de nacimiento, nombres, teléfono, email y datos del responsable (100-230). No hay cifrado, caducidad, política de sesión ni eliminación de claves locales; no se encontró `localStorage.removeItem` para el prefijo de borradores.
- **Impacto:** la información personal permanece legible en el perfil del navegador y puede quedar disponible en equipos públicos o compartidos. La tarea exige expresamente evitar esa exposición.

### H6 - El indicador puede afirmar que la nube guardó cuando el servidor devolvió error
- **Severidad:** Alta / P1.
- **Evidencia:** el bloque de autosave espera `fetchApi` y luego muestra “Borrador guardado en nube” sin comprobar `res.status` (admision.html:699-713). `fetchApi` devuelve el JSON parseado incluso cuando contiene `status: "error"` (api.js:107-135); el dispatcher académico convierte excepciones en `textResponse({status:"error", ...})` (Code.gs:972-975), respuesta que no necesariamente provoca una excepción HTTP.
- **Impacto:** fallos de validación, permisos, Apps Script o persistencia pueden quedar representados visualmente como sincronización exitosa. El indicador no es una confirmación fiable del estado remoto.

### H7 - Reintentos de red parciales, sin cola durable ni reanudación al reconectar
- **Severidad:** Alta / P1.
- **Evidencia:** `fetchApi` contempla hasta dos reintentos genéricos para determinados errores de red, con esperas de 1 y 2 segundos (api.js:11-14, 142-153). El flujo de borradores no conserva un estado pendiente de sincronización ni registra un listener `online` para reintentar cuando vuelve la conexión; tras agotar los reintentos solo actualiza el indicador local en el catch (admision.html:707-713).
- **Impacto:** existe una tolerancia básica a fallos transitorios, pero no se garantiza reintento silencioso y durable de todos los borradores pendientes. Los errores de aplicación que llegan como JSON `status:error` tampoco entran al catch.

### H8 - Falta guardado manual y no se muestra fecha/hora de actualización
- **Severidad:** Media / P2.
- **Evidencia:** el HTML solo contiene un `span` informativo `#draft-save-indicator` (líneas 63-65); no hay control de guardado manual. El indicador muestra textos genéricos y no incorpora la fecha/hora, aunque el backend devuelve `fechaActualizacion` y el almacenamiento local conserva `timestamp`.
- **Impacto:** no se cumple la opción de guardado manual ni el requisito de mostrar fecha/hora de la última actualización. Tampoco se informa de forma diferenciada una sincronización pendiente o un conflicto.

### H9 - Actualización de borradores no atómica ni versionada
- **Severidad:** Alta / P1.
- **Evidencia:** `saveAdmissionDraft` lee la hoja, busca una fila y luego actualiza o hace `appendRow` sin `LockService`, versión, ETag ni comparación de última actualización (1437-1472). La generación de ID se invoca con `skipLock: true` (1461). No hay detección de edición simultánea.
- **Impacto:** dos dispositivos que creen el borrador al mismo tiempo pueden insertar filas duplicadas; dos ediciones concurrentes pueden sobrescribirse con política implícita de último escritor, sin advertir ni resolver conflictos. El criterio de no duplicación solo se cumple en el caso secuencial simple.

### H10 - El envío formal no elimina el borrador local y permite restaurar datos obsoletos
- **Severidad:** Alta / P1.
- **Evidencia:** `createAdmissionRequest` marca como `Consumido` la primera fila remota coincidente (Code.gs:1090-1101). En cambio, al éxito, `handleAdmissionSubmit` resetea el formulario y muestra confirmación, pero no elimina la clave `ngca_admission_draft_*` de localStorage (admision.html:568-585). La carga siguiente vuelve a ejecutar `restoreAdmissionDraftOnLoad` (760-768).
- **Impacto:** aunque el registro de nube se marque consumido, la copia local continúa activa y puede reaparecer como borrador antiguo tras un envío completado. Si existían filas duplicadas, el servidor solo consume la primera coincidencia.

### H11 - La restauración no reconstruye correctamente todos los tipos de control
- **Severidad:** Media / P2.
- **Evidencia:** `collectFormData` usa `FormData` (admision.html:674-680) y la restauración asigna solo `input.value` cuando el dato es truthy (725-730). No asigna `.checked` para checkbox/radio, no restaura valores vacíos y no valida que el formulario exista antes de llamar a `querySelector`.
- **Impacto:** los valores de controles booleanos no se reconstruyen como estado marcado/desmarcado; los campos vacíos y otros estados del formulario no tienen restauración determinista. El formulario incluye selects y checkbox de consentimiento.

### H12 - No hay pruebas conductuales específicas para borradores
- **Severidad:** Alta / P1.
- **Evidencia:** `tests/regression/academic-grading-suite.js` y `tests/regression/modular-dashboard-suite.js` no contienen F5-015, `saveAdmissionDraft`, `getAdmissionDraft` ni `BorradoresAdmision`. No se localizó una suite de admisiones dedicada en el árbol inspeccionado.
- **Impacto:** no hay evidencia automatizada de recuperación local/nube, persistencia offline, privacidad local, autorización, concurrencia, conflictos, conversión/purga ni restauración de controles.

## 4. Matriz de criterios de aceptación

| Criterio registrado como [x] | Resultado de auditoría | Evidencia |
|---|---|---|
| Cerrar a mitad del formulario y recuperar al reingresar | **Parcial** | Solo restaura una clave local arbitraria; no consulta el borrador remoto y el guardado local espera 3 s. |
| Guardar sin completar campos obligatorios | **Cumple parcialmente** | El autosave no ejecuta validación final y el handler solo exige `draftDataJSON`; no hay prueba conductual. |
| Mostrar fecha/hora de última actualización | **No cumple** | Se conserva timestamp pero no se muestra en la interfaz. |
| Convertir y purgar al enviar formalmente | **Parcial** | Se marca consumido en nube; la copia local no se elimina y puede restaurarse. |
| Error de conexión no borra copia local | **Parcial** | El catch no borra la copia, pero esta se escribe después del debounce y no hay cola durable/reconexión. |
| Reintentos no generan borradores duplicados | **No cumple bajo concurrencia** | El upsert es lectura-búsqueda-escritura sin lock ni clave/versionado atómico. |

## 5. Tareas ejecutables derivadas de los hallazgos

Las siguientes subtareas son locales a esta auditoría y deben permanecer pendientes hasta implementación y verificación. No sustituyen AUD-NG-002 ni crean IDs globales duplicados.

### F5-015-A01 - Integrar recuperación de borrador en nube con identidad autorizada
- **Hallazgos:** H1, H2.
- **Severidad:** Crítica (P0) para la autorización; Alta (P1) para la integración funcional.
- **Objetivo y acción:** Conectar la restauración remota al formulario, condicionada a la corrección de autorización/propiedad de AUD-NG-002.
- **Prioridad:** P0/P1.
- **Archivos:** admision.html; js/api.js; backend/academic-service/Code.gs.
- **Dependencias:** AUD-NG-002; sistema de sesión/claims y capacidad de borrador.
- **Alcance:** conectar `getAdmissionDraft` a la carga del formulario; recuperar por sujeto/capacidad verificada, no por email/DNI como prueba de identidad; resolver precedencia y sincronización local/nube.
- **Criterios verificables:** un usuario solo recupera su borrador; petición anónima o con identidad manipulada es denegada; el borrador se recupera desde otro dispositivo después de autenticar; no se exponen borradores de terceros.
- **Estado:** Pendiente.

### F5-015-A02 - Persistir localmente de inmediato y completar el ciclo de autosave
- **Hallazgo:** H3.
- **Severidad:** Alta (P1).
- **Objetivo y acción:** Persistir una copia local inmediata y programar la sincronización con debounce de 5 segundos, protegiendo el abandono de página.
- **Prioridad:** P1.
- **Archivos:** admision.html; js/ui-common.js.
- **Alcance:** escribir una instantánea local inmediata ante cada cambio y usar debounce de 5 segundos para sincronización; vaciar cambios pendientes al abandonar la página de forma segura; integrar protección de formulario sin limpiar estado antes de confirmar persistencia.
- **Criterios verificables:** cerrar/re cargar dentro de los primeros 3 segundos no pierde el último cambio; la sincronización se programa a los 5 segundos; los estados dirty/clean solo cambian tras resultados válidos.
- **Estado:** Pendiente.

### F5-015-A03 - Aislar y proteger el almacenamiento local de datos personales
- **Hallazgo:** H4, H5.
- **Severidad:** Alta (P1).
- **Objetivo y acción:** Eliminar la exposición de PII y el cruce de borradores mediante claves opacas, ámbito de usuario, expiración y limpieza.
- **Prioridad:** P1.
- **Archivos:** admision.html; js/ui-common.js o módulo de persistencia aprobado.
- **Alcance:** sustituir claves con email/DNI y el fallback compartido `draft_local` por identificadores opacos; vincular el borrador a la sesión/contexto correcto; aplicar expiración, limpieza y una estrategia de protección adecuada para equipos públicos.
- **Criterios verificables:** no aparecen DNI/email/teléfono como parte de la clave ni datos sensibles en texto claro en el almacenamiento local; dos usuarios del mismo navegador no leen ni sobrescriben borradores; borradores expirados o enviados no se restauran.
- **Estado:** Pendiente.

### F5-015-A04 - Hacer fiable la cola y el resultado de sincronización
- **Hallazgos:** H6, H7.
- **Severidad:** Alta (P1).
- **Objetivo y acción:** Asegurar una cola durable de sincronización, reintentos al reconectar y confirmación veraz del estado remoto.
- **Prioridad:** P1.
- **Archivos:** admision.html; js/api.js; backend/academic-service/Code.gs.
- **Alcance:** comprobar `res.status` y contrato de respuesta; mantener una cola durable de cambios pendientes; reintentar al recuperar conexión con backoff y deduplicación; no declarar sincronización hasta confirmación remota.
- **Criterios verificables:** respuestas JSON `status:error`, HTTP fallido y timeout nunca muestran estado de nube guardado; un borrador offline se sincroniza al reconectar; no se pierde la última versión pendiente.
- **Estado:** Pendiente.

### F5-015-A05 - Añadir guardado manual e indicador temporal completo
- **Hallazgo:** H8.
- **Severidad:** Media (P2).
- **Objetivo y acción:** Añadir guardado manual e indicador con fecha/hora y estados de persistencia diferenciados.
- **Prioridad:** P2.
- **Archivos:** admision.html.
- **Alcance:** agregar control de guardado manual y mostrar fecha/hora de última copia local y última sincronización remota, además de estados guardando, local, nube, pendiente, error y conflicto.
- **Criterios verificables:** el usuario puede forzar guardado; la hora mostrada corresponde a la última persistencia confirmada; un fallo no se presenta como éxito.
- **Estado:** Pendiente.

### F5-015-A06 - Implementar upsert atómico y resolución de conflictos multidispositivo
- **Hallazgo:** H9.
- **Severidad:** Alta (P1).
- **Objetivo y acción:** Hacer atómico el upsert del borrador y resolver escrituras concurrentes con versionado y conflicto explícito.
- **Prioridad:** P1.
- **Archivos:** backend/academic-service/Code.gs; esquema BorradoresAdmision.
- **Alcance:** serializar creación/actualización; definir clave única estable; agregar versión/updatedAt y comparación optimista; responder conflicto explícito en lugar de sobrescribir silenciosamente.
- **Criterios verificables:** dos altas simultáneas producen un único borrador; escrituras concurrentes no pierden cambios; versión obsoleta recibe conflicto y el usuario puede resolverlo.
- **Estado:** Pendiente.

### F5-015-A07 - Cerrar correctamente el ciclo de vida al enviar la solicitud
- **Hallazgo:** H10.
- **Severidad:** Alta (P1).
- **Objetivo y acción:** Cerrar el ciclo de vida del borrador al enviar: consumir en servidor y limpiar local solo tras confirmación.
- **Prioridad:** P1.
- **Archivos:** admision.html; backend/academic-service/Code.gs.
- **Alcance:** después de confirmar creación formal, consumir el borrador remoto y eliminar/invalidar la copia local vinculada; ante fallo de envío, conservar el borrador; impedir restauración de borradores consumidos.
- **Criterios verificables:** envío exitoso deja cero borradores activos local/remoto; envío fallido conserva la versión recuperable; una recarga posterior no reabre un borrador enviado.
- **Estado:** Pendiente.

### F5-015-A08 - Normalizar serialización y restauración de controles del formulario
- **Hallazgo:** H11.
- **Severidad:** Media (P2).
- **Objetivo y acción:** Normalizar la serialización y restauración de todos los controles del formulario sin alterar consentimientos.
- **Prioridad:** P2.
- **Archivos:** admision.html.
- **Alcance:** serializar y restaurar input, select, textarea, checkbox y radio con tratamiento específico; validar nombres de campo y estructura; restaurar valores vacíos sin alterar el consentimiento legal ni marcarlo automáticamente sin decisión explícita.
- **Criterios verificables:** pruebas de ida/vuelta conservan valores y estados esperados; el consentimiento requiere acción explícita del responsable; datos corruptos o campos desconocidos no rompen la carga.
- **Estado:** Pendiente.

### F5-015-A09 - Crear pruebas conductuales de borradores y recuperación
- **Hallazgos:** H1-H11.
- **Severidad:** Alta (P1).
- **Objetivo y acción:** Añadir pruebas automatizadas de comportamiento para los criterios funcionales, seguridad y concurrencia.
- **Prioridad:** P1.
- **Archivos:** tests/regression y suite específica de admisiones; mocks de SpreadsheetApp/LockService/CacheService; pruebas de navegador.
- **Dependencias:** F5-015-A01..A08; AUD-NG-002; AUD-NG-161.
- **Alcance:** cubrir RBAC/propiedad, recuperación local y remota, cierre abrupto, offline/reconexión, status:error, PII local, usuarios compartidos, concurrencia, conflicto de versiones, envío y restauración de controles.
- **Criterios verificables:** cada criterio de F5-015 dispone de pruebas PASS/FAIL que comprueban comportamiento real; las pruebas no usan hojas productivas; escenarios concurrentes demuestran unicidad y preservación de versiones.
- **Estado:** Pendiente.

## 6. Reconciliación con tareas y dependencias existentes

- **AUD-NG-002 (Pendientes.md):** dependencia principal y crítica para sacar save/get de PUBLIC_ACTIONS, verificar sujeto y propiedad, y sustituir correo/DNI como prueba de identidad. Se amplía con evidencia actual de Code.gs:265, 524-525 y 1433-1506. No duplicar el ID.
- **AUD-NG-161:** coordinar la cobertura conductual, pruebas de concurrencia, fallos y contratos; no duplicar su infraestructura transversal.
- **T-UX-03/T-UX-17/T-UX-10:** revisar la protección genérica de formularios y sus criterios. La función `setupUnsavedChangesProtection` existe en ui-common.js, pero admision.html no la inicializa; no crear un segundo hallazgo global de UX sin reconciliar el alcance.
- **F5-012-A07:** conservar la coordinación de estado/errores del Portal Familiar; no sustituye la recuperación local/nube del formulario público.
- **TAREA-F5-013:** el envío formal puede coordinarse con el cierre financiero de admisión, pero esta auditoría no reabre los hallazgos contables de F5-013.
- **Sin nuevos IDs globales:** las nueve tareas F5-015-A01..A09 son subtareas locales de este informe.

## 7. Pruebas ejecutadas y límites

**Ejecutadas:**
- Inspección estática de la ruta pública, autorización, handlers, dispatcher y esquema BorradoresAdmision.
- Inspección estática del formulario, listeners, temporizador, localStorage, restauración y submit.
- Revisión del contrato de fetchApi y sus reintentos genéricos.
- Búsqueda de llamadas a getAdmissionDraft y saveAdmissionDraft en HTML/JS; revisión de js/student.js.
- Revisión de ambas suites de regresión indicadas.
- Recuperación y lectura del blob completo de Pendientes.md.
- Consulta del árbol Git recursivo no truncado y del historial de la ruta del informe y del informe de fase.
- Verificación de HEAD de trabajo/base y comparación de ramas.

**No ejecutadas:** Apps Script runtime; llamadas HTTP reales; escrituras/lecturas de Sheets productivas; navegador; cierre abrupto; desconexión/reconexión; pruebas multiusuario/multidispositivo; concurrencia/LockService; revisión de ACL productiva; pruebas automatizadas o de integración. Los hallazgos son de revisión estática, no un reporte de explotación en producción.

## 8. Archivos modificados y no modificados

**Documentación modificada en esta iteración:**
- AUDITORIAS/AUDITORIA_COMPLETADAS_TAREA-F5-015.md (nuevo).
- AUDITORIAS/Auditoria.txt.
- AUDITORIAS/MapaDependencias.md.
- AUDITORIAS/AUDITORIA_COMPLETADAS_PLAN.md.
- AUDITORIAS/Contexto_personal.txt (checkpoint C1.211).

**Sin modificar:**
- backend/*; js/*; HTML; tests/*.
- completadas.md; Pendientes.md; ChangesLogs.txt; METODOLOGIA_DESARROLLO.md.
- Informes previos F5-011, F5-012, F5-013 y F5-014.
- Rama base NG_beta_0.0.0.1.

La iteración es exclusivamente de auditoría/documentación. No se implementaron las tareas derivadas ni se ejecutaron pruebas de runtime.

## 9. Continuidad

- Última tarea auditada: TAREA-F5-015.
- Dictamen: NO CUMPLE.
- Hallazgos: H1-H12.
- Tareas locales derivadas: F5-015-A01..A09, todas Pendientes.
- Dependencia crítica existente: AUD-NG-002; pruebas: AUD-NG-161.
- Siguiente tarea: TAREA-F5-016 - accesibilidad WCAG 2.2 AA y adaptación móvil de admisiones. Verificar primero su informe individual y su historial en la rama; si no existen, auditar desde cero.
