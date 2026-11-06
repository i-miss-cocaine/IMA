# Auditoría de tareas completadas - T-UX-14

**Fecha:** 2026-11-05  
**Repositorio:** i-miss-cocaine/IMA  
**Rama de trabajo:** NG_beta_0.0.0.1_work  
**HEAD de partida verificado:** cf28bbfe02211df88579ce42dd989f0dcf8796fa  
**Rama base:** NG_beta_0.0.0.1 (44d9891132332e692dbe2ba8602b41f50a508a59; sin cambios)  
**Tarea:** T-UX-14 - Completar la búsqueda global y optimizar sus resultados  
**Estado histórico en completadas.md:** [X] Completada

## Dictamen

**NO CUMPLE.** El normalizador del backend convierte a minúsculas y elimina diacríticos, y el modal aplica debounce y foco al abrir. Sin embargo, la búsqueda no respeta el ámbito de acceso por entidad para expedientes/usuarios, noticias y trámites; el flujo de filtros permite resultados incompletos o colecciones no filtradas ante consultas vacías; el atajo global interrumpe la escritura en campos editables; los resultados de noticias y trámites no navegan a sus registros; el límite global puede excluir entidades por el volumen de expedientes; y el consumidor no controla respuestas asíncronas obsoletas ni la ausencia de fetchApi.

Los hallazgos históricos AUD-NG-184/TASK-481 y AUD-NG-185/TASK-482 continúan vigentes. Se amplía TASK-481 con la evidencia nueva de autorización y filtros, se mantiene TASK-482 como la tarea responsable del XSS y se crea TASK-491 para los defectos funcionales de navegación y resiliencia del consumidor.

## Criterios y evidencia

### 1. Atajos, apertura y foco

**Resultado: CUMPLE PARCIALMENTE.**

- `js/ui-common.js`, SHA `986938b8a311a41ed4cb3d135b66b6aaea4bed67`, líneas 4937-5009: `openGlobalOmniboxModal` crea/reutiliza el modal, registra el listener de entrada con debounce de 300 ms y enfoca/selecciona el campo mediante un timeout de 100 ms.
- Líneas 5072-5082: el listener global abre el Omnibox con Ctrl+K/Cmd+K y lo cierra con Escape.
- El listener no comprueba el elemento activo ni excluye input, textarea, select o contenteditable. Llama a preventDefault y abre el modal incluso cuando el usuario está escribiendo en un control editable.
- No se verificó comportamiento runtime de teclado, IME o navegador; la conclusión deriva del flujo estático.

**AUD-NG-198 (MEDIO/P2):** el atajo global intercepta contextos editables y puede interrumpir la escritura. Se registra en TASK-491.

### 2. Autorización contextual y aislamiento de entidades

**Resultado: NO CUMPLE.**

- `backend/user-service/Code.gs`, SHA `12079dd410aa6d8afbce55a4bc62a79dea605f9f`, líneas 1253-1264: `validateRolePermission` permite `searchGlobalOmnibox` a cualquier rol con sesión válida, delegando toda la restricción al buscador.
- Líneas 7992-8069: expedientes y usuarios se consultan para una lista de roles institucionales. La búsqueda recorre expedientes y usuarios de forma global; para los roles no privilegiados solo enmascara parcialmente el DNI, sin comprobar sección/grado asignado, departamento o relación funcional con cada registro.
- Líneas 8107-8129: noticias se buscan sin reutilizar los filtros de estado, vigencia y audiencia presentes en `getNews` (líneas 3116-3148).
- Líneas 8131-8142: trámites se buscan sin filtrar por titular, estudiante vinculado o permiso departamental, pese a que `getAdministrativeRequests` sí aplica filtros de titularidad cuando se invoca con el contexto correspondiente (líneas 5036-5069).
- `getUserVerifiedRole` (líneas 1146-1164) valida la sesión/rol, pero la función de búsqueda no transforma esa identidad en un ámbito de registros para cada entidad.

