# Auditoría de tareas completadas - T-UX-10

**Fecha:** 2026-11-05  
**Repositorio:** i-miss-cocaine/IMA  
**Rama:** NG_beta_0.0.0.1_work  
**HEAD de partida:** 5e138394deae035441a2cefb7ca7b527c70a9e4a  
**Árbol de partida:** fae9e08a078bf20fcc949c075dee3b0310cf3eb7  
**Tarea:** T-UX-10 - Completar la verificación funcional y automatizar las pruebas de experiencia de usuario  
**Estado histórico:** [X] Completada (aparece dos veces en completadas.md, en ambas con el mismo alcance general).

## Dictamen

**NO CUMPLE.** La suite `window.runUXSuiteTests` existe, pero no constituye una batería funcional de nueve capacidades. Ocho grupos se limitan a comprobar que exista una función o propiedad; UX-05 ejecuta una única transformación fija. UX-07 puede marcar PASS aunque el indicador visual no exista, porque `navigator.onLine` suele ser booleano en navegadores modernos. La salida solo distingue PASS/FAIL y no hay evidencia de integración de esta suite en los dos archivos de regresión revisados ni invocación desde los cinco dashboards examinados.

El defecto principal es de validez de las pruebas: los resultados positivos no demuestran que los flujos funcionen. Varias auditorías anteriores ya documentaron fallos reales en las capacidades que la suite declara aprobar; no se vuelven a registrar sus causas funcionales.

## Evidencia directa de la suite

**Archivo:** `js/ui-common.js`, SHA `986938b8a311a41ed4cb3d135b66b6aaea4bed67`, función `window.runUXSuiteTests`, líneas 1846-1937.

| Caso | Implementación encontrada | Qué no demuestra |
|---|---|---|
| UX-01 | `typeof window.handleSessionExpired === 'function'` | Token expirado/revocado, limpieza, redirección, aviso ni distinción de permiso insuficiente |
| UX-02 | `typeof window.trackModalFocus === 'function'` | Evento Escape, cierre del modal correcto ni retorno real del foco |
| UX-03 | `typeof window.setupUnsavedChangesProtection === 'function'` | Estado dirty, navegación, submit/reset, guardado fallido ni campos dinámicos |
| UX-04 | `typeof window.renderDataFreshnessBadge === 'function'` | Inserción del badge, timestamp efectivo, callback ni error de sincronización |
| UX-05 | Una entrada fija `Matemáticas Rápídas` y comparación literal | Casos límite, ñ, puntuación, nulos, equivalencia end-to-end y falsos positivos |
| UX-06 | `typeof window.openGlobalOmniboxModal === 'function'` | Atajo, consulta, permisos, vacío, error de servicio, resultado ni navegación |
| UX-07 | `badge presente || typeof navigator.onLine === 'boolean'` | Estado visual y respuesta a eventos online/offline; la segunda condición permite PASS sin badge |
| UX-08 | `typeof window.openReportIssueModal === 'function'` | Validación, envío, recepción de ticket, rechazo, red y recuperación |
| UX-09 | Existencia de `openMobileHamburgerDrawer` y `toggleRoleMenuAccordionSection` | Rutas por rol, escritorio/móvil, acordeón real y ausencia de opciones ajenas |

La función auxiliar `addResult` asigna únicamente `PASS` o `FAIL`; el resumen contiene `total`, `passed`, `failed` y `results`. No representa `SKIPPED` ni `BLOCKED`, ni evita que un caso no ejecutado sea confundido con éxito.

## Contraste con implementaciones y ampliaciones posteriores

- **UX-01:** `handleSessionExpired` está definido en `js/ui-common.js`, pero AUD-NG-162 ya documentó que `fetchApi` no invoca el flujo de expiración y que login no presenta el aviso. El test actual daría PASS por la mera definición.
- **UX-02:** la función de seguimiento de foco existe y hay listener Escape, pero AUD-NG-181 ya registró cobertura incompleta de overlays y restauración de foco. El test no dispara ningún evento.
- **UX-03:** `setupUnsavedChangesProtection` existe (líneas 5371-5430), pero C1.45/AUD-NG-182/TASK-479 documentó defectos en snapshot, limpieza prematura, formularios dinámicos y teardown. UX-03 no observa ninguno.
- **UX-04:** el renderer existe (desde línea 5438), pero C1.46/AUD-NG-183/TASK-480 documentó que no hay consumo funcional y que el callback/fecha no satisfacen T-UX-21. UX-04 no comprueba ni una inserción.
- **UX-05:** el normalizador ejecuta NFD, eliminación de marcas diacríticas, minúsculas y normalización de puntuación/espacios (líneas 2202-2212). La única muestra de la suite es insuficiente para acreditar los filtros y búsquedas reales.
- **UX-06:** C1.48/AUD-NG-184/TASK-481 y AUD-NG-185/TASK-482 documentaron autorización contextual incompleta y XSS en resultados. El test de UX-06 pasa si existe el abridor del modal, aunque búsqueda y renderizado fallen.
- **UX-07:** el indicador instala listeners online/offline y actualiza el badge (líneas 34-57), pero la prueba no simula eventos ni valida el DOM. T-UX-22 está marcada completada, sin evidencia conductual aportada por T-UX-10.
- **UX-08:** `openReportIssueModal` abre el modal; `submitProblemReportForm` (líneas 3762-3836) valida longitudes y llama a `fetchApi`, pero el test no invoca el formulario ni comprueba confirmación, rechazo o recuperación. T-UX-23 es la ampliación funcional relacionada.
- **UX-09:** C1.49/AUD-NG-186/TASK-483 ya demostró que la navegación no es específica por rol y no cubre de forma coherente todos los dashboards; el test solo exige dos funciones globales.
- **Ampliaciones posteriores:** T-UX-13/T-UX-20 (menú y responsive), T-UX-14 (búsqueda), T-UX-17 (cambios no guardados), T-UX-21 (frescura), T-UX-22 (conectividad) y T-UX-23 (reporte) aparecen como completadas. Sus criterios no quedan validados por esta suite superficial.

