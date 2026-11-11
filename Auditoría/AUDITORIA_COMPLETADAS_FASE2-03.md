AUDITORÍA DE TAREAS COMPLETADAS - FASE2-03
FECHA: 2026-11-05
REPOSITORIO: i-miss-cocaine/IMA
RAMA: NG_beta_0.0.0.1_work
HEAD DE PARTIDA: a302f4ccd3d3f4b2e2c2cdfcce4833d25dc0d44a
================================================================

DICTAMEN: CUMPLE PARCIALMENTE.

FASE2-03 aparece en completadas.md únicamente con título, origen y archivos involucrados (js/config.js y backend/academic-service/Code.gs). El informe de origen AUDITORIA_FASE2_ARQUITECTURA_INTEROPERABILIDAD.md no está presente en el árbol de la rama. Por ello, la evaluación se basa en el título histórico, los archivos declarados y las implementaciones posteriores relacionadas, especialmente TASK-046 (F23-Task03) y el bloque FASE2-T04 de catálogo institucional.

1. RESOLUCIÓN DE FUENTES DE DATOS

En backend/academic-service/Code.gs:
- registerSpreadsheetSource (líneas 11453-11496) existe, pero identifica una fuente únicamente por dominioArea + anoLectivo. Aunque recibe departamento y servicio, no los persiste. No almacena área de responsabilidad, tipo de información ni cuenta propietaria.
- Las actualizaciones sobrescriben la fila existente; no se conserva historial de cambios de fuentes.
- schemaVersion se almacena, pero no se compara con un esquema esperado ni se usa para validar compatibilidad.
- No se valida que spreadsheetId exista, que el servicio tenga acceso, que el archivo esté disponible o que su estructura sea compatible.
- resolveSpreadsheetSource (líneas 11499-11538) ignora departamento y servicio. Solo busca dominio + año lectivo. Si no encuentra coincidencia, devuelve status success, resolved false y el SPREADSHEET_ID principal. Este fallback puede servir datos de otra partición sin autorización explícita.
- getSpreadsheetCatalog (líneas 11541-11566) proyecta las filas del catálogo sin resolver el estado operativo ni filtrar fuentes inactivas.
- El helper académico getOrCreateSheet (líneas 85-150) no define encabezados para CatalogoSpreadsheets. Si la hoja no existe, la primera alta puede escribirse en la fila 1; resolveSpreadsheetSource y getSpreadsheetCatalog usan slice(1), por lo que esa primera fuente queda excluida.
- La existencia de los endpoints no equivale a un enrutador integrado. El checkpoint C1.29 / auditoría FASE2-01 ya documentó que la mayoría de operaciones sigue usando SpreadsheetApp.openById(SPREADSHEET_ID), y que el resolver solo tiene una llamada adicional por servicio en USER, ACCOUNTING y ACADEMIC; TASK y EXAM no lo implementan. No se repite ese hallazgo: se amplía TASK-046 y se mantienen AUD-NG-083, AUD-NG-084 y AUD-NG-086 como referencias existentes.

2. CATÁLOGOS MAESTROS Y SINCRONIZACIÓN

En backend/academic-service/Code.gs:
- getInstitutionalCatalog (líneas 3824-3883) consulta CatalogoAsignaturas y AreasCurricularesExtensiones.
- El esquema de CatalogoAsignaturas creado por getOrCreateSheet define las columnas: AsignaturaID, NombreOficial, Codigo, AreaAcademica, CargaHorariaRef, Estado. Sin embargo, getInstitutionalCatalog devuelve estado desde r[4], que corresponde a CargaHorariaRef; el estado real está en r[5].
- getInstitutionalCatalog no excluye filas inactivas.
- validateCatalogReference (líneas 3885-3915) comprueba que exista una clave, pero no verifica que el elemento esté activo; por tanto una referencia inactiva puede validarse como válida.

En js/config.js:
- Los catálogos locales estáticos (incluido CURRICULAR_AREAS_CATALOG) siguen presentes como datos disponibles para el cliente.
- fetchInstitutionalCatalog (líneas 806-835) llama a ACADEMIC/getInstitutionalCatalog, pero ante ausencia de fetchApi, respuesta inesperada o error de transporte devuelve status success con el catálogo estático. Esto oculta la diferencia entre fuente autoritativa disponible y fallback local.
- La sincronización solo procesa areasCurriculares; no actualiza el catálogo de asignaturas que también devuelve el backend.
- registerNewCurricularAreaServiceConfig (líneas 938-965) agrega áreas nuevas, pero no actualiza los metadatos de una entrada existente ni aplica su estado de inactividad al catálogo local.

3. CALIDAD, SEGURIDAD Y MANTENIBILIDAD

- El resolver mezcla selección de fuente, fallback y presentación de resultado en una función pequeña sin validar disponibilidad, autorización ni versión de esquema.
- El uso de un identificador temporal como SRC- + Date.now() no proporciona por sí mismo unicidad bajo concurrencia.
- La clave de actualización dominio+año puede sobrescribir fuentes que debieran distinguirse por departamento, servicio, tipo de información o cuenta.
- La respuesta success con resolved false facilita que un consumidor interprete como correcta una lectura realizada contra la hoja principal.
- El fallback del catálogo convierte errores de conectividad/contrato en éxito aparente, lo que dificulta observabilidad y diagnóstico.
- El estado de las asignaturas está mal mapeado y la validación no distingue referencias activas de inactivas.

