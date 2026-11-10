## Metodología Oficial de Auditoría, Desarrollo, Verificación, Estandarización de Contenidos y Control de Calidad

# IMPORTANTE

----------------------------------------PROHIBIDO AGREGAR CONTENIDO ANTES DE ESTA LINEA-------------------------------------

# NORMA PRIORITARIA IMA — NDASC v1.0

Antes de trabajar en este repositorio, consultar `NORMAS_DESARROLLO_AGIL_SEGURO_CONTINUO.md`. Es la fuente normativa operativa única para IMA y prevalece sobre cualquier regla incompatible de este documento, incluidos sus procedimientos secuenciales, auditorías exhaustivas, respaldos duplicados, reinicios, commits únicos y gates administrativos.

El agente debe implementar de forma continua y autónoma, inspeccionar según el riesgo, ejecutar pruebas pertinentes, corregir de manera focalizada y preservar seguridad, datos, contratos y capacidades existentes. No se bloquea el trabajo independiente por PM-00, ciclos de dependencias no aplicables, documentos institucionales ni el indicador `protected=false`. La rama exclusiva es `NG_beta_0.0.0.1_work`; la rama base `NG_beta_0.0.0.1` es de solo lectura para el agente.

Las secciones posteriores de esta metodología siguen siendo referencia para requisitos de producto, seguridad, pruebas beta, continuidad y documentación cuando sean compatibles con NDASC. No deben usarse para restablecer burocracia que NDASC elimina. Las reglas específicas de presentaciones, contenidos, seguridad, privacidad y aceptación funcional no se derogan.

---

## PROHIBIDO BORRAR, MODIFICAR O ALTERAR LAS SIGUIENTES INSTRUCCIONES

Este documento conserva los estándares técnicos, funcionales y de calidad del ecosistema. Para IMA, el proceso operativo se rige por NDASC v1.0; las fases y controles de este documento son guías complementarias y no puertas administrativas universales. Para otros proyectos, se aplicará el procedimiento específico que corresponda.

---

# 1. PRINCIPIOS FUNDAMENTALES DE CONTROL

## 1.1 Objetividad Técnica
Toda decisión, aprobación o rechazo técnico deberá sustentarse exclusivamente en evidencia empírica y verificable. Se prohíbe taxativamente validar o rechazar implementaciones basándose en criterios de autoridad, jerarquía, antigüedad, preferencias personales o suposiciones.

## 1.2 Trazabilidad Total
Toda modificación o adición de código/contenido debe ser capaz de responder con exactitud milimétrica a las siguientes interrogantes:
- ¿Qué elemento o bloque se modificó?
- ¿Por qué se modificó?
- ¿Qué tarea registrada originó el cambio?
- ¿Qué hallazgo previo documentado dio pie a la tarea?
- ¿Qué archivos y módulos fueron afectados directamente?
- ¿Qué dependencias se ven impactadas o expuestas a riesgo colateral?

Cualquier cambio que carezca de traza documental será considerado inválido y revertido de inmediato.

## 1.3 Separación Obligatoria de Fases
Las actividades del ciclo de vida de desarrollo son compartimentos lógicos independientes: Auditoría, Desarrollo, Verificación interna, Code Review y cierre técnico. La aprobación mencionada en este documento es la aprobación interna de calidad/código, no una aprobación del usuario. La certificación funcional integral de la plataforma se gestiona separadamente en la fase de pruebas beta conforme a la sección 21. Ninguna fase puede omitirse, solaparse ni sustituirse.

## 1.4 Prohibición de Automatización de Auditoría
La auditoría de archivos de código o de estructuras de contenido deberá realizarse de forma exclusiva mediante análisis manual. Queda terminantemente prohibido delegar la revisión en escáneres, scripts de inspección masiva o herramientas de validación automática. Toda inspección se ejecutará línea por línea, función por función, variable por variable y dependencia por dependencia.

## 1.5 Prohibición de Autovalidación
Ninguna implementación se considerará correcta por el simple hecho de haber sido completada o porque compile. Toda modificación debe asumirse inicialmente como defectuosa o portadora de errores potenciales. La entidad responsable del desarrollo tiene la obligación metodológica de buscar evidencia activa de fallo antes de intentar recopilar evidencia de éxito.

## 1.6 Autocrítica Técnica Obligatoria
Toda verificación se ejecuta bajo hipótesis de error, omisiones y efectos colaterales.

## 1.7 Escepticismo Técnico Permanente
Todo elemento se considera potencialmente defectuoso hasta evidencia concluyente.

## 1.8 Resolución de Causa Raíz
Queda terminantemente prohibido implementar soluciones temporales, mecanismos de compensación, parches de "conveniencia" o fallbacks que oculten el problema original. Toda corrección debe identificar y resolver la causa raíz técnica del fallo.

---

# 2. ROLES LÓGICOS Y PRINCIPIO DE DESDOBLAMIENTO

## 2.1 Auditor
Detección de hallazgos sin modificar código.

## 2.2 Desarrollador
Implementación controlada de tareas autorizadas.

## 2.3 Revisor de Código
Validación estricta de implementación.

## 2.4 Desdoblamiento
Separación lógica entre auditor y desarrollador.

---

# 3. SISTEMA DE ARCHIVOS MAESTROS

```
[Raíz del Proyecto]
├── Auditoria.txt
├── changueslogs.txt
├── tareas_auditoria.txt
├── METODOLOGIA_DESARROLLO.md
├── pendientes/
└── Auditoría/
    ├── Informes de auditoría
    ├── MapaDependencias.md
    ├── PLAN_MAESTRO_IMPLEMENTACION.md
    ├── Contexto_personal.txt
    └── legacy/
        ├── Pendientes.md
        └── completadas.md
```

### 3.1 Auditoria.txt
Registro histórico y acumulativo ubicado en la raíz. Registra todos los hallazgos de la auditoría preimplementación, riesgos de regresión, incidencias y evidencia técnica indexada. **Está prohibido borrar, alterar, sobrescribir o purgar información histórica;** los nuevos hallazgos se anexan al final, conservando la cronología.

### 3.2 changueslogs.txt
Registro histórico y acumulativo ubicado en la raíz para documentar cambios aplicados al repositorio y al plan de implementación. Cada entrada identifica el cambio, archivos/rutas afectados, justificación y evidencia. Está prohibido borrar, editar o sobrescribir entradas existentes; cada registro nuevo se agrega exclusivamente al final.

### 3.3 MapaDependencias.md
Inventario técnico y estructural ubicado en `Auditoría/MapaDependencias.md`, que documenta relaciones lógicas, funciones, variables de estado, clases, constantes, rutas de importación y enlaces entre módulos.

### 3.4 Registro maestro de tareas derivadas de auditoría
El registro oficial, único y acumulativo de tareas ejecutables originadas por hallazgos de auditoría es `tareas_auditoria.txt`, ubicado en la raíz del repositorio. **Todo hallazgo accionable debe convertirse en una tarea ejecutable y registrarse en este archivo.** No basta con describir una recomendación ni con dejarla únicamente dentro del informe.

Cada informe conserva la evidencia completa del hallazgo y debe incluir una referencia cruzada al ID de la tarea registrada en `tareas_auditoria.txt`. El informe no sustituye ni duplica el registro maestro. Si un hallazgo no requiere acción, se clasifica expresamente como observación no accionable y se justifica.

Cada tarea del registro maestro debe contener como mínimo: ID único; fecha; ID y ruta del informe de origen; referencia exacta al hallazgo; severidad; objetivo; acción concreta y ejecutable; archivos/módulos afectados; dependencias y riesgos; alcance y exclusiones; criterios de aceptación verificables; prioridad; estado (Pendiente, En ejecución, Bloqueada o Completada); y evidencia de cierre cuando corresponda. «Completada» describe la implementación y sus controles internos; no significa que la funcionalidad haya superado la certificación funcional beta de toda la plataforma. Las pruebas beta se registran por separado en `beta_test.txt` (raíz del repositorio).

El registro debe distinguir tareas nuevas, ampliaciones de tareas existentes y hallazgos ya cubiertos por otro ID. No se crean IDs duplicados: si el hallazgo amplía una tarea existente, se actualiza la tarea existente conservando su historial y agregando la nueva referencia. Cada entrada nueva se anexa al final; no se eliminan ni reescriben tareas históricas. Los cambios de estado se registran como nuevas entradas de seguimiento o mediante un mecanismo de historial que preserve el estado anterior.

Los archivos `Pendientes.md` y `completadas.md` ubicados en `Auditoría/legacy/` son históricos y no son el registro operativo vigente. Los backlogs departamentales bajo `pendientes/<Departamento>/Pendientes.md` son el índice operativo de implementación según el plan maestro; no reemplazan `tareas_auditoria.txt` como fuente de tareas originadas por auditorías.

Los informes, mapas, planes y checkpoints de auditoría residen en `Auditoría/`; los tres registros maestros `Auditoria.txt`, `changueslogs.txt` y `tareas_auditoria.txt` residen en la raíz.

## 3.5 Rol de Auditor


Reglas, Normas y Procedimiento de Auditoría de Código

1. Objetivo

Establecer las normas, criterios y procedimientos obligatorios para la ejecución de auditorías técnicas de código fuente, garantizando un proceso riguroso, documentado, trazable y completamente independiente de cualquier criterio subjetivo o automatizado.

La auditoría tiene como finalidad identificar errores, defectos, inconsistencias, riesgos técnicos, deuda técnica, vulnerabilidades, incumplimientos de arquitectura, problemas de mantenibilidad y cualquier otro elemento que pueda afectar la calidad, estabilidad, seguridad o escalabilidad del sistema.

## 3.6. Reglas Fundamentales del Auditor

1. Objetividad Absoluta

-La auditoría debe ejecutarse bajo un principio de objetividad total.

-El auditor:

No debe validar implementaciones por autoridad.

-No debe asumir que una solución es correcta por provenir de un desarrollador experimentado.

-No debe aceptar una implementación únicamente porque fue solicitada o aprobada previamente.

-No debe otorgar validez a un componente basándose en la reputación, antigüedad o jerarquía de quien lo desarrolló.


-Toda conclusión deberá estar respaldada exclusivamente por evidencia técnica verificable.


---

3.7 Análisis Técnico Crítico

La revisión deberá realizarse desde múltiples perspectivas simultáneamente:
*Como Revisor de Código (Code Reviewer)
Evaluando:
-Calidad de implementación.
-Legibilidad.
-Mantenibilidad.
-Cumplimiento de estándares.
-Buenas prácticas.

*Como Auditor Técnico
Evaluando:
-Cumplimiento de requisitos.
-Consistencia arquitectónica.
-Integridad de procesos.
-Correcto uso de componentes.


*Como Inspector de Calidad
Evaluando:
-Errores potenciales.
-Casos límite.
-Omisiones.
-Duplicación de lógica.
-Código muerto.


*Como Auditor Forense
Evaluando:
-Origen de comportamientos inesperados.
-Dependencias ocultas.
-Efectos colaterales.
-Riesgos futuros.
-Trazabilidad de cambios.


Ningún detalle debe considerarse demasiado pequeño para ser revisado.


---

3.8 Prohibición de Automatización

La auditoría debe realizarse exclusivamente mediante inspección manual.

*Queda estrictamente prohibido utilizar:
-Herramientas automáticas de auditoría.
-Scripts de análisis masivo.
-Escáneres automáticos de código.
-Sistemas de revisión automática.
-Herramientas de corrección automática.
-Cualquier mecanismo que sustituya el análisis tecnico detallado.


La revisión deberá efectuarse:
-Línea por línea.
-Función por función.
-Variable por variable.
-Referencia por referencia.
-Dependencia por dependencia.
-Flujo lógico por flujo lógico.


El auditor es responsable de comprender completamente cada elemento inspeccionado antes de emitir una conclusión.


3.9 Registro Obligatorio de Hallazgos

