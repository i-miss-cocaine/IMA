# Auditoría de tareas completadas: T-UX-03

- **Fecha:** 2026-11-05.
- **Repositorio:** i-miss-cocaine/IMA.
- **Rama auditada:** `NG_beta_0.0.0.1_work`.
- **HEAD de partida:** `4938025465aa4318107953d8d1498968c5f26380`.
- **Archivo auditado:** `js/ui-common.js`.
- **SHA de respaldo:** `986938b8a311a41ed4cb3d135b66b6aaea4bed67`.
- **Tareas históricas contrastadas:** T-UX-03, T-UX-17 y T-UX-10 (marcadas [X] en `completadas.md`, SHA `f57f1aef832e81e44fc4f7ec36a852d50e464676`).

## Dictamen

**T-UX-03: CUMPLE PARCIALMENTE.** El caso básico de marcar un formulario como modificado y establecer `beforeunload` está implementado. Sin embargo, la ampliación posterior T-UX-17 no está satisfecha: la función no compara el estado actual con una línea base, declara limpio el formulario al recibir cualquier evento `submit` sin esperar el resultado del guardado y no administra el ciclo de vida de listeners/observadores. La suite T-UX-10 no verifica comportamiento; UX-03 solo comprueba que la función exista.

## Evidencia técnica

### 1. Estado dirty sin comparación con el estado inicial

En `js/ui-common.js:5371-5430`, `setupUnsavedChangesProtection` inicializa `isDirty = false`; `markDirty` lo fija en `true` y `markClean` lo fija en `false`. No captura ni compara valores iniciales de controles.

Consecuencia: cambiar un campo y devolverlo exactamente a su valor original mantiene `isDirty === true` y genera una advertencia innecesaria. Tampoco existe reconciliación de valores actuales con una línea base tras modificaciones programáticas.

### 2. Limpieza prematura ante submit/reset

La función registra `markClean` directamente en los eventos `submit` y `reset` del formulario (o de los formularios descendientes existentes al inicializar el contenedor).

El evento `submit` no acredita que una operación asíncrona haya persistido correctamente. Un manejador posterior puede cancelar el evento o una petición puede fallar después de que el estado ya se haya limpiado. En esos casos el formulario conserva cambios no guardados, pero `beforeunload` deja de advertir. El evento `reset` también limpia antes de confirmar que el reset no haya sido cancelado.

Esto incumple T-UX-17, que exige eliminar la advertencia después de guardar correctamente, no al comenzar el intento de envío.

### 3. Seguimiento dinámico incompleto

`MutationObserver` observa `childList` y `subtree` y vuelve a ejecutar `bindInputs`, lo cual permite asociar `input/change` a controles añadidos dentro del contenedor. No vuelve a asociar `submit/reset` a formularios agregados dinámicamente cuando el contenedor es un wrapper. Tampoco conserva una línea base para controles nuevos ni resuelve de forma explícita controles retirados.

El selector solo contempla `input, textarea, select`; no incluye superficies editables como `[contenteditable]` ni controles personalizados que no emitan esos eventos.

### 4. Ciclo de vida y listeners globales

Cada invocación registra un nuevo listener anónimo en `window.beforeunload` y, cuando existe, un `MutationObserver`. No conserva referencias para retirarlos. El objeto retornado ofrece `resetProtection`, pero este únicamente llama a `markClean` y `bindInputs`; no desconecta el observer ni elimina listeners.

Si una vista se desmonta con su instancia todavía sucia, el listener global puede continuar activo y provocar una advertencia por un formulario que ya no está presente. Las inicializaciones repetidas acumulan listeners y observadores.

### 5. Prueba UX-03 insuficiente

En `js/ui-common.js:1869-1875`, el caso UX-03 de `runUXSuiteTests` evalúa únicamente `typeof window.setupUnsavedChangesProtection === 'function'`. No crea un formulario, no modifica/restaura controles, no simula submit cancelado o fallido, no valida campos dinámicos, no comprueba la advertencia `beforeunload` ni el desmontaje de instancias.

T-UX-10 exige pruebas de flujos funcionales completos para la protección de cambios no guardados; el caso existente no acredita esos criterios.

## Contraste histórico y reconciliación

- **T-UX-03:** el requisito original de detectar un cambio y establecer `beforeunload` tiene implementación nominal; no hay evidencia conductual de navegador.
- **T-UX-17:** amplió el requisito a comparación contra estado inicial, distinción entre guardado y modificado, protección durante navegación, limpieza solo tras guardado correcto y gestión dinámica. La implementación actual incumple varios de esos puntos.
- **T-UX-10:** su prueba UX-03 es una comprobación de presencia, no una prueba funcional.
- En `Pendientes.md` no se encontraron tareas existentes sobre `beforeunload`, `setupUnsavedChangesProtection`, estado dirty o el ciclo de vida de esta protección. Las tareas de borradores/autoguardado (incluidas las relacionadas con formularios de admisión y plantillas) resuelven persistencia/recuperación de borradores, no este contrato transversal de advertencia; no son duplicados.
- Se registra **AUD-NG-182** y se crea **TASK-479** para corregir el contrato de estado, el momento de limpieza, los controles dinámicos, el ciclo de vida y las pruebas. No se cambia el estado de T-UX-03, T-UX-17 ni T-UX-10 en `completadas.md`.

## Dependencias

`window.setupUnsavedChangesProtection`; `containerIdOrElement`; `options.message`; `isDirty`; `markDirty`; `markClean`; `bindInputs`; eventos `input/change/submit/reset`; `MutationObserver`; `window.beforeunload`; objeto de control retornado (`markClean`, `markDirty`, `isDirty`, `resetProtection`); `window.runUXSuiteTests` / caso UX-03; formularios y navegación de los paneles consumidores.

## Pruebas y límites

Inspección estática/manual de la implementación y del caso UX-03. No se ejecutaron navegador, eventos DOM reales, pruebas automatizadas, Apps Script ni flujos de guardado reales. No se certifica aquí la integración de cada formulario consumidor. No se modificó código fuente.
