# Plan de auditoría de completadas_legacy.md

**Fecha de inicio:** 2026-11-04  
**Repositorio:** i-miss-cocaine/IMA  
**Rama base:** `NG_beta`  
**Rama de trabajo autorizada por instrucción expresa posterior del usuario:** `NG_beta_work`  
**Registro auditado:** `completadas_legacy.md` (blob SHA `c9622ea9e03ec16dcecb12ae97b17b89ed204157`)  
**Metodología:** `METODOLOGIA_DESARROLLO.md` (blob SHA `1a2d4de602a1449b697c2da82ab6423e7c61b280`)

## 1. Alcance

Auditar las 49 entradas históricas que el registro marca como completadas. La marca histórica no se acepta como evidencia de implementación. Cada requisito se contrasta con el código vigente de `NG_beta`, su arquitectura actual, los cambios posteriores que lo hayan reemplazado y la calidad de la implementación que permanece activa.

Inventario declarado por el registro:
- 18 correcciones, estabilizaciones y revisiones históricas.
- 19 requerimientos de expansión.
- 12 requerimientos de gestión docente, contenidos, guías y tareas.
- **Total: 49 tareas.**

## 2. Criterios de evaluación por tarea

1. **Trazabilidad:** identificar requisito original, archivos afectados y commits posteriores relacionados.
2. **Cumplimiento funcional:** contrastar cada criterio verificable con el comportamiento que implementa el código actual.
3. **Vigencia histórica:** distinguir implementación vigente, reemplazo posterior, migración parcial, regresión o funcionalidad retirada justificadamente.
4. **Calidad:** revisar validaciones, casos límite, seguridad, permisos del servidor, persistencia, concurrencia, idempotencia, manejo de errores, acoplamiento, duplicación y mantenibilidad cuando sean pertinentes.
5. **Evidencia:** anotar rutas y rangos de líneas, referencias de commits y pruebas existentes. La existencia de pruebas o etiquetas no se considera por sí sola prueba suficiente.
6. **Estado de auditoría:** `Cumple`, `Cumple parcialmente`, `No cumple`, `Reemplazada por implementación posterior`, `Regresión detectada` o `No verificable con la evidencia disponible`.

No se modificará código fuente durante esta auditoría. No se cambiarán las marcas históricas de `completadas_legacy.md`.

## 3. Orden de trabajo y lotes

| Lote | Tareas | Enfoque |
|---|---|---|
| A | UNIF-001, FIX-001, HIST-001, AUTH-001, PROF-001, NAV-001 | Configuración, historial, autorización y navegación académica |
| B | CORS-001, LOOP-001, UI-001, DB-001 | Red, ciclo de carga, navegación estudiantil y esquema tabular |
| C | CONF-001, DATE-001, NAV-002, STUD-002, POST-001, MOD-001, FIX-002, FIX-003 | Configuración vigente, fechas, navegación, historial y modularización |
| D | REQ-EXP-001 a REQ-EXP-006 | Metodología, datos y núcleo académico |
| E | REQ-EXP-007 a REQ-EXP-013 | Identidad, RBAC, matrícula y finanzas |
| F | REQ-EXP-014 a REQ-EXP-019 | Planillas, inventarios, noticias, consola, logs y respaldos |
| G | REQ-DOC-001 a REQ-DOC-006 | Guías, contenido docente, tareas y disponibilidad |
| H | REQ-DOC-007 a REQ-DOC-012 | Dashboard estudiantil, Drive, metadatos, exportación, analítica y seguridad |

Cada lote tendrá un informe y commit documental independiente después de completar la inspección y la verificación del propio informe. Si un lote es demasiado extenso, se subdividirá sin combinar cambios no relacionados. Todos los cambios de esta auditoría se realizarán exclusivamente en `NG_beta_work`; `NG_beta` será solo la rama base.

## 4. Entregables y controles

- `Auditoria.txt`: hallazgos objetivos, con evidencia y severidad.
- `Pendientes.md`: tareas nuevas concretas derivadas de hallazgos, sin borrar ni reescribir registros existentes.
- `MapaDependencias.md`: actualizar solo las relaciones que hayan sido inspeccionadas y verificadas.
- Informes de lote: conservar el estado de cada una de las 49 tareas y sus referencias.
- Commits modulares en `NG_beta_work`; verificar cada escritura y no integrar ramas externas.

## 5. Condiciones iniciales observadas

