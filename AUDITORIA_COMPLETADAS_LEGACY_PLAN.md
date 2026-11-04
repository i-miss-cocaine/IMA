# Plan de auditoría de completadas_legacy.md

**Fecha de inicio:** 2026-11-04  
**Repositorio:** i-miss-cocaine/IMA  
**Rama de trabajo:** `NG_beta`  
**Registro auditado:** `completadas_legacy.md` (blob SHA `c9622ea9e03ec16dcecb12ae97b17b89ed204157`)  
**Metodología:** `METODOLOGIA_DESARROLLO.md` (blob SHA `1a2d4de602a1449b697c2da82ab6423e7c61b280`)

## 1. Alcance

Auditar las 49 entradas históricas que el registro marca como completadas. La marca histórica no se acepta como evidencia de implementación. Cada requisito se contrasta con el código vigente de `NG_beta`, su arquitectura actual, los cambios posteriores que lo hayan reemplazado y la calidad de la implementación que permanece activa.

Inventario declarado por el registro:
- 18 correcciones, estabilizaciones y revisiones históricas.
- 19 requerimientos de expansión.
- 12 requerimientos de gestión docente, contenidos, guías y tareas.
- **Total: 49 tareas.**

## 2. Criterios de evaluación por tarea

1. **Trazabilidad:** identificar requisito original, archivos afectados y commits posteriores relacionados.
2. **Cumplimiento funcional:** contrastar cada criterio verificable con el comportamiento que implementa el código actual.
3. **Vigencia histórica:** distinguir implementación vigente, reemplazo posterior, migración parcial, regresión o funcionalidad retirada justificadamente.
4. **Calidad:** revisar validaciones, casos límite, seguridad, permisos del servidor, persistencia, concurrencia, idempotencia, manejo de errores, acoplamiento, duplicación y mantenibilidad cuando sean pertinentes.
5. **Evidencia:** anotar rutas y rangos de líneas, referencias de commits y pruebas existentes. La existencia de pruebas o etiquetas no se considera por sí sola prueba suficiente.
6. **Estado de auditoría:** `Cumple`, `Cumple parcialmente`, `No cumple`, `Reemplazada por implementación posterior`, `Regresión detectada` o `No verificable con la evidencia disponible`.

No se modificará código fuente durante esta auditoría. No se cambiarán las marcas históricas de `completadas_legacy.md`.

## 3. Orden de trabajo y lotes

| Lote | Tareas | Enfoque |
|---|---|---|
| A | UNIF-001, FIX-001, HIST-001, AUTH-001, PROF-001, NAV-001 | Configuración, historial, autorización y navegación académica |
| B | CORS-001, LOOP-001, UI-001, DB-001 | Red, ciclo de carga, navegación estudiantil y esquema tabular |
| C | CONF-001, DATE-001, NAV-002, STUD-002, POST-001, MOD-001, FIX-002, FIX-003 | Configuración vigente, fechas, navegación, historial y modularización |
| D | REQ-EXP-001 a REQ-EXP-006 | Metodología, datos y núcleo académico |
| E | REQ-EXP-007 a REQ-EXP-013 | Identidad, RBAC, matrícula y finanzas |
| F | REQ-EXP-014 a REQ-EXP-019 | Planillas, inventarios, noticias, consola, logs y respaldos |
| G | REQ-DOC-001 a REQ-DOC-006 | Guías, contenido docente, tareas y disponibilidad |
| H | REQ-DOC-007 a REQ-DOC-012 | Dashboard estudiantil, Drive, metadatos, exportación, analítica y seguridad |

Cada lote tendrá un informe y commit documental independiente después de completar la inspección y la verificación del propio informe. Si un lote es demasiado extenso, se subdividirá sin combinar cambios no relacionados.

## 4. Entregables y controles

- `Auditoria.txt`: hallazgos objetivos, con evidencia y severidad.
- `Pendientes.md`: tareas nuevas concretas derivadas de hallazgos, sin borrar ni reescribir registros existentes.
- `MapaDependencias.md`: actualizar solo las relaciones que hayan sido inspeccionadas y verificadas.
- Informes de lote: conservar el estado de cada una de las 49 tareas y sus referencias.
- Commits modulares en `NG_beta`; verificar cada escritura y no integrar ramas externas.

## 5. Condiciones iniciales observadas

- `METODOLOGIA_DESARROLLO.md` está presente en `NG_beta`; sus instrucciones se consideran obligatorias. No se modificará su contenido.
- No se encontró `contexto_personal.md` ni `contexto_personal.md`/variantes de mayúsculas consultadas en la raíz de `NG_beta`. Se continuará respetando las reglas de trabajo previamente establecidas para el repositorio: operar únicamente en `NG_beta`, preservar registros y no hacer merges.
- `completadas_legacy.md` conserva las 49 entradas históricas y advierte que su estado no certifica implementación funcional.
- `Pendientes.md` en la raíz de `NG_beta` se recuperó como archivo de contenido vacío (blob SHA `482cfd7a49bc9cc04a1d4d609a70bb1bfda55768`). No se asumirá que puede reemplazarse: antes de cualquier actualización se investigará su historial y se preservará cualquier contenido recuperable.
- `MapaDependencias.md` existe, pero su encabezado corresponde a v7.6.1; se tratará como referencia heredada y se verificará antes de confiar en sus relaciones.
- `Auditoria.txt` y `ChangesLogs.txt` contienen registros históricos extensos; cualquier adición deberá anexarse sin alterar el contenido previo.

## 6. Estado de avance

**Plan creado. Auditoría de las 49 tareas: pendiente de ejecución.**  
Primer paso: inspección manual del lote A, comenzando por las funciones y dependencias del servicio académico y del servicio de usuarios. No se declara ningún requisito aprobado hasta disponer de evidencia del código vigente.
