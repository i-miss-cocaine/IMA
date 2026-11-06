# Migración departamental del backlog histórico

**Estado:** reconstruida desde la copia histórica íntegra; sustituye la distribución anterior basada en una instantánea incompleta.

## Fuente y trazabilidad

- Fuente: `RECUPERACION/Pendientes_RECUPERADO.md`
- Rama y commit de origen: `NG_beta_0.0.0.1`, `44d9891132332e692dbe2ba8602b41f50a508a59`
- Blob SHA-1: `ef47d232db3ed46317dc14f22b1cdf8f938e8405`
- Tamaño Git: **1.443.391 bytes**
- Líneas: **17.884**
- Las **16.872 líneas** de `New_Generation:/Pendientes.md` coinciden exactamente con el prefijo de esta fuente.

## Inventario migrado

- **33** tareas históricas completadas de F10/F11.
- **432** bloques reales con identificador `TASK`.
- **465** registros migrados en total, sin IDs duplicados.
- Se excluyeron **41 encabezados estructurales** de prioridad o bloque; no son tareas.
- `TASK-050` y `TASK-051` sí existen como tareas reales en la fuente y se conservan en Dirección.
- Estados visibles en los encabezados de los 432 bloques `TASK`: 50 `[X]`, 108 `[ ]` y 274 sin casilla explícita. Los 33 registros históricos F10/F11 llevan `[X]`. No se infirió ni alteró ningún estado.

## Distribución única por departamento

| Departamento | Tareas |
|---|---:|
| Dirección | 86 |
| Secretaria | 140 |
| Contabilidad | 89 |
| Docente | 30 |
| Estudiante | 7 |
| Otros | 113 |
| **Total** | **465** |

## Registros que no se duplican

- La fuente contiene **104 encabezados `AUD-NG`**. Se conservan íntegros en el archivo de recuperación, pero no se copian a los departamentos: las tareas derivadas de auditoría deben permanecer en el informe que contiene su hallazgo, conforme a la sección 3.4 de `METODOLOGIA_DESARROLLO.md` y `AUDITORIAS/README.md`.
- Las tareas de auditoría posteriores registradas en informes oficiales continúan en esos informes; esta migración no crea un backlog paralelo.

## Regla de clasificación

Jerarquía de asignación única: **Dirección → Secretaria → Contabilidad → Docente → Estudiante → Otros**. La decisión se basa en la responsabilidad funcional principal, no únicamente en los archivos técnicos mencionados. Dirección concentra gobierno y supervisión institucional; Secretaria, expedientes, trámites y comunicaciones; Contabilidad, finanzas, planillas, compras y activos; Docente, enseñanza, evaluación y recursos académicos; Estudiante, experiencia y autoservicio estudiantil; Otros, infraestructura transversal y pruebas compartidas.

## Sustitución de la migración anterior

La distribución anterior de 49 registros se generó desde `/Pendientes.md`, una instantánea de **30.744 bytes** (blob `8867ecf1f58f768cac8fa5ddaa7b50bb68e57158`), que no era la fuente histórica íntegra. Esa distribución queda **supersedida** y no se mezcla con esta migración. Su estado anterior permanece recuperable en el historial Git; los registros que no forman parte del blob histórico requerirán reconciliación independiente antes de incorporarse.

## Integridad

- Cada bloque se conserva textualmente desde `RECUPERACION/Pendientes_RECUPERADO.md`; los comentarios agregados solo documentan rango y departamento.
- Cada registro aparece una sola vez.
- La comparación exacta contra el blob fuente confirmó que los 465 bloques departamentales coinciden íntegramente con sus bloques originales.
- Los 41 encabezados estructurales de prioridad/bloque se excluyeron; no son tareas ejecutables.
- `TASK-050` y `TASK-051` son tareas reales de la fuente, no encabezados estructurales.
- No se copiaron encabezados `AUD-NG` ni separadores de prioridad como si fueran tareas.
- La fuente de recuperación, `/Pendientes.md`, `/pendiente_legacy.md`, informes de auditoría, código y pruebas no se modifican en esta iteración.
- Los archivos departamentales son una distribución histórica; las nuevas tareas derivadas de auditoría se registran en sus informes oficiales.
