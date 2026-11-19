# Auditoría F8-Task14 / TAREA-MOD-03 — Descomposición de archivos monolíticos

- Fecha: 2026-11-08.
- ID de sesión operativo: IMA-AUDIT-20261108-2330Z-03 (identificador documental; no ID nativo de ChatGPT).
- Checkpoint inicial: C1.273.
- Checkpoint de cierre previsto: C1.274.
- Repositorio: i-miss-cocaine/IMA.
- Rama: NG_beta_0.0.0.1_work.
- HEAD de partida verificado: ce8e64defbe9f99293f370cead7db445b535721b.
- Árbol de partida: 875169913d4160f196c5cbfe60cc70fc8404e947.
- Comparación con rama base protegida indicada en C1.271 (44d9891132332e692dbe2ba8602b41f50a508a59): 342 commits adelante, 0 detrás.
- Tarea auditada: F8-Task14 / TAREA-MOD-03, marcada [X] en completadas.md, líneas 5097–5117.
- Informe individual previo: no existe AUDITORIAS/AUDITORIA_COMPLETADAS_F8-TASK14.md; se ejecutó la auditoría directamente.
- Dictamen global: **NO CUMPLE**.
- CA-MOD-105: PARCIAL / NO ACREDITADO.
- CA-MOD-106: NO ACREDITADO.

## 1. Objetivo y criterios

Verificar la descomposición de archivos monolíticos por responsabilidad funcional, preservando nombres y contratos públicos, creando adaptadores de compatibilidad cuando sean necesarios, centralizando utilidades y evitando duplicados o colisiones globales.

- CA-MOD-105: cada función existente conserva un contrato de invocación válido y compatible.
- CA-MOD-106: no existen funciones duplicadas ni colisiones en el ámbito global.

## 2. Fuentes e inventario

| Fuente | SHA | Observación |
|---|---|---|
| completadas.md | f57f1aef832e81e44fc4f7ec36a852d50e464676 | F8-Task14 [X], líneas 5097–5117 |
| Pendientes.md | blob 676a3f798715f0cdd7d4bc75768472545b8465ee | Recuperado desde Git; 1.786.011 caracteres, 20.224 líneas, 515 IDs TASK únicos, máximo TASK-636 |
| docs/architecture/monolith-decomposition-plan.md | 388eda1feee9826f7be85665e56b35a566b8a5be | Plan de 21 líneas, matriz de fuentes y contratos |
| backend/developer-service/Code.gs | 8aa4bac67cfe5c8c54da51a0784a56fef633e412 | 125.944 caracteres; 2.901 líneas |
| tests/regression/modular-dashboard-suite.js | 0495e1d526a872c33310935a003a83d924d34683 | Suite Node con aserciones de presencia |
| docs/architecture/repository-inventory.md | eeed10fd8da0db3cd119c5a9778e9cb8b2233808 | Inventario de servicios y archivos |
| docs/architecture/folder-structure.md | ca44aea0abaf80bab58adb4b7bf51935f404bf96 | Estructura de carpetas |
| AUDITORIAS/Auditoria.txt | 782af5f003d78a4b91cbe9f5f7bf7a6ae2c4fbf4 | Hallazgos hasta AUD-NG-332 |
| AUDITORIAS/MapaDependencias.md | cc9969f76b286d8fe3ee084bcce760bb8380f3d1 | Mapa hasta F8-Task13 |
| AUDITORIAS/AUDITORIA_COMPLETADAS_PLAN.md | 03ea6a7e98cff337da0c0baf9a7a1ede825d6eac | Plan hasta F8-Task13 |
| AUDITORIAS/Contexto_personal.txt | f88465d1c6d8e6f112e0cefec43f65c0a9f7d6ae | Checkpoint C1.273 |

El backlog actual llega a TASK-636; TASK-671/672 se definieron en F8-Task11 y TASK-673/674/675 en F8-Task13. No se encontraron TASK-676 ni TASK-677. Se crean dos tareas nuevas sin duplicar las existentes.

## 3. Evidencia técnica

### 3.1 El plan documenta contratos, pero no una descomposición ejecutada

