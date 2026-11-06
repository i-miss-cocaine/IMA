# Auditoría de tareas completadas: T-UX-22

- **Fecha:** 2026-11-06.
- **ID de sesión:** IMA-AUDIT-20261106-0254Z (inicio C1.63; sesión abierta).
- **Repositorio:** i-miss-cocaine/IMA.
- **Rama:** NG_beta_0.0.0.1_work.
- **HEAD de partida:** 0539eaa8dac1cee4a04c7d1a479ce4d98bd06c9e.
- **Dictamen:** **NO CUMPLE**.

## Especificación
T-UX-22 figura [X] en completadas.md (SHA f57f1aef832e81e44fc4f7ec36a852d50e464676). Requiere diferenciar conectividad del dispositivo, disponibilidad del servicio y presencia de usuario cuando corresponda; mostrar solo estados verificables; y probar pérdida/recuperación de conexión.

## Evidencia
- js/ui-common.js SHA 986938b8a311a41ed4cb3d135b66b6aaea4bed67, setupCommonUI (5+) crea/actualiza #online-status-badge en updateOnlineBadge (35-61). Registra listeners online/offline y llama updateOnlineBadge al iniciar.
- La auto-inicialización de setupCommonUI está en 3490-3494 (DOMContentLoaded o ejecución inmediata).
- navigator.onLine true muestra “Conexión Estable” y oculta visualmente el badge tras 4 segundos; false muestra “Sin Conexión (Modo Local)”. navigator.onLine solo representa el estado de red reportado por el navegador; no prueba conectividad real a Internet ni disponibilidad del backend. El texto “Conexión Estable” excede la evidencia disponible.
- El evento online invoca syncOfflineQueue cuando existe, pero no espera ni verifica que la cola se haya sincronizado. El estado de conectividad no debe equivaler a estado de sincronización.
- js/api.js SHA 6b24f666db30a811a8e9b38d466fc6001cf6dfa9 contiene checkMicroserviceHealth (207-237) que solicita ping y calcula latencia/estado; checkAllMicroservicesHealth (245-252) enumera solo USER, ACADEMIC, TASK y EXAM. No se encontró conexión entre esos resultados y #online-status-badge.
- AUD-NG-144 pendiente ya cubre el monitor real de todos los servicios, sus pings y dependencias. La integración visual del estado en el indicador no está cubierta por esa tarea.
- No se halló señal de presencia/heartbeat en este indicador. No debe inferirse presencia del usuario desde navigator.onLine.
- UX-07 en ui-common.js (1902-1907) aprueba si existe #online-status-badge O navigator.onLine es booleano; puede dar PASS aunque no haya badge y no prueba eventos ni estado. AUD-NG-187/TASK-484 ya cubre las pruebas conductuales del grupo UX-07.
- Vistas revisadas cargan js/ui-common.js en varios dashboards; developer-dashboard.html no lo carga. La cobertura de inclusión no equivale a prueba runtime.

## Reconciliación
- AUD-NG-144: health checks reales/cobertura de servicios. Dependencia, no duplicar.
- AUD-NG-187/TASK-484: suite conductual UX-07, incluyendo eventos online/offline. Reutilizar.
- TASK-494: jerarquía de overlays y controles flotantes.
- Tareas offline existentes: persistencia de cola, reintentos e idempotencia.
- Nuevo hallazgo AUD-NG-214 (MEDIO/P2): el indicador confunde conectividad del navegador con estabilidad del servicio y no separa dimensiones. Nueva TASK-495 para semántica e integración visual; no duplica las dependencias citadas.

## Dictamen por criterio
- Estado de red verdadero y explícito: **PARCIAL** (lee navigator.onLine, pero usa etiqueta ambigua).
- Disponibilidad backend separada y verificada: **FAIL**.
- Presencia de usuario no inferida: **PARCIAL** (no se muestra presencia; tampoco hay señal en este indicador).
- Pérdida/recuperación probadas: **FAIL** (UX-07 solo comprueba presencia/propiedad).

## Pruebas y límites
Ejecutado: inspección estática/manual de setupCommonUI, updateOnlineBadge, auto-inicialización, UX-07, checkMicroserviceHealth/checkAllMicroservicesHealth, vistas principales y backlog.
No ejecutado: navegador/DOM, simulación de eventos, desconexión real, health checks en red ni suites automatizadas.

## Cierre
T-UX-22: **NO CUMPLE**. Nuevo AUD-NG-214/TASK-495. Código fuente y tests sin modificaciones. Progreso 63/183; 120 pendientes. Siguiente: T-UX-23 - Completar el flujo de reporte de problemas y soporte.
