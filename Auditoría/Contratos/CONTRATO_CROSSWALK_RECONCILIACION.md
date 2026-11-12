# Contrato de preflight de reconciliación de catálogos departamentales

**Tarea:** PM-01 / TASK-153 / T153-S01-4 (preflight técnico, no decisión institucional).  
**Estado:** reporte puro de solo lectura y fixtures sintéticos; no ejecuta migraciones.

## Entrada y autoridad

El reporte compara un catálogo fuente con un catálogo canónico para un único InstitutionID/Domain. Exige snapshots y crosswalk prefiltrados por tenant/dominio con scope verificado por el servidor; una decisión de autoridad explícita, aprobada y verificada por servidor para el catálogo canónico con ApprovalReference, ApprovedBy, ApprovedAt y Version; un instante de evaluación del servidor; y filas crosswalk que declaran InstitutionID, Domain, SourceCatalog, CanonicalCatalog, SourceID, CanonicalID, Status, Approved, ApprovalReference, ApprovedBy, ApprovedAt, ValidFrom, ValidTo y RevokedAt.

La función no elige la autoridad. Sin decisión aprobada, con decisión fuera de ámbito o sin snapshots, crosswalk o decisión de autoridad verificados, falla cerrada.

## Clasificaciones por registro fuente

- EXACT_MATCH: igualdad de clave estable en ambos catálogos; no usa nombre.
- APPROVED_EQUIVALENCE: mapping explícito aprobado y vigente, de uno a uno.
- RELATION_1_N: un ID fuente tiene varios destinos canónicos.
- RELATION_N_1: varios IDs fuente convergen en un destino.
- RELATION_1_N_AND_N_1: ambas condiciones aparecen en el mismo conjunto.
- NO_CORRESPONDENCE: no hay ID igual ni mapping.
- CONFLICT: fuente/destino inactivo o fuera de vigencia, mapping no aprobado, revocado, futuro/vencido, duplicado, target inexistente, ID exacto con crosswalk contradictorio u otra ambigüedad.

Los nombres se devuelven como evidencia de presentación, nunca se usan para emparejar. Los mappings 1:N/N:1 se informan; no se escoge un destino automáticamente.

## Salida y seguridad

El reporte devuelve autoridad y versión aprobadas, matriz fuente, IDs/nombres candidatos, referencias y aprobadores del crosswalk, problemas, crosswalk huérfanos, cobertura inversa del catálogo canónico y resumen por clasificación. No resuelve conflictos ni escribe datos.

resolveDepartmentCatalogReference_ exige que cada mapping declare el CanonicalCatalog exacto, ApprovedBy y ApprovedAt válidos y no futuros, además de Approved=true, ApprovalReference, estado activo, vigencia y ausencia de revocación.

## Límites

No se consulta información real, no se crea/actualiza ConfiguracionInstitucional, no se generan crosswalks, no se migran IDs, no se reasignan recursos y no se cambia el propietario del dato. La decisión de autoridad y la clasificación de filas reales siguen pendientes de evidencia institucional.


## C1.651 — consultas y lotes de importación departamentales

`filterDepartmentScopedRecords_` aplica el filtro de departamento a resultados de consultas/listados obtenidos en servidor. Requiere actor autenticado, snapshot de institución/dominio y snapshot de ownership verificados. Cada fila debe tener una única referencia ResourceOwnership verificada; ownership ausente, duplicado o fuera de institución falla cerrado. Los resultados de otro departamento se omiten sin exponer su existencia ni conteos. Los eventos de auditoría son internos y deben persistirse antes de responder. El consumidor sigue aplicando RBAC por operación y minimización de campos.

`validateDepartmentalImportScope_` valida el lote completo antes de cualquier escritura. Exige membresía y departamento destino verificados por servidor, limita destinos a departamentos autorizados o a alcance institucional explícito; rechaza lotes mezclados para actores departamentales y solo admite destinos múltiples para alcance institucional con snapshot de destinos por fila verificado; rechaza cualquier fila con InstitutionID distinto. Devuelve el departamento efectivo y número de filas, pero no escribe ni transforma registros.

Ambos contratos son puros y no tienen callsites productivos en esta entrega. No sustituyen la integración de filtros en cada endpoint ni la atomicidad/rollback del importador real.