## Integración de pruebas y dashboards

- `tests/regression/academic-grading-suite.js`, SHA `3433b707edd4a2f35c68368a3172932adc2a3b32`: suite Node.js con `fs.existsSync` y comprobaciones `includes()` de símbolos/etiquetas; no contiene UX-01..UX-09 ni llama a `runUXSuiteTests`.
- `tests/regression/modular-dashboard-suite.js`, SHA `0495e1d526a872c33310935a003a83d924d34683`: verifica existencia de archivos y presencia de contratos/cadenas; no contiene UX-01..UX-09 ni llama a `runUXSuiteTests`.
- `dashboard-direccion.html`, `dashboard-recursos-humanos.html`, `dashboard-contabilidad.html`, `student-dashboard.html` y `teacher-dashboard.html` cargan el módulo común según sus referencias de scripts, pero no se encontró invocación explícita de `runUXSuiteTests` en esos cinco HTML.
- `js/student.js`, `js/teacher.js` y `js/accounting.js` no contienen referencias directas a `runUXSuiteTests` ni a los helpers UX examinados. La prueba no acredita por ello integración funcional en dichos paneles.

## Calidad de implementación de la suite

- Los bloques try/catch aíslan excepciones de cada comprobación, lo cual evita que una excepción detenga toda la función.
- Sin embargo, los casos nominales no producen evidencia conductual y el caso UX-07 tiene un falso positivo lógico.
- El resumen agregado no incluye detalle de ejecución, omisiones, bloqueos ni clasificación unitaria/integración/despliegue.
- No se identificó un módulo de pruebas UX dedicado ni una llamada a esta suite en los archivos de regresión revisados.
- La suite depende de globals de navegador (`window`, `document`, `navigator`) y no proporciona aislamiento/fixtures propios ni limpieza demostrable.
- No se modificó código ni se ejecutó la suite en navegador. Este dictamen se basa en inspección estática/manual; no se atribuyen resultados runtime que no se hayan observado.

## Reconciliación de duplicados

- **AUD-NG-009** ya cubre el principio general de reemplazar pruebas de presencia textual por pruebas funcionales en las suites de regresión. Se mantiene como relación, pero no cubre específicamente el contrato de T-UX-10 ni los nueve casos UX.
- **AUD-NG-162**, **AUD-NG-181**, **AUD-NG-182**, **AUD-NG-183**, **AUD-NG-184**, **AUD-NG-185** y **AUD-NG-186**, junto con **TASK-479 a TASK-483**, cubren defectos funcionales particulares. No se duplican ni se reescriben aquí.
- Se crea **AUD-NG-187 / TASK-484** exclusivamente para hacer válida, ejecutable y trazable la suite UX-01..UX-09. TASK-484 deberá probar las correcciones vinculadas, no sustituirlas.
- No se modifica el estado histórico de T-UX-10 ni las tareas posteriores.

## Hallazgo nuevo

**AUD-NG-187 (ALTO/P1):** `runUXSuiteTests` no verifica los flujos UX; ocho de nueve grupos son comprobaciones de existencia, UX-05 solo prueba una muestra y UX-07 puede aprobar sin indicador. El reporte no contempla pruebas omitidas/bloqueadas y no se demuestra integración de la suite en regresión ni en los cinco dashboards.

**Tarea ejecutable:** TASK-484, Implementar pruebas conductuales automatizadas para las nueve capacidades UX. Se registró al final de `Pendientes.md` con 13 puntos de alcance, criterios de aceptación por UX-01..UX-09, aislamiento de datos, estados de resultado, integración de ejecución y referencias a tareas existentes.

## Pruebas y limitaciones

- Inspección manual de `runUXSuiteTests`, helpers relacionados, dos suites Node.js, tres módulos de panel y cinco dashboards HTML.
- No se ejecutaron navegador, DOM real, pruebas de teclado/táctiles, APIs, Apps Script, servicios externos ni operaciones productivas.
- Los archivos fuente se conservaron sin modificaciones.

## SHAs de respaldo

- `js/ui-common.js`: 986938b8a311a41ed4cb3d135b66b6aaea4bed67.
- `js/student.js`: e2888cea60322e49a40b89adadb8010489605dcc.
- `js/teacher.js`: c475fce5afcd28fca23e7b64398ad32b17773746.
- `js/accounting.js`: a79ead4a54ad6fdb2f1e9df4775491ff7191a0c7.
- `tests/regression/academic-grading-suite.js`: 3433b707edd4a2f35c68368a3172932adc2a3b32.
- `tests/regression/modular-dashboard-suite.js`: 0495e1d526a872c33310935a003a83d924d34683.
- `completadas.md`: f57f1aef832e81e44fc4f7ec36a852d50e464676.
- `METODOLOGIA_DESARROLLO.md`: 214e8221bd076c4e89012636c105bffd5ca36467.
- `Pendientes.md` origen: 5c25ead336c43d953406fa0ea1a2564fd914add0.
- `Auditoria.txt` origen: 274603bad775376dc916f97ba8b92726016604e9.
- `MapaDependencias.md` origen: 76a645c5dc116be61353f8e20dd207c8b365e7c7.
- `AUDITORIA_COMPLETADAS_PLAN.md` origen: ba004aab517d261ec4bff0dc0a63400bed9495f6.
- `Contexto_personal.txt` origen: 429fd1b1eae0cfb89fa9431978398a9ced91a27d.