**AUD-NG-195 (ALTO/P1):** la allowlist de roles para expedientes/usuarios no constituye autorización por registro; roles docentes y administrativos pueden recibir coincidencias de todo el conjunto institucional. Se amplía TASK-481, sin crear una tarea duplicada.

### 3. Consultas vacías, filtros y normalización

**Resultado: NO CUMPLE PARCIALMENTE.**

- `normalizeString`, líneas 841-844, aplica `toLowerCase()`, normalización Unicode NFD, eliminación de marcas diacríticas y `trim()`. La insensibilidad básica a mayúsculas y tildes está implementada.
- En `searchGlobalOmnibox`, líneas 7992-8010, la condición de consulta mínima solo considera `filterGrado`, `filterAnoLectivo` y `filterEstado`; omite `filterSeccion`. Una consulta corta con solo filtro de sección termina prematuramente con resultados vacíos.
- En la búsqueda de noticias y trámites, líneas 8107-8142, la comparación usa `indexOf(normQuery)`. Si la consulta está vacía y otro filtro habilita el flujo, la cadena vacía coincide con cualquier título/contenido/ID/tipo; esos bloques tampoco aplican los filtros académicos que se usan en expedientes ni controles propios de la entidad.
- La interfaz normal no llama al backend con menos de dos caracteres, pero el endpoint es invocable directamente y también recibe filtros. La validación del cliente no sustituye la validación del servidor.
- La suite UX-05 de T-UX-10 solo prueba una cadena fija. TASK-484 ya cubre la batería de casos de normalización y consultas límite.

**AUD-NG-196 (MEDIO/P2):** detección incompleta de filtros y coincidencia universal de cadena vacía en noticias/trámites. Se amplía TASK-481 por su relación directa con el control de alcance y filtros.

### 4. Identificación y navegación al registro

**Resultado: NO CUMPLE.**

- `js/ui-common.js`, líneas 5011-5059: `executeOmniboxSearch` representa resultados y conserva campos de tipo/categoría/contexto.
- Líneas 5062-5070: `handleOmniboxResultClick` abre `openStudentFileModal` únicamente para `user` y `student_file`. Para `news` y `request` cierra el modal y muestra un toast informativo; no abre el registro, no navega a una ruta ni transmite el contexto de destino.
- Tratar cualquier resultado `user` como expediente estudiantil tampoco demuestra que el destino sea correcto para usuarios de personal u otras clases de cuenta.

**AUD-NG-197 (ALTO/P1):** noticias y trámites no disponen de navegación directa al registro; el mensaje toast simula una acción que no ocurre. Se registra en TASK-491.

### 5. Priorización y límite multi-entidad

**Resultado: NO CUMPLE EN CALIDAD.**

- Líneas 8030-8069: los expedientes se agregan sin límite por entidad y se ordenan por coincidencia exacta antes de agregar usuarios.
- Usuarios se agregan después; noticias y trámites se agregan en bloques posteriores.
- El resultado final se limita con `results.slice(0, 20)` (línea 8144). Si los expedientes ya superan veinte coincidencias, usuarios, noticias y trámites quedan completamente excluidos, independientemente de su relevancia.
- Los límites parciales de usuarios/noticias/trámites no garantizan distribución equilibrada ni orden global por relevancia.

**AUD-NG-199 (MEDIO/P2):** el límite global permite que una entidad monopolice los resultados y oculte coincidencias de otras. Se registra en TASK-491.

### 6. Concurrencia y manejo de errores

**Resultado: NO CUMPLE EN RESILIENCIA.**

- Líneas 4959-4982: el debounce reduce frecuencia de entrada, pero no cancela solicitudes previas ni identifica cuál corresponde a la consulta más reciente.
- Líneas 5011-5059: cada promesa puede actualizar el mismo contenedor cuando termina; una respuesta lenta de una consulta anterior puede sobrescribir resultados más recientes.
- Si `fetchApi` no existe, la condición no tiene rama alternativa y el contenedor conserva el mensaje “Buscando resultados...”.
- `js/api.js`, SHA `6b24f666db30a811a8e9b38d466fc6001cf6dfa9`, líneas 601 en adelante, define `fetchApi` y devuelve promesas; esto no elimina la necesidad de que el consumidor maneje explícitamente el caso en que el helper no esté disponible o no pueda invocarse.

