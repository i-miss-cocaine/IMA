# Auditoría de tareas completadas - T-UX-06

**Fecha:** 2026-11-05  
**Repositorio:** i-miss-cocaine/IMA  
**Rama de trabajo:** NG_beta_0.0.0.1_work  
**HEAD de partida:** a5d2d0e7c2c4df2824ab99fef12d19338b40605e  
**Árbol de partida:** 83ff08acef8248a4b935cc1bbfec2b0eff9b5aa9  
**Rama base:** NG_beta_0.0.0.1 (44d9891132332e692dbe2ba8602b41f50a508a59, sin cambios)  
**Tarea:** T-UX-06 - Omnibox Unificado Multi-Entidad con Atajo Global Ctrl + K  
**Estado en completadas.md:** [X] Completada

## Dictamen

**CUMPLE PARCIALMENTE.** La interfaz abre el omnibox mediante Ctrl+K/Cmd+K, cierra con Escape, enfoca el campo y restaura el foco al elemento que lo activó. El servidor valida el token de sesión y devuelve resultados de varias entidades. Sin embargo, la autorización por entidad es incompleta: las búsquedas de solicitudes y noticias no aplican controles de propiedad, audiencia, vigencia ni estado. Además, los resultados se interpolan sin escape en HTML y atributos inline, permitiendo XSS almacenado desde descripciones de trámites aportadas por usuarios.

Los defectos de autorización y renderizado impiden aceptar el criterio «filtrado seguro de registros» y la calidad de seguridad requerida.

## Requisitos y evidencia

### 1. Atajos y apertura rápida

**Resultado: CUMPLE en el flujo nominal.**

- `js/ui-common.js:4937-5009`: `window.openGlobalOmniboxModal` crea/reutiliza `#modal-global-omnibox`, guarda el elemento activo, registra el listener de entrada con debounce de 300 ms y enfoca/selecciona el campo.
- `js/ui-common.js:4994-5009`: `window.closeGlobalOmniboxModal` oculta el modal y restaura el foco.
- `js/ui-common.js:5072-5082`: el listener global reconoce Ctrl+K/Cmd+K y Escape.
- La apertura, el foco y el cierre están implementados estáticamente; no se ejecutaron eventos de teclado en navegador.

### 2. Búsqueda multi-entidad

**Resultado: CUMPLE PARCIALMENTE.**

- `backend/user-service/Code.gs:7992-8142`: `searchGlobalOmnibox` consulta ExpedientesEstudiantes, Usuarios, NoticiasPortal y SolicitudesTramites.
- `backend/user-service/Code.gs:841-844`: `normalizeString` aplica minúsculas, NFD y eliminación de marcas diacríticas.
- `js/ui-common.js:5011-5059`: `executeOmniboxSearch` invoca `fetchApi('USER', 'searchGlobalOmnibox', payload)` y representa los resultados.
- La cobertura multi-entidad existe, pero el alcance de acceso no se aplica de forma uniforme a todas las entidades.

### 3. Validación RBAC y aislamiento por entidad

**Resultado: NO CUMPLE completamente. Hallazgo AUD-NG-184 (ALTO/P1).**

- `backend/user-service/Code.gs:1253-1264`: `validateRolePermission` autentica el token y coloca `searchGlobalOmnibox` en una lista de acciones autorizadas para cualquier rol autenticado. La autorización específica debe completarse dentro del buscador.
- `backend/user-service/Code.gs:1146-1164`: `getUserVerifiedRole` valida el token firmado y obtiene el usuario/rol verificados. No se observó una omisión de autenticación global en la ruta normal de `doPost`.
- `backend/user-service/Code.gs:8004-8105`: expedientes y usuarios se limitan a una lista explícita de roles; se enmascara parcialmente el DNI para roles no privilegiados.
- `backend/user-service/Code.gs:8107-8129`: la búsqueda de `NoticiasPortal` se ejecuta fuera de esa condición y no comprueba Estado, FechaInicio, FechaFin, GradoAudiencia ni SeccionAudiencia.
- `backend/user-service/Code.gs:8131-8142`: la búsqueda de `SolicitudesTramites` también se ejecuta sin filtrar por UserId, EstudianteID, titular o permiso departamental. El resultado usa la descripción de la solicitud como título.
- Contraste: `getNews` en `backend/user-service/Code.gs:3116-3148` sí aplica estado activo, vigencia y audiencia por grado/sección. `getAdministrativeRequests` en `5036-5069` utiliza UserId/EstudianteID para limitar resultados cuando esos valores se suministran y fuerza el identificador verificado para estudiantes.
- El esquema de `SolicitudesTramites` se define en `backend/user-service/Code.gs:890` e incluye UserId, EstudianteID, Descripcion, AdjuntoUrl y ObservacionesAdmin. La búsqueda global no conserva el aislamiento aplicado por los flujos de consulta de solicitudes.

