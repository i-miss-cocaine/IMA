# Índice central de checkpoints — IMA

> Antes de modificar este índice o cualquier archivo del repositorio, leer `Normas_Desarollo.md`, única fuente de normas operativas. Este archivo solo localiza checkpoints.

Este índice localiza los checkpoints. Los cuerpos históricos permanecen íntegros en sus archivos originales. Los fragmentos Parte_01.txt a Parte_07.txt son recuperación del contexto original y no forman parte de la serie rotativa nueva.

## Estado actual
- Último checkpoint: **C1.472**
- Última sesión: `IMA-EXEC-20261110-1825Z-02`
- Archivo activo: `Auditoría/Contexto_personal_Historico/Checkpoints_Parte_0005.txt`
- Límite por archivo: **180.000 caracteres**
- Caracteres del archivo activo tras C1.472: **46419**
- Próxima parte rotativa: `Auditoría/Contexto_personal_Historico/Checkpoints_Parte_0006.txt`
- Rama de trabajo: `NG_beta_0.0.0.1_work`
- Baseline lógico válido: **C1.316** (`31262d5ccbfc46a5f87a5d0fc9c363b177283d9a`). C1.317–C1.382 se conservan, pero no se aceptan como evidencia de continuidad por corrección expresa del usuario.

## Registro de checkpoints

| ID | Sesión | Estado | Tarea / fase | Ubicación exacta | Líneas | Anterior | Commit |
|---|---|---|---|---|---:|---|---|
| C1.285 | IMA-GOV-20261109-0322Z-01 | Publicado | Gobierno documental / PM-00 | `Auditoría/Contexto_personal.txt` — sección C1.285 | 1508–1531 | C1.284 | `4cda8611c4d3c4aece4c7d80922cc4c14c920f5a` |
| C1.286 | IMA-GOV-20261109-0339Z-01 | Publicado | Gobierno documental / PM-00 | `Auditoría/Contexto_personal.txt` — sección C1.286 | 1547–1587 | C1.285 | `a77e9a6dc373a66e243d6287743139cea67e4c26` | 
| C1.287 | IMA-EXEC-20261109-0343Z-01 | Publicado en este commit | TASK-637 / PM-00 | `Auditoría/Contexto_personal.txt` — sección C1.287 | 1590–1632 | C1.286 | Este commit; SHA verificado externamente en el reporte de cierre |
| C1.288 | IMA-GOV-20261109-0355Z-01 | Publicado | Gobierno de estado / pruebas beta | `Auditoría/Contexto_personal.txt` — sección C1.288 | 1643–1674 | C1.287 | `0afe7fd3a9b9df974afc557063d40b787a7e1c30` |
| C1.289 | IMA-EXEC-20261109-0407Z-01 | Publicado | TASK-638 / PM-00 — auditoría parcial | `Auditoría/Contexto_personal.txt` — sección C1.289 | 1676–1736 | C1.288 | `57643c473df081aa57cdd8e5def542281f500000` |
| C1.290 | IMA-EXEC-20261109-0413Z-01 | Publicado | TASK-638 / PM-00 — páginas y portales, grupo 2 | `Auditoría/Contexto_personal.txt` — sección C1.290 | 1738–1788 | C1.289 | `b26169f8c0d4e729db152fa7910ec585bc28d5e5` |

| C1.291 | IMA-EXEC-20261109-0420Z-01 | Publicado | TASK-638 / PM-00 — cobertura HTML/HTM 101/101 | `Auditoría/Contexto_personal.txt` — sección C1.291 | 1790–1840 | C1.290 | `3694b763b78a1d400a4564dddcb6ebd3c0108ce9` |

| C1.292 | IMA-EXEC-20261109-0430Z-01 | Publicado | TASK-638 / PM-00 — inventario JS y dependencias runtime | Auditoría/Contexto_personal.txt — sección C1.292 | 1842–1892 | C1.291 | 32b8f5884dd24dbeaf1a3bf028eb7635ada592df |
| C1.293 | IMA-EXEC-20261109-1108Z-01 | Publicado | TASK-638 / PM-00 — CSS/GS/JSON y contratos | Auditoría/Contexto_personal.txt — sección C1.293 | 1895–1943 | C1.292 | fd73830144a9822369e4402076685928171908d6 |
| C1.294 | IMA-AUDIT-20261109-1140Z | Publicado | TASK-637 reauditoría / PM-00.3 | Auditoría/Contexto_personal_Historico/Checkpoints_Parte_0002.txt — sección C1.294 | 55–128 | C1.293 | `00ffac159929fd65f1fc3a65e72509838df0cbde` |

- SHA del bloque normativo A–I de Parte_0003: `a434b8ac19bd40646e81c0a911c525e3cea9920f`.

## Reglas de mantenimiento
1. Agregar una fila por cada checkpoint, sin borrar ni reutilizar IDs.
2. Actualizar «Último checkpoint» y «Archivo activo» en el mismo commit que incorpora el checkpoint.
3. Al rotar, registrar la nueva parte, el SHA de su bloque normativo A–I y el rango exacto de líneas.
4. Auditoria.txt y changueslogs.txt deben apuntar a esta tabla mediante el ID exacto.
5. Los checkpoints anteriores a la adopción del índice son legado histórico; no inventar ubicaciones ni rangos retrospectivos. Indexarlos solo cuando puedan verificarse.


| C1.295 | IMA-AUDIT-20261109-1152Z | Publicado | TASK-637 corrección / PM-00.3 | Auditoría/Contexto_personal_Historico/Checkpoints_Parte_0002.txt — sección C1.295 | 131–172 | C1.294 | `0edce6ae2721b1d839ef259dad7ea77962fe8ab3` |

| C1.296 | IMA-AUDIT-20261109-1152Z | Publicado | TASK-638 auditoría / PM-00 | Auditoría/Contexto_personal_Historico/Checkpoints_Parte_0002.txt — sección C1.296 | 175–210 | C1.295 | 5bf51a6b0c12fd62edc42385c55976789d00a423 |
| C1.297 | IMA-AUDIT-20261109-1152Z | Publicado | TASK-638 auditoría / PM-00 — USER/ACADEMIC | Auditoría/Contexto_personal_Historico/Checkpoints_Parte_0002.txt — sección C1.297 | 212–237 | C1.296 | `103c02dc0ba31c0d3ceb2e5c5a39c1a747cc67f9` |

| C1.298 | IMA-AUDIT-20261109-1222Z-01 | Publicado en este commit | TASK-638 auditoría / PM-00 — TASK/EXAM | Auditoría/Contexto_personal_Historico/Checkpoints_Parte_0002.txt — sección C1.298 | 239–269 | C1.297 | Este commit; SHA a verificar externamente |

| C1.299 | IMA-AUDIT-20261109-1232Z-01 | Publicado | TASK-638 auditoría / PM-00 — autorización contextual TASK/EXAM | Auditoría/Contexto_personal_Historico/Checkpoints_Parte_0002.txt — sección C1.299 | 270–298 | C1.298 | `9e21a060922bc4c7d96d06c0098a48d643b32276` |
| C1.300 | IMA-GOV-20261109-1255Z-01 | Publicado | Gobernanza documental — auditoría única / IMA | Auditoría/Contexto_personal_Historico/Checkpoints_Parte_0002.txt — sección C1.300 | 302–344 | C1.299 | `650a3cccf1974afbc7d29f7d5d922a3f30bc1b1b` |
| C1.301 | IMA-EXEC-20261109-1305Z-01 | Publicado | TASK-638 completada / PM-00 — matriz integral de dependencias | Auditoría/Contexto_personal_Historico/Checkpoints_Parte_0002.txt — sección C1.301 | 347–395 | C1.300 | `aa5a85f9eaedec5f89963a15cd32e8ed5e6e45e6` |

| C1.302 | IMA-AUDIT-20261109-1339Z-01 | Publicado | TASK-639 completada / PM-00 — símbolos, redefiniciones y ciclos | Auditoría/Contexto_personal_Historico/Checkpoints_Parte_0002.txt — sección C1.302 | 398–451 | C1.301 | `9ddafd273ccda4aeeb13e04fdb03a053a7556848` |
| C1.303 | IMA-DOCFIX-20261109-1344Z-01 | Publicado en este commit | Corrección documental del índice C1.302 | Auditoría/Contexto_personal_Historico/Checkpoints_Parte_0002.txt — sección C1.303 | 454–490 | C1.302 | Este commit; SHA a verificar externamente |

| C1.304 | IMA-BLOCK-20261109-1350Z-01 | Publicado en este commit | Bloqueo de lectura del requisito original TASK-636 / PM-01 | Auditoría/Contexto_personal_Historico/Checkpoints_Parte_0002.txt — sección C1.304 | 493–542 | C1.303 | Este commit; SHA a verificar externamente |

| C1.305 | IMA-EXEC-20261109-1435Z-01 | Publicado en este commit | Implementación parcial TASK-636 / PM-01 — token, tickets, noticias y automatización | Auditoría/Contexto_personal_Historico/Checkpoints_Parte_0002.txt — sección C1.305 | 545–600 | C1.304 | Este commit; SHA verificado tras publicación |

| C1.306 | IMA-EXEC-20261109-1450Z-01 | Publicado en este commit | Task-Service: claims, propiedad y filtrado de recursos; cierre destructivo bloqueado | Auditoría/Contexto_personal_Historico/Checkpoints_Parte_0002.txt — sección C1.306 | 603–663 | C1.305 | Este commit; SHA verificado tras publicación |

| C1.307 | IMA-EXEC-20261109-1455Z-01 | Preparado para commit único | TASK-636 / PM-01 — mutaciones Task-Service y conciliación de asignaciones | Auditoría/Contexto_personal_Historico/Checkpoints_Parte_0002.txt — sección C1.307 | 665–758 | C1.306 | Este commit; SHA verificado tras publicación |

| C1.308 | IMA-EXEC-20261109-1510Z-01 | Publicado en este commit | TASK-636 / PM-01 — propiedad de archivos, entregas y cargas reanudables | `Auditoría/Contexto_personal_Historico/Checkpoints_Parte_0002.txt` — sección C1.308 | 762–842 | C1.307 | Este commit; SHA verificado tras publicación |

| C1.309 | IMA-EXEC-20261109-1533Z-01 | Publicado en este commit | TASK-636 / PM-01 — capacidades públicas ACADEMIC y protección de archivos | Auditoría/Contexto_personal_Historico/Checkpoints_Parte_0002.txt — sección C1.309 | 844–917 | C1.308 | Este commit; SHA a verificar externamente |