**AUD-NG-200 (MEDIO/P2):** no se evita que respuestas fuera de orden reemplacen resultados vigentes y no existe recuperación visible si falta `fetchApi`. Se registra en TASK-491.

### 7. Renderizado seguro

**Resultado: NO CUMPLE; hallazgo preexistente.**

- Líneas 5020-5048: los campos `title`, `category`, `subtitle`, `icon`, `type` e `id` se interpolan en HTML y un atributo `onclick`; el mensaje sin resultados refleja `query` en `innerHTML`.
- Esto mantiene vigente AUD-NG-185/TASK-482. No se crea una segunda tarea para el mismo sink; TASK-482 ya exige APIs DOM, `textContent`, listeners y tratamiento seguro de la consulta reflejada.

## Reconciliación histórica

- **T-UX-06:** su auditoría ya detectó autorización insuficiente de noticias/trámites y XSS. Se conservan AUD-NG-184/TASK-481 y AUD-NG-185/TASK-482.
- **T-UX-10:** UX-06 solo comprueba `typeof window.openGlobalOmniboxModal`; no dispara el atajo, no consulta el backend, no comprueba permisos, no recorre tipos ni valida navegación. AUD-NG-187/TASK-484 cubre la validez de la suite y no sustituye los defectos de producto.
- **TASK-481:** ampliada con AUD-NG-195 y AUD-NG-196 para cubrir el alcance de expedientes/usuarios y la semántica de filtros/consulta vacía.
- **TASK-482:** permanece pendiente y conserva todo el alcance de XSS del resultado y de la consulta reflejada.
- **TASK-491:** nueva tarea para atajos contextuales, navegación real, distribución de resultados, respuestas asíncronas y estados de error. No duplica la autorización de TASK-481, el XSS de TASK-482 ni el framework de pruebas de TASK-484.
- La especificación de la auditoría fuente `AUDITORIA_FASE3_EXPERIENCIA_USUARIO_NAVEGACION.md` no existe en el árbol actual; se utilizó el texto de `completadas.md` y la evidencia histórica de C1.48/C1.53.

## Calidad y límites

- Debounce y normalización básica existen, pero no resuelven autorización, navegación, orden global ni concurrencia.
- El backend lee rangos completos de Sheets y utiliza `find` sobre usuarios/matrículas dentro del recorrido de expedientes. No se midió latencia ni volumen productivo; no se emite un hallazgo separado de rendimiento sin medición.
- No se modificó código fuente ni se alteraron estados históricos de `completadas.md`.
- Inspección estática/manual. No se ejecutaron navegador, DOM real, teclado, IME, Apps Script, Google Sheets, llamadas productivas ni suites automatizadas.

## Archivos y SHAs de respaldo

- `js/ui-common.js`: `986938b8a311a41ed4cb3d135b66b6aaea4bed67`.
- `backend/user-service/Code.gs`: `12079dd410aa6d8afbce55a4bc62a79dea605f9f`.
- `js/api.js`: `6b24f666db30a811a8e9b38d466fc6001cf6dfa9`.
- `completadas.md`: `f57f1aef832e81e44fc4f7ec36a852d50e464676`.
- `METODOLOGIA_DESARROLLO.md`: `214e8221bd076c4e89012636c105bffd5ca36467`.
- `Pendientes.md` blob previo: `cf9bacd54ac4e90e2d9289f41d1db61bac6090b4`.
- `Pendientes.md` blob posterior: `4039a6dc496848c5cf6b112bc41b681d80488bb7`.
- HEAD de partida: `cf28bbfe02211df88579ce42dd989f0dcf8796fa`.
- Rama base: `44d9891132332e692dbe2ba8602b41f50a508a59`.