- `METODOLOGIA_DESARROLLO.md` está presente en `NG_beta`; sus instrucciones se consideran obligatorias. No se modificará su contenido.
- El archivo de contexto real es `Contexto_personal.txt` (blob SHA `35523b53fdc29ef26c66e73600712af9d7fac9ad`); fue leído. No existe el nombre exacto `contexto_personal.md`, pero el TXT contiene las reglas aplicables a IMA. Entre ellas: registrar la tarea en `Pendientes.md` antes de iniciarla, mantener ID/título/estado en el contexto, no marcar tareas completadas sin verificación y aprobación del usuario, y preservar registros. Una instrucción expresa posterior del usuario autorizó crear `NG_beta_work` desde `NG_beta`; esta rama de trabajo sustituye la restricción anterior para esta auditoría, manteniendo `NG_beta` y `main` sin modificaciones y sin merges.
- `completadas_legacy.md` conserva las 49 entradas históricas y advierte que su estado no certifica implementación funcional.
- `Pendientes.md` en la raíz de `NG_beta` tiene blob SHA `482cfd7a49bc9cc04a1d4d609a70bb1bfda55768`. El conector devuelve cuerpo vacío incluso al solicitar rangos y base64, pero el SHA no corresponde a un blob vacío y la comparación de Git entre el snapshot `9665b2569404c2e19c0de341552048367fb37fc9` y `NG_beta` reporta cambios sustanciales (17,694 adiciones y 314 eliminaciones). Por ello **no se considera vacío**: su contenido actual no se ha podido leer con la herramienta disponible. El contenido completo se recuperó mediante el objeto Git blob SHA `482cfd7a49bc9cc04a1d4d609a70bb1bfda55768` (17,793 líneas; 1,416,057 caracteres). Se confirmó que el último ID de hallazgo era AUD-NG-100 y que AUD-NG-101 no existía en el registro. La tarea de auditoría se añadió de forma aditiva al final de `Pendientes.md` en `NG_beta_work`.
- `MapaDependencias.md` existe, pero su encabezado corresponde a v7.6.1; se tratará como referencia heredada y se verificará antes de confiar en sus relaciones.
- `Auditoria.txt` y `ChangesLogs.txt` contienen registros históricos extensos; cualquier adición deberá anexarse sin alterar el contenido previo.

## 6. Estado de avance

**Tarea AUD-NG-101 registrada y en ejecución en `NG_beta_work`. Auditoría formal preparada para iniciar el Lote A.**  
Se recuperó y leyó el contenido íntegro de `Pendientes.md`, se confirmó que AUD-NG-101 era el siguiente ID libre y se registró la tarea de auditoría de forma aditiva. También se añadió el ID, título y estado al archivo `Contexto_personal.txt`. Las consultas preliminares anteriores no se consideran auditoría formal; ninguna de las 49 tareas se declara auditada o aprobada. El Lote A no había comenzado al momento del registro inicial; su resultado posterior se consigna en la sección 7.


## 7. Resultados de lotes

### Lote A (2026-11-04)
- Inspeccionadas: UNIF-001, FIX-001, HIST-001, AUTH-001, PROF-001 y NAV-001.
- Estados: UNIF-001 parcial; FIX-001 parcial; HIST-001 parcial; AUTH-001 no cumple; PROF-001 no cumple; NAV-001 cumple.
- Hallazgos: AUD-NG-102 a AUD-NG-109, registrados en Auditoria.txt y Pendientes.md.
- Informe: AUDITORIA_LOTE_A.md.
- Inspección estática manual; no se modificó código ni se ejecutaron pruebas.
- AUD-NG-101 permanece En Ejecución; el Lote B es el siguiente.


## 8. Resultados de auditoría - Lote B (2026-11-04)

