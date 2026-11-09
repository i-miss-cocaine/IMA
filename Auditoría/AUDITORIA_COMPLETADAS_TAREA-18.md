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


## Tareas ejecutables derivadas de los hallazgos

### AUD-NG-171 - Catálogo de recursos reutilizables y proyectos interdisciplinarios (P2)
- Definir un modelo persistente de recurso con ID canónico, autor verificado, título, descripción, tipo/categoría, área, asignatura, grado, idioma, tema, URL o referencia de almacenamiento, estado, fecha de creación/actualización y versión vigente.
- Implementar actualización por `recursoId` en lugar de insertar siempre. Validar existencia y propiedad/permiso antes de actualizar; impedir duplicados por una clave de negocio definida y permitir que el mismo recurso sea referenciado desde varios proyectos sin duplicar el archivo.
- Sustituir `Version` textual por un historial append-only de versiones con número/ID, recurso padre, contenido/metadatos, autor verificado, timestamp, motivo y estado. Una modificación debe crear una nueva versión y conservar la anterior; no sobrescribir el historial.
- Crear una relación explícita Proyecto-Recurso-Versión. Un proyecto debe poder asociar recursos de varias áreas y conservar la versión exacta utilizada, evitando que cambios futuros en el catálogo alteren retroactivamente el contenido del proyecto.
- Persistir el contexto completo del proyecto (año lectivo, área/departamento líder, áreas participantes, responsable, estado y vigencia). El año no debe quedar fijado en código ni derivarse de un valor del cliente sin validación.
- Resolver el catálogo desde relaciones curriculares canónicas de AUD-NG-164. Los filtros por área, asignatura, grado, idioma, tema y categoría deben aplicarse realmente a recursos y proyectos; incluir filtro temporal/contextual y no devolver proyectos sin filtrar.
- Implementar ACL por recurso y proyecto: propietario, colaboradores, participantes y roles institucionales. Validar en backend cada lectura, asociación, edición, publicación y descarga; la visibilidad de un recurso no implica permiso para modificarlo.
- Derivar `autorId` y actor de sesión verificada; no aceptar el nombre de UI, `autorId` ni URLs del payload como identidad o prueba de autorización.
- Definir ciclo de vida del recurso y proyecto (borrador, revisión, publicado, archivado) con transiciones autorizadas e historial de actor/fecha/motivo.
- Integrar en el panel docente una interfaz real para consultar, crear, editar y reutilizar recursos, así como crear proyectos y asociar recursos/versiones. El controlador no debe buscar un modal inexistente; el formulario debe enviar y mostrar los metadatos y relaciones requeridos.
- Mantener las asociaciones y versiones visibles para los usuarios autorizados, con indicadores claros de versión vigente, versión usada por proyecto y cambios posteriores.

### AUD-NG-164 - Referencias curriculares canónicas
- Resolver área, asignatura, grado y departamento mediante IDs del catálogo curricular maestro, verificando estado y vigencia antes de guardar recursos o proyectos.
- Evitar almacenar únicamente nombres o departamentos como texto libre cuando exista una entidad curricular canónica.
- Permitir que un proyecto interdisciplinario vincule múltiples áreas/departamentos participantes mediante relaciones explícitas, sin reemplazar el área líder ni perder la trazabilidad curricular.
- Mantener AUD-NG-164 como propietario del catálogo maestro; AUD-NG-171 consume sus referencias para clasificar recursos/proyectos.

### AUD-NG-158 - ABAC y actor verificado para recursos
- Aplicar autorización contextual por área/departamento, autor, propietario, colaboración y relación con el proyecto en cada endpoint de catálogo y gestión.
- Derivar identidad del actor desde claims/sesión verificados y comprobar que el docente pertenece al ámbito que pretende administrar.
- Restringir lectura, edición, asociación, publicación y archivado según permisos explícitos; Coordinador debe disponer únicamente del alcance de área/departamento que tenga asignado.
- Verificar la autorización del recurso y del proyecto al crear la relación Proyecto-Recurso-Versión; no confiar en IDs enviados por el navegador.
- Mantener el control transversal de acceso separado del modelo de versionado y relaciones que implementa AUD-NG-171.

### TASK-296 - Sanitización, XSS almacenado y enlaces seguros
- Escapar los valores del catálogo al insertarlos en HTML, incluyendo título, descripción, autor, área, categoría y cualquier otro campo persistido; preferir APIs DOM seguras frente a concatenación de HTML.
- Validar URLs por esquema y destino permitido antes de mostrarlas o abrirlas; bloquear esquemas ejecutables, destinos no autorizados y redirecciones inseguras.
- Aplicar sanitización contextual tanto al guardar como al renderizar, sin tratar la sanitización de entrada como sustituto del escape de salida.
- Aplicar las reglas de acceso/ACL a enlaces de Drive o archivos privados; no exponer URLs públicas como sustituto de autorización.
- Añadir pruebas de XSS almacenado con payloads en todos los campos visibles y pruebas de enlaces malformados/no permitidos.

**Reconciliación y límites:** AUD-NG-171 concentra catálogo, deduplicación, versionado inmutable, relaciones Proyecto-Recurso-Versión, contexto temporal e integración UI. AUD-NG-164 conserva el catálogo curricular canónico; AUD-NG-158 conserva ABAC y actor verificado; TASK-296 conserva sanitización/XSS/enlaces/ACL de salida. No se crean IDs adicionales ni se absorben los controles transversales.

**Evidencia requerida:** CRUD con actualización real; deduplicación; historial de versiones no modificable; proyecto con recursos de varias áreas y versiones fijas; filtros efectivos; permisos positivos/negativos por rol y propietario; interfaz operativa; pruebas de XSS almacenado y URLs inseguras; y referencias curriculares válidas/inválidas. La auditoría actual es estática y no acredita estos comportamientos.

