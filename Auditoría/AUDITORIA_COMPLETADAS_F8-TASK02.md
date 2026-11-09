# Auditoría F8-Task02 / TAREA-MOD-01 — Inventario del repositorio y dependencias

- **Fecha:** 2026-11-08.
- **ID de sesión operativo:** IMA-AUDIT-20261108-2114Z-01 (identificador documental; no es un ID nativo de ChatGPT).
- **Checkpoint inicial válido:** C1.261.
- **Repositorio:** `i-miss-cocaine/IMA`.
- **Rama auditada:** `NG_beta_0.0.0.1_work`.
- **HEAD de partida:** `a9de4074fcc83241516633526201e288509265b5`; tree SHA `a9de4074fcc83241516633526201e288509265b5`.
- **Rama base protegida:** `NG_beta_0.0.0.1` @ `44d9891132332e692dbe2ba8602b41f50a508a59`.
- **Tarea de origen:** F8-Task02 / TAREA-MOD-01, marcada [X] en `completadas.md`, línea 4790; bloque hasta línea 4812.
- **Informe individual previo:** no existe en el árbol de la rama; se ejecuta la auditoría directamente.
- **Dictamen:** **NO CUMPLE**. Se conserva la marca histórica [X] sin considerarla certificación funcional.

## 1. Objetivo y criterios

Auditar la afirmación de que el repositorio fue inventariado en su totalidad y que se documentaron dependencias directas e indirectas, referencias de scripts, links, importaciones, llamadas backend, funciones compartidas, duplicaciones, dependencias circulares y variables globales, respetando el punto de entrada de la raíz.

- **CA-MOD-101:** inventario del 100 % de los archivos y sus dependencias explícitas.
- **CA-MOD-102:** mapa formal de dependencias disponible antes de iniciar traslados de archivos.

## 2. Fuentes y respaldos

| Fuente | SHA de blob | Uso |
|---|---|---|
| `completadas.md` | `f57f1aef832e81e44fc4f7ec36a852d50e464676` | Estado declarado y alcance de F8-Task02 (líneas 4790–4812) |
| `docs/architecture/repository-inventory.md` | `eeed10fd8da0db3cd119c5a9778e9cb8b2233808` | Inventario declarado (40 líneas) |
| `docs/architecture/routing-and-paths.md` | `c64e6a952c1ce12a47cb00a2d324f39cd6581a47` | Declaraciones de rutas (28 líneas) |
| `tests/regression/modular-dashboard-suite.js` | `0495e1d526a872c33310935a003a83d924d34683` | Alcance real de comprobaciones (61 líneas) |
| `AUDITORIAS/MapaDependencias.md` | `bf37951d3ce94e82120d4c2250fcb5c1e3a55ef5` | Mapa existente (3.757 líneas) |
| `METODOLOGIA_DESARROLLO.md` | `cf796728bb384a32537392df2f9c72a339fa03ee` | Reglas de auditoría y cierre |
| `Pendientes.md` (blob actual) | `676a3f798715f0cdd7d4bc75768472545b8465ee` | Registro de tareas recuperado desde Git |
| `Pendientes.md` (blob histórico indicado) | `631b4c2dbf0e86d5704b63625382d73ccb8ceb3c` | Comparación histórica y respaldo |

El informe individual F8-Task02 no aparece entre los archivos de `AUDITORIAS/`. La búsqueda de los identificadores literales F8-Task02 y TAREA-MOD-01 en las dos versiones recuperadas de `Pendientes.md` no produjo coincidencias; la tarea sí aparece en `completadas.md`.

## 3. Inventario real del árbol Git

La enumeración del árbol de la rama de trabajo devuelve **974 archivos versionados**. Entre las extensiones observadas:

| Tipo | Cantidad |
|---|---:|
| HTML | 100 |
| HTM | 1 |
| JavaScript | 24 |
| CSS | 6 |
| Google Apps Script (.gs) | 6 |
| JSON | 27 |
| PNG | 359 |
| JPG | 125 |
| PDF | 65 |

El repositorio incluye, además de la aplicación y sus microservicios, material académico y recursos en directorios como `II_BTP_A/`, `III_BTP_A/`, `Informatica_I/`, `imagenes/`, `juegos/`, `guia_estudios/`, además de documentación, hojas de cálculo, pruebas y archivos de recuperación.

## 4. Inspección de los artefactos de inventario y dependencias

### 4.1 `docs/architecture/repository-inventory.md` (líneas 1–40)

El documento enumera un conjunto limitado de vistas principales, ocho módulos JS destacados, seis microservicios, una hoja CSS y el directorio genérico de imágenes. No presenta una tabla exhaustiva de los 974 archivos, ni inventaría los 100 HTML, 24 JS, 27 JSON, hojas de cálculo, PDFs, juegos, material académico, pruebas y documentación del árbol.

