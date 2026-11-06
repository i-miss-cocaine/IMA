# Auditoría de completadas.md - TAREA-06

**Fecha:** 2026-11-05  
**Rama:** NG_beta_0.0.0.1_work  
**Tarea:** Completar la gestión institucional de carpetas y permisos documentales  
**Fuente:** completadas.md, SHA f57f1aef832e81e44fc4f7ec36a852d50e464676  
**HEAD de referencia:** 709cc6d6026a6fc8835008f88f30ffc4677f2905

## Dictamen

**CUMPLE PARCIALMENTE.** Se añadieron dos helpers con intentos de bloqueo concurrente, pero no se implementó una gestión documental institucional uniforme. Hay servicios que crean carpetas sin bloqueo, los bloqueos existentes no verifican si fueron adquiridos, la búsqueda depende del nombre y no de un catálogo de IDs estables, y se mantienen enlaces públicos en carpetas/documentos. La jerarquía, la asociación documental, la gestión de permisos y el ciclo de vida se encuentran fragmentados. Las brechas ya están cubiertas por tareas pendientes; no se crea un nuevo AUD-NG.

## Contraste con ChangesLogs.txt

ChangesLogs.txt atribuye a TAREA-06 dos cambios: getOrCreateFolder en backend/task-service/Code.gs y getOrCreateFolderNews en backend/user-service/Code.gs. El alcance de completadas.md incluye además backend/academic-service/Code.gs, backend/accounting-service/Code.gs, js/teacher.js y js/accounting.js. El historial no demuestra que se haya completado la gestión institucional de permisos, la estructura por departamentos, los IDs estables ni la relación con registros.

## Evidencia técnica

### 1. Creación y reutilización de carpetas

- backend/task-service/Code.gs: getOrCreateFolder usa LockService.getScriptLock() y tryLock(15000), pero no comprueba el valor booleano retornado por tryLock antes de buscar/crear. Si no adquiere el bloqueo, continúa igualmente. La búsqueda es getFoldersByName con coincidencia exacta; no usa un registro canónico de IDs ni normaliza acentos/case/espacios.
- backend/user-service/Code.gs: getOrCreateFolderNews presenta el mismo patrón: tryLock(15000) sin verificar adquisición. Además, se limita a la carpeta Noticias_Imagenes; no es un servicio general de estructura documental.
- backend/accounting-service/Code.gs: getOrCreateFolder solo ejecuta getFoldersByName y createFolder; no utiliza LockService. getOrCreateFolderNews es un alias de esa función sin bloqueo.
- backend/academic-service/Code.gs: initializeDirectionSecretaryDriveStructure define un helper local que busca/crea Direccion, Secretaria y Compartido_Direccion_Secretaria sin bloqueo. getBackupFolder también crea carpetas sin bloqueo.
- backend/exam-service/Code.gs: no se encontró un helper equivalente para la jerarquía documental.
- LockService.getScriptLock() protege ejecuciones del mismo proyecto Apps Script; no coordina de forma global proyectos distintos que accedan al mismo padre de Drive. Por eso los dos helpers no garantizan ausencia de duplicados entre servicios desplegados por separado.
- getParentDriveFolder en USER/ACCOUNTING utiliza PARENT_FOLDER_ID si está configurado, pero ante ausencia o error retorna DriveApp.getRootFolder() silenciosamente. Esto puede crear recursos en la raíz de la identidad ejecutora en lugar de la ubicación institucional esperada.

### 2. IDs estables, rutas y relación con registros

- Las funciones revisadas localizan carpetas por nombre y crean si no encuentran coincidencia; no existe un catálogo institucional único que resuelva IDs estables, departamento, tipo de recurso, propietario y ruta canónica para todos los servicios.
- La inicialización académica crea únicamente New Generation/Direccion, Secretaria y Compartido_Direccion_Secretaria. No implementa la estructura completa para Dirección, Secretaría, RR. HH., Contabilidad, Docencia, Alumnado, Biblioteca, Transporte y nuevas áreas.
- La jerarquía docente y la normalización de rutas ya están registradas en AUD-NG-154. El registro integral de archivos y su relación con expedientes está en AUD-NG-155.
- js/teacher.js y js/accounting.js actúan como clientes de carga/consulta; no aportan por sí mismos un catálogo común de carpetas, permisos o IDs estables.

### 3. Permisos, enlaces y privacidad

