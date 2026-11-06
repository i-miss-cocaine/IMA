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
