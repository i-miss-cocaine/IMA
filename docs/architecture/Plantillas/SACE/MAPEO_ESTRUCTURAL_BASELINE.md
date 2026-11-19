# Inventario estructural de plantillas SACE del repositorio

**Fecha de inspección:** 2026-11-19  
**Estado:** candidato estructural; procedencia oficial y vigencia no verificadas  
**Archivos:** tres libros `.xls` bajo `docs/architecture/Plantillas/SACE/`

## Resultado del análisis

Los tres archivos corresponden a libros BIFF8/Excel 97-2003 con una hoja visible y el mismo diseño de captura:

- Dimensión de hoja: A1:I31.
- 13 rangos combinados idénticos.
- 22 filas de estudiantes, filas 8 a 29.
- Dos parciales: I y II.
- Una columna de recuperación (H).
- Sin fórmulas en la hoja, sin reglas de validación de datos y sin protección de hoja activa.
- La columna I está dentro de la dimensión del libro, pero no contiene datos visibles en el ejemplo; se conserva sin modificar.
- Los nombres internos de las hojas son identificadores opacos; no sirven como identidad estable de la plantilla.
- Los tres archivos contienen datos de estudiantes de muestra. El inventario y las pruebas no copian ni muestran esos datos y no los consideran un padrón de producción.

## Mapa de celdas observado

| Rango/celda | Significado |
|---|---|
| A1 | Código y nombre del centro |
| A2 | Modalidad |
| A3 | Grado y sección |
| A4 | Jornada |
| A5 | Asignatura |
| A6 | Documento |
| B6 | Identidad |
| C6 | Nombre |
| D6:E6 | Parcial I |
| F6:G6 | Parcial II |
| H6:H7 | Recuperación |
| D7 / F7 | Inasistencias de cada parcial |
| E7 / G7 | Nota total de cada parcial |
| E8:E29 | Valores de nota del parcial I |
| G8:G29 | Valores de nota del parcial II |
| H8:H29 | Recuperación |
| A30:I30 | Pie institucional |
| A31:I31 | Instrucción de conservación del formato |

Rangos combinados observados: A1:I1, A2:I2, A3:I3, A4:I4, A5:I5, A30:I30, A31:I31, A6:A7, B6:B7, C6:C7, D6:E6, F6:G6 y H6:H7.

## Identificación y versionado

El archivo `manifest.json` registra los Git blob SHA de cada archivo, la versión interna `repo-baseline-2026-11-19`, el mapa estructural y el estado **CANDIDATE**. El SHA identifica exactamente el objeto almacenado en Git; el layout signature permite reconocer copias con datos de estudiantes distintos, pero el mismo diseño.

No se encontró un año lectivo ni fecha de vigencia en los metadatos visibles. Por tanto, la versión interna no debe confundirse con una versión normativa emitida por SACE. Antes de activarla, debe acreditarse la fuente oficial y el período de validez.

## Decisiones de integridad pendientes

1. D y F son columnas de inasistencias, no calificaciones; el exportador no debe escribir notas allí.
2. EXAM almacena recuperaciones por evaluación/categoría, mientras que el libro SACE solo presenta una columna H. No se debe elegir arbitrariamente entre `notaRecuperada` y `notaFinalCalculada`, ni combinar varias recuperaciones, sin una regla de correspondencia aprobada para esa plantilla.
3. El año lectivo debe proceder del contexto académico; no se infiere de la fecha actual ni del nombre del archivo.
4. El emparejamiento de estudiantes debe ser unívoco. Si no coincide la identidad o el nombre normalizado es ambiguo, se aborta el lote; no se desplazan filas.
5. Cualquier exportación debe preservar los bytes de la estructura OLE/BIFF, estilos, celdas combinadas, configuración de impresión y celdas no autorizadas. No se considera suficiente reconstruir el libro con un escritor XLSX genérico.

## Validación automatizada

`tests/security/sace-template-structure-contract.test.js` comprueba el contenedor OLE, el flujo Workbook BIFF8, las dimensiones, encabezados, celdas combinadas, filas de muestra, protección, fórmulas y validaciones. No imprime nombres, identificaciones ni notas.

La prueba acredita la estructura de los archivos del repositorio; no acredita por sí sola su procedencia oficial ni una exportación funcional en Apps Script/Sheets.
