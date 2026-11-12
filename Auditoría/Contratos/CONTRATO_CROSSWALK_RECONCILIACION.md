# Contrato de preflight de reconciliación de catálogos departamentales

**Tarea:** PM-01 / TASK-153 / T153-S01-4 (preflight técnico, no decisión institucional).  
**Estado:** reporte puro de solo lectura y fixtures sintéticos; no ejecuta migraciones.

## Entrada y autoridad

El reporte compara un catálogo fuente con un catálogo canónico para un único InstitutionID/Domain. Exige snapshots y crosswalk prefiltrados por tenant/dominio con scope verificado por el servidor; una decisión de autoridad explícita y aprobada para el catálogo canónico con ApprovalReference, ApprovedBy, ApprovedAt y Version; un instante de evaluación del servidor; y filas crosswalk que declaran InstitutionID, Domain, SourceCatalog, CanonicalCatalog, SourceID, CanonicalID, Status, Approved, ApprovalReference, ApprovedBy, ApprovedAt, ValidFrom, ValidTo y RevokedAt.

La función no elige la autoridad. Sin decisión aprobada, con decisión fuera de ámbito o sin snapshots verificados, falla cerrada.

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