- backend/accounting-service/Code.gs contiene dos usos de DriveApp.Access.ANYONE_WITH_LINK para comprobantes y documentos laborales.
- backend/user-service/Code.gs contiene dos usos de DriveApp.Access.ANYONE_WITH_LINK, incluyendo adjuntos de trámites e imágenes de noticias.
- backend/task-service/Code.gs hace pública la carpeta de entregas mediante ANYONE_WITH_LINK en dos rutas revisadas; los archivos alojados pueden heredar el acceso público de la carpeta.
- No se encontró una matriz institucional de permisos de Drive aplicada a nivel de archivo/carpeta para lectura, edición, creación y eliminación, ni comprobaciones de permisos heredados antes de devolver un enlace.
- AUD-NG-058 ya exige entrega privada de adjuntos y acceso mediado por autorización; TASK-143 exige inventario y remediación de enlaces públicos preexistentes. Se amplía su alcance para incluir las rutas públicas del servicio TASK y todas las nuevas cargas documentales.
- TASK-139/TASK-140/TASK-295 cubren permisos granulares por operación, clasificación de sensibilidad y reglas por departamento/expediente. TASK-346 cubre accesos residuales y permisos heredados.

### 4. Detección, integridad y ciclo de vida

- No se acreditó una conciliación general que detecte carpetas/archivos inexistentes, movidos, inaccesibles, huérfanos o con referencias rotas. TASK-345 ya contempla conciliación Drive-registros.
- No se demostró un flujo común para mover, archivar, conservar o eliminar documentos con autorización y trazabilidad. TASK-149, TASK-150 y TASK-456 cubren conservación, disposición controlada y políticas de archivo.
- La creación de una carpeta puede quedar completada sin una relación institucional persistida de forma uniforme; AUD-NG-155 cubre metadatos y vínculo con los registros.

## Relación con tareas existentes (sin duplicar)

- AUD-NG-154: jerarquía documental, normalización de nombres, IDs/rutas y cargas.
- AUD-NG-155: metadatos y relación entre archivo físico y registro institucional.
- AUD-NG-058 y TASK-143: privacidad de enlaces y saneamiento de permisos públicos existentes.
- TASK-139, TASK-140, TASK-295 y TASK-346: permisos granulares, sensibilidad, herencia y revocación de accesos residuales.
- TASK-345: conciliación entre Drive y registros.
- TASK-149, TASK-150 y TASK-456: conservación, archivo, disposición y eliminación controlada.
- No se crea un hallazgo nuevo; se amplían criterios de estas tareas para cubrir los hallazgos adicionales de TAREA-06.

## Calidad y límites de verificación

La calidad es **insuficiente para declarar TAREA-06 completada**. El bloqueo se limita a dos helpers, no se verifica su adquisición, no es transversal entre proyectos, ACCOUNTING y ACADEMIC crean carpetas sin bloqueo, las rutas se basan en nombres y existen permisos públicos. No se inspeccionaron ACL reales de Google Drive, permisos heredados, unidades compartidas ni la accesibilidad anónima de enlaces en un entorno productivo. La auditoría fue estática y no ejecutó pruebas de concurrencia ni de acceso.

## Restricciones

No se modifican código fuente, completadas.md, ChangesLogs.txt ni METODOLOGIA_DESARROLLO.md. Solo se amplían registros de auditoría y tareas pendientes existentes. La rama base permanece intacta y no se hace merge.


---

## Tareas ejecutables derivadas de los hallazgos

> No se crea un AUD-NG nuevo. TAREA-06 amplía criterios de tareas ya existentes; cada brecha se asigna al identificador que conserva su responsabilidad para evitar duplicar jerarquía documental, metadatos, privacidad, permisos, conciliación y ciclo de vida.

### [AUD-NG-154] Completar la jerarquía documental y la resolución canónica de carpetas
- **Hallazgo de origen:** evidencia técnica 1 y 2; creación fragmentada, locks no verificados, búsquedas por nombre, ausencia de catálogo común de IDs/rutas y fallback silencioso a la raíz de Drive.
- **Acción ejecutable:** consolidar el catálogo institucional de carpetas y rutas con IDs estables, departamento, tipo de recurso y propietario; normalizar nombres y resolución; comprobar explícitamente la adquisición del bloqueo y manejar el caso de no adquisición; coordinar la creación entre proyectos Apps Script distintos, sin asumir que ScriptLock es global; eliminar el fallback silencioso a DriveApp.getRootFolder(); completar la estructura departamental y los helpers equivalentes en los servicios que la requieren.
- **Archivos/módulos relacionados:** backend/task-service/Code.gs, backend/user-service/Code.gs, backend/accounting-service/Code.gs, backend/academic-service/Code.gs y backend/exam-service/Code.gs.
- **Criterios de aceptación:** cada ruta se resuelve por ID canónico y contexto autorizado; la falta de configuración o permiso falla explícitamente; la creación concurrente no genera duplicados entre proyectos; todos los servicios aplicables usan el mecanismo común; los nombres equivalentes se normalizan; no se crean carpetas en la raíz por fallback.
- **Estado/prioridad:** conservar los valores vigentes de AUD-NG-154.

