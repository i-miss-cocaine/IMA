# AUDITORÍA FUNCIONAL, TÉCNICA Y DOCUMENTAL — FASE 35

**Fase:** 35 — Importador inteligente de Excel, CSV y hojas de cálculo
**Área:** Ingesta masiva de datos, reconocimiento semántico, normalización regional, detección de duplicados, validación contextual, simulación, ejecución por lotes y reversión segura.
**Fecha de Evaluación:** 2026-10-31
**Estado General:** Implementada Parcialmente con Brechas Críticas en Mapeo Semántico, Detección de Conflictos y Reversión

---

## A. IDENTIFICACIÓN Y ALCANCE

### 1. Propósito y Objetivos
Evaluar integralmente las capacidades del importador inteligente de datos tabulares (archivos XLSX, XLS y CSV) en la Plataforma Integral de Gestión Educativa, considerando el flujo completo desde la selección del archivo hasta su validación estructural, correspondencia semántica con los campos del modelo institucional, simulación de efectos (`Crear`, `Actualizar`, `Sin Cambios`, `Omitir`, `Revisión`, `Error`), ejecución segura con control de duplicados e idempotencia, y reversión selectiva ante errores.

### 2. Alcance Previsto y Efectivo
- **Reconocimiento de Formatos y Estructura:** Detección de archivos XLSX/CSV, hojas múltiples, filas de encabezado desplazadas y rangos de datos en cliente (`SheetJS / xlsx.full.min.js`) y backend.
- **Correspondencia Semántica:** Reconocimiento de sinónimos (`Alumno` -> `Estudiante`, `Cantidad` -> `Importe`, `No. Cuenta` -> `Cuenta`), tolerancia a variaciones tipográficas y desvinculación estricta de la posición fija de columnas.
- **Validación y Simulación sin Guardar:** Inspección de `validateImportPreview` en `backend/accounting-service/Code.gs` y previsualización de cambios en interfaz.
- **Ejecución Idempotente y Trazabilidad:** Inspección de `importDataWithColumnMapping` y bitácora en hoja `AuditoriaMigraciones`.
- **Integridad de Tipos de Datos y Normalización Regional:** Tratamiento de identificadores con ceros a la izquierda (`00125`), números largos, fechas ambiguas (`DD/MM/AAAA` vs. `MM/DD/AAAA`) e importes monetarios.
- **Seguridad y Acceso:** Control de roles RBAC/ABAC sobre operaciones de importación masiva.

---

## B. INVENTARIO TÉCNICO Y COMPONENTES IDENTIFICADOS

| Componente | Archivo / Fuente | Función Principal | Estado / Hallazgo |
|---|---|---|---|
| Vista Previa de Importación | `backend/accounting-service/Code.gs` | `validateImportPreview(payload)` | Implementada básica. Valida únicamente presencia de campo identificador. |
| Ejecución con Mapeo de Columnas | `backend/accounting-service/Code.gs` | `importDataWithColumnMapping(payload)` | Registra en `AuditoriaMigraciones`. No realiza transformaciones profundas ni valida relaciones de negocio. |
| Bitácora de Migraciones | `backend/accounting-service/Code.gs` | `getMigrationLogs(payload)` | Retorna historial de ejecuciones desde la hoja `AuditoriaMigraciones`. |
| Modal de Importación Frontend | `teacher-dashboard.html` | `#modal-excel-importer` | Interfaz modal con selector de módulo destino (`Docentes`, `Secretaría`, `Contabilidad`) y carga de archivos. |
| Controlador de Carga Frontend | `js/teacher.js` | Event listeners `#excel-file-input`, `#btn-submit-excel-import` | Utiliza `XLSX.read` y `sheet_to_json`. Toma la primera hoja y mapea por defecto la primera columna como ID. |
| Biblioteca SheetJS | `teacher-dashboard.html` | `https://cdn.jsdelivr.net/npm/xlsx@0.18.5/dist/xlsx.full.min.js` | Presente y operativa para parseo en cliente. |

---

## C. EVALUACIÓN DETALLADA POR SUBCAPACIDAD (F35-01 A F35-20)

### F35-01. Carga de archivos y reconocimiento de formatos
- **Estado:** Implementada Parcialmente.
- **Evidencia:** `js/teacher.js` (L7426-L7449) utiliza `FileReader` y `XLSX.read(data, { type: 'array' })`.
- **Brechas:**
  1. Si el archivo XLSX contiene múltiples hojas, el sistema lee automáticamente la primera hoja (`workbook.SheetNames[0]`), sin permitir al usuario elegir la hoja relevante.
  2. No valida tipos MIME reales en servidor ni detecta archivos corruptos o protegidos con contraseña antes de procesar.

### F35-02. Detección de hojas, encabezados y estructura de datos
- **Estado:** Requiere Mejoras.
- **Evidencia:** `XLSX.utils.sheet_to_json(worksheet, { defval: "" })` asume rígidamente que la fila 1 contiene los encabezados.
- **Brechas:** Si el archivo contiene títulos institucionales o notas en las primeras filas (ej. encabezados en fila 4), se generan nombres de columna basura (`__EMPTY`, `__EMPTY_1`) desfasando los datos.