Ejemplos comprobados en el árbol y ausentes como rutas concretas en el inventario/mapa:

- `III_BTP_A/dw_II/DOM.html`
- `II_BTP_A/Informatica_Aplicada_I/estilos.css`

La ausencia de esos ejemplos es evidencia directa de que el inventario documental no cubre todo el repositorio; no se afirma que sean los únicos omitidos.

### 4.2 `AUDITORIAS/MapaDependencias.md` (3.757 líneas)

El mapa contiene información útil de dashboards, servicios backend, persistencia, módulos funcionales y auditorías previas. Sin embargo, no documenta las rutas de contenido académico anteriores ni ofrece una matriz que relacione cada archivo versionado con sus dependencias entrantes y salientes. Por ello no demuestra cobertura del 100 % exigida por CA-MOD-101.

### 4.3 `docs/architecture/routing-and-paths.md` (líneas 1–28)

En sus líneas 25–28 afirma que todos los HTML referencian correctamente scripts y hojas CSS sin errores HTTP 404. No acompaña esa afirmación con un inventario de enlaces por archivo, resultados de navegación, registro de respuestas HTTP ni evidencia de validación de rutas dinámicas.

### 4.4 `tests/regression/modular-dashboard-suite.js` (61 líneas)

Las líneas 22–31 verifican la existencia de un conjunto fijo de archivos y las líneas 32–52 buscan cadenas concretas en archivos seleccionados. No recorre los 100 HTML ni demuestra que todas las referencias `script`, `link`, imágenes, fuentes, imports o rutas dinámicas resuelvan. Tampoco prueba que no haya dependencias circulares o colisiones globales. La suite no se ejecutó durante esta auditoría, conforme a la separación entre auditoría manual y pruebas.

### 4.5 Punto de entrada

El árbol contiene `index.html` en la raíz y no contiene `index.htm`. README y documentación arquitectónica identifican `index.html` como punto de entrada. La tarea y algunos documentos alternan `index.htm` e `index.html`; se registra la discrepancia documental, sin renombrar ni alterar el punto de entrada.

## 5. Hallazgos y dictamen por criterio

### AUD-NG-281 — Inventario incompleto del repositorio

- **Severidad:** ALTO / P1.
- **Evidencia:** árbol Git con 974 archivos; inventario de 40 líneas que enumera solo subconjuntos funcionales; rutas académicas reales ausentes.
- **Impacto:** archivos, recursos y dependencias pueden quedar fuera de cualquier evaluación de cambios, migración, despliegue o mantenimiento.
- **Criterio afectado:** CA-MOD-101 — **NO CUMPLE**.

### AUD-NG-282 — Mapa de dependencias y afirmaciones de rutas sin cobertura verificable

- **Severidad:** ALTO / P1.
- **Evidencia:** MapaDependencias.md no contiene rutas concretas de contenido académico muestreadas; routing-and-paths.md declara cobertura global sin resultados por archivo; la suite solo comprueba un conjunto fijo de rutas.
- **Impacto:** no hay trazabilidad completa entre consumidores y proveedores ni evidencia para asegurar que cambios de rutas no rompan páginas o recursos fuera de los módulos principales.
- **Criterios afectados:** CA-MOD-101 — **NO CUMPLE**; CA-MOD-102 — **PARCIAL** (hay documentos formales, pero no acreditan el mapa integral exigido).

### AUD-NG-283 — Sin evidencia de análisis integral de duplicaciones, globales y ciclos

- **Severidad:** MEDIO / P2.
- **Evidencia:** el inventario y mapa actuales no contienen un catálogo exhaustivo de funciones por archivo, propiedad de símbolos globales, aristas de dependencias ni un resultado verificable de análisis de ciclos.
- **Impacto:** no se puede demostrar ausencia de colisiones, redefiniciones, dependencias circulares o acoplamientos ocultos.
- **Criterios afectados:** requisitos funcionales 2 y 3 de F8-Task02.
- **Límite:** este hallazgo registra ausencia de evidencia; no declara que una función duplicada o un ciclo específico haya sido encontrado.

## 6. Tareas ejecutables derivadas de los hallazgos

### Tareas nuevas

#### TASK-637 — Completar el inventario integral de archivos

- **Referencia:** AUD-NG-281.
- **Severidad:** ALTO.
- **Prioridad:** P1.
- **Estado:** Pendiente.
- **Objetivo y acción:** generar y mantener un inventario exhaustivo de los 974 archivos versionados, con ruta exacta, tipo, tamaño, SHA, área funcional, propósito y condición de uso; reconciliarlo con el árbol Git vigente y contemplar contenido académico, assets, datos, documentación, pruebas, configuración y backend.
- **Archivos/módulos afectados:** `docs/architecture/repository-inventory.md`, `AUDITORIAS/MapaDependencias.md`, árbol completo del repositorio.
- **Dependencias:** árbol Git de la rama de trabajo, documentación vigente, punto de entrada `index.html`.
- **Criterios de aceptación:** 100 % de las rutas versionadas presentes una sola vez; ningún archivo omitido o inventado; clasificación verificable; diferencias de árbol registradas; no renombrar el punto de entrada.
- **Alcance:** documentación e inventario, sin mover ni alterar archivos fuente.

