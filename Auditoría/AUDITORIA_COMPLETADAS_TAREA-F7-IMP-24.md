# AUDITORÍA FUNCIONAL Y TÉCNICA — TAREA-F7-IMP-24
## Preferencias de calendario y personalización de vistas

- **Fecha:** 2026-11-08.
- **Sesión operativa:** IMA-AUDIT-20261108-1955Z-02 (identificador documental, no ID nativo de ChatGPT).
- **Checkpoint inicial de esta iteración:** C1.258. C1.254 permanece como referencia histórica válida de continuidad; la reconciliación C1.258 es el punto de reanudación actual.
- **Repositorio:** i-miss-cocaine/IMA.
- **Rama auditada:** NG_beta_0.0.0.1_work.
- **HEAD de partida verificado:** 32d9cb544ef20e54fbb781fcc617186bceee20c2.
- **Tree SHA de partida:** 47ca8fdc74e114d9a1772f653ead443379ee0bf6.
- **Rama base protegida:** NG_beta_0.0.0.1, HEAD 44d9891132332e692dbe2ba8602b41f50a508a59; comparación: 327 commits adelante, 0 detrás.
- **Estado en completadas.md:** [X] histórico; no equivale a certificación funcional.
- **Prioridad declarada:** P3.
- **Dictamen:** **NO CUMPLE**.
- **Fuente primaria:** completadas.md, TAREA-F7-IMP-24, líneas 4692-4715, SHA f57f1aef832e81e44fc4f7ec36a852d50e464676.
- **Informe individual esperado:** AUDITORIAS/AUDITORIA_COMPLETADAS_TAREA-F7-IMP-24.md, no localizado.
- **Fuente de Fase 7 declarada:** AUDITORIA_FASE_7_PLANIFICACION_HORARIOS_RECURSOS.md, no localizada. Se auditó directamente el bloque completo de completadas.md; no se omitió la tarea.

---

## 1. Alcance y criterios de aceptación

La tarea exige filtros por tipo, período, asignatura, sección y estado; alternancia de categorías según autorización; distinción de clases, evaluaciones, actividades institucionales y cancelaciones; detalle de cada evento; navegación por día, semana y período; filtros coherentes con rol/ámbito; vista móvil; protección de información crítica frente a preferencias visuales; restablecimiento de preferencias; y actualización tras cambios de origen.

| Criterio | Resultado | Evidencia |
|---|---|---|
| CA-F7-143 | PARCIAL | Los handlers alternan la clase hidden de nodos data-category sin escribir datos académicos, pero no hay vista ni controles conectados. |
| CA-F7-144 | NO CUMPLE | La visibilidad se acepta desde payload y el calendario unificado devuelve eventos sin filtrar; ampliar AUD-NG-252. |
| CA-F7-145 | NO CUMPLE | No hay indicador protegido de cancelaciones/cambios; el toggle genérico puede ocultar cualquier categoría. |
| CA-F7-146 | NO CUMPLE | Las claves localStorage son globales por portal/origen, no por usuario autenticado. |
| CA-F7-147 | NO CUMPLE | No existe carga/refresh frontend ni reaplicación de preferencias tras una actualización. |

## 2. Procedimiento e integridad documental

Se verificaron repositorio, rama, HEAD, árbol, checkpoint C1.258 y rama base; se consultaron completadas.md, Pendientes.md, ChangesLogs.txt, el informe individual esperado y la fuente de Fase 7; se inspeccionaron manualmente las vistas completas, handlers, consumidores JS, API, permisos, endpoints y pruebas; y se reconciliaron los antecedentes sin duplicar causas raíz.

### Integridad documental

- **completadas.md:** SHA f57f1aef832e81e44fc4f7ec36a852d50e464676; TAREA-F7-IMP-24 marcada [X] en líneas 4692-4715.
- **Informe individual IMP-24:** NOT_FOUND.
- **Fuente de Fase 7:** AUDITORIA_FASE_7_PLANIFICACION_HORARIOS_RECURSOS.md, NOT_FOUND.
- **Pendientes.md:** lectura convencional 0 caracteres; blob SHA 631b4c2dbf0e86d5704b63625382d73ccb8ceb3c recuperado directamente. Contenido: 1.782.094 caracteres, 20.182 líneas, 0 caracteres U+FFFD, 511 IDs TASK únicos TASK-001..TASK-511. No contiene TAREA-F7-IMP-24 ni TASK-630..TASK-632. El blob íntegro ya está asociado a la ruta de la rama; no requiere restauración ni transferencia. No se modificó.
- **ChangesLogs.txt:** el registro TAREA-F7-IMP-24 (2025-05-24) afirma que ambos dashboards incorporaron leyendas cromáticas, interruptores de categorías y botones de restablecimiento. Los HTML vigentes no contienen esos controles ni un calendario.
- **Antecedentes:** AUD-NG-252/TASK-611 (visibilidad/ámbito), AUD-NG-236/TASK-554 (esquema), AUD-NG-001/TASK-567 (autenticación), AUD-NG-253/TASK-610 (ciclo de vida), AUD-NG-243/TASK-561 (excepciones) y AUD-NG-161/TASK-612 (pruebas). Se amplían, no se duplican.