### F35-03. Reconocimiento semántico de encabezados y sugerencias
- **Estado:** Ausente en Implementación Real.
- **Evidencia:** `js/teacher.js` (L7472) envía rígidamente `columnaMapeo: { identificador: Object.keys(parsedExcelData[0] || {})[0] || 'ID' }`.
- **Brechas:** No existe diccionario de sinónimos, ni análisis de similitud (Levenshtein), ni sugerencias automáticas de mapeo semántico.

### F35-04. Interfaz de correspondencias y nombres descriptivos
- **Estado:** Ausente en UI.
- **Evidencia:** El modal `#modal-excel-importer` solo muestra un resumen de texto plano (`Total de Filas Leídas` y lista cruda de columnas) sin controles interactivos de mapeo columna -> campo de destino.

### F35-05. Exclusión de columnas, selección de rangos y configuración de origen
- **Estado:** Ausente.
- **Brechas:** No es posible desmarcar columnas irrelevantes, ni acotar el rango de filas a procesar desde la interfaz.

### F35-06. Interpretación de tipos de datos y normalización
- **Estado:** Defectuosa.
- **Brechas:**
  1. SheetJS convierte códigos con ceros a la izquierda (`00125`) a enteros (`125`) salvo que se fuerce lectura como texto puro (`raw: false`).
  2. No hay soporte para desambiguar fechas (`DD/MM/AAAA` vs. `MM/DD/AAAA`) ni normalizar importes con coma decimal (`1.250,50`).

### F35-07. Validación de campos obligatorios y reglas de negocio
- **Estado:** Implementada Parcialmente.
- **Evidencia:** `validateImportPreview` comprueba únicamente la presencia del campo clave de identificación. No valida tipos de datos, longitudes ni restricciones de catálogo.

### F35-08. Validación de referencias y relaciones entre registros
- **Estado:** Ausente en Importador.
- **Brechas:** No valida si el estudiante (`estudianteId`), la cuenta bancaria o la matrícula existen previamente en la base de datos, arriesgando la inserción de registros huérfanos.

### F35-09. Detección de duplicados y conflictos
- **Estado:** Ausente.
- **Brechas:** No detecta filas repetidas dentro del archivo ni compara contra la base de datos para diferenciar registros nuevos de existentes.

### F35-10. Vista previa de efectos de la importación
- **Estado:** Requiere Mejoras.
- **Evidencia:** Solo muestra conteo total de filas. No categoriza en `Crear`, `Actualizar`, `Omitir` o `Error`.

### F35-11. Validación sin guardar y control de ejecución
- **Estado:** Implementada Parcialmente.
- **Evidencia:** `validateImportPreview` existe en backend pero el botón frontend `btn-submit-excel-import` envía directamente a `importDataWithColumnMapping` sin requerir validación previa aprobada.

### F35-12. Ejecución segura, consistencia e idempotencia
- **Estado:** Requiere Mejoras.
- **Brechas:** `importDataWithColumnMapping` no ejecuta las inserciones efectivas en las tablas de destino (solo registra el resumen en `AuditoriaMigraciones`). Carece de ScriptLock contra concurrencia.

### F35-13. Informe descargable de errores y resultados
- **Estado:** Requiere Mejoras.
- **Evidencia:** Los errores se almacenan en JSON en `AuditoriaMigraciones` (limitados a 20 errores) pero no hay botón para descargar el CSV de filas rechazadas.

### F35-14. Perfiles de mapeo reutilizables
- **Estado:** Ausente.
- **Brechas:** No existe tabla ni interfaz para guardar plantillas de mapeo por proveedor o formato recurrente.

### F35-15. Historial, trazabilidad y reversión de importaciones
- **Estado:** Implementada Parcialmente (Trazabilidad Sí, Reversión No).
- **Evidencia:** `getMigrationLogs` permite auditar ejecuciones pasadas. No existe función de reversión o desecho seguro de lotes.

### F35-16. Seguridad y permisos del proceso de importación
- **Estado:** Completa y Verificada en Backend.
- **Evidencia:** `validateImportPreview` e `importDataWithColumnMapping` están restringidos a `Director`, `Subdirector`, `Contador` y `Administrador` en `ROLE_PERMISSIONS`.

### F35-17. Experiencia de usuario y asistencia durante la importación
- **Estado:** Requiere Mejoras.
- **Brechas:** Asistente lineal ausente; modal estático sin navegación paso a paso (1. Archivo -> 2. Mapeo -> 3. Validación -> 4. Confirmación).

### F35-18. Rendimiento y procesamiento de archivos grandes
- **Estado:** Requiere Mejoras.
- **Brechas:** Si el archivo supera 500 filas, transferir todo el payload JSON en una sola solicitud GAS puede agotar cuotas de memoria o tiempos máximos de ejecución (6 min).