- **Rama base inspeccionada:** `NG_beta_0.0.0.1`, commit `44d9891132332e692dbe2ba8602b41f50a508a59`.
- **Rama de trabajo documental creada por autorización expresa del usuario:** `NG_beta_0.0.0.1_work`; la rama base no se modifica y no se realizan merges.
- **Tareas inspeccionadas:** CORS-001, LOOP-001, UI-001 y DB-001.
- **Resultados:** CORS-001 (Cumple parcialmente: `text/plain` está presente, pero no se probó el endpoint desplegado y la ruta vigente migró a ACADEMIC); LOOP-001 (Cumple parcialmente: el flag evita llamadas concurrentes y no se encontró recursión directa, pero un rechazo de caché antes del try/finally puede dejar el flag activo); UI-001 (Reemplazada por implementación posterior: navegación por tarjetas vigente y selector histórico de parcial incorporado posteriormente); DB-001 (Cumple parcialmente: esquema 9/8 y escritura granular presentes, pero no se valida el esquema de hojas preexistentes).
- **Hallazgos:** AUD-NG-110 a AUD-NG-112, añadidos de forma aditiva a Auditoria.txt y Pendientes.md.
- **Informe:** `AUDITORIA_LOTE_B.md`.
- **Dependencias verificadas:** se añadió un bloque acotado a `MapaDependencias.md`; no se certifica el grafo completo heredado.
- **Pruebas:** inspeccionadas las suites existentes, sin pruebas dirigidas identificables para estos cuatro contratos; no se ejecutaron pruebas ni se accedió a la hoja productiva o a despliegues GAS.
- **Código fuente:** sin modificaciones. No se actualizó `ChangesLogs.txt` y no se alteraron los estados históricos en `completadas_legacy.md`.
- **Tarea principal:** AUD-NG-101 permanece En Ejecución. Ninguna de las cuatro tareas históricas se marca como aprobada/completada por esta auditoría.
- **Siguiente lote:** C.


## 9. Resultados de auditoría - Lote C (2026-11-04)

- **Rama base inspeccionada:** `NG_beta_0.0.0.1`, commit `44d9891132332e692dbe2ba8602b41f50a508a59`; trabajo documental en `NG_beta_0.0.0.1_work`.
- **Tareas inspeccionadas:** CONF-001, DATE-001, NAV-002, STUD-002, POST-001, MOD-001, FIX-002 y FIX-003.
- **Resultados:** CONF-001 (Cumple parcialmente: Parcial y Unidad separados, pero Upsert omite Parcial en la clave); DATE-001 (No cumple: no cierra el intervalo del parcial anterior); NAV-002 (Cumple parcialmente: grados/secciones no se filtran por parcial activo); STUD-002 (Reemplazada parcialmente: tarjeta y texto correctos, pero la restricción de parcial vigente fue ampliada posteriormente con selector histórico); POST-001 (No verificable sin transición real: el código opera como snapshot); MOD-001 (Cumple: lógica migrada a academic-service); FIX-002 (Cumple en código: deduplicación normalizada por cinco factores); FIX-003 (Cumple: matchParcial está declarada y aplicada).
- **Hallazgos:** AUD-NG-113 a AUD-NG-116, añadidos a Auditoria.txt y Pendientes.md.
- **Informe:** `AUDITORIA_LOTE_C.md`.
- **Pruebas:** suites inspeccionadas sin pruebas dirigidas identificables para los contratos de este lote; no se ejecutaron pruebas ni se accedió a datos productivos.
- **Código fuente:** sin modificaciones. No se alteró completadas_legacy.md ni se actualizó ChangesLogs.txt.
- **Tarea principal:** AUD-NG-101 permanece En Ejecución. Ninguna marca histórica se modificó.
- **Siguiente lote:** D.


## 10. Resultados de auditoría - Lote D1 (2026-11-04)

- **Subdivisión:** el Lote D (REQ-EXP-001 a REQ-EXP-006) se separa en D1 (001-003) y D2 (004-006) para mantener commits modulares.
- **Rama base:** `NG_beta_0.0.0.1`, commit `44d9891132332e692dbe2ba8602b41f50a508a59`; trabajo documental en `NG_beta_0.0.0.1_work`.
- **Resultados:** REQ-EXP-001 (Cumple parcialmente: metodología de ocho fases documentada, cumplimiento histórico integral no verificable); REQ-EXP-002 (No verificable: libro XLSX presente, datos no inspeccionados); REQ-EXP-003 (Cumple parcialmente: jerarquía y validación 4 factores, pero catálogo de secciones fijo y sin salto automático en sección única; filtro parcial de grados/secciones ya registrado en AUD-NG-115).
- **Hallazgos:** AUD-NG-117 y AUD-NG-118, añadidos a Auditoria.txt y Pendientes.md.
- **Informe:** `AUDITORIA_LOTE_D1.md`.
- **Pruebas:** inspección de suites sin pruebas dirigidas identificables; no se ejecutaron pruebas.
- **Código fuente:** sin modificaciones; no se alteró completadas_legacy.md ni ChangesLogs.txt.
- **Siguiente sublote:** D2 (REQ-EXP-004 a REQ-EXP-006).


## 11. Resultados de auditoría - Lote D2 (2026-11-04)

