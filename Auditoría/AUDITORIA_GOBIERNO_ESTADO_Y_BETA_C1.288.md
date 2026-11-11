# AUDITORÍA DE CAMBIO NORMATIVO — C1.288

**Sesión:** IMA-GOV-20261109-0355Z-01; **HEAD inicial:** `e255ee616e3d82394243e2d924ab7c52d17a17d1`; **rama:** `NG_beta_0.0.0.1_work`.

## Hallazgo
Las reglas condicionaban Completada a la aprobación formal de Code Review y a pruebas de comportamiento amplias. C1.287 dejó TASK-637 en revisión esperando aprobación del usuario pese a haber concluido la implementación documental y su Code Review interno. Se mezclaban cierre de implementación y certificación funcional integral.

## Corrección
- Completada = requisitos de implementación terminados, verificaciones técnicas internas aplicables, autoauditoría, Code Review interno aprobado y evidencia.
- No requiere aprobación del usuario ni pruebas funcionales beta de toda la plataforma.
- Se mantienen controles técnicos acotados durante cada iteración.
- Las pruebas integrales se gestionan en `docs/testing/PRUEBAS_FUNCIONALES_BETA.md`.
- La plataforma no queda certificada para piloto/cutover por el simple hecho de que las tareas estén Completadas.

## Archivos
- `METODOLOGIA_DESARROLLO.md`: fases 5–7, 18.4, 18.6, 19.2, 19.2.1, 19.4, 19.5 y nueva sección 21.
- `Auditoría/PLAN_MAESTRO_IMPLEMENTACION.md`: regla de estado y aclaración C1.288.
- `Auditoría/Contexto_personal.txt`: regla H y checkpoint C1.288.
- `Auditoría/INDICE_CHECKPOINTS.md`: fila C1.288.
- `pendientes/Contabilidad/Pendientes.md`: TASK-637 [X]/Completada.
- `docs/testing/PRUEBAS_FUNCIONALES_BETA.md`: catálogo nuevo.
- Inventario actualizado por los dos documentos nuevos y los blobs modificados.
- `Auditoria.txt` y `changueslogs.txt`: registros acumulativos.

## TASK-637
C1.287 acredita 1.011 rutas, cero discrepancias de SHA/tamaño, autorreferencia validada, index.html intacto, autoauditoría y Code Review documental aprobado. Se marca Completada como implementación documental. No se afirma que el portal haya pasado beta.

## Verificación
Consistencia revisada entre metodología, plan, backlog y catálogo; 16 familias de pruebas y grupos iniciales Pendientes; beta no iniciada; no se inventan PASS. No se ejecutan runtime/E2E porque este cambio es normativo/documental.

## Continuidad
Siguiente tarea: TASK-638 en `pendientes/Contabilidad/Pendientes.md`; auditar íntegramente sus requisitos antes de implementar.
Checkpoint: C1.288 en `Auditoría/Contexto_personal.txt`, índice central fila C1.288.