### F35-19. Recuperación ante fallos y conservación de archivos de trabajo
- **Estado:** Requiere Mejoras.
- **Brechas:** No se conserva el binario original en Drive para auditoría forense ante reclamos.

### F35-20. Capacidad de ampliación a nuevos módulos y tipos de información
- **Estado:** Implementada Parcialmente.
- **Evidencia:** Selector `excel-target-module` admite `Docentes`, `Secretaria` y `Contabilidad`, pero el backend carece de esquemas dinámicos por entidad.

---

## D. COMPARACIÓN FUNCIONAL EXTERNA

- **PowerSchool SIS:** Asistente por pasos con diccionario de correspondencias semánticas, pre-validación sin persistencia y generación de archivo de rechazos con el motivo exacto por fila.
- **Odoo Data Import:** Detección automática de encabezados desplazados, correspondencia probabilística basada en contenido de celda y simulación visual con conteo de registros nuevos vs. modificados.
- **Xero:** Perfiles de importación guardados para extractos bancarios y reglas estrictas de formato regional (`DD/MM/YYYY` vs. `MM/DD/YYYY`).

---

## E. LISTA MAESTRA DE CARACTERÍSTICAS (CAR-F35)

| ID | Característica | Prioridad | Estado Funcional | Acción Recomendada |
|---|---|---|---|---|
| F35-01 | Carga y reconocimiento de formatos | P0 | Implementada Parcialmente | Selector de hojas XLSX y validación de cabecera |
| F35-02 | Detección de encabezados y rangos | P0 | Requiere Mejoras | Selector interactivo de fila de encabezados |
| F35-03 | Reconocimiento semántico | P0 | Ausente | Motor de sinónimos y coincidencia difusa |
| F35-04 | Interfaz de correspondencias | P0 | Ausente | Tabla visual de mapeo interactivo |
| F35-05 | Exclusión de columnas y filas | P0 | Ausente | Checkboxes de inclusión/exclusión de campos |
| F35-06 | Tipos de datos y formatos regionales | P0 | Defectuosa | Preservación de ceros a izquierda y normalizador de fechas/moneda |
| F35-07 | Validación de campos y reglas | P0 | Implementada Parcialmente | Validaciones estrictas por tipo de entidad |
| F35-08 | Validación de relaciones y referencias | P0 | Ausente | Verificación de existencia de estudiantes/cuentas |
| F35-09 | Detección de duplicados y conflictos | P0 | Ausente | Matching por ID y campos compuestos |
| F35-10 | Vista previa de efectos | P0 | Requiere Mejoras | Matriz de simulación (Crear / Actualizar / Omitir) |
| F35-11 | Validación previa sin guardar | P0 | Implementada Parcialmente | Puerta obligatoria previa a confirmación |
| F35-12 | Ejecución segura e idempotencia | P0 | Requiere Mejoras | Inserción real con ScriptLock y claves de idempotencia |
| F35-13 | Informe descargable de errores | P0 | Requiere Mejoras | Generador de CSV de filas observadas |
| F35-14 | Perfiles de mapeo reutilizables | P1 | Ausente | Persistencia de plantillas en `PerfilesMapeoImportacion` |
| F35-15 | Historial y reversión segura | P0 | Implementada Parcialmente | Servicio de reversión selectiva de lotes |
| F35-16 | Seguridad y permisos RBAC | P0 | Completa y Verificada | Mantener aislamiento y verificación de sesión |
| F35-17 | Asistente de usuario guiado | P1 | Requiere Mejoras | Flujo en 4 pasos (Archivo, Mapeo, Validación, Resultado) |
| F35-18 | Procesamiento por lotes | P1 | Requiere Mejoras | Chunking de 200 filas para evitar límites GAS |
| F35-19 | Recuperación ante fallos | P1 | Requiere Mejoras | Respaldo del archivo en Google Drive |
| F35-20 | Esquemas dinámicos multi-módulo | P1 | Implementada Parcialmente | Catálogo centralizado de entidades importables |

---

## F. RESULTADOS DE PRUEBAS INTEGRALES (PT-F35-01 A PT-F35-12)