- **Subdivisión:** D2 completa la revisión de REQ-EXP-004 a REQ-EXP-006.
- **Rama base:** `NG_beta_0.0.0.1`, commit `44d9891132332e692dbe2ba8602b41f50a508a59`; trabajo documental en `NG_beta_0.0.0.1_work`.
- **Resultados:** REQ-EXP-004 (Cumple parcialmente: integración de tareas/exámenes y asistencia existe, pero penalización 50%, ámbitos de asistencia y trazabilidad histórica tienen brechas); REQ-EXP-005 (Cumple parcialmente con riesgo crítico: cierre granular borra entregas globales, respaldo ficticio y sin limpieza de exámenes); REQ-EXP-006 (Cumple parcialmente: contacto, tarjetas y filtro de unidad implementados; orden de la vista expandida es inverso).
- **Hallazgos:** AUD-NG-119 a AUD-NG-126, añadidos a Auditoria.txt y Pendientes.md.
- **Informe:** `AUDITORIA_LOTE_D2.md`.
- **Pruebas:** no ejecutadas; revisión estática de endpoints y UI. No se accedió a datos productivos.
- **Código fuente:** sin modificaciones; no se alteró completadas_legacy.md ni ChangesLogs.txt.
- **Siguiente lote:** E.


## 12. Resultados de auditoría - Lote E1 (2026-11-04)

- **Subdivisión:** E1 revisa REQ-EXP-007 y REQ-EXP-008; E2 revisará REQ-EXP-009 a REQ-EXP-012.
- **Rama base:** `NG_beta_0.0.0.1`, commit `44d9891132332e692dbe2ba8602b41f50a508a59`; trabajo documental en `NG_beta_0.0.0.1_work`.
- **Resultados:** REQ-EXP-007 (Cumple en páginas y recursos principales inspeccionados); REQ-EXP-008 (Cumple parcialmente: HMAC/RBAC presentes, pero claves fallback predecibles y bypass de permisos con IDOR en tickets).
- **Hallazgos:** AUD-NG-127 y AUD-NG-128, añadidos a Auditoria.txt y Pendientes.md.
- **Informe:** `AUDITORIA_LOTE_E1.md`.
- **Pruebas:** no ejecutadas; no se inspeccionaron Script Properties de producción.
- **Código fuente:** sin modificaciones; no se alteró completadas_legacy.md ni ChangesLogs.txt.
- **Siguiente sublote:** E2 (REQ-EXP-009 a REQ-EXP-012).


## 13. Resultados de auditoría - Lote E2A (2026-11-04)

- **Subdivisión:** E2A revisa REQ-EXP-009 y REQ-EXP-010; E2B revisará REQ-EXP-011 y REQ-EXP-012.
- **Resultados:** REQ-EXP-009 (Cumple parcialmente: dos flujos de matrícula, asociación de cargos incompleta y permiso financiero no aplicado a todas las lecturas); REQ-EXP-010 (Cumple parcialmente: backend financiero existe, pero endpoint placeholder, mapeo/dedupe de cargos y validación transaccional de pagos presentan defectos).
- **Hallazgos:** AUD-NG-129 a AUD-NG-133, añadidos a Auditoria.txt y Pendientes.md.
- **Informe:** `AUDITORIA_LOTE_E2A.md`.
- **Pruebas:** no ejecutadas; revisión estática de servicios y UI.
- **Código fuente:** sin modificaciones; no se alteró completadas_legacy.md ni ChangesLogs.txt.
- **Siguiente sublote:** E2B (REQ-EXP-011 a REQ-EXP-012).


## 14. Resultados de auditoría - Lote E2B (2026-11-04)

- **Subdivisión:** E2B completa la revisión de REQ-EXP-011 y REQ-EXP-012.
- **Resultados:** REQ-EXP-011 (Cumple parcialmente: backend de comprobantes existe, portal no conectado, PDF/correlativo no implementados); REQ-EXP-012 (Cumple parcialmente: separación de tablas existe, pero CAI/rango/correlativo no están protegidos frente al payload y la consulta no está aislada).
- **Hallazgos:** AUD-NG-134 a AUD-NG-137, añadidos a Auditoria.txt y Pendientes.md. AUD-NG-127 se amplía al microservicio ACCOUNTING.
- **Informe:** `AUDITORIA_LOTE_E2B.md`.
- **Pruebas:** no ejecutadas; revisión estática de UI y endpoints.
- **Código fuente:** sin modificaciones; no se alteró completadas_legacy.md ni ChangesLogs.txt.
- **Siguiente lote:** F (REQ-EXP-013 en adelante).