| C1.310 | IMA-EXEC-20261109-1533Z-02 | Publicado en este commit | TASK-636 / PM-01 — integración frontend de capacidades de admisión | Auditoría/Contexto_personal_Historico/Checkpoints_Parte_0002.txt — sección C1.310 | 920–978 | C1.309 | Este commit; SHA a verificar externamente |

| C1.311 | IMA-EXEC-20261109-1605Z-01 | Publicado en este commit | TASK-636 / PM-01 — bloqueo de cierre docente y auditoría backup/restore | Auditoría/Contexto_personal_Historico/Checkpoints_Parte_0002.txt — sección C1.311 | 981–1034 | C1.310 | Este commit; SHA verificado tras publicación |

| C1.312 | IMA-EXEC-20261109-1618Z-01 | Publicado en este commit | TASK-636 / PM-01 — protocolo dedicado de backup/restore, cierre aún bloqueado | Auditoría/Contexto_personal_Historico/Checkpoints_Parte_0002.txt — sección C1.312 | 1036–1105 | C1.311 | Este commit; SHA verificado tras publicación |

| C1.313 | IMA-EXEC-20261109-1635Z-01 | Publicado en este commit | TASK-636 / PM-01 — journal durable y recuperación de restore | Auditoría/Contexto_personal_Historico/Checkpoints_Parte_0002.txt — sección C1.313 | 1107–1162 | C1.312 | Este commit; SHA verificado tras publicación |

| C1.314 | IMA-EXEC-20261109-1650Z-01 | Publicado en este commit | TASK-636 / PM-01 — confirmación explícita de recuperación | Auditoría/Contexto_personal_Historico/Checkpoints_Parte_0002.txt — sección C1.314 | 1164–1214 | C1.313 | Este commit; SHA verificado tras publicación |

| C1.315 | IMA-EXEC-20261109-1650Z-01 | Publicado en este commit | TASK-636 / PM-01 — recuperación serializada e idempotencia Drive | Auditoría/Contexto_personal_Historico/Checkpoints_Parte_0002.txt — sección C1.315 | 1216–1282 | C1.314 | Este commit; SHA verificado tras publicación |

| C1.316 | IMA-EXEC-20261109-1650Z-01 | Publicado en este commit | TASK-636 / PM-01 — contrato Node en CI; integración Apps Script bloqueada por falta de entorno aislado | Auditoría/Contexto_personal_Historico/Checkpoints_Parte_0002.txt — sección C1.316 | 1284–1339 | C1.315 | Este commit; SHA verificado tras publicación |

| C1.317 | IMA-EXEC-20261109-1650Z-01 | Publicado en este commit | TASK-636 / PM-01 — continuidad verificada; integración Apps Script aislada bloqueada | Auditoría/Contexto_personal_Historico/Checkpoints_Parte_0002.txt — sección C1.317 | 1342–1403 | C1.316 | Este commit; SHA verificado tras publicación |

| C1.318 | IMA-EXEC-20261109-1650Z-01 | Publicado en este commit | TASK-068 / PM-01 — auditoría preimplementación; implementación pendiente | Auditoría/Contexto_personal_Historico/Checkpoints_Parte_0002.txt — sección C1.318 | 1406–1461 | C1.317 | Este commit; SHA verificado tras publicación |

| C1.319 | IMA-EXEC-20261109-1650Z-01 | Publicado en este commit | TASK-068 / PM-01 — respaldo Git histórico e implementación parcial | Auditoría/Contexto_personal_Historico/Checkpoints_Parte_0002.txt — sección C1.319 | 1464–1510 | C1.318 | Este commit; SHA verificado tras publicación |

| C1.320 | IMA-EXEC-20261109-1650Z-01 | Publicado en este commit | TASK-068 / PM-01 — caché IndexedDB y wrappers API cliente | Auditoría/Contexto_personal_Historico/Checkpoints_Parte_0002.txt — C1.320 | 1512–1546 | C1.319 | Este commit; SHA verificado tras publicación |

| C1.320 | IMA-EXEC-20261109-1650Z-01 | Publicado en este commit | TASK-068 / PM-01 — caché IndexedDB y wrappers API cliente | Auditoría/Contexto_personal_Historico/Checkpoints_Parte_0002.txt — C1.320 | 1512–1546 | C1.319 | C1.320 implementation d2b721a; test fix 0b891a5; CI 42667176023 PASS |
| C1.321 | IMA-EXEC-20261109-1650Z-01 | Publicado en este commit | TASK-068 / PM-01 — lecturas no mutantes y validación de destino | Auditoría/Contexto_personal_Historico/Checkpoints_Parte_0002.txt — C1.321 | 1553–1582 | C1.320 | 19eba80; CI 42667650780 PASS |

| C1.322 | IMA-EXEC-20261109-1650Z-01 | Publicado en este commit | TASK-068 / PM-01 — validadores de destino por esquemas verificados | Auditoría/Contexto_personal_Historico/Checkpoints_Parte_0002.txt — C1.322 | 1588–1615 | C1.321 | 6e4a934; CI 42668165457 PASS |

| C1.323 | IMA-EXEC-20261109-1650Z-01 | Publicado en este commit | TASK-068 / PM-01 — auditoría estática de escritores de destino | Auditoría/Contexto_personal_Historico/Checkpoints_Parte_0002.txt — C1.323 | 1622–1658 | C1.322 | Este commit; SHA verificado tras publicación |

| C1.324 | IMA-EXEC-20261109-1802Z-01 | Preparado para commit único | TASK-068 / PM-01 — validación integral del esquema destino; AUD-NG-380 corregido, AUD-NG-378 abierto | Auditoría/Contexto_personal_Historico/Checkpoints_Parte_0002.txt — sección C1.324 | 1662–1716 | C1.323 | Este commit; SHA verificado externamente tras publicación |

| C1.325 | IMA-EXEC-20261109-1802Z-01 | Preparado para commit único | TASK-068 / PM-01 — corrección del harness de validación de esquemas; AUD-NG-381 registrado | Auditoría/Contexto_personal_Historico/Checkpoints_Parte_0002.txt — sección C1.325 | 1720–1770 | C1.324 | Este commit; SHA verificado externamente tras publicación |

| C1.326 | IMA-EXEC-20261109-1802Z-01 | Preparado para commit único | TASK-068 / PM-01 — extractor determinista del test de esquemas; AUD-NG-381 abierto hasta CI | Auditoría/Contexto_personal_Historico/Checkpoints_Parte_0002.txt — sección C1.326 | 1774–1824 | C1.325 | Este commit; SHA verificado externamente tras publicación |

| C1.327 | IMA-EXEC-20261109-1802Z-01 | Preparado para commit único | TASK-068 / PM-01 — CI aprobado; AUD-NG-378 bloqueado por transporte/configuración externa | Auditoría/Contexto_personal_Historico/Checkpoints_Parte_0002.txt — sección C1.327 | 1828–1872 | C1.326 | Este commit; SHA verificado externamente tras publicación |

| C1.328 | IMA-EXEC-20261109-1909Z-01 | Preparado para commit único | TASK-068 / PM-01 — bloqueo AUD-NG-378 y recuperación del backlog de requisitos | Auditoría/Contexto_personal_Historico/Checkpoints_Parte_0002.txt — sección C1.328 | 1875–1936 | C1.327 | Este commit; SHA verificado tras publicación |

| C1.329 | IMA-GOV-20261109-2154Z-01 | Publicado en este commit | Recuperación íntegra del backlog y norma de pruebas beta | Auditoría/Contexto_personal_Historico/Checkpoints_Parte_0003.txt — sección C1.329 | 61–104 | C1.328 | Este commit; SHA verificado tras publicación |

| C1.330 | IMA-GOV-20261109-2201Z-01 | Publicado en este commit | Casos beta específicos TASK-636 y TASK-068 | Auditoría/Contexto_personal_Historico/Checkpoints_Parte_0003.txt — sección C1.330 | 107–139 | C1.329 | Este commit; SHA verificado tras publicación |

| C1.331 | IMA-GOV-20261109-2201Z-01 | Publicado en este commit | Corrección de rumbo / reauditoría TASK-636 — C1.316 como baseline lógico; pruebas locales y beta diferidas | Auditoría/Contexto_personal_Historico/Checkpoints_Parte_0003.txt — sección C1.331 | 2 | C1.316 (último válido) | Este commit; SHA verificado tras publicación |

| C1.332 | IMA-GOV-20261109-2201Z-01 | Publicado en este commit | Corrección del harness local TASK-636; separadores VM deterministas | Auditoría/Contexto_personal_Historico/Checkpoints_Parte_0003.txt — sección C1.332 | 198 | C1.331 | Este commit; SHA verificado tras publicación |

| C1.333 | IMA-GOV-20261109-2201Z-01 | Publicado en este commit | Extractor balanceado del contrato local TASK-636 tras fallo CI | Auditoría/Contexto_personal_Historico/Checkpoints_Parte_0003.txt — sección C1.333 | 212 | C1.332 | Este commit; SHA verificado tras publicación |

| C1.334 | IMA-GOV-20261109-2201Z-01 | Publicado en este commit | Fixture Date creado en VM para contrato local TASK-636 | Auditoría/Contexto_personal_Historico/Checkpoints_Parte_0003.txt — sección C1.334 | 225 | C1.333 | Este commit; SHA verificado tras publicación |

| C1.335 | IMA-GOV-20261109-2201Z-01 | Publicado en este commit | Corrección del contexto VM de Date en fixture snapshot TASK-636 | Auditoría/Contexto_personal_Historico/Checkpoints_Parte_0003.txt — sección C1.335 | 238 | C1.334 | Este commit; SHA verificado tras publicación |

| C1.336 | IMA-GOV-20261109-2201Z-01 | Publicado en este commit | TASK-068 — clasificación local conservadora de identidades | Auditoría/Contexto_personal_Historico/Checkpoints_Parte_0003.txt — sección C1.336 | 268 | C1.335 | Este commit; SHA verificado tras publicación |

| C1.337 | IMA-GOV-20261109-2201Z-01 | Publicado en este commit | CI TASK-636 aprobado; ajuste de formato de contrato TASK-068 | Auditoría/Contexto_personal_Historico/Checkpoints_Parte_0003.txt — sección C1.337 | 282 | C1.336 | Este commit; SHA verificado tras publicación |

| C1.338 | IMA-GOV-20261109-2201Z-01 | Publicado en este commit | CI aprobado TASK-636 y TASK-068; writer de importación sigue como brecha local | Auditoría/Contexto_personal_Historico/Checkpoints_Parte_0003.txt — sección C1.338 | 307 | C1.337 | Este commit; SHA verificado tras publicación |