Todo hallazgo identificado deberá registrarse obligatoriamente en el archivo:
Auditoria.txt
No se permite omitir hallazgos por considerarlos menores, evidentes o repetitivos.
Cada registro deberá contener como mínimo:
Fecha de auditoría.
Archivo auditado.
Módulo o sector afectado.
Línea o rango de líneas.
Tipo de hallazgo.
Descripción técnica detallada.
Impacto potencial.
Nivel de criticidad.
Dependencias relacionadas.

3.11 Conversión Obligatoria de Hallazgos en Tareas

Todo hallazgo accionable deberá convertirse, durante la etapa de auditoría, en una tarea ejecutable registrada en `tareas_auditoria.txt` en la raíz del repositorio. No podrán existir hallazgos accionables sin ID de tarea y sin registro en ese archivo. La tarea debe ser específica, verificable, implementable y validable de forma independiente; incluirá todos los campos obligatorios definidos en la sección 3.4. El informe de auditoría conservará la evidencia y añadirá la referencia cruzada al ID de la tarea, pero no será el registro maestro de tareas.

## 3.10 Proceso Oficial de Auditoría

3.11 Creación del Registro Maestro de Dependencias

Antes de iniciar la auditoría deberá crearse el archivo:

MapaDependencias.md

(Este nombre sustituye a "libreria.md" por describir con mayor precisión su propósito.)

Este documento funcionará como un registro central de trazabilidad y deberá contener:

Funciones

Nombre.

Archivo de origen.

Descripción.

Parámetros.

Valor de retorno.

Archivos que la utilizan.


Variables Globales

Nombre.

Tipo.

Archivo de origen.

Archivos consumidores.


Constantes

Nombre.

Valor.

Ubicación.

Dependencias.


Clases

Nombre.

Responsabilidad.

Herencia.

Dependencias.


Módulos

Nombre.

Función dentro del sistema.

Dependencias entrantes.

Dependencias salientes.


El objetivo es construir un mapa completo de relaciones internas del sistema.


---

3.12 Elaboración del Plan de Auditoría

Antes de auditar cualquier archivo deberá elaborarse un plan formal que establezca:

Orden de revisión.

Archivos a inspeccionar.

Dependencias críticas.

Riesgos conocidos.

Componentes prioritarios.

Estado actual de la auditoría.


El plan deberá actualizarse conforme avance el proceso.


---

3.13 Auditoría de Componentes Centrales

La auditoría iniciará obligatoriamente por los componentes de control principal del sistema, incluyendo:

Controladores.

Servicios principales.

Gestores de estado.

Núcleo de negocio.

Módulos de integración.

Sistemas de autenticación.

Motores de procesamiento.


Para cada archivo auditado se deberá registrar en MapaDependencias.md:

Funciones.

Variables.

Constantes.

Eventos.

Dependencias.

Relaciones con otros módulos.


Toda la información deberá organizarse por archivo y por bloques funcionales.


---

3.14 Creación de Respaldo

Antes de iniciar la revisión de cualquier archivo deberá generarse una copia de respaldo.

El archivo original no podrá ser modificado durante la etapa de auditoría.

La copia de respaldo servirá como referencia para validar la integridad del proceso.

### 3.14.1 Respaldo alternativo verificable mediante el historial Git

Cuando el entorno o las herramientas disponibles impidan crear una copia local íntegra, se admite como respaldo alternativo el blob inmutable del archivo conservado en el historial Git del repositorio, siempre que se cumplan todos los controles siguientes antes de editar:

1. Verificar y registrar el HEAD exacto de la rama de trabajo, la rama, el commit padre y el árbol de partida.
2. Registrar la ruta exacta del archivo, su SHA de blob Git, tamaño y codificación observados. Recuperar el archivo completo desde ese HEAD y comprobar que la lectura no esté truncada ni incompleta.
3. Confirmar que el commit que contiene el blob está publicado y es alcanzable desde el historial de la rama autorizada; un blob o árbol huérfano no constituye respaldo suficiente.
4. Registrar el comando de recuperación exacto: `git show <HEAD_VERIFICADO>:<RUTA>`, junto con la verificación `git hash-object`/SHA esperada. La recuperación debe poder realizarse sin depender del archivo modificado.
5. Para cada archivo, mantener el SHA original y el commit de respaldo en el checkpoint y en el registro de la tarea. Si la herramienta no permite verificar contenido íntegro o trazabilidad del blob, detener la edición de ese archivo.
6. Después de editar, comparar el contenido publicado contra el blob de respaldo mediante diff y SHA. No sustituir el respaldo histórico, no reescribir historia y no considerar un commit de trabajo como respaldo de sí mismo.

Este mecanismo es una alternativa de recuperación por control de versiones, no una copia local. Debe declararse expresamente como «respaldo Git histórico» y nunca como «respaldo local».


---

3.15 Inspección Manual Exhaustiva

Cada archivo será revisado completamente mediante inspección manual.

La revisión deberá abarcar:

Variables

Declaración.

Alcance.

Uso.

Reutilización.

Riesgos.


Funciones

Entradas.

Salidas.

Validaciones.

Casos límite.

Dependencias.


Lógica de Negocio

Flujo de ejecución.

Condiciones.

Reglas de negocio.

Coherencia funcional.


Dependencias

Importaciones.

Exportaciones.

Referencias cruzadas.

Acoplamientos.


Gestión de Errores

Captura de excepciones.

Manejo de estados inválidos.

Recuperación de fallos.


Rendimiento

Operaciones redundantes.

Bucles innecesarios.

Consultas repetidas.

Cálculos duplicados.


Ningún elemento podrá considerarse auditado sin haber sido inspeccionado individualmente.


---

3.16 Registro de Hallazgos y Trazabilidad

Todo hallazgo deberá registrarse en Auditoria.txt indicando:

Fecha.

Archivo.

Línea o rango de líneas.

Módulo afectado.

Función afectada.

Variable afectada.

Dependencias relacionadas.

Descripción técnica.

Impacto potencial.


Posteriormente deberá consultarse MapaDependencias.md para determinar:

Qué otros archivos utilizan el elemento afectado.

Qué procesos dependen de él.

Qué impacto podría generar una futura corrección.


Esta información deberá agregarse al registro correspondiente.


---

3.17 Validación Final y Restauración

Una vez finalizada la auditoría de un archivo:

a. Se comparará obligatoriamente con su copia de respaldo.


b. Si no existen diferencias:

El respaldo será eliminado.



c. Si existen diferencias:

El archivo auditado será restaurado utilizando la copia de respaldo.

Se verificará que quede exactamente igual a su estado original.




La auditoría no debe introducir modificaciones permanentes al código fuente.


---

3.18 Restricción Absoluta Durante la Auditoría

Durante la fase de auditoría queda estrictamente prohibido:

Corregir errores.

Refactorizar código.

Optimizar funciones.

Eliminar elementos.

Agregar nuevas funcionalidades.

Alterar configuraciones.

Modificar estructuras existentes.


La auditoría es exclusivamente una actividad de inspección, documentación y generación de hallazgos.

Toda corrección deberá realizarse posteriormente mediante las tareas ejecutables registradas en `tareas_auditoria.txt`. El informe de auditoría deberá incluir una sección final de **Referencias a tareas derivadas**, donde se enumeren los IDs creados o ampliados en el registro maestro, sin duplicar sus fichas completas.

#### Protocolo obligatorio de registro en tareas_auditoria.txt

Cada hallazgo accionable debe generar o ampliar una ficha de tarea en `tareas_auditoria.txt`, usando esta estructura:

```markdown
### [TASK-###] Título de la tarea
- **Hallazgo de origen:** [ID y referencia exacta dentro del informe]
- **Severidad:** [Crítico | Alto | Medio | Bajo | Observación]
- **Objetivo:** [Resultado técnico esperado]
- **Acción ejecutable:** [Cambio concreto que debe realizarse]
- **Archivos/módulos afectados:** [Rutas y componentes exactos]
- **Dependencias y riesgos:** [Relaciones y efectos colaterales]
- **Alcance:** [Límites explícitos de implementación]
- **Criterios de aceptación:** [Condiciones medibles y verificables]
- **Prioridad:** [P0 | P1 | P2 | P3]
- **Estado:** [Pendiente | En ejecución | Bloqueada | Completada]
- **Evidencia de cierre:** [Commit, requisitos implementados, verificaciones internas, autoauditoría y Code Review; indicar pruebas funcionales beta pendientes cuando aplique]
```

Los IDs deben ser únicos en el proyecto. Las tareas preexistentes se conservan y se amplían por referencia; no se generan IDs duplicados. `tareas_auditoria.txt` es la fuente de verdad de las tareas derivadas de auditoría y de su estado. El informe es la fuente de verdad de la evidencia del hallazgo.
## CLASIFICACIÓN DE HALLAZGOS
Todo hallazgo deberá clasificarse obligatoriamente.
*Crítico
Produce:
Pérdida de datos.
Vulnerabilidades.
Fallos graves.
Corrupción de procesos.
Corrección obligatoria inmediata.
*Alto
Impacta:
Funcionalidad principal.
Integridad lógica.
Estabilidad del sistema.
*Medio
Afecta:
Mantenibilidad.
Rendimiento.
Consistencia.
*Bajo
No afecta funcionalidad actual.
Representa:
Mejoras recomendadas.
Limpieza técnica.
Observación
No requiere corrección inmediata.
Se documenta para seguimiento.

# 4. FLUJO DE TRABAJO ESTRICTO Y SECUENCIAL (8 FASES)
El flujo de trabajo se ejecutará de forma lineal, síncrona y obligatoria. Violar la secuencia o avanzar de fase sin completar los entregables documentales exigidos invalidará el proceso en su totalidad.
```
  FASE 0: Auditoría Previa Obligatoria (Rol Auditor)
    │
    ▼
  FASE 1: Registro Formal de Hallazgos
    │
    ▼
  FASE 2: Conversión de hallazgos en tareas ejecutables en tareas_auditoria.txt
    │
    ▼
  FASE 3: Respaldo Íntegro de Seguridad
    │
    ▼
  FASE 4: Ejecución y Desarrollo Controlado (Rol Desarrollador)
    │
    ▼
  FASE 5: Autoauditoría Posterior (Rol Auditor - Desdoblamiento)
    │
    ▼
  FASE 6: Revisión de Código Externa (Code Review)
    │
    ▼
  FASE 7: Cierre Operativo y Limpieza de Entorno

```
### FASE 0 — Auditoría Previa Obligatoria
 * **Acción:** Análisis visual y manual, línea por línea, del archivo o estructura origen de la tarea. El operador asume el rol estricto de *Auditor* y debe de cumplir todas las normas descritas en el apartado 3.6. 'Reglas Fundamentales del Auditor'
   
 * **Restricción:** **PROHIBIDO** realizar modificaciones, limpiezas de estilo o correcciones de código en esta etapa. Su meta es mapear el estado actual, riesgos latentes y efectos colaterales.
### FASE 1 — Registro Formal de Hallazgos
 * **Acción:** Toda anomalía, desviación estándar o vulnerabilidad observada debe asentarse de inmediato en Auditoria.txt.
 * **Manejo de Hallazgos Fuera de Alcance:** Si durante la inspección de la tarea asignada se detectan fallas críticas o desviaciones ajenas al objetivo actual, se procederá de la siguiente forma:
   1. Durante la auditoría está prohibido corregir, incluso si el ajuste parece simple. Toda anomalía se documenta y se convierte en tarea ejecutable en `tareas_auditoria.txt` cuando sea accionable.
   2. La corrección se ejecutará después, como tarea seleccionada según el Plan Maestro, con su propio respaldo, alcance, pruebas y revisión. Solo se admite una excepción documental de bajo riesgo si el usuario la autoriza expresamente y queda delimitada.
   3. Todo auditor debe asumir el rol y cumplir las reglas del apartado 3.5.
