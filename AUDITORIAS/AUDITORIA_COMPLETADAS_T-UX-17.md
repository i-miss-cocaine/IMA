# Auditoría de tareas completadas: T-UX-17

- **Fecha:** 2026-11-06.
- **Repositorio:** i-miss-cocaine/IMA.
- **Rama auditada:** `NG_beta_0.0.0.1_work`.
- **HEAD de partida:** `30cd0eea21ccf957e999197a5c9bfe0cbc48f8fb`.
- **HEAD de rama base:** `44d9891132332e692dbe2ba8602b41f50a508a59`.
- **Especificación:** `completadas.md`, SHA `f57f1aef832e81e44fc4f7ec36a852d50e464676`.
- **Archivo auditado:** `js/ui-common.js`, SHA `986938b8a311a41ed4cb3d135b66b6aaea4bed67`.
- **Informe relacionado:** `AUDITORIA_COMPLETADAS_T-UX-03.md`, que ya había detectado el mismo incumplimiento en la ampliación T-UX-17.

## Dictamen

**T-UX-17: NO CUMPLE.** La función compartida existe y puede marcar manualmente un formulario como modificado, pero no implementa la comparación contra el estado inicial, limpia el estado antes de confirmar el guardado/reset, no administra correctamente los formularios dinámicos y no permite desmontar la protección. La prueba UX-03 solo comprueba la existencia de la función.

## Requisitos contrastados

La entrada [X] T-UX-17 de `completadas.md` exige:

1. Detectar modificaciones reales respecto al estado inicial.
2. Distinguir formularios modificados de los guardados.
3. Advertir antes de abandonar una vista con cambios pendientes.
4. No advertir después de guardar correctamente.
5. Gestionar formularios dinámicos y campos añadidos/eliminados.

Criterios de aceptación: modificar y abandonar genera advertencia; cancelar navegación conserva datos; guardar correctamente elimina la advertencia.

## Evidencia técnica

### 1. Estado dirty sin línea base

En `js/ui-common.js:5371-5430`, `setupUnsavedChangesProtection(containerIdOrElement, options)` inicializa `isDirty = false`. `markDirty` lo fija en `true` y `markClean` en `false`. No toma snapshots de valores iniciales ni compara los valores actuales de controles.

Consecuencia: si el usuario modifica un campo y después restaura exactamente su valor original, el estado continúa sucio. El helper no distingue una modificación real persistente de una edición revertida.

### 2. Limpieza prematura de guardado y reset

La función enlaza `markClean` directamente a `submit` y `reset`. El evento `submit` solo acredita que se inició el intento de envío; no demuestra que el manejador posterior no lo cancele ni que la operación asíncrona haya terminado correctamente. Un rechazo del servidor o fallo de red puede dejar cambios sin guardar con el estado limpio y sin advertencia.

El evento `reset` también es cancelable y se dispara antes de que el navegador complete la acción predeterminada. Marcar limpio en ese evento no comprueba si el reset fue cancelado ni sincroniza una nueva línea base tras el reset efectivo.

### 3. Formularios y controles dinámicos incompletos

`bindInputs` solo selecciona `input, textarea, select` y registra `input/change`. No contempla `[contenteditable]` ni define un contrato para controles personalizados.

El `MutationObserver` observa `childList/subtree` y únicamente vuelve a ejecutar `bindInputs`. No enlaza `submit/reset` a formularios descendientes que se inserten después de la inicialización. Tampoco mantiene una línea base para los controles nuevos ni una reconciliación explícita del estado cuando se retiran controles.

### 4. Ciclo de vida sin teardown

Cada invocación instala un listener anónimo independiente en `window.beforeunload` y crea un `MutationObserver`. No conserva referencias para retirar esos recursos.

El objeto devuelto expone `markClean`, `markDirty`, `isDirty` y `resetProtection`; este último solo limpia el booleano y vuelve a enlazar controles. No elimina el listener global ni desconecta el observer. Una instancia desmontada puede seguir advirtiendo y varias inicializaciones acumulan listeners/observadores.

### 5. Protección limitada a beforeunload e integración no demostrada

El único evento de navegación registrado por el helper es `window.beforeunload`. No hay en esta función una protección explícita para transiciones internas de vistas que no descargan el documento.

No se localizaron referencias directas a `setupUnsavedChangesProtection` en los módulos revisados `js/api.js`, `js/teacher.js`, `js/secretary.js` y `js/accounting.js`. En `js/student.js` existe un listener `beforeunload` separado que protege cargas de archivos de entregas (`activeUploads/uploadedFiles/isSubmitting`); no constituye integración con el helper transversal ni cubre el ciclo general de formularios. Esta inspección de consumidores es acotada y no afirma un barrido exhaustivo de todos los archivos del repositorio.

### 6. Suite UX-03 insuficiente

En `js/ui-common.js:1869-1875`, `runUXSuiteTests` verifica únicamente que `typeof window.setupUnsavedChangesProtection === 'function'`. No crea formularios ni prueba modificación/reversión, submit fallido/cancelado, reset cancelado, controles dinámicos, beforeunload, múltiples instancias o teardown. La comprobación de presencia no acredita los criterios conductuales de T-UX-17.

## Reconciliación histórica y tareas existentes

- T-UX-03 es el requisito inicial de protección ante pérdida de cambios; T-UX-17 es la ampliación posterior y más estricta del mismo módulo.
- T-UX-10 exige pruebas funcionales para UX-03, pero la implementación de la suite sigue siendo nominal.
- La auditoría C1.45 ya registró **AUD-NG-182** y creó **TASK-479**. Se comprobó nuevamente que `Pendientes.md` contiene TASK-479 [AUD-NG-182], en estado pendiente, con alcance que cubre snapshot/compare, guardado confirmado, reset cancelable, controles/formularios dinámicos, teardown, compatibilidad de API y pruebas conductuales.
- TASK-479 cubre los incumplimientos confirmados. No se crea un AUD-NG ni TASK duplicado y no se modifica `Pendientes.md`.

## Dependencias

`window.setupUnsavedChangesProtection`; `containerIdOrElement`; `options.message`; `isDirty`; `markDirty`; `markClean`; `bindInputs`; eventos DOM `input/change/submit/reset`; `MutationObserver`; `window.beforeunload`; API retornada `markClean/markDirty/isDirty/resetProtection`; `window.runUXSuiteTests` / UX-03; formularios y navegación de los dashboards consumidores.

## Pruebas y límites

- **Realizadas:** inspección estática/manual de la especificación, función completa, caso UX-03, módulos consumidores seleccionados, informe C1.45 y TASK-479 en el backlog.
- **No ejecutadas:** navegador/DOM real, eventos cancelables reales, guardado asíncrono, pruebas de formularios dinámicos, navegación SPA, múltiples instancias, teardown ni suites automatizadas.
- **Código fuente:** sin modificaciones.
- **Pendientes.md:** sin modificaciones; TASK-479 existente conserva el registro de corrección.
- **completadas.md / METODOLOGIA_DESARROLLO.md / ChangesLogs.txt:** sin modificaciones.

## Cierre

- **Resultado:** T-UX-17 NO CUMPLE.
- **Hallazgo existente:** AUD-NG-182 -> TASK-479; no se duplica.
- **Progreso:** 58/183 identificadores auditados; 125 pendientes.
- **Siguiente tarea:** T-UX-18 - Completar los componentes compartidos de formularios, tablas y vistas de detalle.