| C1.339 | IMA-GOV-20261109-2201Z-01 | Publicado en este commit | TASK-068 — writers idempotentes por servicio propietario | Auditoría/Contexto_personal_Historico/Checkpoints_Parte_0003.txt — sección C1.339 | 346 | C1.316 (último válido) | Este commit; SHA verificado tras publicación |

| C1.340 | IMA-GOV-20261109-2201Z-01 | Publicado en este commit | TASK-068 — corregir mock de hoja vacía; CI 42712140456 falló por doble encabezado en fixture | Auditoría/Contexto_personal_Historico/Checkpoints_Parte_0003.txt — sección C1.340 | 360 | C1.339 | Este commit; SHA verificado tras publicación |

| C1.341 | IMA-GOV-20261109-2201Z-01 | Publicado en este commit | TASK-068 — transporte HMAC y orquestación de importación multi-servicio | Auditoría/Contexto_personal_Historico/Checkpoints_Parte_0003.txt — sección C1.341 | 391 | C1.340 | Este commit; SHA verificado tras publicación |

| C1.342 | IMA-GOV-20261109-2201Z-01 | Publicado en este commit | Ajustar contrato estático: retirar expectativa obsoleta DESTINATION_WRITER_NOT_CONFIGURED | Auditoría/Contexto_personal_Historico/Checkpoints_Parte_0003.txt — sección C1.342 | 405 | C1.341 | Este commit; SHA verificado tras publicación |

| C1.343 | IMA-GOV-20261109-2201Z-01 | Publicado en este commit | Aserciones de URL alineadas con route.urlProperty; fixtures HMAC ya superados | Auditoría/Contexto_personal_Historico/Checkpoints_Parte_0003.txt — sección C1.343 | 419 | C1.342 | Este commit; SHA verificado tras publicación |

| C1.344 | IMA-GOV-20261109-2201Z-01 | Publicado en este commit | TASK-068 — snapshots Date tipados y pruebas sobre writers reales | Auditoría/Contexto_personal_Historico/Checkpoints_Parte_0003.txt — sección C1.344 | 434 | C1.343 | Este commit; SHA verificado tras publicación |

| C1.345 | IMA-GOV-20261109-2201Z-01 | Publicado en este commit | Harness enlazado a writers reales USER/ACADEMIC; pruebas UPDATE/Date | Auditoría/Contexto_personal_Historico/Checkpoints_Parte_0003.txt — sección C1.345 | 448 | C1.344 | Este commit; SHA verificado tras publicación |

| C1.346 | IMA-GOV-20261109-2201Z-01 | Publicado en este commit | Completar funciones encode/decode Date para snapshots en USER/ACADEMIC | Auditoría/Contexto_personal_Historico/Checkpoints_Parte_0003.txt — sección C1.346 | 462 | C1.345 | Este commit; SHA verificado tras publicación |

| C1.347 | IMA-GOV-20261109-2201Z-01 | Publicado en este commit | Corregir captura de hoja destino tras primera inserción en fixture | Auditoría/Contexto_personal_Historico/Checkpoints_Parte_0003.txt — sección C1.347 | 475 | C1.346 | Este commit; SHA verificado tras publicación |

| C1.348 | IMA-GOV-20261109-2201Z-01 | Publicado en este commit | TASK-068 — mocks de orquestación, dos fuentes, idempotencia y compensación multi-fila | Auditoría/Contexto_personal_Historico/Checkpoints_Parte_0003.txt — sección C1.348 | 490 | C1.347 | Este commit; SHA verificado tras publicación |

| C1.349 | IMA-GOV-20261109-2201Z-01 | Publicado en este commit | TASK-068 — veto de homónimos con identificación/código/fecha contradictorios | Auditoría/Contexto_personal_Historico/Checkpoints_Parte_0003.txt — sección C1.349 | 506 | C1.348 | Este commit; SHA verificado tras publicación |

| C1.350 | IMA-GOV-20261109-2201Z-01 | Publicado en este commit | TASK-068 — consola de Secretaría para búsqueda/revisión e historial de identidades | Auditoría/Contexto_personal_Historico/Checkpoints_Parte_0003.txt — C1.350 | 526 | C1.349 | Este commit; SHA verificado tras publicación |

| C1.351 | IMA-GOV-20261109-2201Z-01 | Publicado en este commit | TASK-068 — pruebas de referencias múltiples, relaciones y caché confirmada | Auditoría/Contexto_personal_Historico/Checkpoints_Parte_0003.txt — C1.351 | 544 | C1.350 | Este commit; SHA verificado tras publicación |

| C1.352 | IMA-GOV-20261109-2201Z-01 | Publicado en este commit | Corrección fixture relacional TASK-068: SPREADSHEET_ID y PersonaID de responsable | Auditoría/Contexto_personal_Historico/Checkpoints_Parte_0003.txt — C1.352 | 557 | C1.351 | Este commit; SHA verificado tras publicación |

| C1.353 | IMA-GOV-20261109-2201Z-01 | Publicado en este commit | TASK-068 — RBAC explícito para búsqueda y vinculación de identidades | Auditoría/Contexto_personal_Historico/Checkpoints_Parte_0003.txt — C1.353 | 572 | C1.352 | Este commit; SHA verificado tras publicación |

| C1.354 | IMA-GOV-20261109-2201Z-01 | Publicado en este commit | TASK-068 — motivo obligatorio server-side y prueba de vinculación auditable | Auditoría/Contexto_personal_Historico/Checkpoints_Parte_0003.txt — C1.354 | 587 | C1.353 | Este commit; SHA verificado tras publicación |

| C1.355 | IMA-GOV-20261109-2201Z-01 | Publicado en este commit | Corrección fixture linkPersonAccount: SPREADSHEET_ID VM | Auditoría/Contexto_personal_Historico/Checkpoints_Parte_0003.txt — C1.355 | 600 | C1.354 | Este commit; SHA verificado tras publicación |

| C1.356 | IMA-GOV-20261109-2201Z-01 | Publicado en este commit | TASK-068 — reconciliación de claves y destinos de correspondencia | Auditoría/Contexto_personal_Historico/Checkpoints_Parte_0003.txt — C1.356 | 615 | C1.355 | Este commit; SHA verificado tras publicación |

| C1.357 | IMA-GOV-20261109-2201Z-01 | Publicado en este commit | TASK-068 — escritores locales para empleado y curso en ACCOUNTING | Auditoría/Contexto_personal_Historico/Checkpoints_Parte_0003.txt — C1.357 | 631 | C1.356 | Este commit; SHA verificado tras publicación |

| C1.358 | IMA-GOV-20261109-2201Z-01 | Publicado en este commit | Ajustar aserción del esquema de curso al literal canónico compacto | Auditoría/Contexto_personal_Historico/Checkpoints_Parte_0003.txt — C1.358 | 644 | C1.357 | Este commit; SHA verificado tras publicación |

| C1.359 | IMA-GOV-20261109-2201Z-01 | Publicado en este commit | TASK-068 — UPDATE/compensación Date y dispatch local ACCOUNTING | Auditoría/Contexto_personal_Historico/Checkpoints_Parte_0003.txt — C1.359 | 658 | C1.358 | Este commit; SHA verificado tras publicación |

| C1.360 | IMA-GOV-20261109-2201Z-01 | Publicado en este commit | TASK-068 — prueba real de registro, idempotencia, revisión, resolución e historial | Auditoría/Contexto_personal_Historico/Checkpoints_Parte_0003.txt — C1.360 | 671 | C1.359 | Este commit; SHA verificado tras publicación |

| C1.361 | IMA-GOV-20261109-2201Z-01 | Publicado en este commit | TASK-068 — inicialización first-use de esquemas y búsqueda no mutante | Auditoría/Contexto_personal_Historico/Checkpoints_Parte_0003.txt — C1.361 | 685 | C1.360 | Este commit; SHA verificado tras publicación |

| C1.362 | IMA-GOV-20261109-2201Z-01 | Publicado en este commit | TASK-068 — integridad académica/familiar/administrativa y auditoría read-only | Auditoría/Contexto_personal_Historico/Checkpoints_Parte_0003.txt — C1.362 | 699 | C1.361 | Este commit; SHA verificado tras publicación |

| C1.363 | IMA-GOV-20261109-2201Z-01 | Publicado en este commit | Cierre TASK-068; BETA-FUNC-008 diferida; próxima TASK-636 | Auditoría/Contexto_personal_Historico/Checkpoints_Parte_0003.txt — C1.363 | 728 | C1.362 | Este commit; SHA verificado tras publicación |

| C1.364 | IMA-GOV-20261109-2201Z-01 | Publicado en este commit | TASK-636 AUD-NG-370 — reconciliación segura de metadatos históricos | Auditoría/Contexto_personal_Historico/Checkpoints_Parte_0003.txt — C1.364 | 744 | C1.363 | Este commit; SHA verificado tras publicación |

| C1.365 | IMA-GOV-20261109-2201Z-01 | Publicado en este commit | TASK-636 — rollback atómico de backfill y parseo VM del servicio | Auditoría/Contexto_personal_Historico/Checkpoints_Parte_0003.txt — C1.365 | 759 | C1.364 | Este commit; SHA verificado tras publicación |

| C1.366 | IMA-EXEC-20261109-1739Z-01 | Publicado en este commit; baseline lógico C1.316 | TASK-636 / PM-01 — aislamiento del estado de recuperación compensatoria | Auditoría/Contexto_personal_Historico/Checkpoints_Parte_0003.txt — sección C1.366 | 761–815 | C1.316 (último válido) | Este commit; SHA verificado tras publicación |

| C1.367 | IMA-EXEC-20261109-1739Z-01 | Publicado en este commit; baseline lógico C1.316 | TASK-636 / PM-01 — protección de referencias URL en versiones | Auditoría/Contexto_personal_Historico/Checkpoints_Parte_0003.txt — sección C1.367 | 818–872 | C1.366 | Este commit; SHA verificado tras publicación |

| C1.368 | IMA-EXEC-20261109-1739Z-01 | Publicado en este commit; baseline lógico C1.316 | TASK-636 / PM-01 — protección de audiencias públicas | Auditoría/Contexto_personal_Historico/Checkpoints_Parte_0003.txt — sección C1.368 | 875–927 | C1.367 | Este commit; SHA verificado tras publicación |

