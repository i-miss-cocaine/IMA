# Organización departamental de pendientes

Este directorio contiene la distribución departamental de las tareas históricas recuperadas desde `/Pendientes.md`. El archivo de origen se conserva intacto y no forma parte de los archivos operativos departamentales.

## Estructura

```text
pendientes/
├── README.md
├── Dirección/Pendientes.md
├── Secretaria/Pendientes.md
├── Contabilidad/Pendientes.md
├── Docente/Pendientes.md
├── Estudiante/Pendientes.md
└── Otros/Pendientes.md
```

## Jerarquía para asignación única

Cuando una tarea afecte a más de un departamento, se registra una sola vez en el departamento de mayor prioridad de esta lista:

1. Dirección
2. Secretaria
3. Contabilidad
4. Docente
5. Estudiante
6. Otros

La asignación se determina por la responsabilidad principal del trabajo, no solo por los archivos técnicos que menciona. Dirección recibe los asuntos de gobierno institucional, supervisión y control transversal; Secretaria, matrícula, expedientes y comunicación institucional; Contabilidad, operaciones financieras, planillas, activos y proveedores; Docente, configuración académica, enseñanza y evaluación; Estudiante, funciones cuyo responsable principal es la experiencia estudiantil; Otros, infraestructura técnica transversal sin propietario funcional más específico.

## Integridad de la migración

- Fuente: `/Pendientes.md` (solo lectura).
- Blob SHA de la fuente: `8867ecf1f58f768cac8fa5ddaa7b50bb68e57158`.
- Total migrado: **49 tareas**.
- Distribución: Dirección: 10; Secretaria: 7; Contabilidad: 6; Docente: 20; Estudiante: 5; Otros: 1.
- Se conservan tareas completadas y pendientes, sin cambiar sus estados ni resumir su contenido.
- No se duplican tareas entre departamentos.
- Los archivos departamentales son los destinos operativos para futuras actualizaciones de sus tareas.