| Escenario | Objetivo | Resultado Esperado | Resultado Observado | Estado |
|---|---|---|---|---|
| **PT-F35-01: Encabezados semánticos de pagos** | Probar correspondencia semántica | Mapea 'Alumno' a 'Estudiante' | Asigna rígidamente primera columna | **No Aprobado** |
| **PT-F35-02: Columnas en orden alterado** | Independencia de posición | Mapeo idéntico | Se desalinea si cambia el orden | **No Aprobado** |
| **PT-F35-03: Encabezados ambiguos** | Detección de ambigüedad | Solicita confirmación | Asigna primera columna a ID | **No Aprobado** |
| **PT-F35-04: Referencias inexistentes** | Validar IDs de alumnos/cuentas | Alerta de matrícula no encontrada | No valida contra base de datos | **No Aprobado** |
| **PT-F35-05: Duplicados internos/externos** | Detección de duplicaciones | Clasifica duplicados | Ignora duplicaciones | **No Aprobado** |
| **PT-F35-06: Formatos de fecha y ceros** | Preservar `00125` y fechas | Conserva ceros e interpreta fecha | Convierte a número `125` | **No Aprobado** |
| **PT-F35-07: Encabezados en fila 4** | Ignorar filas de título | Permite elegir fila 4 | Toma fila 1 y genera columnas inválidas | **No Aprobado** |
| **PT-F35-08: CSV con delimitador punto y coma** | Parseo de CSV regional | Interpreta columnas | Falla si delimitador no es coma | **No Aprobado** |
| **PT-F35-09: Reversión selectiva** | Revertir lote de importación | Revierte registros no modificados | Endpoint de reversión no implementado | **No Aprobado** |
| **PT-F35-10: Reintento idempotente** | Evitar duplicar por reintento | Detecta lote ya importado | No valida idempotencia | **No Aprobado** |
| **PT-F35-11: Permisos de acceso** | Bloquear rol no autorizado | Error 403 en backend | Bloqueado exitosamente por RBAC | **Aprobado** |
| **PT-F35-12: Perfil reutilizable** | Guardar y reusar mapeo | Aplica mapeo guardado | Funcionalidad ausente | **No Aprobado** |

---

## G. PLAN DE RESOLUCIÓN PRIORIZADO

### Bloque P0: Integridad, Reconocimiento Semántico y Ejecución Segura
1. **[F35-Task01] Motor de reconocimiento semántico de encabezados y mapeo interactivo:**
   - Implementar diccionario de sinónimos y algoritmo de coincidencia difusa para sugerir correspondencias automáticamente con independencia de la posición de columnas.
   - Construir interfaz visual de correspondencia en el modal de importación.
2. **[F35-Task02] Normalizador de tipos de datos, formatos regionales y preservación de identificadores:**
   - Configurar SheetJS y el motor backend para preservar ceros a la izquierda (`raw: false` / formato texto estricto).
   - Manejar fechas ambiguas y cantidades monetarias con formatos regionales configurables (`DD/MM/AAAA` vs `MM/DD/AAAA`, coma vs punto decimal).
3. **[F35-Task03] Validación de referencias relacionales y detección inteligente de duplicados:**
   - Validar existencia de entidades vinculadas (estudiantes, matrículas, cuentas) antes de confirmar.
   - Detectar duplicados internos en el archivo y externos en la base de datos, categorizando en `Crear`, `Actualizar`, `Omitir` o `Conflicto`.
4. **[F35-Task04] Simulación obligatoria en vista previa y ejecución atómica por lotes:**
   - Exigir paso de previsualización con resumen cuantitativo antes de habilitar confirmación.
   - Ejecutar la persistencia real en las hojas de destino con `LockService` y clave de idempotencia por lote.
5. **[F35-Task05] Historial estructurado y motor de reversión selectiva de importaciones:**
   - Registrar cada registro creado/actualizado vinculado a su `ejecucionId`.
   - Implementar `revertImportBatch(payload)` para revertir de forma segura registros que no hayan sufrido modificaciones posteriores.

### Bloque P1: Perfiles, Asistente y Rendimiento
6. **[F35-Task06] Perfiles de mapeo reutilizables por formato y origen:**
   - Guardar plantillas de correspondencia en `PerfilesMapeoImportacion` para reutilización automática en cargas periódicas.
7. **[F35-Task07] Descarga de informes de error y registros observados:**
   - Generar reporte CSV descargable con el motivo específico de fallo por fila y columna.
8. **[F35-Task08] Procesamiento por bloques y respaldo del archivo de trabajo:**
   - Fragmentar archivos de más de 200 filas en lotes secuenciales para evitar agotamiento de cuotas GAS.
   - Almacenar copia de trabajo en Google Drive para trazabilidad forense.

### Bloque P2: Experiencia y Usabilidad
9. **[F35-Task09] Asistente guiado responsivo en 4 pasos:**
   - Rediseñar el modal `#modal-excel-importer` con indicador de pasos (1. Carga -> 2. Mapeo -> 3. Simulación -> 4. Resultados).

---

## H. COBERTURA CUANTITATIVA Y CONCLUSIÓN

- **Total de Subcapacidades Evaluadas:** 20 (F35-01 a F35-20)
- **Inspección de Código y Repositorio:** 100%
- **Pruebas de Escenarios Ejecutadas:** 12 (PT-F35-01 a PT-F35-12)
- **Distribución de Estados Funcionales:**
  - *Completa y Verificada:* 1 (5.0%)
  - *Implementada Parcialmente:* 6 (30.0%)
  - *Requiere Mejoras:* 7 (35.0%)
  - *Ausente:* 5 (25.0%)
  - *Defectuosa:* 1 (5.0%)
- **Cobertura de Verificación Satisfactoria:** 35.0%
- **Dictamen:** **NO APROBADA PARA CERTIFICACIÓN FINAL** debido a la falta de mapeo semántico interactivo, la ausencia de validación relacional contra la base de datos, el truncamiento de ceros en identificadores y la carencia de reversión segura de lotes.