| C1.369 | IMA-EXEC-20261109-1739Z-01 | Publicado en este commit; baseline lógico C1.316 | TASK-636 / PM-01 — normalización de borradores en getPosts | Auditoría/Contexto_personal_Historico/Checkpoints_Parte_0003.txt — sección C1.369 | 930–977 | C1.368 | Este commit; SHA verificado tras publicación |

| C1.370 | IMA-EXEC-20261109-1739Z-01 | Publicado en este commit; baseline lógico C1.316 | TASK-636 / PM-01 — ajuste de expectativas del fixture getPosts | Auditoría/Contexto_personal_Historico/Checkpoints_Parte_0003.txt — sección C1.370 | 980–1018 | C1.369 | Este commit; SHA verificado tras publicación |

| C1.371 | IMA-EXEC-20261109-1739Z-01 | Publicado en este commit; baseline lógico C1.316 | TASK-636 / PM-01 — eliminación segura de proyectos | Auditoría/Contexto_personal_Historico/Checkpoints_Parte_0003.txt — sección C1.371 | 1021–1070 | C1.370 | Este commit; SHA verificado tras publicación |

| C1.372 | IMA-EXEC-20261109-1739Z-01 | Publicado en este commit; baseline lógico C1.316 | TASK-636 / PM-01 — vigencia de asignaciones docentes en lecturas | Auditoría/Contexto_personal_Historico/Checkpoints_Parte_0003.txt — sección C1.372 | 1073–1121 | C1.371 | Este commit; SHA verificado tras publicación |

| C1.373 | IMA-EXEC-20261109-1739Z-01 | Publicado en este commit; baseline lógico C1.316 | TASK-636 / PM-01 — publicación vigente de posts y materiales | Auditoría/Contexto_personal_Historico/Checkpoints_Parte_0003.txt — sección C1.373 | 1124–1171 | C1.372 | Este commit; SHA verificado tras publicación |

| C1.374 | IMA-EXEC-20261109-1739Z-01 | Publicado en este commit; baseline lógico C1.316 | TASK-636 / PM-01 — dependencia del fixture getPosts | Auditoría/Contexto_personal_Historico/Checkpoints_Parte_0003.txt — sección C1.374 | 1174–1212 | C1.373 | Este commit; SHA verificado tras publicación |

| C1.375 | IMA-EXEC-20261109-1739Z-01 | Publicado en este commit; baseline lógico C1.316 | TASK-636 / PM-01 — orden del fixture getStudyMaterials | Auditoría/Contexto_personal_Historico/Checkpoints_Parte_0003.txt — sección C1.375 | 1215–1253 | C1.374 | Este commit; SHA verificado tras publicación |

| C1.376 | IMA-EXEC-20261109-1739Z-01 | Publicado en este commit; baseline lógico C1.316 | TASK-636 / PM-01 — claims de sesión fail-closed en USER/ACADEMIC/TASK | Auditoría/Contexto_personal_Historico/Checkpoints_Parte_0003.txt — sección C1.376 | 1256–1305 | C1.375 | Este commit; SHA verificado tras publicación |

| C1.377 | IMA-EXEC-20261109-1739Z-01 | Publicado en este commit; baseline lógico C1.316 | TASK-636 / PM-01 — secreto HMAC privado sin fallback determinista | Auditoría/Contexto_personal_Historico/Checkpoints_Parte_0003.txt — sección C1.377 | 1308–1361 | C1.376 | Este commit; SHA verificado tras publicación |

| C1.378 | IMA-EXEC-20261109-1739Z-01 | Publicado en este commit; baseline lógico C1.316 | TASK-636 / PM-01 — frontera pública ACADEMIC, métricas y cierre académico | Auditoría/Contexto_personal_Historico/Checkpoints_Parte_0003.txt — sección C1.378 | 1364–1411 | C1.377 | Este commit; SHA verificado tras publicación |

| C1.379 | IMA-EXEC-20261109-1739Z-01 | Publicado en este commit; baseline lógico C1.316 | TASK-636 / PM-01 — estabilidad temporal del contrato TASK-030 | Auditoría/Contexto_personal_Historico/Checkpoints_Parte_0003.txt — sección C1.379 | 1414–1459 | C1.378 | Este commit; SHA verificado tras publicación |

| C1.380 | IMA-EXEC-20261109-1739Z-01 | Publicado en este commit; baseline lógico C1.316 | TASK-636 / PM-01 — claims estrictos y rol vigente en seis verificadores | Auditoría/Contexto_personal_Historico/Checkpoints_Parte_0003.txt — sección C1.380 | 1462–1514 | C1.379 | Este commit; SHA verificado tras publicación |

| C1.381 | IMA-EXEC-20261109-1739Z-01 | Publicado en este commit; baseline lógico C1.316 | TASK-636 / PM-01 — fixture de firma HMAC DEVELOPER | Auditoría/Contexto_personal_Historico/Checkpoints_Parte_0003.txt — sección C1.381 | 1517–1560 | C1.380 | Este commit; SHA verificado tras publicación |

| C1.382 | IMA-EXEC-20261109-1739Z-01 | Publicado en este commit; baseline lógico C1.316 | TASK-636 / PM-01 — invalidación de caché de rol vigente | Auditoría/Contexto_personal_Historico/Checkpoints_Parte_0003.txt — sección C1.382 | 1563–1608 | C1.381 | Este commit; SHA verificado tras publicación |

| C1.383 | IMA-EXEC-20261110-0042Z-01 | 7dc8e22bdd49b25ae4dbff8ad7b103a6580d1569; baseline lógico C1.316 | TASK-068 / PM-01 — resolvers fail-closed y clasificación insuficiente; CI success | Auditoría/Contexto_personal_Historico/Checkpoints_Parte_0003.txt — sección C1.383 | 1611–1631 | C1.382 | Este commit; SHA verificado tras publicación |

| C1.384 | IMA-EXEC-20261110-0042Z-01 | fd15a79c2feab0a5eb975b98b9dce0bdf3f1726c; cierre local TASK-068 | TASK-153 seleccionado — PM-01 / P0 / orden 1; PM-00 TASK-682 triage resuelto | Auditoría/Contexto_personal_Historico/Checkpoints_Parte_0003.txt — sección C1.384 | 1634–1654 | C1.383 | Este commit; SHA verificado tras publicación |

| C1.385 | IMA-EXEC-20261110-0042Z-01 | Publicado en este commit; TASK-153 en ejecución | USER scope context firmado y contrato local; CI pendiente | Auditoría/Contexto_personal_Historico/Checkpoints_Parte_0003.txt — sección C1.385 | 1657–1675 | C1.384 | Este commit; SHA a verificar tras publicación |
| C1.388 | IMA-EXEC-20261110-0122Z-01 | 03471a1e36bdfccc29668103d1d4426e4353018a; TASK-153 continúa En ejecución | TASK-153 / PM-01 / P0 — barreras Academic/Accounting y contratos locales CI aprobados | Auditoría/Contexto_personal_Historico/Checkpoints_Parte_0003.txt — sección C1.388 | 1678–1722 | C1.385 | C1.388 HEAD verificado; checkpoint y registros en commit documental siguiente |
| C1.391 | IMA-EXEC-20261110-0153Z-01 | 2a5f892ed024e0291bf89ec116df2ec43851efc4; TASK-153 sigue En ejecución | TASK-153 / PM-01 / P0 — comprobantes de pago con propietario/ámbito y archivos privados | Auditoría/Contexto_personal_Historico/Checkpoints_Parte_0003.txt — sección C1.391 | 1725–1767 | C1.388 | HEAD C1.391 verificado; documentación registrada en C1.392 |
| C1.393 | IMA-EXEC-20261110-0158Z-01 | c9b0cb6524693087731c34d36645212aec21711a; CI local success | TASK-153 / PM-01 / P0 — endpoint autenticado de lectura de comprobantes privados | Auditoría/Contexto_personal_Historico/Checkpoints_Parte_0003.txt — sección C1.393 | 1770–1807 | C1.391 | HEAD C1.393 verificado; checkpoint y registros en commit documental siguiente |
| C1.395 | IMA-EXEC-20261110-0158Z-01 | d972031231d8ebe8fbbf30e37379a4976508f49a; Department Scope Contract success | TASK-153 / PM-01 / P0 — integración de vista de comprobantes privados en portal estudiantil | Auditoría/Contexto_personal_Historico/Checkpoints_Parte_0003.txt — sección C1.395 | 1811–1847 | C1.393 | HEAD C1.395 verificado; checkpoint y registros en commit documental siguiente |
| C1.399 | IMA-EXEC-20261110-0158Z-01 | 3996c0bfacaea278647a657e0c4c0dcf6fe60464; Department Scope Contract success (runs previos de fixtures corregidos) | TASK-153 / PM-01 / P0 — no exposición de enlaces legacy y errores opacos de lectura de archivos | Auditoría/Contexto_personal_Historico/Checkpoints_Parte_0003.txt — sección C1.399 | 1851–1887 | C1.395 | HEAD C1.398 verificado; checkpoint y registros en commit documental siguiente |

| C1.400 | IMA-EXEC-20261110-0253Z-01 | Preparado para publicación; AUD-NG-382 corregido; TASK-153 sigue En ejecución | TASK-153 / PM-01 / P0 — auditoría C1.397–C1.398 y preimplementación; corrección de clasificación TASK-682 / PM-01 / P1 | Auditoría/Contexto_personal_Historico/Checkpoints_Parte_0003.txt — sección C1.400 | 1892–1948 | C1.399 | Este commit; SHA se confirma tras publicación |
| C1.401 | IMA-EXEC-20261110-0306Z-01 | HEAD de partida 48d89e6f96f9f3573647698067c4a1713435084a; commit documental C1.401 a verificar | TASK-153 / PM-01 / P0 sigue En ejecución y bloqueada por fuente propietaria; dependencias derivadas TASK-139/TASK-123; AUD-NG-383 vinculado a F11-TASK01 | Auditoría/Contexto_personal_Historico/Checkpoints_Parte_0003.txt — sección C1.401 | 1951–2005 | C1.400 | Este commit; SHA verificado tras publicación |

| C1.402 | IMA-EXEC-20261110-0436Z-01 | Publicado; TASK-153 continúa En ejecución | TASK-153 / PM-01 / P0 — T153-S01…S08; selección de T153-S01 | Auditoría/Contexto_personal_Historico/Checkpoints_Parte_0003.txt — sección C1.402 | 2008–2051 | C1.401 | 14e5dfe77fbe93759ec63b5066781967316883a8 |
| C1.403 | IMA-EXEC-20261110-0439Z-01 | T153-S01 auditada; bloqueada por decisión institucional pendiente | TASK-153 / PM-01 / P0 — T153-S01 autoridad del catálogo departamental | Auditoría/Contexto_personal_Historico/Checkpoints_Parte_0003.txt — sección C1.403 | 2054–2142 | C1.402 | Este commit; SHA a confirmar tras publicación |