#### TASK-638 — Trazar dependencias estáticas y dinámicas de extremo a extremo

- **Referencia:** AUD-NG-282.
- **Severidad:** ALTO.
- **Prioridad:** P1.
- **Estado:** Pendiente.
- **Objetivo y acción:** documentar por archivo las dependencias HTML `script/link`, CSS, imágenes, fuentes, imports, referencias dinámicas, rutas, endpoints, acciones backend, contratos y servicios externos; distinguir referencias comprobadas de inferidas y registrar consumidores/proveedores.
- **Archivos/módulos afectados:** HTML, JS, CSS, JSON, GAS, configuración, documentación y recursos del repositorio; `AUDITORIAS/MapaDependencias.md`.
- **Dependencias:** TASK-637, catálogo completo de archivos.
- **Criterios de aceptación:** cada dependencia explícita tiene origen y destino exactos; referencias relativas y sensibles a mayúsculas quedan identificadas; rutas dinámicas y endpoints tienen contrato documentado; no se declaran rutas funcionales sin evidencia verificable.
- **Alcance:** auditoría y documentación; no cambiar rutas ni contratos durante la auditoría.

#### TASK-639 — Verificar duplicaciones, símbolos globales y ciclos

- **Referencia:** AUD-NG-283.
- **Severidad:** MEDIO.
- **Prioridad:** P2.
- **Estado:** Pendiente.
- **Objetivo y acción:** realizar inspección manual función por función y módulo por módulo sobre los archivos inventariados; documentar propietarios de símbolos globales, redefiniciones, acoplamientos, ciclos y contratos compartidos.
- **Archivos/módulos afectados:** archivos fuente identificados por TASK-637 y mapa de TASK-638.
- **Dependencias:** TASK-637 y TASK-638.
- **Criterios de aceptación:** cada símbolo compartido tiene propietario y consumidores; duplicados/ciclos confirmados o descartados con evidencia y referencias exactas; los casos no verificables quedan explícitos; no se modifica código durante la fase de auditoría.

### Tareas existentes ampliadas

- No se amplía ningún ID existente en esta iteración. Los hallazgos AUD-NG-281..283 describen brechas de inventario y trazabilidad que no deben duplicarse con tareas de actualización de rutas posteriores.

## 7. Pruebas, límites y archivos

- **Inspección realizada:** árbol Git de la rama, conteo por extensiones, documentación de inventario, mapa de dependencias, diccionario de rutas, suite de regresión, README, punto de entrada y bloque de completadas.
- **Pruebas ejecutadas:** lectura de blobs Git, verificación de SHA, estructura y conteos; comparación de HEAD de rama de trabajo y base.
- **No ejecutadas:** Node, navegador/DOM, HTTP/404 real, Apps Script, servicios desplegados, análisis funcional de runtime, pruebas E2E o de integración. No se modificó código ni se accedió a datos productivos.
- **Límite de auditoría:** el dictamen NO CUMPLE se sustenta en que los artefactos declarados como inventario y mapa no cubren ni demuestran el 100 % del repositorio. No se afirma haber descartado duplicaciones/ciclos en todos los archivos; TASK-639 queda pendiente para esa inspección exhaustiva.
- **Archivos que se modificarán en esta iteración:** este informe, `AUDITORIAS/Auditoria.txt`, `AUDITORIAS/MapaDependencias.md`, `AUDITORIAS/AUDITORIA_COMPLETADAS_PLAN.md` y `AUDITORIAS/Contexto_personal.txt`.
- **Sin cambios:** código fuente, HTML, CSS, JS, backend, tests, `completadas.md`, `Pendientes.md`, `ChangesLogs.txt`, `METODOLOGIA_DESARROLLO.md`, documentación de arquitectura auditada y rama base.

## 8. Conclusión y continuidad

F8-Task02 / TAREA-MOD-01 **NO CUMPLE**. La marca [X] de `completadas.md` permanece como registro histórico y no se considera certificación funcional. El inventario existente es parcial, el mapa no acredita las dependencias del repositorio completo y no hay evidencia integral de revisión de símbolos globales o ciclos.

- **Última tarea auditada:** F8-Task02 / TAREA-MOD-01.
- **Tarea en curso al cierre:** ninguna.
- **Siguiente tarea cronológica:** F8-Task03 — actualizar y verificar rutas y dependencias después de la reorganización.
- **Próxima acción:** comprobar si existe informe individual F8-Task03; si falta, auditar directamente la tarea marcada en `completadas.md`, verificando las rutas reales y el cumplimiento de CA-MOD-107/108.