## 3. Evidencia técnica

### 3.1 Vistas y consumidores — AUD-NG-274

- **teacher-dashboard.html** (1-1475, SHA cbb9e6a272a7d8ad33f99727303305d950533e71): no contiene .cal-cat-checkbox, data-category, leyenda, controles, botón de reset, contenedor de calendario, navegación ni detalle. Sus dos coincidencias textuales de calendar son iconos en tarjetas administrativas.
- **student-dashboard.html** (1-412, SHA 6379ea0ed39d71b89747a0280bb925fdf12202c1): no contiene referencias a calendar ni controles/contendedores de calendario.
- **js/teacher.js** (1221-1250, SHA c475fce5afcd28fca23e7b64398ad32b17773746): filterCalendarEventsByCategory lee/escribe calendar_view_prefs y alterna hidden en [data-category="..."]; resetCalendarViewPreferences elimina la clave y busca .cal-cat-checkbox. No existen nodos HTML que permitan invocar estos handlers.
- **js/student.js** (844-875, SHA e2888cea60322e49a40b89adadb8010489605dcc): filterStudentCalendarByCategory y resetStudentCalendarPreferences hacen lo mismo con student_cal_view_prefs y .student-cal-cat-checkbox; student-dashboard.html carece de esos nodos.
- La revisión de los módulos JS no encontró llamadas cliente a getAcademicCalendar/getUnifiedInstitutionalCalendar ni un renderizador de calendario. js/ui-common.js contiene texto de configuración de rol, no una vista.
- No existe ruta visible para consultar detalles, navegar día/semana/período o actualizar tras cambios confirmados. No hay calendario cuya adaptación móvil pueda comprobarse.

### 3.2 Preferencias — AUD-NG-275

- Las claves calendar_view_prefs y student_cal_view_prefs no incorporan currentUser.userId, tenant, cuenta ni perfil autenticado. Las cuentas que usan el mismo navegador/origen comparten el estado de su portal.
- Los handlers leen el objeto guardado solo cuando se acciona una categoría; no hay inicialización que recorra preferencias y las aplique al cargar ni mecanismo que las reaplique tras reconstruir eventos.
- Los reset handlers existen en JS, pero no hay checkboxes ni botones correspondientes en HTML. La persistencia es por navegador, no por usuario.

### 3.3 Categorías críticas — AUD-NG-276

- Ambos handlers aceptan cualquier categoria y alternan hidden en todos los nodos que coincidan con data-category. No existe lista permitida ni excepción para cancelaciones, cambios importantes o alertas.
- No se encontró categoría explícita y protegida para cancelaciones ni indicador que permanezca visible cuando se oculta otra categoría.
- El toggle genérico no implementa el requisito de impedir que las preferencias oculten permanentemente información crítica.

### 3.4 Contratos, visibilidad y filtros — ampliación de hallazgos existentes

- **getAcademicCalendar** (Code.gs 6616-6644): acepta anoId y visibilidadRol desde payload. Solo filtra por año y por la visibilidad enviada por el cliente. Si visibilidadRol se omite, no aplica filtro; si se envía Administrador o Director, permite todos los eventos. No deriva el rol de _verifiedRole ni comprueba gruposAfectados, asignatura, sección, período, estado o intervalo de fechas.
- **getUnifiedInstitutionalCalendar** (Code.gs 5008-5065), enrutado en doPost (839): devuelve registros de CalendarioAcademico, ActividadesInstitucionales y ActividadesExtracurriculares sin filtrar visibilidad por rol/usuario. validateRolePermission (545-550) lo autoriza para cualquier rol con sesión válida, sin matriz contextual ordinaria.
- El lector getUnifiedInstitutionalCalendar usa índices heredados: r[3] como título, r[4] como tipo, r[5]/r[6] como fechas y r[7] como visibilidad. El writer createCalendarEvent y getAcademicCalendar usan el contrato de 13 columnas con nombre en r[2], tipo en r[3], fechas en r[4]/r[5], visibilidad en r[6] y estado en r[7]. La lectura unificada desplaza campos; ya está registrado en AUD-NG-236.
- getUnifiedInstitutionalCalendar asigna la fecha actual a cada actividad extracurricular en lugar de proyectar la fecha fuente. Tampoco integra en un único DTO las clases y evaluaciones requeridas.
- **getIndividualCalendar** (Code.gs 7925-7983) recibe fechaInicio y fechaFin, pero no los aplica al conjunto devuelto; compone horarios, sustituciones, eventos y sesiones sin proyección temporal completa.
- **js/api.js** (11-60, SHA 6b24f666db30a811a8e9b38d466fc6001cf6dfa9) no transmite sessionToken/authToken/token. validateRolePermission exige credenciales para endpoints privados. AUD-NG-001/TASK-567 ya registran esta causa.