| C1.404 | IMA-EXEC-20261110-0500Z-01 | TASK-694 completada como diseño documental; UNI-S01…S10 sin iniciar; TASK-153 conserva bloqueo C1.403 | PM-02 — investigación y subplan de arquitectura universal multiinstitucional P-20W | Auditoría/Contexto_personal_Historico/Checkpoints_Parte_0003.txt — sección C1.404 | 2145–2186 | C1.403 | Este commit; SHA a verificar |

| C1.405 | IMA-EXEC-20261110-0513Z-01 | TASK-695 completada como diseño documental; 24 unidades definidas; U01/U04/U07/U10/U22 candidatas a auditoría; TASK-153 conserva bloqueo | PM-02 — PLAN-IMA-001 / requisitos y aceptación UNI-U01…UNI-U24 | Auditoría/Contexto_personal_Historico/Checkpoints_Parte_0003.txt — sección C1.405 | 2190–2219 | C1.404 | Este commit; SHA a verificar |
| C1.406 | IMA-EXEC-20261110-1108Z-01 | AUD-NG-384 confirmada; TASK-696 registrada y bloqueada por dependencias PM-01; TASK-153 conserva bloqueo | UNI-U01 / auditoría runtime tenant — PM-02, sin implementación | Auditoría/Contexto_personal_Historico/Checkpoints_Parte_0003.txt — sección C1.406 | 2222–2247 | C1.405 | Este commit; SHA verificado tras publicación |
| C1.407 | IMA-EXEC-20261110-1108Z-01 | Continuidad verificada; TASK-153/T153-S01 continúa Bloqueada por falta de decisión institucional; sin cambios funcionales | PM-01 — TASK-153 / T153-S01; dictamen C1.403 vigente | Auditoría/Contexto_personal_Historico/Checkpoints_Parte_0003.txt — sección C1.407 | 2250–2263 | C1.406 | Este commit; SHA verificado tras publicación |

| C1.408 | IMA-EXEC-20261110-1132Z-01 | T153-S01 bloqueada; backlog Otros recuperado desde blob actual; ciclo F29-TASK05↔F29-TASK17 remitido a PM-00; sin cambios funcionales | PM-00 triage / PM-01 continuidad TASK-153 | Auditoría/Contexto_personal_Historico/Checkpoints_Parte_0004.txt — sección C1.408 | 58–109 | C1.407 | Este commit; SHA verificado tras publicación |

| C1.409 | IMA-EXEC-20261110-1136Z-01 | Corrección documental focalizada del rango de C1.408; sin cambios funcionales ni reauditoría | Continuidad / control documental de checkpoint | Auditoría/Contexto_personal_Historico/Checkpoints_Parte_0004.txt — sección C1.409 | 113–126 | C1.408 | Este commit; SHA verificado tras publicación |

| C1.410 | IMA-EXEC-20261110-1140Z-01 | Investigación externa y plan detallado T153-S01; subtarea permanece Bloqueada | PM-01 / TASK-153 / T153-S01 | Auditoría/Contexto_personal_Historico/Checkpoints_Parte_0004.txt — sección C1.410 | 130–180 | C1.409 | Este commit; SHA verificado tras publicación |

| C1.411 | IMA-EXEC-20261110-1150Z-01 | Regla transversal: autoridad y responsabilidad sobre antecedentes/documentos configuradas por roles desde IMA; no titulares personales estáticos | PM-01 §10.82 / N-23 | Auditoría/Contexto_personal_Historico/Checkpoints_Parte_0004.txt — sección C1.411 | 181–193 | C1.410 | Este commit; SHA verificado tras publicación |

| C1.412 | IMA-EXEC-20261110-1202Z-01 | Especificación de matriz configurable por rol/documento/ámbito; TIRL superior a Dirección con facultades legales condicionadas | N-24 / PM-01 §10.83 | Auditoría/Contexto_personal_Historico/Checkpoints_Parte_0004.txt — sección C1.412 | 194–207 | C1.411 | Este commit; SHA verificado tras publicación |
| C1.413 | IMA-EXEC-20261110-1237Z-01 | Regla: protected=false no bloquea; falta de organigrama/documentos institucionales no bloquea capacidades genéricas; T153-S01 limitado a datos/decisiones institucionales reales | PM-00 — corrección normativa / §§10.81.7, 10.82.5, 10.83 | Auditoría/Contexto_personal_Historico/Checkpoints_Parte_0004.txt — sección C1.413 | 204–240 | C1.412 | Este commit; SHA verificado tras publicación |
| C1.414 | IMA-EXEC-20261110-1245Z-02 | Triage PM-00: AUD-NG-071 y AUD-NG-069 a PM-03; orden AUD-NG-071 → AUD-NG-069; AUD-NG-006 conserva verificación transversal PM-08 | PM-00 — clasificación/dependencias | Auditoría/Contexto_personal_Historico/Checkpoints_Parte_0004.txt — sección C1.414 | 241–281 | C1.413 | Este commit; SHA verificado tras publicación |
| C1.415 | IMA-EXEC-20261110-1245Z-03 | TASK-641 reclasificada PM-00 → PM-08; evidencia AUD-NG-285 vigente por SHA; tarea permanece Pendiente | PM-00 — clasificación / PM-08 ejecución futura | Auditoría/Contexto_personal_Historico/Checkpoints_Parte_0004.txt — sección C1.415 | 282–321 | C1.414 | Este commit; SHA verificado tras publicación |
| C1.416 | IMA-EXEC-20261110-1245Z-04 | AUD-NG-007 reclasificada PM-00 → PM-03; se preserva su precedencia como dependencia de TASK-429 PM-05 | PM-00 — clasificación / PM-03 ejecución futura | Auditoría/Contexto_personal_Historico/Checkpoints_Parte_0004.txt — sección C1.416 | 322–361 | C1.415 | Este commit; SHA verificado tras publicación |
| C1.417 | IMA-EXEC-20261110-1312Z-05 | AUD-NG-096 completada mediante conciliación histórica; TASK-050 permanece Pendiente con ocho criterios abiertos | PM-00 — conciliación documental | Auditoría/Contexto_personal_Historico/Checkpoints_Parte_0004.txt — sección C1.417 | 362–402 | C1.416 | Este commit; SHA verificado tras publicación |
| C1.418 | IMA-EXEC-20261110-1312Z-06 | TASK-637 inventario reconciliado con 1.051 blobs, cero omisiones/extras y SHA/tamaños exactos | PM-00 — mantenimiento de inventario | Auditoría/Contexto_personal_Historico/Checkpoints_Parte_0004.txt — sección C1.418 | 403–441 | C1.417 | Este commit; SHA verificado tras publicación |
| C1.419 | IMA-EXEC-20261110-1340Z-07 | PM-00 triage cerrado; TASK-279→PM-03, TASK-680→PM-04; 22 encabezados sin requisitos excluidos; PM-01 habilitada | PM-00 — cierre de clasificación | Auditoría/Contexto_personal_Historico/Checkpoints_Parte_0004.txt — sección C1.419 | 442–469 | C1.418 | Este commit; SHA verificado tras publicación |
| C1.420 | IMA-EXEC-20261110-1340Z-08 | AUD-NG-128 seleccionada PM-01; autorización central explícita y test contractual añadidos; pendiente CI/Code Review | PM-01 — implementación en ejecución | Auditoría/Contexto_personal_Historico/Checkpoints_Parte_0004.txt — sección C1.420 | 470–503 | C1.419 | Este commit; SHA verificado tras publicación |
| C1.421 | IMA-EXEC-20261110-1340Z-09 | AUD-NG-128 Completada; test de autorización y propiedad de tickets ejecutado; CI sin checks reportados | PM-01 — cierre local/contractual | Auditoría/Contexto_personal_Historico/Checkpoints_Parte_0004.txt — sección C1.421 | 504–545 | C1.420 | Este commit; SHA verificado tras publicación |
| C1.422 | IMA-EXEC-20261110-1340Z-10 | AUD-NG-001 seleccionada PM-01; fetchApi prioriza token persistido y elimina identidad aportada por payload; test dinámico agregado | PM-01 — implementación en ejecución | Auditoría/Contexto_personal_Historico/Checkpoints_Parte_0004.txt — sección C1.422 | 546–576 | C1.421 | Este commit; SHA verificado tras publicación |
| C1.423 | IMA-EXEC-20261110-1340Z-11 | AUD-NG-001 Completada; test de transporte y doPost USER pasó con verificación de claims simulada; CI sin checks | PM-01 — cierre local/contractual | Auditoría/Contexto_personal_Historico/Checkpoints_Parte_0004.txt — sección C1.423 | 577–614 | C1.422 | Este commit; SHA verificado tras publicación |
| C1.424 | IMA-EXEC-20261110-1340Z-12 | AUD-NG-003 Completada; 50 escenarios de expiración y generación pasaron en entorno aislado | PM-01 — cierre local/contractual | Auditoría/Contexto_personal_Historico/Checkpoints_Parte_0004.txt — sección C1.424 | 615–631 | C1.423 | Reaplicado correctamente en C1.425 |
| C1.425 | IMA-EXEC-20261110-1340Z-13 | Restauración de integridad documental tras error de mapeo de rutas; C1.424 reaplicado correctamente | Corrección documental | Auditoría/Contexto_personal_Historico/Checkpoints_Parte_0004.txt — sección C1.425 | 632–656 | C1.424 | Este commit; SHA verificado tras publicación |
| C1.426 | IMA-EXEC-20261110-1340Z-14 | AUD-NG-004 Completada; 25 aserciones de configuración/rotación en cinco servicios y runbook coordinado | PM-01 — cierre local/documental | Auditoría/Contexto_personal_Historico/Checkpoints_Parte_0004.txt — sección C1.426 | 657–698 | C1.425 | Este commit; SHA verificado tras publicación |
| C1.427 | IMA-EXEC-20261110-1340Z-15 | TASK-153 en ejecución; ResourceOwnership y assertRecordOwnership genéricos implementados en USER; pruebas sintéticas pasaron; T153-S01 no bloquea motor | PM-01 — implementación parcial P0 | Auditoría/Contexto_personal_Historico/Checkpoints_Parte_0004.txt — sección C1.427 | 699–739 | C1.426 | Este commit; SHA verificado tras publicación |
| C1.428 | IMA-EXEC-20261110-1430Z-16 | TASK-153 en ejecución; propiedad integrada parcialmente en ACADEMIC/ACCOUNTING; restauración documental protegida; 16 pruebas sintéticas aisladas pasaron; CI pendiente | PM-01 — implementación parcial P0 | Auditoría/Contexto_personal_Historico/Checkpoints_Parte_0004.txt — sección C1.428 | 742–805 | C1.427 | Este commit; SHA verificado tras publicación |
| C1.429 | IMA-EXEC-20261110-1500Z-17 | CI Department Scope e Identity Mapping correctos; se corrige aserción obsoleta de Task-Service; rerun pendiente | PM-01 — corrección de contrato CI P0 | Auditoría/Contexto_personal_Historico/Checkpoints_Parte_0004.txt — sección C1.429 | 808–833 | C1.428 | Este commit; SHA verificado tras publicación |
| C1.430 | IMA-AUDIT-20261110-1430Z | TASK-153 en ejecución; CI Task-Service Security y Backup/Restore correctos en HEAD d0d01c8d; checkpoint de continuidad | PM-01 — verificación focalizada P0 | Auditoría/Contexto_personal_Historico/Checkpoints_Parte_0004.txt — sección C1.430 | 836–882 | C1.429 | 2a5bf4b697fdec153f4a5dd1e2cce30b4ccef05c |
| C1.431 | IMA-GOV-20261110-1553Z-01 | Adopción NDASC v1.0; simplificación normativa y control proporcional | Gobernanza operativa IMA | Auditoría/Contexto_personal_Historico/Checkpoints_Parte_0004.txt — sección C1.431 | 887–928 | C1.430 | 531a684970c57fb567f17a8a45c623d5154a4edf |