**Impacto:** un usuario autenticado puede obtener coincidencias y descripciones de trámites ajenos, además de títulos/contenidos de noticias retiradas, vencidas o dirigidas a otra audiencia. El enmascaramiento de DNI no corrige esta exposición de registros ni sustituye autorización contextual por entidad.

**Corrección requerida:** aplicar permisos de entidad en servidor, derivar el usuario/estudiante de claims verificados, validar relaciones de tutoría y permisos de personal, y reutilizar las reglas de vigencia/audiencia de noticias. No confiar en filtros o IDs enviados por el cliente.

### 4. Renderizado seguro de resultados

**Resultado: NO CUMPLE. Hallazgo AUD-NG-185 (ALTO/P1).**

- `js/ui-common.js:5011-5059`: `executeOmniboxSearch` concatena `item.title`, `item.category`, `item.subtitle` e `item.icon` en una cadena HTML y la asigna a `container.innerHTML`.
- En el mismo bloque, `item.type` e `item.id` se interpolan directamente en un atributo `onclick`.
- `backend/user-service/Code.gs:5134-5166`: `submitAdministrativeRequest` recibe `descripcion` desde el payload y la almacena en `SolicitudesTramites`. Después, `searchGlobalOmnibox` devuelve ese campo como `item.title`.
- No existe escape contextual en el consumidor del omnibox. Una descripción almacenada con marcado/atributos ejecutables puede interpretarse como HTML al mostrarse a otro usuario. Los IDs/tipos interpolados en el manejador inline añaden un segundo contexto de inyección.

**Impacto:** XSS almacenado en la interfaz autenticada; el contenido aportado por un usuario puede ejecutarse en el navegador de otro usuario que visualice la coincidencia.

**Corrección requerida:** construir nodos con APIs DOM y asignar datos con `textContent`; registrar eventos con `addEventListener`; validar tipos e identificadores mediante allowlists/valores estructurados; aplicar escape contextual cuando sea inevitable generar HTML. Probar títulos, descripciones, subtítulos e identificadores con cargas de prueba que contengan etiquetas, comillas y atributos de evento.

## Reconciliación con tareas posteriores

- **T-UX-14** amplía el contrato: atajos no invasivos, búsqueda únicamente en tipos autorizados, navegación directa, normalización coherente y manejo de consultas vacías/especiales. Se observaron brechas que deberán dictaminarse formalmente al auditar T-UX-14: el listener Ctrl+K no excluye campos editables; `handleOmniboxResultClick` solo abre expediente para `user/student_file` y para `news/request` muestra un toast sin navegar; el guard inicial del backend omite `filterSeccion` y, con consulta vacía y otros filtros presentes, `indexOf('')` puede hacer coincidir todos los registros de noticias/trámites. No se declara T-UX-14 completamente auditada en esta iteración.
- **T-UX-10** contiene UX-06, pero la prueba solo comprueba `typeof window.openGlobalOmniboxModal === 'function'`; no dispara el atajo, consulta el backend, verifica permisos ni recorre entidades. Su ampliación de pruebas funcionales se revisará al auditar T-UX-10.
- **T-UX-05** aporta el normalizador frontend; el omnibox usa el normalizador backend `normalizeString`. No son implementaciones sustitutas.
- No se encontró una tarea pendiente específica del omnibox que duplique los hallazgos. TASK-296 trata el renderizado/XSS del catálogo de recursos reutilizables, un componente distinto; se mantiene como referencia relacionada, no como cobertura de este sink.

## Calidad y mantenibilidad

- La separación UI/servicio y el debounce de entrada son adecuados para el flujo nominal.
- El backend recorre hojas completas y realiza búsquedas lineales; además usa `find` sobre usuarios/matrículas dentro del recorrido de expedientes. El coste puede crecer con el volumen, pero no se midió rendimiento y no se crea un hallazgo separado sin evidencia de impacto medido.
- Si `fetchApi` no está disponible, el indicador de carga queda visible porque no hay rama alternativa. Se registra como limitación de resiliencia del consumidor, sin elevarla a hallazgo independiente en esta auditoría.
- El manejador de resultados no resuelve destinos de noticias/trámites; queda vinculado a la ampliación T-UX-14.
- UX-06 no acredita comportamiento real; solo presencia de la función.

## Hallazgos y tareas

- **AUD-NG-184 / TASK-481 (ALTO/P1):** aplicar autorización contextual y aislamiento por entidad en los resultados del omnibox.
- **AUD-NG-185 / TASK-482 (ALTO/P1):** eliminar XSS almacenado e inyección de atributos en el renderizado de resultados del omnibox.
- No se modificó código fuente.
- No se modificó `completadas.md` ni se alteraron estados históricos.

## Pruebas y límites