---

## Tareas ejecutables derivadas de los hallazgos

> Normalización de las nueve tareas descritas en el plan G (F35-Task01..F35-Task09), conservando las prioridades visibles en el informe. Se añaden F35-Task15..F35-Task17 para cubrir brechas explícitas de carga/selección de hojas y encabezados, validaciones por tipo de entidad y esquemas dinámicos multi-módulo que no tienen tarea individual en el plan. La bitácora histórica registra 14 tareas y asigna prioridades a F35-Task10..F35-Task14, pero no conserva sus descripciones; esos IDs se dejan sin reconstruir. Se coordinan tareas coincidentes con F25/F29 para evitar duplicación.

### [F35-Task01] Implementar reconocimiento semántico de encabezados y mapeo interactivo
- **Hallazgo de origen:** F35-03/F35-04; CAR-F35-03/CAR-F35-04.
- **Severidad:** Crítica / P0. **Objetivo:** permitir correspondencias automáticas y manuales entre columnas de origen y campos destino sin depender de la posición de la primera columna.
- **Acción ejecutable:** crear diccionario versionado de sinónimos por entidad; calcular coincidencia exacta/fuzzy con umbrales configurables; mostrar tabla interactiva origen→destino con confianza, tipo y opción de excluir; requerir confirmación del usuario antes de persistir el perfil.
- **Archivos/módulos:** `js/teacher.js`, `#modal-excel-importer`, `importDataWithColumnMapping`, `validateImportPreview`, catálogo de entidades y campos destino.
- **Dependencias/riesgos:** F35-Task15/17, F25-Task02 (perfiles de mapeo), F26-Task02 (locale); riesgo de mapear campos semánticamente parecidos pero incompatibles.
- **Alcance:** sugerencias y mapeo visual; no ejecutar mapeo automático sin confirmación ni aceptar campos destino no permitidos.
- **Criterios de aceptación:** sinónimos por entidad; score/umbral visible; usuario puede cambiar/excluir mapeo; campos incompatibles se rechazan; mapeo versionado; pruebas con encabezados ambiguos, sinónimos, idiomas, orden variable y falsos positivos.
- **Prioridad:** P0. **Estado:** Pendiente.
- **Evidencia de cierre:** pendiente; frontend envía rígidamente la primera columna como identificador y no existe interfaz visual de correspondencias.

### [F35-Task02] Normalizar tipos, formatos regionales y preservar identificadores
- **Hallazgo de origen:** F35-06; CAR-F35-06.
- **Severidad:** Crítica / P0. **Objetivo:** preservar códigos con ceros iniciales y convertir fechas/importes de forma explícita y reversible.
- **Acción ejecutable:** configurar lectura de identificadores como texto; crear normalizadores por tipo/locale para fecha, decimal, moneda y booleano; exigir selección de formato cuando los valores sean ambiguos; conservar valor bruto y valor normalizado.
- **Archivos/módulos:** `js/teacher.js`, SheetJS, `validateImportPreview`, `importDataWithColumnMapping`, `js/config.js`.
- **Dependencias/riesgos:** F26-Task02 (formateo regional), F35-Task16 (validación); riesgo de convertir fechas/identificadores incorrectamente o perder el valor original.
- **Alcance:** normalización antes de persistir; no modificar identificadores ya almacenados ni inferir locale ambiguo sin confirmación.
- **Criterios de aceptación:** ceros iniciales conservados; fechas DD/MM y MM/DD desambiguadas; decimales coma/punto interpretados según configuración; moneda explícita; valor original disponible para auditoría; pruebas con 00125, fechas ambiguas, 1.250,50, negativos y nulos.
- **Prioridad:** P0. **Estado:** Pendiente.
- **Evidencia de cierre:** pendiente; la auditoría confirma conversión de códigos como 00125 a 125 y falta de normalización regional.

### [F35-Task03] Validar referencias relacionales y detectar duplicados/conflictos
- **Hallazgo de origen:** F35-08/F35-09; CAR-F35-08/CAR-F35-09.
- **Severidad:** Crítica / P0. **Objetivo:** impedir inserciones huérfanas y clasificar correctamente registros nuevos, existentes o conflictivos.
- **Acción ejecutable:** verificar referencias a estudiantes, matrículas, cuentas y entidades destino; detectar duplicados internos y contra la base; clasificar Crear/Actualizar/Omitir/Conflicto; exigir política de resolución explícita.
- **Archivos/módulos:** `backend/accounting-service/Code.gs`, `validateImportPreview`, `importDataWithColumnMapping`, catálogos maestros y hojas destino.
- **Dependencias/riesgos:** F25-Task03 (duplicados y referencias), F29-Task01/07 (identidad/conciliación); riesgo de fusionar personas distintas o sobrescribir registros oficiales.
- **Alcance:** validación y clasificación previa; no fusionar automáticamente por nombre ni actualizar registros sin permiso.
- **Criterios de aceptación:** referencias existen y están activas; claves naturales normalizadas; duplicados internos/externos separados; conflicto bloquea escritura; política crear/actualizar/omitir aprobada y auditada; pruebas con huérfanos, duplicados, IDs ambiguos y referencias inactivas.
- **Prioridad:** P0. **Estado:** Pendiente (ampliación coordinada con F25-Task03).
- **Evidencia de cierre:** pendiente; el importador no valida existencia de estudiantes/cuentas ni compara duplicados contra la base.