| C1.432 | IMA-GOV-20261110-1605Z-01 | Publicado | Consolidación normativa única | Auditoría/Contexto_personal_Historico/Checkpoints_Parte_0004.txt — sección C1.432 | 932–970 | C1.431 | `eef45b7557fdde1e55a35760d8d66a6335b8da1e` |

| C1.433 | IMA-GOV-20261110-1614Z-01 | Renombre del archivo maestro | Gobierno documental | Auditoría/Contexto_personal_Historico/Checkpoints_Parte_0004.txt — sección C1.433 | 970–984 | C1.432 | Commit de renombre; SHA verificado tras publicación |

| C1.434 | IMA-EXEC-20261110-1621Z-01 | Corrección IDOR de comentarios/versiones en Task Service; TASK-153 continúa En ejecución | PM-01 — TASK-153 / seguridad de entregas | Auditoría/Contexto_personal_Historico/Checkpoints_Parte_0004.txt — sección C1.434 | 986–1028 | C1.433 | Commit de checkpoint; SHA verificado tras publicación |

| C1.435 | IMA-GOV-20261110-1632Z-01 | NDASC v1.2: pruebas locales obligatorias antes de Completada; casos que requieren deployment al registro beta | Gobierno normativo / verificación | Auditoría/Contexto_personal_Historico/Checkpoints_Parte_0004.txt — sección C1.435 | 1028–1064 | C1.434 | Commit de checkpoint; SHA verificado tras publicación |

| C1.436 | IMA-EXEC-20261110-1658Z-01 | AUD-NG-386 mitigada parcialmente; TASK-153 En ejecución; pruebas locales NOT RUN | PM-01 — TASK-153 / EXAM: autenticación de listados | Auditoría/Contexto_personal_Historico/Checkpoints_Parte_0004.txt — sección C1.436 | 1066–1108 | C1.435 | b0e8842acb1d04cdaba175b524065b09fa9b8886 + commit documental de checkpoint y actualización CI |

| C1.437 | IMA-EXEC-20261110-1705Z-01 | EXAM: listado docente limitado por identidad firmada; TASK-153 En ejecución; CI PASS (run 42859943846) | PM-01 — TASK-153 / AUD-NG-386 | Auditoría/Contexto_personal_Historico/Checkpoints_Parte_0004.txt — sección C1.437 | 1111–1151 | C1.436 | 8f1063028c6b4d53cdbb62038b100bb9d651d609 + commit documental y actualización CI |

| C1.438 | IMA-EXEC-20261110-1715Z-01 | EXAM: ResourceOwnership en listados y actividad docente; CI PASS; TASK-153 En ejecución | PM-01 — TASK-153 / AUD-NG-386 | Auditoría/Contexto_personal_Historico/Checkpoints_Parte_0004.txt — sección C1.438 | 1156–1204 | C1.437 | 0b23710c0b732fcf37f7c39bf2e6e82a2b608789 + commits de implementación y correcciones de contratos |

| C1.439 | IMA-EXEC-20261110-1740Z-01 | EXAM: lecturas estudiante/tutor con identidad, relación y propiedad; local PASS; CI PASS | PM-01 — TASK-153 / AUD-NG-386 | Auditoría/Contexto_personal_Historico/Checkpoints_Parte_0004.txt — sección C1.439 | 1209–1257 | C1.438 | ac9e65c18cdb7a33a9776d0c232d7429ec2ab978 |

| C1.440 | IMA-EXEC-20261110-1750Z-01 | EXAM: submitExam ligado a identidad, ámbito, propiedad e intentos; local PASS; CI PASS | PM-01 — TASK-153 / AUD-NG-386 | Auditoría/Contexto_personal_Historico/Checkpoints_Parte_0004.txt — sección C1.440 | 1262–1304 | C1.439 | d640ddbab2b247dd4736f0332b8f7a75ca096e8b |

| C1.441 | IMA-EXEC-20261110-1756Z-01 | EXAM: createExam con ownership departamental y rollback compensatorio; local PASS; CI PASS | PM-01 — TASK-153 / AUD-NG-386 | Auditoría/Contexto_personal_Historico/Checkpoints_Parte_0004.txt — sección C1.441 | 1307–1350 | C1.440 | b497635b5cb6ea742361bbd847571c75a961c1a3 |

| C1.442 | IMA-EXEC-20261110-1808Z-01 | Corrección publicada; pruebas locales NOT RUN; AUD-NG-386 abierto | TASK-153 / PM-01 / P0 — eliminación de overrides legacy en mutaciones EXAM | Auditoría/Contexto_personal_Historico/Checkpoints_Parte_0004.txt — sección C1.442 | 1344–1385 | C1.441 | 798553ae147818659d176864b299c608808f9e5d + registros C1.442 |

| C1.443 | IMA-EXEC-20261110-TASK153-01 | TASK listados/entregas/archivos con ownership; DEVELOPER sin ABAC departamental; CI TASK/EXAM PASS; local NOT RUN | PM-01 — TASK-153 / AUD-NG-385/386 | Auditoría/Contexto_personal_Historico/Checkpoints_Parte_0004.txt — sección C1.443 | 1387–1418 | C1.442 | bf0c17fb261e59d8c5c68293c196ac6ef90a30c7 + registros C1.443 |

| C1.444 | IMA-EXEC-20261110-1815Z-01 | TASK-153: guardas de ownership en accesos directos TASK; beta/despliegue no bloquea desarrollo | PM-01 — TASK-153 / TASK Service | Auditoría/Contexto_personal_Historico/Checkpoints_Parte_0004.txt — sección C1.444 | 1420–1454 | C1.442 (con avance C1.443 en backlog) | 1558e5c99b4fee58474a849bc8087d9c16914028 + commits documentales |

| C1.445 | IMA-EXEC-20261110-1825Z-02 | TASK-153: aulas con ownership; lectura legacy restringida; folderId legacy deshabilitado; mutaciones admin con guard; Node local NOT RUN | PM-01 — TASK-153 / TASK Service | Auditoría/Contexto_personal_Historico/Checkpoints_Parte_0004.txt — sección C1.445 | 1458–1498 | C1.444 | e7d036abad8ef6cecc19252057b2f4888a29dbd2 + 6024d318162fe1f758f194ac00c1f23fea803076 + 176c5b08974a8a44f1314ea8e65f3ca371541e77 + 742fe9576062108c857cfb3e00fd0de59b5ef4a4 + 2d5526565a8332cbbed8e80c92ab5427b2deb7cb + f71bebc496ffb6487cdefc3701d1f24043649bd3 + dee57ca34414c591f4d8bb6342c2567a9bdb8a33 + 87dbe7ecf4b3eaab69fc473d7a06df966f86b24c + commits documentales |

| C1.446 | IMA-EXEC-20261110-C1.446-02 | TASK aulas/contenido/legacy + ACADEMIC self/guardian ownership; Department Scope/Task CI PASS; local NOT RUN | PM-01 — TASK-153 / AUD-NG-385/386 | Auditoría/Contexto_personal_Historico/Checkpoints_Parte_0004.txt — sección C1.446 | 1500–1532 | C1.445 | 19a64b518ec4eee24b6f0c25b775f43e0058b90f + registros C1.446 |

| C1.447 | IMA-EXEC-20261110-1825Z-02 | ACADEMIC: SELF/GUARDIAN ownership, relaciones, informes PII, duplicados y cola de admisiones; Node local NOT RUN | PM-01 — TASK-153 / AUD-NG-386 | Auditoría/Contexto_personal_Historico/Checkpoints_Parte_0004.txt — sección C1.447 | 1534–1579 | C1.446 | 3d3d0015cbdd67a715a9fe60385fd82664e2f34d; b113a6f88b338c63f04ecc3531cd9efa85b8b257; 42ca04bad4209760bb883a20b0286a59b8054df9; 5874fa64f615f1dd1d691f60aea3e0b9ee9417b6; ea178e9ff2b70da97573a32a47bac650ef415fa0; 19a64b518ec4eee24b6f0c25b775f43e0058b90f; c77088ad8abd721453ebd3b3b92700ff9575cc86; df644f9a87838450a74f168e310ca423992b2be8; 9b7e619252f8c3489ea05980b58e570d1942148c; 1df0394c1953e19a7e67a8331aa4eebae8c795d2; 2ae88b8fca460911ed2e8f555b3cca9bf6a4a6ce; 589873ae6659c735c4a9ce8fd7ca61aba5224e77 + commits documentales |