### FASE 2 — Planificación de Implementación
 * **Acción:** Se registran en `tareas_auditoria.txt` las tareas ejecutables derivadas de los hallazgos de la auditoría de la tarea objetivo o de la auditoría de continuidad de la tarea anterior. El estado de la tarea de producto seleccionada se actualiza en su backlog departamental y en el Plan Maestro; solo se actualiza también en `tareas_auditoria.txt` cuando esa tarea tenga origen en un hallazgo de auditoría. Se preserva el historial de estados y se delimitan alcance e impactos sobre `Auditoría/MapaDependencias.md`.
### FASE 3 — Respaldo Íntegro de Seguridad
 * **Acción:** Antes de modificar un solo bit, se creará una copia de seguridad exacta y manual del archivo o archivos a editar.
 * **Requisitos:** El respaldo conservará el nombre de origen y su contenido íntegro, y se almacenará localmente de forma temporal. Si no puede generarse localmente, se aplicará obligatoriamente el respaldo alternativo verificable de §3.14.1; no se permite editar sin uno de los dos mecanismos íntegros.
### FASE 4 — Ejecución y Desarrollo Controlado
 * **Acción:** El operador adopta el rol de *Desarrollador*. Se procede a codificar e implementar **ÚNICAMENTE** lo explícitamente solicitado en los criterios de aceptación de la tarea registrada en `tareas_auditoria.txt` y vinculada al informe de auditoría de origen.
 * **Restricciones:** Queda estrictamente **PROHIBIDO**:
   * Alterar estilos tipográficos, clases visuales o propiedades CSS no relacionadas con la tarea.
   * Modificar o alterar flujos lógicos existentes que funcionen de manera correcta.
   * Introducir optimizaciones prematuras, refactorizaciones cosméticas o limpieza de "código muerto" que no formen parte del requerimiento original.
### FASE 5 — Autoauditoría Posterior (Desdoblamiento Crítico)
 * **Acción:** Finalizada la codificación, el operador se despoja del rol de desarrollador y asume nuevamente el rol de *Auditor Técnico*.
 * **Subfase 5.1 - Comparación Post-Edición (Diff Manual):** Se confronta de forma manual el archivo modificado contra la copia de respaldo generada en la Fase 3. Se deben aislar visualmente todas las líneas eliminadas, modificadas y los bloques sobrescritos. Si se detecta un solo cambio ajeno, accidental o cosmético no solicitado por la tarea, se **REVERTIRÁ** inmediatamente esa sección y se reiniciará la comparación.
 * **Subfase 5.2 - Verificación técnica interna de la implementación:** revisión del diff, rutas críticas, pruebas unitarias/componentes/contratos disponibles, tipos/esquemas, seguridad local, persistencia aislada y verificaciones técnicas reproducibles para detectar defectos del cambio. No equivale a certificar funcionalmente toda la plataforma.
 * Las pruebas E2E, escenarios completos por rol y regresión transversal se consolidan en `docs/testing/PRUEBAS_FUNCIONALES_BETA.md` y se ejecutan cuando IMA entre formalmente en beta. No retrasar Completada por pruebas beta aún no iniciadas.
   - **Verificación técnica de persistencia:** en entorno aislado, comprobar que la operación escribe y recupera el formato esperado, sin duplicados ni corrupción. No sustituye escenarios beta; no usar datos reales de producción.
   - **Integridad técnica:** pruebas acotadas para comprobar que el cambio no introduce duplicados, huérfanos ni inconsistencias estructurales. Los recorridos completos y conciliaciones entre módulos se registran para beta.
   - **Reconstrucción técnica de estado:** si la tarea modifica persistencia o estado de interfaz, realizar comprobación acotada de lectura/recarga cuando el entorno lo permita. Los recorridos completos de sesión y reconstrucción por perfil se planifican en beta.
   - **Regresión del alcance:** comprobar que el cambio no rompe rutas directamente afectadas y ejecutar pruebas automatizadas disponibles. La certificación de regresión de todo el portal se difiere a beta.
   - **Prohibición de Supuestos:** Ningún cambio se considera correcto sin evidencia empírica de su efectividad funcional.
### FASE 6 — Revisión de Código Externa (Code Review)
 * **Acción:** El código y los registros son sometidos al escrutinio del *Revisor de Código*.
 * **Protocolo ante Observaciones (Reinicio del Ciclo):** Si el informe de Code Review detecta la más mínima falla, riesgo, omisión o comportamiento inesperado, se aplicará la regla de **Extensión Obligatoria**:
   * Toda observación constructiva **REINICIA EL CICLO COMPLETO** desde la Fase 0 (Auditoría Inicial).
   * Deberá aplicarse el procedimiento completo nuevamente, inclusive si implica volver a alterar archivos que ya habían sido editados. No se admiten parches calientes ni correcciones parciales fuera del flujo.
### FASE 7 — Cierre Operativo y Limpieza
 * **Acción:** Cuando todos los requisitos de implementación estén satisfechos, la autoauditoría concluida y el Code Review interno aprobado, actualizar changueslogs.txt, checkpoint, informe, backlog y Plan Maestro a Completada con evidencia. No se requiere aprobación adicional del usuario ni ejecutar la campaña beta para cerrar la implementación. Registrar las pruebas beta pendientes en `docs/testing/PRUEBAS_FUNCIONALES_BETA.md`.
 * **Limpieza de Entorno:** Los archivos temporales de respaldo se eliminarán de forma definitiva únicamente **DESPUÉS** del Code Review interno aprobado. Asimismo, cualquier captura de pantalla, log volátil o ejecutable auxiliar generado para la verificación visual deberá ser purgado del directorio de forma obligatoria en el pre-commit.
# 5. CLASIFICACIÓN TÉCNICA DE HALLAZGOS
Todo defecto, desviación o vulnerabilidad identificada en las Fases 0 o 5 debe ser catalogada obligatoriamente bajo la siguiente escala de severidad:
| Clasificación | Impacto Operativo y Técnico | Acción Requerida |
|---|---|---|
| **CRÍTICO** | Provoca pérdida de persistencia de datos, introduce vulnerabilidades de seguridad, regresiones graves, bloqueos del hilo principal o corrupción del flujo pedagógico del estudiante. | Bloqueo total del flujo. Corrección obligatoria e inmediata. |
| **ALTO** | Quiebra una funcionalidad principal del módulo, destruye la integridad lógica o compromete la estabilidad general de la interfaz o el canvas. | Prioridad máxima en el siguiente ciclo de desarrollo. |
| **MEDIO** | Degrada la mantenibilidad del código, impacta negativamente el rendimiento de carga o rompe la consistencia del diseño institucional. | Planificación y resolución sistemática. |
| **BAJO** | No altera en absoluto la experiencia de usuario ni la lógica matemática, pero representa desviaciones de la guía de estilos o requiere limpieza técnica menor. | Subsanación supeditada a disponibilidad de tiempos. |
| **OBSERVACIÓN** | Hallazgo que no requiere una acción correctiva a corto plazo, pero se documenta formalmente para tareas futuras de arquitectura. | Registro histórico preventivo. |
# 6. NORMAS DE ESTANDARIZACIÓN DE PRESENTACIONES HTML (IMA V2)
Esta sección rige la arquitectura de las lecciones interactivas del Área de Informática del Instituto María Auxiliadora. Ninguna presentación será desplegada si presenta una sola desviación de este marco conceptual y técnico.
## 6.1 Directrices de Plantilla y Herencia Estructural
 * **Plantilla Base Obligatoria:** Es imperativo tomar como canvas estructural y plantilla base el archivo aprobado Imperativos_Procedurales.html. Se debe clonar íntegramente su arquitectura de scripts de control, lógica de navegación, inicializadores de eventos y estilos CSS subyacentes.
 * **Prohibición de Contenido Académico Heredado:** Queda estrictamente **PROHIBIDO** heredar o duplicar el contenido conceptual o las preguntas del cuestionario del archivo plantilla. La clonación es única y exclusivamente técnica y estructural.