4. RECONCILIACIÓN CON TAREAS POSTERIORES

- TASK-046 (F23-Task03) amplía el alcance de FASE2-03 y ya contiene la resolución universal de fuentes. Los hallazgos de integración general previamente documentados en C1.29 no se duplican; se agrega una ampliación concreta sobre clave compuesta, metadatos ignorados, ausencia de validación, fallback y encabezados.
- FASE2-T04 incorpora el endpoint getInstitutionalCatalog y la sincronización de catálogos, pero la implementación no acredita una fuente de verdad consistente por el error de índice, la falta de filtrado de inactivos y el fallback success del cliente.
- Nuevo hallazgo AUD-NG-175 para corregir el contrato y sincronización de catálogos. No se altera completadas.md ni se marca tarea histórica como completada o reabierta.

5. PRUEBAS Y LIMITACIONES

- Inspección estática/manual de js/config.js y backend/academic-service/Code.gs en los rangos citados.
- Se consultó la definición histórica de TASK-046 y los hallazgos AUD-NG-083, AUD-NG-084 y AUD-NG-086 para evitar duplicación.
- No se ejecutaron pruebas automatizadas, requests HTTP a deployments, pruebas de navegador, validación real de permisos de Drive/Sheets ni operaciones sobre hojas productivas.
- No se modificó código fuente.

================================================================
FIN DEL INFORME
================================================================

## Tareas ejecutables derivadas de los hallazgos

### [TASK-046] Ampliar la resolución centralizada de fuentes de datos
- **Hallazgo de origen:** FASE2-03, secciones 1 y 4; ampliación explícita de TASK-046.
- **Severidad:** Crítico.
- **Objetivo:** asegurar que la selección de fuente sea inequívoca, validada y compatible con el contexto institucional.
- **Acción ejecutable:** ampliar la clave de resolución para incluir departamento, servicio y tipo de información además de dominio/año; persistir y consultar esos metadatos; validar existencia, disponibilidad, acceso y schemaVersion; corregir la inicialización/lectura de encabezados; retirar fallback a la hoja principal cuando no exista coincidencia; integrar el resolver en todos los consumidores.
- **Archivos/módulos afectados:** backend/academic-service/Code.gs, js/config.js y consumidores de fuentes en USER, ACCOUNTING, TASK y EXAM.
- **Dependencias y riesgos:** AUD-NG-083, AUD-NG-084 y AUD-NG-086; evitar lecturas cruzadas y pérdida de compatibilidad con fuentes existentes.
- **Alcance:** ampliación de tarea existente, sin generar TASK/AUD duplicado para el enrutamiento ya documentado.
- **Criterios de aceptación:** dos fuentes del mismo dominio/año pero distinto departamento/servicio/tipo se resuelven independientemente; una fuente ausente/inactiva/sin permiso/esquema incompatible devuelve error explícito; el resolver no usa SPREADSHEET_ID como fallback; todos los consumidores críticos lo invocan.
- **Prioridad:** P0.
- **Estado:** Pendiente.
- **Evidencia de cierre:** pruebas de resolución por combinación, aislamiento y migración de consumidores.

### [AUD-NG-175] Corregir el contrato y la sincronización de catálogos institucionales
- **Hallazgo de origen:** AUD-NG-175; secciones 2, 3 y 4.
- **Severidad:** Alto.
- **Objetivo:** garantizar que cliente y servidor compartan un catálogo institucional correcto y que las referencias inactivas no se acepten.
- **Acción ejecutable:** corregir el índice de Estado en CatalogoAsignaturas; filtrar elementos inactivos en consultas; validar estado activo en validateCatalogReference y en mutaciones; sincronizar áreas y asignaturas; actualizar metadatos/estado de registros existentes; sustituir fallback success con catálogo estático por error explícito o estado degradado no confundible con éxito.
- **Archivos/módulos afectados:** backend/academic-service/Code.gs, js/config.js y consumidores de catálogos.
- **Dependencias y riesgos:** TASK-046 para la fuente autoritativa; AUD-NG-158 para estado/ámbito de áreas, sin duplicar su causa raíz.
- **Alcance:** contrato, validación y sincronización; no ampliar aquí versionado/caché transversal asignado a TASK-062.
- **Criterios de aceptación:** el estado leído coincide con la columna Estado; referencias inactivas se rechazan en servidor; áreas y asignaturas se sincronizan; altas/actualizaciones/bajas reflejan metadatos correctos; indisponibilidad de API no devuelve status success con catálogo local; pruebas cubren catálogo ALL y consultas específicas.
- **Prioridad:** P1.
- **Estado:** Pendiente.
- **Evidencia de cierre:** pruebas de contrato/sincronización, casos activos/inactivos y verificación de errores.