### 3.5 Actualización y pruebas

- No hay consumidor frontend de los endpoints de calendario; no existe refresh tras alta/cambio/cancelación. El ciclo de vida incompleto ya se registra en AUD-NG-253/TASK-610.
- runAcademicPlanningRegressionSuite (Code.gs 14109-14165) contiene TC-F7-01..07 para conflictos, carga docente, restricciones, capacidad, sustituciones, plantillas y logs; no prueba filtros ni CA-F7-143..147.
- tests/regression/academic-grading-suite.js (412 líneas, SHA a22cb3ef376fe09e65c1b17c2f4f5125290bfba6) no aporta pruebas conductuales de preferencias, aislamiento de usuario, cancelaciones o actualización de calendario.

## 4. Requisitos funcionales

| Requisito | Dictamen | Evidencia |
|---|---|---|
| 1. Filtrar por tipo, período, asignatura, sección y estado | NO CUMPLE | Solo hay toggles de categoría; endpoint limitado a año/visibilidad y no hay UI. |
| 2. Mostrar/ocultar categorías cuando esté autorizado | PARCIAL | Existe toggle JS, pero faltan controles, nodos y autorización vinculada a sesión. |
| 3. Diferenciar clases, evaluaciones, actividades institucionales y cancelaciones | NO CUMPLE | No hay renderizador unificado ni categorías/estados protegidos. |
| 4. Consultar detalles de cada evento | NO CUMPLE | No hay tarjetas, modal ni controlador de detalle. |
| 5. Navegar entre días, semanas y períodos | NO CUMPLE | No hay controles ni estado de navegación. |
| 6. Compatibilidad con rol y ámbito | NO CUMPLE | Visibilidad controlada por cliente y endpoint unificado sin filtro; ampliar AUD-NG-252. |
| 7. Vista móvil | NO CUMPLE | No existe calendario que pueda adaptarse a móvil. |
| 8. No ocultar información crítica | NO CUMPLE | Toggle genérico permite ocultar cualquier categoría; no hay excepción para cancelaciones/cambios. |
| 9. Restablecer preferencias | PARCIAL | Funciones reset existen, pero faltan checkboxes y botones. |
| 10. Actualizar tras cambios de origen | NO CUMPLE | No hay consumidor/refresh; ampliar AUD-NG-253. |

**Dictamen global: NO CUMPLE.** Se conserva [X] histórica en completadas.md.

## 5. Hallazgos nuevos

### AUD-NG-274 — ALTO/P1: ausencia de calendario integrado y flujo de visualización
Los dashboards no contienen calendario, leyenda, filtros, controles, detalles ni navegación. Los handlers están huérfanos y no existe carga de datos desde getAcademicCalendar/getUnifiedInstitutionalCalendar. La tarea solo está representada por funciones aisladas, no por una funcionalidad operativa. Afecta requisitos 1-7 y 10; CA-F7-143 parcial y CA-F7-147 no cumple.

### AUD-NG-275 — MEDIO/P2: preferencias no aisladas por usuario ni restauradas
Las claves localStorage son globales por portal/origen, no están vinculadas a la cuenta autenticada. Dos usuarios del mismo portal/navegador comparten preferencias. No se reaplican al inicializar ni tras reconstruir datos; los controles de reset no existen. Afecta requisito 9 y CA-F7-146/147.

### AUD-NG-276 — ALTO/P1: filtros visuales pueden ocultar información crítica
Los toggles ocultan sin excepción cualquier categoría que coincida con data-category. No hay categoría protegida de cancelaciones/cambios importantes ni indicador persistente. Afecta requisito 8 y CA-F7-145.