## 15. Resultados de auditoría - Lote F1 (2026-11-04)

- **Subdivisión:** F1 revisa REQ-EXP-013 a REQ-EXP-015.
- **Resultados:** REQ-EXP-013 (Cumple parcialmente: cierre/conciliación y bypass three-way match); REQ-EXP-014 (Cumple parcialmente: autoservicio IDOR y tasas IHSS/ISR/RAP desactualizadas); REQ-EXP-015 (Cumple parcialmente: inventario/activos existen, pero hay recepciones/ajustes repetibles y requisiciones sin aprobación obligatoria).
- **Hallazgos:** AUD-NG-138 a AUD-NG-142, añadidos a Auditoria.txt y Pendientes.md.
- **Informe:** `AUDITORIA_LOTE_F1.md`.
- **Fuentes oficiales de referencia laboral/tributaria:** comunicado IHSS 2025; tabla progresiva SAR 2026; RAP planes obligatorios; Decreto 47-2024.
- **Pruebas:** no ejecutadas; revisión estática.
- **Código fuente:** sin modificaciones; no se alteró completadas_legacy.md ni ChangesLogs.txt.
- **Siguiente sublote:** F2 (REQ-EXP-016 en adelante).


## 16. Resultados de auditoría - Lote F2 (2026-11-04)

- **Subdivisión:** F2 revisa REQ-EXP-016 a REQ-EXP-019.
- **Resultados:** REQ-EXP-016 (Cumple parcialmente: contrato de noticias desalineado y audiencia/vigencia no configurables); REQ-EXP-017 (Cumple parcialmente: ping real incompleto y health DEVELOPER simulado); REQ-EXP-018 (Cumple parcialmente: logs reales con viewer incompatible y API central simulada); REQ-EXP-019 (Cumple parcialmente: backup manual ACADEMIC existe, pero hash/validación/restore/schedule/retención defectuosos).
- **Hallazgos:** AUD-NG-143 a AUD-NG-146, añadidos a Auditoria.txt y Pendientes.md.
- **Informe:** `AUDITORIA_LOTE_F2.md`.
- **Pruebas:** no ejecutadas; revisión estática de servicios y UI.
- **Código fuente:** sin modificaciones; no se alteró completadas_legacy.md ni ChangesLogs.txt.
- **Siguiente lote:** G (REQ-EXP-020 en adelante y tareas DOC).


## 17. Resultados de auditoría - Lote G1 (2026-11-04)

- **Subdivisión:** G1 revisa REQ-DOC-001 a REQ-DOC-003.
- **Rama base:** NG_beta_0.0.0.1; rama de trabajo documental: NG_beta_0.0.0.1_work.
- **Resultados:** REQ-DOC-001 (Cumple parcialmente: vista y wrappers declarados, pero CRUD dedicado desconectado, acciones ACADEMIC inexistentes y lectura TASK pública sin filtros completos); REQ-DOC-002 (Cumple parcialmente: índice estático y publicador genérico, sin gestión persistente por tema); REQ-DOC-003 (Cumple parcialmente: creación estándar con Quill, sin tres modalidades ni validación obligatoria en servidor).
- **Hallazgos:** AUD-NG-147 a AUD-NG-149, añadidos a Auditoria.txt y Pendientes.md.
- **Informe:** AUDITORIA_LOTE_G1.md.
- **Pruebas:** no ejecutadas; inspección estática manual.
- **Código fuente:** sin modificaciones; no se alteró completadas_legacy.md ni ChangesLogs.txt.
- **Siguiente sublote:** G2 (REQ-DOC-004 a REQ-DOC-006).


## 18. Resultados de auditoría - Lote G2 (2026-11-04)

- **Subdivisión:** G2 revisa REQ-DOC-004 a REQ-DOC-006.
- **Resultados:** REQ-DOC-004 (Cumple parcialmente: distinción visual, pero submitAssignment/gradeSubmission no bloquean guías y el DTO omite archivoUrl); REQ-DOC-005 (Cumple parcialmente: campos presentes, sin cálculo predeterminado, persistencia de fechaClase ni validación); REQ-DOC-006 (Cumple parcialmente: contrato horaDisponible/fechaDisponible incongruente, UI desconectada y sin enforcement de servidor).
- **Hallazgos:** AUD-NG-150 a AUD-NG-152, añadidos a Auditoria.txt y Pendientes.md.
- **Informe:** AUDITORIA_LOTE_G2.md.
- **Pruebas:** no ejecutadas; inspección estática manual.
- **Código fuente:** sin modificaciones; no se alteró completadas_legacy.md.
- **Siguiente sublote:** H1 (REQ-DOC-007 a REQ-DOC-009).


