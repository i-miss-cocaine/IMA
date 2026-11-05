# Auditoría de tareas completadas: T-UX-04

- **Fecha:** 2026-11-05.
- **Repositorio:** i-miss-cocaine/IMA.
- **Rama auditada:** `NG_beta_0.0.0.1_work`.
- **HEAD de partida:** `215944966aa45bbe47182296630e2b68d094272d`.
- **Dictamen:** **NO CUMPLE**.
- **Código principal:** `js/ui-common.js`, SHA `986938b8a311a41ed4cb3d135b66b6aaea4bed67`.
- **Registro histórico:** `completadas.md`, SHA `f57f1aef832e81e44fc4f7ec36a852d50e464676`.

## Reconciliación de secuencia y ampliaciones

T-UX-04 aparece en la lista formal de FASE 3 de `completadas.md` (líneas 1536-1545) y también en el registro anterior (1150-1158). El checkpoint C1.45 indicó que no aparecía entre T-UX-03 y T-UX-05; esa afirmación era incompleta porque solo consideró la primera secuencia resumida y no la lista formal de FASE 3. No existía una auditoría previa de T-UX-04 en `Auditoria.txt`; se audita ahora antes de T-UX-05.

La ampliación T-UX-21 (líneas 1183-1192) exige mostrar la última actualización efectiva, diferenciar estados actualizados/desactualizados/pendientes/error, ofrecer actualización manual y renovar el timestamp únicamente tras una sincronización confirmada.

## Evidencia técnica

### 1. El indicador no está integrado en las vistas

`window.renderDataFreshnessBadge` se define en `js/ui-common.js:5438-5789`, pero no se encontraron llamadas externas a esa función en los 21 archivos JavaScript ni en los 13 HTML principales de dashboards revisados. Las únicas referencias del archivo compartido son la definición, la comprobación nominal UX-04 y la llamada recursiva interna posterior a una actualización.

Por tanto, la función existe, pero no se inserta en las vistas de lista ni en los paneles como un indicador visible. Tampoco se encontró un consumidor que le proporcione un timestamp real o un callback de actualización manual.

### 2. Funciones administrativas quedaron anidadas dentro del renderer

La función `renderDataFreshnessBadge` comienza en la línea 5438 y no se cierra hasta la línea 5789. Después de insertar el badge (línea 5465), se declaran dentro de su cuerpo:

- `window.openUserManagementAdministrationModal` (línea 5468; cierre de su asignación en 5614).
- `window.openSecurityAndComplianceDashboardModal` (línea 5617; cierre de su asignación en 5765).

Esas asignaciones globales solo se ejecutan cuando se invoca primero `renderDataFreshnessBadge` con un contenedor válido. No hay invocaciones externas del renderer en los archivos de interfaz revisados, por lo que los dos helpers no quedan registrados al cargar `ui-common.js`.

Esto afecta a consumidores reales:
- `dashboard-direccion.html:188-198` intenta abrir ambos modales, pero comprueba `typeof window.open... === "function"`; si no existen, el clic termina sin acción.
- `dashboard-secretaria.html:330-331` intenta abrir el modal de gestión de usuarios con la misma condición y queda igualmente inoperante.

Es una regresión funcional colateral introducida por el límite incorrecto del renderer de T-UX-04.

### 3. Timestamp no confiable cuando falta o es inválido

En `js/ui-common.js:5446-5458`, si `lastUpdatedTimestamp` es nulo, vacío o falsy, se sustituye por `new Date()`. El badge presenta entonces “Hace un momento” y la hora actual, aunque no exista evidencia de una sincronización reciente. Si se recibe una fecha inválida, la hora puede mostrarse como `Invalid Date`.

Esto contradice T-UX-21: la hora debe representar una actualización efectiva, no el momento de renderizar el componente.

### 4. Acción manual y confirmación de éxito incompletas

El botón se crea siempre. Solo recibe un listener si `onRefreshCallback` es una función (líneas 5771-5789); sin callback queda visible pero no hace nada. No hay integración que conecte el botón con las operaciones reales de actualización.

El callback considera fallo únicamente cuando `success === false`. Cualquier otro valor (incluido `undefined`) entra en la rama de éxito y puede renovar el timestamp usando la hora actual si no se entrega `updatedTimestamp`. Por tanto, la marca de tiempo no está condicionada estrictamente a una confirmación explícita. Si el callback lanza una excepción o nunca invoca su callback de retorno, el indicador giratorio puede quedar activo indefinidamente.

### 5. Estados de sincronización y prueba UX-04 insuficientes

La implementación muestra un texto relativo de antigüedad y cambia a un mensaje ámbar ante `success === false`, pero no modela de forma explícita los estados actualizado, desactualizado, pendiente y error exigidos por T-UX-21.

En `js/ui-common.js:1879-1885`, UX-04 solo comprueba `typeof window.renderDataFreshnessBadge === 'function'`. No verifica inserción en una vista, timestamp válido/ausente, antigüedad, estado pendiente, ausencia de callback, actualización exitosa, fallo ni que las funciones administrativas sigan disponibles al cargar el módulo.

## Impacto y calidad

- No hay badge visible en las vistas principales revisadas; el requisito original no queda satisfecho.
- No existe actualización manual conectada a datos reales ni evidencia de que el timestamp refleje una sincronización confirmada.
- La falta del cierre de función provoca que dos helpers administrativos dependan accidentalmente de invocar el renderer; sus botones en Dirección y Secretaría pueden quedar sin acción.
- Calidad: deficiente por integración inexistente, contrato de callback permisivo, timestamp ficticio por defecto, prueba nominal y regresión de alcance mayor.

## Reconciliación con pendientes

No se encontró una tarea pendiente que cubra específicamente la integración y el ciclo de vida de `renderDataFreshnessBadge`, la confirmación estricta de la actualización o el anidamiento accidental de los dos helpers administrativos. Las tareas existentes de caché, frescura de métricas y observabilidad (por ejemplo, AUD-NG-064/AUD-NG-077) tienen alcances distintos y no sustituyen este indicador de interfaz. Se crea AUD-NG-183/TASK-480; no se duplican tareas ni se modifican estados históricos.

## Pruebas y límites

Inspección estática/manual de la función, sus límites, la prueba UX-04, los consumidores de los modales y los 21 archivos JavaScript/13 HTML principales revisados para localizar llamadas. No se ejecutaron navegador, DOM real, pruebas automatizadas, Apps Script ni operaciones de sincronización. No se modificó código fuente.