## 6. Hallazgos existentes ampliados, sin duplicación

- **AUD-NG-252 / TASK-611:** ampliar autorización a getAcademicCalendar y getUnifiedInstitutionalCalendar. Derivar visibilidad/ámbito de claims verificados; no confiar en visibilidadRol del payload; filtrar participantes/grupos en servidor.
- **AUD-NG-236 / TASK-554:** corregir contrato de CalendarioAcademico y mapeo del lector unificado; normalizar categorías, fechas y estados.
- **AUD-NG-001 / TASK-567:** resolver transmisión del token de sesión en fetchApi para consultas privadas.
- **AUD-NG-243 / TASK-561 y AUD-NG-253 / TASK-610:** conectar excepciones, cancelaciones y cambios al calendario; aplicar filtros temporales y refrescar después de cambios confirmados.
- **AUD-NG-246 / TASK-562:** extender consulta con período, asignatura, sección, estado y alcance autorizado; actualizar la proyección cuando cambien datos.
- **AUD-NG-161 / TASK-612:** ampliar regresión a CA-F7-143..147.

## 7. Tareas ejecutables derivadas de los hallazgos

### Nuevas

#### TASK-630 — Integrar calendario académico y filtros en los portales docente y estudiante
- **Hallazgo:** AUD-NG-274.
- **Severidad/Prioridad:** ALTO/P1.
- **Objetivo:** convertir los handlers aislados en calendario funcional con datos autorizados en ambos portales.
- **Acción:** crear contenedores, controles, leyendas y navegación; conectar servicio autenticado; normalizar DTO de clases, evaluaciones, eventos institucionales y cancelaciones; filtros por tipo/período/asignatura/sección/estado; detalle; navegación día/semana/período; refresh y adaptación móvil.
- **Archivos:** teacher-dashboard.html, student-dashboard.html, js/teacher.js, js/student.js, js/api.js, backend/academic-service/Code.gs y pruebas.
- **Dependencias:** AUD-NG-236/252/001/243/253; TASK-554/562/567/610/611.
- **Criterios:** ambos portales muestran calendario real; filtros no escriben datos; categorías/detalles correctos; fechas filtran el conjunto; respuestas respetan rol/matrícula/asignación; vista móvil usable; cambios confirmados actualizan la vista.
- **Estado:** Pendiente.

#### TASK-631 — Aislar preferencias por usuario y proteger eventos críticos
- **Hallazgos:** AUD-NG-275 y AUD-NG-276.
- **Severidad/Prioridad:** MEDIO/P2 y ALTO/P1.
- **Objetivo:** mantener preferencias personales sin contaminación entre cuentas ni ocultación de alertas esenciales.
- **Acción:** asociar preferencias a identidad autenticada; restaurarlas al cargar y tras cada render; exponer reset; definir categorías permitidas; mantener cancelaciones y cambios críticos identificables.
- **Archivos:** teacher-dashboard.html, student-dashboard.html, js/teacher.js, js/student.js y módulo de preferencias si se separa.
- **Dependencias:** TASK-630, AUD-NG-252 y AUD-NG-161.
- **Criterios:** dos cuentas en el mismo navegador conservan estados independientes; preferencias sobreviven a recarga/refresh; reset restaura valores iniciales; eventos críticos permanecen visibles/identificables; ningún toggle modifica registros académicos.
- **Estado:** Pendiente.

#### TASK-632 — Añadir regresión conductual para CA-F7-143..147
- **Hallazgos:** AUD-NG-274..276; amplía AUD-NG-161.
- **Severidad/Prioridad:** ALTO/P1.
- **Objetivo:** demostrar filtros, permisos, preferencias, protección de cancelaciones y frescura mediante pruebas reproducibles.
- **Acción:** probar filtros sin escrituras; categorías autorizadas; visibilidad falsificada/omitida; aislamiento de cuentas; persistencia/reset; protección de cancelaciones/cambios; refresh; navegación temporal y vista móvil.
- **Archivos:** tests/regression/academic-grading-suite.js, backend/academic-service/Code.gs, js/teacher.js, js/student.js y dashboards.
- **Dependencias:** TASK-630/631; TASK-554/562/567/611/612.
- **Criterios:** casos positivos/negativos trazados a CA-F7-143..147; pruebas de permisos sin datos productivos; cada prueba detecta regresión deliberada; resultados reproducibles.
- **Estado:** Pendiente.

### Tareas existentes ampliadas