### [AUD-NG-155] Vincular archivos físicos con registros institucionales y metadatos
- **Hallazgo de origen:** evidencia técnica 2 y 4; carpetas/archivos pueden crearse sin relación institucional persistida de forma uniforme y no existe conciliación completa de referencias.
- **Acción ejecutable:** registrar metadatos y vínculo estable entre cada archivo físico, su carpeta canónica y el registro institucional correspondiente; conservar departamento, tipo documental, propietario y referencia del expediente/registro según el modelo existente.
- **Criterios de aceptación:** cada archivo gestionado conserva ID estable y referencia institucional válida; la consulta del registro resuelve el archivo autorizado; referencias rotas o inexistentes se detectan y no se presentan como vínculos válidos.
- **Estado/prioridad:** conservar los valores vigentes de AUD-NG-155.

### [AUD-NG-058 / TASK-143] Retirar exposición pública y proteger adjuntos/documentos
- **Hallazgo de origen:** evidencia técnica 3; usos de ANYONE_WITH_LINK en ACCOUNTING, USER y TASK, incluida una carpeta pública de entregas con posible herencia de acceso.
- **Acción ejecutable:** eliminar la exposición pública no autorizada de comprobantes, documentos laborales, adjuntos de trámites, imágenes de noticias y entregas; inventariar y remediar enlaces públicos preexistentes; aplicar acceso mediado por autorización y verificar permisos efectivos/heredados antes de devolver enlaces.
- **Archivos/módulos relacionados:** backend/accounting-service/Code.gs, backend/user-service/Code.gs y backend/task-service/Code.gs.
- **Criterios de aceptación:** no existen permisos ANYONE_WITH_LINK salvo excepción explícita, aprobada y documentada; usuarios no autorizados no pueden abrir archivos mediante URL directa; la carpeta de entregas no propaga acceso público; se inspeccionan y corrigen recursos preexistentes y nuevos.
- **Estado/prioridad:** conservar los valores vigentes de AUD-NG-058 y TASK-143.

### [TASK-139 / TASK-140 / TASK-295 / TASK-346] Aplicar permisos granulares, sensibilidad y control de herencia
- **Hallazgo de origen:** evidencia técnica 3; ausencia de matriz institucional de permisos de Drive por operación y de comprobaciones de permisos heredados.
- **Acción ejecutable:** aplicar reglas explícitas por lectura, edición, creación y eliminación; clasificar sensibilidad documental; restringir por departamento/expediente; revisar y revocar accesos residuales y permisos heredados que excedan la autorización vigente.
- **Criterios de aceptación:** cada operación valida actor, recurso y ámbito; los permisos heredados se evalúan; cambios de rol/departamento revocan accesos residuales; los documentos sensibles no quedan accesibles por enlace público ni por permisos amplios heredados.
- **Estado/prioridad:** conservar los valores vigentes de cada tarea.

### [TASK-345] Conciliar Drive con los registros institucionales
- **Hallazgo de origen:** evidencia técnica 4; falta de detección general de archivos/carpetas inexistentes, movidos, inaccesibles, huérfanos o con referencias rotas.
- **Acción ejecutable:** ejecutar conciliación entre IDs de Drive y registros institucionales; detectar discrepancias sin borrar datos automáticamente; registrar estado, causa y acción de reparación autorizada.
- **Criterios de aceptación:** la conciliación identifica archivos faltantes, movidos, inaccesibles, huérfanos y referencias rotas; los resultados son trazables y la reparación respeta permisos y conserva historial.
- **Estado/prioridad:** conservar los valores vigentes de TASK-345.

### [TASK-149 / TASK-150 / TASK-456] Implementar conservación, archivo y disposición controlada
- **Hallazgo de origen:** evidencia técnica 4; ausencia de un ciclo común de mover, archivar, conservar o eliminar documentos con autorización y trazabilidad.
- **Acción ejecutable:** completar políticas y flujos de conservación, archivo, traslado y disposición/eliminación; validar autorización y periodo de retención; registrar actor, motivo, fecha, ubicación anterior/nueva y evidencia de la operación.
- **Criterios de aceptación:** ningún documento se elimina o traslada sin autorización y política aplicable; las operaciones quedan auditadas; la recuperación y consulta respetan el historial y las reglas de acceso.
- **Estado/prioridad:** conservar los valores vigentes de cada tarea.

### Reconciliación y límites
- AUD-NG-154 conserva jerarquía, nombres, IDs/rutas y cargas; AUD-NG-155 conserva metadatos y vínculo archivo-registro.
- AUD-NG-058/TASK-143 conservan privacidad y remediación de enlaces; TASK-139/140/295/346 conservan permisos granulares, sensibilidad, herencia y revocación.
- TASK-345 conserva conciliación Drive-registros; TASK-149/150/456 conservan retención, archivo y disposición controlada.
- No se crean identificadores nuevos ni se declara ejecutada ninguna corrección. TAREA-06 permanece en CUMPLE PARCIALMENTE.
- **Límites:** inspección estática/manual. No se inspeccionaron ACL reales, permisos heredados, Shared Drives ni accesos anónimos en producción; no se ejecutaron pruebas de concurrencia o permisos.