## 6.2 Arquitectura de Contenidos y Secuencia Pedagógica (16 Diapositivas Exactas)
Toda presentación configurada dentro del ecosistema debe contener **EXACTAMENTE 16 diapositivas** indexadas de forma nativa en su marcador global (visualizadas invariablemente desde 1 / 16 hasta 16 / 16). No se tolera la existencia de 15, 17 o cualquier otra cifra de pantallas. La secuencia lógica se divide de manera rigurosa de la siguiente forma:
```
 [Diapositiva 1]  --> Portada Institucional y Metadatos Académicos
 [Diapositivas 2-11]--> Desarrollo Temático Expositivo, Bloques Conceptuales y Código, si el plan de clases muestra dos temas, se dividirá a razon del tema con mas contenido en el archivo fuente. 
 [Diapositiva 12] --> Ejercicio Guiado Práctico (Resolución paso a paso)
 [Diapositiva 13] --> Actividad en Clase (Asignación autónoma del estudiante)
 [Diapositiva 14] --> Sección de Transición Pedagógica Pre-Evaluación
 [Diapositiva 15] --> Cuestionario Automatizado (10 reactivos de opción múltiple)
 [Diapositiva 16] --> Cierre Institucional, Espacio de Preguntas y Preparación de Aula

```
### Especificaciones por Diapositiva:
 * **Diapositiva 1 (Portada):** Conservará el funcionamiento en JavaScript de la plantilla base, limitando la edición manual a la actualización estricta de: Tema (<h2>), Asignatura, Unidad, Grado, Sección de la Carrera de Bachillerato Técnico Profesional, Nombre completo del docente con su título académico y Fecha exacta de la sesión en formato natural. El logo institucional debe contar con dimensiones responsivas fijas: width: 250px; en entornos de escritorio y width: 100px; en dispositivos móviles.
 * **Diapositivas 2 a 11 (Desarrollo):** Exposición progresiva de conceptos teóricos. Si la sesión abarca dos subtemas, las diapositivas se segmentarán proporcionalmente según la extensión y complejidad de los contenidos, debiendo finalizar por completo antes del Quiz.
   * *Títulos:* Maquetados de forma obligatoria con la etiqueta <h3>.
   * *Cajas de Concepto Clave (.concept-box):* Toda definición central, axioma o de arquitectura se encapsulará en contenedores con alineación a la izquierda, fondo #f9fafb y un borde lateral izquierdo sólido de 8px (adaptable a 4px en resoluciones móviles). Los colores de borde seguirán la semántica pedagógica (azul estándar, azul claro, amarillo de advertencia, verde de éxito o gris neutro).
   * *Listas:* Quedan prohibidos los bloques de texto extensos, continuos y saturados. Las secuencias lógicas y arquitecturas de hardware/software se estructurarán en listas ordenadas (<ol>) o desordenadas (<ul>) con tipografía espaciada e interlineado amplio.
 * **Diapositiva 12 (Ejercicio Guiado):** Planteamiento de un problema técnico o de lógica algorítmica aplicada, desglosando una guía ordenada paso a paso para su resolución. Debe ser un ejercicio de nivel básico y es un requisito mandatorio que no haya sido repetido en ejemplos anteriores ni en temas adyacentes de la asignatura.
 * **Diapositiva 13 (Actividad en Clase):** Sección de aplicación autónoma individual titulada obligatoriamente **"Actividad en clase"**. Debe desglosar las instrucciones técnicas de la práctica, el objetivo conceptual de la misma (ej. vinculación con memoria, procesamiento o lógica imperativa) y una nota aclaratoria en formato itálico y fuente reducida con los criterios de evaluación aplicables al cuaderno o la computadora para la revisión presencial del taller. El ejercicio planteado debe cumplir con la norma de no repetición académica.
 * **Diapositiva 15 (Cuestionario Automatizado de Evaluación):** Bloque interactivo controlado de forma dinámica mediante la inyección de una matriz de datos en JavaScript (quizData).
   * Albergará **10 preguntas de opción múltiple** renderizadas de forma simultánea dentro de la misma diapositiva.
   * Cada reactivo constará de 4 opciones dinámicas controladas mediante la clase .quiz-option, donde únicamente una alternativa será matemáticamente correcta.
   * Las opciones incorrectas deben operar como distractores plausibles basados fielmente en los textos técnicos oficiales de la asignatura; **quedan terminantemente prohibidas las respuestas falaces de descarte obvio o absurdo.**
   * Al interactuar con las opciones, el script bloqueará los inputs, cambiará el estilo del botón presionado (Verde #d1fae5 para aciertos / Rojo #fee2e2 para fallos), inyectará una retroalimentación objetiva en la zona inferior y realizará una transición automática tras un retardo exacto de 2 segundos hacia el siguiente reactivo.
   * **Aclaración de Feedback:** Queda estrictamente prohibido introducir frases sintácticas vagas o contextuales como "según el PDF" o "conforme al documento de lectura". El indicador de éxito o fallo debe limitarse a marcar de forma determinista la opción correcta y proveer una justificación técnica pura y absoluta.
 * **Diapositiva 16 (Cierre Institucional):** Titulada obligatoriamente **"¡Fin del Tema!"**. Incluirá una caja .concept-box con borde azul dedicada a la apertura de un foro de preguntas, así como las instrucciones para que los alumnos preparen sus libretas e de cara a las revisiones en el taller presencial.
## 6.3 Restricciones de Integridad Académica y Metadatos
 * **Fuentes Autorizadas:** Queda estrictamente prohibido extraer teoría o conceptos de fuentes externas de internet. La base conceptual se limitará única y exclusivamente a los textos y PDFs oficiales proporcionados en la carpeta de la asignatura.
 * **Coherencia del Plan de Clases:** Se validará la fecha de la sesión contra el Plan de Clases oficial del instituto para garantizar la perfecta correspondencia del tema. Es mandatorio auditar el tema anterior y posterior para resguardar la fluidez cronológica y evitar saltos lógicos.
 * **Metadatos de Preguntas (CRÍTICO):** Toda pregunta inyectada en el motor de reactivos de JavaScript debe incluir obligatoriamente el siguiente objeto estructurado de metadatos:
   ```javascript
   {
     question: "Texto de la pregunta...",
     options: ["A", "B", "C", "D"],
     answer: 0, // Índice literal de la respuesta correcta, no la posicion.
     tema: "Nombre_Exacto_Del_Tema", // PROHIBIDO usar el comodín "General"
     asignatura: "Nombre_De_La_Asignatura",
     grado: "11", // u "12" según corresponda
     nivel: "BTP"
   }
   
   ```
   La clasificación taxonómica se realiza exclusivamente desde el origen de la presentación; se prohíben las inferencias automáticas por palabras clave en tiempo de ejecución.
## 6.4 Identidad Visual, Tipografía y Paleta de Colores
El entorno visual se mantendrá minimalista y profesional, implementando hojas de estilo en cascada bajo las siguientes directrices tipográficas y de color:
### Tipografías Google Fonts:
 * **Títulos de Portada (<h2>):** Fuente **Poppins** con peso tipográfico de 800. Tamaño de visualización: 3rem en escritorio y 1.75rem en móviles. Color de énfasis: Azul institucional (#0d6efd).
 * **Títulos de Contenido (<h3>):** Fuente **Poppins** con peso tipográfico de 700. Tamaño de visualización: 2.25rem en escritorio y 1.4rem en móviles. Color: Gris oscuro neutro (#1f2937) para máxima legibilidad ante proyección.
 * **Cuerpo de Texto y Listas (p, li, .quiz-option):** Fuente **Inter** con peso tipográfico de 400 para descripciones y 600 para estados activos. Tamaño de visualización: 1.5rem con un interlineado estricto de 1.6 en escritorio, adaptándose de forma elástica a 1rem con interlineado de 1.4 en dispositivos móviles. Color base del texto: #4b5563 o #1f2937.
 * **Bloques de Código y Consolas:** Fuente tipográfica **Console / monospace** (emulando los entornos de PSeInt o Code Studio). Se exige una indentación rigurosa, tipografía limpia y la remoción absoluta de cualquier ornamento visual o script automatizado que actúe como distractor pedagógico.
### Paleta Restringida de Colores:
 * **Azul Principal (#0d6efd / #0b5ed7):** Títulos de portada, bordes de enfoque y botones activos de navegación.
 * **Gris de Fondo y Contornos (#f3f4f6 / #e5e7eb / #9ca3af):** Estructura del canvas de fondo, bordes de las opciones del cuestionario y contadores de navegación.
 * **Blanco Puro (#ffffff):** Color exclusivo y mandatorio para el canvas del contenedor de las diapositivas (#presentation-container), garantizando el contraste nativo ante proyectores escolares de haz de luz limitado.
## 6.5 Encabezado y Pie de Página Global
La presentación integrará de manera obligatoria la estructura global de identidad de la plataforma en perfecta consonancia con la página principal (index.html):
 * **Encabezado (<header id="page-header">):** Fondo blanco puro con sombra ligera .shadow-sm. Maquetación de tablas o bloques que ubica a la izquierda el logotipo de la institución (width: 150px; height: auto; en pantallas de escritorio / width: 100px; en pantallas móviles) junto al título oficial de la asignatura. A la derecha, se implementará un enlace de navegación de retorno apuntando exactamente a ../../index.html con la leyenda *"Volver al Inicio"*.
 * **Pie de Página (<footer id="page-footer">):** Bloque de fondo gris oscuro (bg-gray-900) con texto en color blanco centrado. Es obligatoria la inclusión de la imagen de la bandera de Honduras (width="60") alineada de forma horizontal junto a la reserva de derechos de autor del *Instituto María Auxiliadora - Área de Informática*.
## 6.6 Sistema de Navegación Híbrido Multidispositivo
El script interceptará y procesará de manera nativa los eventos de entrada del teclado, mouse y gestos táctiles sin generar conflictos de interfaz:
### Comportamiento en Escritorio:
 * **Avance de Diapositiva:** Tecla *Flecha Derecha*, *Barra Espaciadora* (aplicando obligatoriamente e.preventDefault() para neutralizar el scroll nativo del navegador) o un *Clic Simple* en cualquier región libre del canvas del contenedor (#presentation-container). El clic se ignorará si el cursor interactúa con hipervínculos, cajas .concept-box o botones .quiz-option.
 * **Retroceso de Diapositiva:** Tecla *Flecha Izquierda*.
 * **Controles Gráficos Manuales:** Un wrapper inferior (#controls-wrapper) proveerá botones interactivos para navegación guiada. El botón *"Anterior"* se deshabilitará lógicamente en la diapositiva 1, y el botón *"Siguiente"* se deshabilitará al alcanzar la diapositiva 14 (pre-quiz). Estos botones se ocultarán por completo por medio de hojas de estilo al conmutar a pantalla completa, delegando la navegación en el teclado o clics zonales.
### Comportamiento en Dispositivos Móviles (<= 768px):
 * **Navegación Zonal por Toque:** Al registrarse un toque simple, el script evaluará de forma analítica la coordenada horizontal del impacto con respecto al ancho total de la pantalla:
   * Si el toque se efectúa dentro del primer **30% del ancho (borde izquierdo)**, la presentación ejecutará un retroceso.
   * Si ocurre en el **70% restante del ancho (zona central y derecha)**, la presentación ejecutará un avance secuencial.
 * **Navegación por Gestos de Desplazamiento (Swipe):** El manejador de eventos táctiles registrará los vectores de inicio y fin en los ejes X e Y. Si el vector horizontal es predominante y la distancia absoluta recorrida supera un umbral estricto de **50 píxeles**, se disparará el flujo:
   * *Swipe de derecha a izquierda:* Provoca el avance inmediato de diapositiva.
   * *Swipe de izquierda a derecha:* Provoca el retroceso inmediato de diapositiva.
## 6.7 Resiliencia ante Zoom del Navegador y Control en Pantalla Completa
 * **Activación Nativa:** El estado de pantalla completa se disparará de forma exclusiva al registrarse un evento de **doble clic** (escritorio) o **doble toque** continuado (móviles) sobre cualquier área vacía de la portada de la presentación, invocando la API nativa requestFullscreen().
 * **Transformación de Interfaz:** Al activarse, el script inyectará la clase CSS .hide-element para provocar la desaparición absoluta de: El encabezado institucional (#page-header), el pie de página global (#page-footer) y el contenedor de botones manuales (#controls-wrapper). El contador nativo (#slide-counter) permanecerá visible para control del docente.
 * **Control del Zoom y Redimensionamiento Híbrido (CRÍTICO):** Para evitar desbordamientos visuales causados por la manipulación del zoom en el aula, la función de escucha de redimensionamiento (window.addEventListener('resize')) se programará con una técnica de *debouncing* asíncrona fijada en 100ms.
> ### Regla de Oro para el Control del Canvas:
> Si el script detecta a través del manejador corregido que la altura útil de la ventana del navegador es igual o superior a la altura física total del monitor menos un umbral de tolerancia por barras nativas (window.innerHeight >= (screen.height - 15)), se deducirá un estado de maximización forzada o alteración de escala.
> En ese instante, se ejecutará de forma automática la **auto-ocultación absoluta** del encabezado y el pie de página. Esta instrucción anula cualquier renderizado accidental, impidiendo bajo toda circunstancia que el zoom desborde elementos institucionales sobre el contenido académico central de la diapositiva.
> 
## 6.8 Gestión de Componentes Gráficos y Visuales
 * **Atributo Alt Obligatorio:** Toda imagen externa inyectada (<img>) debe portar obligatoriamente su etiqueta alternativa descriptiva para validación estructural y accesibilidad. Se maquetarán con propiedades fluidas (max-width: 100%; height: auto;) para evitar desbordamientos en cualquier canvas.
 * **Iconografía Vectorial:** Ante la ausencia de un recurso gráfico externo, se recurrirá de forma obligatoria al uso de iconos vectoriales que guarden relación semántica directa con la materia.
 * **Generación Nativa de Diagramas (HTML/CSS/JS):** Si la lección requiere ilustrar flujos lógicos complejos, mapas conceptuales, diagramas de bloques o esquemas de direccionamiento de memoria, y no se cuenta con un recurso gráfico autorizado, **es obligatorio generar el recurso visual de forma nativa.** Esto se logrará estructurando contenedores HTML, aplicando clases utilitarias de Tailwind CSS y manipulando lógica interactiva en JavaScript incrustada directamente en la diapositiva, priorizando un renderizado limpio, responsivo y escalable por sobre imágenes estáticas externas.
## 6.9 Protocolo Específico de Auditoría para Presentaciones
Antes de empaquetar o autorizar la publicación de una presentación en el portal oficial de la institución, esta debe superar de manera obligatoria la siguiente batería de pruebas manuales locales:
 1. **Validación Numérica de Canvas:** Certificar que el arreglo de diapositivas cuente exactamente con 16 ítems y que el indicador de interfaz no sufra de saltos o desfases lógicos.
 2. **Prueba de Estrés Multidispositivo:** Verificar de forma manual el correcto funcionamiento de las flechas del teclado, la barra espaciadora, los clics zonales laterales en simulación móvil, y los gestos táctiles de deslizamiento (*swipe*), descartando bloqueos en el hilo de ejecución o saltos involuntarios.
 3. **Auditoría del Motor de Reactivos:** Confirmar la correcta inyección de las cadenas de texto del array quizData, validar que el flujo de aciertos y fallos responda fielmente a las claves del PDF oficial de la materia, y comprobar que la transición automática se ejecute sin retrasos a los 2 segundos exactos.
 4. **Prueba de Resistencia de Zoom Extremo:** Activar el modo de pantalla completa por medio del doble clic nativo, proceder a alterar de forma repetida el zoom del navegador en la escala local (conmutando cíclicamente entre 100%, 110%, 125%, 150% y viceversa) y certificar documentalmente que el encabezado y el pie de página permanezcan invisibles o perfectamente ocultos sin corromper la alineación vertical centrada de los contenidos académicos.
# 14. REGLA ABSOLUTA
SI NO SE AUDITA, NO SE MODIFICA.
SI NO SE DOCUMENTA, NO EXISTE.
SI NO SE PUEDE TRAZAR, NO SE APRUEBA.
SI NO PASA CODE REVIEW, NO SE CIERRA.
EL INCUMPLIMIENTO DE CUALQUIER PASO DEL PRESENTE COMPENDIO INVALIDA EL PROCESO COMPLETO Y REINICIA LAS ACCIONES DESDE LA FASE DE AUDITORÍA INICIAL.


# 15. CONTROL DE COMMITS CONSOLIDADOS (REGLA OBLIGATORIA)

1. **Un solo commit por iteración completa:** cada iteración de trabajo debe quedar registrada en exactamente un commit final que agrupe todos los archivos modificados como consecuencia de esa iteración.
2. **Agrupación completa:** antes de crear el commit se deben identificar, preparar y revisar todos los cambios relacionados, incluidos código, pruebas, changueslogs.txt, informes y checkpoints, respetando las restricciones particulares de cada archivo y fase.
3. **PROHIBIDOS los commits atómicos:** nunca crear commits independientes por archivo, documento, carpeta, subtarea o avance intermedio. No publicar un commit para «guardar» una parte mientras se sigue editando.
4. **La organización por tareas/lotes no fragmenta la publicación:** pueden documentarse tareas y subtareas por separado, pero todos los cambios de la misma iteración se reúnen en un único commit. No crear un commit por cada tarea si forman parte de la misma iteración. Solo se permiten commits separados cuando el usuario lo autorice expresamente.
5. **Cierre antes de confirmar:** revisar el diff completo; verificar que no falten archivos, que no se incluyan modificaciones ajenas y que se preserven todos los registros históricos. El checkpoint obligatorio debe estar incluido en ese mismo commit.
6. **Integridad y trazabilidad:** el mensaje del commit debe identificar la iteración y su propósito. El commit debe ser descendiente del HEAD verificado de la rama de trabajo autorizada. No reescribir historia ni usar force push, salvo excepción expresa, específica y documentada del usuario para consolidar una misma iteración que haya quedado fragmentada por commits parciales. La excepción se limita a la rama de trabajo autorizada, exige conservar todos los cambios y commits independientes ajenos a esa iteración, registrar los HEAD de origen y destino, usar control de concurrencia al actualizar la referencia y verificar que la rama base permanezca intacta. La autorización no se extiende a otras tareas, ramas ni operaciones.
7. **Bloqueos o fallos:** si no es posible incluir/publicar todos los cambios en un único commit, detenerse sin crear commits parciales. Documentar el bloqueo en el checkpoint preparado y reportarlo. No dividir el trabajo para eludir límites/cuotas.
8. **Verificación posterior:** confirmar el SHA final, el árbol, la lista de archivos y el HEAD de la rama después de publicar. Verificar también que la rama base permanezca sin cambios. No crear un segundo commit solo para añadir el SHA del commit que contiene el propio checkpoint; ese SHA se confirma externamente y se informa en el reporte.
9. **Alcance:** esta regla aplica a auditorías, documentación, desarrollo, correcciones, verificaciones y cualquier otra tarea de IMA. No autoriza modificar archivos prohibidos ni omitir fases, revisiones, aprobaciones, respaldos o controles establecidos en las demás reglas.

Esta sección reemplaza cualquier interpretación anterior de «un commit por tarea» que genere más de un commit para una misma iteración. No deroga las demás restricciones de alcance, seguridad, revisión ni preservación histórica.

# 16. CHECKPOINTS OBLIGATORIOS Y CONTROL DE CONTINUIDAD

1. **Checkpoint como condición de cierre:** toda iteración debe terminar con un checkpoint actualizado en el archivo de contexto existente. También es obligatorio antes de cualquier pausa planificada, interrupción, transferencia a otro agente/chat, cierre de sublote o detención por bloqueo. No se puede declarar terminada una iteración sin él.
2. **Checkpoint como condición de inicio:** antes de comenzar, el agente debe leer el último checkpoint y comprobarlo contra el estado real de GitHub. Si el checkpoint está ausente, incompleto, contradictorio o apunta a una rama/HEAD distinto, primero debe resolver la discrepancia y documentarla; no continuar a ciegas.
3. **Acumulación e inmutabilidad:** cada checkpoint se agrega como nueva entrada cronológica. Está prohibido borrar, sustituir, resumir o reordenar checkpoints/registros previos, o crear un segundo archivo de contexto con otra extensión.
4. **Datos obligatorios:** incluir repositorio, archivo de contexto exacto, rama base, rama de trabajo, HEAD de partida verificado, último commit conocido, último ID/tarea/lote completado, elemento en curso y estado, siguiente elemento exacto, archivos y funciones/secciones/rangos inspeccionados, propósito de la inspección, hallazgos respaldados, requisitos pendientes, SHAs de respaldo, pruebas ejecutadas/no ejecutadas, archivos modificados/no modificados, restricciones/bloqueos y próxima acción concreta.
5. **Punto de reanudación reproducible:** especificar qué archivo abrir, qué función/segmento revisar, qué criterio se estaba contrastando, qué resultado se obtuvo y qué consulta concreta sigue. No usar frases vagas como «continuar auditoría».
6. **Cierre Git:** preparar el checkpoint junto con los demás cambios antes del commit único de la iteración. Tras publicar, verificar que ese commit contiene el checkpoint. Como el SHA de un commit no puede incluirse dentro del contenido que determina su propio SHA, registrar dentro del checkpoint el HEAD de partida y la indicación «commit de cierre: el commit que contiene este checkpoint»; consultar el HEAD de la rama después de publicar y comunicar el SHA final en el reporte y/o PR. No crear un segundo commit para añadirlo.
7. **Bloqueo:** si no es posible preparar o publicar el checkpoint dentro del commit único, detenerse sin commits parciales. El estado no se considera cerrado; informar qué quedó preparado y qué impidió publicarlo.
8. **Auditoría de continuidad al reanudar:** verificar rama/HEAD de ambas ramas, leer contexto/metodología/plan/informes citados, comprobar cambios posteriores que puedan invalidar evidencia y continuar desde el siguiente elemento pendiente sin repetir trabajo concluido salvo que haya una razón documentada.


9. **Identificador de sesión de chat/auditoría:** cada checkpoint debe incluir un ID de sesión único, el checkpoint inicial de esa sesión y su estado (abierta o cerrada). ChatGPT no expone un identificador técnico estable de conversación; por tanto, se utilizará un identificador operativo generado para la auditoría, con formato `IMA-AUDIT-YYYYMMDD-HHMMZ` (añadir sufijo si se necesita evitar colisión). Este ID no debe presentarse como ID nativo de ChatGPT. Todos los checkpoints intermedios y el checkpoint final de una misma conversación conservarán el mismo ID. El último checkpoint de la conversación indicará explícitamente el checkpoint de inicio, el checkpoint de cierre, la hora UTC de cierre y el estado «sesión cerrada». Una conversación posterior recibirá un ID nuevo.


# 17. CONTROL DE PUBLICACIÓN EN GITHUB

1. **Atribución basada en evidencia:** distinguir entre bloqueo previo al despacho por la capa de seguridad/ejecución, error del conector y respuesta HTTP de GitHub. Solo atribuir un rechazo a GitHub cuando exista respuesta verificable con estado y mensaje. Si la operación se detiene antes del despacho, registrar «bloqueo previo al despacho; causa interna no expuesta».
2. **Registro técnico:** documentar operación, etapa alcanzada (blob, tree, commit o actualización de referencia), rama, HEAD esperado, tamaño aproximado del contenido, fecha/hora, mensaje literal y código HTTP o request ID cuando estén disponibles. Nunca incluir credenciales, tokens ni secretos.
3. **Clasificación del resultado:** interpretar los códigos HTTP únicamente cuando estén presentes en la respuesta: 401/403 para autenticación o permisos; 404 para repositorio/ruta/referencia; 409 para conflicto de estado; 422 para validación de la solicitud o del árbol; 429 para límite de solicitudes; 5xx para fallo del servicio. Un mensaje genérico no permite asignar una causa específica.
4. **Publicación controlada:** consultar HEAD y árbol completos de la rama autorizada; preparar todos los objetos y entradas; construir el árbol nuevo sobre el árbol completo verificado; crear un único commit cuyo padre sea el HEAD consultado; actualizar la referencia con control de concurrencia; volver a consultar la rama y verificar SHA, árbol y archivos incluidos.
5. **Concurrencia:** si el HEAD cambia antes de actualizar la referencia, detener la publicación, comparar el estado vigente con el conjunto preparado y obtener una nueva base verificada antes de continuar. Nunca sobrescribir cambios concurrentes ni utilizar una actualización forzada no autorizada.
6. **Bloqueo previo al despacho:** cuando la capa de seguridad impida la operación antes de llegar a GitHub, detener la publicación. No sustituir la operación bloqueada por escrituras parciales, rutas alternativas ni cambios de rama. Registrar el bloqueo en el checkpoint y solicitar una vía autorizada.
7. **Condición de cierre:** si no es posible publicar en un único commit todos los cambios y el checkpoint obligatorio, no publicar una parte. Mantener la iteración abierta, documentar el estado preparado y comunicar la operación que quedó bloqueada.
8. **Alcance:** esta sección complementa las reglas de commits y checkpoints de las secciones 15 y 16. La rama base permanece protegida y no se modifica durante este procedimiento.

# 18. GOBIERNO DEL PLAN MAESTRO DE IMPLEMENTACIÓN (IMA)

## 18.1 Documento rector y alcance

La ejecución de las tareas del portal IMA se ordena mediante el documento `Auditoría/PLAN_MAESTRO_IMPLEMENTACION.md`. Este plan es la referencia obligatoria para decidir qué tarea sigue, en qué fase se ejecuta y qué dependencias deben estar satisfechas antes de iniciar.

Los archivos `pendientes/<Departamento>/Pendientes.md` constituyen el índice operativo de las tareas migradas para esta etapa, conservando el ID y el contenido original de cada tarea. El plan maestro no reemplaza ni resume sus requisitos. Los informes de auditoría siguen siendo la evidencia del hallazgo, su origen y las tareas ejecutables derivadas. Los documentos históricos `Pendientes.md` y `completadas.md` no se reescriben como parte de la ejecución de este plan; solo se consultan para resolver trazabilidad histórica cuando sea necesario.

Esta disposición concreta la instrucción del propietario del proyecto de ejecutar el backlog departamental consolidado. No autoriza a omitir las reglas de auditoría, respaldo, desarrollo, autoauditoría, Code Review, aprobación, trazabilidad ni commit consolidado contenidas en esta metodología.

## 18.2 Precedencia para determinar el orden de trabajo

El orden de implementación se determina obligatoriamente en este orden:

1. Dependencias explícitas de la tarea y prerrequisitos técnicos demostrables.
2. Capas de arquitectura y contratos compartidos requeridos por los módulos consumidores.
3. Integraciones entre servicios, propiedad de datos y efectos transaccionales.
4. Secuencia funcional del proceso institucional y área responsable.
5. Severidad y prioridad registradas en el backlog.
6. Capacidad de ejecución y posibilidad de aislar pruebas sin afectar otros módulos.

Una etiqueta P0/P1 no permite saltar una dependencia. Los órdenes explícitos de una iniciativa se conservan como secuencia local y no se comparan automáticamente con órdenes de otra iniciativa. Ninguna tarea puede declararse lista para implementación si sus prerrequisitos están pendientes, no auditados o sin evidencia.

## 18.3 Fases PM del plan maestro

Se utilizan las fases PM-00 a PM-09 definidas en el plan rector:

- **PM-00:** inventario, triage y resolución de dependencias.
- **PM-01:** identidad, seguridad y gobierno de acceso.
- **PM-02:** arquitectura, datos, contratos y persistencia.
- **PM-03:** integración interservicio, eventos y workflows.
- **PM-04:** migración, importación y preservación de datos.
- **PM-05:** servicios funcionales por área institucional.
- **PM-06:** documentos, formularios, firmas y trámites.
- **PM-07:** portales, experiencia, paneles y analítica.
- **PM-08:** pruebas integrales, resiliencia y observabilidad.
- **PM-09:** piloto, cutover y retiro controlado de legado.

Las fases PM expresan el orden de producto y arquitectura. No sustituyen las ocho fases metodológicas 0–7 descritas en la sección 4. Cada tarea del plan debe completar íntegramente el flujo metodológico 0–7. Las pruebas unitarias, de seguridad y de contrato se ejecutan desde cada iteración; PM-08 añade la certificación transversal, no posterga las pruebas.

## 18.4 Selección y ejecución de tareas

1. Al iniciar una iteración se consulta el plan maestro y se selecciona la siguiente tarea ejecutable por ID.
2. Se verifica el registro completo en el backlog departamental, el informe de auditoría de origen cuando exista, la ficha en `tareas_auditoria.txt` cuando la tarea derive de un hallazgo, y el MapaDependencias.
3. Se realiza Fase 0 de auditoría manual de la tarea y de sus dependencias; si falta informe o evidencia, se realiza la auditoría antes de modificar.
4. Se confirma que la tarea no duplica otra y que las ampliaciones se incorporan a su tarea madre sin perder criterios.
5. Se registra la tarea de producto como En ejecución en el backlog departamental y en el Plan Maestro; si además es una tarea derivada de auditoría, se refleja su estado en `tareas_auditoria.txt`. Se prepara el respaldo antes de editar.
6. Se implementa únicamente el alcance y los criterios autorizados.
7. Se completan autoauditoría, pruebas de comportamiento/persistencia, Code Review y cierre documental.
8. La tarea pasa a Completada cuando todos sus requisitos de implementación estén desarrollados y verificados mediante controles internos, autoauditoría y Code Review aprobado. No se espera aprobación del usuario ni pruebas funcionales integrales beta. Las pruebas beta pendientes se registran en el plan beta.
9. Si una dependencia falla, la tarea queda Bloqueada con referencia exacta al ID y evidencia. No se sustituye por un workaround ni se avanza a un módulo consumidor.
10. Se pueden paralelizar áreas independientes únicamente cuando comparten contratos estables y no editan simultáneamente el mismo servicio, esquema, catálogo o fuente de verdad.

Los registros PM-00 identificados como encabezados, ampliaciones o tareas con metadatos incompletos no se implementan como tareas independientes. Primero se vinculan a la tarea madre, se completan sus requisitos o se reclasifican mediante evidencia.

## 18.5 Campos obligatorios en cada checkpoint

Todo checkpoint de IMA debe identificar expresamente el lugar de la ejecución tanto en la metodología como en el plan maestro. Además de los campos obligatorios de las secciones 16 y de `Auditoría/Contexto_personal.txt`, incluir:

- **ID de checkpoint:** consecutivo acumulativo C1.xxx.
- **ID de sesión:** identificador operativo único de la conversación/iteración; no presentarlo como ID nativo de ChatGPT.
- **Checkpoint inicial de sesión** y checkpoint de cierre, cuando corresponda.
- **Fase metodológica:** Fase 0, 1, 2, 3, 4, 5, 6 o 7.
- **Fase del plan maestro:** PM-00 a PM-09.
- **Etapa/subetapa:** nombre preciso del bloque funcional o técnico dentro de la fase PM.
- **ID de tarea:** ID exacto del backlog. Para una actividad de planificación que no sea tarea de producto se puede usar un ID operativo `PLAN-IMA-###`, identificado expresamente como tal y sin confundirlo con un ID del backlog.
- **Comentario breve:** objetivo de la tarea, contexto institucional/técnico y motivo de su posición en el orden de trabajo.
- **Estado:** Pendiente, En ejecución, Bloqueada o Completada; indicar el último elemento terminado, el elemento en curso y el siguiente ID.
- **Dependencias:** IDs prerrequisito, estado y evidencia.
- **Evidencia y SHAs:** fuentes, blobs, commit/HEAD de partida y resultados de validación.
- **Archivos:** rutas modificadas y no modificadas, con alcance concreto.
- **Pruebas:** ejecutadas, resultado y no ejecutadas/limitaciones.
- **Rama y HEAD:** rama autorizada, HEAD verificado de partida, referencia base protegida y resultado de comparación.
- **Próxima acción reproducible:** archivo, sección, función o rango que debe abrirse y qué criterio se debe comprobar.

El checkpoint es acumulativo. Se agrega al final del archivo de contexto real sin borrar, reescribir, resumir ni reordenar entradas anteriores.

## 18.6 Información obligatoria en cada respuesta del chat

Cada reporte de avance o cierre en el chat debe incluir, sin omitir:

1. ID del checkpoint y estado de sesión.
2. ID de sesión.
3. Fase metodológica y fase/etapa PM.
4. ID de tarea y breve descripción del trabajo/contexto.
5. Completada significa implementación terminada, autoauditoría y Code Review interno aprobados, con evidencia. Indicar por separado pruebas funcionales beta pendientes; no exigir aprobación del usuario.
6. Archivos modificados y archivos revisados sin modificación.
7. Pruebas ejecutadas, resultados y pruebas no ejecutadas.
8. HEAD/commit de partida y commit de cierre verificado cuando se publique.
9. Dependencias pendientes, riesgos y siguiente tarea exacta.

Si no se pudo publicar o verificar un cambio, se declara explícitamente; no se reporta como actualizado en GitHub.

## 18.7 Control de cambios del plan

El plan maestro se actualiza de forma versionada y trazable cuando una auditoría confirme nuevas dependencias, cambios de arquitectura, tareas nuevas, ampliaciones o reordenamiento. Se conserva el historial de versiones y no se eliminan criterios del backlog. Toda modificación del orden debe incluir motivo técnico, IDs afectados, dependencias antes/después y evidencia. Los cambios del plan, de la metodología y del contexto que pertenezcan a una misma iteración se publican juntos en un único commit conforme a la sección 15.


# 19. CONTINUIDAD, AUDITORÍA DE LA TAREA ANTERIOR Y RECUPERACIÓN DE INTERRUPCIONES

Esta sección es obligatoria al iniciar cada tarea, al cambiar de agente/chat y después de cualquier interrupción, pérdida de contexto, archivo truncado, contenido ilegible o escritura incompleta. Complementa las fases 0–7; no las sustituye.

## 19.1 Fase previa obligatoria: continuidad y verificación del último checkpoint

Antes de editar cualquier archivo, el agente debe:

1. Leer el último checkpoint de `Auditoría/Contexto_personal.txt` de principio a fin y registrar su ID, sesión, tarea anterior, estado declarado, fase PM, HEAD de partida, commit de cierre y siguiente acción exacta.
2. Consultar la rama autorizada `NG_beta_0.0.0.1_work`, obtener su HEAD y árbol actuales y compararlos con el checkpoint. Verificar también que la rama base protegida no haya sido modificada por la iteración.
3. Comprobar si el commit indicado existe, si es ancestro del HEAD actual y qué archivos contiene. No asumir que un checkpoint equivale a una publicación confirmada.
4. Reconstruir el estado real de la tarea anterior: Pendiente, En ejecución, Bloqueada o Completada. Contrastar el backlog departamental, el plan maestro, `tareas_auditoria.txt`, el informe de auditoría, el diff/commit y las pruebas registradas.
5. Si el HEAD, rama, commit, archivos o estado contradicen el checkpoint, detener el trabajo normal y entrar al protocolo de recuperación de 19.4. No iniciar la siguiente tarea hasta resolver o documentar formalmente el bloqueo.

## 19.2 Auditoría de la tarea anterior antes de iniciar la siguiente

En cada nueva iteración se auditará la tarea que el checkpoint identifica como la última ejecutada, incluso si fue declarada Completada:

1. Recuperar el ID exacto de la tarea anterior y abrir su requisito íntegro en el archivo departamental indicado por `Auditoría/PLAN_MAESTRO_IMPLEMENTACION.md`, sección 9. Consultar además el plan, sus dependencias, el informe de auditoría de origen cuando exista, la ficha de `tareas_auditoria.txt` si la tarea fue derivada de auditoría y el checkpoint de cierre.
2. Verificar que los cambios reales del commit correspondan al alcance, archivos, criterios de aceptación y exclusiones del requisito. Comprobar comportamiento, persistencia, permisos, regresión, pruebas y Code Review exigibles.
3. Si la tarea anterior estaba En ejecución o quedó interrumpida, identificar qué partes sí llegaron al HEAD publicado y cuáles quedaron sin aplicar. No dar por ejecutado ningún cambio que solo figure en notas o en el contexto del agente.
4. Registrar los resultados de esta auditoría en un informe nuevo o en el informe de seguimiento que corresponda, sin sobrescribir evidencia anterior. Asentar los hallazgos en `Auditoria.txt`.
5. La tarea anterior conserva Completada si todos sus requisitos de implementación están satisfechos y existe evidencia de autoauditoría y Code Review interno. No se reabre únicamente porque las pruebas beta estén pendientes. Si se descubre un incumplimiento real de implementación, reabrirla o bloquearla; no avanzar si el defecto afecta prerrequisitos.

Si no existe tarea anterior (inicio real del proyecto), dejar constancia explícita de «sin tarea previa que auditar» y continuar con la auditoría preimplementación de la tarea seleccionada.

## 19.2.1 Algoritmo excepcional: corrección de hallazgos de la auditoría de la tarea anterior y dos commits controlados

Esta regla resuelve el caso en que la auditoría obligatoria de la tarea anterior descubre que su cierre no cumple un requisito. Tiene prioridad específica sobre la regla general de commit único, pero únicamente bajo las condiciones siguientes.

**Activación — deben cumplirse todas estas condiciones:**
- El hallazgo fue detectado durante la auditoría de la tarea inmediatamente anterior, exigida por 19.2; no basta un hallazgo de la auditoría de la tarea objetivo ni una incidencia descubierta durante la implementación.
- Existe evidencia verificable de incumplimiento, defecto, omisión o riesgo que requiere una corrección ejecutable. Una observación no accionable, una sugerencia opcional o una mejora sin incumplimiento no activa esta excepción.
- El hallazgo se registra en el informe de auditoría y en `Auditoria.txt`; si es accionable, tiene una tarea identificada en `tareas_auditoria.txt` o se vincula justificadamente a la tarea anterior existente, sin duplicar IDs.
- La tarea anterior se reabre o se marca Bloqueada según el impacto. No se puede declarar satisfecha una dependencia que aún incumple sus criterios.

**Algoritmo obligatorio:**

1. **Congelar la tarea objetivo:** no implementar ni mezclar cambios de la tarea actual. Registrar su ID como «pendiente de inicio» en el checkpoint de corrección. Mantener intactos sus requisitos y su orden en el Plan Maestro.
2. **Delimitar la corrección:** vincular cada hallazgo con su evidencia, requisito incumplido, causa raíz, archivos afectados, criterio de aceptación y tarea correctiva (nueva o ampliación de la tarea anterior). La corrección se limita a cerrar esos hallazgos; no se aprovecha para introducir cambios de la tarea objetivo.
3. **Preparar el bloque A:** actualizar el informe de auditoría, `Auditoria.txt`, `tareas_auditoria.txt` y el estado del backlog/Plan Maestro cuando corresponda; implementar exclusivamente la corrección de la tarea anterior; ejecutar pruebas, autoauditoría y Code Review. Mantener el registro histórico acumulativo y anexar el changelog.
4. **Primer checkpoint y primer commit (A):** anexar al contexto un checkpoint propio de esta sesión que identifique la tarea anterior, hallazgos y sus IDs, corrección aplicada, pruebas, archivos, HEAD de partida, tarea actual congelada y acción siguiente. Publicar un primer commit que contenga únicamente la corrección de la tarea anterior y sus artefactos de auditoría/seguimiento/checkpoint. No incluir cambios funcionales ni requisitos de la tarea actual.
5. **Verificar el commit A antes de continuar:** consultar el SHA real del commit y el HEAD de la rama; comprobar árbol, diff, archivos y checkpoint; confirmar que la rama base permanece intacta. Si falla cualquier verificación, detenerse y no iniciar la tarea actual. Registrar el bloqueo sin crear un tercer commit.
6. **Reanudar la tarea actual desde el nuevo HEAD:** actualizar el punto de partida con el SHA verificado del commit A. Reauditar la corrección y confirmar que el hallazgo quedó resuelto y que las dependencias están satisfechas. Después realizar la auditoría preimplementación completa de la tarea objetivo y seguir las fases 0–7.
7. **Segundo checkpoint y segundo commit (B):** anexar un segundo checkpoint, independiente y consecutivo, que identifique el commit A y su verificación, la tarea actual, sus requisitos, implementación, pruebas y Code Review. Publicar el segundo commit con todos los cambios de la tarea actual y sus artefactos. No incorporar correcciones pendientes de la tarea anterior que debieron quedar en A.
8. **Verificar el commit B y cerrar:** comprobar SHA/HEAD, árbol, diff, ambos checkpoints, archivos y rama base. La tarea actual se declara Completada cuando sus requisitos de implementación, autoauditoría y Code Review interno estén satisfechos. Las pruebas beta pendientes se registran aparte y no son requisito para cerrar la implementación. Reportar ambos SHAs y la relación causal A → B.

**Límites inviolables de la excepción:**
- Se permiten exactamente dos commits: A para la corrección de la tarea anterior y B para la tarea actual. Nunca un tercero como parte de esta excepción.
- Cada commit incluye su propio checkpoint de cierre; el checkpoint A indica que la tarea actual aún no se ha ejecutado y el checkpoint B documenta su cierre.
- El commit A debe estar publicado y verificado antes de comenzar la implementación de la tarea actual. El commit B toma A como ancestro directo en la rama de trabajo.
- Si aparecen nuevos hallazgos sobre la tarea anterior después de A, se detiene el flujo; no se encadenan commits adicionales bajo esta excepción. Se documenta el bloqueo y se solicita una decisión sobre una nueva iteración correctiva.
- Si la corrección no puede completarse y validarse, no se publica un commit parcial ni se inicia la tarea actual.
- La excepción no aplica a hallazgos de la auditoría de la tarea objetivo, a cambios de conveniencia, a división por tamaño/cuota, ni a interrupciones de herramientas.
- Si la auditoría de la tarea anterior no produce hallazgos accionables, se continúa con la regla normal de un único commit para la tarea actual.


## 19.3 Auditoría de la tarea que se va a ejecutar y conversión de hallazgos

Después de auditar la tarea anterior:

1. Seleccionar la siguiente tarea elegible aplicando el plan maestro y la sección 6.1.
2. Abrir el requisito completo desde la ruta exacta de la sección 9; leer todos sus criterios, dependencias, exclusiones, orden local, evidencias y referencias. Consultar `Auditoría/MapaDependencias.md` y el código real relacionado.
3. Ejecutar la Fase 0 de auditoría preimplementación sobre la tarea objetivo y sus dependencias. Si falta su informe, realizar la auditoría; nunca saltarla.
4. Registrar los hallazgos y evidencias en `Auditoria.txt` y en el informe de auditoría correspondiente.
5. En la **Fase 2**, convertir todo hallazgo accionable en una tarea ejecutable en `tareas_auditoria.txt`, siguiendo la sección 3.4 y 3.11. Incluir ID, ruta del requisito de origen, hallazgo, acción concreta, dependencias, criterios de aceptación y prioridad. El informe conserva referencias cruzadas por ID. La tarea de producto objetivo conserva su estado y trazabilidad en el backlog departamental y el Plan Maestro; `tareas_auditoria.txt` registra tareas derivadas de hallazgos y no duplica automáticamente todas las tareas de producto.
6. Determinar si los hallazgos nuevos bloquean, amplían o anteceden a la tarea objetivo. Si generan una corrección necesaria para la tarea anterior o una dependencia obligatoria, ejecutar primero esa tarea derivada según el orden maestro; no continuar con la tarea objetivo hasta resolver el bloqueo.
7. Solo cuando la tarea anterior esté validada, la tarea objetivo esté auditada, sus requisitos estén claros y sus dependencias estén satisfechas, continuar a respaldo, implementación y fases 3–7.

Por tanto, la Fase 2 no es una aprobación informal ni una nota libre: es el paso obligatorio de convertir hallazgos de la auditoría previa en tareas rastreables antes de programar.

## 19.4 Protocolo de recuperación ante interrupción, corrupción o trabajo parcial

Se considera incidente de continuidad cualquiera de estos casos: archivo vacío/truncado/incompleto; formato o codificación alterados; contenido duplicado o parcialmente sobrescrito; checkpoint incompleto; agente interrumpido durante una escritura; commit/árbol preparado pero no publicado; discrepancia entre archivo, SHA, checkpoint y HEAD; o tarea marcada como completada sin evidencia.

**A. Detención y preservación**
1. Detener inmediatamente nuevas escrituras, formateos, renombrados, restauraciones automáticas y commits.
2. No borrar, sobrescribir, truncar, regenerar ni «reparar» el archivo afectado a ciegas.
3. Capturar ruta, tamaño, codificación, SHA/blob actual, HEAD, commit padre, fecha y mensaje/error disponible. Preservar una copia byte a byte fuera de la ruta afectada; no incluir secretos en el respaldo ni en el reporte. Si no es técnicamente posible crearla localmente, aplicar §3.14.1 y registrar el blob original publicado, su SHA, commit alcanzable y comando exacto de recuperación. La imposibilidad de crear una copia local no bloquea por sí sola la edición cuando el respaldo Git histórico esté íntegro y verificado; la ausencia de ambos sí obliga a detenerse.
4. Registrar si la interrupción ocurrió antes de crear blob, al crear blob, al crear árbol, al crear commit, al actualizar la referencia o después de publicar. Un blob/árbol sin referencia no significa que la rama haya cambiado.

**B. Determinación de la última versión íntegra**
1. Comparar el archivo con el blob del HEAD verificado de la rama de trabajo.
2. Si ese blob está dañado, inspeccionar el historial de commits y localizar el último blob conocido como íntegro, apoyándose en checkpoint, SHA de respaldo y evidencia de contenido completo.
3. Comparar también respaldos temporales y commits previos; no asumir que «el commit anterior» es correcto sin validar contenido y criterios.
4. Distinguir entre: (i) corrupción solo local/no publicada; (ii) objeto creado pero rama no actualizada; (iii) corrupción ya publicada en un commit; (iv) cambio concurrente de HEAD.
5. Si no puede determinarse con certeza la versión íntegra, mantener el archivo en cuarentena lógica, marcar la tarea Bloqueada y solicitar revisión; no inventar contenido ni reconstruirlo a partir de fragmentos.

**C. Restauración controlada**
1. Restaurar únicamente desde un blob/commit cuya integridad y contenido hayan sido verificados contra el último checkpoint válido y el requisito original.
2. Mantener evidencia del contenido corrupto y de la versión restaurada fuera del archivo activo; documentar ambos SHAs y el motivo de selección.
3. Comparar el archivo restaurado byte a byte o mediante SHA con la fuente validada; comprobar codificación, delimitadores, estructura, número de registros y referencias internas.
4. Si la restauración exige modificar contenido, reconstruir registros o conciliar cambios concurrentes, crear una tarea ejecutable en `tareas_auditoria.txt` y un informe de auditoría; no mezclar una reparación incierta con otra tarea funcional.
5. No usar force push, reset destructivo, limpieza de archivos ni reescritura de historia para ocultar el incidente. Publicar la restauración en un commit consolidado, con checkpoint, control de concurrencia y verificación posterior.

**D. Reanudación**
1. Actualizar el checkpoint con incidente, estado, archivo/ruta, SHAs corrupto y válido, commit/HEAD, tareas afectadas, acciones ejecutadas y pendientes.
2. Reauditar la tarea interrumpida desde su requisito completo; identificar cambios parciales, duplicados, efectos secundarios y pruebas faltantes.
3. Registrar hallazgos en `Auditoria.txt` y tareas de corrección en `tareas_auditoria.txt`.
4. Reanudar desde la primera acción no completada y demostrablemente segura; no repetir operaciones no idempotentes sin comprobar antes si su efecto ya ocurrió.
5. Solo cerrar la implementación cuando pase nuevamente autoauditoría, verificaciones técnicas internas aplicables, Code Review y actualización documental. Las pruebas beta pendientes se mantienen en el plan beta y no impiden cerrar una implementación terminada. La interrupción no convierte una tarea parcial en Completada.

## 19.5 Regla de no propagación de errores

Una implementación no terminada, no auditada internamente, corrupta o sin Code Review aprobado no puede servir como prerrequisito satisfecho. Una implementación Completada y verificada internamente sí puede satisfacer dependencias aunque las pruebas funcionales integrales estén pendientes de beta, salvo que la dependencia exija expresamente certificación funcional previa. La secuencia normal es: checkpoint verificado → auditoría anterior → hallazgos/tareas derivadas → auditoría objetivo → respaldo → implementación → verificaciones internas → autoauditoría → Code Review → estado Completada → commit único con checkpoint; las pruebas beta se administran por separado. Si la auditoría de la tarea anterior activa todas las condiciones de 19.2.1, la secuencia excepcional es: auditoría anterior → corrección aislada → pruebas/Code Review → commit A + checkpoint A → verificación de A → auditoría objetivo → implementación → pruebas/Code Review → commit B + checkpoint B.




## 19.6 Protocolo de auditoría única, trazabilidad y control de recursividad

**Objetivo:** evitar auditorías duplicadas, ciclos de revisión de informes y demoras que no aportan evidencia nueva. Aplica a todas las tareas y fases del Plan Maestro.

1. **Expediente principal único por tarea:** antes de crear un informe, consultar el registro de auditoría, el índice de informes y los hallazgos existentes. La primera auditoría completa establece el expediente principal. Las verificaciones posteriores se agregan como revisiones fechadas en ese expediente o registro vinculado; no se crea otro informe completo por rutina.
2. **Comprobar vigencia:** registrar SHA/commit auditado, alcance, criterios cubiertos, limitaciones y hallazgos abiertos. Reutilizar la evidencia mientras no existan cambios posteriores que invaliden sus conclusiones. No repetir trabajo ya demostrado y vigente.
3. **Distinguir actividades:** (a) auditoría de implementación frente a requisitos; (b) verificación focalizada de un hallazgo corregido; (c) control documental del informe/registro; y (d) incidencia metodológica. Una errata, formato, referencia rota o ajuste de checkpoint se corrige documentalmente; no reabre por sí solo la auditoría funcional.
4. **Verificación focalizada:** al corregir un hallazgo, comprobar el comportamiento, requisito, componente y dependencias afectados, además de regresiones justificadas. Registrar evidencia, resultado, SHA y estado en el expediente principal. No repetir secciones no afectadas que continúen vigentes.
5. **Reauditoría completa excepcional:** solo cuando haya cambios sustanciales de código/arquitectura; requisitos modificados; dependencia que invalide conclusiones; evidencia nueva contradictoria; o auditoría original incompleta/sin criterios obligatorios. Declarar motivo, evidencia nueva, alcance y relación con el expediente anterior. Si el cambio es parcial, limitar la revisión a ese alcance.
6. **Clasificación sin recursividad:** clasificar hallazgos como defecto de implementación dentro de la tarea, defecto relacionado que requiere tarea derivada, defecto documental o incidencia metodológica. Solo los defectos accionables de producto generan/actualizan tareas ejecutables. Buscar duplicados y ampliar el ID existente cuando corresponda. Las incidencias metodológicas actualizan normas/contexto; no generan automáticamente auditorías sobre auditorías.
7. **Prohibición de auditoría recursiva:** no iniciar una auditoría cuyo único objeto sea auditar el informe anterior, revisar la redacción/formato de otra auditoría o auditar el cumplimiento formal de otra auditoría. Resolver esos controles mediante una lista de comprobación documental acotada y corrección directa del registro. Una revisión de calidad no crea otra cadena de auditorías.
8. **Puerta de salida:** una auditoría termina cuando su alcance está evaluado y sus limitaciones y hallazgos están registrados/clasificados. No mantener una tarea en auditoría por observaciones documentales/metodológicas que no impidan determinar el cumplimiento de la implementación. Hallazgos independientes solo bloquean cuando exista dependencia técnica o de seguridad demostrable.
9. **Ficha mínima:** tarea; expediente principal; SHA/commit auditado; fecha; alcance y criterios cubiertos; hallazgos abiertos/cerrados; verificaciones focalizadas con evidencia; motivo de cualquier reauditoría completa; estado y siguiente acción. Antes de iniciar, consultar esta ficha y declarar qué trabajo vigente no debe repetirse.
10. **Decisión obligatoria:** si no existe evidencia nueva, cambio relevante, criterio pendiente ni cobertura incompleta, no repetir la auditoría: continuar con el hallazgo pendiente, la siguiente tarea elegible o la implementación correspondiente según el Plan Maestro.

# 20. CONTROL DEL CRECIMIENTO, ROTACIÓN Y TRAZABILIDAD DE CHECKPOINTS

## 20.1 Límite y medición
1. Cada archivo activo de checkpoints tiene un máximo estricto de 180.000 caracteres Unicode, contando espacios y saltos de línea sobre el contenido UTF-8 decodificado.
2. Antes de cada anexado, calcular caracteres_actuales + caracteres_nueva_entrada. Si el resultado es mayor que 180.000, la entrada no se anexa al archivo actual y debe abrirse la siguiente parte secuencial.
3. Si un archivo ya excede el límite, queda cerrado inmediatamente para nuevas escrituras. No se trunca ni se divide retroactivamente; se conserva íntegro y se documenta la anomalía.

## 20.2 Rotación sin pérdida histórica
1. Auditoría/Contexto_personal.txt es el primer archivo histórico y punto de entrada. Las nuevas partes se crean bajo Auditoría/Contexto_personal_Historico/ con el patrón Checkpoints_Parte_0002.txt, Checkpoints_Parte_0003.txt, etc. No reutilizar nombres.
2. Los archivos existentes Parte_01.txt a Parte_07.txt son fragmentos de recuperación del contexto original y no forman parte de la numeración nueva.
3. Cada archivo nuevo inicia con el bloque normativo A–I íntegro y vigente de Auditoría/Contexto_personal.txt, más identificación del proyecto y referencias a esta metodología. No se copia el historial previo: se preserva en su archivo original.
4. La rotación y la entrada que la provoca se publican juntas en el único commit consolidado de la iteración. El archivo anterior queda cerrado; no se mueve, resume ni reescribe contenido histórico.

## 20.3 Índice y localización obligatoria
1. Mantener Auditoría/INDICE_CHECKPOINTS.md como registro central, con una fila por checkpoint: ID, sesión, estado, tarea/fase, ruta exacta, sección/parte, rango de líneas, checkpoint anterior y commit de cierre/publicación.
2. El índice identifica explícitamente el último checkpoint y el archivo activo. No depender de búsquedas manuales en múltiples partes.
3. Cada checkpoint incorpora: ID; sesión; checkpoint anterior; ruta exacta; nombre de parte; encabezado de sección; rango de líneas cuando pueda calcularse; y referencia a la fila del índice.
4. Auditoria.txt y changueslogs.txt deben incluir ID de checkpoint, sesión, ruta y referencia a la fila del índice. No duplicarán el cuerpo del checkpoint.
5. La referencia de rango de líneas se calcula sobre el archivo final preparado y se actualiza en el índice antes de crear el commit. Si no es posible obtener un rango estable, registrar el encabezado exacto y la razón.

## 20.4 Verificación y cierre
1. Antes de escribir, verificar rama/HEAD, SHA del blob, tamaño actual y tamaño proyectado. No modificar archivos históricos ni efectuar escrituras parciales.
2. Al rotar, comprobar que la copia normativa A–I del nuevo archivo coincide íntegramente con el bloque vigente de contexto personal; registrar su SHA o una verificación equivalente.
3. Verificar después del commit: HEAD, árbol, rutas, tamaño de cada parte, continuidad de IDs, referencias del índice y rama base intacta.
4. Si el bloque normativo original no puede recuperarse íntegramente, o no se puede verificar la integridad del archivo/índice, detener la rotación sin publicar cambios parciales.

## 20.5 Convención de referencia cruzada
Formato mínimo obligatorio en Auditoria.txt y changueslogs.txt:
- Checkpoint: C1.xxx.
- Sesión: ID operativo completo.
- Ubicación: ruta exacta + encabezado/parte.
- Índice: Auditoría/INDICE_CHECKPOINTS.md — fila C1.xxx.
- Commit: SHA confirmado tras publicación; dentro del checkpoint se indica «el commit que contiene este checkpoint».


# 21. ESTADO DE IMPLEMENTACIÓN Y PLAN DE PRUEBAS FUNCIONALES BETA

## 21.1 Significado normativo de «Completada»
1. **Completada** describe exclusivamente la implementación de la tarea: todos los requisitos de su alcance están desarrollados, integrados y documentados.
2. Para marcarla Completada deben realizarse autoauditoría, verificaciones técnicas internas aplicables y Code Review interno aprobado, sin defectos bloqueantes abiertos; debe existir evidencia y commit/checkpoint publicado.
3. No se requiere aprobación del usuario, aceptación institucional ni ejecución previa de la campaña beta.
4. No marcar Completada si faltan requisitos de implementación, hay cambios parciales, errores bloqueantes conocidos, Code Review pendiente/reprobado o evidencia insuficiente.
5. Un hallazgo posterior que demuestre incumplimiento de implementación permite reabrir la tarea. La ausencia de pruebas beta por sí sola no.
6. La certificación funcional beta tiene estado y evidencia separados; Completada no significa «aceptada en beta».

## 21.2 Archivo maestro de pruebas beta
El catálogo y registro maestro es `docs/testing/PRUEBAS_FUNCIONALES_BETA.md`. Se mantiene actualizado durante el desarrollo y se amplía/ejecuta cuando IMA entre formalmente en fase beta. Cada caso incluirá ID único, módulo/rol, requisito e ID de tarea, objetivo, prioridad, precondiciones, ambiente/build, datos sintéticos/anonimizados, pasos, resultado esperado/real, estado (Pendiente/PASS/FAIL/BLOCKED/No aplica), severidad, evidencia, fecha, responsable e incidencia/tarea derivada.

## 21.3 Familias de pruebas a preparar para beta
- Smoke, disponibilidad, login/logout y navegación crítica.
- Flujos funcionales por rol: Dirección, Secretaría, Contabilidad, Docente, Estudiante, Padre y Otros; permisos positivos y negativos.
- CRUD, reglas de negocio, validaciones, transiciones y estados inválidos.
- Persistencia, reconstrucción tras recarga, integridad, unicidad, relaciones y conciliación.
- Integración/API, contratos, autenticación interservicio, errores, timeouts, reintentos e idempotencia.
- E2E interdepartamental y workflows de solicitud, aprobación, rechazo, subsanación y cierre.
- Documentos, formularios, PDF, versiones, firmas, acuses, permisos y retención.
- Notificaciones, eventos, destinatarios, deduplicación y recuperación.
- Seguridad, privacidad, RBAC/ABAC, IDOR, aislamiento institucional y sesiones.
- Concurrencia, consistencia, doble envío, conflictos y transacciones.
- Migración/importación, conteos, hashes, huérfanos, conciliación y rollback.
- Compatibilidad de navegadores/dispositivos, responsive, accesibilidad y usabilidad.
- Rendimiento, carga, picos, cuotas y límites de Apps Script/servicios.
- Resiliencia, fallos de red/servicio, respaldo, restauración y continuidad.
- Regresión funcional transversal por módulos y roles.
- Auditoría, trazabilidad, logs, métricas y alertas sin exponer datos sensibles.

## 21.4 Reglas de ejecución y salida beta
1. Ejecutar solo en beta/staging aislado con datos sintéticos o anonimizados; nunca pruebas destructivas en producción.
2. Antes de iniciar, registrar build/commit, ambiente, módulos, roles, responsables, ventanas, respaldo, criterios de entrada/salida y navegadores/dispositivos objetivo.
3. Priorizar seguridad, privacidad, integridad, persistencia y flujos institucionales críticos.
4. Cada escenario no ejecutado permanece Pendiente; nunca inferir PASS por inspección de código o pruebas unitarias.
5. Todo FAIL requiere pasos reproducibles, evidencia, severidad e incidencia/tarea correctiva. Bloquear salida beta ante defectos de seguridad, datos o procesos críticos.
6. Las tareas implementadas pueden estar Completadas mientras los escenarios beta relacionados siguen Pendientes. Un defecto beta puede abrir una corrección sin falsificar el historial.
7. La salida beta exige escenarios críticos ejecutados, cero P0 abiertos, tratamiento explícito de P1, regresión crítica, seguridad/integridad, respaldo/restauración y decisión documentada de continuar/corregir/detener. No equivale a que cada tarea individual esté Completada.


## 21.5 Regla obligatoria: pruebas locales y pruebas diferidas a beta
1. **Ninguna prueba funcional que dependa de un servicio desplegado, deployment remoto, credenciales/propiedades de un entorno externo, infraestructura institucional o datos/recursos reales puede bloquear la finalización de una tarea de implementación.** Tampoco se exige desplegar un servicio para marcar la tarea Completada.
2. Antes de cerrar una tarea, sí deben ejecutarse todas las verificaciones locales aplicables y disponibles: análisis sintáctico/parseo; lint y formato cuando estén configurados; revisión estática; resolución de imports/dependencias; análisis de tipos y esquemas; revisión de contratos; pruebas unitarias; pruebas de lógica y reglas de negocio; pruebas deterministas con mocks/stubs/fixtures locales; pruebas de seguridad reproducibles localmente; pruebas de regresión local; y Code Review. No omitir una prueba local solo por existir una futura campaña beta.
3. Una prueba local que sí pueda ejecutarse y revele un defecto real de implementación debe corregirse antes del cierre. Si una verificación local aplicable no puede ejecutarse por limitación técnica, debe registrarse como no ejecutada con su causa; nunca declararla PASS ni inventar evidencia. La limitación no convierte una prueba remota/de despliegue en requisito de cierre.
4. Se consideran **pruebas diferidas a beta**, entre otras: despliegue/publicación de Apps Script o microservicios; smoke test contra URLs desplegadas; HTTP real entre servicios; integración con Drive/Sheets/servicios externos reales; pruebas E2E en navegador contra la plataforma desplegada; flujos interdepartamentales con servicios vivos; pruebas de carga/concurrencia sobre infraestructura desplegada; y validación de cuotas, permisos o propiedades remotas. Se registran en `beta_test.txt` y permanecen Pendientes beta hasta que exista el entorno autorizado.
5. Cada prueba diferida debe registrarse con ID único, tarea y requisito de origen, módulo/servicio, escenario, objetivo, precondiciones, ambiente requerido, datos sintéticos, pasos, resultado esperado, prioridad/severidad, estado, evidencia y responsable. No registrar secretos, credenciales ni datos personales reales.
6. **Estados separados:** la tarea puede estar Completada cuando la implementación y las verificaciones locales aplicables están aprobadas; el caso remoto correspondiente permanece Pendiente beta. No convertir esa espera en tarea Bloqueada ni dejar la tarea de implementación En ejecución por ausencia de deployment.
7. Un FAIL detectado durante beta genera el hallazgo/tarea correctiva correspondiente. Solo se reabre la tarea original cuando la evidencia demuestra que su implementación no cumplía el alcance o los criterios originales; la mera ausencia de ejecución beta no justifica reabrirla.
8. Esta sección prevalece sobre cualquier criterio, backlog, informe o instrucción anterior que condicione el cierre de una tarea a despliegues, pruebas E2E remotas o integraciones funcionales que requieren servicios desplegados. No elimina requisitos de implementación, seguridad, integridad ni verificaciones locales posibles.