**docs/architecture/monolith-decomposition-plan.md, líneas 1–21**
- El documento define objetivos generales y una matriz de archivos origen/contratos públicos.
- La matriz enumera js/ui-common.js, js/secretary.js, js/teacher.js, js/student.js y backend/academic-service/Code.gs.
- No incluye backend/developer-service/Code.gs, aunque completadas.md lo declara archivo involucrado en F8-Task14.
- No define módulos destino, archivos nuevos, mapa de dependencias entre módulos, orden de extracción, estado de migración ni adaptadores concretos.
- Las reglas de compatibilidad y validación se enuncian como objetivos, pero no incluyen evidencia de ejecución.

**backend/developer-service/Code.gs**
- El archivo continúa existiendo como una sola unidad de 125.944 caracteres y 2.901 líneas.
- En la misma unidad se mantienen doGet/textResponse, autenticación HMAC y sobres interservicio (líneas 9–100), registro de servicios, logs y comandos operativos, catálogos/contratos, validadores de arquitectura, regresión, diagnóstico y provisión.
- No se evidencia la extracción de estas responsabilidades a módulos separados ni adaptadores que conecten módulos extraídos.
- La documentación de inventario sigue presentando backend/developer-service/Code.gs como archivo de servicio.

**Conclusión:** la tarea de descomposición no se ejecutó sobre el archivo objetivo. CA-MOD-105 solo puede considerarse parcial: los nombres públicos permanecen en el archivo, pero no existe evidencia de una modularización con contratos preservados.

### 3.2 validateMonolithDecompositionContracts no inspecciona funciones ni firmas reales

**backend/developer-service/Code.gs, líneas 1798–1893**
- Obtiene catálogo estático de acciones con getCentralConfigAndContractCatalog y catálogo de módulos.
- activeGlobalFunctions se construye exclusivamente desde payload.globalFunctions; si el payload no contiene ese arreglo, queda vacío.
- contractsToValidate se genera desde las acciones declaradas en el catálogo, no desde las declaraciones de funciones existentes en los archivos fuente.
- isRegisteredAction se considera verdadero si el nombre aparece en el mismo catálogo que se está validando.
- No lee fuentes, no analiza declaraciones globales, no inspecciona aridad/tipos de parámetros, no compara firmas públicas anteriores y actuales, no detecta consumidores ni comprueba adaptadores.

**Consecuencia:** un action declarado en el catálogo se marca VALIDATED aunque la función real no exista o su firma sea incompatible. El validador no acredita CA-MOD-105.

### 3.3 El contador de duplicados confunde acciones repetidas entre servicios con colisiones globales

**backend/developer-service/Code.gs, líneas 1845–1889; getCentralConfigAndContractCatalog, líneas 2261–2283**
- seenInBatch se indexa únicamente por item.contract, sin incluir item.module/servicio.
- getCentralConfigAndContractCatalog declara ping en USER, ACADEMIC, TASK, EXAM, ACCOUNTING y DEVELOPER.
- Por ello, al recorrer el catálogo completo, las repeticiones legítimas de ping en servicios distintos incrementan duplicateCount.
- globalCollisionsFound se devuelve como el mismo duplicateCount; no representa un análisis del ámbito global real.
- El validador puede rechazar contratos legítimos por repetir nombres de acción entre servicios independientes y, al mismo tiempo, no detectar dos funciones globales duplicadas en un mismo proyecto.

**Conclusión:** el algoritmo produce falsos positivos y no detecta las colisiones que afirma verificar. CA-MOD-106 NO ACREDITADO.

### 3.4 La suite no ejecuta el validador ni comprueba contratos de compatibilidad

**tests/regression/modular-dashboard-suite.js, líneas 38–50**
- Solo comprueba que el texto de backend/developer-service/Code.gs contenga validateMonolithDecompositionContracts.
- No invoca el validador, no proporciona una lista confiable de funciones globales ni verifica sus resultados.
- No compara firmas, número/tipo de argumentos, adaptadores, consumidores o resolución de símbolos.
- No prueba un duplicado real en el mismo ámbito ni un nombre de acción repetido en dos servicios distintos.
- La suite completa contiene comprobaciones de presencia de archivos/cadenas; no aporta evidencia conductual para CA-MOD-105/106.