- Inspección estática/manual de `js/ui-common.js:4937-5082`, `backend/user-service/Code.gs:841-844, 890, 1146-1164, 1253-1264, 1351-1365, 3116-3148, 5036-5069, 5134-5166, 7992-8142`.
- Revisión de las definiciones T-UX-06, T-UX-10 y T-UX-14 en `completadas.md), del plan vigente y del backlog recuperado.
- No se ejecutaron navegador, DOM real, suite automatizada, Apps Script, Google Sheets, ni llamadas productivas. No se afirma una validación runtime.
- La inspección fue focalizada en las funciones, flujos y dependencias directamente relacionados con el omnibox; no se declara auditado el resto de los archivos completos.

## SHAs de respaldo

- `js/ui-common.js`: 986938b8a311a41ed4cb3d135b66b6aaea4bed67.
- `backend/user-service/Code.gs`: 12079dd410aa6d8afbce55a4bc62a79dea605f9f.
- `completadas.md`: f57f1aef832e81e44fc4f7ec36a852d50e464676.
- `METODOLOGIA_DESARROLLO.md`: 214e8221bd076c4e89012636c105bffd5ca36467.
- `Pendientes.md` recuperado del blob del HEAD de trabajo: e050c03b97fc08916b878c34dcd5c247403d8c4b.
- `Auditoria.txt` de partida: 38d3ebf35162de5f18e6c1d862e8fb92a80a2b55.
- `MapaDependencias.md` de partida: 2179271f741e0f77a71b09e17817d4088bd27b85.
- `AUDITORIA_COMPLETADAS_PLAN.md` de partida: abc4d5b1366f0f85e8df18b64ebb69683415bb90.
- `Contexto_personal.txt` de partida: fad5942e2f1d705d5654eaae3bbd893082c946ae.

## Progreso y continuidad

- T-UX-06: **CUMPLE PARCIALMENTE**.
- Nuevos hallazgos: AUD-NG-184 y AUD-NG-185.
- Nuevas tareas: TASK-481 y TASK-482.
- Progreso acumulado: **49/183 identificadores auditados; 134 pendientes**.
- Siguiente tarea: **T-UX-09 - Menú Lateral Responsivo Específico por Rol con Colapso Móvil Suave**.

## Tareas ejecutables derivadas de los hallazgos

### [TASK-481] Aplicar autorización contextual y aislamiento por entidad en el Omnibox
- **Hallazgo de origen:** AUD-NG-184; apartado de búsqueda y autorización.
- **Severidad:** Alto.
- **Objetivo:** impedir que la búsqueda global revele entidades fuera del ámbito del usuario.
- **Acción ejecutable:** derivar identidad/rol desde contexto autenticado; aplicar autorización por tipo y entidad en servidor; limitar resultados a tipos permitidos; corregir filtros vacíos y exclusión de filtros como filterSeccion; hacer que noticias/trámites naveguen al registro autorizado; descartar respuestas asíncronas obsoletas.
- **Archivos/módulos afectados:** backend/user-service/Code.gs, js/ui-common.js y consumidores del Omnibox.
- **Dependencias y riesgos:** AUD-NG-001/002 y TASK-296 (este último cubre otro sink de renderizado, no sustituye el aislamiento del Omnibox).
- **Alcance:** autorización, filtrado, navegación y resiliencia de resultados.
- **Criterios de aceptación:** manipular IDs/filtros no amplía resultados; consulta vacía no equivale a coincidencia universal; cada tipo devuelve solo entidades autorizadas; cada resultado navega al registro correcto; respuesta antigua no reemplaza consulta nueva.
- **Prioridad:** P1.
- **Estado:** Pendiente.
- **Evidencia de cierre:** pruebas por rol/entidad, filtros vacíos, concurrencia de consultas y navegación.

### [TASK-482] Eliminar XSS e inyección de atributos en resultados del Omnibox
- **Hallazgo de origen:** AUD-NG-185; apartado de renderizado seguro.
- **Severidad:** Alto.
- **Objetivo:** evitar que datos persistidos o mensajes externos se interpreten como HTML/atributos ejecutables.
- **Acción ejecutable:** reemplazar concatenación insegura por textContent/DOM APIs o escape contextual; validar URLs por esquema y destino permitido; no interpolar datos en handlers inline; aplicar la misma política a resultados y mensajes de error.
- **Archivos/módulos afectados:** js/ui-common.js y renderizadores de resultados del Omnibox.
- **Dependencias y riesgos:** mantener separación respecto de TASK-296, cuyo alcance es otro componente.
- **Alcance:** sink de renderizado del Omnibox.
- **Criterios de aceptación:** payloads HTML/script/atributos se muestran como texto; URLs javascript:/data: y destinos no permitidos se rechazan; pruebas de seguridad cubren todos los campos dinámicos; no quedan handlers inline con datos no confiables.
- **Prioridad:** P1.
- **Estado:** Pendiente.
- **Evidencia de cierre:** pruebas XSS/URL con payloads sintéticos y revisión de sinks.
