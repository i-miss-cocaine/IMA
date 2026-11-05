# Auditoría TAREA-18

Fecha: 2026-11-05
Rama: NG_beta_0.0.0.1_work
HEAD de partida: fa80cfc3c1a73c7d5bbaa9e1b72b277d4aacc86c
Dictamen: CUMPLE PARCIALMENTE.

## Evidencia
- backend/academic-service/Code.gs (SHA daf1883ec0b8d4f0ff2bc673af8a4e8c5bbd03fc): RecursosEducativosReutilizables (145) solo contiene metadatos y Version textual; no existe historial ni ACL. ProyectosInterdisciplinarios (146) guarda departamentos como texto, sin relación con recursos.
- getReusableResourceCatalog (2989) filtra por área/asignatura/grado/idioma; ignora tema/categoría y devuelve proyectos sin filtro temporal o de área.
- manageReusableResource (3046) siempre inserta filas; recursoId no actualiza, no hay deduplicación ni versionado. El año del proyecto está fijado en 2026; autorId y URL llegan del payload.
- js/teacher.js (SHA c475fce5afcd28fca23e7b64398ad32b17773746; 2314-2425) busca un modal inexistente en teacher-dashboard.html (SHA cbb9e6a272a7d8ad33f99727303305d950533e71). El formulario no envía grado/idioma/version ni recursos asociados y usa el nombre de UI como autor.
- La tabla del catálogo inserta datos controlables sin escape contextual y abre URL sin validación de dominio/esquema; existe riesgo de XSS almacenado.
- ROLE_PERMISSIONS permite las acciones a Profesor, Director, Subdirector y Secretaría, pero no hay autorización por área/autor/recurso. Coordinador no figura.
- tests/regression/academic-grading-suite.js (SHA 3433b707edd4a2f35c68368a3172932adc2a3b32) no contiene pruebas de TAREA-18.

## Criterios
- Localización por área/asignatura: parcial; filtros backend sin interfaz.
- Permisos/relaciones: no cumple; sin ACL ni enlaces proyecto-recurso.
- Versionado histórico: no cumple; Version es texto libre, sin linaje ni snapshot.
- Reutilización sin duplicar archivos: parcial; solo guarda URL, sin verificar ACL.
- Proyectos con recursos de varias áreas: no cumple.
- UI docente: no cumple; modal ausente.

## Hallazgo nuevo
AUD-NG-171 (P2): completar catálogo reutilizable, versionado e historial inmutable, relación proyecto-recurso-versión, año lectivo/líder verificados, permisos por recurso, UI operativa, deduplicación y pruebas históricas.

AUD-NG-170 permanece sin asignar por la decisión específica de TAREA-15. AUD-NG-171 es un hallazgo distinto de TAREA-18.

## Relaciones
- AUD-NG-164: referencias curriculares canónicas.
- AUD-NG-158: ABAC y actor verificado.
- TASK-296: sanitización de salida, XSS almacenado, enlaces Drive seguros y ACL.

## Límites
Inspección estática/manual; no se ejecutaron CRUD, versionado, pruebas ACL, Drive ni pruebas XSS en navegador. Sin datos productivos ni cambios de código. La planificación Fase 1 referenciada en completadas.md no está disponible; se usó su alcance explícito.