**Conclusión:** la existencia de la función y su nombre en la suite no demuestran que la modularización, compatibilidad o ausencia de colisiones funcionen.

## 4. Hallazgos

### AUD-NG-333 — El archivo objetivo sigue monolítico y el plan omite su descomposición
- Severidad/Prioridad: ALTO/P1.
- Criterio: alcance de F8-Task14 y CA-MOD-105.
- Evidencia: backend/developer-service/Code.gs SHA 8aa4bac67cfe5c8c54da51a0784a56fef633e412, 2.901 líneas; monolith-decomposition-plan.md SHA 388eda1feee9826f7be85665e56b35a566b8a5be, líneas 7–15.
- Descripción: el archivo continúa concentrando autenticación, transporte, registro, comandos, logs, contratos, validación, regresión y diagnóstico. La matriz del plan no incluye el archivo developer-service que la tarea declara como objetivo y no define módulos destino.
- Impacto: la tarea se documentó, pero no se demuestra la separación funcional ni la conservación de contratos mediante adaptadores.
- Tarea derivada: TASK-676.

### AUD-NG-334 — El validador de contratos no analiza código real y cuenta falsos duplicados entre servicios
- Severidad/Prioridad: ALTO/P1.
- Criterios: CA-MOD-105 y CA-MOD-106.
- Evidencia: developer-service Code.gs:1798–1893 y 2261–2283.
- Descripción: la función valida el catálogo contra sí mismo, no escanea declaraciones ni firmas; globalFunctions solo procede del payload. El contador seenInBatch ignora el servicio y cuenta las acciones ping repetidas entre microservicios como colisiones globales.
- Impacto: puede certificar funciones inexistentes/incompatibles y rechazar acciones legítimas; no acredita ausencia de duplicados globales.
- Tarea derivada: TASK-677.

### AUD-NG-335 — La suite de regresión solo comprueba presencia del validador, no su comportamiento
- Severidad/Prioridad: ALTO/P1.
- Criterios: CA-MOD-105 y CA-MOD-106.
- Evidencia: tests/regression/modular-dashboard-suite.js:38–50; developer-service Code.gs:1798–1893.
- Descripción: la suite busca una cadena en el archivo y no ejecuta validateMonolithDecompositionContracts ni prueba contratos, firmas, consumidores, adaptadores o colisiones reales.
- Impacto: una función defectuosa o un contrato roto puede superar el control de presencia.
- Tarea derivada: TASK-677; amplía TASK-665.

## 5. Matriz de aceptación

| Requisito / criterio | Dictamen | Justificación |
|---|---|---|
| Separación de archivos monolíticos por responsabilidad | NO CUMPLE | El developer-service sigue en un Code.gs de 2.901 líneas; el plan no demuestra módulos destino. |
| Conservación de nombres públicos/adaptadores | PARCIAL / NO ACREDITADO | Las funciones siguen en el archivo original; no se verifica migración ni compatibilidad de adaptadores. |
| Centralización de utilidades compartidas | NO ACREDITADO | No hay módulos extraídos ni evidencia de un único proveedor de utilidades. |
| Retiro de implementaciones antiguas tras verificar consumidores | NO ACREDITADO | No se demuestra extracción ni análisis de consumidores. |
| CA-MOD-105 | PARCIAL / NO ACREDITADO | El validador no inspecciona firmas ni funciones reales. |
| CA-MOD-106 | NO ACREDITADO | No existe análisis real de símbolos globales; el contador confunde nombres de acciones entre servicios. |

## 6. Tareas ejecutables derivadas de los hallazgos de la auditoría

Se consultaron Pendientes.md (blob actual íntegro), completadas.md, el plan, el mapa y las auditorías F8 previas. No hay TASK-676 ni TASK-677. Se crean dos tareas nuevas y se amplía TASK-665/TASK-662, sin duplicar los alcances de TASK-671/672 ni los de TASK-673/675.

