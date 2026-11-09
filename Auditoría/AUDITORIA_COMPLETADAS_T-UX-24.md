# Auditoría de tareas completadas: T-UX-24

- **Fecha:** 2026-11-06.
- **ID de sesión:** IMA-AUDIT-20261106-0254Z (inicio C1.63; sesión abierta).
- **Repositorio:** i-miss-cocaine/IMA.
- **Rama:** NG_beta_0.0.0.1_work.
- **HEAD de partida:** a85d8b640821d6af5b0973132b6bf8c4ad351618.
- **Dictamen:** **NO CUMPLE**.

## Especificación
T-UX-24 figura [X] en completadas.md (SHA f57f1aef832e81e44fc4f7ec36a852d50e464676). Exige jerarquía coherente de acciones principales/secundarias, estilos uniformes para controles equivalentes y estados visuales consistentes de éxito, error, advertencia, carga y ausencia de datos.

## Evidencia técnica
### Tokens y componentes compartidos
- css/style.css SHA f1ff84312ce70949a58eaa099b2aad0ff0a59cb6 declara variables --color-primary, --color-secondary, --color-success, --color-warning, --color-danger y --color-info (2-25).
- Define .btn-ima base y variantes .btn-ima-primary, .btn-ima-cancel, .btn-ima-danger y .btn-ima-ghost (284-348). Es una base válida, pero no demuestra adopción uniforme.
- Inventario estático de 12 vistas principales: las clases btn-ima-* aparecen en student-dashboard.html (3 referencias) y teacher-dashboard.html (10). No aparecen en index.html, Dirección, Secretaría, Contabilidad, RR. HH., Coordinación, Cafetería, Tienda, Developer ni dynamic-dashboard. En las demás vistas se observan botones con clases Tailwind locales. El recuento es de referencias de clases, no de una comparación visual runtime.
- No se encontraron clases CSS compartidas específicas de alert/status/loading/empty (p. ej. .alert-ima, .status-badge, .btn-loading, .empty-state). Los tokens semánticos de color no proporcionan por sí solos componentes ni un contrato de uso.
- js/ui-common.js SHA 986938b8a311a41ed4cb3d135b66b6aaea4bed67 mezcla alert(), Swal.fire() y markup/Tailwind local para resultados de operaciones, errores, avisos y estados vacíos. La clase btn-loading se alterna en algunos flujos, pero no se encontró una regla CSS común con ese selector.

### Inconsistencia de estados equivalentes
- renderMyTicketsList (js/ui-common.js 3918-3923) asigna “Información recibida” a bg-purple-50/text-purple-700/border-purple-200; “Se necesita información” usa amber-100/amber-800/amber-300 y animate-pulse.
- renderAdminTicketsUI (4121-4126) asigna “Información recibida” a bg-purple-100/text-purple-800/border-purple-300/font-bold y omite animate-pulse para “Se necesita información”.
- El mismo estado semántico no conserva una representación equivalente entre la vista del usuario y la administrativa.

## Reconciliación
- TASK-430 (P2, pendiente) ya contempla profesionalización visual y unificación del sistema de diseño, incluyendo botones, tarjetas, modales y coherencia interdepartamental. Se amplía dentro de su propia entrada en Pendientes.md con los criterios concretos de T-UX-24; no se crea una tarea paralela.
- TASK-492 conserva el contrato visual de campos input/select/textarea y sus estados.
- TASK-493 conserva el modal compartido de detalle.
- TASK-494 conserva la jerarquía de capas y adaptación de overlays.
- TASK-495 conserva el significado de estados de conectividad.
- Nuevo hallazgo AUD-NG-215 (MEDIO/P2), ligado a la ampliación C1.67 de TASK-430. No se modifica el estado [X] de completadas.md.

## Dictamen por criterio
- Jerarquía de botones equivalentes: **PARCIAL/NO ACREDITADA** (variantes compartidas existen, pero no se adoptan transversalmente).
- Uniformidad de estados equivalentes: **FAIL** (dos renderizadores asignan estilos distintos al mismo estado).
- Estados éxito/error/advertencia/carga/vacío: **PARCIAL/FAIL** (existen colores y markup, pero no contrato compartido ni patrón consistente).
- Coherencia interdepartamental: **FAIL** (las vistas principales construyen controles con estilos locales).

## Pruebas y límites
Ejecutado: inspección estática/manual de tokens CSS, variantes de botones, 12 vistas principales y dos renderizadores de estados de tickets.
No ejecutado: navegador, capturas comparativas, pruebas de contraste automatizado, lector de pantalla ni suites automatizadas.

## Cierre
T-UX-24: **NO CUMPLE**. AUD-NG-215 se incorpora como ampliación de TASK-430; no se crea tarea separada. Código/tests y completadas.md sin modificaciones. Progreso 65/183; 118 pendientes. Siguiente: T-UX-25 - Incorporar preferencias de usuario y personalización controlada de vistas.

## Tareas ejecutables derivadas de los hallazgos

### [TASK-430] Ampliación: unificar acciones y estados visuales institucionales
- **Tipo:** tarea existente ampliada; no crear tarea paralela.
- **Hallazgo/severidad:** AUD-NG-215, MEDIO/P2; variantes compartidas no se adoptan transversalmente y renderizadores difieren en estados equivalentes.
- **Objetivo:** establecer sistema de diseño consistente entre departamentos.
- **Acción:** migrar botones a variantes comunes; definir patrones para éxito, error, advertencia, carga, información y vacío; unificar “Información recibida” y “Se necesita información” entre renderizadores; retirar estilos locales divergentes tras migración.
- **Archivos:** css/style.css, js/ui-common.js y 12 vistas principales inspeccionadas.
- **Dependencias:** TASK-492 (campos), TASK-493 (modal), TASK-494 (overlays), TASK-495 (conectividad).
- **Alcance:** botones, alertas, badges, carga/vacío y renderizadores; no sustituye accesibilidad ni contrato de campos.
- **Criterios:** controles equivalentes usan variantes compartidas; jerarquía primaria/secundaria/destructiva coherente; estados semánticos iguales tienen reglas equivalentes; patrones comunes disponibles; excepciones documentadas; revisión visual y de contraste/foco.
- **Prioridad:** P2. **Estado:** conservar el de TASK-430.
- **Evidencia:** pendiente; sin pruebas visuales/runtime.