### [F35-Task04] Exigir simulación previa y ejecutar importación atómica por lotes
- **Hallazgo de origen:** F35-10/F35-11/F35-12; CAR-F35-10..12.
- **Severidad:** Crítica / P0. **Objetivo:** impedir que el usuario confirme una importación sin conocer sus efectos y garantizar consistencia/idempotencia al escribir.
- **Acción ejecutable:** hacer obligatorio `validateImportPreview` antes de habilitar confirmación; presentar conteos Crear/Actualizar/Omitir/Error; persistir ejecuciónId y clave idempotente por lote; aplicar LockService, validación final y compensación/rollback ante fallo parcial.
- **Archivos/módulos:** `backend/accounting-service/Code.gs`, `validateImportPreview`, `importDataWithColumnMapping`, `AuditoriaMigraciones`, UI de importación.
- **Dependencias/riesgos:** F29-Task06 (dryRun), F29-Task09 (lotes), F25-Task05 (reanudación); riesgo de que preview escriba datos o que reintentos dupliquen efectos.
- **Alcance:** simulación no destructiva y confirmación transaccional; no enviar directamente a importación real desde el primer botón.
- **Criterios de aceptación:** preview sin escrituras; confirmación ligada al hash del archivo/mapeo; resumen por acción; LockService; idempotencia por registro/lote; error crítico aborta o compensa según política; pruebas de doble clic, timeout, fallo intermedio y cambio de archivo tras preview.
- **Prioridad:** P0. **Estado:** Pendiente.
- **Evidencia de cierre:** pendiente; el botón frontend llama directamente a `importDataWithColumnMapping` y el backend solo registra resumen, sin inserción real completa ni ScriptLock.

### [F35-Task05] Registrar historial y permitir reversión selectiva de lotes
- **Hallazgo de origen:** F35-15; CAR-F35-15.
- **Severidad:** Crítica / P0. **Objetivo:** revertir importaciones erróneas sin sobrescribir modificaciones posteriores ni borrar evidencia.
- **Acción ejecutable:** registrar por ejecución y registro el valor anterior/nuevo, acción, clave, timestamp y actor; implementar `revertImportBatch` con comparación de versión/estado y reversión selectiva; rechazar rollback si el registro fue modificado después.
- **Archivos/módulos:** `backend/accounting-service/Code.gs`, `AuditoriaMigraciones`, historial de lotes y tablas destino.
- **Dependencias/riesgos:** F29-Task04 (rollback delta), F35-Task04 y AUD-NG-161; riesgo de eliminar datos legítimos creados después de importar.
- **Alcance:** reversión de cambios atribuibles a un lote; no borrar historial ni revertir modificaciones posteriores ajenas.
- **Criterios de aceptación:** snapshot antes/después; ejecuciónId por fila; rollback compara versión actual; conflicto queda en revisión; operación idempotente; log de reversión; pruebas de lote mixto, modificación posterior, reintento y rollback parcial.
- **Prioridad:** P0. **Estado:** Pendiente.
- **Evidencia de cierre:** pendiente; existe `getMigrationLogs`, pero no motor de reversión selectiva.

### [F35-Task06] Persistir perfiles de mapeo reutilizables por formato y origen
- **Hallazgo de origen:** F35-14; CAR-F35-14.
- **Severidad:** Alta / P1 en la matriz E. **Objetivo:** reutilizar correspondencias de columnas para proveedores y archivos recurrentes.
- **Acción ejecutable:** ampliar F25-Task02 con perfiles de importador que guarden origen/proveedor, entidad destino, encabezados, mapeo, reglas, locale y versión; validar compatibilidad antes de aplicar.
- **Archivos/módulos:** `backend/accounting-service/Code.gs`, `PerfilesMapeoImportacion`, `importDataWithColumnMapping`, UI de mapeo.
- **Dependencias/riesgos:** F25-Task02, F35-Task01/02/17; riesgo de reutilizar perfiles obsoletos o de otro módulo.
- **Alcance:** perfil reusable de importación; no crear un segundo repositorio incompatible con `PerfilesMapeoColumnas` de Fase 25.
- **Criterios de aceptación:** perfil versionado por origen/entidad; mapping validado; compatibilidad de encabezados; usuario autorizado puede guardar/duplicar/retirar; previsualización obligatoria; pruebas de perfil obsoleto, cambio de columnas y ámbito.
- **Prioridad:** P1. **Estado:** Pendiente (ampliación de F25-Task02).
- **Evidencia de cierre:** pendiente; no existe tabla ni interfaz para guardar perfiles por proveedor/formato.