### TASK-676 — Descomponer developer-service Code.gs en módulos funcionales con adaptadores compatibles
- Origen: AUD-NG-333.
- Prioridad: P1.
- Objetivo: separar autenticación/transporte, registro de servicios, contratos/configuración, validación, regresión/diagnóstico y operaciones en módulos coherentes.
- Acción ejecutable: inventariar todas las funciones y consumidores; definir módulos destino; extraer por etapas; conservar doGet/doPost y los nombres públicos mediante wrappers/adaptadores; centralizar utilidades; actualizar monolith-decomposition-plan.md, repository-inventory.md y mapa de dependencias; retirar código antiguo solo tras probar ausencia de consumidores.
- Criterios: responsabilidades separadas; no hay copias divergentes; todas las acciones públicas resuelven a una implementación; consumidores existentes continúan funcionando; adaptadores cubren firmas legacy; pruebas de regresión pasan antes/después de cada extracción.

### TASK-677 — Implementar verificación real de contratos y colisiones globales con pruebas conductuales
- Origen: AUD-NG-334 y AUD-NG-335.
- Prioridad: P1.
- Objetivo: verificar declaraciones reales, firmas y ámbito de cada proyecto/servicio.
- Acción ejecutable: construir manifiesto confiable de funciones públicas por servicio; comparar contra dispatchers y firmas; detectar nombres duplicados dentro del mismo ámbito global; tratar nombres iguales en servicios separados como válidos; comprobar adaptadores y consumidores; hacer que la suite ejecute el validador.
- Criterios: función declarada y ruta de dispatcher existen; firma compatible; duplicado real en un mismo proyecto falla; ping repetido en servicios distintos no se marca como colisión; función declarada en catálogo pero ausente falla; cambio de firma sin adaptador falla; pruebas positivas/negativas reproducibles.

### Tareas existentes ampliadas
- TASK-665: ejecutar el validador; cubrir compatibilidad de firmas, consumidores, adaptadores, colisiones reales, nombres repetidos entre servicios y funciones ausentes.
- TASK-662: mantener catálogo/contratos sincronizados con acciones reales y dispatchers, no validar un catálogo contra sí mismo.
- TASK-636: conservar identidad/autorización verificada al mover handlers entre módulos.
- TASK-671/TASK-672: conservar los adaptadores ejecutables y el aislamiento de fallos de módulos; no sustituirlos por una mera separación física de archivos.
- TASK-673/TASK-674/TASK-675: la migración de carpetas, el validador del árbol y el despliegue son alcances F8-Task13; no duplicarlos en esta tarea.

## 7. Pruebas y límites

- Inspección manual: completadas.md:5097–5117; monolith-decomposition-plan.md:1–21; developer-service Code.gs:1–100, 1747–1895 y 2261–2283; tests/regression/modular-dashboard-suite.js:1–60; inventario y plan de arquitectura.
- Revisión estática: 125.944 caracteres y 2.901 líneas en developer-service Code.gs; el plan no incluye este archivo en su matriz de módulos; el validador depende de un catálogo estático y de payload.globalFunctions.
- No ejecutados: Node, Apps Script runtime, llamadas HTTP, análisis del namespace en el deployment real, pruebas de consumidores, despliegues ni E2E.
- No se afirma que exista una colisión real concreta en el namespace de producción; se constata que el validador actual no puede certificar su ausencia y que su contador clasifica mal acciones repetidas entre servicios.
- Código fuente: sin modificaciones.
- completadas.md y Pendientes.md: sin modificaciones.
- Rama base: sin modificaciones.

## 8. Continuidad

- Última tarea auditada: F8-Task14 / TAREA-MOD-03.
- Checkpoint inicial: C1.273.
- Checkpoint de cierre previsto: C1.274.
- Siguiente tarea exacta: F8-Task15 — actualizar el mapa de dependencias y la documentación arquitectónica, marcada [X] en completadas.md desde línea 5121.
- Próxima acción: verificar si existe AUDITORIAS/AUDITORIA_COMPLETADAS_F8-TASK15.md; si falta, auditar directamente docs/architecture/repository-inventory.md, docs/architecture/routing-and-paths.md, docs/architecture/staged-migration-procedure.md, AUDITORIAS/MapaDependencias.md y backend/developer-service/Code.gs contra los criterios de integridad, exactitud, rutas, dependencias, contratos y correspondencia con el árbol real.
- Commit de cierre: se confirmará consultando HEAD después de publicar el único commit que contiene este informe y el checkpoint.