- **TASK-611:** autorización contextual también para lecturas; rol/usuario desde claims.
- **TASK-554:** contrato CalendarioAcademico y DTO consumido por el calendario unificado.
- **TASK-562:** filtros de período, asignatura, sección, estado y fecha; refresh tras cambios.
- **TASK-567:** token en llamadas privadas del calendario.
- **TASK-610:** propagar cambios/cancelaciones a la vista mediante ciclo de vida.
- **TASK-612:** ampliar regresión a CA-F7-143..147, coordinada con TASK-632.

**Control de duplicidad:** no crear otro sistema de autorización de eventos (AUD-NG-252/TASK-611), contrato de calendario (AUD-NG-236/TASK-554), autenticación (AUD-NG-001/TASK-567), ciclo de vida (AUD-NG-253/TASK-610) ni motor de excepciones (AUD-NG-243/TASK-561).

## 8. Pruebas y límites

- **Ejecutadas:** inspección manual de vistas completas, handlers, referencias JS, contratos, permisos, suite, registro histórico, informe IMP-17, mapa, plan, metodología, contexto, ramas y blob Pendientes.md.
- **No ejecutadas:** navegador/DOM, filtros reales, persistencia entre cuentas reales, Apps Script runtime, HTTP/OAuth, Google Sheets productivas, RBAC real, vista móvil en dispositivos, Node ni E2E.
- No se afirma que se haya observado una respuesta HTTP ni una exposición real de datos; los riesgos se sustentan en el contrato y flujo estático.
- No se modificó código, UI, pruebas, datos productivos, completadas.md, Pendientes.md, ChangesLogs.txt ni METODOLOGIA_DESARROLLO.md.

## 9. SHAs y archivos

- teacher-dashboard.html cbb9e6a272a7d8ad33f99727303305d950533e71 (1475 líneas).
- student-dashboard.html 6379ea0ed39d71b89747a0280bb925fdf12202c1 (412 líneas).
- js/teacher.js c475fce5afcd28fca23e7b64398ad32b17773746 (8360 líneas).
- js/student.js e2888cea60322e49a40b89adadb8010489605dcc (3195 líneas).
- backend/academic-service/Code.gs df87a2eea9f0ef79d0b966d03fd5bbe432003df5 (14449 líneas).
- js/api.js 6b24f666db30a811a8e9b38d466fc6001cf6dfa9 (353 líneas).
- tests/regression/academic-grading-suite.js a22cb3ef376fe09e65c1b17c2f4f5125290bfba6 (412 líneas).
- completadas.md f57f1aef832e81e44fc4f7ec36a852d50e464676; ChangesLogs.txt 5b5cff1926b73a05d1b92087a7bf4b2db75326ff; Pendientes.md blob 631b4c2dbf0e86d5704b63625382d73ccb8ceb3c; METODOLOGIA_DESARROLLO.md cf796728bb384a32537392df2f9c72a339fa03ee.
- Informe previo IMP-17 a52280369ca922ba0ce321f040403ff4a25c3edf.
- No se encontró informe individual IMP-24 ni fuente AUDITORIA_FASE_7_PLANIFICACION_HORARIOS_RECURSOS.md.

## 10. Cierre

- **TAREA-F7-IMP-24:** NO CUMPLE; se conserva [X] histórica en completadas.md.
- **Hallazgos nuevos:** AUD-NG-274 (calendario/UI ausentes), AUD-NG-275 (preferencias compartidas/no rehidratadas), AUD-NG-276 (categorías críticas ocultables).
- **Hallazgos ampliados:** AUD-NG-252, AUD-NG-236, AUD-NG-001, AUD-NG-243, AUD-NG-253 y AUD-NG-161.
- **Tareas nuevas:** TASK-630, TASK-631 y TASK-632.
- **Tareas existentes ampliadas:** TASK-554, TASK-561, TASK-562, TASK-567, TASK-610, TASK-611 y TASK-612.
- **Archivo nuevo:** AUDITORIAS/AUDITORIA_COMPLETADAS_TAREA-F7-IMP-24.md.
- **Archivos de auditoría actualizados:** AUDITORIAS/Auditoria.txt; AUDITORIAS/MapaDependencias.md; AUDITORIAS/AUDITORIA_COMPLETADAS_PLAN.md; AUDITORIAS/Contexto_personal.txt.
- **Archivos sin cambios:** código/UI/tests; completadas.md; Pendientes.md; ChangesLogs.txt; METODOLOGIA_DESARROLLO.md; rama base.
- **Siguiente tarea exacta:** TAREA-F7-IMP-25, batería automatizada de regresión, integración y calidad de planificación.
