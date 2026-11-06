# Auditoría de completadas.md - Lote C0

**Fecha:** 2026-11-04  
**Rama:** NG_beta_0.0.0.1_work  
**HEAD de referencia:** c70c99496e359f0f9426c8d796bdc09c7a9fb8d6  
**Fuente:** completadas.md (SHA f57f1aef832e81e44fc4f7ec36a852d50e464676)

## Alcance
Se verificaron manualmente AUDIT-CR-01 a AUDIT-CR-04 contra el código actual. No se ejecutaron pruebas de navegador ni Apps Script.

## Resultados

### AUDIT-CR-01 - normalizeString
**Dictamen: CUMPLE.** Evidencia: backend/user-service/Code.gs:839-843. Existe como función global; convierte a texto, minúsculas, normaliza Unicode NFD, elimina marcas diacríticas U+0300-U+036F y aplica trim. parseGrade la utiliza directamente. Calidad: simple y reutilizable; los valores falsy (incluido 0) se convierten en cadena vacía, por lo que el contrato es de normalización textual, no conversión genérica. Sin hallazgo nuevo.

### AUDIT-CR-02 - toggleRoleMenuAccordionSection
**Dictamen: CUMPLE.** Evidencia: js/ui-common.js:4709-4720. Está expuesta en window, valida el contenedor, limita la consulta a las secciones hijas y conmuta la sección elegida mientras cierra las hermanas. La invocan los controles del acordeón y la selección inicial del drawer. Sin hallazgo nuevo.

### AUDIT-CR-03 - inserción del drawer
**Dictamen: CUMPLE.** Evidencia: js/ui-common.js:4758-4847. openMobileHamburgerDrawer crea el nodo cuando no existe y lo inserta con document.body.appendChild(drawer); cuando ya existe, lo reutiliza y elimina hidden. El botón móvil llama al método. Sin hallazgo nuevo.

### AUDIT-CR-04 - selección del Omnibox
**Dictamen: CUMPLE.** Evidencia: js/ui-common.js:4935-5000. El listener input usa debounce y no llama a focus/select. El bloque focus/select se ejecuta al abrir el modal, fuera del listener de escritura; al cerrar se restaura el foco al disparador si está disponible. Sin hallazgo nuevo.

## Observación documental
Los números de línea consignados en completadas.md (839, 4540, 4674 y 4822) son referencias históricas y no coinciden con las ubicaciones actuales de las funciones de ui-common.js. No se alteró el registro histórico.

## Resumen
- AUDIT-CR-01 a AUDIT-CR-04: 4/4 cumplen el alcance específico.
- Hallazgos nuevos: ninguno; Auditoria.txt y Pendientes.md permanecen sin cambios.
- Código fuente y completadas.md: sin modificaciones.
- Pruebas dinámicas: no ejecutadas; dictamen limitado a inspección estática/manual.