### [F35-Task07] Generar CSV descargable de errores y filas observadas
- **Hallazgo de origen:** F35-13; CAR-F35-13.
- **Severidad:** Alta / P1. **Objetivo:** entregar al usuario un reporte accionable de cada fila rechazada y su causa.
- **Acción ejecutable:** generar CSV UTF-8 con número de fila, columna, valor sanitizado, código de error, descripción y acción recomendada; permitir descargar solo registros autorizados y limitar exposición de PII.
- **Archivos/módulos:** `backend/accounting-service/Code.gs`, `AuditoriaMigraciones`, `validateImportPreview`, UI de resultados.
- **Dependencias/riesgos:** F35-Task04, F35-Task15/16 y F29-Task18; riesgo de exportar datos sensibles o truncar errores por límite fijo de 20.
- **Alcance:** reporte de errores/resultados; no exportar credenciales, datos financieros completos o payloads sin sanitizar.
- **Criterios de aceptación:** CSV completo/paginado; UTF-8 y escape correcto; error asociado a fila/columna; sin límite arbitrario de 20; permisos verificados; totales coinciden con preview; pruebas de caracteres especiales, PII y lotes grandes.
- **Prioridad:** P1. **Estado:** Pendiente.
- **Evidencia de cierre:** pendiente; errores se almacenan en JSON con máximo 20 y no existe descarga CSV.

### [F35-Task08] Procesar archivos grandes por bloques y conservar copia de trabajo
- **Hallazgo de origen:** F35-18/F35-19; CAR-F35-18/CAR-F35-19.
- **Severidad:** Alta / P1. **Objetivo:** procesar archivos grandes sin agotar cuotas GAS y conservar evidencia del archivo importado.
- **Acción ejecutable:** ampliar F25-Task05 con chunking configurable (200 filas iniciales), executionId/cursor/checkpoint y reanudación; almacenar archivo original o copia de trabajo privada en Drive con hash, propietario y política de retención.
- **Archivos/módulos:** `backend/accounting-service/Code.gs`, `importDataWithColumnMapping`, `AuditoriaMigraciones`, Drive, cola/triggers y `PropertiesService`.
- **Dependencias/riesgos:** F25-Task05, F29-Task09/18, F35-Task04/05; riesgo de duplicar filas al reanudar o retener archivos sensibles indefinidamente.
- **Alcance:** lotes y respaldo forense privado; no almacenar el archivo públicamente ni ejecutar una sola petición con todo el payload.
- **Criterios de aceptación:** tamaño/filas límite configurables; checkpoint durable; reanudación idempotente; progreso y errores visibles; copia privada con SHA-256 y retención; limpieza segura; pruebas con >500 filas, timeout, reintento y archivo eliminado.
- **Prioridad:** P1. **Estado:** Pendiente (ampliación de F25-Task05).
- **Evidencia de cierre:** pendiente; archivos >500 filas pueden agotar memoria/tiempo y no se conserva el binario original en Drive.

### [F35-Task09] Rediseñar el importador como asistente guiado responsivo de cuatro pasos
- **Hallazgo de origen:** F35-17; CAR-F35-17.
- **Severidad:** Media / P2. **Objetivo:** guiar al usuario por carga, mapeo, simulación y resultados con estados claros.
- **Acción ejecutable:** rediseñar `#modal-excel-importer` con pasos, validación de avance, resumen, recuperación del paso anterior y diseño adaptable a móvil.
- **Archivos/módulos:** `teacher-dashboard.html`, `js/teacher.js`, `#modal-excel-importer`.
- **Dependencias/riesgos:** F35-Task01/04/07; riesgo de permitir confirmar antes de completar validaciones obligatorias.
- **Alcance:** flujo de UX; no sustituir controles de seguridad/validación backend.
- **Criterios de aceptación:** cuatro pasos claros; progreso/errores accesibles; navegación atrás sin pérdida; confirmación bloqueada sin preview válido; responsive y teclado; pruebas de cancelación, volver, sesión expirada y error de red.
- **Prioridad:** P2. **Estado:** Pendiente.
- **Evidencia de cierre:** pendiente; el modal es estático y no presenta asistente secuencial.

### [F35-Task15] Implementar selección de hoja, detección de encabezados y rangos/columnas de origen
- **Hallazgo de origen:** F35-01/F35-02/F35-05; CAR-F35-01/CAR-F35-02/CAR-F35-05.
- **Severidad:** Crítica / P0. **Objetivo:** permitir importar desde la hoja y rango correctos aunque el archivo contenga varias pestañas, títulos o columnas irrelevantes.
- **Acción ejecutable:** mostrar hojas disponibles; detectar filas candidatas de encabezado con confianza; permitir elegir fila/rango de datos, columnas incluidas/excluidas y vista de muestra antes del mapeo.
- **Archivos/módulos:** `js/teacher.js`, SheetJS, `#modal-excel-importer`, `validateImportPreview`.
- **Dependencias/riesgos:** F35-Task01/04, F35-Task09; riesgo de seleccionar encabezados equivocados o excluir columnas clave.
- **Alcance:** configuración del origen; no modificar archivo original ni confiar en detección automática sin revisión.
- **Criterios de aceptación:** selector de hojas; fila de encabezado editable; rango inicial/final; inclusión/exclusión de columnas; preview con muestra; validación de formato/tamaño/corrupción en cliente y servidor; pruebas con múltiples hojas, títulos, filas vacías, rangos parciales y archivo protegido.
- **Prioridad:** P0. **Estado:** Pendiente.
- **Evidencia de cierre:** pendiente; se lee siempre la primera hoja y se asume encabezado en fila 1, sin MIME real ni selección de rango.

