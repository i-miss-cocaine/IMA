# Backlog departamental consolidado

**Corte de migración:** 2026-11-09  
**Estado:** etapa 1 consolidada. Las tareas de estos archivos quedan pendientes de ejecución y verificación.

## Inventario migrado

Se consolidaron **1.346 tareas únicas** a partir de:

- **219** archivos de informes, planes y bitácoras de `AUDITORIAS/`.
- `Pendientes.md`: tareas con ID, marcadas y no marcadas como completadas, además de registros `AUD-NG` accionables.
- `completadas.md`: todas las tareas identificadas.
- Los seis archivos departamentales que ya existían en esta carpeta.

Los registros con el mismo identificador se reunieron en una sola tarea. Se conservaron las fuentes en comentarios HTML dentro de cada registro y se mantienen intactos los documentos originales.

## Distribución

| Departamento / perfil | Archivo | Tareas |
|---|---|---:|
| Dirección | `Dirección/Pendientes.md` | 145 |
| Secretaría | `Secretaria/Pendientes.md` | 194 |
| Contabilidad | `Contabilidad/Pendientes.md` | 184 |
| Docente | `Docente/Pendientes.md` | 129 |
| Estudiante | `Estudiante/Pendientes.md` | 7 |
| Padre | `Padre/Pendientes.md` | 13 |
| Otros | `Otros/Pendientes.md` | 674 |
| **Total** | | **1.346** |

## Reglas de esta migración

1. Todas las tareas se presentan como pendientes, sin marca `[X]` ni estado de completado.
2. Las tareas que comparten identificador se integran en un solo registro; no se mantienen como tareas separadas por aparecer en varias fuentes.
3. Se eliminan líneas de requisitos textualmente idénticas tras normalizar espacios y capitalización.
4. Se conservan los títulos originales alternativos y las formulaciones de requisitos que difieren; no se resumen, parafrasean ni descartan para forzar una deduplicación semántica no demostrada.
5. Cada tarea conserva sus identificadores, alcance, requisitos, criterios, dependencias, archivos, prioridades y referencias de origen disponibles.
6. La asignación se realiza por responsabilidad funcional principal. Se conserva la asignación previa cuando ya existía; las funciones dirigidas al portal/autoservicio familiar se agrupan en **Padre**; la infraestructura y las pruebas transversales se agrupan en **Otros**.
7. Los informes originales de auditoría, `Pendientes.md` y `completadas.md` se mantienen sin modificación como fuentes históricas. El estado operativo de las tareas migradas se controla desde estos archivos departamentales.

## Alcance y excepción expresa

Esta etapa ejecuta la instrucción específica de migrar también tareas marcadas como completadas desde `Pendientes.md` y todas las tareas de `completadas.md`. Para esta migración, esa instrucción específica prevalece sobre el flujo general descrito en la sección 3.4 de `METODOLOGIA_DESARROLLO.md`. No se está certificando que el código carezca de esas implementaciones; simplemente se reabren como pendientes para una revisión posterior.

## Control de calidad pendiente

La migración automática consolidó IDs y duplicados textuales exactos. La revisión semántica de requisitos con redacciones distintas debe hacerse sin eliminar formulaciones hasta confirmar que expresan exactamente el mismo requisito. Ninguna tarea se considera implementada por el hecho de haber sido migrada.