| C1.448 | IMA-EXEC-20261110-1825Z-02 | ACADEMIC: conversión de admisiones bloquea reuso de expediente coincidente sin ownership del mismo departamento; contrato dinámico aislado PASS; suite Node/CI NOT RUN | PM-01 — TASK-153 / ACADEMIC / AUD-NG-386 | Auditoría/Contexto_personal_Historico/Checkpoints_Parte_0004.txt — sección C1.448 | 1580–1625 | C1.447 | 55e6c109f7870cb02358c8c20e2783140f42229e; 4a3df02770c3e96d140ae8b5c067d5ef23c3249a; e8e15cee160b584da43ecc22d38feff7596c72d5; 9100ba12deef98e3bc05be1a1e034f0fb85542e1; b3f7cf57e44f5adb01876ac5d9e14d5aa97c65b5; ca1b230fa8ff1614a55348e4fece00255e973535; 82314c4ac6f7c29ffcc6d25e22bb5c9e5f178308 |

| C1.449 | IMA-EXEC-20261110-1825Z-02 | ACADEMIC: compensación LIFO de escritura parcial en conversión; rollback local aislado PASS; suite Node/CI NOT RUN | PM-01 — TASK-153 / ACADEMIC / AUD-NG-386 | Auditoría/Contexto_personal_Historico/Checkpoints_Parte_0004.txt — sección C1.449 | 1628–1669 | C1.448 | f494f0bde9afa83ed11c5b5e1bd28729e81a4260; b20fa1382461a1f1d4b7bcc8bb22407df0f8b6b2; c339188cd5600c9f54460d430ffc6d18b95311ad; 151f5eeaeea7b964199f69378f42bcd5e358d509; fc6a0e390a592a6ea39ec75ef889374ab8c4e384; 15a495d7b15706ffb65252d66df250550f78ccec |