## 19. Resultados de auditoría - Lote H1 (2026-11-04)

- **Subdivisión:** H1 revisa REQ-DOC-007 a REQ-DOC-009.
- **Resultados:** REQ-DOC-007 (Cumple parcialmente: hay tarjetas por asignatura y expansión, pero falta tema, integración de materiales y exclusión de guías de los pendientes/vencimientos); REQ-DOC-008 (Cumple parcialmente: el árbol Drive no coincide con el requerido, la normalización es insuficiente y la carga reanudable no está conectada); REQ-DOC-009 (Cumple parcialmente: la hoja existe, pero metadatos clave se completan con defaults y la carga reanudable no registra).
- **Hallazgos:** AUD-NG-153 a AUD-NG-155, añadidos a Auditoria.txt y Pendientes.md.
- **Informe:** AUDITORIA_LOTE_H1.md.
- **Pruebas:** no ejecutadas; inspección estática manual.
- **Código fuente:** sin modificaciones; no se alteró completadas_legacy.md.
- **Siguiente sublote:** H2 (REQ-DOC-010 a REQ-DOC-012).


## 20. Resultados de auditoría - Lote H2 y cierre de auditoría histórica (2026-11-04)

- **Subdivisión:** H2 revisa REQ-DOC-010 a REQ-DOC-012.
- **Resultados:** REQ-DOC-010 (Cumple parcialmente: la configuración administrativa de horarios no existe; exportación/health/logs/backups se relacionan con AUD-NG-120 y AUD-NG-144 a AUD-NG-146); REQ-DOC-011 (Cumple parcialmente: cálculo analítico omite proyectos y convierte datos ausentes en valores; penalización tardía relacionada con AUD-NG-121); REQ-DOC-012 (Cumple parcialmente: TASK no aplica ámbito docente en escrituras ni conserva historial de fechas límite; otros controles de seguridad ya tienen tareas existentes).
- **Hallazgos nuevos:** AUD-NG-156 a AUD-NG-158, añadidos a Auditoria.txt y Pendientes.md.
- **Informe:** AUDITORIA_LOTE_H2.md.
- **Cierre:** 49 de 49 tareas históricas de completadas_legacy.md revisadas (37 de lotes A-F2 y 12 de lotes G1-G2-H1-H2). No quedan tareas históricas pendientes de auditoría.
- **Hallazgos relacionados sin duplicar:** AUD-NG-001, AUD-NG-002, AUD-NG-004, AUD-NG-108, AUD-NG-119, AUD-NG-120, AUD-NG-121, AUD-NG-122, AUD-NG-124, AUD-NG-144 a AUD-NG-146, AUD-NG-152, TASK-085 y TASK-142.
- **Pruebas:** no ejecutadas; inspección estática manual.
- **Código fuente:** sin modificaciones. No se alteró completadas_legacy.md ni ChangesLogs.txt.
- **Estado siguiente:** auditoría histórica cerrada; queda priorizar e implementar hallazgos pendientes con autorización y metodología correspondiente.


## 21. Auditoría de tareas completadas - T-UX-01 (2026-11-04)

- **Tarea auditada:** T-UX-01 - Manejo Centralizado de Expiración de Sesión y Excepciones de Autorización.
- **Dictamen:** Cumple parcialmente. El manejador de expiración existe, pero fetchApi no lo invoca; login.html/js/auth.js no interpretan session_expired ni muestran aviso; el backend mezcla errores de autenticación con denegaciones de permisos; UX-01 solo verifica la existencia de la función.
- **Hallazgo nuevo:** AUD-NG-162 (ALTO/P1), registrado en Auditoria.txt y convertido en tarea pendiente en Pendientes.md.
- **Informe:** AUDITORIA_COMPLETADAS_T-UX-01.md.
- **Pruebas:** inspección estática/manual. No se ejecutaron pruebas de navegador ni escenarios reales de expiración/revocación.
- **Código fuente:** sin modificaciones. No se alteraron completadas.md, completadas_legacy.md ni ChangesLogs.txt.
- **Progreso:** 8 de 183 identificadores únicos auditados; 175 pendientes.
- **Siguiente tarea:** TAREA-02. No repetir T-UX-01 salvo que cambios posteriores o regresiones lo justifiquen.