### [F35-Task16] Completar validación de campos obligatorios y reglas de negocio por entidad
- **Hallazgo de origen:** F35-07; CAR-F35-07.
- **Severidad:** Crítica / P0. **Objetivo:** validar tipo, longitud, rango, catálogo y reglas de negocio antes de aceptar registros.
- **Acción ejecutable:** crear esquemas de validación por entidad destino con required, tipo, longitud, patrón, rango, catálogo y validadores relacionales; devolver errores por fila/columna y bloquear registros inválidos según política.
- **Archivos/módulos:** `backend/accounting-service/Code.gs`, `validateImportPreview`, catálogo de esquemas y módulos destino.
- **Dependencias/riesgos:** F35-Task02/03/17, F29-Task06 y F25-Task03; riesgo de validar solo en frontend o rechazar registros válidos por reglas desactualizadas.
- **Alcance:** validación de datos y reglas antes de escribir; no sustituye autorización ni reconciliación posterior.
- **Criterios de aceptación:** reglas versionadas por entidad; backend aplica todas; catálogo/relaciones comprobados; errores exportables; política parcial/todo-o-nada explícita; pruebas por entidad con tipo incorrecto, campos faltantes y límites.
- **Prioridad:** P0. **Estado:** Pendiente.
- **Evidencia de cierre:** pendiente; `validateImportPreview` solo comprueba la presencia del identificador clave.

### [F35-Task17] Crear catálogo declarativo de esquemas y módulos importables
- **Hallazgo de origen:** F35-20; CAR-F35-20.
- **Severidad:** Alta / P1. **Objetivo:** ampliar el importador a nuevos módulos sin hardcodear cada destino en el frontend.
- **Acción ejecutable:** crear catálogo de entidades importables con campos, tipos, relaciones, permisos, validadores, claves de idempotencia y estrategia de escritura; resolver el esquema en backend según rol y destino autorizado.
- **Archivos/módulos:** `backend/developer-service/Code.gs`, `backend/accounting-service/Code.gs`, selector `excel-target-module`, catálogo de esquemas y módulos destino.
- **Dependencias/riesgos:** F25-Task01 (catálogo de integraciones), F35-Task01/03/16, RBAC/ABAC; riesgo de permitir que el cliente seleccione un módulo fuera de sus permisos.
- **Alcance:** extensibilidad declarativa; no permitir que una definición enviada por el cliente agregue campos o permisos.
- **Criterios de aceptación:** esquemas versionados y aprobados; destino resuelto en servidor; campos/relaciones validados; permisos por entidad; módulos nuevos se agregan sin cambiar flujo base; pruebas de módulo no autorizado, esquema obsoleto y destino incompatible.
- **Prioridad:** P1. **Estado:** Pendiente.
- **Evidencia de cierre:** pendiente; el selector contempla tres módulos, pero el backend carece de esquemas dinámicos por entidad.

### Reconciliaciones y discrepancias transversales de Fase 35
- **F35-Task03:** ampliar F25-Task03 para deduplicación y referencias; no crear motor paralelo.
- **F35-Task04:** coordinar dryRun con F29-Task06 y chunking con F25-Task05; simulación y escritura son fases distintas.
- **F35-Task06:** ampliar F25-Task02; reutilizar el catálogo existente de perfiles de mapeo, no crear dos tablas incompatibles.
- **F35-Task08:** ampliar F25-Task05/F29-Task09 para ejecución por bloques y recuperación.
- **F35-Task15/16/17:** formalizan brechas explícitas F35-01/02/05/07/20 no cubiertas por las nueve tareas descritas.
- **Discrepancia histórica:** Auditoria.txt registra 14 IDs F35-Task01..F35-Task14 (P0 01-09, P1 10-14), mientras el informe actual describe nueve tareas (01-09) con distribución P0 01-05, P1 06-08 y P2 09. No se encontraron descripciones para Task10..Task14 en el informe ni en la bitácora. Se preserva la prioridad del plan visible y se dejan Task10..Task14 como referencias sin alcance recuperable; no se consultó Pendientes.md.
- **Subcapacidad F35-16:** seguridad RBAC se conserva como completa/verificada según el informe; no se reabre por esta normalización.
- **Estado global:** F35-Task01..F35-Task09 y F35-Task15..F35-Task17 permanecen pendientes de ejecución/revalidación; F35-Task10..Task14 quedan como referencias históricas sin descripción recuperable.