| C1.450 | IMA-EXEC-20261110-1825Z-02 | ACADEMIC: idempotencia de reintentos; validadores de matrícula/movimiento PASS aislado; suite Node/CI NOT RUN | PM-01 — TASK-153 / ACADEMIC / AUD-NG-386 | Auditoría/Contexto_personal_Historico/Checkpoints_Parte_0004.txt — sección C1.450 | 1672–1711 | C1.449 | 0f4262aaff538d0cc908ad196944016f4b9bb3aa; 7be60a51941b41dad15fb7e79fbbe6114bddc8eb; 905c5c5c5e5ec107c1cb0f7c1127025a4a8507a4; 5f6663f4ba7f683822f5fa616cd66f98bc56032a; 37ec59ead69a84200d4c3e460cadf45aa75680c |
| C1.451 | IMA-EXEC-20261110-1825Z-02 | ACADEMIC: retorno idempotente valida expediente, cuenta, matrícula y movimiento; regresión dinámica aislada PASS; suite Node/CI NOT RUN | PM-01 — TASK-153 / ACADEMIC / AUD-NG-386 | Auditoría/Contexto_personal_Historico/Checkpoints_Parte_0004.txt — sección C1.451 | 1714–1755 | C1.450 | f61d2074b8910b9d8fdefcc55fa0133e38d66ad7; fa4db0612f59552633037bc20332d9e5bf6abf34; 021484b6d79dcd8db9f8d86ad57ab3fb1ddf3eab; ca4b0f2ace7b33ecd1b761441e7be4cdb8d07451; 8a0ef544ba763540d01625a0d284b706e0c31b2d; 071684049c2ea626880e2f57043af62277d6810c; 76d219a6a554ddf491e387b861a5245aef5ce862 |
| C1.452 | IMA-EXEC-20261110-1825Z-02 | ACADEMIC: cargos de admisión con referencia exacta y control de metadatos internos; rollback/idempotencia aislados PASS; suite Node/CI NOT RUN | PM-01 — TASK-153 / ACADEMIC / AUD-NG-386 | Auditoría/Contexto_personal_Historico/Checkpoints_Parte_0004.txt — sección C1.452 | 1759–1815 | C1.451 | 95a6b4d791fb9051a57482f3f9b93efa286760c2; 2aa6dcdaec0315e9d16a1383051bf0d11fa11bfa; 4dae41b25cf393563d50768b194e9fc20c0ab762; 24a45ddb5d915a028352e8cb2bbfd05455a4f145; 086d98eb4605a701ce7c1f99d4958b3f10b1037a; 2745da1cc659c3cffce1dd8b51124d059a42a158; 6d68e0d3fde476eab33254943d6846c2aa319b18; 55725a71fca0d2b38a430e208ff2a60250707ede; b0e5cdc0f3f8a68f9db84cedd64dfbd446fc42c5; 31053d3eaa9c4df36a3f549ca0818fe55fe6f0dd; dcd43d05621c90f6afc7f9cbd2d0f6d7a645205b; 424af6b66931d1bc1f50459d59a468a4596ddd2a; deb974e07ceed041225e6373d32495681c472633; 1ed0effebdce56c03756178e098f38bb22637204; 44656485003944569311f74bf5a18c894e5a1598; ebb8a65a200fd17bb52aa231461951dcacd61573; f905c7cd0e1ea3488b633fdd28b1991ae22c43ac |
| C1.453 | IMA-EXEC-20261110-1825Z-02 | ACADEMIC: logs insuficientes para atribuir cargos históricos; sin backfill; detectado TDZ en referencia de cargo para próxima corrección | PM-01 — TASK-153 / ACADEMIC / AUD-NG-386 | Auditoría/Contexto_personal_Historico/Checkpoints_Parte_0004.txt — sección C1.453 | 1819–1851 | C1.452 | 6e147bffdea9c8b747795e1032b6dfe55d4e514e; e61718c44712254bc9ab372d3b268481221a076b; 08581a3b19bb3b97b684a8a2a0631fa4929bb095 |
| C1.454 | IMA-EXEC-20261110-1825Z-02 | ACADEMIC: referencia cargo derivada después de matrícula; CargoID propagado y regresión ampliada; Node/sintaxis NOT RUN | PM-01 — TASK-153 / ACADEMIC / AUD-NG-386 | Auditoría/Contexto_personal_Historico/Checkpoints_Parte_0004.txt — sección C1.454 | 1854–1894 | C1.453 | 2aec68a829fce262d3f7bc389166349a1bbb2e26; af3fc6471fc9e38eadfc5ac76af1e73a6ba5e159; 03a96a5e20ff0d0f0971fba1339cfdd2a07866a1; b41d48b4a0646a1fbcca9beb7e3e12bb9cd213f2; 5d7b49724c44b8718785afbfd83cbadeeda31bc5 |
| C1.455 | IMA-EXEC-20261110-1825Z-02 | ACADEMIC: conversión de admisión, CargoID y contención de ScriptLock; contratos locales y sintaxis PASS (GitHub Actions aislado) | PM-01 — TASK-153 / ACADEMIC / AUD-NG-386 | Auditoría/Contexto_personal_Historico/Checkpoints_Parte_0004.txt — sección C1.455 | 1897–1931 | C1.454 | 3bb1d3b7dfc9c4d0259d6a124f353d46b0f38a13; 91c17ba2bddc7cf4e9d35316b877ae7034898907; ad44dde863065b2a2dc54580ee5a393f43d4570e; d483a35509e20e1f4a26186f42941be1d7d5ba6f; 8b86fda9030134b6b8bd75958ff6be19412c5c6c; 3c5ffb0c5411e6122f7a85e881ac18677f073988; 0b00730786b172c596c3186ecabbf89b30906dbb |
| C1.456 | IMA-EXEC-20261110-1825Z-02 | ACADEMIC: agenda y resultados de entrevistas con ownership, lock y pruebas locales PASS | PM-01 — TASK-153 / ACADEMIC / AUD-NG-386 | Auditoría/Contexto_personal_Historico/Checkpoints_Parte_0004.txt — sección C1.456 | 1934–1968 | C1.455 | eb0bc0f6d8dc44d07d9ba79778194fd3cf223ad2; 0901d2b0e4d129123461a6219cdbb138cbc9e7a2; dc993865cbb07266e138d4702bd1c9c638c379e4; 58ca1f6ea7cc436ffcc9b62bab59e7d302f69ba7; 35323eb433a69ca6efe199924dbe1ad2d4ff63a4; 1c7d127be25d19508b2a1dd98335d8df8abe1669; a85ae38d530d934834afe1ef00ef52391f3fc413 |
| C1.457 | IMA-EXEC-20261110-1825Z-02 | ACADEMIC: evaluaciones de admisión con lock e identidad verificada; contratos y sintaxis PASS | PM-01 — TASK-153 / ACADEMIC / AUD-NG-386 | Auditoría/Contexto_personal_Historico/Checkpoints_Parte_0004.txt — sección C1.457 | 1971–2004 | C1.456 | f198730c1d8a37cc35a44a30c531b26ca6a5caaf; 9b0a53bfec2f984ce665c5ea9d0d282b7f207700; 47ab35364a76a3fd8b667f95597d204558448745; 52cc33a333dd9e38ce1fc66078a2b2277b9ca792; e0a76bf4a3d27908e45a68f2de6b1e3fc8e4bb5e; 14a280da2f96a5c1a4c1d75ecd6868dfbaff56ff |
| C1.458 | IMA-EXEC-20261110-1825Z-02 | ACADEMIC: resolución de duplicados con rol verificado y acentos, ownership interdepartamental, idempotencia y ScriptLock; contratos y sintaxis PASS | PM-01 — TASK-153 / ACADEMIC / AUD-NG-386 | Auditoría/Contexto_personal_Historico/Checkpoints_Parte_0004.txt — sección C1.458 | 2007–2050 | C1.457 | cc60ed6e50cf411ac65490ef8cca6ca9542eafa0; 89ca3edfc6cff41105c03fccc2d6a83188b2026c; 25bea9e9ed69460c1b2bf21ab2bf951f4a837ba5; 07b22d3180461320052eda9958d677acf7355805; d2b818e2536f8fcad04317ba687b9e5392c44814; 7648d34076df4b10545b3c6ce4e2cc4229fff5f3; 94ec9a3294ff276bfce88941659a1c3f52a030e2; 3d470dd130dc6e73ba2fe802cf37fa23921000c4; 9d7f7218d8fd01e3ae44396c9fd61098abf31b5c; c21346a964d767f141990fe9f36ee75896590fb3; a9b165970cd4921d8a4b9c67c1e7e90c0524c1b8 |
| C1.459 | IMA-EXEC-20261110-1825Z-02 | ACADEMIC: reapertura con rol gestor, ownership bajo lock, estado único y trazabilidad canónica; contratos y sintaxis PASS | PM-01 — TASK-153 / ACADEMIC / AUD-NG-386 | `Auditoría/Contexto_personal_Historico/Checkpoints_Parte_0004.txt` — sección C1.459 | 2054–2090 | C1.458 | dfab2d1486dd7599e9ccadb890ff71003632c669; 5ae37e4a1aea2b779df2d14b42274719c9b2eccc; 94ec9a3294ff276bfce88941659a1c3f52a030e2; 7648d34076df4b10545b3c6ce4e2cc4229fff5f3; 822c8118cb94518901d7d8a642215da09374e4; b619caad4d9b04f55796d63b37c82c7c719fc4d4; 2e3501fbf0b2617a134560e28d63b5203d52d79e; 52cdc013fd167b1edd8e3d176b6b1e428bdbfe19 |
| C1.460 | IMA-EXEC-20261110-1825Z-02 | ACADEMIC: alta a lista de espera con lock, idempotencia, ownership y compensación; contratos y sintaxis PASS | PM-01 — TASK-153 / ACADEMIC / AUD-NG-386 | `Auditoría/Contexto_personal_Historico/Checkpoints_Parte_0005.txt` — sección C1.460 | 10–46 | C1.459 | 6009994e5df3fc45ddbadad9f782468dc65ba100; 314e07b4fa5cfeae005d69b1b417d66a44803851; ecec8f1c7de75cbe7e4d92765fcae4556f486c4d; 82f849a1ab9dae059ed0158454bfbc92e5ceed48; 482df85ea0ab152e5d71c5ae5e34b93b3939766c; 5085910c32bb45c84c9e19851273c687018bcca8 |
| C1.461 | IMA-EXEC-20261110-1825Z-02 | ACADEMIC: oferta de plaza con ownership previo, lock, idempotencia y estados válidos; contratos y sintaxis PASS | PM-01 — TASK-153 / ACADEMIC / AUD-NG-386 | `Auditoría/Contexto_personal_Historico/Checkpoints_Parte_0005.txt` — sección C1.461 | 50–84 | C1.460 | 7f3153e036d17ec6d070a67325b447f9c034422d; 239e360700728569e4a000ca542e837be77b1c25; 87d74fbc4df20cca0ef9e650251215a28d30d044; 6eec4411a7bfe8763c22b3084aeb56def6702499; 942601763749c79a79df5d07fb843ee378f404d4; e7e96d2bcbe2a30ed12425ce2a21e2bc43f3ce5b |
| C1.462 | IMA-EXEC-20261110-1825Z-02 | USER: creación de solicitudes de firma avanzada; ACADEMIC: reordenamiento de lista de espera. Dos subalcances concurrentes C1.462 preservados e indexados | PM-01 — TASK-153 / USER + ACADEMIC / AUD-NG-386 | `Auditoría/Contexto_personal_Historico/Checkpoints_Parte_0005.txt` — secciones C1.462 USER y ACADEMIC | 87–123 y 126–162 | C1.461 | bbd2d1389234233f9d75c8ddd0fb9697e8c5a434; 58d2a03f1d7f0c83e52e88c47f821c8d39256871; 21fe586777cc6394effcdcbc639f8d5da1fa1374; ce08eabc4821f7856c40be16b1bd7620891c75ac; 647c50e9a96c70d80809be56600716fac37b75f7; be34332567dd0b93e101d260c7def03cbb95ea52; c1dfe1420157c59099ef1f16f3f0962a4d3afde9; 1cff06fd74a217763b531917044c3086584d5029; 9745e7f26d5ce88caefb45934c775561f62d7a67; dec05145a8777af4ef5182617d06381c9f2d0f45 |
| C1.463 | IMA-EXEC-20261110-1825Z-02 | USER: consulta de estado de firma avanzada protegida; callbacks de cliente rechazados y `Completada` no equivale a validez criptográfica; contratos y sintaxis PASS | PM-01 — TASK-153 / USER / AUD-NG-386 | `Auditoría/Contexto_personal_Historico/Checkpoints_Parte_0005.txt` — sección C1.463 | 165–202 | C1.462 | e7e8588402d2e462b7a4e70161309f52d46ae70b; dafdbbb0526ee550d7d4ca462340e0351ee6742a; 31cc21b9572c47e792d0b3188237aeaaccd480a6; 4aa2a9a251e53ec0044956f66e7a32263ca86a98; d34448b7d5319f615b9c026dc0e006df520a08c; 4140d4b2678764b75da772fa89a0528a0d4f34f0; 476dd4e8c4ea4ec993c69937d5915565416dd5b7; 219f5948dd0abbf96f532d7a32795e05bcb15dea |
| C1.464 | IMA-EXEC-20261110-1825Z-02 | USER: conformidad manual con identidad del firmante, ownership, canonicalización, idempotencia y lock; contratos/sintaxis PASS | PM-01 — TASK-153 / USER / AUD-NG-386 | `Auditoría/Contexto_personal_Historico/Checkpoints_Parte_0005.txt` — sección C1.464 | 204–242 | C1.463 | 05f8498cb50efcffe9b6cf05b51633309a40865a; 8d67aa316540ebd21aa03f6a47fda31e37d409e7; 9677e133f17017bd418d5bdb33b0fcf4723604ff; f23d7b6190f52aa05d82d3c9d096ce994eebce96; ad01088298c6d9371ca2bb6cd7d1974f15857f05 |
| C1.465 | IMA-EXEC-20261110-1825Z-02 | USER: certificado de auditoría con identidad verificada, ownership previo a lectura, aislamiento solicitud/documento y evidencia no inventada; contratos/sintaxis locales PASS | PM-01 — TASK-153 / USER / AUD-NG-386 | Auditoría/Contexto_personal_Historico/Checkpoints_Parte_0005.txt — sección C1.465 | 244–277 | C1.464 | 55291717e395eaac04078ebfcc341f2229c111f5; 41a51fddaa9edcaf21c869c5d2e4724191132899; 634c325886da10f0bbe21a50570f429b0130441d; 55bf4884a03e21f092eb735b2b4a1340438fc916; 20241f5d76e0a2baea49737a3bd218a445782d20; cd565ca6a5ef8e603e867583fd3b36962cfe78c6 |
| C1.466 | IMA-EXEC-20261110-1825Z-02 | USER: solicitudes de firma avanzada calculan SHA-256 desde bytes Drive tras ownership; rechazan hash discordante y archivo no disponible; contrato aislado local PASS | PM-01 — TASK-153 / USER / AUD-NG-386 | Auditoría/Contexto_personal_Historico/Checkpoints_Parte_0005.txt — sección C1.466 | 278–318 | C1.465 | 647b2c71047a2a9c6a7ed8dc54c4e3395c6348b6; e5586d9baaade2cba04709c821b70ebeadd7b765; 73b15105f690c11d83288d9ee7012b96323a0513; 35a4b071aeb1fdcef1daa773303ac69fd0cd0911; 86fa72bac881fdd8c2c24971f3c8e9de867b75eb; 44bc16700c365d13914bbb2543e614a68574f47f |
| C1.467 | IMA-EXEC-20261110-1825Z-02 | Corrección de fixture: archivo fuente ausente usa documento canónico válido y DriveFileID vacío; repetición CI pendiente | PM-01 — TASK-153 / USER / AUD-NG-386 | Auditoría/Contexto_personal_Historico/Checkpoints_Parte_0005.txt — sección C1.467 | 320–339 | C1.466 | 5eb79500c4f7a64330b1418728e87d242addcfde; 5175f546ceaa7666a7c7f53df0e44ce7ceac6447; 9cb3a6449165e55e97cb653d710e543e41013f60; 5d5ebc9e197be4e918c524681ad244323af0732c |
| C1.468 | IMA-EXEC-20261110-1825Z-02 | CI Department Scope Contract run 42901121407 SUCCESS; USER signature ownership contract y sintaxis de servicios PASS | PM-01 — TASK-153 / USER / AUD-NG-386 | Auditoría/Contexto_personal_Historico/Checkpoints_Parte_0005.txt — sección C1.468 | 341–359 | C1.467 | 6f4bd2c556eeb3b8f310a3db3bb8c79942f89c97; ce535534c39fa2f4a9a1c9be068f03b775303403; d76837da8b9260dec24fa5f20e58183b4d984724 |
| C1.469 | IMA-EXEC-20261110-1825Z-02 | USER: destinatario de firma avanzada verificado contra cuenta activa y ámbito institucional/relación SELF-GUARDIAN; perfil canónico; CI Department Scope, Identity Mapping y Task-Service PASS | PM-01 — TASK-153 / USER / AUD-NG-386 | Auditoría/Contexto_personal_Historico/Checkpoints_Parte_0005.txt — sección C1.469 | 361–405 | C1.468 | 75e28fbc017bc3167689dc8386d910b8a06706e8; 7e06d3a0c8eebf5301842ed29b1f00f52f1e01da |
| C1.470 | IMA-EXEC-20261110-1825Z-02 | ACADEMIC: contrato conductual de conversión, ownership de solicitud/expediente, rollback integral, fallo de compensación explícito y reentrada/lock; local y CI PASS | PM-01 — TASK-153 / ACADEMIC / AUD-NG-386 | Auditoría/Contexto_personal_Historico/Checkpoints_Parte_0005.txt — sección C1.470 | 407–450 | C1.469 | 88b3462e969ec427f5b31fbcb7894c1fbbc49dff; 08813b2dbcddbf2df23e2ed1d008052f425c252b |
| C1.471 | IMA-EXEC-20261110-1825Z-02 | ACADEMIC: aislamiento de evaluaciones/entrevistas, revalidación de ownership e identidad/ámbito bajo lock; local y CI PASS | PM-01 — TASK-153 / ACADEMIC / AUD-NG-386 | Auditoría/Contexto_personal_Historico/Checkpoints_Parte_0005.txt — sección C1.471 | 452–493 | C1.470 | 06d818ee81124622ab4e394d5d30d3fec463b931; 9d23739677c37732195528c961777bf20ff3df3a; CI 42905094147 |

| C1.472 | IMA-EXEC-20261110-1825Z-02 | USER: certificado de auditoría con prevalidación de ownership, no divulgación de referencias, omisión de IP y semántica no probatoria; local y CI PASS | PM-01 — TASK-153 / USER / AUD-NG-386 | Auditoría/Contexto_personal_Historico/Checkpoints_Parte_0005.txt — sección C1.472 | 494–544 | C1.471 | 836154141d9098882ca1e7046e9b94b6f89c2498; 0ff23efa8170a502c4044cb03ed4072e91cba196; 2fa2c4068ebf296a2bc050c914165496ee9c1732; 811d7b54a1701e5dcb80828ba807c252228f508c; CI 42907619042; CI 42908073626 |
