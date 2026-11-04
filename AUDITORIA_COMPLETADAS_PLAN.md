# Plan maestro de auditoría - completadas.md

**Fecha de inicio:** 2026-11-04  
**Repositorio:** i-miss-cocaine/IMA  
**Rama de trabajo:** NG_beta_0.0.0.1_work  
**Rama base protegida:** NG_beta_0.0.0.1  
**HEAD inicial de trabajo:** aa234f7ae36ea8aa305253b40df8c2d7090c7ff2  
**HEAD base verificado:** 44d9891132332e692dbe2ba8602b41f50a508a59

## 1. Alcance e inventario

Se auditará el registro \`completadas.md\`, independiente de \`completadas_legacy.md\`.

- Archivo: 5,963 líneas; SHA Git del contenido de referencia: \`f57f1aef832e81e44fc4f7ec36a852d50e464676\`.
- Encabezados de tareas: 251.
- Identificadores únicos: 224.
- Hay identificadores repetidos, en particular el conjunto T-UX-01 a T-UX-27 aparece en más de una sección/versión. Se deben contrastar ambas descripciones y resolver cuál es la versión ampliada vigente, sin eliminar registros ni asumir que la repetición equivale a una tarea nueva.
- El resumen ejecutivo y las marcas [X] del documento son afirmaciones del registro, no evidencia de implementación.
- No modificar, reordenar, normalizar ni corregir \`completadas.md\`.

## 2. Reglas obligatorias

1. Aplicar íntegramente \`METODOLOGIA_DESARROLLO.md\`, SHA de referencia \`1a2d4de602a1449b697c2da82ab6423e7c61b280\`.
2. Auditoría manual: inspección archivo por archivo, función por función, variable por variable, flujo por flujo y dependencia por dependencia. No usar escáneres, scripts masivos ni validadores automáticos para decidir cumplimiento.
3. Antes de inspeccionar cada archivo de código, registrar su SHA/blob Git como copia de respaldo inmutable. No modificar código durante esta fase. Al terminar cada archivo, comparar su estado contra ese SHA; si hubiera diferencias, restaurar y documentar.
4. Contrastar todos los puntos del alcance y criterios de aceptación de cada tarea. Los comentarios, nombres de funciones, UI, wrappers, mocks y marcas de estado no son prueba de ejecución.
5. Seguir la ruta completa frontend -> API -> router -> función backend -> almacenamiento/servicio externo -> respuesta/UI. Comprobar permisos, integridad, errores, concurrencia, idempotencia, rendimiento, mantenibilidad y regresiones.
6. Considerar sustituciones y ampliaciones posteriores. Relacionar hallazgos con tareas actuales de \`Pendientes.md\` y \`Auditoria.txt\`; no duplicar una causa raíz ya registrada, pero sí ampliar evidencia/alcance cuando sea necesario.
7. Registrar cada hallazgo nuevo en \`Auditoria.txt\` y convertirlo en tarea concreta en \`Pendientes.md\`. Actualizar \`MapaDependencias.md\` y este plan por lote.
8. No cambiar estados de tareas históricas ni declarar una tarea completa por inferencia.
9. Commits modulares por lote, siempre en \`NG_beta_0.0.0.1_work\`. No hacer merge, no modificar la rama base, no alterar \`ChangesLogs.txt\` por ser auditoría sin cambios de código.

## 3. Respaldo inicial y referencias

- \`completadas.md\`: blob SHA \`f57f1aef832e81e44fc4f7ec36a852d50e464676\`; respaldo de referencia íntegro.
- \`METODOLOGIA_DESARROLLO.md\`: blob SHA \`1a2d4de602a1449b697c2da82ab6423e7c61b280\`; instrucciones de auditoría.
- \`Contexto_personal.txt\`: blob SHA \`36db8632556a5fc46054f16224e65b6b11855404\`.
- \`MapaDependencias.md\`: blob SHA \`c7cda1f2026c2325749cb701d2fdaf9e545e95cc\`.
- \`AUDITORIA_COMPLETADAS_LEGACY_PLAN.md\`: blob SHA \`c47380f92a43488dcb4a41319dba348cbd1072b7\`.
- HEAD inicial de la rama de trabajo: \`aa234f7ae36ea8aa305253b40df8c2d7090c7ff2\`.
- HEAD de la rama base: \`44d9891132332e692dbe2ba8602b41f50a508a59\`.

Para cada archivo de código y documento que se audite se registrará su propio blob SHA antes de leerlo, como pivote de comparación y restauración. Las referencias Git son inmutables; no se escribirá en los archivos originales durante la inspección.

## 4. División de trabajo

| Lote | Alcance en completadas.md | Líneas aproximadas | Estado |
|---|---|---:|---|
| C0 | AUDIT-CR-01 a 04 y verificación de estructura/duplicados | 22-41 | Pendiente |
| C1 | Fase 1: TAREA-01 a TAREA-20 y prioridades P0-P3 | 42-1428 | Pendiente |
| C2 | Fase 2, Fase 3 y Fase 4 (incluye registros T-UX repetidos y FASE2) | 1429-1817 | Pendiente |
| C3 | Fase 5: admisiones, aspirantes y portal de familias | 1818-2465 | Pendiente |
| C4 | Fases 6 y 7: tareas migradas, registro dual, microservicios y planificación | 2466-4757 | Pendiente |
| C5 | Fase 8: dashboards dinámicos, roles, modularización y Spreadsheets | 4758-5445 | Pendiente |
| C6 | Fase 9: SACE, calificaciones, evaluaciones y resultados académicos | 5446-5963 | Pendiente |

Los lotes se subdividirán si el tamaño de los archivos, dependencias o cuota lo exige. Cada commit debe dejar un checkpoint exacto de tareas revisadas, archivos inspeccionados, SHA de respaldo, evidencia y siguiente punto.

## 5. Criterios de dictamen

- **Cumple:** todos los requisitos verificables están implementados, conectados y cuentan con evidencia suficiente.
- **Cumple parcialmente:** hay implementación real, pero faltan criterios, existen fallos o la cobertura es incompleta.
- **No cumple:** no existe implementación funcional o la ruta está desconectada.
- **No verificable:** el requisito depende de despliegue, credenciales, servicios externos o pruebas que no están disponibles; no se convierte en éxito por falta de evidencia.

La calidad se dictamina por separado del cumplimiento funcional.

## 6. Estado y checkpoint inicial

- Auditoría de \`completadas_legacy.md\`: cerrada previamente (49/49); no se repite.
- Auditoría de \`completadas.md\`: iniciada, 0/183 identificadores únicos auditados; inventario estructural realizado.
- Primera tarea a auditar: AUDIT-CR-01, contrastando su afirmación de implementación en \`backend/user-service/Code.gs\` con el código actual.
- No se han añadido hallazgos ni se ha modificado código.
- Próxima acción: auditar C0 manualmente y registrar resultados por evidencia; después continuar C1.

## 7. Control de continuidad

Al reanudar:
1. Verificar HEAD de ambas ramas y confirmar que la rama base no cambió.
2. Leer este plan, \`Contexto_personal.txt\`, \`METODOLOGIA_DESARROLLO.md\`, \`Pendientes.md\`, \`Auditoria.txt\` y \`MapaDependencias.md\`.
3. Continuar desde el último checkpoint confirmado, sin repetir lotes cerrados.
4. Mantener los identificadores y estados históricos de \`completadas.md\` intactos.


## 8. Resultados del lote C0 (2026-11-04)

- Alcance: AUDIT-CR-01 a AUDIT-CR-04.
- Resultado: las cuatro tareas cumplen su alcance específico en el código actual.
- Evidencia: backend/user-service/Code.gs:839-843; js/ui-common.js:4709-4720, 4758-4847 y 4935-5000.
- Hallazgos nuevos: ninguno; Auditoria.txt y Pendientes.md permanecen sin cambios.
- Observación: las referencias de línea de completadas.md son históricas y han cambiado en el código actual.
- Pruebas: inspección estática/manual; no se ejecutó navegador ni Apps Script.
- Progreso: 4/183 identificadores únicos auditados; 179 pendientes.
- Siguiente lote: C1, iniciar por TAREA-01.
- Código fuente y completadas.md: sin modificaciones.

## 9. Resultado parcial del lote C1.1 - TAREA-01 (2026-11-04)

- Dictamen: Cumple parcialmente.
- Evidencia: js/auth.js:140-165 no conserva sessionToken en currentUser; js/api.js:45-57 envía requesterUserId/requesterRole del almacenamiento local, pero no sessionToken. USER emite el token en backend/user-service/Code.gs:2479-2537 y getUserVerifiedRole lo verifica, pero el frontend no completa el contrato.
- Controles parciales: existen validadores HMAC/RBAC en los cinco servicios, con identidades derivadas de claims cuando el token llega.
- Incumplimientos ya registrados: AUD-NG-001, AUD-NG-002, AUD-NG-003, AUD-NG-004, AUD-NG-005, AUD-NG-112, TASK-085, TASK-142 y TASK-418.
- Hallazgo nuevo: AUD-NG-159. USER/logoutUser es público y permite revocar sesiones de userId/sessionId arbitrarios.
- No verificable desde el repositorio: identidad de ejecución y permisos efectivos del despliegue Apps Script; requieren inspección de configuración del despliegue. Tampoco se ejecutaron pruebas reales de origen/CSRF.
- Inventario corregido: 231 declaraciones; 183 identificadores únicos. C0: 4/183; con TAREA-01: 5/183 auditados, 178 pendientes.
- Siguiente tarea: FASE2-T01; continuar con el resto del lote C1 y auditar individualmente las ampliaciones posteriores F4.
